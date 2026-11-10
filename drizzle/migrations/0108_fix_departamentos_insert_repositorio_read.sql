DROP POLICY IF EXISTS dep_insert_auth ON public.departamentos;
CREATE POLICY dep_insert_admin ON public.departamentos FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS rdb_select_auth ON storage.objects;
CREATE POLICY rdb_select_auth ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'repositorio-docs' AND (
    owner_id = (select auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.repositorio_documentos d WHERE d.arquivo_path = storage.objects.name)
  )
);