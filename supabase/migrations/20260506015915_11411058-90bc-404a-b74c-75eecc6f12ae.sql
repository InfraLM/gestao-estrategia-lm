DROP POLICY IF EXISTS ri_write_pmo ON public.riscos_institucionais;
CREATE POLICY ri_write_pmo ON public.riscos_institucionais
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));