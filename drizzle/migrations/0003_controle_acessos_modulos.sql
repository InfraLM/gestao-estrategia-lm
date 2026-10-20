CREATE TABLE public.usuario_acessos (
 user_id uuid NOT NULL,
 modulo text NOT NULL CHECK (modulo IN ('estrategia','pmo','bpmo','okrs','cesta','metas','rotina','historico','repositorios')),
 nivel text NOT NULL CHECK (nivel IN ('nenhum','leitura','edicao')),
 atualizado_por uuid DEFAULT auth.uid(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, modulo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuario_acessos TO authenticated;
GRANT ALL ON public.usuario_acessos TO service_role;
ALTER TABLE public.usuario_acessos ENABLE ROW LEVEL SECURITY;
CREATE POLICY acessos_ler ON public.usuario_acessos FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY acessos_gerenciar ON public.usuario_acessos FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE FUNCTION public.acesso_modulo(_uid uuid, _modulo text, _editar boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT _uid IS NOT NULL AND (public.is_super_admin(_uid) OR COALESCE((SELECT CASE WHEN _editar THEN nivel='edicao' ELSE nivel<>'nenhum' END FROM public.usuario_acessos WHERE user_id=_uid AND modulo=_modulo), true));
$$;
CREATE FUNCTION public.editor_modulo(_uid uuid, _modulo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT _uid IS NOT NULL AND (public.is_super_admin(_uid) OR EXISTS (SELECT 1 FROM public.usuario_acessos WHERE user_id=_uid AND modulo=_modulo AND nivel='edicao'));
$$;
CREATE FUNCTION public.modulo_conteudo(_chave text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
 SELECT CASE WHEN _chave LIKE 'okrs.%' THEN 'okrs' WHEN _chave LIKE 'cesta.%' THEN 'cesta' WHEN _chave LIKE 'melh.%' THEN 'pmo' ELSE 'estrategia' END;
$$;
CREATE OR REPLACE FUNCTION public.is_admin_of_modulo(_user_id uuid, _modulo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.acesso_modulo(_user_id,_modulo,true) AND (public.editor_modulo(_user_id,_modulo) OR EXISTS (SELECT 1 FROM public.admin_modulos WHERE user_id=_user_id AND modulo=_modulo));
$$;
CREATE OR REPLACE FUNCTION public.can_review_modulo(_user_id uuid, _modulo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.acesso_modulo(_user_id,_modulo,true) AND (public.editor_modulo(_user_id,_modulo) OR public.has_role(_user_id,'admin') OR public.has_role(_user_id,'pmo') OR EXISTS (SELECT 1 FROM public.admin_modulos WHERE user_id=_user_id AND modulo=_modulo));
$$;
REVOKE ALL ON FUNCTION public.acesso_modulo(uuid,text,boolean), public.editor_modulo(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acesso_modulo(uuid,text,boolean), public.editor_modulo(uuid,text) TO authenticated, service_role;

DO $$
DECLARE t text; m text;
BEGIN
 FOR t,m IN SELECT * FROM (VALUES
 ('backlog_submissoes','estrategia'),('backlog_propostas_ia','estrategia'),('diagnostico_insights','estrategia'),('estrategia_insights','estrategia'),('riscos_institucionais','estrategia'),
 ('projetos','pmo'),('projeto_membros','pmo'),('projeto_reunioes','pmo'),('eap_itens','pmo'),('cronograma_itens','pmo'),('entrega_submissoes','pmo'),('status_reports','pmo'),('status_report_drafts','pmo'),('bc_scorecard_submissoes','pmo'),('melhoria_business_case','pmo'),
 ('processos','bpmo'),('repositorio_documentos','repositorios'),
 ('mt_cadeiras','metas'),('mt_usuarios','metas'),('mt_convites','metas'),('mt_objetivos','metas'),('mt_okrs','metas'),('mt_okr_objetivos','metas'),('mt_indicadores','metas'),('mt_metas_mensais','metas'),('mt_lancamentos','metas'),('mt_envios','metas'),('mt_competencias','metas'),('mt_parametros','metas'),('mt_auditoria','metas'),('mt_status_projetos','metas'),('mt_iniciativas','metas'),('mt_checkins','rotina')) AS mapping(tab,mod)
 LOOP
 EXECUTE format('CREATE POLICY acesso_consulta ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),%L,false))',t,m);
 EXECUTE format('CREATE POLICY acesso_inserir ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),%L,true))',t,m);
 EXECUTE format('CREATE POLICY acesso_atualizar ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),%L,true)) WITH CHECK (public.acesso_modulo(auth.uid(),%L,true))',t,m,m);
 EXECUTE format('CREATE POLICY acesso_excluir ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.acesso_modulo(auth.uid(),%L,true))',t,m);
 END LOOP;
END $$;
CREATE POLICY acesso_consulta ON public.conteudo_editavel AS RESTRICTIVE FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),public.modulo_conteudo(chave),false));
CREATE POLICY acesso_inserir ON public.conteudo_editavel AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),public.modulo_conteudo(chave),true));
CREATE POLICY acesso_atualizar ON public.conteudo_editavel AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),public.modulo_conteudo(chave),true)) WITH CHECK (public.acesso_modulo(auth.uid(),public.modulo_conteudo(chave),true));
CREATE POLICY editor_conteudo ON public.conteudo_editavel FOR ALL TO authenticated USING (public.editor_modulo(auth.uid(),public.modulo_conteudo(chave))) WITH CHECK (public.editor_modulo(auth.uid(),public.modulo_conteudo(chave)));
CREATE POLICY acesso_consulta ON public.base_submissoes AS RESTRICTIVE FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),modulo,false));
CREATE POLICY acesso_inserir ON public.base_submissoes AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),modulo,true));
CREATE POLICY acesso_atualizar ON public.base_submissoes AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),modulo,true)) WITH CHECK (public.acesso_modulo(auth.uid(),modulo,true));
CREATE POLICY acesso_consulta ON public.base_propostas_ia AS RESTRICTIVE FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),modulo,false));
CREATE POLICY acesso_atualizar ON public.base_propostas_ia AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),modulo,true)) WITH CHECK (public.acesso_modulo(auth.uid(),modulo,true));
DO $$ DECLARE t text; m text; BEGIN
 FOR t,m IN SELECT * FROM (VALUES ('projetos','pmo'),('cronograma_itens','pmo'),('eap_itens','pmo'),('processos','bpmo'),('riscos_institucionais','estrategia')) AS mapping(tab,mod) LOOP
 EXECUTE format('CREATE POLICY editor_autorizado ON public.%I FOR ALL TO authenticated USING (public.editor_modulo(auth.uid(),%L)) WITH CHECK (public.editor_modulo(auth.uid(),%L))',t,m,m);
 END LOOP;
END $$;
CREATE POLICY roles_controle_seguro ON public.user_roles AS RESTRICTIVE FOR ALL TO authenticated USING (true) WITH CHECK (public.is_super_admin(auth.uid()) OR (role <> 'super_admin' AND public.has_role(auth.uid(),'admin')));
CREATE POLICY roles_admin_principal ON public.user_roles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY roles_excluir_seguro ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) OR role <> 'super_admin');
CREATE POLICY profiles_admin_departamento ON public.profiles FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.proteger_ultimo_admin_principal() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(8142701);
 IF OLD.role='super_admin' AND (TG_OP='DELETE' OR NEW.role<>'super_admin' OR NEW.user_id<>OLD.user_id) AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role='super_admin' AND id<>OLD.id) THEN
 RAISE EXCEPTION 'Não é permitido remover o último Admin Principal';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER proteger_admin_principal BEFORE DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.proteger_ultimo_admin_principal();