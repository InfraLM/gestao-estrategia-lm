-- lovable-cron-fallback-reviewed: bounded retry queue; enqueue wakes worker, claims arm 10-minute retries, wake unschedules after drain or disabled sender; connect schedules nothing. Up to 144 checks/day only while pending, reviewed with user.
-- Weekly check-in/checkout e-mails through the Gmail API (Google Workspace). Additive only: no existing row is updated or deleted.
-- Worker: edge function rotina-avisos-enviar. Readiness turns true only through its audited connect action. pg_net comes from 0014.

-- 1) Optional recipient allowlist (NULL keeps every eligible chair, preserving current behaviour).
ALTER TABLE public.rotina_avisos_config ADD COLUMN IF NOT EXISTS destinatarios_permitidos text[];

-- 2) Delivery bookkeeping for retries.
ALTER TABLE public.rotina_avisos_envios ADD COLUMN IF NOT EXISTS tentativas integer NOT NULL DEFAULT 0;
ALTER TABLE public.rotina_avisos_envios ADD COLUMN IF NOT EXISTS processando_em timestamptz;
CREATE INDEX IF NOT EXISTS rotina_avisos_fila ON public.rotina_avisos_envios(criado_em) WHERE status IN ('aguardando','processando');

-- 3) Private sender endpoint/token used to wake the worker. No client grants, RLS without policies.
CREATE TABLE IF NOT EXISTS public.rotina_avisos_remetente (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), url text NOT NULL, token text NOT NULL, remetente text,
 configurado_por uuid, configurado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rotina_avisos_remetente ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rotina_avisos_remetente FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.rotina_avisos_remetente TO service_role;

-- 4) Allowlist gate on weekly cycle notices (impediment notices are untouched).
CREATE OR REPLACE FUNCTION public.rotina_avisos_filtrar_permitidos() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE lista text[];
BEGIN
 IF NEW.tipo NOT IN ('abertura','lembrete','manual') THEN RETURN NEW; END IF;
 SELECT destinatarios_permitidos INTO lista FROM public.rotina_avisos_config WHERE id;
 IF lista IS NOT NULL AND NOT (lower(trim(NEW.destinatario)) = ANY(lista)) THEN RETURN NULL; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rotina_avisos_filtrar_permitidos ON public.rotina_avisos_envios;
CREATE TRIGGER rotina_avisos_filtrar_permitidos BEFORE INSERT ON public.rotina_avisos_envios FOR EACH ROW EXECUTE FUNCTION public.rotina_avisos_filtrar_permitidos();
REVOKE ALL ON FUNCTION public.rotina_avisos_filtrar_permitidos() FROM PUBLIC, anon, authenticated;

-- 5) Retry job exists only while something is pending: scheduled when a retry/claim leaves work behind,
--    removed by the wake itself once the queue is empty. No permanent polling.
CREATE OR REPLACE FUNCTION public.rotina_avisos_agendar_retentativa(_ligar boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE job record; existe boolean;
BEGIN
 SELECT EXISTS(SELECT 1 FROM cron.job WHERE jobname='rotina-email-processar') INTO existe;
 IF _ligar AND NOT existe THEN PERFORM cron.schedule('rotina-email-processar','*/10 * * * *','SELECT public.rotina_avisos_acordar();');
 ELSIF NOT _ligar AND existe THEN FOR job IN SELECT jobid FROM cron.job WHERE jobname='rotina-email-processar' LOOP PERFORM cron.unschedule(job.jobid); END LOOP;
 END IF;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'rotina_avisos_agendar_retentativa: %',SQLERRM;
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_agendar_retentativa(boolean) FROM PUBLIC, anon, authenticated;

-- Wake: pings the worker only when something is waiting. Never raises, so enqueueing (e.g. inside a check-in send) never fails.
CREATE OR REPLACE FUNCTION public.rotina_avisos_acordar() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.rotina_avisos_remetente%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.rotina_avisos_remetente WHERE id;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.rotina_avisos_config WHERE id AND remetente_pronto) THEN PERFORM public.rotina_avisos_agendar_retentativa(false); RETURN; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rotina_avisos_envios WHERE canal='email' AND status IN ('aguardando','processando')) THEN PERFORM public.rotina_avisos_agendar_retentativa(false); RETURN; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rotina_avisos_envios WHERE canal='email' AND (status='aguardando' OR (status='processando' AND processando_em<now()-interval '15 minutes'))) THEN RETURN; END IF;
 BEGIN
  PERFORM net.http_post(url:=r.url,headers:=jsonb_build_object('Content-Type','application/json','x-cron-token',r.token),body:='{}'::jsonb,timeout_milliseconds:=5000);
 EXCEPTION WHEN OTHERS THEN RAISE WARNING 'rotina_avisos: não foi possível acordar o remetente: %',SQLERRM;
 END;
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_acordar() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_acordar() TO service_role;

