ALTER TABLE public.usuario_acessos DROP CONSTRAINT usuario_acessos_nivel_check;
ALTER TABLE public.usuario_acessos ADD CONSTRAINT usuario_acessos_nivel_check CHECK (nivel IN ('nenhum','leitura','edicao','edicao_propria'));
ALTER TABLE public.usuario_acessos ADD CONSTRAINT usuario_acessos_propria_modulo_check CHECK (nivel <> 'edicao_propria' OR modulo IN ('okrs','repositorios'));

CREATE OR REPLACE FUNCTION public.acesso_proprio(_uid uuid, _modulo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT _uid IS NOT NULL AND NOT public.is_lider_restrito(_uid)
    AND EXISTS (SELECT 1 FROM public.usuario_acessos WHERE user_id=_uid AND modulo=_modulo AND nivel='edicao_propria');
$$;
REVOKE ALL ON FUNCTION public.acesso_proprio(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.acesso_proprio(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.okr_kr_proprio(_uid uuid, _origem text, _cadeira uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT _origem = 'okr' AND public.acesso_proprio(_uid,'okrs') AND public.okr_diretor_da_cadeira(_uid,_cadeira);
$$;
REVOKE ALL ON FUNCTION public.okr_kr_proprio(uuid, text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.okr_kr_proprio(uuid, text, uuid) TO authenticated, service_role;

-- Repositórios: nível próprio só nos documentos enviados pelo usuário
ALTER POLICY acesso_atualizar ON public.repositorio_documentos
  USING (public.acesso_modulo(auth.uid(),'repositorios',true) OR (public.acesso_proprio(auth.uid(),'repositorios') AND submitted_by = auth.uid()))
  WITH CHECK (public.acesso_modulo(auth.uid(),'repositorios',true) OR (public.acesso_proprio(auth.uid(),'repositorios') AND submitted_by = auth.uid()));
ALTER POLICY acesso_excluir ON public.repositorio_documentos
  USING (public.acesso_modulo(auth.uid(),'repositorios',true) OR (public.acesso_proprio(auth.uid(),'repositorios') AND submitted_by = auth.uid()));
ALTER POLICY acesso_inserir ON public.repositorio_documentos
  WITH CHECK (public.acesso_modulo(auth.uid(),'repositorios',true) OR (public.acesso_proprio(auth.uid(),'repositorios') AND submitted_by = auth.uid()));

-- OKRs: KRs da própria cadeira
ALTER POLICY acesso_atualizar ON public.mt_indicadores
  USING (public.acesso_modulo(auth.uid(), CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END, true) OR public.okr_kr_proprio(auth.uid(), origem, cadeira_id))
  WITH CHECK (public.acesso_modulo(auth.uid(), CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END, true) OR public.okr_kr_proprio(auth.uid(), origem, cadeira_id));
ALTER POLICY acesso_excluir ON public.mt_indicadores
  USING (public.acesso_modulo(auth.uid(), CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END, true) OR public.okr_kr_proprio(auth.uid(), origem, cadeira_id));
ALTER POLICY acesso_inserir ON public.mt_indicadores
  WITH CHECK (public.acesso_modulo(auth.uid(), CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END, true) OR public.okr_kr_proprio(auth.uid(), origem, cadeira_id));
CREATE POLICY okr_proprio_exclui ON public.mt_indicadores AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.okr_kr_proprio(auth.uid(), origem, cadeira_id));

ALTER POLICY acesso_atualizar ON public.mt_metas_mensais
  USING (public.acesso_modulo(auth.uid(), COALESCE((SELECT CASE WHEN i.origem='cesta' THEN 'cesta' ELSE 'metas' END FROM public.mt_indicadores i WHERE i.id = mt_metas_mensais.indicador_id),'metas'), true)
    OR EXISTS (SELECT 1 FROM public.mt_indicadores i WHERE i.id = mt_metas_mensais.indicador_id AND public.okr_kr_proprio(auth.uid(), i.origem, i.cadeira_id)))
  WITH CHECK (public.acesso_modulo(auth.uid(), COALESCE((SELECT CASE WHEN i.origem='cesta' THEN 'cesta' ELSE 'metas' END FROM public.mt_indicadores i WHERE i.id = mt_metas_mensais.indicador_id),'metas'), true)
    OR EXISTS (SELECT 1 FROM public.mt_indicadores i WHERE i.id = mt_metas_mensais.indicador_id AND public.okr_kr_proprio(auth.uid(), i.origem, i.cadeira_id)));
ALTER POLICY acesso_excluir ON public.mt_metas_mensais
  USING (public.acesso_modulo(auth.uid(), COALESCE((SELECT CASE WHEN i.origem='cesta' THEN 'cesta' ELSE 'metas' END FROM public.mt_indicadores i WHERE i.id = mt_metas_mensais.indicador_id),'metas'), true)
    OR EXISTS (SELECT 1 FROM public.mt_indicadores i WHERE i.id = mt_metas_mensais.indicador_id AND public.okr_kr_proprio(auth.uid(), i.origem, i.cadeira_id)));
ALTER POLICY acesso_inserir ON public.mt_metas_mensais
  WITH CHECK (public.acesso_modulo(auth.uid(), COALESCE((SELECT CASE WHEN i.origem='cesta' THEN 'cesta' ELSE 'metas' END FROM public.mt_indicadores i WHERE i.id = mt_metas_mensais.indicador_id),'metas'), true)
    OR EXISTS (SELECT 1 FROM public.mt_indicadores i WHERE i.id = mt_metas_mensais.indicador_id AND public.okr_kr_proprio(auth.uid(), i.origem, i.cadeira_id)));