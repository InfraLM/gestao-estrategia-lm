CREATE OR REPLACE FUNCTION public.mt_reabrir(_comp text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r int;
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) OR NOT public.acesso_modulo(auth.uid(),'metas',true) THEN RAISE EXCEPTION 'Apenas Governança com permissão de edição'; END IF;
 SELECT revisao INTO r FROM mt_competencias WHERE competencia=_comp AND estado='fechado';
 IF r IS NULL THEN RAISE EXCEPTION 'Competência não está fechada'; END IF;
 INSERT INTO mt_lancamentos(indicador_id,competencia,revisao,valor,sem_medicao,comentario,updated_by,declaracao,justificativa,status_entrega,avanco_pct,evidencia)
 SELECT indicador_id,competencia,r+1,valor,sem_medicao,comentario,updated_by,declaracao,justificativa,status_entrega,avanco_pct,evidencia FROM mt_lancamentos WHERE competencia=_comp AND revisao=r;
 INSERT INTO mt_envios(cadeira_id,competencia,revisao,status,nota)
 SELECT cadeira_id,competencia,r+1,'rascunho',nota FROM mt_envios WHERE competencia=_comp AND revisao=r;
 UPDATE mt_competencias SET estado='reaberto',revisao=r+1 WHERE competencia=_comp;
END $function$;