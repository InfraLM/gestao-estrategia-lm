-- Objetivo: guardar as reuniões enviadas pelo app de Reuniões (TI) ao Gestão e Estratégia.
-- Data: 25/11/2026. Autor: Arthur Matos. Origem: PR arthur/integracoes-receber-reunioes.
-- Regras: gravação só pela service role via reun_receber; nada é apagado (itens que somem
-- do envio ficam removido = true; reunião apagada fica excluida = true); leitura só Governança/CEO.

CREATE TABLE IF NOT EXISTS public.reun_reunioes (
  id text PRIMARY KEY,
  titulo text NOT NULL,
  inicio timestamptz NOT NULL,
  fim timestamptz,
  ritual_codigo text, ritual_nome text,
  organizador_nome text, organizador_email text,
  ata_status text CHECK (ata_status IN ('rascunho','validada')),
  ata_validada_por_nome text, ata_validada_por_email text, ata_validada_em timestamptz,
  gravacao_link text, gravacao_resumo text, gravacao_transcricao text,
  excluida boolean NOT NULL DEFAULT false,
  origem_atualizado_em timestamptz NOT NULL,
  recebido_em timestamptz NOT NULL DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reun_reunioes TO authenticated;
GRANT ALL ON public.reun_reunioes TO service_role;
CREATE TABLE IF NOT EXISTS public.reun_participantes (
  reuniao_id text NOT NULL REFERENCES public.reun_reunioes(id),
  chave text NOT NULL, nome text, email text, presente boolean,
  removido boolean NOT NULL DEFAULT false, atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reuniao_id, chave)
);
GRANT SELECT ON public.reun_participantes TO authenticated;
GRANT ALL ON public.reun_participantes TO service_role;
CREATE TABLE IF NOT EXISTS public.reun_pauta (
  reuniao_id text NOT NULL REFERENCES public.reun_reunioes(id),
  ordem integer NOT NULL, titulo text NOT NULL, descricao text,
  removido boolean NOT NULL DEFAULT false, atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reuniao_id, ordem)
);
GRANT SELECT ON public.reun_pauta TO authenticated;
GRANT ALL ON public.reun_pauta TO service_role;
CREATE TABLE IF NOT EXISTS public.reun_deliberacoes (
  reuniao_id text NOT NULL REFERENCES public.reun_reunioes(id),
  origem_id text NOT NULL, titulo text NOT NULL, racional text,
  responsavel_nome text, responsavel_email text,
  removido boolean NOT NULL DEFAULT false, atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reuniao_id, origem_id)
);
GRANT SELECT ON public.reun_deliberacoes TO authenticated;
GRANT ALL ON public.reun_deliberacoes TO service_role;
CREATE TABLE IF NOT EXISTS public.reun_acoes (
  reuniao_id text NOT NULL REFERENCES public.reun_reunioes(id),
  origem_id text NOT NULL, titulo text NOT NULL, descricao text,
  responsavel_nome text, responsavel_email text, prazo date,
  status text CHECK (status IN ('aberta','em_andamento','concluida','cancelada')),
  prioridade text CHECK (prioridade IN ('alta','media','baixa')),
  precisa_escalar boolean,
  removido boolean NOT NULL DEFAULT false, atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reuniao_id, origem_id)
);
GRANT SELECT ON public.reun_acoes TO authenticated;
GRANT ALL ON public.reun_acoes TO service_role;
CREATE TABLE IF NOT EXISTS public.reun_recebimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id text NOT NULL, resultado text NOT NULL,
  recebido_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reun_recebimentos TO authenticated;
GRANT ALL ON public.reun_recebimentos TO service_role;
CREATE INDEX IF NOT EXISTS reun_acoes_resp ON public.reun_acoes(responsavel_email);
CREATE INDEX IF NOT EXISTS reun_reunioes_inicio ON public.reun_reunioes(inicio);

