CREATE POLICY org_correspondencias_aprovadas_visiveis ON public.org_correspondencias FOR SELECT TO authenticated USING(status='aprovado' AND public.org_fonte_visivel(fonte,registro_id));
CREATE OR REPLACE FUNCTION public.org_nomes_aprovados(_fontes jsonb) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
DECLARE f jsonb; resultado jsonb:='[]'::jsonb; linha public.org_correspondencias; d jsonb; nome text;
BEGIN
 IF auth.uid() IS NULL OR jsonb_typeof(_fontes)<>'array' OR jsonb_array_length(_fontes)>500 THEN RAISE EXCEPTION 'Consulta de nomes inválida'; END IF;
 d:=public.org_diretorio();
 FOR f IN SELECT jsonb_array_elements(_fontes) LOOP
 SELECT * INTO linha FROM public.org_correspondencias WHERE fonte=f->>'fonte' AND registro_id=f->>'id' AND campo=f->>'campo' AND status='aprovado';
 IF FOUND AND public.org_fonte_visivel(linha.fonte,linha.registro_id) THEN
 SELECT e->>'nome' INTO nome FROM jsonb_array_elements(d->'pessoas') e WHERE e->>'id'=linha.pessoa_id::text;
 IF nome IS NULL THEN SELECT e->>'nome' INTO nome FROM jsonb_array_elements(d->'cadeiras') e WHERE e->>'id'=linha.cadeira_id::text; END IF;
 resultado:=resultado||jsonb_build_array(jsonb_build_object('fonte',linha.fonte,'id',linha.registro_id,'campo',linha.campo,'pessoa_id',linha.pessoa_id,'cadeira_id',linha.cadeira_id,'nome',nome));
 END IF;
 END LOOP; RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.org_nome_aprovado_interno(text,text,text) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.org_cargo_cadeira_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF (TG_OP='INSERT' AND NEW.mt_cadeira_id IS NOT NULL) OR (TG_OP='UPDATE' AND NEW.mt_cadeira_id IS DISTINCT FROM OLD.mt_cadeira_id) THEN
 IF coalesce(auth.role(),'')<>'service_role' AND NOT coalesce(public.proj_gov_ou_ceo(auth.uid()),false) THEN RAISE EXCEPTION 'Só Governança/CEO liga o cargo à cadeira'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE POLICY org_cadeira_inserir_cap ON public.mt_cadeiras AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY org_cadeira_excluir_cap ON public.mt_cadeiras AS RESTRICTIVE FOR DELETE TO authenticated USING(public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY org_cargo_inserir_cap ON public.org_organograma_cargos AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.proj_gov_ou_ceo(auth.uid()));
CREATE OR REPLACE FUNCTION public.org_pessoa_vinculo_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.user_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=NEW.user_id) THEN RAISE EXCEPTION 'Usuário inexistente'; END IF;
 IF NEW.gestor_id=NEW.id THEN RAISE EXCEPTION 'Gestor não pode ser a própria pessoa'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER org_pessoa_vinculo BEFORE INSERT OR UPDATE ON public.org_pessoas FOR EACH ROW EXECUTE FUNCTION public.org_pessoa_vinculo_guard();