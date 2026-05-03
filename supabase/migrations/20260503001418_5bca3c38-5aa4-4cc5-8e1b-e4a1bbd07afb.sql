
CREATE TABLE public.estrategia_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ferramenta text NOT NULL,
  titulo text NOT NULL,
  conteudo text,
  tipo_arquivo text,
  arquivo_nome text,
  arquivo_path text,
  arquivo_tamanho integer,
  autor uuid,
  autor_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estrategia_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY ei_select_auth ON public.estrategia_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY ei_insert_own ON public.estrategia_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor);
CREATE POLICY ei_update_own_or_pmo ON public.estrategia_insights FOR UPDATE TO authenticated
  USING (auth.uid() = autor OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'))
  WITH CHECK (auth.uid() = autor OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'));
CREATE POLICY ei_delete_own_or_pmo ON public.estrategia_insights FOR DELETE TO authenticated
  USING (auth.uid() = autor OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'));

CREATE TRIGGER trg_estrategia_insights_updated
BEFORE UPDATE ON public.estrategia_insights
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('estrategia-insights','estrategia-insights', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "estrategia_insights_select_auth"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'estrategia-insights');

CREATE POLICY "estrategia_insights_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'estrategia-insights' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "estrategia_insights_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'estrategia-insights' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "estrategia_insights_delete_own_or_pmo"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'estrategia-insights' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo')));
