CREATE TABLE public.fitfinder_integracao_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  ativo boolean NOT NULL DEFAULT false,
  atualizado_por uuid, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.fitfinder_integracao_config (id) VALUES (true);
CREATE TABLE public.fitfinder_espelho (
  diretoria text PRIMARY KEY,
  total_prestadores integer, grupo_pequeno boolean NOT NULL DEFAULT false,
  por_cargo jsonb NOT NULL DEFAULT '[]'::jsonb, testes jsonb NOT NULL DEFAULT '{}'::jsonb,
  aderencia jsonb NOT NULL DEFAULT '{}'::jsonb, ocupacao jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true, gerado_em timestamptz, sincronizado_em timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.fitfinder_espelho IS 'Somente indicadores agregados por diretoria; nunca nomes, e-mails ou resultados individuais. Grupos < 3 mascarados na sincronização.';
CREATE TABLE public.fitfinder_diretoria_cadeira (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), diretoria text NOT NULL UNIQUE, cadeira_id uuid,
  status text NOT NULL DEFAULT 'sugerido' CHECK (status IN ('sugerido','confirmado')),
  confirmado_por uuid, confirmado_em timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.fitfinder_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), iniciado_em timestamptz NOT NULL DEFAULT now(), concluido_em timestamptz,
  ok boolean, modo text, diretorias integer, mensagem text, usuario uuid
);
CREATE FUNCTION public.fitfinder_pode_ler(_diretoria text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT auth.uid() IS NOT NULL AND (public.proj_gov_ou_ceo(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.fitfinder_diretoria_cadeira m JOIN public.mt_cadeiras c ON c.id=m.cadeira_id
    WHERE m.diretoria=_diretoria AND m.status='confirmado' AND c.ativo
      AND (c.diretor_user_id=auth.uid() OR c.id=public.mt_cadeira_do_usuario(auth.uid()))))
$$;
REVOKE ALL ON FUNCTION public.fitfinder_pode_ler(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fitfinder_pode_ler(text) TO authenticated, service_role;
CREATE FUNCTION public.fitfinder_mapa_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.proj_gov_ou_ceo(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NEW.status='confirmado' THEN
    IF NEW.cadeira_id IS NULL THEN RAISE EXCEPTION 'Escolha a cadeira antes de confirmar'; END IF;
    NEW.confirmado_por := coalesce(auth.uid(), NEW.confirmado_por); NEW.confirmado_em := now();
  ELSE NEW.confirmado_por := NULL; NEW.confirmado_em := NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fitfinder_mapa_guard BEFORE INSERT OR UPDATE ON public.fitfinder_diretoria_cadeira FOR EACH ROW EXECUTE FUNCTION public.fitfinder_mapa_guard();
GRANT SELECT ON public.fitfinder_integracao_config, public.fitfinder_espelho, public.fitfinder_diretoria_cadeira, public.fitfinder_sync_log TO authenticated;
GRANT UPDATE ON public.fitfinder_integracao_config, public.fitfinder_diretoria_cadeira TO authenticated;
GRANT ALL ON public.fitfinder_integracao_config, public.fitfinder_espelho, public.fitfinder_diretoria_cadeira, public.fitfinder_sync_log TO service_role;
ALTER TABLE public.fitfinder_integracao_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitfinder_espelho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitfinder_diretoria_cadeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitfinder_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ler ON public.fitfinder_espelho FOR SELECT TO authenticated USING (public.fitfinder_pode_ler(diretoria));
CREATE POLICY ler ON public.fitfinder_diretoria_cadeira FOR SELECT TO authenticated USING (public.fitfinder_pode_ler(diretoria));
CREATE POLICY editar_gov ON public.fitfinder_diretoria_cadeira FOR UPDATE TO authenticated USING (public.proj_gov_ou_ceo(auth.uid())) WITH CHECK (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY ler ON public.fitfinder_sync_log FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY ler ON public.fitfinder_integracao_config FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY editar_gov ON public.fitfinder_integracao_config FOR UPDATE TO authenticated USING (public.proj_gov_ou_ceo(auth.uid())) WITH CHECK (public.proj_gov_ou_ceo(auth.uid()));