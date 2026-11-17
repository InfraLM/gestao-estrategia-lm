DROP POLICY IF EXISTS "mt ler" ON public.mt_auditoria;
CREATE POLICY "mt ler" ON public.mt_auditoria FOR SELECT TO authenticated USING (public.mt_is_governanca(auth.uid()));