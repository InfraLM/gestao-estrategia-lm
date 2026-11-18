CREATE OR REPLACE FUNCTION public.offsite_config_ajustes_20261118(_conteudo jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
SELECT _conteudo || jsonb_build_object(
 'escolhas', (SELECT jsonb_agg(CASE WHEN item->>'id'='5.4' THEN item || '{"arquivado":true}'::jsonb ELSE item END ORDER BY ord) FROM jsonb_array_elements(_conteudo->'escolhas') WITH ORDINALITY a(item,ord)),
 'anexo', replace(_conteudo->>'anexo',' e no working money (5.4)',''),
 'perguntas', (SELECT jsonb_agg((SELECT jsonb_agg(CASE WHEN p->>'id'='4.3' THEN jsonb_set(p,'{campos}',(SELECT coalesce(jsonb_agg(f ORDER BY f_ord),'[]'::jsonb) FROM jsonb_array_elements(p->'campos') WITH ORDINALITY campos(f,f_ord) WHERE f->>'tipo' IS DISTINCT FROM 'diretriz')) ELSE p END ORDER BY p_ord) FROM jsonb_array_elements(bloco) WITH ORDINALITY perguntas(p,p_ord)) ORDER BY b_ord) FROM jsonb_array_elements(_conteudo->'perguntas') WITH ORDINALITY blocos(bloco,b_ord)),
 'caixas', coalesce(_conteudo->'caixas','{}'::jsonb) || jsonb_build_object('4C','Pausar não é encerrar: o destino final será decidido no off-site. As opções são encerrar, manter como complemento de baixo contato da PPG (online e vendido a quem já é aluno), manter sem investimento em ads, ou manter e investir no crescimento, com budget previsto.'),
 'revisao_config', coalesce((_conteudo->>'revisao_config')::integer,0)+1
);
$$;
REVOKE ALL ON FUNCTION public.offsite_config_ajustes_20261118(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.offsite_config_ajustes_20261118(jsonb) TO service_role;
COMMENT ON FUNCTION public.offsite_config_ajustes_20261118(jsonb) IS 'Transformação de conteúdo Pré-Offsite de 18/11/2026; aplicada via operação de dados, sem alterar respostas.';