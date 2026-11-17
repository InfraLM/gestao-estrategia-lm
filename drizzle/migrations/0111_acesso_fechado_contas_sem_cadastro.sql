CREATE OR REPLACE FUNCTION public.usuario_liberado(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _uid IS NOT NULL AND (
  EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid)
  OR EXISTS(SELECT 1 FROM public.mt_usuarios WHERE user_id=_uid)
  OR EXISTS(SELECT 1 FROM public.usuario_acessos WHERE user_id=_uid AND nivel<>'nenhum')
  OR EXISTS(SELECT 1 FROM public.usuario_convites WHERE user_id=_uid AND aceito_em IS NOT NULL)
  OR EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=_uid AND ativo)
  OR EXISTS(SELECT 1 FROM public.socios_participantes WHERE user_id=_uid AND ativo)
  OR EXISTS(SELECT 1 FROM public.offsite_admins WHERE user_id=_uid)
  OR EXISTS(SELECT 1 FROM public.offsite_participantes p JOIN auth.users u ON lower(u.email)=lower(p.email) WHERE u.id=_uid AND p.ativo)
 );
$$;
REVOKE ALL ON FUNCTION public.usuario_liberado(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.usuario_liberado(uuid) TO authenticated, service_role;
-- Quem não tem cadastro é tratado como restrito: as policies abertas e acesso_modulo já negam com NOT is_lider_restrito.
CREATE OR REPLACE FUNCTION public.is_lider_restrito(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _uid IS NOT NULL AND (
  NOT public.usuario_liberado(_uid)
  OR (EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=_uid AND ativo AND cargo<>'diretor') AND NOT EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=_uid AND ativo AND cargo='diretor') AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid) AND NOT EXISTS(SELECT 1 FROM public.mt_usuarios WHERE user_id=_uid))
 );
$$;
CREATE OR REPLACE FUNCTION public.mt_email_corporativo() RETURNS boolean LANGUAGE sql STABLE SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND public.usuario_liberado(auth.uid()) $$;
CREATE OR REPLACE FUNCTION public.qw_meu_perfil() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _l uuid; BEGIN
 PERFORM public.qw_vincular(); SELECT id INTO _l FROM public.qw_lideres WHERE user_id=auth.uid() AND ativo;
 RETURN jsonb_build_object('lider_id',_l,'liberado',public.usuario_liberado(auth.uid()),'lider_restrito',_l IS NOT NULL AND public.is_lider_restrito(auth.uid()),'diretor',false,'governanca',public.mt_is_governanca(auth.uid()),'gov_ceo',public.mt_is_governanca(auth.uid())); END $$;
CREATE OR REPLACE FUNCTION public.email_corporativo_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.email IS NULL OR lower(btrim(NEW.email)) !~ '@liberdademedicaedu\.com\.br$' THEN
  RAISE EXCEPTION 'Use seu e-mail corporativo @liberdademedicaedu.com.br';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS email_corporativo_guard ON auth.users;
CREATE TRIGGER email_corporativo_guard BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.email_corporativo_guard();