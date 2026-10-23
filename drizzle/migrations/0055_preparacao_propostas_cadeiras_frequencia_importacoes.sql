CREATE TABLE public.projeto_cadeira_sugestoes(projeto_id uuid PRIMARY KEY REFERENCES public.projetos(id),principal uuid REFERENCES public.mt_cadeiras(id),apoio uuid[] NOT NULL DEFAULT '{}',confianca text NOT NULL CHECK(confianca IN ('alta','media','baixa')),justificativa text NOT NULL,status text NOT NULL DEFAULT 'proposto' CHECK(status IN ('proposto','aprovado')),criado_por uuid,criado_em timestamptz NOT NULL DEFAULT now(),decidido_por uuid,decidido_em timestamptz);
GRANT SELECT ON public.projeto_cadeira_sugestoes TO authenticated; GRANT ALL ON public.projeto_cadeira_sugestoes TO service_role;
ALTER TABLE public.projeto_cadeira_sugestoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY ler ON public.projeto_cadeira_sugestoes FOR SELECT TO authenticated USING(public.acesso_modulo(auth.uid(),'pmo',false) AND public.mt_is_governanca(auth.uid()));
CREATE TABLE public.mt_frequencia_propostas(indicador_id uuid PRIMARY KEY REFERENCES public.mt_indicadores(id),dados jsonb NOT NULL,status text NOT NULL DEFAULT 'proposto' CHECK(status IN ('proposto','aprovado')),criado_por uuid,criado_em timestamptz NOT NULL DEFAULT now(),decidido_por uuid,decidido_em timestamptz);
GRANT SELECT ON public.mt_frequencia_propostas TO authenticated; GRANT ALL ON public.mt_frequencia_propostas TO service_role;
ALTER TABLE public.mt_frequencia_propostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY ler ON public.mt_frequencia_propostas FOR SELECT TO authenticated USING(public.proj_gov_ou_ceo(auth.uid()) AND (public.acesso_modulo(auth.uid(),'rotina',false) OR public.acesso_modulo(auth.uid(),'metas',false)));
CREATE TABLE public.ciclo_preparacao_execucoes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tipo text NOT NULL,usuario_id uuid,status text NOT NULL DEFAULT 'executando',analisados integer NOT NULL DEFAULT 0,propostos integer NOT NULL DEFAULT 0,erro text,run_id text,criado_em timestamptz NOT NULL DEFAULT now(),concluido_em timestamptz);
GRANT SELECT ON public.ciclo_preparacao_execucoes TO authenticated; GRANT ALL ON public.ciclo_preparacao_execucoes TO service_role;
ALTER TABLE public.ciclo_preparacao_execucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY ler ON public.ciclo_preparacao_execucoes FOR SELECT TO authenticated USING(public.proj_gov_ou_ceo(auth.uid()));
CREATE OR REPLACE FUNCTION public.projeto_aprovar_sugestoes(_itens jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE e jsonb; idp uuid; cad uuid; ap uuid[]; anterior jsonb; n integer:=0; BEGIN
 IF NOT coalesce(public.mt_is_governanca(auth.uid()),false) OR NOT public.acesso_modulo(auth.uid(),'pmo',true) THEN RAISE EXCEPTION 'Somente Governança'; END IF;
 IF jsonb_typeof(_itens)<>'array' OR jsonb_array_length(_itens) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Selecione entre 1 e 200 projetos'; END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(_itens) LOOP
 idp:=(e->>'projeto_id')::uuid; cad:=(e->>'principal')::uuid; SELECT coalesce(array_agg(x::uuid),'{}'::uuid[]) INTO ap FROM jsonb_array_elements_text(coalesce(e->'apoio','[]')) x;
 IF cad IS NULL OR NOT EXISTS(SELECT 1 FROM mt_cadeiras WHERE id=cad AND ativo) OR EXISTS(SELECT 1 FROM unnest(ap) x WHERE NOT EXISTS(SELECT 1 FROM mt_cadeiras WHERE id=x AND ativo)) THEN RAISE EXCEPTION 'Cadeira inválida'; END IF;
 SELECT to_jsonb(p) INTO anterior FROM projetos p WHERE id=idp FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Projeto inexistente'; END IF;
 PERFORM public.projeto_definir_cadeira(ARRAY[idp],cad,ap);
 UPDATE projeto_cadeira_sugestoes SET status='aprovado',principal=cad,apoio=ap,decidido_por=auth.uid(),decidido_em=now() WHERE projeto_id=idp;
 INSERT INTO mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('projetos',idp::text,'cadeira_principal',anterior::text,jsonb_build_object('principal',cad,'apoio',ap)::text,auth.uid()); n:=n+1;
 END LOOP; RETURN n; END $$;
REVOKE ALL ON FUNCTION public.projeto_aprovar_sugestoes(jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.projeto_aprovar_sugestoes(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.mt_aprovar_frequencias(_ids uuid[]) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r record;n integer:=0; BEGIN
 IF NOT coalesce(public.proj_gov_ou_ceo(auth.uid()),false) THEN RAISE EXCEPTION 'Somente Governança/CEO'; END IF;
 IF coalesce(array_length(_ids,1),0) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Seleção inválida'; END IF;
 FOR r IN SELECT p.* FROM mt_frequencia_propostas p JOIN mt_indicadores i ON i.id=p.indicador_id WHERE p.indicador_id=ANY(_ids) AND p.status='proposto' AND i.origem IN ('okr','cesta') FOR UPDATE OF p LOOP
 PERFORM public.mt_frequencia_salvar(r.indicador_id,r.dados);
 UPDATE mt_frequencia_propostas SET status='aprovado',decidido_por=auth.uid(),decidido_em=now() WHERE indicador_id=r.indicador_id; n:=n+1; END LOOP; RETURN n; END $$;
REVOKE ALL ON FUNCTION public.mt_aprovar_frequencias(uuid[]) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.mt_aprovar_frequencias(uuid[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.orc_importar_modelo(_itens jsonb,_arquivo text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE e jsonb;p uuid;cc text;n integer:=0;lid uuid; BEGIN
 IF NOT coalesce(public.mt_is_governanca(auth.uid()),false) OR NOT public.orc_pode_ler() THEN RAISE EXCEPTION 'Somente Governança'; END IF;
 IF jsonb_typeof(_itens)<>'array' OR jsonb_array_length(_itens) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Selecione até 500 linhas'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_itens) x GROUP BY x->>'codigo' HAVING count(*)>1) THEN RAISE EXCEPTION 'Código duplicado'; END IF;
 INSERT INTO orc_sync_log(modo,usuario_id,arquivo) VALUES('modelo_budget',auth.uid(),left(_arquivo,255)) RETURNING id INTO lid;
 FOR e IN SELECT value FROM jsonb_array_elements(_itens) LOOP
 SELECT id INTO p FROM projetos WHERE codigo=e->>'codigo'; IF NOT FOUND THEN RAISE EXCEPTION 'Código desconhecido: %',e->>'codigo'; END IF;
 IF e->>'budget' IS NOT NULL AND e->>'budget'<>'' THEN PERFORM public.orc_budget_salvar(p,(e->>'budget')::numeric,e->>'fonte'); END IF;
 FOR cc IN SELECT value FROM jsonb_array_elements_text(coalesce(e->'centros','[]')) LOOP
 IF nullif(btrim(cc),'') IS NULL THEN RAISE EXCEPTION 'Centro vazio'; END IF;
 IF NOT EXISTS(SELECT 1 FROM orc_projeto_centros WHERE projeto_id=p AND centro_custo=btrim(cc) AND status='confirmado') THEN PERFORM public.orc_centro_salvar(p,cc,'propor'); END IF; END LOOP; n:=n+1;
 END LOOP;
 UPDATE orc_sync_log SET ok=true,registros=n,concluido_em=now(),mensagem='Budgets salvos; centros novos propostos, sem confirmação automática' WHERE id=lid;RETURN n; END $$;
REVOKE ALL ON FUNCTION public.orc_importar_modelo(jsonb,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.orc_importar_modelo(jsonb,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.orc_importar_metas2030(_itens jsonb,_arquivo text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE e jsonb;n integer:=0;lid uuid; BEGIN
 IF NOT coalesce(public.proj_gov_ou_ceo(auth.uid()),false) OR NOT public.acesso_modulo(auth.uid(),'pmo',false) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF jsonb_typeof(_itens)<>'array' OR jsonb_array_length(_itens) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Seleção inválida'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_itens) x GROUP BY x->>'id' HAVING count(*)>1) THEN RAISE EXCEPTION 'KPI duplicado'; END IF;
 INSERT INTO orc_sync_log(modo,usuario_id,arquivo) VALUES('metas2030',auth.uid(),left(_arquivo,255)) RETURNING id INTO lid;
 FOR e IN SELECT value FROM jsonb_array_elements(_itens) LOOP
 IF nullif(btrim(e->>'meta'),'') IS NULL THEN CONTINUE; END IF;
 IF NOT EXISTS(SELECT 1 FROM mt_indicadores WHERE id=(e->>'id')::uuid AND origem='bsc' AND status='ativo' AND parent_id IS NULL) THEN RAISE EXCEPTION 'KPI não permitido'; END IF;
 PERFORM public.orc_meta_salvar((e->>'id')::uuid,e->>'meta');n:=n+1; END LOOP;
 UPDATE orc_sync_log SET ok=true,registros=n,concluido_em=now() WHERE id=lid;RETURN n; END $$;
REVOKE ALL ON FUNCTION public.orc_importar_metas2030(jsonb,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.orc_importar_metas2030(jsonb,text) TO authenticated;