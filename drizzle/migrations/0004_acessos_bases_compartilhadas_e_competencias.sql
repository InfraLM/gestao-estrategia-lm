CREATE OR REPLACE FUNCTION public.mt_fechar(_comp text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) OR NOT public.acesso_modulo(auth.uid(),'metas',true) THEN RAISE EXCEPTION 'Apenas Governança com permissão de edição'; END IF;
 UPDATE mt_competencias SET estado='fechado',fechado_por=auth.uid(),fechado_em=now() WHERE competencia=_comp;
END $$;
CREATE OR REPLACE FUNCTION public.mt_reabrir(_comp text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r int;
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) OR NOT public.acesso_modulo(auth.uid(),'metas',true) THEN RAISE EXCEPTION 'Apenas Governança com permissão de edição'; END IF;
 SELECT revisao INTO r FROM mt_competencias WHERE competencia=_comp AND estado='fechado';
 IF r IS NULL THEN RAISE EXCEPTION 'Competência não está fechada'; END IF;
 INSERT INTO mt_lancamentos(indicador_id,competencia,revisao,valor,sem_medicao,comentario,updated_by)
 SELECT indicador_id,competencia,r+1,valor,sem_medicao,comentario,updated_by FROM mt_lancamentos WHERE competencia=_comp AND revisao=r;
 INSERT INTO mt_envios(cadeira_id,competencia,revisao,status,nota)
 SELECT cadeira_id,competencia,r+1,'rascunho',nota FROM mt_envios WHERE competencia=_comp AND revisao=r;
 UPDATE mt_competencias SET estado='reaberto',revisao=r+1 WHERE competencia=_comp;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['mt_cadeiras','mt_objetivos','mt_okrs','mt_okr_objetivos','mt_indicadores','mt_metas_mensais','mt_iniciativas'] LOOP
 EXECUTE format('ALTER POLICY acesso_consulta ON public.%I USING (public.acesso_modulo(auth.uid(),''metas'',false) OR public.acesso_modulo(auth.uid(),''rotina'',false) OR public.acesso_modulo(auth.uid(),''cesta'',false) OR public.acesso_modulo(auth.uid(),''okrs'',false))',t);
 END LOOP;
END $$;
ALTER POLICY acesso_inserir ON public.mt_indicadores WITH CHECK (public.acesso_modulo(auth.uid(),CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END,true));
ALTER POLICY acesso_atualizar ON public.mt_indicadores USING (public.acesso_modulo(auth.uid(),CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END,true)) WITH CHECK (public.acesso_modulo(auth.uid(),CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END,true));
ALTER POLICY acesso_excluir ON public.mt_indicadores USING (public.acesso_modulo(auth.uid(),CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END,true));
ALTER POLICY acesso_inserir ON public.mt_metas_mensais WITH CHECK (public.acesso_modulo(auth.uid(), COALESCE((SELECT CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END FROM public.mt_indicadores WHERE id=indicador_id),'metas'),true));
ALTER POLICY acesso_atualizar ON public.mt_metas_mensais USING (public.acesso_modulo(auth.uid(), COALESCE((SELECT CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END FROM public.mt_indicadores WHERE id=indicador_id),'metas'),true)) WITH CHECK (public.acesso_modulo(auth.uid(), COALESCE((SELECT CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END FROM public.mt_indicadores WHERE id=indicador_id),'metas'),true));
ALTER POLICY acesso_excluir ON public.mt_metas_mensais USING (public.acesso_modulo(auth.uid(), COALESCE((SELECT CASE WHEN origem='cesta' THEN 'cesta' ELSE 'metas' END FROM public.mt_indicadores WHERE id=indicador_id),'metas'),true));
ALTER POLICY acesso_atualizar ON public.mt_iniciativas USING (public.acesso_modulo(auth.uid(),'metas',true) OR public.acesso_modulo(auth.uid(),'rotina',true)) WITH CHECK (public.acesso_modulo(auth.uid(),'metas',true) OR public.acesso_modulo(auth.uid(),'rotina',true));
REVOKE EXECUTE ON FUNCTION public.mt_fechar(text),public.mt_reabrir(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mt_fechar(text),public.mt_reabrir(text) TO authenticated,service_role;