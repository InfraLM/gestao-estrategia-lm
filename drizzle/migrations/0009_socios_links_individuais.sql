ALTER TABLE public.socios_participantes ADD COLUMN IF NOT EXISTS user_id_provisorio boolean NOT NULL DEFAULT false;

CREATE TABLE public.socios_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id uuid NOT NULL REFERENCES public.socios_participantes(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL DEFAULT timestamptz '2026-11-06 23:59:59-03',
  revogado_em timestamptz,
  ultimo_acesso_em timestamptz
);
GRANT SELECT ON public.socios_links TO authenticated;
GRANT ALL ON public.socios_links TO service_role;
ALTER TABLE public.socios_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "socios_links_select" ON public.socios_links FOR SELECT TO authenticated
  USING (public.socios_pode_consolidar(auth.uid()));

CREATE OR REPLACE FUNCTION public.socios_link_gerar(_participante_id uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _tok text;
BEGIN
  IF NOT public.socios_pode_consolidar(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.socios_participantes WHERE id = _participante_id AND respondente AND ativo) THEN
    RAISE EXCEPTION 'Participante não é respondente'; END IF;
  UPDATE public.socios_links SET revogado_em = now() WHERE participante_id = _participante_id AND revogado_em IS NULL;
  _tok := encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.socios_links (participante_id, token_hash, criado_por)
    VALUES (_participante_id, encode(extensions.digest(_tok, 'sha256'), 'hex'), auth.uid());
  RETURN _tok;
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_link_gerar(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.socios_link_gerar(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.socios_link_revogar(_participante_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.socios_pode_consolidar(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  UPDATE public.socios_links SET revogado_em = now() WHERE participante_id = _participante_id AND revogado_em IS NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_link_revogar(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.socios_link_revogar(uuid) TO authenticated;

-- Resolve token -> user_id da resposta (cria id provisório se o sócio ainda não tem conta)
CREATE OR REPLACE FUNCTION public.socios_link_uid(_token text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _p public.socios_participantes; _l public.socios_links;
BEGIN
  SELECT * INTO _l FROM public.socios_links
    WHERE token_hash = encode(extensions.digest(coalesce(_token,''), 'sha256'), 'hex')
      AND revogado_em IS NULL AND now() <= expira_em;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link inválido, expirado ou revogado'; END IF;
  SELECT * INTO _p FROM public.socios_participantes WHERE id = _l.participante_id AND ativo AND respondente;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link inválido'; END IF;
  IF _p.user_id IS NULL THEN
    UPDATE public.socios_participantes SET user_id = gen_random_uuid(), user_id_provisorio = true
      WHERE id = _p.id RETURNING * INTO _p;
  END IF;
  UPDATE public.socios_links SET ultimo_acesso_em = now() WHERE id = _l.id;
  RETURN _p.user_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_link_uid(text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.socios_link_carregar(_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  _uid := public.socios_link_uid(_token);
  RETURN jsonb_build_object(
    'participante', (SELECT jsonb_build_object('nome_exibicao', nome_exibicao, 'respondente', true, 'pode_ver_consolidado', false) FROM public.socios_participantes WHERE user_id = _uid),
    'resposta', (SELECT to_jsonb(r) FROM public.socios_respostas_2027 r WHERE user_id = _uid));
END $$;

CREATE OR REPLACE FUNCTION public.socios_link_salvar(_token text, _respostas jsonb, _diretrizes jsonb, _projetos jsonb, _extras jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _r public.socios_respostas_2027;
BEGIN
  _uid := public.socios_link_uid(_token);
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
  _uid := public.socios_link_uid(_token);
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

-- Ao entrar com conta, assume a resposta feita pelo link
CREATE OR REPLACE FUNCTION public.socios_vincular() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text; _p public.socios_participantes;
BEGIN
  SELECT lower(email) INTO _email FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL;
  IF _email IS NULL THEN RETURN; END IF;
  SELECT * INTO _p FROM public.socios_participantes WHERE lower(email) = _email;
  IF NOT FOUND OR _p.user_id = auth.uid() THEN RETURN; END IF;
  IF _p.user_id IS NULL THEN
    UPDATE public.socios_participantes SET user_id = auth.uid() WHERE id = _p.id;
  ELSIF _p.user_id_provisorio THEN
    PERFORM set_config('socios.interno', '1', true);
    UPDATE public.socios_respostas_2027 SET user_id = auth.uid() WHERE user_id = _p.user_id;
    UPDATE public.socios_respostas_versoes SET user_id = auth.uid() WHERE user_id = _p.user_id;
    UPDATE public.socios_participantes SET user_id = auth.uid(), user_id_provisorio = false WHERE id = _p.id;
    PERFORM set_config('socios.interno', '0', true);
  END IF;
END $$;