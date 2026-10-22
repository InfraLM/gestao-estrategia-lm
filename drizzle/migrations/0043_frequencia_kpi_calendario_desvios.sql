ALTER TABLE public.mt_indicadores ADD COLUMN frequencia text, ADD COLUMN mes_ciclo integer, ADD COLUMN semana_mes integer, ADD COLUMN velocidade_mudanca text, ADD COLUMN velocidade_reacao text, ADD COLUMN tratamento text, ADD COLUMN origem_frequencia text, ADD COLUMN frequencia_editado_por uuid, ADD COLUMN frequencia_editado_em timestamptz, ADD COLUMN frequencia_inicio date DEFAULT '2026-10-26', ADD COLUMN frequencia_justificativa text;
ALTER TABLE public.mt_indicadores ADD CONSTRAINT frequencia_valida CHECK(frequencia IS NULL OR frequencia IN ('semanal','quinzenal','mensal','trimestral','semestral')), ADD CONSTRAINT origem_frequencia_valida CHECK(origem_frequencia IS NULL OR origem_frequencia IN ('arvore','proposta','editado')), ADD CONSTRAINT semana_mes_valida CHECK(semana_mes IS NULL OR semana_mes BETWEEN 1 AND 4), ADD CONSTRAINT mes_ciclo_valido CHECK(mes_ciclo IS NULL OR mes_ciclo BETWEEN 1 AND 6), ADD CONSTRAINT tratamento_valido CHECK(tratamento IS NULL OR tratamento IN ('Pilotar','Suavizar','Vigiar por exceção','Revisar'));
CREATE TABLE public.mt_kpi_desvios(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),indicador_id uuid NOT NULL REFERENCES public.mt_indicadores(id),cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id),ciclo date NOT NULL,valor text NOT NULL,causa text NOT NULL,impacto text NOT NULL,acao text NOT NULL,ativo boolean NOT NULL DEFAULT true,normais integer NOT NULL DEFAULT 0,ultimo_periodo text,criado_por uuid,criado_em timestamptz NOT NULL DEFAULT now(),resolvido_em timestamptz);
GRANT SELECT ON public.mt_kpi_desvios TO authenticated; GRANT ALL ON public.mt_kpi_desvios TO service_role;
ALTER TABLE public.mt_kpi_desvios ENABLE ROW LEVEL SECURITY;
CREATE POLICY desvios_le ON public.mt_kpi_desvios FOR SELECT TO authenticated USING(public.acesso_modulo(auth.uid(),'rotina',false) AND (public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR public.mt_cadeira_do_usuario(auth.uid())=cadeira_id));
CREATE UNIQUE INDEX desvio_ativo_unico ON public.mt_kpi_desvios(indicador_id) WHERE ativo;
CREATE TABLE public.mt_kpi_desvio_leituras(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),desvio_id uuid NOT NULL REFERENCES public.mt_kpi_desvios(id),periodo text NOT NULL,normal boolean NOT NULL,valor text,registrado_por uuid,registrado_em timestamptz NOT NULL DEFAULT now(),UNIQUE(desvio_id,periodo));
GRANT SELECT ON public.mt_kpi_desvio_leituras TO authenticated; GRANT ALL ON public.mt_kpi_desvio_leituras TO service_role;
ALTER TABLE public.mt_kpi_desvio_leituras ENABLE ROW LEVEL SECURITY;
CREATE POLICY leituras_le ON public.mt_kpi_desvio_leituras FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.mt_kpi_desvios d WHERE d.id=desvio_id));
CREATE OR REPLACE FUNCTION public.mt_frequencia_devida(_frequencia text,_mes integer,_semana integer,_inicio date,_ciclo date,_critico boolean DEFAULT false) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT CASE WHEN _frequencia IS NULL OR _ciclo<coalesce(_inicio,'2026-10-26') THEN true WHEN extract(isodow FROM _ciclo)<>1 THEN false WHEN _critico THEN ((extract(day FROM _ciclo)::integer-1)/7+1)=coalesce(_semana,1) WHEN _frequencia='semanal' THEN true WHEN ((extract(day FROM _ciclo)::integer-1)/7+1)=5 THEN false WHEN _frequencia='quinzenal' THEN ((extract(day FROM _ciclo)::integer-1)/7+1) IN (1,3) WHEN ((extract(day FROM _ciclo)::integer-1)/7+1)<>coalesce(_semana,1) THEN false WHEN _frequencia='trimestral' THEN ((extract(month FROM _ciclo)::integer-1)%3+1)=coalesce(_mes,1) WHEN _frequencia='semestral' THEN ((extract(month FROM _ciclo)::integer-1)%6+1)=coalesce(_mes,1) ELSE true END $$;
GRANT EXECUTE ON FUNCTION public.mt_frequencia_devida(text,integer,integer,date,date,boolean) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.mt_frequencia_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='INSERT' AND NEW.frequencia IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND ROW(NEW.frequencia,NEW.mes_ciclo,NEW.semana_mes,NEW.velocidade_mudanca,NEW.velocidade_reacao,NEW.tratamento,NEW.origem_frequencia,NEW.frequencia_inicio,NEW.frequencia_justificativa,NEW.frequencia_editado_por,NEW.frequencia_editado_em) IS NOT DISTINCT FROM ROW(OLD.frequencia,OLD.mes_ciclo,OLD.semana_mes,OLD.velocidade_mudanca,OLD.velocidade_reacao,OLD.tratamento,OLD.origem_frequencia,OLD.frequencia_inicio,OLD.frequencia_justificativa,OLD.frequencia_editado_por,OLD.frequencia_editado_em) THEN RETURN NEW; END IF;
 IF NOT(public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR auth.role()='service_role') THEN RAISE EXCEPTION 'Frequência: somente Governança/CEO'; END IF;
 IF NEW.frequencia IN ('mensal','trimestral','semestral') AND NEW.semana_mes IS NULL THEN RAISE EXCEPTION 'Informe semana do mês'; END IF;
 IF NEW.frequencia='trimestral' AND (NEW.mes_ciclo IS NULL OR NEW.mes_ciclo NOT BETWEEN 1 AND 3) OR NEW.frequencia='semestral' AND NEW.mes_ciclo IS NULL THEN RAISE EXCEPTION 'Informe mês do ciclo válido'; END IF;
 NEW.frequencia_editado_por:=auth.uid(); NEW.frequencia_editado_em:=now();
 IF auth.role()<>'service_role' THEN NEW.origem_frequencia:='editado'; END IF;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('mt_indicadores',NEW.id::text,'frequencia',CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD)::text ELSE NULL END,to_jsonb(NEW)::text,auth.uid());
 RETURN NEW;
