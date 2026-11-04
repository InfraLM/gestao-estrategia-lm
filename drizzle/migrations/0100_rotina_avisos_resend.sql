-- Weekly check-in/checkout e-mails through Resend. Additive only: no existing row is updated or deleted.
-- 1) Optional recipient allowlist (NULL keeps every eligible chair, preserving current behaviour).
ALTER TABLE public.rotina_avisos_config ADD COLUMN IF NOT EXISTS destinatarios_permitidos text[];

-- 2) Private sender endpoint/token used by the wake-on-enqueue trigger. No client grants.
CREATE TABLE IF NOT EXISTS public.rotina_avisos_remetente (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), url text NOT NULL, token text NOT NULL, configurado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rotina_avisos_remetente ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rotina_avisos_remetente FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.rotina_avisos_remetente TO service_role;

-- 3) Allowlist gate on weekly cycle notices (impediment notices are untouched).
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

-- 4) Wake the sender once per transaction after weekly notices are queued. pg_net delivers after commit,
--    so the function sees every queued row; failures never block the enqueue.
CREATE OR REPLACE FUNCTION public.rotina_avisos_acordar_remetente() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.rotina_avisos_remetente%ROWTYPE;
BEGIN
 IF NEW.tipo NOT IN ('abertura','lembrete','manual') OR NEW.status <> 'aguardando' THEN RETURN NULL; END IF;
 IF coalesce(current_setting('rotina.avisos_acordado', true), '') = '1' THEN RETURN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rotina_avisos_config WHERE id AND remetente_pronto) THEN RETURN NULL; END IF;
 SELECT * INTO r FROM public.rotina_avisos_remetente WHERE id;
 IF NOT FOUND THEN RETURN NULL; END IF;
 PERFORM set_config('rotina.avisos_acordado', '1', true);
 BEGIN
  PERFORM net.http_post(url := r.url, headers := jsonb_build_object('Content-Type','application/json','x-cron-token',r.token), body := '{}'::jsonb, timeout_milliseconds := 60000);
 EXCEPTION WHEN OTHERS THEN RAISE WARNING 'rotina_avisos: não foi possível acordar o remetente: %', SQLERRM;
 END;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS rotina_avisos_acordar_remetente ON public.rotina_avisos_envios;
CREATE TRIGGER rotina_avisos_acordar_remetente AFTER INSERT ON public.rotina_avisos_envios FOR EACH ROW EXECUTE FUNCTION public.rotina_avisos_acordar_remetente();
REVOKE ALL ON FUNCTION public.rotina_avisos_filtrar_permitidos() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rotina_avisos_acordar_remetente() FROM PUBLIC, anon, authenticated;

-- 5) Connect the Resend sender (called only by the rotina-avisos-enviar edge function with service role).
CREATE OR REPLACE FUNCTION public.rotina_avisos_remetente_configurar(_token text, _url text, _uid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE anterior jsonb;
BEGIN
 IF coalesce(auth.role(),'') <> 'service_role' THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _uid IS NULL OR NOT public.mt_is_governanca(_uid) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _token IS NULL OR length(_token) < 32 THEN RAISE EXCEPTION 'Secret ausente'; END IF;
 IF _url IS NULL OR _url !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/rotina-avisos-enviar$' THEN RAISE EXCEPTION 'Destino inválido'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('rotina_avisos_config'));
 SELECT to_jsonb(c) INTO anterior FROM public.rotina_avisos_config c WHERE id;
 INSERT INTO public.rotina_avisos_remetente(id,url,token,configurado_em) VALUES(true,_url,_token,now())
 ON CONFLICT(id) DO UPDATE SET url=EXCLUDED.url, token=EXCLUDED.token, configurado_em=now();
 INSERT INTO public.rotina_avisos_config(id,remetente_pronto,atualizado_por) VALUES(true,true,_uid)
 ON CONFLICT(id) DO UPDATE SET remetente_pronto=true, atualizado_por=_uid, atualizado_em=now();
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por)
 VALUES('rotina_avisos_config','true','remetente_pronto',coalesce(anterior->>'remetente_pronto','false'),'true (Resend)',_uid);
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_remetente_configurar(text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_remetente_configurar(text,text,uuid) TO service_role;

-- 6) Governance-only, audited allowlist edit. NULL = every eligible chair.
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

COMMENT ON TABLE public.rotina_avisos_envios IS 'Channel-ready notification outbox. Weekly notices (abertura/lembrete/manual) are delivered through Resend by the rotina-avisos-enviar edge function, woken after enqueue; impediment notices stay queued until their own template exists. Open tracking stays null.';
