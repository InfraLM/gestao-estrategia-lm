
CREATE TABLE public.rotina_transparencia (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  ativo boolean NOT NULL DEFAULT false,
  alterado_por uuid, alterado_em timestamptz
);
GRANT SELECT, UPDATE ON public.rotina_transparencia TO authenticated;
GRANT ALL ON public.rotina_transparencia TO service_role;
ALTER TABLE public.rotina_transparencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transp ler" ON public.rotina_transparencia FOR SELECT TO authenticated USING (true);
CREATE POLICY "transp gov" ON public.rotina_transparencia FOR UPDATE TO authenticated USING (public.mt_is_governanca(auth.uid())) WITH CHECK (public.mt_is_governanca(auth.uid()));
INSERT INTO public.rotina_transparencia (id, ativo) VALUES (true, false);

CREATE OR REPLACE FUNCTION public.rotina_transparencia_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.alterado_por := auth.uid(); NEW.alterado_em := now();
  IF NEW.ativo IS DISTINCT FROM OLD.ativo THEN
    INSERT INTO public.mt_auditoria (tabela, registro_id, campo, valor_anterior, valor_novo, alterado_por)
    VALUES ('rotina_transparencia', 'transparencia', 'ativo', OLD.ativo::text, NEW.ativo::text, auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER rotina_transparencia_audit BEFORE UPDATE ON public.rotina_transparencia FOR EACH ROW EXECUTE FUNCTION public.rotina_transparencia_audit();

CREATE OR REPLACE FUNCTION public.rotina_ve_todas(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.mt_is_governanca(_uid) OR public.proj_eh_ceo(_uid) OR public.mt_cadeira_do_usuario(_uid) IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.rotina_pode_ler_checkin(_cadeira uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid())
    OR _cadeira = public.mt_cadeira_do_usuario(auth.uid())
    OR (public.mt_cadeira_do_usuario(auth.uid()) IS NOT NULL AND COALESCE((SELECT ativo FROM public.rotina_transparencia WHERE id), false))
$$;

DROP POLICY IF EXISTS "mt ler" ON public.mt_checkins;
CREATE POLICY "mt ler cadeira" ON public.mt_checkins FOR SELECT TO authenticated USING (public.rotina_pode_ler_checkin(cadeira_id));

DROP POLICY IF EXISTS "mt ler" ON public.mt_envios;
CREATE POLICY "mt ler nota" ON public.mt_envios FOR SELECT TO authenticated USING (public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR cadeira_id = public.mt_cadeira_do_usuario(auth.uid()));

CREATE OR REPLACE FUNCTION public.rotina_status_ciclos(_semanas date[])
RETURNS TABLE(cadeira_id uuid, semana date, tipo text, status text, enviado_em timestamptz, primeiro_envio_em text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.cadeira_id, c.semana, c.tipo, c.status, c.enviado_em, c.conteudo->>'primeiro_envio_em'
  FROM public.mt_checkins c WHERE c.semana = ANY(_semanas) AND public.rotina_ve_todas(auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.rotina_situacoes_kpi()
RETURNS TABLE(cadeira_id uuid, semana date, enviado_em timestamptz, indicador_id text, situacao_atual text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.cadeira_id, c.semana, c.enviado_em, k->>'indicador_id', k->>'situacao_atual'
  FROM public.mt_checkins c, jsonb_array_elements(CASE WHEN jsonb_typeof(c.conteudo->'kpis_resposta') = 'array' THEN c.conteudo->'kpis_resposta' ELSE '[]'::jsonb END) k
  WHERE c.tipo = 'checkout' AND c.status = 'enviado' AND COALESCE(k->>'situacao_atual', '') <> '' AND public.rotina_ve_todas(auth.uid())
$$;
REVOKE EXECUTE ON FUNCTION public.rotina_status_ciclos(date[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.rotina_situacoes_kpi() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rotina_status_ciclos(date[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_situacoes_kpi() TO authenticated;

CREATE TABLE public.planejamento_revisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  numero integer NOT NULL,
  competencia text,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aprovado','substituido')),
  conteudo text NOT NULL DEFAULT '',
  fontes jsonb NOT NULL DEFAULT '[]'::jsonb,
  gerado_por uuid, gerado_em timestamptz NOT NULL DEFAULT now(),
  aprovado_por uuid, aprovado_por_nome text, aprovado_em timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, numero)
);
GRANT SELECT, INSERT, UPDATE ON public.planejamento_revisoes TO authenticated;
GRANT ALL ON public.planejamento_revisoes TO service_role;
ALTER TABLE public.planejamento_revisoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rev ler" ON public.planejamento_revisoes FOR SELECT TO authenticated USING (public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR (status <> 'rascunho' AND public.mt_cadeira_do_usuario(auth.uid()) IS NOT NULL));
CREATE POLICY "rev gov editar" ON public.planejamento_revisoes FOR UPDATE TO authenticated USING (public.mt_is_governanca(auth.uid()) AND status = 'rascunho') WITH CHECK (public.mt_is_governanca(auth.uid()));
CREATE POLICY "rev gov inserir" ON public.planejamento_revisoes FOR INSERT TO authenticated WITH CHECK (public.mt_is_governanca(auth.uid()) AND status = 'rascunho');

CREATE OR REPLACE FUNCTION public.planejamento_aprovar(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente a Governança aprova'; END IF;
  SELECT * INTO r FROM public.planejamento_revisoes WHERE id = _id AND status = 'rascunho' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rascunho não encontrado'; END IF;
  IF r.conteudo ~* '\[sem fonte\]' THEN RAISE EXCEPTION 'Há afirmações sem fonte; edite antes de aprovar'; END IF;
  UPDATE public.planejamento_revisoes SET status = 'substituido', updated_at = now() WHERE tipo = r.tipo AND status = 'aprovado';
  UPDATE public.planejamento_revisoes SET status = 'aprovado', aprovado_por = auth.uid(), aprovado_em = now(), updated_at = now(),
    aprovado_por_nome = (SELECT COALESCE(display_name, email) FROM public.profiles WHERE user_id = auth.uid()) WHERE id = _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.planejamento_aprovar(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.planejamento_aprovar(uuid) TO authenticated;
