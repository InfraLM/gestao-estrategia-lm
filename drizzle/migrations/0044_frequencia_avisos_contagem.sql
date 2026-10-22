DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.rotina_avisos_destinatarios(date)'::regprocedure) INTO definition;
 IF position('WHERE i.cadeira_id=b.id AND i.status=''ativo''' IN definition)=0 THEN RAISE EXCEPTION 'Projeção dos avisos não corresponde ao padrão esperado'; END IF;
 definition:=replace(definition,'WHERE i.cadeira_id=b.id AND i.status=''ativo''','WHERE i.cadeira_id=b.id AND public.mt_frequencia_devida(i.frequencia,i.mes_ciclo,i.semana_mes,i.frequencia_inicio,_ciclo,EXISTS(SELECT 1 FROM public.mt_kpi_desvios d WHERE d.indicador_id=i.id AND d.ativo)) AND i.status=''ativo''');
 EXECUTE definition;
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_destinatarios(date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_destinatarios(date) TO authenticated,service_role;