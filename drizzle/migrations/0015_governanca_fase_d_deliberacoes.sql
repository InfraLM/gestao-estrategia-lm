CREATE OR REPLACE FUNCTION public.gov_codigo_deliberacao(_comite text, _data timestamptz, _indice integer)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
 SELECT 'GOV-' || _comite || '-' || to_char(_data AT TIME ZONE 'UTC','YYYYMMDD') || '-' || lpad((_indice+1)::text,2,'0');
$$;
CREATE OR REPLACE FUNCTION public.gov_deliberacao_reservada(_titulo text, _pauta text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM unnest(ARRAY['clt',' pj','pj ','contratacao de','demissao','desligamento','transferencia','relocacao','promocao','cargo de']) termo
 WHERE strpos(lower(translate(coalesce(_titulo,'') || ' ' || coalesce(_pauta,''),'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),termo)>0);
$$;
REVOKE ALL ON FUNCTION public.gov_codigo_deliberacao(text,timestamptz,integer), public.gov_deliberacao_reservada(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gov_codigo_deliberacao(text,timestamptz,integer), public.gov_deliberacao_reservada(text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.gov_publicar_deliberacoes()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE afetadas integer;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 INSERT INTO public.decisoes_estrategicas AS destino
 (codigo,titulo,decisao,racional,opcoes_descartadas,tradeoff,premissas,data_decisao,pergunta,decisor,papeis_rapid,revisao,reuniao_origem,tipo_forum,comite_codigo,foruns_citados,responsavel,impacto_bsc,fonte,observacoes,acesso_reservado)
 SELECT DISTINCT ON (public.gov_codigo_deliberacao(d.comite_codigo,d.reuniao_data,d.indice))
 public.gov_codigo_deliberacao(d.comite_codigo,d.reuniao_data,d.indice),left(d.titulo,200),d.titulo,d.racional,NULL,NULL,NULL,(d.reuniao_data AT TIME ZONE 'UTC')::date,d.pauta,'Comitê '||d.comite_codigo,NULL,NULL,d.reuniao_titulo||' ('||to_char(d.reuniao_data AT TIME ZONE 'UTC','DD/MM/YYYY')||')','ritual_executivo',d.comite_codigo,ARRAY[d.comite_codigo],NULL,'A confirmar','App de Governança — deliberação registrada na reunião','Importada automaticamente da Governança; editar na origem',public.gov_deliberacao_reservada(d.titulo,d.pauta)
 FROM public.gov_deliberacoes d
 WHERE d.comite_codigo ~ '^[A-Za-z]+$' AND d.reuniao_data IS NOT NULL AND d.titulo IS NOT NULL AND d.indice BETWEEN 0 AND 98
 ORDER BY public.gov_codigo_deliberacao(d.comite_codigo,d.reuniao_data,d.indice),d.reuniao_updated_at DESC NULLS LAST,d.reuniao_origem_id
 ON CONFLICT(codigo) DO UPDATE SET
 titulo=EXCLUDED.titulo,decisao=EXCLUDED.decisao,racional=EXCLUDED.racional,pergunta=EXCLUDED.pergunta,data_decisao=EXCLUDED.data_decisao,reuniao_origem=EXCLUDED.reuniao_origem,comite_codigo=EXCLUDED.comite_codigo,foruns_citados=EXCLUDED.foruns_citados,acesso_reservado=EXCLUDED.acesso_reservado
 WHERE (destino.titulo,destino.decisao,destino.racional,destino.pergunta,destino.data_decisao,destino.reuniao_origem,destino.comite_codigo,destino.foruns_citados,destino.acesso_reservado)
 IS DISTINCT FROM (EXCLUDED.titulo,EXCLUDED.decisao,EXCLUDED.racional,EXCLUDED.pergunta,EXCLUDED.data_decisao,EXCLUDED.reuniao_origem,EXCLUDED.comite_codigo,EXCLUDED.foruns_citados,EXCLUDED.acesso_reservado);
 GET DIAGNOSTICS afetadas=ROW_COUNT;
 RETURN afetadas;
END; $$;
REVOKE ALL ON FUNCTION public.gov_publicar_deliberacoes() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gov_publicar_deliberacoes() TO service_role;
CREATE OR REPLACE FUNCTION public.gov_configurar_cron_diario(_token text,_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _job bigint;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _token IS NULL OR length(_token)<32 THEN RAISE EXCEPTION 'Secret ausente'; END IF;
 IF _url IS NULL OR _url !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/governanca-sincronizar$' THEN RAISE EXCEPTION 'Destino inválido'; END IF;
 SELECT jobid INTO _job FROM cron.job WHERE jobname='governanca-sync-diaria-completa';
 IF _job IS NOT NULL THEN PERFORM cron.unschedule(_job); END IF;
 PERFORM cron.schedule('governanca-sync-diaria-completa','17 3 * * *',format('SELECT net.http_post(url := %L, headers := %L::jsonb, body := ''{}''::jsonb, timeout_milliseconds := 60000);',_url,jsonb_build_object('Content-Type','application/json','x-cron-token',_token,'x-sync-modo','completa')::text));
END; $$;
REVOKE ALL ON FUNCTION public.gov_configurar_cron_diario(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gov_configurar_cron_diario(text,text) TO service_role;