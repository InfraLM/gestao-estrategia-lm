ALTER TABLE public.mt_indicadores ADD COLUMN frequencia_historico jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE OR REPLACE FUNCTION public.mt_frequencia_dados(_i public.mt_indicadores) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT jsonb_build_object('frequencia',_i.frequencia,'mes_ciclo',_i.mes_ciclo,'semana_mes',_i.semana_mes,'tratamento',_i.tratamento,'origem_frequencia',_i.origem_frequencia,'frequencia_inicio',_i.frequencia_inicio) $$;
CREATE OR REPLACE FUNCTION public.mt_frequencia_no_ciclo(_i public.mt_indicadores,_ciclo date) RETURNS public.mt_indicadores LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$ DECLARE dados jsonb; BEGIN
 SELECT x->'dados' INTO dados FROM jsonb_array_elements(_i.frequencia_historico) x WHERE (x->>'inicio')::date<=_ciclo ORDER BY x->>'inicio' DESC LIMIT 1;
 IF dados IS NULL THEN RETURN _i; END IF;
 RETURN jsonb_populate_record(_i,dados);
END $$;
CREATE OR REPLACE FUNCTION public.mt_indicadores_no_ciclo(_ciclo date) RETURNS SETOF public.mt_indicadores LANGUAGE sql STABLE SET search_path=public AS $$ SELECT public.mt_frequencia_no_ciclo(i,_ciclo) FROM public.mt_indicadores i $$;
REVOKE ALL ON FUNCTION public.mt_frequencia_dados(public.mt_indicadores),public.mt_frequencia_no_ciclo(public.mt_indicadores,date),public.mt_indicadores_no_ciclo(date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mt_frequencia_dados(public.mt_indicadores),public.mt_frequencia_no_ciclo(public.mt_indicadores,date),public.mt_indicadores_no_ciclo(date) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.mt_frequencia_vigencia_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE inicio date; hoje date; base jsonb; BEGIN
 IF NEW.frequencia_historico IS DISTINCT FROM OLD.frequencia_historico THEN RAISE EXCEPTION 'Histórico de frequência é protegido'; END IF;
 IF ROW(NEW.frequencia,NEW.mes_ciclo,NEW.semana_mes,NEW.tratamento,NEW.origem_frequencia) IS NOT DISTINCT FROM ROW(OLD.frequencia,OLD.mes_ciclo,OLD.semana_mes,OLD.tratamento,OLD.origem_frequencia) THEN RETURN NEW; END IF;
 hoje:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
 inicio:=hoje+(8-extract(isodow FROM hoje)::integer);
 base:=OLD.frequencia_historico;
 IF jsonb_array_length(base)=0 THEN base:=jsonb_build_array(jsonb_build_object('inicio','0001-01-01','dados',public.mt_frequencia_dados(OLD))); END IF;
 SELECT coalesce(jsonb_agg(x),'[]') INTO base FROM jsonb_array_elements(base) x WHERE x->>'inicio'<>inicio::text;
 NEW.frequencia_historico:=base||jsonb_build_array(jsonb_build_object('inicio',inicio,'dados',public.mt_frequencia_dados(NEW)));
 RETURN NEW;
END $$;
CREATE TRIGGER mt_frequencia_01_vigencia BEFORE UPDATE ON public.mt_indicadores FOR EACH ROW EXECUTE FUNCTION public.mt_frequencia_vigencia_guard();
DO $$ DECLARE f record; definition text; BEGIN
 FOR f IN SELECT oid,proname FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('rotina_retrato_ciclo','rotina_avisos_destinatarios','mt_frequencia_snapshot_guard','mt_desvio_checkout') LOOP
 definition:=pg_get_functiondef(f.oid);
 IF f.proname IN ('rotina_retrato_ciclo','rotina_avisos_destinatarios') THEN definition:=replace(definition,'FROM public.mt_indicadores i','FROM public.mt_indicadores_no_ciclo(_ciclo) i');
 ELSE definition:=replace(definition,'SELECT * INTO i FROM public.mt_indicadores WHERE','SELECT * INTO i FROM public.mt_indicadores_no_ciclo(NEW.semana+7) WHERE');definition:=replace(definition,'SELECT * INTO ind FROM public.mt_indicadores WHERE','SELECT * INTO ind FROM public.mt_indicadores_no_ciclo(NEW.semana+7) WHERE');END IF;
 EXECUTE definition;
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.mt_frequencia_propostas_validar(_ids uuid[]) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE i public.mt_indicadores;n integer:=0;BEGIN
 IF NOT coalesce((public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid())),false) THEN RAISE EXCEPTION 'Somente Governança/CEO'; END IF;
 IF coalesce(array_length(_ids,1),0) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Seleção inválida'; END IF;
 FOR i IN SELECT * FROM public.mt_indicadores WHERE id=ANY(_ids) AND origem_frequencia='proposta' FOR UPDATE LOOP
 PERFORM public.mt_frequencia_salvar(i.id,jsonb_build_object('frequencia',i.frequencia,'mes_ciclo',i.mes_ciclo,'semana_mes',i.semana_mes,'tratamento',i.tratamento,'velocidade_mudanca',i.velocidade_mudanca,'velocidade_reacao',i.velocidade_reacao,'frequencia_justificativa',i.frequeNcia_justificativa));n:=n+1;
 END LOOP;RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.mt_frequencia_propostas_validar(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mt_frequencia_propostas_validar(uuid[]) TO authenticated;