CREATE TABLE public.proc_integracao_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  ativo boolean NOT NULL DEFAULT false,
  atualizado_por uuid, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.proc_integracao_config (id) VALUES (true);
CREATE TABLE public.proc_espelho_processos (
  origem_id text PRIMARY KEY, codigo text, nome text, macro_codigo text, macro_nome text,
  dono_nome text, dono_email text, diretoria text, diretor text, status_mapeamento text, status_implantacao text,
  maturidade_nivel numeric, maturidade_gate text, maturidade_nota numeric, maturidade_fragilidade boolean, maturidade_avaliado_em date,
  matriz_impacto jsonb NOT NULL DEFAULT '{}'::jsonb, ativo boolean NOT NULL DEFAULT true,
  origem_atualizado_em timestamptz, sincronizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.proc_espelho_impactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), processo_origem_id text NOT NULL, kpi_codigo text, kpi_nome text NOT NULL,
  vinculo text, tipo text, grau_hoje numeric, grau_alvo numeric, prioridade text, mecanismo text, defasagem text, baseline_meta text,
  icep numeric, icep_em date, sincronizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (processo_origem_id, kpi_nome)
);
CREATE TABLE public.proc_espelho_melhorias (
  origem_id text PRIMARY KEY, processo_codigo text, titulo text NOT NULL, status text, prioridade text, responsavel text,
  automacao boolean, criada_em date, previsao date, implantada_em date, ativo boolean NOT NULL DEFAULT true,
  sincronizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.proc_kpi_correspondencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kpi_chave text NOT NULL UNIQUE, kpi_nome_origem text NOT NULL, kpi_codigo_origem text,
  indicador_id uuid, status text NOT NULL DEFAULT 'sugerido' CHECK (status IN ('sugerido','confirmado','sem_correspondencia')),
  confirmado_por uuid, confirmado_em timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.proc_diretoria_cadeira (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), diretoria text NOT NULL UNIQUE, cadeira_id uuid,
  status text NOT NULL DEFAULT 'sugerido' CHECK (status IN ('sugerido','confirmado')),
  confirmado_por uuid, confirmado_em timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.proc_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), iniciado_em timestamptz NOT NULL DEFAULT now(), concluido_em timestamptz,
  ok boolean, modo text, processos integer, impactos integer, melhorias integer, mensagem text
);
GRANT SELECT ON public.proc_integracao_config, public.proc_espelho_processos, public.proc_espelho_impactos, public.proc_espelho_melhorias, public.proc_sync_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.proc_kpi_correspondencia, public.proc_diretoria_cadeira TO authenticated;
GRANT UPDATE ON public.proc_integracao_config TO authenticated;
GRANT ALL ON public.proc_integracao_config, public.proc_espelho_processos, public.proc_espelho_impactos, public.proc_espelho_melhorias, public.proc_kpi_correspondencia, public.proc_diretoria_cadeira, public.proc_sync_log TO service_role;
ALTER TABLE public.proc_integracao_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proc_espelho_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proc_espelho_impactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proc_espelho_melhorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proc_kpi_correspondencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proc_diretoria_cadeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proc_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ler ON public.proc_espelho_processos FOR SELECT TO authenticated USING (public.rotina_ve_todas(auth.uid()) OR public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY ler ON public.proc_espelho_impactos FOR SELECT TO authenticated USING (public.rotina_ve_todas(auth.uid()) OR public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY ler ON public.proc_espelho_melhorias FOR SELECT TO authenticated USING (public.rotina_ve_todas(auth.uid()) OR public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY ler ON public.proc_kpi_correspondencia FOR SELECT TO authenticated USING (public.rotina_ve_todas(auth.uid()) OR public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY ler ON public.proc_diretoria_cadeira FOR SELECT TO authenticated USING (public.rotina_ve_todas(auth.uid()) OR public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY ler ON public.proc_sync_log FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY ler ON public.proc_integracao_config FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY editar_gov ON public.proc_integracao_config FOR UPDATE TO authenticated USING (public.proj_gov_ou_ceo(auth.uid())) WITH CHECK (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY inserir_gov ON public.proc_kpi_correspondencia FOR INSERT TO authenticated WITH CHECK (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY editar_gov ON public.proc_kpi_correspondencia FOR UPDATE TO authenticated USING (public.proj_gov_ou_ceo(auth.uid())) WITH CHECK (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY inserir_gov ON public.proc_diretoria_cadeira FOR INSERT TO authenticated WITH CHECK (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY editar_gov ON public.proc_diretoria_cadeira FOR UPDATE TO authenticated USING (public.proj_gov_ou_ceo(auth.uid())) WITH CHECK (public.proj_gov_ou_ceo(auth.uid()));