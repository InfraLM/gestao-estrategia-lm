INSERT INTO public.usuario_acessos (user_id, modulo, nivel)
SELECT u.id, g.modulo, g.nivel
FROM (VALUES
  ('aurea.emilio@liberdademedicaedu.com.br'),('felipe.rabello@liberdademedicaedu.com.br'),('yuri.garcia@liberdademedicaedu.com.br')
) e(email)
CROSS JOIN (VALUES ('estrategia','edicao'),('pmo','edicao'),('bpmo','edicao'),('okrs','edicao'),('cesta','edicao'),('metas','edicao'),('rotina','edicao'),('historico','edicao'),('repositorios','leitura')) g(modulo, nivel)
JOIN auth.users u ON lower(u.email) = e.email
ON CONFLICT (user_id, modulo) DO NOTHING;

INSERT INTO public.usuario_acessos (user_id, modulo, nivel)
SELECT u.id, g.modulo, g.nivel
FROM (VALUES ('pmo','edicao'),('bpmo','edicao'),('okrs','edicao'),('cesta','edicao'),('metas','edicao'),('rotina','edicao'),('historico','edicao'),('repositorios','leitura')) g(modulo, nivel)
JOIN auth.users u ON lower(u.email) = 'rodrigocleto@hotmail.com'
ON CONFLICT (user_id, modulo) DO NOTHING;

INSERT INTO public.usuario_acessos (user_id, modulo, nivel)
SELECT u.id, 'repositorios', 'leitura'
FROM (VALUES ('ian.camilo@liberdademedicaedu.com.br'),('bruno.garcia@liberdademedicaedu.com.br'),('iuri.franco@liberdademedicaedu.com.br'),('guilherme.vieira@liberdademedicaedu.com.br'),('yuri.ribeiro@liberdademedicaedu.com.br')) e(email)
JOIN auth.users u ON lower(u.email) = e.email
ON CONFLICT (user_id, modulo) DO NOTHING;

CREATE OR REPLACE FUNCTION public.acesso_modulo(_uid uuid, _modulo text, _editar boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 SELECT CASE WHEN public.is_lider_restrito(_uid) THEN _modulo = 'quick_wins'
 ELSE _uid IS NOT NULL AND (public.is_super_admin(_uid) OR COALESCE((SELECT CASE WHEN _editar THEN nivel='edicao' ELSE nivel<>'nenhum' END FROM public.usuario_acessos WHERE user_id=_uid AND modulo=_modulo), false)) END;
$function$;