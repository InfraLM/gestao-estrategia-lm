CREATE TABLE public.decisoes_estrategicas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), codigo text UNIQUE NOT NULL, titulo text NOT NULL, data_decisao date, pergunta text, decisor text, decisao text, opcoes_descartadas text, racional text, tradeoff text, premissas text, papeis_rapid text, revisao text, proxima_revisao date, reuniao_origem text, tipo_forum text DEFAULT 'a_confirmar' CHECK (tipo_forum IN ('ritual_executivo','fora_de_ritual','a_confirmar')), comite_codigo text, foruns_citados text[], responsavel text, impacto_bsc text, acesso_reservado boolean DEFAULT false, revisa_codigo text, fonte text, observacoes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), atualizado_por uuid
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.decisoes_estrategicas TO authenticated;
GRANT ALL ON public.decisoes_estrategicas TO service_role;
ALTER TABLE public.decisoes_estrategicas ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.socios_insights (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), codigo text UNIQUE, desejo text NOT NULL, origem text, dono_proposto text, prazo_custo text, leitura_filtro text, status text, fonte text, observacoes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.socios_insights TO authenticated;
GRANT ALL ON public.socios_insights TO service_role;
ALTER TABLE public.socios_insights ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.org_cadeiras (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, nivel text CHECK (nivel IN ('diretoria','gerencia','coordenacao','po','supervisao','outro')), cadeira_pai_id uuid REFERENCES public.org_cadeiras(id), mt_cadeira_id uuid REFERENCES public.mt_cadeiras(id), ocupante_nome text, ocupante_user_id uuid, missao text, e_o_d_de text, nao_e_o_d_de text, indicadores_rotina text, entregas text, processos text, notas text, ativo boolean DEFAULT true, ordem int, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.org_cadeiras TO authenticated;
GRANT ALL ON public.org_cadeiras TO service_role;
ALTER TABLE public.org_cadeiras ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.incentivo_sistemas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_cadeira_id uuid NOT NULL REFERENCES public.org_cadeiras(id), nome text, periodo text, regra_resumo text, gatilho text, decisao_codigo text, ativo boolean DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.incentivo_sistemas TO authenticated;
GRANT ALL ON public.incentivo_sistemas TO service_role;
ALTER TABLE public.incentivo_sistemas ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.incentivo_metas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sistema_id uuid REFERENCES public.incentivo_sistemas(id) ON DELETE CASCADE, origem text CHECK (origem IN ('arvore_kpis','okr','cesta_metas')), referencia_codigo text, descricao text, peso numeric, meta_texto text, periodo text, ordem int, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.incentivo_metas TO authenticated;
GRANT ALL ON public.incentivo_metas TO service_role;
ALTER TABLE public.incentivo_metas ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.cesta_insights (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mt_cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id), decisao_codigo text, combinado text NOT NULL, indicador_ref text, aderencia text DEFAULT 'nao_avaliado' CHECK (aderencia IN ('atende','parcial','nao_atende','nao_avaliado')), observacao text, avaliado_em date, avaliado_por uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.cesta_insights TO authenticated;
GRANT ALL ON public.cesta_insights TO service_role;
ALTER TABLE public.cesta_insights ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.fase1_acesso(_modulo text, _editar boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND _modulo IN ('decisoes','estrutura','incentivos') AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.usuario_acessos WHERE user_id=auth.uid() AND modulo=_modulo AND CASE WHEN _editar THEN nivel='edicao' ELSE nivel IN ('leitura','edicao') END));
$$;
CREATE FUNCTION public.fase1_ocupante(_cadeira uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.org_cadeiras WHERE id=_cadeira AND ocupante_user_id=auth.uid());
$$;
CREATE FUNCTION public.fase1_diretor(_cadeira uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.mt_cadeiras WHERE id=_cadeira AND diretor_user_id=auth.uid());
$$;
CREATE FUNCTION public.fase1_sistema_proprio(_sistema uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.incentivo_sistemas s JOIN public.org_cadeiras c ON c.id=s.org_cadeira_id WHERE s.id=_sistema AND c.ocupante_user_id=auth.uid());
$$;
CREATE FUNCTION public.fase1_acessos_cadeira() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('ocupante',auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.org_cadeiras WHERE ocupante_user_id=auth.uid()),'diretor',auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.mt_cadeiras WHERE diretor_user_id=auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.fase1_acesso(text,boolean),public.fase1_ocupante(uuid),public.fase1_diretor(uuid),public.fase1_sistema_proprio(uuid),public.fase1_acessos_cadeira() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fase1_acesso(text,boolean),public.fase1_ocupante(uuid),public.fase1_diretor(uuid),public.fase1_sistema_proprio(uuid),public.fase1_acessos_cadeira() TO authenticated,service_role;

