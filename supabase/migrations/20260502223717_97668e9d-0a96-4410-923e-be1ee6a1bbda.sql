-- Especialista enum
DO $$ BEGIN
  CREATE TYPE public.especialista_enum AS ENUM ('Rafaella Ferraz','Renata Campos','Não atribuída');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Projetos: especialista + alias de email
ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS especialista especialista_enum NOT NULL DEFAULT 'Não atribuída',
  ADD COLUMN IF NOT EXISTS email_alias text;

CREATE INDEX IF NOT EXISTS idx_projetos_especialista ON public.projetos(especialista);
CREATE UNIQUE INDEX IF NOT EXISTS uq_projetos_email_alias ON public.projetos(email_alias) WHERE email_alias IS NOT NULL;

-- Função utilitária: usuário é especialista do projeto?
CREATE OR REPLACE FUNCTION public.is_especialista_of(_user_id uuid, _projeto_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projetos p
    JOIN public.profiles pr ON pr.user_id = _user_id
    WHERE p.id = _projeto_id
      AND p.especialista::text = pr.display_name
  );
$$;

-- ===== status_report_drafts =====
DO $$ BEGIN
  CREATE TYPE public.draft_status_enum AS ENUM ('pendente','aprovado','rejeitado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.status_report_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  origem text NOT NULL DEFAULT 'gmail',                 -- gmail | manual
  gmail_message_id text,
  remetente text,
  assunto text,
  corpo_texto text,
  corpo_html text,
  anexos jsonb NOT NULL DEFAULT '[]'::jsonb,            -- [{nome,tamanho,mime,storage_path}]
  periodo text,                                          -- ex.: 2026/1
  status draft_status_enum NOT NULL DEFAULT 'pendente',
  aprovado_por uuid,
  aprovado_em timestamptz,
  observacoes_aprovacao text,
  status_report_id uuid,                                 -- referência ao status_reports criado
  recebido_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_drafts_projeto ON public.status_report_drafts(projeto_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.status_report_drafts(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_drafts_gmail_msg ON public.status_report_drafts(gmail_message_id) WHERE gmail_message_id IS NOT NULL;

ALTER TABLE public.status_report_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY drafts_select_auth ON public.status_report_drafts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY drafts_insert_pmo ON public.status_report_drafts
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo') OR is_especialista_of(auth.uid(), projeto_id));

CREATE POLICY drafts_update_pmo_or_esp ON public.status_report_drafts
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo') OR is_especialista_of(auth.uid(), projeto_id))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo') OR is_especialista_of(auth.uid(), projeto_id));

CREATE POLICY drafts_delete_admin ON public.status_report_drafts
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'));

CREATE TRIGGER trg_drafts_updated BEFORE UPDATE ON public.status_report_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== projeto_reunioes =====
CREATE TABLE IF NOT EXISTS public.projeto_reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  google_event_id text,
  calendar_id text,
  titulo text NOT NULL,
  descricao text,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  participantes jsonb NOT NULL DEFAULT '[]'::jsonb,
  meet_link text,
  html_link text,
  cor text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reunioes_projeto ON public.projeto_reunioes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_inicio ON public.projeto_reunioes(inicio);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reunioes_event ON public.projeto_reunioes(google_event_id) WHERE google_event_id IS NOT NULL;

ALTER TABLE public.projeto_reunioes ENABLE ROW LEVEL SECURITY;

CREATE POLICY reunioes_select_auth ON public.projeto_reunioes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY reunioes_write_pmo ON public.projeto_reunioes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo') OR is_especialista_of(auth.uid(), projeto_id))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo') OR is_especialista_of(auth.uid(), projeto_id));

CREATE TRIGGER trg_reunioes_updated BEFORE UPDATE ON public.projeto_reunioes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== gmail_processados =====
CREATE TABLE IF NOT EXISTS public.gmail_processados (
  message_id text PRIMARY KEY,
  thread_id text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  resultado text NOT NULL DEFAULT 'ok',                  -- ok | sem_match | erro
  draft_id uuid
);
ALTER TABLE public.gmail_processados ENABLE ROW LEVEL SECURITY;
CREATE POLICY gmail_proc_select_auth ON public.gmail_processados
  FOR SELECT TO authenticated USING (true);
CREATE POLICY gmail_proc_admin ON public.gmail_processados
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'));

-- ===== Bucket público (para anexos baixados via Gmail) — usa o existente "entregas" =====
-- nada a fazer, reutilizamos.