-- Storage bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('backlog-submissoes', 'backlog-submissoes', false)
ON CONFLICT (id) DO NOTHING;

-- Policies storage: leitura/escrita para autenticados; delete só pmo/admin
CREATE POLICY "backlog_sub_read_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'backlog-submissoes');

CREATE POLICY "backlog_sub_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'backlog-submissoes' AND auth.uid() IS NOT NULL);

CREATE POLICY "backlog_sub_delete_pmo" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'backlog-submissoes' AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo')
  ));

-- Submissões
CREATE TABLE public.backlog_submissoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  arquivo_nome text NOT NULL,
  arquivo_path text NOT NULL,
  arquivo_tipo text,
  arquivo_tamanho integer,
  status text NOT NULL DEFAULT 'pendente', -- pendente | processando | processado | erro
  resumo_ia text,
  erro text,
  submitted_by uuid NOT NULL,
  submitted_by_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backlog_submissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bsub_select_auth" ON public.backlog_submissoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "bsub_insert_auth" ON public.backlog_submissoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "bsub_update_pmo" ON public.backlog_submissoes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE POLICY "bsub_delete_pmo" ON public.backlog_submissoes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));

CREATE TRIGGER trg_bsub_updated BEFORE UPDATE ON public.backlog_submissoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Propostas IA
CREATE TABLE public.backlog_propostas_ia (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submissao_id uuid NOT NULL REFERENCES public.backlog_submissoes(id) ON DELETE CASCADE,
  acao text NOT NULL, -- criar | atualizar | vincular
  iniciativa_ref text, -- id existente quando 'atualizar' / 'vincular'
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, -- dados sugeridos (titulo, tipo, wave, vinculos, etc.)
  justificativa text,
  confianca numeric, -- 0..1
  status text NOT NULL DEFAULT 'pendente', -- pendente | aprovada | rejeitada
  revisado_por uuid,
  revisado_em timestamptz,
  observacao_revisao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backlog_propostas_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bprop_select_auth" ON public.backlog_propostas_ia
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "bprop_insert_pmo" ON public.backlog_propostas_ia
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE POLICY "bprop_update_pmo" ON public.backlog_propostas_ia
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE POLICY "bprop_delete_pmo" ON public.backlog_propostas_ia
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));

CREATE TRIGGER trg_bprop_updated BEFORE UPDATE ON public.backlog_propostas_ia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bprop_submissao ON public.backlog_propostas_ia(submissao_id);
CREATE INDEX idx_bprop_status ON public.backlog_propostas_ia(status);