-- One wake per INSERT statement (pg_net delivers after commit, so the worker sees every queued row).
CREATE OR REPLACE FUNCTION public.rotina_avisos_acordar_remetente() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 BEGIN PERFORM public.rotina_avisos_acordar(); EXCEPTION WHEN OTHERS THEN RAISE WARNING 'rotina_avisos_acordar_remetente: %',SQLERRM; END;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS rotina_avisos_acordar_remetente ON public.rotina_avisos_envios;
CREATE TRIGGER rotina_avisos_acordar_remetente AFTER INSERT ON public.rotina_avisos_envios FOR EACH STATEMENT EXECUTE FUNCTION public.rotina_avisos_acordar_remetente();
REVOKE ALL ON FUNCTION public.rotina_avisos_acordar_remetente() FROM PUBLIC, anon, authenticated;

-- 6) Worker claims one batch; stale 'processando' rows retry up to 3 attempts; queued rows older than 14 days expire
--    instead of surprising directors with stale notices (e.g. impediments queued before the sender existed).
CREATE OR REPLACE FUNCTION public.rotina_avisos_reivindicar(_limite integer DEFAULT 10) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE resultado jsonb;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rotina_avisos_config WHERE id AND remetente_pronto) THEN RETURN '[]'::jsonb; END IF;
 UPDATE public.rotina_avisos_envios SET status='falhou',erro='Expirado: mais de 14 dias na fila sem envio',processando_em=NULL
  WHERE status='aguardando' AND criado_em<now()-interval '14 days';
 UPDATE public.rotina_avisos_envios SET status='falhou',erro=coalesce(erro,'Sem confirmação do provedor após 3 tentativas'),processando_em=NULL
  WHERE status='processando' AND processando_em<now()-interval '15 minutes' AND tentativas>=3;
 WITH alvo AS (
  SELECT e.id FROM public.rotina_avisos_envios e WHERE e.canal='email' AND (e.status='aguardando' OR (e.status='processando' AND e.processando_em<now()-interval '15 minutes'))
  ORDER BY e.criado_em LIMIT least(greatest(coalesce(_limite,10),1),50) FOR UPDATE SKIP LOCKED
 ), feitos AS (
  UPDATE public.rotina_avisos_envios e SET status='processando',processando_em=now(),tentativas=e.tentativas+1 FROM alvo WHERE e.id=alvo.id
  RETURNING e.id,e.tipo,e.ciclo,e.nome,e.destinatario,e.pendencias,e.tentativas,e.criado_em
 ) SELECT coalesce(jsonb_agg(jsonb_build_object('id',f.id,'tipo',f.tipo,'ciclo',f.ciclo,'nome',f.nome,'destinatario',f.destinatario,'pendencias',f.pendencias,'tentativas',f.tentativas) ORDER BY f.criado_em),'[]'::jsonb) INTO resultado FROM feitos f;
 -- A claimed row in flight keeps the retry job armed, so a crashed worker run is picked up again.
 IF jsonb_array_length(resultado)>0 THEN PERFORM public.rotina_avisos_agendar_retentativa(true); END IF;
 RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_reivindicar(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_reivindicar(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.rotina_avisos_concluir(_id uuid,_ok boolean,_provedor_id text DEFAULT NULL,_erro text DEFAULT NULL,_reprocessar boolean DEFAULT false) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE novo text;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _id IS NULL OR _ok IS NULL THEN RAISE EXCEPTION 'Envio inválido'; END IF;
 UPDATE public.rotina_avisos_envios SET
  status=CASE WHEN _ok THEN 'enviado' WHEN coalesce(_reprocessar,false) AND tentativas<3 THEN 'aguardando' ELSE 'falhou' END,
  enviado_em=CASE WHEN _ok THEN now() ELSE enviado_em END,
  provedor_id=CASE WHEN _ok THEN left(nullif(trim(_provedor_id),''),200) ELSE provedor_id END,
  erro=CASE WHEN _ok THEN NULL ELSE left(coalesce(nullif(trim(_erro),''),'Falha no envio'),500) END,
  processando_em=NULL
 WHERE id=_id AND status='processando' RETURNING status INTO novo;
 RETURN novo;
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_concluir(uuid,boolean,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_concluir(uuid,boolean,text,text,boolean) TO service_role;

-- 7) Connect the Gmail sender (called only by rotina-avisos-enviar with service role, on behalf of a Governance user).
CREATE OR REPLACE FUNCTION public.rotina_avisos_remetente_configurar(_token text,_url text,_uid uuid,_remetente text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE anterior jsonb;
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _uid IS NULL OR NOT public.mt_is_governanca(_uid) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _token IS NULL OR length(_token)<32 THEN RAISE EXCEPTION 'Secret ausente'; END IF;
 IF _url IS NULL OR _url !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/rotina-avisos-enviar$' THEN RAISE EXCEPTION 'Destino inválido'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('rotina_avisos_config'));
 SELECT to_jsonb(c) INTO anterior FROM public.rotina_avisos_config c WHERE id;
 INSERT INTO public.rotina_avisos_remetente(id,url,token,remetente,configurado_por,configurado_em) VALUES(true,_url,_token,nullif(trim(_remetente),''),_uid,now())
  ON CONFLICT(id) DO UPDATE SET url=EXCLUDED.url,token=EXCLUDED.token,remetente=EXCLUDED.remetente,configurado_por=_uid,configurado_em=now();
 INSERT INTO public.rotina_avisos_config(id,remetente_pronto,atualizado_por) VALUES(true,true,_uid)
  ON CONFLICT(id) DO UPDATE SET remetente_pronto=true,atualizado_por=_uid,atualizado_em=now();
 -- Rows already waiting (e.g. impediments queued before the sender existed) get delivered now.
 PERFORM public.rotina_avisos_acordar();
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por)
 VALUES('rotina_avisos_config','true','remetente_pronto',coalesce(anterior->>'remetente_pronto','false'),'true (Gmail API '||coalesce(nullif(trim(_remetente),''),'?')||')',_uid);
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_remetente_configurar(text,text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_remetente_configurar(text,text,uuid,text) TO service_role;

-- 8) Governance kill switch: turns off schedules and readiness; queued rows stay queued (and expire after 14 days).
CREATE OR REPLACE FUNCTION public.rotina_avisos_desconectar() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE anterior jsonb; job record;
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('rotina_avisos_config'));
 SELECT to_jsonb(c) INTO anterior FROM public.rotina_avisos_config c WHERE id;
 UPDATE public.rotina_avisos_config SET ativo=false,remetente_pronto=false,atualizado_por=auth.uid(),atualizado_em=now() WHERE id;
 DELETE FROM public.rotina_avisos_remetente WHERE id;
 FOR job IN SELECT jobid FROM cron.job WHERE jobname IN ('rotina-email-abertura','rotina-email-lembrete','rotina-email-processar') LOOP PERFORM cron.unschedule(job.jobid); END LOOP;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por)
 VALUES('rotina_avisos_config','true','remetente_pronto',coalesce(anterior->>'remetente_pronto','false'),'false (desconectado)',auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_desconectar() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_desconectar() TO authenticated;

-- 9) Governance-only, secret-free view of the connected sender.
CREATE OR REPLACE FUNCTION public.rotina_avisos_remetente_info() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 RETURN (SELECT jsonb_build_object('remetente',remetente,'configurado_em',configurado_em) FROM public.rotina_avisos_remetente WHERE id);
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_remetente_info() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_remetente_info() TO authenticated;

