CREATE OR REPLACE FUNCTION public.org_cargo_cadeira_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF (TG_OP='INSERT' AND NEW.mt_cadeira_id IS NOT NULL) OR (TG_OP='UPDATE' AND NEW.mt_cadeira_id IS DISTINCT FROM OLD.mt_cadeira_id) THEN
    IF coalesce(auth.role(),'')<>'service_role' AND NOT public.mt_is_governanca(auth.uid()) THEN
      RAISE EXCEPTION 'Só a Governança liga o cargo à cadeira';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER org_cargo_cadeira_guard BEFORE INSERT OR UPDATE ON public.org_organograma_cargos FOR EACH ROW EXECUTE FUNCTION public.org_cargo_cadeira_guard();