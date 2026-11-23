CREATE OR REPLACE FUNCTION public.offsite_config_ajustes_20261119(_conteudo jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
SELECT _conteudo || jsonb_build_object(
 'anexo', replace(_conteudo->>'anexo','1. Diretrizes marcadas como ‘Discordo’ e o indicador que o diretor diz que vai mover (bloco 3).','1. Diretrizes marcadas como Discordo ou Ajustaria e o ajuste proposto (bloco 3).'),
 'revisao_config', coalesce((_conteudo->>'revisao_config')::integer,0)+1
);
$$;
REVOKE ALL ON FUNCTION public.offsite_config_ajustes_20261119(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.offsite_config_ajustes_20261119(jsonb) TO service_role;
COMMENT ON FUNCTION public.offsite_config_ajustes_20261119(jsonb) IS 'Transformação Pré-Offsite 19/11/2026 (anexo item 1 da 3.2); aplicada via operação de dados, sem alterar respostas.';