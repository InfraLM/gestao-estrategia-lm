CREATE OR REPLACE FUNCTION public.aceitar_convite_usuario(_convite_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE convite public.usuario_convites%ROWTYPE; usuario_id uuid := auth.uid(); email_verificado text;
BEGIN
 IF usuario_id IS NULL THEN RAISE EXCEPTION 'Entre na sua conta para aceitar o convite'; END IF;
 SELECT lower(trim(email)) INTO email_verificado FROM auth.users WHERE id = usuario_id AND email_confirmed_at IS NOT NULL;
 IF email_verificado IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail antes de aceitar o convite'; END IF;
 SELECT * INTO convite FROM public.usuario_convites WHERE id = _convite_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Convite não encontrado'; END IF;
 IF convite.email <> email_verificado THEN RAISE EXCEPTION 'Entre com a conta Google do e-mail convidado'; END IF;
 IF convite.aceito_em IS NOT NULL THEN
  IF convite.user_id = usuario_id THEN RETURN; END IF;
  RAISE EXCEPTION 'Este convite já foi utilizado';
 END IF;
 UPDATE public.profiles SET display_name = convite.display_name, cargo = convite.cargo, departamento_id = convite.departamento_id WHERE user_id = usuario_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cadastro não encontrado'; END IF;
 INSERT INTO public.usuario_acessos(user_id, modulo, nivel, atualizado_por)
 SELECT usuario_id, key, value, convite.criado_por FROM jsonb_each_text(convite.acessos)
 WHERE key IN ('estrategia','pmo','bpmo','okrs','cesta','metas','rotina','historico') AND value IN ('nenhum','leitura','edicao')
 ON CONFLICT(user_id, modulo) DO UPDATE SET nivel = EXCLUDED.nivel, atualizado_por = EXCLUDED.atualizado_por, updated_at = now();
 UPDATE public.usuario_convites SET aceito_em = now(), user_id = usuario_id WHERE id = convite.id;
END; $$;
REVOKE ALL ON FUNCTION public.aceitar_convite_usuario(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aceitar_convite_usuario(uuid) TO authenticated;