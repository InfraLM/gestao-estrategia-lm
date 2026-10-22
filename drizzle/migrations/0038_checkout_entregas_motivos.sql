CREATE TABLE public.mt_extra_motivos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, ativo boolean NOT NULL DEFAULT true, exige_detalhe boolean NOT NULL DEFAULT false, ordem integer NOT NULL DEFAULT 0);
GRANT SELECT,INSERT,UPDATE ON public.mt_extra_motivos TO authenticated;
GRANT ALL ON public.mt_extra_motivos TO service_role;
ALTER TABLE public.mt_extra_motivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY ler ON public.mt_extra_motivos FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'rotina',false) OR public.mt_is_governanca(auth.uid()));
CREATE POLICY inserir ON public.mt_extra_motivos FOR INSERT TO authenticated WITH CHECK(public.mt_is_governanca(auth.uid()));
CREATE POLICY editar ON public.mt_extra_motivos FOR UPDATE TO authenticated USING(public.mt_is_governanca(auth.uid())) WITH CHECK(public.mt_is_governanca(auth.uid()));
CREATE FUNCTION public.mt_extras_validar() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE e jsonb; m public.mt_extra_motivos; anterior jsonb;
BEGIN
IF NEW.tipo <> 'checkout' OR NOT (NEW.conteudo ? 'extras_lista') OR NEW.status <> 'enviado' THEN RETURN NEW; END IF;
IF jsonb_typeof(NEW.conteudo->'extras_lista') <> 'array' THEN RAISE EXCEPTION 'Lista de entregas inválida'; END IF;
FOR e IN SELECT value FROM jsonb_array_elements(NEW.conteudo->'extras_lista') LOOP
IF nullif(btrim(e->>'descricao'),'') IS NULL THEN RAISE EXCEPTION 'Informe a descrição da entrega'; END IF;
SELECT * INTO m FROM public.mt_extra_motivos WHERE id::text=e->>'motivo_id';
IF NOT FOUND THEN RAISE EXCEPTION 'Motivo inválido'; END IF;
anterior := NULL;
IF TG_OP='UPDATE' THEN SELECT value INTO anterior FROM jsonb_array_elements(coalesce(OLD.conteudo->'extras_lista','[]'::jsonb)) WHERE value->>'id'=e->>'id' AND value->>'motivo_id'=e->>'motivo_id' LIMIT 1; END IF;
IF NOT m.ativo AND anterior IS NULL THEN RAISE EXCEPTION 'Motivo desativado'; END IF;
IF (m.exige_detalhe OR coalesce((e->>'exige_detalhe')::boolean,false)) AND nullif(btrim(e->>'detalhe'),'') IS NULL THEN RAISE EXCEPTION 'Especifique o motivo Outros'; END IF;
END LOOP;
RETURN NEW;
END $$;
CREATE TRIGGER mt_extras_validar BEFORE INSERT OR UPDATE ON public.mt_checkins FOR EACH ROW EXECUTE FUNCTION public.mt_extras_validar();
COMMENT ON COLUMN public.mt_checkins.conteudo IS 'Weekly JSON: extras_lista structured optional deliveries with reason ID/label snapshot. Legacy extras/aprendizados/proxima preserved read-only; excluded from completeness.';