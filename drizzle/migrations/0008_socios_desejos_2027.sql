CREATE TABLE public.socios_participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nome_exibicao text NOT NULL,
  user_id uuid UNIQUE,
  respondente boolean NOT NULL DEFAULT true,
  pode_ver_consolidado boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.socios_participantes TO authenticated;
GRANT ALL ON public.socios_participantes TO service_role;
ALTER TABLE public.socios_participantes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.socios_pode_consolidar(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.socios_participantes WHERE user_id = _uid AND ativo AND pode_ver_consolidado)
$$;
CREATE OR REPLACE FUNCTION public.socios_eh_respondente(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.socios_participantes WHERE user_id = _uid AND ativo AND respondente)
$$;

CREATE POLICY "socios_part_select" ON public.socios_participantes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.socios_pode_consolidar(auth.uid()));

-- Vincula o usuário logado pelo e-mail verificado
CREATE OR REPLACE FUNCTION public.socios_vincular() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text;
BEGIN
  SELECT lower(email) INTO _email FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL;
  IF _email IS NULL THEN RETURN; END IF;
  UPDATE public.socios_participantes SET user_id = auth.uid() WHERE lower(email) = _email AND user_id IS NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_vincular() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.socios_vincular() TO authenticated;

INSERT INTO public.socios_participantes (email, nome_exibicao, respondente, pode_ver_consolidado) VALUES
  ('ian.camilo@liberdademedicaedu.com.br', 'Ian', true, true),
  ('yuri.garcia@liberdademedicaedu.com.br', 'Yuri', true, false),
  ('rodrigocleto@hotmail.com', 'Cleto', true, false),
  ('naira.yurie@liberdademedicaedu.com.br', 'Naira', false, true);
UPDATE public.socios_participantes p SET user_id = u.id
  FROM auth.users u WHERE lower(u.email) = lower(p.email) AND u.email_confirmed_at IS NOT NULL;

CREATE TABLE public.socios_respostas_2027 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  ciclo text NOT NULL DEFAULT '2027',
  status text NOT NULL DEFAULT 'rascunho',
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  diretrizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  projetos jsonb NOT NULL DEFAULT '[]'::jsonb,
  extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  versao integer NOT NULL DEFAULT 0,
  enviado_em timestamptz,
  primeiro_envio_em timestamptz,
  reaberto_ate timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.socios_respostas_2027 TO authenticated;
GRANT ALL ON public.socios_respostas_2027 TO service_role;
ALTER TABLE public.socios_respostas_2027 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "socios_resp_select" ON public.socios_respostas_2027 FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.socios_pode_consolidar(auth.uid()));
CREATE POLICY "socios_resp_insert" ON public.socios_respostas_2027 FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.socios_eh_respondente(auth.uid()));
CREATE POLICY "socios_resp_update" ON public.socios_respostas_2027 FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.socios_eh_respondente(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.socios_eh_respondente(auth.uid()));

CREATE TABLE public.socios_respostas_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id uuid NOT NULL REFERENCES public.socios_respostas_2027(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  versao integer NOT NULL,
  respostas jsonb NOT NULL,
  diretrizes jsonb NOT NULL,
  projetos jsonb NOT NULL,
  extras jsonb NOT NULL,
  enviado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.socios_respostas_versoes TO authenticated;
GRANT ALL ON public.socios_respostas_versoes TO service_role;
ALTER TABLE public.socios_respostas_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "socios_vers_select" ON public.socios_respostas_versoes FOR SELECT TO authenticated
  USING (public.socios_pode_consolidar(auth.uid()));

-- Prazo e campos controlados
CREATE OR REPLACE FUNCTION public.socios_prazo_aberto(_reaberto timestamptz) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT now() <= timestamptz '2026-11-06 23:59:59-03' OR (_reaberto IS NOT NULL AND now() <= _reaberto)
$$;

CREATE OR REPLACE FUNCTION public.socios_resp_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('socios.interno', true) = '1' THEN
    NEW.updated_at := now(); RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'rascunho'; NEW.versao := 0; NEW.enviado_em := NULL; NEW.primeiro_envio_em := NULL; NEW.reaberto_ate := NULL;
  ELSE
    NEW.status := OLD.status; NEW.versao := OLD.versao; NEW.enviado_em := OLD.enviado_em;
    NEW.primeiro_envio_em := OLD.primeiro_envio_em; NEW.reaberto_ate := OLD.reaberto_ate; NEW.user_id := OLD.user_id;
  END IF;
  IF NOT public.socios_prazo_aberto(NEW.reaberto_ate) THEN
    RAISE EXCEPTION 'Prazo encerrado em 06/11/2026. Peça reabertura.';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_socios_resp_guard BEFORE INSERT OR UPDATE ON public.socios_respostas_2027
  FOR EACH ROW EXECUTE FUNCTION public.socios_resp_guard();

CREATE OR REPLACE FUNCTION public.socios_enviar() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.socios_respostas_2027;
BEGIN
  SELECT * INTO r FROM public.socios_respostas_2027 WHERE user_id = auth.uid();
  IF NOT FOUND OR NOT public.socios_eh_respondente(auth.uid()) THEN RAISE EXCEPTION 'Sem resposta para enviar'; END IF;
  IF NOT public.socios_prazo_aberto(r.reaberto_ate) THEN RAISE EXCEPTION 'Prazo encerrado em 06/11/2026. Peça reabertura.'; END IF;
  PERFORM set_config('socios.interno', '1', true);
  UPDATE public.socios_respostas_2027 SET status = 'enviado', versao = r.versao + 1, enviado_em = now(),
    primeiro_envio_em = coalesce(r.primeiro_envio_em, now()) WHERE id = r.id;
  INSERT INTO public.socios_respostas_versoes (resposta_id, user_id, versao, respostas, diretrizes, projetos, extras)
    VALUES (r.id, r.user_id, r.versao + 1, r.respostas, r.diretrizes, r.projetos, r.extras);
  PERFORM set_config('socios.interno', '0', true);
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_enviar() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.socios_enviar() TO authenticated;

CREATE OR REPLACE FUNCTION public.socios_reabrir(_user_id uuid, _ate timestamptz) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.socios_pode_consolidar(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  PERFORM set_config('socios.interno', '1', true);
  INSERT INTO public.socios_respostas_2027 (user_id, reaberto_ate) VALUES (_user_id, _ate)
    ON CONFLICT (user_id) DO UPDATE SET reaberto_ate = _ate, status = 'rascunho';
  PERFORM set_config('socios.interno', '0', true);
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_reabrir(uuid, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.socios_reabrir(uuid, timestamptz) TO authenticated;