CREATE OR REPLACE FUNCTION public.usuario_liberado_geral(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _uid IS NOT NULL AND (
  EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid)
  OR EXISTS(SELECT 1 FROM public.mt_usuarios WHERE user_id=_uid)
  OR EXISTS(SELECT 1 FROM public.usuario_acessos WHERE user_id=_uid AND nivel<>'nenhum')
  OR EXISTS(SELECT 1 FROM public.usuario_convites WHERE user_id=_uid AND aceito_em IS NOT NULL)
  OR EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=_uid AND ativo AND cargo='diretor')
 );
$$;
REVOKE ALL ON FUNCTION public.usuario_liberado_geral(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.usuario_liberado_geral(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.is_lider_restrito(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _uid IS NOT NULL AND (
  (EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=_uid AND ativo AND cargo<>'diretor') AND NOT EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=_uid AND ativo AND cargo='diretor') AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid) AND NOT EXISTS(SELECT 1 FROM public.mt_usuarios WHERE user_id=_uid))
  OR (NOT EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=_uid AND ativo) AND NOT public.usuario_liberado_geral(_uid))
 );
$$;
CREATE OR REPLACE FUNCTION public.mt_email_corporativo() RETURNS boolean LANGUAGE sql STABLE SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND NOT public.is_lider_restrito(auth.uid()) $$;
CREATE OR REPLACE FUNCTION public.qw_meu_perfil() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _l uuid; BEGIN
 PERFORM public.qw_vincular(); SELECT id INTO _l FROM public.qw_lideres WHERE user_id=auth.uid() AND ativo;
 RETURN jsonb_build_object('lider_id',_l,'liberado',public.usuario_liberado(auth.uid()),'acesso_geral',NOT public.is_lider_restrito(auth.uid()),'lider_restrito',_l IS NOT NULL AND public.is_lider_restrito(auth.uid()),'diretor',false,'governanca',public.mt_is_governanca(auth.uid()),'gov_ceo',public.mt_is_governanca(auth.uid())); END $$;