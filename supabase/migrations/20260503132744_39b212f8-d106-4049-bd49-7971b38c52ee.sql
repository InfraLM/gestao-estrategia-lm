
CREATE TABLE IF NOT EXISTS public.repositorio_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repositorio text NOT NULL,
  nome text NOT NULL,
  versao text NOT NULL DEFAULT 'v1',
  status text NOT NULL DEFAULT 'em_aprovacao',
  origem text,
  observacoes text,
  arquivo_path text,
  arquivo_nome text,
  arquivo_tamanho integer,
  arquivo_tipo text,
  submitted_by uuid NOT NULL,
  submitted_by_nome text,
  aprovado_por uuid,
  aprovado_por_nome text,
  aprovado_em timestamptz,
  proxima_revisao date,
  motivo_rejeicao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.repositorio_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY rd_select_auth ON public.repositorio_documentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY rd_insert_auth ON public.repositorio_documentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY rd_update_owner_or_pmo ON public.repositorio_documentos
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pmo'::app_role)
    OR (auth.uid() = submitted_by AND status IN ('em_aprovacao','rascunho','rejeitado'))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pmo'::app_role)
    OR (auth.uid() = submitted_by AND status IN ('em_aprovacao','rascunho','rejeitado'))
  );

CREATE POLICY rd_delete_owner_or_pmo ON public.repositorio_documentos
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'pmo'::app_role)
    OR (auth.uid() = submitted_by AND status IN ('em_aprovacao','rascunho','rejeitado'))
  );

CREATE TRIGGER trg_rd_updated_at
  BEFORE UPDATE ON public.repositorio_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_rd_repositorio_status ON public.repositorio_documentos(repositorio, status);
CREATE INDEX IF NOT EXISTS idx_rd_proxima_revisao ON public.repositorio_documentos(proxima_revisao);

-- Bucket privado para arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('repositorio-docs','repositorio-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY rdb_select_auth ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'repositorio-docs');

CREATE POLICY rdb_insert_auth ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'repositorio-docs');

CREATE POLICY rdb_update_pmo ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'repositorio-docs' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role)));

CREATE POLICY rdb_delete_pmo ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'repositorio-docs' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role)));
