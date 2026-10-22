
DROP FUNCTION IF EXISTS public.rotina_situacoes_kpi();
CREATE FUNCTION public.rotina_situacoes_kpi()
RETURNS TABLE(cadeira_id uuid, semana date, enviado_em timestamptz, indicador_id text, situacao_atual text, ok boolean, plano_sem_iniciativa boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.cadeira_id, c.semana, c.enviado_em, k->>'indicador_id', NULLIF(k->>'situacao_atual', ''),
    CASE WHEN jsonb_typeof(k->'ok') = 'boolean' THEN (k->>'ok')::boolean END,
    (k->>'ok') = 'false' AND COALESCE(k->>'iniciativa_criada_id', '') = ''
  FROM public.mt_checkins c, jsonb_array_elements(CASE WHEN jsonb_typeof(c.conteudo->'kpis_resposta') = 'array' THEN c.conteudo->'kpis_resposta' ELSE '[]'::jsonb END) k
  WHERE c.tipo = 'checkout' AND c.status = 'enviado' AND (COALESCE(k->>'situacao_atual', '') <> '' OR (k->>'ok') = 'false') AND public.rotina_ve_todas(auth.uid())
$$;
REVOKE EXECUTE ON FUNCTION public.rotina_situacoes_kpi() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rotina_situacoes_kpi() TO authenticated;
