-- One-off extra notice requested by Governance: Sunday 15/11/2026 08:00 São Paulo, cycle 16/11/2026,
-- only to eligible directors who have not submitted yet (same 'manual' path the Governance panel uses).
-- The job removes itself after running, so nothing recurs.
CREATE OR REPLACE FUNCTION public.rotina_aviso_extra_executar(_ciclo date, _job text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE claims text; j bigint; n integer;
BEGIN
 claims:=current_setting('request.jwt.claims',true);
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 BEGIN
  n:=public.rotina_avisos_preparar(_ciclo,'manual');
  INSERT INTO public.mt_auditoria(tabela,registro_id,acao,depois)
  VALUES('rotina_avisos_envios',_ciclo::text,'aviso_extra_agendado',jsonb_build_object('ciclo',_ciclo,'enfileirados',n));
 EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.mt_auditoria(tabela,registro_id,acao,depois)
  VALUES('rotina_avisos_envios',_ciclo::text,'aviso_extra_falhou',jsonb_build_object('ciclo',_ciclo,'erro',SQLERRM));
 END;
 PERFORM set_config('request.jwt.claims',coalesce(claims,''),true);
 FOR j IN SELECT jobid FROM cron.job WHERE jobname=_job LOOP PERFORM cron.unschedule(j); END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.rotina_aviso_extra_executar(date,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_aviso_extra_executar(date,text) TO service_role;

SELECT cron.schedule('rotina-email-extra-2026-11-15','0 11 15 11 *',
 $$SELECT public.rotina_aviso_extra_executar('2026-11-16'::date,'rotina-email-extra-2026-11-15');$$);