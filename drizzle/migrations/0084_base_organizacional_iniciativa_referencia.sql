CREATE OR REPLACE FUNCTION public.org_iniciativa_vincular(_iniciativa uuid,_pessoa uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cad uuid;
BEGIN
 SELECT cadeira_id INTO cad FROM public.mt_iniciativas WHERE id=_iniciativa FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT coalesce(public.acesso_modulo(auth.uid(),'rotina',true),false) OR NOT coalesce(public.mt_is_governanca(auth.uid()) OR public.mt_cadeira_do_usuario(auth.uid())=cad,false) THEN RAISE EXCEPTION 'Sem permissão para esta iniciativa'; END IF;
 IF _pessoa IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.org_pessoas WHERE id=_pessoa AND ativo) THEN RAISE EXCEPTION 'Pessoa inativa ou inexistente'; END IF;
 UPDATE public.mt_iniciativas SET responsavel_pessoa_id=_pessoa WHERE id=_iniciativa;
END $$;
REVOKE ALL ON FUNCTION public.org_iniciativa_vincular(uuid,uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_iniciativa_vincular(uuid,uuid) TO authenticated;