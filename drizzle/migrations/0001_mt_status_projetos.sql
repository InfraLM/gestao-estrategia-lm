CREATE TABLE public.mt_status_projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_codigo text NOT NULL,
  competencia text NOT NULL,
  cadeira_id uuid REFERENCES public.mt_cadeiras(id),
  saude text,
  pct_cronograma numeric,
  entregas text,
  custo_realizado numeric,
  equipe text,
  recursos text,
  avancos text,
  desvios text,
  arquivo_path text,
  arquivo_nome text,
  enviado_por uuid,
  enviado_por_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (projeto_codigo, competencia)
);
GRANT SELECT, INSERT, UPDATE ON public.mt_status_projetos TO authenticated;
GRANT ALL ON public.mt_status_projetos TO service_role;
ALTER TABLE public.mt_status_projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_select" ON public.mt_status_projetos FOR SELECT TO authenticated USING (true);
CREATE POLICY "msp_insert" ON public.mt_status_projetos FOR INSERT TO authenticated
  WITH CHECK (public.mt_is_governanca(auth.uid()) OR cadeira_id = public.mt_cadeira_do_usuario(auth.uid()));
CREATE POLICY "msp_update" ON public.mt_status_projetos FOR UPDATE TO authenticated
  USING (public.mt_is_governanca(auth.uid()) OR cadeira_id = public.mt_cadeira_do_usuario(auth.uid()));
CREATE TRIGGER msp_updated BEFORE UPDATE ON public.mt_status_projetos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "status_reports_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'status-reports');
CREATE POLICY "status_reports_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'status-reports');