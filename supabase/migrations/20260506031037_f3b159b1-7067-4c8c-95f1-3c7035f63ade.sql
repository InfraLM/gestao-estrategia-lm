
CREATE TABLE IF NOT EXISTS public.bc_scorecard_submissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  proponente text,
  area text,
  tipo_projeto text NOT NULL DEFAULT 'eficiencia', -- 'eficiencia' | 'produto'
  problema text,
  hipotese text,
  publico_alvo text,
  roi_pct numeric,
  payback_meses numeric,
  evidencia_demanda text,
  pct_base_demanda numeric,
  qualidade_fonte text,
  risco_juridico text,
  risco_reputacional text,
  risco_clinico text,
  peso_tecnico text,
  sequestro_capacidade_pct numeric,
  conflito_fila text,
  janela_exclusividade smallint,
  janela_urgencia smallint,
  janela_custo_inacao smallint,
  arquivo_path text,
  arquivo_nome text,
  arquivo_tipo text,
  arquivo_tamanho integer,
  status text NOT NULL DEFAULT 'pendente', -- pendente | analisando | analisado | erro
  ai_gate text, -- saudavel | condicional | bloqueado
  ai_resumo text,
  ai_resultado jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_erro text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bc_scorecard_submissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY bc_sc_select_auth ON public.bc_scorecard_submissoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY bc_sc_insert_auth ON public.bc_scorecard_submissoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY bc_sc_update_pmo ON public.bc_scorecard_submissoes
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR auth.uid() = created_by)
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR auth.uid() = created_by);

CREATE POLICY bc_sc_delete_pmo ON public.bc_scorecard_submissoes
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

CREATE TRIGGER bc_sc_updated_at BEFORE UPDATE ON public.bc_scorecard_submissoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('business-cases','business-cases', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY bc_storage_select ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'business-cases');

CREATE POLICY bc_storage_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business-cases' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY bc_storage_delete ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'business-cases' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role)));
