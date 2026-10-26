ALTER TABLE public.fitfinder_integracao_config ADD COLUMN diretores_podem_ler boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.fitfinder_integracao_config.diretores_podem_ler IS 'Liberação futura opcional; desligada inicialmente. Não concede acesso ao módulo Estrutura.';
CREATE TABLE public.fitfinder_diretoria_cadeiras (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), diretoria text NOT NULL, cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id),
 status text NOT NULL DEFAULT 'sugerido' CHECK(status IN ('sugerido','confirmado')),
 confirmado_por uuid, confirmado_em timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(diretoria,cadeira_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fitfinder_diretoria_cadeiras TO authenticated;
GRANT ALL ON public.fitfinder_diretoria_cadeiras TO service_role;
ALTER TABLE public.fitfinder_diretoria_cadeiras ENABLE ROW LEVEL SECURITY;
INSERT INTO public.fitfinder_diretoria_cadeiras(diretoria,cadeira_id,status,confirmado_por,confirmado_em,created_at)
 SELECT diretoria,cadeira_id,status,confirmado_por,confirmado_em,created_at FROM public.fitfinder_diretoria_cadeira WHERE cadeira_id IS NOT NULL ON CONFLICT DO NOTHING;
COMMENT ON TABLE public.fitfinder_diretoria_cadeira IS 'DEPRECATED: replaced by fitfinder_diretoria_cadeiras (unique diretoria/cadeira pairs); retained for deployed legacy clients.';
CREATE OR REPLACE FUNCTION public.fitfinder_pode_ler(_diretoria text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND (public.proj_gov_ou_ceo(auth.uid()) OR (
 coalesce((SELECT diretores_podem_ler FROM public.fitfinder_integracao_config WHERE id=true),false)
 AND EXISTS(SELECT 1 FROM public.fitfinder_diretoria_cadeiras m JOIN public.mt_cadeiras c ON c.id=m.cadeira_id
 WHERE m.diretoria=_diretoria AND m.status='confirmado' AND c.ativo AND (c.diretor_user_id=auth.uid() OR c.id=public.mt_cadeira_do_usuario(auth.uid())))))
$$;
REVOKE ALL ON FUNCTION public.fitfinder_pode_ler(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fitfinder_pode_ler(text) TO authenticated,service_role;
CREATE TRIGGER fitfinder_mapa_guard BEFORE INSERT OR UPDATE ON public.fitfinder_diretoria_cadeiras FOR EACH ROW EXECUTE FUNCTION public.fitfinder_mapa_guard();
CREATE POLICY ler ON public.fitfinder_diretoria_cadeiras FOR SELECT TO authenticated USING(public.fitfinder_pode_ler(diretoria));
CREATE POLICY inserir_gov ON public.fitfinder_diretoria_cadeiras FOR INSERT TO authenticated WITH CHECK(public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY editar_gov ON public.fitfinder_diretoria_cadeiras FOR UPDATE TO authenticated USING(public.proj_gov_ou_ceo(auth.uid())) WITH CHECK(public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY remover_gov ON public.fitfinder_diretoria_cadeiras FOR DELETE TO authenticated USING(public.proj_gov_ou_ceo(auth.uid()));