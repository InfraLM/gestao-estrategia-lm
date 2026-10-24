ALTER TABLE public.socios_links ADD COLUMN IF NOT EXISTS token text;
ALTER TABLE public.socios_links ADD COLUMN IF NOT EXISTS primeiro_acesso_em timestamptz;
COMMENT ON COLUMN public.socios_links.token IS 'Link token readable only through socios_links_painel (consolidators); never granted to client roles.';

-- Client roles may read link metadata, never the token column.
REVOKE SELECT ON public.socios_links FROM authenticated;
GRANT SELECT (id, participante_id, criado_por, criado_em, expira_em, revogado_em, ultimo_acesso_em, primeiro_acesso_em) ON public.socios_links TO authenticated;

CREATE TABLE IF NOT EXISTS public.socios_link_acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.socios_links(id) ON DELETE CASCADE,
  participante_id uuid NOT NULL,
  acao text NOT NULL CHECK (acao IN ('abrir','salvar','enviar')),
  em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS socios_link_acessos_participante_idx ON public.socios_link_acessos (participante_id, em DESC);
GRANT SELECT ON public.socios_link_acessos TO authenticated;
GRANT ALL ON public.socios_link_acessos TO service_role;
ALTER TABLE public.socios_link_acessos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "socios_link_acessos_select" ON public.socios_link_acessos FOR SELECT TO authenticated
  USING (public.socios_pode_consolidar(auth.uid()));

