CREATE OR REPLACE FUNCTION public.rotina_conformidade(_de date, _ate date)
 RETURNS TABLE(cadeira_id uuid, semana date, status text, enviado_em timestamp with time zone, primeiro_envio_em text, completude jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
  SELECT c.cadeira_id, c.semana, c.status, c.enviado_em, c.conteudo->>'primeiro_envio_em', c.conteudo->'completude'
  FROM public.mt_checkins c
  WHERE c.tipo = 'checkout' AND c.semana BETWEEN _de AND _ate AND auth.uid() IS NOT NULL
    AND public.rotina_ve_todas(auth.uid())
$f$;