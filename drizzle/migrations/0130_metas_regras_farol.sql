-- Objetivo: regras do farol configuráveis pela Governança (faixa geral do amarelo e exceção por indicador).
-- Data: 25/11/2026. Autor: Arthur Matos. Origem: pedido da Naira (25/11), PR arthur/metas-regras-do-farol.
-- Regras: nada é apagado (exceção removida fica ativo = false); toda mudança vai para mt_auditoria;
-- gravação só pela função mt_farol_salvar; leitura igual à de mt_indicadores.

CREATE TABLE IF NOT EXISTS public.mt_farol_regras (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  amarelo_pct numeric NOT NULL DEFAULT 0.05 CHECK (amarelo_pct >= 0 AND amarelo_pct <= 0.5),
  motivo text,
  atualizado_por uuid,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.mt_farol_regras FROM anon, PUBLIC;
GRANT SELECT ON public.mt_farol_regras TO authenticated;
GRANT ALL ON public.mt_farol_regras TO service_role;

CREATE TABLE IF NOT EXISTS public.mt_farol_excecoes (
  indicador_id uuid PRIMARY KEY REFERENCES public.mt_indicadores(id),
  amarelo_pct numeric NOT NULL CHECK (amarelo_pct >= 0 AND amarelo_pct <= 0.5),
  motivo text,
  ativo boolean NOT NULL DEFAULT true,
  atualizado_por uuid,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.mt_farol_excecoes FROM anon, PUBLIC;
GRANT SELECT ON public.mt_farol_excecoes TO authenticated;
GRANT ALL ON public.mt_farol_excecoes TO service_role;

ALTER TABLE public.mt_farol_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt_farol_excecoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY mt_farol_regras_ler ON public.mt_farol_regras FOR SELECT TO authenticated
  USING (public.mt_email_corporativo() OR public.mt_is_governanca(auth.uid()));
CREATE POLICY mt_farol_regras_modulo ON public.mt_farol_regras AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.acesso_modulo(auth.uid(),'metas',false) OR public.acesso_modulo(auth.uid(),'rotina',false)
      OR public.acesso_modulo(auth.uid(),'cesta',false) OR public.acesso_modulo(auth.uid(),'okrs',false));
CREATE POLICY mt_farol_excecoes_ler ON public.mt_farol_excecoes FOR SELECT TO authenticated
  USING (public.mt_email_corporativo() OR public.mt_is_governanca(auth.uid()));
CREATE POLICY mt_farol_excecoes_modulo ON public.mt_farol_excecoes AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.acesso_modulo(auth.uid(),'metas',false) OR public.acesso_modulo(auth.uid(),'rotina',false)
      OR public.acesso_modulo(auth.uid(),'cesta',false) OR public.acesso_modulo(auth.uid(),'okrs',false));

-- _indicador_id NULL = faixa geral; _pct NULL (com indicador) = tirar a exceção (fica ativo = false).
CREATE OR REPLACE FUNCTION public.mt_farol_salvar(_indicador_id uuid, _pct numeric, _motivo text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE antes numeric; ativo_antes boolean;
BEGIN
  IF NOT coalesce(public.mt_is_governanca(auth.uid()), false) THEN
    RAISE EXCEPTION 'Somente a Governança altera as regras do farol';
  END IF;
  IF _pct IS NOT NULL AND (_pct < 0 OR _pct > 0.5) THEN
    RAISE EXCEPTION 'A faixa do amarelo deve ficar entre 0%% e 50%% da meta';
  END IF;

  IF _indicador_id IS NULL THEN
    IF _pct IS NULL THEN RAISE EXCEPTION 'Informe a faixa geral'; END IF;
    SELECT amarelo_pct INTO antes FROM public.mt_farol_regras WHERE id = 1 FOR UPDATE;
    UPDATE public.mt_farol_regras SET amarelo_pct = _pct, motivo = left(_motivo, 1000),
      atualizado_por = auth.uid(), atualizado_em = now() WHERE id = 1;
    INSERT INTO public.mt_auditoria(tabela, registro_id, campo, valor_anterior, valor_novo, alterado_por, alterado_em)
      VALUES ('mt_farol_regras', 'geral', 'amarelo_pct', antes::text, _pct::text, auth.uid(), now());
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.mt_indicadores WHERE id = _indicador_id) THEN
    RAISE EXCEPTION 'Indicador não encontrado';
  END IF;
  SELECT amarelo_pct, ativo INTO antes, ativo_antes FROM public.mt_farol_excecoes WHERE indicador_id = _indicador_id FOR UPDATE;

  IF _pct IS NULL THEN
    UPDATE public.mt_farol_excecoes SET ativo = false, motivo = coalesce(left(_motivo, 1000), motivo),
      atualizado_por = auth.uid(), atualizado_em = now() WHERE indicador_id = _indicador_id AND ativo;
    IF FOUND THEN
      INSERT INTO public.mt_auditoria(tabela, registro_id, campo, valor_anterior, valor_novo, alterado_por, alterado_em)
        VALUES ('mt_farol_excecoes', _indicador_id::text, 'amarelo_pct', antes::text, NULL, auth.uid(), now());
    END IF;
    RETURN;
  END IF;

  INSERT INTO public.mt_farol_excecoes(indicador_id, amarelo_pct, motivo, ativo, atualizado_por, atualizado_em)
    VALUES (_indicador_id, _pct, left(_motivo, 1000), true, auth.uid(), now())
  ON CONFLICT (indicador_id) DO UPDATE SET amarelo_pct = EXCLUDED.amarelo_pct, motivo = EXCLUDED.motivo,
    ativo = true, atualizado_por = auth.uid(), atualizado_em = now();
  INSERT INTO public.mt_auditoria(tabela, registro_id, campo, valor_anterior, valor_novo, alterado_por, alterado_em)
    VALUES ('mt_farol_excecoes', _indicador_id::text, 'amarelo_pct', CASE WHEN ativo_antes THEN antes::text END, _pct::text, auth.uid(), now());
END $$;
REVOKE EXECUTE ON FUNCTION public.mt_farol_salvar(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mt_farol_salvar(uuid, numeric, text) TO authenticated, service_role;