ALTER TABLE public.reun_reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reun_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reun_pauta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reun_deliberacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reun_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reun_recebimentos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.reun_reunioes, public.reun_participantes, public.reun_pauta, public.reun_deliberacoes, public.reun_acoes, public.reun_recebimentos FROM anon, PUBLIC;
GRANT SELECT ON public.reun_reunioes, public.reun_participantes, public.reun_pauta, public.reun_deliberacoes, public.reun_acoes, public.reun_recebimentos TO authenticated;
GRANT ALL ON public.reun_reunioes, public.reun_participantes, public.reun_pauta, public.reun_deliberacoes, public.reun_acoes, public.reun_recebimentos TO service_role;

CREATE POLICY reun_reunioes_ler ON public.reun_reunioes FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY reun_participantes_ler ON public.reun_participantes FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY reun_pauta_ler ON public.reun_pauta FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY reun_deliberacoes_ler ON public.reun_deliberacoes FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY reun_acoes_ler ON public.reun_acoes FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));
CREATE POLICY reun_recebimentos_ler ON public.reun_recebimentos FOR SELECT TO authenticated USING (public.proj_gov_ou_ceo(auth.uid()));

CREATE OR REPLACE FUNCTION public.reun_receber(_dados jsonb) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid text := nullif(btrim(_dados->>'id'), ''); novo timestamptz := (_dados->>'atualizado_em')::timestamptz; atual timestamptz;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF rid IS NULL OR novo IS NULL THEN RAISE EXCEPTION 'id e atualizado_em são obrigatórios'; END IF;
  SELECT origem_atualizado_em INTO atual FROM public.reun_reunioes WHERE id = rid;
  -- Envio mais antigo que o que já temos (chegou fora de ordem): ignora.
  IF atual IS NOT NULL AND atual > novo THEN
    INSERT INTO public.reun_recebimentos(reuniao_id, resultado) VALUES (rid, 'ignorado_antigo');
    RETURN 'ignorado_antigo';
  END IF;
  IF coalesce((_dados->>'excluida')::boolean, false) THEN
    UPDATE public.reun_reunioes SET excluida = true, origem_atualizado_em = novo, recebido_em = now() WHERE id = rid;
    INSERT INTO public.reun_recebimentos(reuniao_id, resultado) VALUES (rid, 'excluida');
    RETURN 'excluida';
  END IF;

  INSERT INTO public.reun_reunioes(id, titulo, inicio, fim, ritual_codigo, ritual_nome, organizador_nome, organizador_email,
    ata_status, ata_validada_por_nome, ata_validada_por_email, ata_validada_em, gravacao_link, gravacao_resumo, gravacao_transcricao,
    excluida, origem_atualizado_em, recebido_em)
  VALUES (rid, _dados->>'titulo', (_dados->>'inicio')::timestamptz, (_dados->>'fim')::timestamptz, _dados->>'ritual_codigo', _dados->>'ritual_nome',
    _dados->>'organizador_nome', _dados->>'organizador_email', _dados->>'ata_status', _dados->>'ata_validada_por_nome', _dados->>'ata_validada_por_email',
    (_dados->>'ata_validada_em')::timestamptz, _dados->>'gravacao_link', _dados->>'gravacao_resumo', _dados->>'gravacao_transcricao', false, novo, now())
  ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, inicio = EXCLUDED.inicio, fim = EXCLUDED.fim,
    ritual_codigo = EXCLUDED.ritual_codigo, ritual_nome = EXCLUDED.ritual_nome, organizador_nome = EXCLUDED.organizador_nome,
    organizador_email = EXCLUDED.organizador_email, ata_status = EXCLUDED.ata_status, ata_validada_por_nome = EXCLUDED.ata_validada_por_nome,
    ata_validada_por_email = EXCLUDED.ata_validada_por_email, ata_validada_em = EXCLUDED.ata_validada_em, gravacao_link = EXCLUDED.gravacao_link,
    gravacao_resumo = EXCLUDED.gravacao_resumo, gravacao_transcricao = EXCLUDED.gravacao_transcricao, excluida = false,
    origem_atualizado_em = EXCLUDED.origem_atualizado_em, recebido_em = now();

  -- Listas: o que veio é atualizado; o que não veio mais fica removido = true (nada é apagado).
  INSERT INTO public.reun_participantes(reuniao_id, chave, nome, email, presente, removido, atualizado_em)
  SELECT rid, x.chave, x.nome, x.email, x.presente, false, now() FROM jsonb_to_recordset(coalesce(_dados->'participantes', '[]')) AS x(chave text, nome text, email text, presente boolean)
  ON CONFLICT (reuniao_id, chave) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, presente = EXCLUDED.presente, removido = false, atualizado_em = now();
  UPDATE public.reun_participantes SET removido = true, atualizado_em = now() WHERE reuniao_id = rid AND NOT removido
    AND chave NOT IN (SELECT x.chave FROM jsonb_to_recordset(coalesce(_dados->'participantes', '[]')) AS x(chave text));

  INSERT INTO public.reun_pauta(reuniao_id, ordem, titulo, descricao, removido, atualizado_em)
  SELECT rid, x.ordem, x.titulo, x.descricao, false, now() FROM jsonb_to_recordset(coalesce(_dados->'pauta', '[]')) AS x(ordem integer, titulo text, descricao text)
  ON CONFLICT (reuniao_id, ordem) DO UPDATE SET titulo = EXCLUDED.titulo, descricao = EXCLUDED.descricao, removido = false, atualizado_em = now();
  UPDATE public.reun_pauta SET removido = true, atualizado_em = now() WHERE reuniao_id = rid AND NOT removido
    AND ordem NOT IN (SELECT x.ordem FROM jsonb_to_recordset(coalesce(_dados->'pauta', '[]')) AS x(ordem integer));

  INSERT INTO public.reun_deliberacoes(reuniao_id, origem_id, titulo, racional, responsavel_nome, responsavel_email, removido, atualizado_em)
  SELECT rid, x.origem_id, x.titulo, x.racional, x.responsavel_nome, x.responsavel_email, false, now()
  FROM jsonb_to_recordset(coalesce(_dados->'deliberacoes', '[]')) AS x(origem_id text, titulo text, racional text, responsavel_nome text, responsavel_email text)
  ON CONFLICT (reuniao_id, origem_id) DO UPDATE SET titulo = EXCLUDED.titulo, racional = EXCLUDED.racional, responsavel_nome = EXCLUDED.responsavel_nome,
    responsavel_email = EXCLUDED.responsavel_email, removido = false, atualizado_em = now();
  UPDATE public.reun_deliberacoes SET removido = true, atualizado_em = now() WHERE reuniao_id = rid AND NOT removido
    AND origem_id NOT IN (SELECT x.origem_id FROM jsonb_to_recordset(coalesce(_dados->'deliberacoes', '[]')) AS x(origem_id text));

  INSERT INTO public.reun_acoes(reuniao_id, origem_id, titulo, descricao, responsavel_nome, responsavel_email, prazo, status, prioridade, precisa_escalar, removido, atualizado_em)
  SELECT rid, x.origem_id, x.titulo, x.descricao, x.responsavel_nome, x.responsavel_email, x.prazo, x.status, x.prioridade, x.precisa_escalar, false, now()
  FROM jsonb_to_recordset(coalesce(_dados->'acoes', '[]')) AS x(origem_id text, titulo text, descricao text, responsavel_nome text, responsavel_email text,
    prazo date, status text, prioridade text, precisa_escalar boolean)
  ON CONFLICT (reuniao_id, origem_id) DO UPDATE SET titulo = EXCLUDED.titulo, descricao = EXCLUDED.descricao, responsavel_nome = EXCLUDED.responsavel_nome,
    responsavel_email = EXCLUDED.responsavel_email, prazo = EXCLUDED.prazo, status = EXCLUDED.status, prioridade = EXCLUDED.prioridade,
    precisa_escalar = EXCLUDED.precisa_escalar, removido = false, atualizado_em = now();
  UPDATE public.reun_acoes SET removido = true, atualizado_em = now() WHERE reuniao_id = rid AND NOT removido
    AND origem_id NOT IN (SELECT x.origem_id FROM jsonb_to_recordset(coalesce(_dados->'acoes', '[]')) AS x(origem_id text));

  INSERT INTO public.reun_recebimentos(reuniao_id, resultado) VALUES (rid, 'gravado');
  RETURN 'gravado';
END $$;
REVOKE EXECUTE ON FUNCTION public.reun_receber(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reun_receber(jsonb) TO service_role;