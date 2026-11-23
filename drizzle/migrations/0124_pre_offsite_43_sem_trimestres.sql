CREATE OR REPLACE FUNCTION public.offsite_config_ajustes_20261119b(_conteudo jsonb, _revisao boolean DEFAULT true)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
SELECT _conteudo || jsonb_build_object(
 'perguntas', (SELECT jsonb_agg((SELECT jsonb_agg(CASE WHEN p->>'id'='4.3' THEN jsonb_set(p,'{campos}',(SELECT coalesce(jsonb_agg(f ORDER BY f_ord),'[]'::jsonb) FROM jsonb_array_elements(p->'campos') WITH ORDINALITY campos(f,f_ord) WHERE f->>'nome' NOT IN ('T1','T2','T3','T4'))) ELSE p END ORDER BY p_ord) FROM jsonb_array_elements(bloco) WITH ORDINALITY perguntas(p,p_ord)) ORDER BY b_ord) FROM jsonb_array_elements(_conteudo->'perguntas') WITH ORDINALITY blocos(bloco,b_ord))
) || CASE WHEN _revisao THEN jsonb_build_object('revisao_config', coalesce((_conteudo->>'revisao_config')::integer,0)+1) ELSE '{}'::jsonb END;
$$;
REVOKE ALL ON FUNCTION public.offsite_config_ajustes_20261119b(jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.offsite_config_ajustes_20261119b(jsonb, boolean) TO service_role;
COMMENT ON FUNCTION public.offsite_config_ajustes_20261119b(jsonb, boolean) IS 'Pré-Offsite 19/11/2026: 4.3 sem T1–T4; aplicada via operação de dados, sem alterar respostas.';