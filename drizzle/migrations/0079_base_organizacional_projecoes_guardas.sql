CREATE OR REPLACE FUNCTION public.org_acao_salvar(_id uuid,_cadeira uuid,_ciclo date,_dados jsonb) RETURNS public.rotina_acoes_entrega LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item public.rotina_acoes_entrega; pessoa uuid:=nullif(_dados->>'responsavel_pessoa_id','')::uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.acesso_modulo(auth.uid(),'rotina',true),false) OR NOT coalesce(public.mt_is_governanca(auth.uid()) OR public.mt_cadeira_do_usuario(auth.uid())=_cadeira,false) THEN RAISE EXCEPTION 'Sem permissão para registrar entregas desta cadeira'; END IF;
 IF pessoa IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.org_pessoas WHERE id=pessoa AND ativo) THEN RAISE EXCEPTION 'Pessoa inativa ou inexistente'; END IF;
 SELECT * INTO item FROM public.rotina_acao_salvar(_id,_cadeira,_ciclo,_dados);
 UPDATE public.rotina_acoes_entrega SET responsavel_pessoa_id=pessoa WHERE id=item.id RETURNING * INTO item; RETURN item;
END $$;
REVOKE ALL ON FUNCTION public.org_acao_salvar(uuid,uuid,date,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_acao_salvar(uuid,uuid,date,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.org_fonte_visivel(_fonte text,_id text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
DECLARE permitido boolean;
BEGIN
 IF _fonte NOT IN ('projetos','mt_iniciativas','rotina_acoes_entrega','cronograma_itens','eap_itens','gov_acoes','org_cadeiras','org_organograma_cargos','mt_cadeiras','processos','decisoes_estrategicas','riscos_institucionais') THEN RETURN false; END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE id::text=$1)',_fonte) INTO permitido USING _id; RETURN permitido;
END $$;
REVOKE ALL ON FUNCTION public.org_fonte_visivel(text,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_fonte_visivel(text,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.org_nomes_aprovados(_fontes jsonb) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
DECLARE f jsonb; resultado jsonb:='[]'::jsonb; nomes jsonb;
BEGIN
 IF auth.uid() IS NULL OR jsonb_typeof(_fontes)<>'array' OR jsonb_array_length(_fontes)>500 THEN RAISE EXCEPTION 'Consulta de nomes inválida'; END IF;
 FOREACH f IN ARRAY ARRAY(SELECT jsonb_array_elements(_fontes)) LOOP
 IF public.org_fonte_visivel(f->>'fonte',f->>'id') THEN
 SELECT public.org_nome_aprovado_interno(f->>'fonte',f->>'id',f->>'campo') INTO nomes;
 IF nomes IS NOT NULL THEN resultado:=resultado||jsonb_build_array(nomes); END IF;
 END IF;
 END LOOP; RETURN resultado;
END $$;
CREATE OR REPLACE FUNCTION public.org_nome_aprovado_interno(_fonte text,_id text,_campo text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('fonte',c.fonte,'id',c.registro_id,'campo',c.campo,'pessoa_id',c.pessoa_id,'cadeira_id',c.cadeira_id,'nome',coalesce(p.nome,k.nome)) FROM public.org_correspondencias c LEFT JOIN public.org_pessoas p ON p.id=c.pessoa_id LEFT JOIN public.mt_cadeiras k ON k.id=c.cadeira_id WHERE c.fonte=_fonte AND c.registro_id=_id AND c.campo=_campo AND c.status='aprovado' LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.org_nome_aprovado_interno(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.org_nome_aprovado_interno(text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.org_nomes_aprovados(jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_nomes_aprovados(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.org_nome_aprovado_interno(_fonte text,_id text,_campo text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE permitido boolean; resultado jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RETURN NULL; END IF;
 -- Check source visibility with the caller's identity even inside this definer.
 PERFORM set_config('row_security','on',true);
 IF _fonte NOT IN ('projetos','mt_iniciativas','rotina_acoes_entrega','cronograma_itens','eap_itens','gov_acoes','org_cadeiras','org_organograma_cargos','mt_cadeiras','processos','decisoes_estrategicas','riscos_institucionais') THEN RETURN NULL; END IF;
 -- Identity metadata is returned only for rows already RLS-visible to the caller through the invoker entry point.
 SELECT jsonb_build_object('fonte',c.fonte,'id',c.registro_id,'campo',c.campo,'pessoa_id',c.pessoa_id,'cadeira_id',c.cadeira_id,'nome',coalesce(p.nome,k.nome)) INTO resultado FROM public.org_correspondencias c LEFT JOIN public.org_pessoas p ON p.id=c.pessoa_id LEFT JOIN public.mt_cadeiras k ON k.id=c.cadeira_id WHERE c.fonte=_fonte AND c.registro_id=_id AND c.campo=_campo AND c.status='aprovado' LIMIT 1;
 IF NOT public.proj_gov_ou_ceo(auth.uid()) THEN RETURN NULL; END IF;
 RETURN resultado;
END $$;
CREATE OR REPLACE FUNCTION public.org_referencia_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE coluna text; pid uuid; antes jsonb:=CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END; depois jsonb:=to_jsonb(NEW);
BEGIN
 FOREACH coluna IN ARRAY TG_ARGV LOOP
 IF (depois->>coluna) IS DISTINCT FROM (antes->>coluna) THEN
 pid:=nullif(depois->>coluna,'')::uuid;
 IF pid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.org_pessoas WHERE id=pid AND ativo) THEN RAISE EXCEPTION 'Pessoa inativa ou inexistente'; END IF;
 INSERT INTO public.org_auditoria(entidade,registro_id,antes,depois,autor) VALUES(TG_TABLE_NAME,depois->>'id',antes,depois,auth.uid());
 END IF;
 END LOOP; RETURN NEW;
END $$;
CREATE TRIGGER org_projeto_referencia BEFORE INSERT OR UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.org_referencia_guard('diretor_pessoa_id','gerente_pessoa_id');
CREATE TRIGGER org_iniciativa_referencia BEFORE INSERT OR UPDATE ON public.mt_iniciativas FOR EACH ROW EXECUTE FUNCTION public.org_referencia_guard('responsavel_pessoa_id');
CREATE TRIGGER org_entrega_referencia BEFORE INSERT OR UPDATE ON public.rotina_acoes_entrega FOR EACH ROW EXECUTE FUNCTION public.org_referencia_guard('responsavel_pessoa_id');
CREATE TRIGGER org_cronograma_referencia BEFORE INSERT OR UPDATE ON public.cronograma_itens FOR EACH ROW EXECUTE FUNCTION public.org_referencia_guard('responsavel_pessoa_id');
CREATE TRIGGER org_eap_referencia BEFORE INSERT OR UPDATE ON public.eap_itens FOR EACH ROW EXECUTE FUNCTION public.org_referencia_guard('responsavel_pessoa_id');
CREATE POLICY org_cadeira_editor_cap ON public.mt_cadeiras AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.proj_gov_ou_ceo(auth.uid())) WITH CHECK(public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY org_cargo_editor_cap ON public.org_organograma_cargos AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.proj_gov_ou_ceo(auth.uid())) WITH CHECK(public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY org_ficha_editor_cap ON public.org_cadeiras AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.proj_gov_ou_ceo(auth.uid())) WITH CHECK(public.proj_gov_ou_ceo(auth.uid()));