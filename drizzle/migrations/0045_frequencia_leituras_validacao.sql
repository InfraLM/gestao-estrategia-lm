CREATE OR REPLACE FUNCTION public.mt_frequencia_numero(_texto text) RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$ DECLARE t text:=trim(_texto); n numeric; BEGIN IF t IS NULL OR t !~ '^-?[0-9]+([.,][0-9]+)*$' THEN RETURN NULL; END IF; IF position(',' IN t)>0 THEN t:=replace(replace(t,'.',''),',','.'); ELSIF t ~ '^-?[0-9]{1,3}(\.[0-9]{3})+$' THEN t:=replace(t,'.',''); END IF; BEGIN n:=t::numeric; EXCEPTION WHEN OTHERS THEN RETURN NULL; END; IF n::text IN ('NaN','Infinity','-Infinity') THEN RETURN NULL; END IF; RETURN n; END $$;
CREATE OR REPLACE FUNCTION public.mt_desvio_normal(_indicador uuid,_resposta jsonb,_periodo text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE i public.mt_indicadores;n numeric;meta numeric;texto text; BEGIN SELECT * INTO i FROM public.mt_indicadores WHERE id=_indicador; IF NOT FOUND THEN RETURN false; END IF;
 IF i.tipo_apontamento='entrega' THEN RETURN coalesce(_resposta->>'status_entrega'='implantada',false); END IF;
 IF i.tipo_apontamento='valor_periodo' AND _periodo<='2026-12' THEN RETURN coalesce(_resposta->>'declaracao'='on',false); END IF;
 n:=public.mt_frequencia_numero(_resposta->>'situacao_atual');
 SELECT m.meta_mes INTO meta FROM public.mt_metas_mensais m WHERE m.indicador_id=i.id AND m.competencia=_periodo LIMIT 1;
 meta:=coalesce(meta,i.meta_semestre);
 IF meta IS NULL AND i.meta_texto IS NOT NULL THEN texto:=substring(i.meta_texto FROM '-?[0-9]+([.,][0-9]+)*');meta:=public.mt_frequencia_numero(texto);END IF;
 IF n IS NULL OR meta IS NULL THEN RETURN false; END IF;
 IF i.meta_texto ~ '[0-9].*( a | até |–)' AND i.meta_semestre IS NULL THEN RETURN false; END IF;
 RETURN CASE WHEN coalesce(i.meta_texto,'') ~ '^\s*[<≤]' THEN n<=meta WHEN coalesce(i.meta_texto,'') ~ '^\s*[>≥]' THEN n>=meta WHEN i.sentido='menor' THEN n<=meta ELSE n>=meta END;
END $$;
REVOKE ALL ON FUNCTION public.mt_desvio_normal(uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
DO $$ DECLARE definition text; a integer;b integer; BEGIN SELECT pg_get_functiondef('public.mt_desvio_checkout()'::regprocedure) INTO definition;
 a:=position(' IF ind.tipo_apontamento=''valor_periodo'' THEN normal:=' IN definition);
 b:=position(' INSERT INTO public.mt_kpi_desvio_leituras' IN definition);
 IF a=0 OR b=0 THEN RAISE EXCEPTION 'Trigger não corresponde ao padrão esperado'; END IF;
 definition:=substring(definition FROM 1 FOR a-1)||' normal:=public.mt_desvio_normal(ind.id,k,periodo);'||chr(10)||substring(definition FROM b);
 EXECUTE definition;
END $$;
CREATE OR REPLACE FUNCTION public.mt_frequencia_snapshot_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; i public.mt_indicadores; critico boolean;
BEGIN
 IF NEW.tipo<>'checkout' OR NEW.semana+7<'2026-10-26'::date THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.conteudo->>'primeiro_envio_em' IS NOT NULL THEN
 IF NEW.conteudo->'kpis_retrato' IS DISTINCT FROM OLD.conteudo->'kpis_retrato' THEN RAISE EXCEPTION 'Retrato do primeiro envio é histórico e não pode mudar'; END IF;
 RETURN NEW;
 END IF;
 IF NEW.status<>'enviado' THEN RETURN NEW; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(coalesce(NEW.conteudo->'kpis_retrato','[]')) LOOP
 SELECT * INTO i FROM public.mt_indicadores WHERE id=(r->>'indicador_id')::uuid AND cadeira_id=NEW.cadeira_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'KPI fora da própria cadeira'; END IF;
 critico:=EXISTS(SELECT 1 FROM public.mt_kpi_desvios d WHERE d.indicador_id=i.id AND d.ativo AND d.ciclo<=NEW.semana+7);
 IF NOT public.mt_frequencia_devida(i.frequencia,i.mes_ciclo,i.semana_mes,i.frequencia_inicio,NEW.semana+7,critico) AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.conteudo->'kpis_resposta','[]')) k WHERE k->>'indicador_id'=i.id::text AND coalesce(k->>'desvio_critico','false')='true' AND nullif(trim(k->>'causa'),'') IS NOT NULL AND nullif(trim(k->>'impacto'),'') IS NOT NULL AND nullif(trim(k->>'plano'),'') IS NOT NULL AND nullif(trim(k->>'situacao_atual'),'') IS NOT NULL) THEN RAISE EXCEPTION 'KPI não devido e sem desvio crítico'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER mt_frequencia_snapshot_guard BEFORE INSERT OR UPDATE ON public.mt_checkins FOR EACH ROW EXECUTE FUNCTION public.mt_frequencia_snapshot_guard();