-- Resolves a token, records the access and returns the respondent user id.
CREATE OR REPLACE FUNCTION public.socios_link_acesso(_token text, _acao text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.socios_participantes; _l public.socios_links;
BEGIN
  IF _acao NOT IN ('abrir','salvar','enviar') THEN RAISE EXCEPTION 'Ação inválida'; END IF;
  SELECT * INTO _l FROM public.socios_links
    WHERE token_hash = encode(sha256(convert_to(coalesce(_token,''), 'UTF8')), 'hex')
      AND revogado_em IS NULL AND now() <= expira_em;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link inválido, expirado ou revogado'; END IF;
  SELECT * INTO _p FROM public.socios_participantes WHERE id = _l.participante_id AND ativo AND respondente;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link inválido'; END IF;
  IF _p.user_id IS NULL THEN
    UPDATE public.socios_participantes SET user_id = gen_random_uuid(), user_id_provisorio = true
      WHERE id = _p.id RETURNING * INTO _p;
  END IF;
  UPDATE public.socios_links SET ultimo_acesso_em = now(), primeiro_acesso_em = coalesce(primeiro_acesso_em, now()) WHERE id = _l.id;
  INSERT INTO public.socios_link_acessos (link_id, participante_id, acao) VALUES (_l.id, _p.id, _acao);
  RETURN _p.user_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_link_acesso(text, text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.socios_link_carregar(_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  _uid := public.socios_link_acesso(_token, 'abrir');
  RETURN jsonb_build_object(
    'participante', (SELECT jsonb_build_object('nome_exibicao', nome_exibicao, 'respondente', true, 'pode_ver_consolidado', false) FROM public.socios_participantes WHERE user_id = _uid),
    'resposta', (SELECT to_jsonb(r) FROM public.socios_respostas_2027 r WHERE user_id = _uid),
    'produtos_info', (SELECT valor FROM public.conteudo_editavel WHERE chave = 'socios.produtos2027'));
END $$;

CREATE OR REPLACE FUNCTION public.socios_link_salvar(_token text, _respostas jsonb, _diretrizes jsonb, _projetos jsonb, _extras jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _r public.socios_respostas_2027;
BEGIN
  _uid := public.socios_link_acesso(_token, 'salvar');
  INSERT INTO public.socios_respostas_2027 (user_id, respostas, diretrizes, projetos, extras)
    VALUES (_uid, coalesce(_respostas,'{}'), coalesce(_diretrizes,'[]'), coalesce(_projetos,'[]'), coalesce(_extras,'{}'))
  ON CONFLICT (user_id) DO UPDATE SET respostas = EXCLUDED.respostas, diretrizes = EXCLUDED.diretrizes,
    projetos = EXCLUDED.projetos, extras = EXCLUDED.extras
  RETURNING * INTO _r;
  RETURN to_jsonb(_r);
END $$;

CREATE OR REPLACE FUNCTION public.socios_link_enviar(_token text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; r public.socios_respostas_2027;
BEGIN
  _uid := public.socios_link_acesso(_token, 'enviar');
  SELECT * INTO r FROM public.socios_respostas_2027 WHERE user_id = _uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sem resposta para enviar'; END IF;
  IF NOT public.socios_prazo_aberto(r.reaberto_ate) THEN RAISE EXCEPTION 'Prazo encerrado em 06/11/2026. Peça reabertura.'; END IF;
  PERFORM set_config('socios.interno', '1', true);
  UPDATE public.socios_respostas_2027 SET status = 'enviado', versao = r.versao + 1, enviado_em = now(),
    primeiro_envio_em = coalesce(r.primeiro_envio_em, now()) WHERE id = r.id;
  INSERT INTO public.socios_respostas_versoes (resposta_id, user_id, versao, respostas, diretrizes, projetos, extras)
    VALUES (r.id, r.user_id, r.versao + 1, r.respostas, r.diretrizes, r.projetos, r.extras);
  PERFORM set_config('socios.interno', '0', true);
END $$;
GRANT EXECUTE ON FUNCTION public.socios_link_carregar(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.socios_link_salvar(text, jsonb, jsonb, jsonb, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.socios_link_enviar(text) TO anon, authenticated;

COMMENT ON FUNCTION public.socios_link_uid(text) IS 'DEPRECATED: replaced by socios_link_acesso(text, text), which also records accesses.';

-- New link with configurable validity; revokes the previous one.
DROP FUNCTION IF EXISTS public.socios_link_gerar(uuid);
CREATE FUNCTION public.socios_link_gerar(_participante_id uuid, _expira_em timestamptz DEFAULT NULL) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tok text; _exp timestamptz;
BEGIN
  IF NOT public.socios_pode_consolidar(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.socios_participantes WHERE id = _participante_id AND respondente AND ativo) THEN
    RAISE EXCEPTION 'Participante não é respondente'; END IF;
  _exp := coalesce(_expira_em, greatest(timestamptz '2026-11-06 23:59:59-03', now() + interval '7 days'));
  IF _exp <= now() THEN RAISE EXCEPTION 'A validade precisa ser uma data futura'; END IF;
  IF _exp > now() + interval '366 days' THEN RAISE EXCEPTION 'A validade máxima é de um ano'; END IF;
  UPDATE public.socios_links SET revogado_em = now() WHERE participante_id = _participante_id AND revogado_em IS NULL;
  _tok := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  INSERT INTO public.socios_links (participante_id, token_hash, token, criado_por, expira_em)
    VALUES (_participante_id, encode(sha256(convert_to(_tok, 'UTF8')), 'hex'), _tok, auth.uid(), _exp);
  RETURN _tok;
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_link_gerar(uuid, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.socios_link_gerar(uuid, timestamptz) TO authenticated;

-- Governance panel: one row per respondent with current link and situation.
CREATE OR REPLACE FUNCTION public.socios_links_painel()
RETURNS TABLE(participante_id uuid, nome text, email text, token text, link_ativo boolean, criado_em timestamptz, expira_em timestamptz,
  primeiro_acesso_em timestamptz, ultimo_acesso_em timestamptz, acessos bigint, situacao text, enviado_em timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.socios_pode_consolidar(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  RETURN QUERY
  SELECT p.id, p.nome_exibicao, p.email, l.token, (l.id IS NOT NULL), l.criado_em, l.expira_em,
    (SELECT min(x.primeiro_acesso_em) FROM public.socios_links x WHERE x.participante_id = p.id),
    (SELECT max(x.ultimo_acesso_em) FROM public.socios_links x WHERE x.participante_id = p.id),
    (SELECT count(*) FROM public.socios_link_acessos a WHERE a.participante_id = p.id),
    CASE WHEN r.status = 'enviado' THEN 'enviado'
         WHEN r.id IS NOT NULL THEN 'rascunho'
         WHEN EXISTS (SELECT 1 FROM public.socios_links x WHERE x.participante_id = p.id AND x.ultimo_acesso_em IS NOT NULL) THEN 'abriu'
         ELSE 'nao_abriu' END,
    r.enviado_em
  FROM public.socios_participantes p
  LEFT JOIN LATERAL (SELECT * FROM public.socios_links x WHERE x.participante_id = p.id AND x.revogado_em IS NULL AND now() <= x.expira_em ORDER BY x.criado_em DESC LIMIT 1) l ON true
  LEFT JOIN public.socios_respostas_2027 r ON r.user_id = p.user_id
  WHERE p.ativo AND p.respondente
  ORDER BY p.nome_exibicao;
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_links_painel() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.socios_links_painel() TO authenticated;