-- 10) Governance-only, audited allowlist edit. NULL = every eligible chair.
CREATE OR REPLACE FUNCTION public.rotina_avisos_permitidos_salvar(_emails text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE anterior text[]; lista text[]; e text;
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _emails IS NOT NULL THEN
  SELECT coalesce(array_agg(DISTINCT lower(trim(x)) ORDER BY lower(trim(x))), '{}') INTO lista FROM unnest(_emails) x WHERE nullif(trim(x),'') IS NOT NULL;
  FOREACH e IN ARRAY lista LOOP
   IF e !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RAISE EXCEPTION 'E-mail inválido: %', e; END IF;
  END LOOP;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtext('rotina_avisos_config'));
 SELECT destinatarios_permitidos INTO anterior FROM public.rotina_avisos_config WHERE id;
 INSERT INTO public.rotina_avisos_config(id,destinatarios_permitidos,atualizado_por) VALUES(true,lista,auth.uid())
 ON CONFLICT(id) DO UPDATE SET destinatarios_permitidos=EXCLUDED.destinatarios_permitidos, atualizado_por=auth.uid(), atualizado_em=now();
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por)
 VALUES('rotina_avisos_config','true','destinatarios_permitidos',anterior::text,lista::text,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_permitidos_salvar(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_permitidos_salvar(text[]) TO authenticated;

COMMENT ON TABLE public.rotina_avisos_envios IS 'Channel-ready notification outbox (email). rotina-avisos-enviar delivers weekly and impediment notices through the Gmail API: claims via rotina_avisos_reivindicar, finishes via rotina_avisos_concluir (max 3 attempts, 14-day expiry), woken by pg_net on insert; a 10-minute retry cron exists only while rows are pending. Open tracking stays null.';