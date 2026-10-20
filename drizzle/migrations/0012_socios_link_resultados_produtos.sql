CREATE OR REPLACE FUNCTION public.socios_link_carregar(_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  _uid := public.socios_link_uid(_token);
  RETURN jsonb_build_object(
    'participante', (SELECT jsonb_build_object('nome_exibicao', nome_exibicao, 'respondente', true, 'pode_ver_consolidado', false) FROM public.socios_participantes WHERE user_id = _uid),
    'resposta', (SELECT to_jsonb(r) FROM public.socios_respostas_2027 r WHERE user_id = _uid),
    'produtos_info', (SELECT valor FROM public.conteudo_editavel WHERE chave = 'socios.produtos2027'));
END $$;
REVOKE EXECUTE ON FUNCTION public.socios_link_carregar(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.socios_link_carregar(text) TO anon, authenticated;