END $$;
CREATE TRIGGER mt_frequencia_guard BEFORE INSERT OR UPDATE ON public.mt_indicadores FOR EACH ROW EXECUTE FUNCTION public.mt_frequencia_guard();
CREATE OR REPLACE FUNCTION public.mt_frequencia_salvar(_id uuid,_dados jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT(public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid())) THEN RAISE EXCEPTION 'Somente Governança/CEO'; END IF;
 IF NOT (public.acesso_modulo(auth.uid(),'metas',false) OR public.acesso_modulo(auth.uid(),'rotina',false) OR public.acesso_modulo(auth.uid(),'estrategia',false) OR public.acesso_modulo(auth.uid(),'okrs',false) OR public.acesso_modulo(auth.uid(),'cesta',false)) THEN RAISE EXCEPTION 'Sem acesso ao módulo'; END IF;
 IF jsonb_typeof(_dados)<>'object' OR coalesce(_dados->>'frequencia','') NOT IN ('semanal','quinzenal','mensal','trimestral','semestral') THEN RAISE EXCEPTION 'Frequência inválida'; END IF;
 UPDATE public.mt_indicadores SET frequencia=_dados->>'frequencia',mes_ciclo=nullif(_dados->>'mes_ciclo','')::integer,semana_mes=nullif(_dados->>'semana_mes','')::integer,velocidade_mudanca=left(_dados->>'velocidade_mudanca',500),velocidade_reacao=left(_dados->>'velocidade_reacao',500),tratamento=_dados->>'tratamento',origem_frequencia='editado',frequencia_justificativa=left(_dados->>'frequencia_justificativa',2000) WHERE id=_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Indicador não encontrado'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.mt_frequencia_salvar(uuid,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.mt_frequencia_salvar(uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.rotina_retrato_ciclo(_cadeira uuid,_ciclo date,_incluir_fora boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE resultado jsonb;
