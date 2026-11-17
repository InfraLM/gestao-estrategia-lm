-- Quick Wins invitation e-mails: one record per leader per cycle, written only by the rotina-avisos-enviar
-- edge function (service role) after a successful send. Additive; Governance reads, clients never write.
CREATE TABLE IF NOT EXISTS public.qw_convites_email (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ciclo_id uuid NOT NULL REFERENCES public.qw_ciclos(id),
 lider_id uuid NOT NULL REFERENCES public.qw_lideres(id),
 email text NOT NULL,
 provedor_id text,
 enviado_por uuid,
 enviado_em timestamptz NOT NULL DEFAULT now(),
 UNIQUE (ciclo_id, lider_id)
);
CREATE INDEX IF NOT EXISTS qw_convites_email_lider ON public.qw_convites_email(lider_id);
ALTER TABLE public.qw_convites_email ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qw_convites_email FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.qw_convites_email TO authenticated;
GRANT ALL ON public.qw_convites_email TO service_role;
DROP POLICY IF EXISTS governanca_le ON public.qw_convites_email;
CREATE POLICY governanca_le ON public.qw_convites_email FOR SELECT TO authenticated USING (public.mt_is_governanca(auth.uid()));
