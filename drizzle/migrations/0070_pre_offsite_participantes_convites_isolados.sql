CREATE TABLE public.offsite_participantes (
 email text PRIMARY KEY CHECK (email = lower(trim(email))),
 nome text NOT NULL,
 cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id),
 perfil text NOT NULL DEFAULT 'diretor' CHECK (perfil='diretor'),
 ativo boolean NOT NULL DEFAULT true,
 convite_id uuid REFERENCES public.usuario_convites(id),
 criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.offsite_participantes TO authenticated;
GRANT ALL ON public.offsite_participantes TO service_role;
ALTER TABLE public.offsite_participantes ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.offsite_cadeira() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p.cadeira_id FROM public.offsite_participantes p
 JOIN auth.users u ON lower(trim(u.email))=p.email
 JOIN public.mt_cadeiras c ON c.id=p.cadeira_id AND c.ativo
 WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL AND p.ativo AND p.perfil='diretor'
 LIMIT 1
$$;
CREATE POLICY propria ON public.offsite_participantes FOR SELECT TO authenticated USING (public.offsite_admin() OR cadeira_id=public.offsite_cadeira());
CREATE POLICY administrar ON public.offsite_participantes FOR ALL TO authenticated USING (public.offsite_admin()) WITH CHECK (public.offsite_admin());
COMMENT ON TABLE public.offsite_participantes IS 'Participação exclusiva no Pré-Offsite por e-mail verificado e cadeira existente; não concede papéis ou acessos em outros módulos. Administração é independente da participação.';