BEGIN
 IF NOT public.acesso_modulo(auth.uid(),'rotina',false) OR NOT(public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR public.mt_cadeira_do_usuario(auth.uid())=_cadeira) THEN RETURN '[]'::jsonb; END IF;
 IF extract(isodow FROM _ciclo)<>1 THEN RAISE EXCEPTION 'Ciclo inválido'; END IF;
 WITH inds AS (SELECT i.*,d.id AS desvio_id,d.ativo AS critico FROM public.mt_indicadores i LEFT JOIN public.mt_kpi_desvios d ON d.indicador_id=i.id AND d.ativo WHERE i.cadeira_id=_cadeira AND i.status='ativo' AND i.parent_id IS NULL AND (i.origem<>'bsc' OR coalesce(i.nivel,'Tático') IN ('Estratégico','Tático'))),
 periodos AS (SELECT i.*,CASE WHEN i.critico THEN 'mensal' ELSE coalesce(i.frequencia,'mensal') END AS freq,CASE WHEN i.critico THEN (date_trunc('month',_ciclo)-interval '1 day')::date WHEN i.frequencia='trimestral' THEN (date_trunc('quarter',_ciclo)-interval '1 day')::date WHEN i.frequencia='semestral' THEN (make_date(extract(year FROM _ciclo)::int,CASE WHEN extract(month FROM _ciclo)>6 THEN 7 ELSE 1 END,1)-1) WHEN i.frequencia IN ('semanal','quinzenal') THEN _ciclo-1 ELSE (date_trunc('month',_ciclo)-interval '1 day')::date END AS fim FROM inds i)
 SELECT coalesce(jsonb_agg(jsonb_build_object('indicador_id',i.id,'codigo',i.codigo,'nome',i.nome,'origem',i.origem,'peso',i.peso,'sentido',i.sentido,'unidade',i.unidade,'nivel',i.nivel,'meta_semestre',i.meta_semestre,'meta_texto',i.meta_texto,'tipo_apontamento',i.tipo_apontamento,'prazo_entrega',i.prazo_entrega,'frequencia',i.frequencia,'mes_ciclo',i.mes_ciclo,'semana_mes',i.semana_mes,'tratamento',i.tratamento,'origem_frequencia',i.origem_frequencia,'desvio_id',i.desvio_id,'desvio_critico',coalesce(i.critico,false),'competencia',to_char(i.fim,'YYYY-MM'),'periodo_fim',i.fim,'periodo_inicio',CASE WHEN i.freq='trimestral' THEN date_trunc('quarter',i.fim)::date WHEN i.freq='semestral' THEN make_date(extract(year FROM i.fim)::int,CASE WHEN extract(month FROM i.fim)>6 THEN 7 ELSE 1 END,1) WHEN i.freq='quinzenal' THEN _ciclo-14 WHEN i.freq='semanal' THEN _ciclo-7 ELSE date_trunc('month',i.fim)::date END,
 'meta_mes',(SELECT m.meta_mes FROM public.mt_metas_mensais m WHERE m.indicador_id=i.id AND m.competencia=to_char(i.fim,'YYYY-MM') LIMIT 1),
 'realizado',(SELECT l.valor FROM public.mt_lancamentos l WHERE l.indicador_id=i.id AND l.competencia=to_char(i.fim,'YYYY-MM') AND NOT l.sem_medicao ORDER BY l.revisao DESC LIMIT 1)) ORDER BY i.origem,i.codigo),'[]') INTO resultado FROM periodos i WHERE _incluir_fora OR public.mt_frequencia_devida(i.frequencia,i.mes_ciclo,i.semana_mes,i.frequencia_inicio,_ciclo,coalesce(i.critico,false));
 RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.rotina_retrato_ciclo(uuid,date,boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.rotina_retrato_ciclo(uuid,date,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.mt_desvio_checkout() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE k jsonb;r jsonb;ind public.mt_indicadores;d public.mt_kpi_desvios;normal boolean;periodo text;n numeric;meta numeric;inserido integer;
BEGIN
 IF NEW.tipo<>'checkout' OR NEW.status<>'enviado' OR NEW.semana+7<'2026-10-26'::date THEN RETURN NEW; END IF;
 IF NOT(public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR public.mt_cadeira_do_usuario(auth.uid())=NEW.cadeira_id) OR NOT public.acesso_modulo(auth.uid(),'rotina',true) THEN RAISE EXCEPTION 'Sem permissão para apontar desvio'; END IF;
 FOR k IN SELECT value FROM jsonb_array_elements(coalesce(NEW.conteudo->'kpis_resposta','[]')) LOOP
 SELECT * INTO ind FROM public.mt_indicadores WHERE id=(k->>'indicador_id')::uuid AND cadeira_id=NEW.cadeira_id AND status='ativo';
 IF NOT FOUND THEN CONTINUE; END IF;
 IF coalesce((k->>'desvio_critico')::boolean,false) THEN
 IF length(trim(coalesce(k->>'situacao_atual','')))=0 OR length(trim(coalesce(k->>'causa','')))=0 OR length(trim(coalesce(k->>'impacto','')))=0 OR length(trim(coalesce(k->>'plano','')))=0 THEN RAISE EXCEPTION 'Desvio crítico exige valor, causa, impacto e ação'; END IF;
 IF length(k->>'situacao_atual')>200 OR length(k->>'causa')>4000 OR length(k->>'impacto')>4000 OR length(k->>'plano')>4000 THEN RAISE EXCEPTION 'Texto do desvio acima do limite'; END IF;
 INSERT INTO public.mt_kpi_desvios(indicador_id,cadeira_id,ciclo,valor,causa,impacto,acao,criado_por) SELECT ind.id,NEW.cadeira_id,NEW.semana+7,k->>'situacao_atual',k->>'causa',k->>'impacto',k->>'plano',auth.uid() WHERE NOT EXISTS(SELECT 1 FROM public.mt_kpi_desvios WHERE indicador_id=ind.id AND (ativo OR ciclo=NEW.semana+7)) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserido=ROW_COUNT;
 IF inserido>0 THEN INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_novo,alterado_por) VALUES('mt_kpi_desvios',ind.id::text,'abertura',k::text,auth.uid()); END IF;
 END IF;
 SELECT * INTO d FROM public.mt_kpi_desvios WHERE indicador_id=ind.id AND ativo FOR UPDATE;
 IF NOT FOUND OR d.ciclo>=NEW.semana+7 THEN CONTINUE; END IF;
 IF NOT public.mt_frequencia_devida('mensal',NULL,coalesce(ind.semana_mes,1),'2026-10-26',NEW.semana+7,false) THEN CONTINUE; END IF;
 periodo:=to_char((date_trunc('month',NEW.semana+7)-interval '1 month')::date,'YYYY-MM');
 IF coalesce(d.ultimo_periodo,'')>=periodo THEN CONTINUE; END IF;
 normal:=false;
 IF ind.tipo_apontamento='valor_periodo' THEN normal:=(k->>'declaracao')='on';
 ELSIF ind.tipo_apontamento='entrega' THEN normal:=(k->>'status_entrega')='implantada';
 ELSE
 BEGIN n:=replace(replace(k->>'situacao_atual','.',''),',','.')::numeric; EXCEPTION WHEN OTHERS THEN n:=NULL; END;
 SELECT m.meta_mes INTO meta FROM public.mt_metas_mensais m WHERE m.indicador_id=ind.id AND m.competencia=periodo LIMIT 1;
 meta:=coalesce(meta,ind.meta_semestre);
 IF n IS NOT NULL AND meta IS NOT NULL THEN normal:=CASE WHEN ind.sentido='menor' THEN n<=meta ELSE n>=meta END; END IF;
 END IF;
 INSERT INTO public.mt_kpi_desvio_leituras(desvio_id,periodo,normal,valor,registrado_por) VALUES(d.id,periodo,coalesce(normal,false),k->>'situacao_atual',auth.uid()) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserido=ROW_COUNT;
 IF inserido=0 THEN CONTINUE; END IF;
 UPDATE public.mt_kpi_desvios SET normais=CASE WHEN normal THEN d.normais+1 ELSE 0 END,ultimo_periodo=periodo,ativo=NOT(normal AND d.normais+1>=2),resolvido_em=CASE WHEN normal AND d.normais+1>=2 THEN now() ELSE NULL END WHERE id=d.id;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('mt_kpi_desvios',d.id::text,CASE WHEN normal AND d.normais+1>=2 THEN 'retorno_frequencia' ELSE 'leitura' END,to_jsonb(d)::text,jsonb_build_object('periodo',periodo,'normal',normal)::text,auth.uid());
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER mt_desvio_checkout AFTER INSERT OR UPDATE ON public.mt_checkins FOR EACH ROW EXECUTE FUNCTION public.mt_desvio_checkout();