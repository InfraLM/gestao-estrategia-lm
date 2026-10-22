CREATE OR REPLACE FUNCTION public.rotina_avisos_agendar(_tipo text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE hoje date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; ciclo date; claims text;
BEGIN
 IF _tipo IS NULL OR _tipo NOT IN ('abertura','lembrete') THEN RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rotina_avisos_config WHERE id AND ativo AND remetente_pronto) THEN RETURN; END IF;
 ciclo:=hoje-(extract(isodow FROM hoje)::integer-1);
 IF extract(isodow FROM hoje)>=5 THEN ciclo:=ciclo+7; END IF;
 -- The private cron entrypoint has no HTTP JWT; scope service context to this call only.
 claims:=current_setting('request.jwt.claims',true);
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 PERFORM public.rotina_avisos_preparar(ciclo,_tipo);
 PERFORM set_config('request.jwt.claims',coalesce(claims,''),true);
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_agendar(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_agendar(text) TO service_role;