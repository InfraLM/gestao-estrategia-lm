CREATE OR REPLACE FUNCTION public.rotina_dashboard_kpis(_semanas date[])
RETURNS TABLE(cadeira_id uuid, semana date, status text, enviado_em timestamptz, primeiro_envio_em text, completude jsonb, kpis jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.cadeira_id, c.semana, c.status, c.enviado_em, c.conteudo->>'primeiro_envio_em', c.conteudo->'completude',
    coalesce((SELECT jsonb_agg(jsonb_build_object(
      'indicador_id', k->>'indicador_id', 'codigo', k->>'codigo', 'nome', k->>'nome', 'origem', k->>'origem', 'nivel', k->>'nivel',
      'tipo_apontamento', k->>'tipo_apontamento', 'sentido', k->>'sentido', 'periodo_label', coalesce(k->>'periodo_label', k->>'competencia'),
      'meta_mes', k->'meta_mes', 'meta_semestre', k->'meta_semestre', 'meta_texto', k->>'meta_texto', 'realizado', k->'realizado', 'prazo_entrega', k->>'prazo_entrega',
      'voluntario', coalesce((k->>'voluntario')::boolean,false) OR coalesce((r->>'voluntario')::boolean,false),
      'desvio_critico', coalesce((k->>'desvio_critico')::boolean,false) OR coalesce((r->>'desvio_critico')::boolean,false),
      'situacao_atual', left(r->>'situacao_atual',200), 'declaracao', r->>'declaracao', 'status_entrega', r->>'status_entrega', 'avanco_pct', r->>'avanco_pct'))
      FROM jsonb_array_elements(coalesce(c.conteudo->'kpis_retrato','[]')) k
      LEFT JOIN LATERAL (SELECT x FROM jsonb_array_elements(coalesce(c.conteudo->'kpis_resposta','[]')) x WHERE x->>'indicador_id'=k->>'indicador_id' LIMIT 1) rr(r) ON true), '[]'::jsonb)
  FROM public.mt_checkins c
  WHERE c.tipo='checkout' AND c.semana = ANY(_semanas) AND cardinality(_semanas) <= 26
    AND public.rotina_ve_todas(auth.uid()) AND public.acesso_modulo(auth.uid(),'rotina',false)
$$;
REVOKE ALL ON FUNCTION public.rotina_dashboard_kpis(date[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rotina_dashboard_kpis(date[]) TO authenticated;
COMMENT ON FUNCTION public.rotina_dashboard_kpis(date[]) IS 'Dashboard consolidado: projeção só de KPIs (valor, situação, período, meta) de todas as cadeiras para diretores/Governança/CEO; sem causas, justificativas, comentários, contatos ou anexos.';