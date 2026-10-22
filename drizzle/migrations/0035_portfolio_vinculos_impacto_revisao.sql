ALTER TABLE public.portfolio_vinculos ADD COLUMN impacto text CHECK (impacto IN ('principal','secundario')), ADD COLUMN revisar boolean NOT NULL DEFAULT false, ADD COLUMN revisar_motivo text;
ALTER TABLE public.portfolio_vinculos DROP CONSTRAINT portfolio_vinculos_origem_check;
ALTER TABLE public.portfolio_vinculos ADD CONSTRAINT portfolio_vinculos_origem_check CHECK (origem IN ('legado','ia','ia_revisao','manual'));
CREATE OR REPLACE FUNCTION public.portfolio_gravar_revisao(_fonte_tipo text,_fonte_id uuid,_usuario uuid,_novos jsonb,_revisar jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE x jsonb; nome text; novos int:=0; marcados int:=0; imp text; c int; principal_ref uuid;
BEGIN
 IF _fonte_tipo='projeto' THEN PERFORM 1 FROM projetos WHERE id=_fonte_id FOR UPDATE; ELSIF _fonte_tipo='iniciativa' THEN PERFORM 1 FROM mt_iniciativas WHERE id=_fonte_id FOR UPDATE; ELSE RAISE EXCEPTION 'Fonte inválida'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'Fonte inexistente'; END IF;
 IF EXISTS(SELECT 1 FROM portfolio_vinculos WHERE fonte_tipo=_fonte_tipo AND fonte_id=_fonte_id AND status='validado') THEN RETURN jsonb_build_object('novos',0,'revisar',0); END IF;
 IF jsonb_typeof(coalesce(_novos,'[]'))<>'array' OR jsonb_typeof(coalesce(_revisar,'[]'))<>'array' OR jsonb_array_length(coalesce(_novos,'[]'))>20 THEN RAISE EXCEPTION 'Revisão inválida'; END IF;
 SELECT display_name INTO nome FROM profiles WHERE user_id=_usuario;
 SELECT (value->>'ref_id')::uuid INTO principal_ref FROM jsonb_array_elements(coalesce(_novos,'[]')) WHERE value->>'tipo'='objetivo' AND value->>'impacto'='principal' LIMIT 1;
 IF principal_ref IS NOT NULL THEN UPDATE portfolio_vinculos SET impacto='secundario',updated_at=now() WHERE fonte_tipo=_fonte_tipo AND fonte_id=_fonte_id AND impacto='principal' AND NOT (tipo='objetivo' AND ref_id=principal_ref); END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(_novos,'[]')) LOOP
  IF NOT public.estrategia_alvo_ativo(x->>'tipo',(x->>'ref_id')::uuid) THEN RAISE EXCEPTION 'Proposta inválida ou alvo inativo'; END IF;
  imp:=CASE WHEN x->>'impacto'='principal' AND (x->>'ref_id')::uuid IS NOT DISTINCT FROM principal_ref THEN 'principal' ELSE 'secundario' END;
  INSERT INTO portfolio_vinculos(fonte_tipo,fonte_id,tipo,ref_id,origem,status,justificativa,confianca,proposto_por,proposto_nome,impacto)
  VALUES(_fonte_tipo,_fonte_id,x->>'tipo',(x->>'ref_id')::uuid,'ia_revisao','proposto',left(coalesce(x->>'justificativa',''),1000),x->>'confianca',_usuario,nome,imp)
  ON CONFLICT(fonte_tipo,fonte_id,tipo,ref_id) DO UPDATE SET impacto=EXCLUDED.impacto,revisar=false,revisar_motivo=NULL,updated_at=now() WHERE portfolio_vinculos.status='proposto';
  GET DIAGNOSTICS c=ROW_COUNT; novos:=novos+c;
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(_revisar,'[]')) LOOP
  UPDATE portfolio_vinculos SET revisar=true,revisar_motivo=left(coalesce(x->>'justificativa','A IA não encontrou sustentação.'),1000),updated_at=now()
  WHERE id=(x->>'id')::uuid AND fonte_tipo=_fonte_tipo AND fonte_id=_fonte_id AND status='proposto' AND NOT (tipo=coalesce(x->>'tipo','') AND ref_id IS NOT DISTINCT FROM principal_ref);
  GET DIAGNOSTICS c=ROW_COUNT; marcados:=marcados+c;
 END LOOP;
 RETURN jsonb_build_object('novos',novos,'revisar',marcados);
END $$;
REVOKE ALL ON FUNCTION public.portfolio_gravar_revisao(text,uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.portfolio_gravar_revisao(text,uuid,uuid,jsonb,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.portfolio_definir_impacto(_id uuid,_impacto text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v portfolio_vinculos%ROWTYPE;
BEGIN
 IF _impacto IS NOT NULL AND _impacto NOT IN ('principal','secundario') THEN RAISE EXCEPTION 'Impacto inválido.'; END IF;
 SELECT * INTO v FROM portfolio_vinculos WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR v.status='removido' THEN RAISE EXCEPTION 'Vínculo indisponível.'; END IF;
 IF NOT coalesce(public.portfolio_pode_editar(v.fonte_tipo,v.fonte_id),false) THEN RAISE EXCEPTION 'Sem permissão para este item.'; END IF;
 IF _impacto='principal' THEN UPDATE portfolio_vinculos SET impacto='secundario',updated_at=now() WHERE fonte_tipo=v.fonte_tipo AND fonte_id=v.fonte_id AND impacto='principal' AND id<>_id; END IF;
 UPDATE portfolio_vinculos SET impacto=_impacto,updated_at=now() WHERE id=_id;
END $$;
REVOKE ALL ON FUNCTION public.portfolio_definir_impacto(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.portfolio_definir_impacto(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.portfolio_limpar_revisar() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.status='validado' THEN NEW.revisar:=false; END IF; RETURN NEW; END $$;
CREATE TRIGGER portfolio_limpar_revisar BEFORE UPDATE ON public.portfolio_vinculos FOR EACH ROW EXECUTE FUNCTION public.portfolio_limpar_revisar();