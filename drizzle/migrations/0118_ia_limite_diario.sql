CREATE TABLE public.ia_limite_parametros (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  teto_base int NOT NULL DEFAULT 100 CHECK (teto_base > 0),
  teto_extra int NOT NULL DEFAULT 150 CHECK (teto_extra > 0),
  email_alerta text NOT NULL DEFAULT 'arthur.matos@liberdademedicaedu.com.br',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ia_limite_parametros TO authenticated;
GRANT ALL ON public.ia_limite_parametros TO service_role;
ALTER TABLE public.ia_limite_parametros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ia_param_super_ler" ON public.ia_limite_parametros FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "ia_param_super_inserir" ON public.ia_limite_parametros FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "ia_param_super_editar" ON public.ia_limite_parametros FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
INSERT INTO public.ia_limite_parametros (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.ia_uso_diario (
  user_id uuid NOT NULL,
  dia date NOT NULL,
  chamadas int NOT NULL DEFAULT 0,
  teto_do_dia int NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dia)
);
GRANT SELECT ON public.ia_uso_diario TO authenticated;
GRANT ALL ON public.ia_uso_diario TO service_role;
ALTER TABLE public.ia_uso_diario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ia_uso_gov_ler" ON public.ia_uso_diario FOR SELECT TO authenticated USING (public.mt_is_governanca(auth.uid()));

CREATE TABLE public.ia_uso_alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dia date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('subiu','bloqueou')),
  funcao text NOT NULL,
  chamadas int NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  envio_status text NOT NULL DEFAULT 'pendente' CHECK (envio_status IN ('pendente','enviado','falhou')),
  envio_erro text,
  UNIQUE (user_id, dia, tipo)
);
GRANT SELECT ON public.ia_uso_alertas TO authenticated;
GRANT ALL ON public.ia_uso_alertas TO service_role;
ALTER TABLE public.ia_uso_alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ia_alertas_gov_ler" ON public.ia_uso_alertas FOR SELECT TO authenticated USING (public.mt_is_governanca(auth.uid()));

CREATE OR REPLACE FUNCTION public.ia_registrar_uso(_funcao text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _dia date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _base int; _extra int; _cham int; _teto int; _nova int; _alerta uuid;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('permitido', true, 'contado', false); END IF;
  _funcao := left(coalesce(nullif(btrim(_funcao), ''), 'desconhecida'), 80);
  SELECT teto_base, teto_extra INTO _base, _extra FROM ia_limite_parametros WHERE id = 1;
  _base := coalesce(_base, 100); _extra := greatest(coalesce(_extra, 150), _base);
  INSERT INTO ia_uso_diario (user_id, dia, chamadas, teto_do_dia) VALUES (_uid, _dia, 0, _base) ON CONFLICT DO NOTHING;
  SELECT chamadas, teto_do_dia INTO _cham, _teto FROM ia_uso_diario WHERE user_id = _uid AND dia = _dia FOR UPDATE;
  _nova := _cham + 1;
  IF _nova > _teto AND _teto < _extra THEN
    _teto := _extra;
    UPDATE ia_uso_diario SET teto_do_dia = _teto, atualizado_em = now() WHERE user_id = _uid AND dia = _dia;
    INSERT INTO ia_uso_alertas (user_id, dia, tipo, funcao, chamadas) VALUES (_uid, _dia, 'subiu', _funcao, _nova)
      ON CONFLICT DO NOTHING RETURNING id INTO _alerta;
  END IF;
  IF _nova > _teto THEN
    INSERT INTO ia_uso_alertas (user_id, dia, tipo, funcao, chamadas) VALUES (_uid, _dia, 'bloqueou', _funcao, _nova)
      ON CONFLICT DO NOTHING RETURNING id INTO _alerta;
    RETURN jsonb_build_object('permitido', false, 'contado', true, 'chamadas', _cham, 'teto', _teto, 'alerta_id', _alerta);
  END IF;
  UPDATE ia_uso_diario SET chamadas = _nova, atualizado_em = now() WHERE user_id = _uid AND dia = _dia;
  RETURN jsonb_build_object('permitido', true, 'contado', true, 'chamadas', _nova, 'teto', _teto, 'alerta_id', _alerta);
END $$;
REVOKE ALL ON FUNCTION public.ia_registrar_uso(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ia_registrar_uso(text) TO authenticated, service_role;