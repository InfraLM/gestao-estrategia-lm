-- Fix the audit columns used by the one-off 15/11 notice (mt_auditoria uses campo/valor_novo).
CREATE OR REPLACE FUNCTION public.rotina_aviso_extra_executar(_ciclo date, _job text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE claims text; j bigint; n integer;
BEGIN
 claims:=current_setting('request.jwt.claims',true);
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 BEGIN
  n:=public.rotina_avisos_preparar(_ciclo,'manual');
  INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_novo)
  VALUES('rotina_avisos_envios',_ciclo::text,'aviso_extra_agendado',jsonb_build_object('ciclo',_ciclo,'enfileirados',n)::text);
 EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_novo)
  VALUES('rotina_avisos_envios',_ciclo::text,'aviso_extra_falhou',jsonb_build_object('ciclo',_ciclo,'erro',SQLERRM)::text);
 END;
 PERFORM set_config('request.jwt.claims',coalesce(claims,''),true);
 FOR j IN SELECT jobid FROM cron.job WHERE jobname=_job LOOP PERFORM cron.unschedule(j); END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.rotina_aviso_extra_executar(date,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_aviso_extra_executar(date,text) TO service_role;