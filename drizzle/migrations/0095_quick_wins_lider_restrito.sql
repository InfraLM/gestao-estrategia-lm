CREATE OR REPLACE FUNCTION public.is_lider_restrito(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _uid IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.qw_lideres WHERE user_id=_uid AND ativo)
    AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_uid)
    AND NOT EXISTS (SELECT 1 FROM public.mt_usuarios WHERE user_id=_uid);
$$;

CREATE OR REPLACE FUNCTION public.acesso_modulo(_uid uuid, _modulo text, _editar boolean DEFAULT false)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT CASE WHEN public.is_lider_restrito(_uid) THEN _modulo = 'quick_wins'
 ELSE _uid IS NOT NULL AND (public.is_super_admin(_uid) OR COALESCE((SELECT CASE WHEN _editar THEN nivel='edicao' ELSE nivel<>'nenhum' END FROM public.usuario_acessos WHERE user_id=_uid AND modulo=_modulo), true)) END;
$function$;

CREATE OR REPLACE FUNCTION public.aplicar_convite_usuario()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE convite public.usuario_convites%ROWTYPE;
BEGIN
 IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO convite FROM public.usuario_convites WHERE email = lower(trim(NEW.email)) AND aceito_em IS NULL FOR UPDATE;
 IF NOT FOUND THEN RETURN NEW; END IF;
 UPDATE public.profiles SET display_name=convite.display_name, cargo=convite.cargo, departamento_id=convite.departamento_id WHERE user_id=NEW.id;
 INSERT INTO public.usuario_acessos(user_id,modulo,nivel,atualizado_por)
 SELECT NEW.id,key,value,convite.criado_por FROM jsonb_each_text(convite.acessos)
 WHERE key IN ('estrategia','pmo','bpmo','okrs','cesta','metas','rotina','historico','decisoes','estrutura','incentivos','quick_wins') AND value IN ('nenhum','leitura','edicao')
 ON CONFLICT(user_id,modulo) DO UPDATE SET nivel=EXCLUDED.nivel,atualizado_por=EXCLUDED.atualizado_por,updated_at=now();
 UPDATE public.usuario_convites SET aceito_em=now(),user_id=NEW.id WHERE id=convite.id;
 RETURN NEW;
END; $function$;