
ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS imagem_fluxo_url text,
  ADD COLUMN IF NOT EXISTS kpi_nome text,
  ADD COLUMN IF NOT EXISTS kpi_meta numeric,
  ADD COLUMN IF NOT EXISTS kpi_unidade text;

-- Bucket público para imagens de fluxo
INSERT INTO storage.buckets (id, name, public)
VALUES ('processo-fluxos', 'processo-fluxos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies do bucket (público de leitura; escrita restrita a admin/pmo)
DO $$ BEGIN
  CREATE POLICY "fluxos_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'processo-fluxos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "fluxos_pmo_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'processo-fluxos' AND (
      has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "fluxos_pmo_update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'processo-fluxos' AND (
      has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "fluxos_pmo_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'processo-fluxos' AND (
      has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
