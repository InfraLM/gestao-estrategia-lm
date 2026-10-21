CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.gov_acoes_da_cadeira(_cadeira uuid)
RETURNS TABLE(id uuid, origem_id uuid, titulo text, descricao text, responsavel_origem text, prazo date, status text, prioridade text, precisa_escalar boolean, comite_codigo text, reuniao_titulo text, reuniao_data timestamptz, outros_responsaveis text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT a.id, a.origem_id, a.titulo, a.descricao, a.responsavel_origem, a.prazo, a.status, a.prioridade, a.precisa_escalar, a.comite_codigo, a.reuniao_titulo, a.reuniao_data,
 ARRAY(SELECT DISTINCT c.nome FROM public.gov_responsaveis_map m2 JOIN public.gov_responsaveis_map_cadeiras mc2 ON mc2.map_id=m2.id JOIN public.mt_cadeiras c ON c.id=mc2.mt_cadeira_id WHERE m2.nome_normalizado=a.responsavel_normalizado AND m2.situacao='mapeado' AND mc2.mt_cadeira_id<>_cadeira ORDER BY c.nome)
 FROM public.gov_acoes a
 WHERE auth.uid() IS NOT NULL
 AND (public.gov_is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.mt_cadeiras c WHERE c.id=_cadeira AND c.diretor_user_id=auth.uid()))
 AND a.concluida_em IS NULL
 AND lower(translate(trim(coalesce(a.status,'')), 'áàâãéêíóôõúç', 'aaaaeeiooouc')) NOT IN ('concluido','concluida','cancelado','cancelada')
 AND EXISTS(SELECT 1 FROM public.gov_responsaveis_map m JOIN public.gov_responsaveis_map_cadeiras mc ON mc.map_id=m.id WHERE m.nome_normalizado=a.responsavel_normalizado AND m.situacao='mapeado' AND mc.mt_cadeira_id=_cadeira);
$$;
REVOKE ALL ON FUNCTION public.gov_acoes_da_cadeira(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.gov_acoes_da_cadeira(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.gov_ultima_sincronizacao(_cadeira uuid)
RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT max(concluido_em) FROM public.gov_sync_log WHERE ok=true AND auth.uid() IS NOT NULL AND (public.gov_is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.mt_cadeiras c WHERE c.id=_cadeira AND c.diretor_user_id=auth.uid())); $$;
REVOKE ALL ON FUNCTION public.gov_ultima_sincronizacao(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.gov_ultima_sincronizacao(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.gov_configurar_cron(_token text, _url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE _job bigint;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _token IS NULL OR length(_token)<32 THEN RAISE EXCEPTION 'Secret ausente'; END IF;
 IF _url IS NULL OR _url !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/governanca-sincronizar$' THEN RAISE EXCEPTION 'Destino inválido'; END IF;
 SELECT jobid INTO _job FROM cron.job WHERE jobname='governanca-sync-horaria';
 IF _job IS NOT NULL THEN PERFORM cron.unschedule(_job); END IF;
 PERFORM cron.schedule('governanca-sync-horaria','7 * * * *',format('SELECT net.http_post(url := %L, headers := %L::jsonb, body := ''{}''::jsonb, timeout_milliseconds := 60000);',_url,jsonb_build_object('Content-Type','application/json','x-cron-token',_token)::text));
END; $$;
REVOKE ALL ON FUNCTION public.gov_configurar_cron(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gov_configurar_cron(text,text) TO service_role;