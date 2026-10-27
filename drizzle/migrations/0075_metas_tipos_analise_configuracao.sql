ALTER TABLE public.mt_indicadores ADD COLUMN IF NOT EXISTS analise_configurada_em timestamptz, ADD COLUMN IF NOT EXISTS tolerancia numeric DEFAULT 0, ADD COLUMN IF NOT EXISTS analise_historico jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.mt_lancamentos ADD COLUMN IF NOT EXISTS analise_snapshot jsonb;
COMMENT ON COLUMN public.mt_indicadores.analise_configurada_em IS 'Explicit human configuration of KR/Cesta analysis. NULL preserves legacy type and behavior.';
CREATE OR REPLACE FUNCTION public.mt_analise_retrato(_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT jsonb_build_object('tipo_apontamento',i.tipo_apontamento,'prazo_entrega',i.prazo_entrega,'meta_semestre',i.meta_semestre,'meta_texto',i.meta_texto,'unidade',i.unidade,'sentido',i.sentido,'tolerancia',i.tolerancia,'analise_configurada_em',i.analise_configurada_em,'origem',i.origem,'metas',(SELECT coalesce(jsonb_object_agg(m.competencia,m.meta_mes),'{}') FROM public.mt_metas_mensais m WHERE m.indicador_id=i.id)) FROM public.mt_indicadores i WHERE i.id=_id $$;
REVOKE ALL ON FUNCTION public.mt_analise_retrato(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.mt_analise_historico_existe(_id uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.mt_indicadores;
BEGIN SELECT * INTO i FROM public.mt_indicadores WHERE id=_id;
IF NOT FOUND OR i.origem NOT IN ('okr','cesta') OR NOT coalesce((public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid())),false) OR NOT public.acesso_modulo(auth.uid(),CASE WHEN i.origem='okr' THEN 'okrs' ELSE 'cesta' END,false) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
RETURN EXISTS(SELECT 1 FROM public.mt_lancamentos WHERE indicador_id=_id) OR EXISTS(SELECT 1 FROM public.mt_checkins c CROSS JOIN LATERAL jsonb_array_elements(coalesce(c.conteudo->'kpis_resposta','[]')) k WHERE k->>'indicador_id'=_id::text);
END $$;
REVOKE ALL ON FUNCTION public.mt_analise_historico_existe(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mt_analise_historico_existe(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.mt_tipo_apontamento_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF (NEW.tipo_apontamento,NEW.prazo_entrega,NEW.analise_configurada_em,NEW.tolerancia,NEW.analise_historico) IS DISTINCT FROM (OLD.tipo_apontamento,OLD.prazo_entrega,OLD.analise_configurada_em,OLD.tolerancia,OLD.analise_historico) THEN
 IF coalesce(auth.role(),'')<>'service_role' AND NOT public.mt_is_governanca(auth.uid()) AND NOT (OLD.origem IN ('okr','cesta') AND public.proj_eh_ceo(auth.uid()) AND current_setting('app.analise_rpc',true)='true') THEN RAISE EXCEPTION 'Só Governança/CEO configura a análise'; END IF;
 IF OLD.origem IN ('okr','cesta') AND NEW.tipo_apontamento IS DISTINCT FROM OLD.tipo_apontamento AND current_setting('app.analise_rpc',true) IS DISTINCT FROM 'true' AND public.mt_analise_historico_existe(OLD.id) THEN RAISE EXCEPTION 'Confirme a troca de tipo com histórico no cadastro'; END IF;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('mt_indicadores',NEW.id::text,'tipo_apontamento',OLD.tipo_apontamento||' '||coalesce(OLD.prazo_entrega::text,''),NEW.tipo_apontamento||' '||coalesce(NEW.prazo_entrega::text,''),auth.uid());
END IF;
RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.mt_analise_configurar(_id uuid,_dados jsonb,_tipo_anterior text,_confirmar_historico boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.mt_indicadores; antigo jsonb; m record; tipo text;
BEGIN
SELECT * INTO i FROM public.mt_indicadores WHERE id=_id FOR UPDATE;
IF NOT FOUND OR i.origem NOT IN ('okr','cesta') THEN RAISE EXCEPTION 'Configuração apenas para Cesta e KRs; BSC fora do escopo'; END IF;
IF NOT coalesce((public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid())),false) OR NOT public.acesso_modulo(auth.uid(),CASE WHEN i.origem='okr' THEN 'okrs' ELSE 'cesta' END,false) THEN RAISE EXCEPTION 'Somente Governança/CEO com acesso ao módulo'; END IF;
IF i.tipo_apontamento IS DISTINCT FROM _tipo_anterior THEN RAISE EXCEPTION 'Tipo mudou por outra pessoa. Reabra o cadastro'; END IF;
tipo=_dados->>'tipo_apontamento';
IF tipo IS NULL OR tipo NOT IN ('valor_mensal','valor_periodo','entrega') THEN RAISE EXCEPTION 'Tipo inválido'; END IF;
IF tipo='entrega' AND nullif(_dados->>'prazo_entrega','') IS NULL THEN RAISE EXCEPTION 'Prazo de entrega obrigatório'; END IF;
IF tipo IN ('valor_mensal','valor_periodo') AND coalesce(_dados->>'sentido','') NOT IN ('maior','menor') THEN RAISE EXCEPTION 'Sentido inválido'; END IF;
IF coalesce(nullif(_dados->>'tolerancia','')::numeric,0)<0 THEN RAISE EXCEPTION 'Tolerância deve ser não negativa'; END IF;
IF tipo<>i.tipo_apontamento AND public.mt_analise_historico_existe(_id) AND NOT coalesce(_confirmar_historico,false) THEN RAISE EXCEPTION 'Confirmação obrigatória: histórico de apontamentos preservado, próximos apontamentos usarão o novo tipo'; END IF;
antigo=public.mt_analise_retrato(_id);
PERFORM set_config('app.analise_rpc','true',true);
UPDATE public.mt_indicadores SET tipo_apontamento=tipo,analise_configurada_em=now(),analise_historico=analise_historico||jsonb_build_array(antigo||jsonb_build_object('ate',now())),prazo_entrega=CASE WHEN tipo='entrega' THEN (_dados->>'prazo_entrega')::date ELSE prazo_entrega END,unidade=CASE WHEN tipo<>'entrega' THEN nullif(_dados->>'unidade','') ELSE unidade END,sentido=CASE WHEN tipo<>'entrega' THEN _dados->>'sentido' ELSE sentido END,meta_semestre=CASE WHEN tipo='valor_periodo' THEN nullif(_dados->>'meta_semestre','')::numeric ELSE meta_semestre END,tolerancia=CASE WHEN tipo='valor_mensal' THEN coalesce(nullif(_dados->>'tolerancia','')::numeric,0) ELSE tolerancia END WHERE id=_id;
IF tipo<>'entrega' AND jsonb_typeof(_dados->'metas')='object' THEN FOR m IN SELECT key,value FROM jsonb_each_text(_dados->'metas') LOOP IF m.key !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN RAISE EXCEPTION 'Competência inválida'; END IF; INSERT INTO public.mt_metas_mensais(indicador_id,competencia,meta_mes) VALUES(_id,m.key,nullif(m.value,'')::numeric) ON CONFLICT(indicador_id,competencia) DO UPDATE SET meta_mes=excluded.meta_mes; END LOOP; END IF;
INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('mt_indicadores',_id::text,'analise_configuracao',antigo::text,public.mt_analise_retrato(_id)::text,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.mt_analise_configurar(uuid,jsonb,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mt_analise_configurar(uuid,jsonb,text,boolean) TO authenticated;
CREATE FUNCTION public.mt_lanc_analise_preservar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.mt_indicadores;
BEGIN SELECT * INTO i FROM public.mt_indicadores WHERE id=NEW.indicador_id;
IF i.origem IN ('okr','cesta') AND i.analise_configurada_em IS NOT NULL THEN
 IF TG_OP='UPDATE' THEN
 IF NEW.valor IS NULL THEN NEW.valor=OLD.valor; END IF;
 IF NEW.declaracao IS NULL THEN NEW.declaracao=OLD.declaracao; NEW.justificativa=coalesce(NEW.justificativa,OLD.justificativa); END IF;
 IF NEW.status_entrega IS NULL THEN NEW.status_entrega=OLD.status_entrega; NEW.avanco_pct=coalesce(NEW.avanco_pct,OLD.avanco_pct); NEW.evidencia=coalesce(NEW.evidencia,OLD.evidencia); END IF;
 END IF;
 NEW.analise_snapshot=public.mt_analise_retrato(i.id);
END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_mt_lanc_analise_preservar BEFORE INSERT OR UPDATE ON public.mt_lancamentos FOR EACH ROW EXECUTE FUNCTION public.mt_lanc_analise_preservar();