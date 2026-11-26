-- Objetivo: guardar o resumo da API do orçamento do FP&A (orçado, realizado e projetado por centro de custo,
-- categoria do DRE e indicador calculado, nas visões competência e caixa).
-- Data: 26/11/2026. Autor: Arthur Matos. Origem: API liberada pelo Gabriel (FP&A) em 26/11; PR #21 (arthur/integracoes-orcamento-api-fpa).
-- Regras: centro_custo_id 0 = consolidado da empresa; nada é apagado (cada sincronização atualiza pela chave);
-- leitura só Governança/CEO; gravação só por orc_fpa_importar, com registro em orc_sync_log.

CREATE TABLE IF NOT EXISTS public.orc_fpa_linhas (
  visao text NOT NULL CHECK (visao IN ('competencia','caixa')),
  ano integer NOT NULL CHECK (ano BETWEEN 2020 AND 2100),
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  centro_custo_id integer NOT NULL DEFAULT 0 CHECK (centro_custo_id >= 0),
  item_tipo text NOT NULL CHECK (item_tipo IN ('categoria','calculado')),
  item_chave text NOT NULL CHECK (length(item_chave) BETWEEN 1 AND 200),
  centro_custo_nome text,
  bu_id integer,
  item_nome text NOT NULL,
  categoria_tipo text CHECK (categoria_tipo IN ('receita','despesa')),
  formato text,
  orcado numeric,
  realizado numeric,
  projetado numeric,
  forecast_nome text,
  sincronizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visao, ano, mes, centro_custo_id, item_tipo, item_chave)
);
REVOKE ALL ON public.orc_fpa_linhas FROM anon, PUBLIC;
GRANT SELECT ON public.orc_fpa_linhas TO authenticated;
GRANT ALL ON public.orc_fpa_linhas TO service_role;
ALTER TABLE public.orc_fpa_linhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY orc_fpa_linhas_ler ON public.orc_fpa_linhas FOR SELECT TO authenticated
  USING (public.orc_pode_ler() AND public.proj_gov_ou_ceo(auth.uid()));

CREATE OR REPLACE FUNCTION public.orc_fpa_importar(_linhas jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; lid uuid;
BEGIN
  IF NOT public.orc_pode_ler() OR NOT public.proj_gov_ou_ceo(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orc_integracao_config WHERE id = true AND ativo) THEN RAISE EXCEPTION 'Integração desligada'; END IF;
  IF _linhas IS NULL OR jsonb_typeof(_linhas) <> 'array' OR jsonb_array_length(_linhas) > 20000 THEN
    RAISE EXCEPTION 'Lote inválido (máximo 20000)';
  END IF;
  INSERT INTO public.orc_sync_log(modo, ok, usuario_id) VALUES ('api', false, auth.uid()) RETURNING id INTO lid;
  INSERT INTO public.orc_fpa_linhas(visao, ano, mes, centro_custo_id, item_tipo, item_chave, centro_custo_nome, bu_id,
    item_nome, categoria_tipo, formato, orcado, realizado, projetado, forecast_nome, sincronizado_em)
  SELECT x.visao, x.ano, x.mes, coalesce(x.centro_custo_id, 0), x.item_tipo, x.item_chave, left(x.centro_custo_nome, 200), x.bu_id,
    left(x.item_nome, 200), x.categoria_tipo, left(x.formato, 30), x.orcado, x.realizado, x.projetado, left(x.forecast_nome, 200), now()
  FROM jsonb_to_recordset(_linhas) AS x(visao text, ano integer, mes integer, centro_custo_id integer, item_tipo text, item_chave text,
    centro_custo_nome text, bu_id integer, item_nome text, categoria_tipo text, formato text, orcado numeric, realizado numeric,
    projetado numeric, forecast_nome text)
  ON CONFLICT (visao, ano, mes, centro_custo_id, item_tipo, item_chave) DO UPDATE SET
    centro_custo_nome = EXCLUDED.centro_custo_nome, bu_id = EXCLUDED.bu_id, item_nome = EXCLUDED.item_nome,
    categoria_tipo = EXCLUDED.categoria_tipo, formato = EXCLUDED.formato, orcado = EXCLUDED.orcado,
    realizado = EXCLUDED.realizado, projetado = EXCLUDED.projetado, forecast_nome = EXCLUDED.forecast_nome, sincronizado_em = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE public.orc_sync_log SET ok = true, registros = n, concluido_em = now(), mensagem = 'Resumo FP&A' WHERE id = lid;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.orc_fpa_importar(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.orc_fpa_importar(jsonb) TO authenticated, service_role;