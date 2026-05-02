
CREATE TYPE diagnostico_framework AS ENUM ('PESTEL','Porter','RBV_VRIN','Oceano_Azul','SWOT','Ansoff','Geral');
CREATE TYPE diagnostico_insight_status AS ENUM ('pendente','aprovado','arquivado');

CREATE TABLE public.diagnostico_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework diagnostico_framework NOT NULL DEFAULT 'Geral',
  categoria text,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  evidencias text,
  ai_resumo text,
  ai_classificacao jsonb DEFAULT '{}'::jsonb,
  ai_sugestoes text,
  status diagnostico_insight_status NOT NULL DEFAULT 'pendente',
  autor uuid,
  autor_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostico_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY di_select_auth ON public.diagnostico_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY di_insert_auth ON public.diagnostico_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor);
CREATE POLICY di_update_pmo ON public.diagnostico_insights FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo') OR auth.uid() = autor)
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo') OR auth.uid() = autor);
CREATE POLICY di_delete_admin ON public.diagnostico_insights FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'));

CREATE TRIGGER trg_di_updated BEFORE UPDATE ON public.diagnostico_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
