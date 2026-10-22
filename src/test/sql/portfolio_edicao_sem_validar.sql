ALTER TABLE public.portfolio_vinculos ADD COLUMN editado_por uuid, ADD COLUMN editado_nome text, ADD COLUMN editado_em timestamptz;
CREATE OR REPLACE FUNCTION public.portfolio_auditar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO portfolio_vinculos_auditoria(fonte_tipo,fonte_id,vinculo_id,acao,usuario_id,usuario_nome,antes,depois) VALUES(NEW.fonte_tipo,NEW.fonte_id,NEW.id,CASE WHEN TG_OP='INSERT' THEN CASE WHEN NEW.editado_por IS NOT NULL THEN 'adicionar' ELSE 'propor' END WHEN NEW.status='removido' THEN 'remover' WHEN NEW.status='validado' AND OLD.status<>'validado' THEN 'validar' WHEN OLD.status='validado' AND NEW.status='proposto' THEN 'editar_validado' ELSE 'editar' END,coalesce(auth.uid(),NEW.proposto_por),coalesce(CASE WHEN NEW.status='validado' AND OLD.status IS DISTINCT FROM 'validado' THEN NEW.validado_nome END,NEW.editado_nome,NEW.validado_nome,NEW.proposto_nome),CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END,to_jsonb(NEW)); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.portfolio_revisar(_itens jsonb,_acao text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE x jsonb; v portfolio_vinculos%ROWTYPE; novo uuid; ft text; fid uuid; t text; r uuid; nome text; imp text; valida boolean; n integer:=0;
BEGIN
 IF _acao IS NULL OR _acao NOT IN('validar','salvar','salvar_validar','remover') OR _itens IS NULL OR jsonb_typeof(_itens)<>'array' OR jsonb_array_length(_itens) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Seleção inválida (1–100).'; END IF;
 valida:=_acao='salvar_validar';
 SELECT display_name INTO nome FROM profiles WHERE user_id=auth.uid(); nome:=coalesce(nome,'Usuário autorizado');
 FOR x IN SELECT value FROM jsonb_array_elements(_itens) ORDER BY value->>'fonte_tipo',value->>'fonte_id',value->>'id' LOOP
  ft:=x->>'fonte_tipo'; fid:=(x->>'fonte_id')::uuid;
  IF NOT coalesce(public.portfolio_pode_editar(ft,fid),false) THEN RAISE EXCEPTION 'Sem permissão para este item.'; END IF;
  IF ft='projeto' THEN PERFORM 1 FROM projetos WHERE id=fid FOR UPDATE; ELSE PERFORM 1 FROM mt_iniciativas WHERE id=fid FOR UPDATE; END IF;
  v:=NULL;
  IF x->>'id' IS NOT NULL THEN SELECT * INTO v FROM portfolio_vinculos WHERE id=(x->>'id')::uuid AND fonte_tipo=ft AND fonte_id=fid FOR UPDATE; IF NOT FOUND OR v.status='removido' THEN RAISE EXCEPTION 'Vínculo indisponível.'; END IF; END IF;
  t:=coalesce(x->>'tipo',v.tipo); r:=coalesce((x->>'ref_id')::uuid,v.ref_id);
  IF _acao='remover' THEN
   IF v.id IS NULL THEN RAISE EXCEPTION 'Vínculo inexistente.'; END IF;
   UPDATE portfolio_vinculos SET status='removido',validado_por=NULL,validado_nome=NULL,validado_em=NULL,editado_por=auth.uid(),editado_nome=nome,editado_em=now(),updated_at=now() WHERE id=v.id;
  ELSE
   IF NOT coalesce(public.estrategia_alvo_ativo(t,r),false) THEN RAISE EXCEPTION 'Alvo inativo ou fora do semestre vigente.'; END IF;
   IF _acao='validar' THEN
    IF v.id IS NULL OR v.status<>'proposto' THEN RAISE EXCEPTION 'Selecione apenas vínculos propostos.'; END IF;
    UPDATE portfolio_vinculos SET status='validado',validado_por=auth.uid(),validado_nome=nome,validado_em=now(),updated_at=now() WHERE id=v.id;
   ELSE
    imp:=CASE WHEN x ? 'impacto' THEN nullif(x->>'impacto','') ELSE v.impacto END;
    IF imp IS NOT NULL AND imp NOT IN('principal','secundario') THEN RAISE EXCEPTION 'Impacto inválido.'; END IF;
    IF v.id IS NOT NULL AND (v.tipo<>t OR v.ref_id<>r) THEN UPDATE portfolio_vinculos SET status='removido',validado_por=NULL,validado_nome=NULL,validado_em=NULL,editado_por=auth.uid(),editado_nome=nome,editado_em=now(),updated_at=now() WHERE id=v.id; END IF;
    INSERT INTO portfolio_vinculos(fonte_tipo,fonte_id,tipo,ref_id,origem,status,justificativa,confianca,impacto,proposto_por,proposto_nome,editado_por,editado_nome,editado_em,validado_por,validado_nome,validado_em)
    VALUES(ft,fid,t,r,CASE WHEN v.id IS NULL THEN 'manual' ELSE v.origem END,CASE WHEN valida THEN 'validado' ELSE 'proposto' END,left(coalesce(x->>'justificativa',v.justificativa,'Vínculo manual'),1000),v.confianca,imp,auth.uid(),nome,auth.uid(),nome,now(),CASE WHEN valida THEN auth.uid() END,CASE WHEN valida THEN nome END,CASE WHEN valida THEN now() END)
    ON CONFLICT(fonte_tipo,fonte_id,tipo,ref_id) DO UPDATE SET status=EXCLUDED.status,justificativa=EXCLUDED.justificativa,impacto=EXCLUDED.impacto,revisar=false,revisar_motivo=NULL,editado_por=auth.uid(),editado_nome=nome,editado_em=now(),validado_por=EXCLUDED.validado_por,validado_nome=EXCLUDED.validado_nome,validado_em=EXCLUDED.validado_em,updated_at=now()
    RETURNING id INTO novo;
    IF imp='principal' THEN UPDATE portfolio_vinculos SET impacto='secundario',status=CASE WHEN status='validado' THEN 'proposto' ELSE status END,validado_por=CASE WHEN status='validado' THEN NULL ELSE validado_por END,validado_nome=CASE WHEN status='validado' THEN NULL ELSE validado_nome END,validado_em=CASE WHEN status='validado' THEN NULL ELSE validado_em END,editado_por=auth.uid(),editado_nome=nome,editado_em=now(),updated_at=now() WHERE fonte_tipo=ft AND fonte_id=fid AND impacto='principal' AND status<>'removido' AND id<>novo; END IF;
   END IF;
  END IF;
  n:=n+1;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.portfolio_revisar(jsonb,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.portfolio_revisar(jsonb,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.portfolio_definir_impacto(_id uuid,_impacto text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v portfolio_vinculos%ROWTYPE;
BEGIN
 SELECT * INTO v FROM portfolio_vinculos WHERE id=_id;
 IF NOT FOUND OR v.status='removido' THEN RAISE EXCEPTION 'Vínculo indisponível.'; END IF;
 PERFORM public.portfolio_revisar(jsonb_build_array(jsonb_build_object('id',v.id,'fonte_tipo',v.fonte_tipo,'fonte_id',v.fonte_id,'impacto',_impacto)),'salvar');
END $$;
REVOKE ALL ON FUNCTION public.portfolio_definir_impacto(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.portfolio_definir_impacto(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.portfolio_gravar_propostas(_fonte_tipo text,_fonte_id uuid,_usuario uuid,_propostas jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE x jsonb; nome text; BEGIN IF _fonte_tipo='projeto' THEN PERFORM 1 FROM projetos WHERE id=_fonte_id FOR UPDATE; ELSIF _fonte_tipo='iniciativa' THEN PERFORM 1 FROM mt_iniciativas WHERE id=_fonte_id FOR UPDATE; ELSE RAISE EXCEPTION 'Fonte inválida'; END IF; IF NOT FOUND THEN RAISE EXCEPTION 'Fonte inexistente'; END IF; IF EXISTS(SELECT 1 FROM portfolio_vinculos WHERE fonte_tipo=_fonte_tipo AND fonte_id=_fonte_id AND (status='validado' OR editado_por IS NOT NULL)) THEN RETURN 0; END IF; IF _propostas IS NULL OR jsonb_typeof(_propostas)<>'array' OR jsonb_array_length(_propostas)>100 THEN RAISE EXCEPTION 'Propostas inválidas'; END IF; SELECT display_name INTO nome FROM profiles WHERE user_id=_usuario; FOR x IN SELECT value FROM jsonb_array_elements(_propostas) LOOP IF x->>'origem' NOT IN('ia','legado') OR NOT public.estrategia_alvo_ativo(x->>'tipo',(x->>'ref_id')::uuid) THEN RAISE EXCEPTION 'Proposta inválida ou alvo inativo'; END IF; INSERT INTO portfolio_vinculos(fonte_tipo,fonte_id,tipo,ref_id,origem,status,justificativa,confianca,proposto_por,proposto_nome) VALUES(_fonte_tipo,_fonte_id,x->>'tipo',(x->>'ref_id')::uuid,x->>'origem','proposto',left(coalesce(x->>'justificativa',''),1000),x->>'confianca',_usuario,nome) ON CONFLICT DO NOTHING; END LOOP; RETURN (SELECT count(*)::int FROM portfolio_vinculos WHERE fonte_tipo=_fonte_tipo AND fonte_id=_fonte_id AND status='proposto'); END $$;
REVOKE ALL ON FUNCTION public.portfolio_gravar_propostas(text,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.portfolio_gravar_propostas(text,uuid,uuid,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.portfolio_gravar_revisao(_fonte_tipo text,_fonte_id uuid,_usuario uuid,_novos jsonb,_revisar jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE x jsonb; nome text; novos int:=0; marcados int:=0; imp text; c int; principal_ref uuid;
BEGIN
 IF _fonte_tipo='projeto' THEN PERFORM 1 FROM projetos WHERE id=_fonte_id FOR UPDATE; ELSIF _fonte_tipo='iniciativa' THEN PERFORM 1 FROM mt_iniciativas WHERE id=_fonte_id FOR UPDATE; ELSE RAISE EXCEPTION 'Fonte inválida'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'Fonte inexistente'; END IF;
 IF EXISTS(SELECT 1 FROM portfolio_vinculos WHERE fonte_tipo=_fonte_tipo AND fonte_id=_fonte_id AND (status='validado' OR editado_por IS NOT NULL)) THEN RETURN jsonb_build_object('novos',0,'revisar',0); END IF;
 IF jsonb_typeof(coalesce(_novos,'[]'))<>'array' OR jsonb_typeof(coalesce(_revisar,'[]'))<>'array' OR jsonb_array_length(coalesce(_novos,'[]'))>20 THEN RAISE EXCEPTION 'Revisão inválida'; END IF;
 SELECT display_name INTO nome FROM profiles WHERE user_id=_usuario;
 SELECT (value->>'ref_id')::uuid INTO principal_ref FROM jsonb_array_elements(coalesce(_novos,'[]')) WHERE value->>'tipo'='objetivo' AND value->>'impacto'='principal' LIMIT 1;
 IF principal_ref IS NOT NULL THEN UPDATE portfolio_vinculos SET impacto='secundario',updated_at=now() WHERE fonte_tipo=_fonte_tipo AND fonte_id=_fonte_id AND impacto='principal' AND NOT (tipo='objetivo' AND ref_id=principal_ref); END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(_novos,'[]')) LOOP
  IF NOT public.estrategia_alvo_ativo(x->>'tipo',(x->>'ref_id')::uuid) THEN RAISE EXCEPTION 'Proposta inválida ou alvo inativo'; END IF;
  imp:=CASE WHEN x->>'impacto'='principal' AND (x->>'ref_id')::uuid IS NOT DISTINCT FROM principal_ref THEN 'principal' ELSE 'secundario' END;
  INSERT INTO portfolio_vinculos(fonte_tipo,fonte_id,tipo,ref_id,origem,status,justificativa,confianca,proposto_por,proposto_nome,impacto)
  VALUES(_fonte_tipo,_fonte_id,x->>'tipo',(x->>'ref_id')::uuid,'ia_revisao','proposto',left(coalesce(x->>'justificativa',''),1000),x->>'confianca',_usuario,nome,imp)
  ON CONFLICT(fonte_tipo,fonte_id,tipo,ref_id) DO UPDATE SET impacto=EXCLUDED.impacto,revisar=false,revisar_motivo=NULL,updated_at=now() WHERE portfolio_vinculos.status='proposto' AND portfolio_vinculos.editado_por IS NULL;
  GET DIAGNOSTICS c=ROW_COUNT; novos:=novos+c;
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(_revisar,'[]')) LOOP
  UPDATE portfolio_vinculos SET revisar=true,revisar_motivo=left(coalesce(x->>'justificativa','A IA não encontrou sustentação.'),1000),updated_at=now()
  WHERE id=(x->>'id')::uuid AND fonte_tipo=_fonte_tipo AND fonte_id=_fonte_id AND status='proposto' AND editado_por IS NULL AND NOT (tipo=coalesce(x->>'tipo','') AND ref_id IS NOT DISTINCT FROM principal_ref);
  GET DIAGNOSTICS c=ROW_COUNT; marcados:=marcados+c;
 END LOOP;
 RETURN jsonb_build_object('novos',novos,'revisar',marcados);
END $$;
REVOKE ALL ON FUNCTION public.portfolio_gravar_revisao(text,uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.portfolio_gravar_revisao(text,uuid,uuid,jsonb,jsonb) TO service_role;
