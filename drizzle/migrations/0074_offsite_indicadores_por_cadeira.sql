CREATE OR REPLACE FUNCTION public.offsite_indicadores() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE resultado jsonb;
BEGIN
IF NOT (public.offsite_admin() OR public.offsite_cadeira() IS NOT NULL) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
WITH mapa(codigo,dono,apoios) AS (VALUES
('ac.01.01','CEO',ARRAY['CPPO']),('ac.01.02','COO',ARRAY[]::text[]),('ac.01.03','CPPO',ARRAY[]::text[]),('ac.02.01','COO',ARRAY[]::text[]),('ac.02.02','COO',ARRAY[]::text[]),('ac.02.03','COO',ARRAY[]::text[]),('ac.02.04','COO',ARRAY[]::text[]),('ac.02.05','COO',ARRAY[]::text[]),('ac.02.06','COO',ARRAY[]::text[]),('ac.02.07','COO',ARRAY[]::text[]),('ac.03.01','CPPO',ARRAY[]::text[]),('ac.03.02','CPPO',ARRAY[]::text[]),('ac.03.03','CPPO',ARRAY[]::text[]),
('p.01.01','COO',ARRAY['CPTO']),('p.01.02','CPTO',ARRAY['COO']),('p.01.03','CPTO',ARRAY['COO']),('p.01.04','CPTO',ARRAY['COO']),('p.02.01','CMO',ARRAY['CPTO']),('p.02.02','CMO',ARRAY['Comercial']),('p.02.03','CMO',ARRAY['Comercial']),('p.02.04','Comercial',ARRAY[]::text[]),('p.02.05','CPTO',ARRAY['CMO','Comercial']),('p.03.01','COO',ARRAY[]::text[]),('p.03.02','COO',ARRAY[]::text[]),('p.03.03','COO',ARRAY[]::text[]),('p.03.04','COO',ARRAY['CPTO']),('p.03.05','COO',ARRAY['CPTO']),
('c.01.01','CMO',ARRAY[]::text[]),('c.01.02','CPTO',ARRAY[]::text[]),('c.01.03','COO',ARRAY['CPTO']),('c.01.04','COO',ARRAY['CPTO']),('c.01.05','COO',ARRAY['CPTO']),('c.01.06','CPTO',ARRAY['COO']),
('f.01.01','CPTO',ARRAY['CMO','Comercial','CFO']),('f.01.02','CPTO',ARRAY['CMO','Comercial']),('f.01.03','CFO',ARRAY['CPTO']),('f.01.04','CPTO',ARRAY['CMO']),('f.02.01','CFO',ARRAY[]::text[]),('f.02.02','CFO',ARRAY[]::text[]),('f.02.03','CFO',ARRAY[]::text[]),('f.02.04','CFO',ARRAY[]::text[]),('f.02.05','CFO',ARRAY[]::text[]),('f.02.06','CFO',ARRAY[]::text[])
), base AS (
SELECT i.*,coalesce(i.cadeira_id,(SELECT ch.id FROM public.mt_cadeiras ch WHERE ch.ativo AND split_part(ch.nome,' ',1)=m.dono LIMIT 1)) AS principal,m.apoios
FROM public.mt_indicadores i LEFT JOIN mapa m ON lower(i.codigo)=m.codigo WHERE i.origem='bsc' AND i.status='ativo' AND i.nivel IN ('Estratégico','Tático')
), pares AS (
SELECT b.*,ch.id AS destino,ch.nome AS cadeira_nome,coalesce(p.nome,ch.diretor_nome) AS diretor,CASE WHEN ch.id=b.principal THEN 'Responsável' ELSE 'Co-responsável' END AS papel
FROM base b JOIN public.mt_cadeiras ch ON ch.ativo AND (ch.id=b.principal OR split_part(ch.nome,' ',1)=ANY(b.apoios)) LEFT JOIN public.offsite_participantes p ON p.cadeira_id=ch.id AND p.ativo
WHERE public.offsite_admin() OR ch.id=public.offsite_cadeira()
)
SELECT coalesce(jsonb_agg(jsonb_build_object('id',b.id,'codigo',b.codigo,'nome',b.nome,'nivel',b.nivel,'perspectiva',CASE WHEN lower(b.codigo) LIKE 'ac%' THEN 'Aprendizado e Crescimento' WHEN lower(b.codigo) LIKE 'p%' THEN 'Processos' WHEN lower(b.codigo) LIKE 'c%' THEN 'Clientes e mercado' ELSE 'Financeira' END,'cadeira_id',b.destino,'diretor',b.diretor,'papel',b.papel,'situacao_atual',coalesce(l.valor::text,ck.valor,ar.kpi->>'situacaoAtual'),'meta_2026',ar.kpi->>'meta2026','fonte',CASE WHEN l.valor IS NOT NULL THEN 'Lançamento '||l.competencia WHEN ck.valor IS NOT NULL THEN 'Checkout '||ck.semana::text ELSE 'Árvore de KPIs' END,'periodo',coalesce(l.competencia,ck.semana::text)) ORDER BY b.codigo,b.papel,b.diretor),'[]') INTO resultado
FROM pares b
LEFT JOIN LATERAL (SELECT x.valor,x.competencia,x.updated_at FROM public.mt_lancamentos x WHERE x.indicador_id=b.id AND NOT x.sem_medicao AND x.valor IS NOT NULL AND x.competencia<=to_char(now(),'YYYY-MM') ORDER BY x.competencia DESC,x.revisao DESC LIMIT 1) l ON true
LEFT JOIN LATERAL (SELECT k->>'situacao_atual' AS valor,c.semana FROM public.mt_checkins c CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(c.conteudo->'kpis_resposta')='array' THEN c.conteudo->'kpis_resposta' ELSE '[]'::jsonb END) k WHERE c.status='enviado' AND c.tipo='checkout' AND k->>'indicador_id'=b.id::text AND nullif(k->>'situacao_atual','') IS NOT NULL ORDER BY c.semana DESC LIMIT 1) ck ON l.valor IS NULL
LEFT JOIN LATERAL (SELECT k AS kpi FROM public.conteudo_editavel ce CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ce.valor)='array' THEN ce.valor ELSE '[]'::jsonb END) o CROSS JOIN LATERAL jsonb_array_elements(coalesce(o->'kpis','[]'::jsonb)) k WHERE ce.chave='bsc.rev02' AND trim(k->>'kpi')=trim(b.nome) LIMIT 1) ar ON true;
RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.offsite_indicadores() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.offsite_indicadores() TO authenticated;
COMMENT ON FUNCTION public.offsite_indicadores() IS 'Pré-Offsite only: scoped BSC owner/co-owner panel, no personal notes or answers; registered principal wins and mapping supplies missing principal/support; does not modify existing module permissions or KPI values.';