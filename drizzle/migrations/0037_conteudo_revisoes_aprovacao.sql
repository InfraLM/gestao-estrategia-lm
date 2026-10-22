CREATE TABLE public.conteudo_revisoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), documento text NOT NULL CHECK(documento IN ('diagnostico','estrategia')), numero integer NOT NULL CHECK(numero>0), titulo text NOT NULL,
 fonte text, fonte_submissao_id uuid REFERENCES public.base_submissoes(id), resumo_mudancas text,
 status text NOT NULL DEFAULT 'rascunho' CHECK(status IN ('rascunho','publicada','substituida')), snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(snapshot)='object'),
 criado_por uuid, criado_em timestamptz NOT NULL DEFAULT now(), publicado_por uuid, publicado_por_nome text, publicado_em timestamptz, substituido_em timestamptz, UNIQUE(documento,numero)
);
GRANT SELECT ON public.conteudo_revisoes TO authenticated;
GRANT ALL ON public.conteudo_revisoes TO service_role;
ALTER TABLE public.conteudo_revisoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY revisoes_ler ON public.conteudo_revisoes FOR SELECT TO authenticated USING (
 (status='rascunho' AND (public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()))) OR
 (status<>'rascunho' AND public.acesso_modulo(auth.uid(),'estrategia',false))
);
CREATE UNIQUE INDEX conteudo_um_rascunho ON public.conteudo_revisoes(documento) WHERE status='rascunho';
CREATE UNIQUE INDEX conteudo_uma_publicada ON public.conteudo_revisoes(documento) WHERE status='publicada';
CREATE TABLE public.conteudo_revisao_itens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revisao_id uuid NOT NULL REFERENCES public.conteudo_revisoes(id) ON DELETE CASCADE, chave text NOT NULL, secao text NOT NULL,
 valor_anterior jsonb NOT NULL, valor_proposto jsonb NOT NULL, valor_final jsonb, justificativa text, referencias text,
 origem text NOT NULL DEFAULT 'alinhamento_derivado' CHECK(origem IN ('documento_v2','alinhamento_derivado')), observacao text,
 status text NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','aprovado','aprovado_ajuste','rejeitado')), motivo_rejeicao text,
 decidido_por uuid, decidido_por_nome text, decidido_em timestamptz, UNIQUE(revisao_id,chave),
 CHECK(status<>'rejeitado' OR nullif(btrim(motivo_rejeicao),'') IS NOT NULL), CHECK(status<>'aprovado_ajuste' OR valor_final IS NOT NULL)
);
GRANT SELECT ON public.conteudo_revisao_itens TO authenticated;
GRANT ALL ON public.conteudo_revisao_itens TO service_role;
ALTER TABLE public.conteudo_revisao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY itens_ler ON public.conteudo_revisao_itens FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.conteudo_revisoes r WHERE r.id=revisao_id));
CREATE FUNCTION public.revisao_chave_documento(_chave text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT CASE WHEN _chave LIKE 'diag.%' THEN 'diagnostico' WHEN _chave LIKE 'estr.%' AND _chave NOT ILIKE '%okr%' THEN 'estrategia' END
$$;
CREATE FUNCTION public.revisao_guard_item() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF public.revisao_chave_documento(NEW.chave) IS DISTINCT FROM (SELECT documento FROM public.conteudo_revisoes WHERE id=NEW.revisao_id) THEN RAISE EXCEPTION 'Chave fora do documento; BSC e OKRs não participam'; END IF;
 IF (SELECT status FROM public.conteudo_revisoes WHERE id=NEW.revisao_id)<>'rascunho' THEN RAISE EXCEPTION 'Revisão publicada é imutável'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER revisao_item_guard BEFORE INSERT OR UPDATE ON public.conteudo_revisao_itens FOR EACH ROW EXECUTE FUNCTION public.revisao_guard_item();
CREATE FUNCTION public.revisao_guard_conteudo() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF current_user IN ('authenticated','anon') AND (public.revisao_chave_documento(CASE WHEN TG_OP='DELETE' THEN OLD.chave ELSE NEW.chave END) IS NOT NULL OR (TG_OP='UPDATE' AND public.revisao_chave_documento(OLD.chave) IS NOT NULL)) THEN
 RAISE EXCEPTION 'Envie uma sugestão: somente a publicação de revisão altera este conteúdo'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER conteudo_publicacao_guard BEFORE INSERT OR UPDATE OR DELETE ON public.conteudo_editavel FOR EACH ROW EXECUTE FUNCTION public.revisao_guard_conteudo();
CREATE FUNCTION public.revisao_permissoes() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('governanca',public.mt_is_governanca(auth.uid()),'ceo',public.proj_eh_ceo(auth.uid()))
$$;
CREATE FUNCTION public.revisao_sugerir(_chave text,_valor jsonb,_secao text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d text; r public.conteudo_revisoes; base public.conteudo_revisoes; i uuid;
BEGIN
 d:=public.revisao_chave_documento(_chave);
 IF auth.uid() IS NULL OR d IS NULL OR NOT public.acesso_modulo(auth.uid(),'estrategia',true) OR NOT (public.mt_is_governanca(auth.uid()) OR public.editor_modulo(auth.uid(),'estrategia') OR public.has_role(auth.uid(),'pmo')) THEN RAISE EXCEPTION 'Sem permissão para sugerir'; END IF;
 IF _valor IS NULL THEN RAISE EXCEPTION 'Conteúdo obrigatório'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('conteudo:'||d));
 SELECT * INTO r FROM public.conteudo_revisoes WHERE documento=d AND status='rascunho' FOR UPDATE;
 IF NOT FOUND THEN
  SELECT * INTO base FROM public.conteudo_revisoes WHERE documento=d AND status='publicada';
  IF NOT FOUND THEN RAISE EXCEPTION 'Baseline não inicializada'; END IF;
  INSERT INTO public.conteudo_revisoes(documento,numero,titulo,snapshot,criado_por) SELECT d,coalesce(max(numero),0)+1,'Rev. '||(coalesce(max(numero),0)+1)||' — rascunho',base.snapshot,auth.uid() FROM public.conteudo_revisoes WHERE documento=d RETURNING * INTO r;
 END IF;
 IF NOT r.snapshot ? _chave THEN RAISE EXCEPTION 'Chave ausente da baseline'; END IF;
 INSERT INTO public.conteudo_revisao_itens(revisao_id,chave,secao,valor_anterior,valor_proposto,observacao) VALUES(r.id,_chave,_secao,r.snapshot->_chave,_valor,'Edição manual sugerida')
 ON CONFLICT(revisao_id,chave) DO UPDATE SET valor_proposto=excluded.valor_proposto,valor_final=NULL,status='pendente',motivo_rejeicao=NULL,decidido_por=NULL,decidido_por_nome=NULL,decidido_em=NULL RETURNING id INTO i;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('conteudo_revisao_itens',i::text,'sugestao',(r.snapshot->_chave)::text,_valor::text,auth.uid()); RETURN i;
END $$;
CREATE FUNCTION public.revisao_decidir_item(_id uuid,_status text,_valor_final jsonb DEFAULT NULL,_motivo text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.conteudo_revisao_itens; r public.conteudo_revisoes; n text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente a Governança decide'; END IF;
 IF _status NOT IN ('aprovado','aprovado_ajuste','rejeitado') OR _status IS NULL THEN RAISE EXCEPTION 'Decisão inválida'; END IF;
 SELECT cr.* INTO r FROM public.conteudo_revisoes cr JOIN public.conteudo_revisao_itens ci ON ci.revisao_id=cr.id WHERE ci.id=_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('conteudo:'||r.documento));
 SELECT * INTO r FROM public.conteudo_revisoes WHERE id=r.id FOR UPDATE;
 IF r.status<>'rascunho' THEN RAISE EXCEPTION 'Revisão já publicada'; END IF;
 SELECT * INTO i FROM public.conteudo_revisao_itens WHERE id=_id FOR UPDATE;
 IF _status='rejeitado' AND nullif(btrim(_motivo),'') IS NULL THEN RAISE EXCEPTION 'Motivo da rejeição obrigatório'; END IF;
 IF _status='aprovado_ajuste' AND (_valor_final IS NULL OR _valor_final='null'::jsonb) THEN RAISE EXCEPTION 'Informe o conteúdo ajustado'; END IF;
 SELECT coalesce(display_name,email) INTO n FROM public.profiles WHERE user_id=auth.uid();
 UPDATE public.conteudo_revisao_itens SET status=_status,valor_final=CASE WHEN _status='aprovado_ajuste' THEN _valor_final END,motivo_rejeicao=CASE WHEN _status='rejeitado' THEN btrim(_motivo) END,decidido_por=auth.uid(),decidido_por_nome=n,decidido_em=now() WHERE id=_id;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('conteudo_revisao_itens',_id::text,'decisao',to_jsonb(i)::text,jsonb_build_object('status',_status,'valor_final',_valor_final,'motivo',_motivo)::text,auth.uid());
END $$;
CREATE FUNCTION public.revisao_aprovar_pendentes(_revisao_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i record; n integer:=0; d text;
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Somente a Governança decide'; END IF;
 SELECT documento INTO d FROM public.conteudo_revisoes WHERE id=_revisao_id;
 PERFORM pg_advisory_xact_lock(hashtext('conteudo:'||d));
 FOR i IN SELECT id FROM public.conteudo_revisao_itens WHERE revisao_id=_revisao_id AND status='pendente' ORDER BY chave LOOP PERFORM public.revisao_decidir_item(i.id,'aprovado',NULL,NULL); n:=n+1; END LOOP; RETURN n;
END $$;
CREATE FUNCTION public.revisao_publicar(_revisao_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.conteudo_revisoes; i record; s jsonb; n text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente a Governança publica'; END IF;
 SELECT * INTO r FROM public.conteudo_revisoes WHERE id=_revisao_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Revisão não encontrada'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('conteudo:'||r.documento));
 SELECT * INTO r FROM public.conteudo_revisoes WHERE id=_revisao_id FOR UPDATE;
 IF r.status<>'rascunho' THEN RAISE EXCEPTION 'Revisão já publicada'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.conteudo_revisao_itens WHERE revisao_id=r.id) OR EXISTS(SELECT 1 FROM public.conteudo_revisao_itens WHERE revisao_id=r.id AND status='pendente') THEN RAISE EXCEPTION 'Decida todos os itens antes de publicar'; END IF;
 SELECT coalesce(display_name,email) INTO n FROM public.profiles WHERE user_id=auth.uid();
 s:=r.snapshot;
 FOR i IN SELECT * FROM public.conteudo_revisao_itens WHERE revisao_id=r.id AND status IN ('aprovado','aprovado_ajuste') ORDER BY chave LOOP
  s:=jsonb_set(s,ARRAY[i.chave],CASE WHEN i.status='aprovado_ajuste' THEN i.valor_final ELSE i.valor_proposto END,true);
  INSERT INTO public.conteudo_editavel(chave,valor,atualizado_por,atualizado_por_nome,updated_at) VALUES(i.chave,s->i.chave,auth.uid(),n,now()) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor,atualizado_por=excluded.atualizado_por,atualizado_por_nome=excluded.atualizado_por_nome,updated_at=now();
 END LOOP;
 UPDATE public.conteudo_revisoes SET status='substituida',substituido_em=now() WHERE documento=r.documento AND status='publicada';
 UPDATE public.conteudo_revisoes SET status='publicada',snapshot=s,publicado_por=auth.uid(),publicado_por_nome=n,publicado_em=now() WHERE id=r.id;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('conteudo_revisoes',r.id::text,'publicacao',r.snapshot::text,s::text,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.revisao_sugerir(text,jsonb,text),public.revisao_decidir_item(uuid,text,jsonb,text),public.revisao_publicar(uuid),public.revisao_aprovar_pendentes(uuid),public.revisao_permissoes() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.revisao_sugerir(text,jsonb,text),public.revisao_decidir_item(uuid,text,jsonb,text),public.revisao_publicar(uuid),public.revisao_aprovar_pendentes(uuid),public.revisao_permissoes() TO authenticated;