CREATE POLICY decisoes_ler ON public.decisoes_estrategicas FOR SELECT TO authenticated USING (public.fase1_acesso('decisoes') AND (acesso_reservado IS NOT TRUE OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY decisoes_inserir ON public.decisoes_estrategicas FOR INSERT TO authenticated WITH CHECK (public.fase1_acesso('decisoes',true) AND (acesso_reservado IS NOT TRUE OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY decisoes_atualizar ON public.decisoes_estrategicas FOR UPDATE TO authenticated USING (public.fase1_acesso('decisoes',true) AND (acesso_reservado IS NOT TRUE OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'))) WITH CHECK (public.fase1_acesso('decisoes',true) AND (acesso_reservado IS NOT TRUE OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY decisoes_excluir ON public.decisoes_estrategicas FOR DELETE TO authenticated USING (public.fase1_acesso('decisoes',true) AND (acesso_reservado IS NOT TRUE OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY socios_insights_ler ON public.socios_insights FOR SELECT TO authenticated USING (public.socios_pode_consolidar(auth.uid()));
CREATE POLICY socios_insights_escrever ON public.socios_insights FOR ALL TO authenticated USING (public.socios_pode_consolidar(auth.uid()) AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'))) WITH CHECK (public.socios_pode_consolidar(auth.uid()) AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY estrutura_ler ON public.org_cadeiras FOR SELECT TO authenticated USING (public.fase1_acesso('estrutura'));
CREATE POLICY estrutura_escrever ON public.org_cadeiras FOR ALL TO authenticated USING (public.fase1_acesso('estrutura',true)) WITH CHECK (public.fase1_acesso('estrutura',true));
CREATE POLICY incentivos_ler ON public.incentivo_sistemas FOR SELECT TO authenticated USING (public.fase1_acesso('incentivos') OR public.fase1_ocupante(org_cadeira_id));
CREATE POLICY incentivos_escrever ON public.incentivo_sistemas FOR ALL TO authenticated USING (public.fase1_acesso('incentivos',true)) WITH CHECK (public.fase1_acesso('incentivos',true));
CREATE POLICY incentivo_metas_ler ON public.incentivo_metas FOR SELECT TO authenticated USING (public.fase1_acesso('incentivos') OR public.fase1_sistema_proprio(sistema_id));
CREATE POLICY incentivo_metas_escrever ON public.incentivo_metas FOR ALL TO authenticated USING (public.fase1_acesso('incentivos',true)) WITH CHECK (public.fase1_acesso('incentivos',true));
CREATE POLICY cesta_insights_ler ON public.cesta_insights FOR SELECT TO authenticated USING (public.fase1_acesso('incentivos') OR public.fase1_diretor(mt_cadeira_id));
CREATE POLICY cesta_insights_escrever ON public.cesta_insights FOR ALL TO authenticated USING (public.fase1_acesso('incentivos',true)) WITH CHECK (public.fase1_acesso('incentivos',true));

CREATE INDEX org_cadeiras_pai_idx ON public.org_cadeiras(cadeira_pai_id);
CREATE INDEX org_cadeiras_mt_idx ON public.org_cadeiras(mt_cadeira_id);
CREATE INDEX org_cadeiras_ocupante_idx ON public.org_cadeiras(ocupante_user_id);
CREATE INDEX incentivo_sistemas_cadeira_idx ON public.incentivo_sistemas(org_cadeira_id);
CREATE INDEX incentivo_metas_sistema_idx ON public.incentivo_metas(sistema_id);
CREATE INDEX cesta_insights_cadeira_idx ON public.cesta_insights(mt_cadeira_id);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['decisoes_estrategicas','socios_insights','org_cadeiras','incentivo_sistemas','incentivo_metas','cesta_insights'] LOOP
 EXECUTE format('CREATE TRIGGER fase1_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM anon',t);
 EXECUTE format('COMMENT ON TABLE public.%I IS %L',t,'Confidential phase 1: excluded from AI inputs and general exports; no monetary remuneration fields.');
END LOOP; END $$;