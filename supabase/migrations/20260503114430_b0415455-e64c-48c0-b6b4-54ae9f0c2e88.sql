-- Processos table
CREATE TABLE public.processos (
  id text PRIMARY KEY,
  nome text NOT NULL,
  nivel text,
  revisao integer,
  diretor text,
  dono text,
  status text,
  fornecedores jsonb NOT NULL DEFAULT '[]'::jsonb,
  clientes jsonb NOT NULL DEFAULT '[]'::jsonb,
  documentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  vinculo jsonb NOT NULL DEFAULT '{}'::jsonb,
  maturidade numeric,
  kpi_valor numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
CREATE POLICY processos_select_auth ON public.processos FOR SELECT TO authenticated USING (true);
CREATE POLICY processos_write_pmo ON public.processos FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role));
CREATE TRIGGER trg_processos_updated BEFORE UPDATE ON public.processos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Riscos institucionais
CREATE TABLE public.riscos_institucionais (
  id text PRIMARY KEY,
  nome text NOT NULL,
  natureza text,
  tipo text,
  impacto smallint NOT NULL DEFAULT 1,
  ocorrencia smallint NOT NULL DEFAULT 1,
  status text,
  impacto_financeiro numeric,
  acoes_mitigadoras text,
  responsaveis text,
  due_date text,
  contingencia text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.riscos_institucionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY ri_select_auth ON public.riscos_institucionais FOR SELECT TO authenticated USING (true);
CREATE POLICY ri_write_pmo ON public.riscos_institucionais FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role));
CREATE TRIGGER trg_ri_updated BEFORE UPDATE ON public.riscos_institucionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();