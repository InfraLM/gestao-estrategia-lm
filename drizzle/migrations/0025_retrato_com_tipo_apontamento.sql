CREATE OR REPLACE FUNCTION public.rotina_retrato(_cadeira uuid, _comp text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN NOT public.acesso_modulo(auth.uid(),'rotina',false) THEN '[]'::jsonb ELSE COALESCE(jsonb_agg(jsonb_build_object(
    'indicador_id', i.id, 'codigo', i.codigo, 'nome', i.nome, 'origem', i.origem, 'peso', i.peso, 'sentido', i.sentido, 'unidade', i.unidade,
    'nivel', i.nivel, 'meta_semestre', i.meta_semestre, 'meta_texto', i.meta_texto,
    'tipo_apontamento', i.tipo_apontamento, 'prazo_entrega', i.prazo_entrega,
    'meta_mes', (SELECT m.meta_mes FROM mt_metas_mensais m WHERE m.indicador_id = i.id AND m.competencia = _comp LIMIT 1),
    'realizado', (SELECT l.valor FROM mt_lancamentos l WHERE l.indicador_id = i.id AND l.competencia = _comp AND NOT l.sem_medicao ORDER BY l.revisao DESC LIMIT 1)
  ) ORDER BY i.origem, i.codigo), '[]'::jsonb) END
  FROM mt_indicadores i
  WHERE i.cadeira_id = _cadeira AND i.status = 'ativo' AND i.origem IN ('bsc','okr','cesta') AND i.parent_id IS NULL
    AND (i.origem <> 'bsc' OR COALESCE(i.nivel, 'Tático') IN ('Estratégico','Tático'));
$function$;