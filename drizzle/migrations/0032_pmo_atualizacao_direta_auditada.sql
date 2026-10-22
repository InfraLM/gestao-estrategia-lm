ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS avanco_pct numeric CHECK(avanco_pct BETWEEN 0 AND 100), ADD COLUMN IF NOT EXISTS atualizacao_comentario text, ADD COLUMN IF NOT EXISTS atualizacao_direta_em timestamptz, ADD COLUMN IF NOT EXISTS atualizacao_direta_por uuid, ADD COLUMN IF NOT EXISTS atualizacao_direta_nome text;
CREATE TABLE public.pmo_atualizacoes_auditoria(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), projeto_id uuid NOT NULL REFERENCES public.projetos(id), usuario_id uuid NOT NULL, usuario_nome text, created_at timestamptz NOT NULL DEFAULT now(), anterior jsonb NOT NULL, novo jsonb NOT NULL);
GRANT SELECT ON public.pmo_atualizacoes_auditoria TO authenticated;
GRANT ALL ON public.pmo_atualizacoes_auditoria TO service_role;
ALTER TABLE public.pmo_atualizacoes_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY pmo_audit_read ON public.pmo_atualizacoes_auditoria FOR SELECT TO authenticated USING(public.acesso_modulo(auth.uid(),'pmo',false) AND EXISTS(SELECT 1 FROM public.projetos p WHERE p.id=projeto_id));
CREATE FUNCTION public.pmo_pode_atualizar() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND public.acesso_modulo(auth.uid(),'pmo',false) AND (public.proj_eh_ceo(auth.uid()) OR public.editor_modulo(auth.uid(),'pmo') OR (public.acesso_modulo(auth.uid(),'pmo',true) AND public.has_role(auth.uid(),'pmo'))) $$;
CREATE FUNCTION public.pmo_atualizar_status(_itens jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i jsonb; p public.projetos%ROWTYPE; n integer:=0; nome text; antes jsonb; depois jsonb; ids uuid[]:=ARRAY[]::uuid[];
BEGIN
 IF NOT public.pmo_pode_atualizar() THEN RAISE EXCEPTION 'Sem permissão de edição do portfólio'; END IF;
 IF jsonb_typeof(_itens) IS DISTINCT FROM 'array' OR jsonb_array_length(_itens) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Selecione de 1 a 100 itens'; END IF;
 SELECT display_name INTO nome FROM public.profiles WHERE user_id=auth.uid();
 FOR i IN SELECT value FROM jsonb_array_elements(_itens) ORDER BY value->>'id' LOOP
  IF (i->>'id')::uuid=ANY(ids) THEN RAISE EXCEPTION 'Item duplicado'; END IF; ids:=array_append(ids,(i->>'id')::uuid);
  SELECT * INTO p FROM public.projetos WHERE id=(i->>'id')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projeto não encontrado'; END IF;
  IF p.status::text NOT IN ('Em Andamento','Atrasado','Pausado','A Iniciar') OR coalesce(i->>'status','') NOT IN ('Em Andamento','Atrasado','Pausado','A Iniciar') THEN RAISE EXCEPTION 'Encerrar, cancelar ou reabrir exige decisão SR'; END IF;
  IF p.updated_at IS DISTINCT FROM (i->>'updated_at')::timestamptz THEN RAISE EXCEPTION 'Item alterado por outra pessoa. Recarregue antes de salvar'; END IF;
  IF coalesce(btrim(i->>'comentario'),'')='' THEN RAISE EXCEPTION 'Informe o comentário da atualização'; END IF;
  IF length(i->>'comentario')>4000 THEN RAISE EXCEPTION 'Comentário acima de 4000 caracteres'; END IF;
  IF i->>'avanco_pct' IS NOT NULL AND ((i->>'avanco_pct')::numeric NOT BETWEEN 0 AND 100) THEN RAISE EXCEPTION 'Avanço deve estar entre 0 e 100'; END IF;
  IF coalesce(i->>'termino','')<>'' THEN PERFORM (i->>'termino')::date; END IF;
  antes:=jsonb_build_object('status',p.status,'avanco_pct',p.avanco_pct,'termino',p.termino,'comentario',p.atualizacao_comentario);
  depois:=jsonb_build_object('status',i->>'status','avanco_pct',(i->>'avanco_pct')::numeric,'termino',nullif(i->>'termino',''),'comentario',btrim(i->>'comentario'));
  UPDATE public.projetos SET status=(i->>'status')::public.status_execucao_enum,avanco_pct=(i->>'avanco_pct')::numeric,termino=nullif(i->>'termino',''),atualizacao_comentario=btrim(i->>'comentario'),atualizacao_direta_por=auth.uid(),atualizacao_direta_nome=nome,atualizacao_direta_em=now(),updated_at=now() WHERE id=p.id;
  INSERT INTO public.pmo_atualizacoes_auditoria(projeto_id,usuario_id,usuario_nome,anterior,novo) VALUES(p.id,auth.uid(),nome,antes,depois); n:=n+1;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.pmo_pode_atualizar(), public.pmo_atualizar_status(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pmo_pode_atualizar(),public.pmo_atualizar_status(jsonb) TO authenticated;