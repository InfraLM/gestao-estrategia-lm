CREATE OR REPLACE FUNCTION public.offsite_indicadores()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE resultado jsonb;
BEGIN
IF NOT (public.offsite_admin() OR public.offsite_cadeira() IS NOT NULL) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
WITH mapa(id,dono,apoios) AS (VALUES
('86aeee5d-8fe0-42de-800a-8d254f817864'::uuid,'CEO',ARRAY['CPPO']),
('5b6b8a65-28e5-4451-b423-28d05c97449a'::uuid,'COO',ARRAY[]::text[]),
('9c099e90-788a-43a2-950b-65cc0c171445'::uuid,'CPPO',ARRAY[]::text[]),
('2ef8f8fa-d2b6-47f7-8ed6-bf21229cd6c1'::uuid,'COO',ARRAY[]::text[]),
('0ef25ffc-931d-4b99-9a41-435083d62d23'::uuid,'COO',ARRAY[]::text[]),
('d211dfa3-bf01-4474-b1df-8a5cb4c15dd5'::uuid,'COO',ARRAY[]::text[]),
('3137187f-78b7-4504-b499-2899088c00d1'::uuid,'COO',ARRAY[]::text[]),
('d6498dd0-0fd2-4c71-8815-e58b3ef8cce4'::uuid,'COO',ARRAY[]::text[]),
('2e992209-bbd5-451d-8d5c-baadb8c57d3c'::uuid,'COO',ARRAY[]::text[]),
('0c4a316a-621f-44b6-9357-4da9feab592c'::uuid,'COO',ARRAY[]::text[]),
('f7965bf4-9ecd-4190-a354-bce389eb6976'::uuid,'CPPO',ARRAY[]::text[]),
('5ebf56d2-8743-48e1-810e-70a4cf144c86'::uuid,'CPPO',ARRAY[]::text[]),
('d7d07fa1-dc04-4130-9f15-395816c18f13'::uuid,'CPPO',ARRAY[]::text[]),
('d71749d1-2438-41eb-a71a-8f2bc180ef09'::uuid,'COO',ARRAY['CPTO']),
('175d5ec0-48a3-4398-8399-97277256f418'::uuid,'CPTO',ARRAY['COO']),
('8ea6c75b-8055-40ae-bc34-71f8e0265d2c'::uuid,'CPTO',ARRAY['COO']),
('bda45ef0-049b-410f-a4b1-2d3eca69d01d'::uuid,'CPTO',ARRAY['COO']),
('67a18b85-abbe-431a-afa5-e2b7f6b1b7d9'::uuid,'CMO',ARRAY['CPTO']),
('292acc89-7466-45cc-979d-ba4fb70cba07'::uuid,'CMO',ARRAY['Comercial']),
('ae9fea6b-1e08-43eb-89f8-834b09e3e2b5'::uuid,'CMO',ARRAY['Comercial']),
('22d162a3-17a0-4bb8-b4da-2186ca118000'::uuid,'Comercial',ARRAY[]::text[]),
('8901fdd2-4ab4-463e-8e5a-1597ee51bfe2'::uuid,'CPTO',ARRAY['CMO','Comercial']),
('dd87b705-f460-41aa-9b9e-ed635c04d26b'::uuid,'COO',ARRAY[]::text[]),
('f490be28-bf9d-416e-8dfd-7d1d1a129a9b'::uuid,'COO',ARRAY[]::text[]),
('ca83430c-edf3-4663-b17c-e4d254c98971'::uuid,'COO',ARRAY[]::text[]),
('7bedfdc8-629c-41de-acef-d18304f85987'::uuid,'COO',ARRAY['CPTO']),
('fd12641d-0d5a-47b1-b10d-f5c2318945b3'::uuid,'COO',ARRAY['CPTO']),
('c4ad256a-8a4f-4d44-ba24-35df3d24988f'::uuid,'CMO',ARRAY[]::text[]),
('aeb52178-0c11-4f26-b92d-2308b6d271cc'::uuid,'CPTO',ARRAY[]::text[]),
('b964922c-291b-43cd-98c1-f79daf9d3b40'::uuid,'COO',ARRAY['CPTO']),
('9c79129e-31d0-497f-86ca-8d1ca814d670'::uuid,'COO',ARRAY['CPTO']),
('987773c0-4aa8-4479-b26b-a275a956d39c'::uuid,'COO',ARRAY['CPTO']),
('9712824e-d22b-4c71-8276-7aca028c0a77'::uuid,'CPTO',ARRAY['COO']),
('e00d08ff-8e8c-4d7a-9c7f-1c2301067162'::uuid,'CPTO',ARRAY['CMO','Comercial','CFO']),
('6cd74506-b355-4e6e-a65b-3ce3d567cb63'::uuid,'CPTO',ARRAY['CMO','Comercial']),
('63246060-d642-4c10-9cd1-63904fb8eca3'::uuid,'CFO',ARRAY['CPTO']),
('7ca9bc12-fc46-48d5-b6d3-2228f852402c'::uuid,'CPTO',ARRAY['CMO']),
('4d7ac721-8e53-4f02-a995-6a3044546c50'::uuid,'CFO',ARRAY[]::text[]),
('c382e1f3-91bb-410c-84e9-9c88d1e83602'::uuid,'CFO',ARRAY[]::text[]),
('bfc6c275-d6ab-47ec-9ae6-c251e9aa123f'::uuid,'CFO',ARRAY[]::text[]),
('5ec5f94e-de56-4737-83e7-61c34e22e884'::uuid,'CFO',ARRAY[]::text[]),
('ab9350ea-2d48-4dcc-acac-62dee31b956a'::uuid,'CFO',ARRAY[]::text[]),
('616adc83-1dac-486e-b3c1-27a9214746c7'::uuid,'CFO',ARRAY[]::text[])
), base AS (
SELECT i.*,coalesce(i.cadeira_id,(SELECT ch.id FROM public.mt_cadeiras ch WHERE ch.ativo AND split_part(ch.nome,' ',1)=m.dono LIMIT 1)) AS principal,m.apoios
FROM public.mt_indicadores i LEFT JOIN mapa m ON m.id=i.id WHERE i.origem='bsc' AND i.status='ativo' AND i.nivel IN ('Estratégico','Tático')
), pares AS (
SELECT b.*,ch.id AS destino,ch.nome AS cadeira_nome,coalesce(p.nome,ch.diretor_nome) AS diretor,CASE WHEN ch.id=b.principal THEN 'Responsável' ELSE 'Co-responsável' END AS papel
FROM base b JOIN public.mt_cadeiras ch ON ch.ativo AND (ch.id=b.principal OR split_part(ch.nome,' ',1)=ANY(b.apoios)) LEFT JOIN public.offsite_participantes p ON p.cadeira_id=ch.id AND p.ativo
WHERE public.offsite_admin() OR ch.id=public.offsite_cadeira()
UNION ALL
SELECT b.*,NULL::uuid,NULL::text,'A definir','A definir' FROM base b WHERE b.principal IS NULL AND coalesce(cardinality(b.apoios),0)=0 AND public.offsite_admin()
)
SELECT coalesce(jsonb_agg(jsonb_build_object('id',b.id,'codigo',b.codigo,'nome',b.nome,'nome_anterior',b.nome_anterior,'sem_status_d091',b.sem_status_d091,'nivel',b.nivel,'perspectiva',CASE WHEN lower(b.codigo) LIKE 'ac%' THEN 'Aprendizado e Crescimento' WHEN lower(b.codigo) LIKE 'p%' THEN 'Processos' WHEN lower(b.codigo) LIKE 'c%' THEN 'Clientes e mercado' ELSE 'Financeira' END,'cadeira_id',b.destino,'diretor',b.diretor,'papel',b.papel,'situacao_atual',coalesce(l.valor::text,ck.valor,ar.kpi->>'situacaoAtual'),'meta_2026',ar.kpi->>'meta2026','fonte',CASE WHEN l.valor IS NOT NULL THEN 'Lançamento '||l.competencia WHEN ck.valor IS NOT NULL THEN 'Checkout '||ck.semana::text ELSE 'Árvore de KPIs' END,'periodo',coalesce(l.competencia,ck.semana::text)) ORDER BY b.codigo,b.papel,b.diretor),'[]') INTO resultado
FROM pares b
LEFT JOIN LATERAL (SELECT x.valor,x.competencia,x.updated_at FROM public.mt_lancamentos x WHERE x.indicador_id=b.id AND NOT x.sem_medicao AND x.valor IS NOT NULL AND x.competencia<=to_char(now(),'YYYY-MM') ORDER BY x.competencia DESC,x.revisao DESC LIMIT 1) l ON true
LEFT JOIN LATERAL (SELECT k->>'situacao_atual' AS valor,c.semana FROM public.mt_checkins c CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(c.conteudo->'kpis_resposta')='array' THEN c.conteudo->'kpis_resposta' ELSE '[]'::jsonb END) k WHERE c.status='enviado' AND c.tipo='checkout' AND k->>'indicador_id'=b.id::text AND nullif(k->>'situacao_atual','') IS NOT NULL ORDER BY c.semana DESC LIMIT 1) ck ON l.valor IS NULL
LEFT JOIN LATERAL (SELECT k AS kpi FROM public.conteudo_editavel ce CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ce.valor)='array' THEN ce.valor ELSE '[]'::jsonb END) o CROSS JOIN LATERAL jsonb_array_elements(coalesce(o->'kpis','[]'::jsonb)) k WHERE ce.chave='bsc.rev02' AND trim(k->>'kpi') IN (trim(b.nome),trim(coalesce(b.nome_anterior,''))) LIMIT 1) ar ON true;
RETURN resultado;
END $function$;

CREATE OR REPLACE FUNCTION public.offsite_referencias()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ BEGIN IF NOT (offsite_admin() OR offsite_cadeira() IS NOT NULL) THEN RAISE EXCEPTION 'Sem permissão'; END IF; RETURN jsonb_build_object('cadeiras',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'nome',nome,'diretor_nome',diretor_nome,'diretor_user_id',diretor_user_id) ORDER BY nome),'[]') FROM mt_cadeiras WHERE ativo),'objetivos',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'codigo',codigo,'nome',descricao) ORDER BY codigo),'[]') FROM mt_objetivos),'kpis',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'codigo',codigo,'nome',nome,'objetivo_id',objetivo_id,'nome_anterior',nome_anterior,'sem_status_d091',sem_status_d091) ORDER BY codigo),'[]') FROM mt_indicadores WHERE origem='bsc' AND status='ativo'),'kpis_arquivados',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'codigo',codigo,'nome',nome,'nome_anterior',nome_anterior) ORDER BY codigo),'[]') FROM mt_indicadores WHERE origem='bsc' AND status='arquivado'),'processos',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'nome',nome) ORDER BY nome),'[]') FROM processos WHERE ativo)); END $function$;