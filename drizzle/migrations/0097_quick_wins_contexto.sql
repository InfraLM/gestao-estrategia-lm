CREATE OR REPLACE FUNCTION public.qw_contexto() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'lideres', coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'cadeira', c.nome, 'diretor', coalesce(nullif(p.display_name,''), p.email)))
       FROM public.qw_lideres l LEFT JOIN public.org_cadeiras c ON c.id=l.cadeira_id LEFT JOIN public.profiles p ON p.user_id=l.diretor_user_id
       WHERE public.qw_pode_ler_lider(l.id)), '[]'::jsonb),
    'cadeiras', CASE WHEN public.mt_is_governanca(auth.uid()) THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome) ORDER BY nome) FROM public.org_cadeiras WHERE ativo), '[]'::jsonb) ELSE '[]'::jsonb END,
    'diretores', CASE WHEN public.mt_is_governanca(auth.uid()) THEN coalesce((SELECT jsonb_agg(jsonb_build_object('user_id', u.user_id, 'nome', coalesce(nullif(p.display_name,''), p.email)) ORDER BY 2)
       FROM public.mt_usuarios u LEFT JOIN public.profiles p ON p.user_id=u.user_id WHERE u.perfil IN ('diretor','governanca')), '[]'::jsonb) ELSE '[]'::jsonb END
  ) INTO _r;
  RETURN _r;
END $$;
REVOKE EXECUTE ON FUNCTION public.qw_contexto() FROM anon;