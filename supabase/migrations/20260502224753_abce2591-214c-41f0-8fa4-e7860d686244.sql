
-- Business Case simplificado para Melhorias Contínuas (1:1 com projeto)
CREATE TABLE public.melhoria_business_case (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL UNIQUE,
  area_responsavel text,
  responsavel text,
  problema_descricao text,
  problema_evidencias text,
  processo_impactado text,
  areas_envolvidas text,
  amplitude_outra_area boolean DEFAULT false,
  amplitude_processo_corporativo boolean DEFAULT false,
  amplitude_sistema boolean DEFAULT false,
  amplitude_impacto_financeiro boolean DEFAULT false,
  hipotese_acao text,
  hipotese_resultado text,
  impacto_tempo text,
  impacto_qualidade text,
  impacto_produtividade text,
  impacto_financeiro text,
  esforco_tempo text,
  esforco_recursos text,
  esforco_dependencias text,
  criterio_sucesso text,
  kpis jsonb NOT NULL DEFAULT '[]'::jsonb,
  okr_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.melhoria_business_case ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mbc_select_auth" ON public.melhoria_business_case FOR SELECT TO authenticated USING (true);
CREATE POLICY "mbc_write_pmo_or_esp" ON public.melhoria_business_case FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR is_especialista_of(auth.uid(), projeto_id))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR is_especialista_of(auth.uid(), projeto_id));

CREATE TRIGGER trg_mbc_updated BEFORE UPDATE ON public.melhoria_business_case
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
