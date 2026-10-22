CREATE TABLE public.estrategia_vinculos_gov (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_tipo text NOT NULL CHECK (origem_tipo IN ('acao','decisao')),
  origem_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('objetivo','indicador')),
  ref_id uuid NOT NULL,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origem_tipo, origem_id, tipo, ref_id)
);
GRANT SELECT, INSERT, DELETE ON public.estrategia_vinculos_gov TO authenticated;
GRANT ALL ON public.estrategia_vinculos_gov TO service_role;
ALTER TABLE public.estrategia_vinculos_gov ENABLE ROW LEVEL SECURITY;
CREATE POLICY evg_ler ON public.estrategia_vinculos_gov FOR SELECT TO authenticated
  USING (public.rotina_ve_todas(auth.uid()) OR public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY evg_inserir ON public.estrategia_vinculos_gov FOR INSERT TO authenticated
  WITH CHECK (public.proj_gov_ou_ceo(auth.uid()) AND criado_por = auth.uid());
CREATE POLICY evg_apagar ON public.estrategia_vinculos_gov FOR DELETE TO authenticated
  USING (public.proj_gov_ou_ceo(auth.uid()));