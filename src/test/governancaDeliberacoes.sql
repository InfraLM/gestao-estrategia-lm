-- Run as a privileged test session; fixtures and all changes are rolled back.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE termo text; antes integer; depois integer; d public.decisoes_estrategicas; assinatura text;
BEGIN
 IF public.gov_codigo_deliberacao('CES','2026-06-18T12:00:00Z',2)<>'GOV-CES-20260618-03' THEN RAISE EXCEPTION 'Código incorreto'; END IF;
 FOREACH termo IN ARRAY ARRAY['CLT',' PJ','PJ ','contratação de','demissão','desligamento','transferência','relocação','promoção','cargo de'] LOOP
  IF NOT public.gov_deliberacao_reservada(termo,NULL) OR NOT public.gov_deliberacao_reservada(NULL,termo) THEN RAISE EXCEPTION 'Reserva falhou: %',termo; END IF;
 END LOOP;
 IF public.gov_deliberacao_reservada('Orçamento de marketing','Revisar indicadores') THEN RAISE EXCEPTION 'Reserva indevida'; END IF;
 IF has_function_privilege('authenticated','public.gov_publicar_deliberacoes()','EXECUTE') OR has_function_privilege('anon','public.gov_publicar_deliberacoes()','EXECUTE') THEN RAISE EXCEPTION 'Publicação deve ser service-only'; END IF;
 IF NOT has_function_privilege('service_role','public.gov_publicar_deliberacoes()','EXECUTE') THEN RAISE EXCEPTION 'Service deve executar'; END IF;
 IF has_function_privilege('authenticated','public.gov_configurar_cron_diario(text,text)','EXECUTE') THEN RAISE EXCEPTION 'Agendamento deve ser service-only'; END IF;
 SELECT md5(string_agg(to_jsonb(x)::text,'|' ORDER BY codigo)) INTO assinatura FROM public.decisoes_estrategicas x WHERE codigo ~ '^D-[0-9]{3}$';
 INSERT INTO public.gov_deliberacoes(reuniao_origem_id,indice,titulo,pauta,racional,comite_codigo,reuniao_titulo,reuniao_data)
 VALUES ('e0000000-0000-4000-8000-000000000001',2,repeat('a',220),'Demissão fixture','Racional','TESTE','Reunião fixture','2099-06-18T12:00:00Z');
 PERFORM public.gov_publicar_deliberacoes();
 SELECT * INTO d FROM public.decisoes_estrategicas WHERE codigo='GOV-TESTE-20990618-03';
 IF length(d.titulo)<>200 OR length(d.decisao)<>220 OR d.acesso_reservado IS NOT TRUE OR d.tipo_forum<>'ritual_executivo' OR d.impacto_bsc<>'A confirmar' THEN RAISE EXCEPTION 'Mapeamento incorreto'; END IF;
 UPDATE public.decisoes_estrategicas SET impacto_bsc='Financeira',responsavel='Responsável fixture',tradeoff='Tradeoff fixture',premissas='Premissas fixture',observacoes='Notas fixture' WHERE codigo=d.codigo;
 UPDATE public.gov_deliberacoes SET titulo='Título atualizado',pauta='Pauta não reservada',racional='Novo racional' WHERE reuniao_origem_id='e0000000-0000-4000-8000-000000000001';
 PERFORM public.gov_publicar_deliberacoes();
 SELECT * INTO d FROM public.decisoes_estrategicas WHERE codigo='GOV-TESTE-20990618-03';
 IF d.titulo<>'Título atualizado' OR d.racional<>'Novo racional' OR d.acesso_reservado IS NOT FALSE THEN RAISE EXCEPTION 'Origem não atualizada'; END IF;
 IF d.impacto_bsc<>'Financeira' OR d.responsavel<>'Responsável fixture' OR d.tradeoff<>'Tradeoff fixture' OR d.premissas<>'Premissas fixture' OR d.observacoes<>'Notas fixture' THEN RAISE EXCEPTION 'Enriquecimento perdido'; END IF;
 SELECT count(*) INTO antes FROM public.decisoes_estrategicas;
 IF public.gov_publicar_deliberacoes()<>0 THEN RAISE EXCEPTION 'Publicação idêntica deve ser no-op'; END IF;
 SELECT count(*) INTO depois FROM public.decisoes_estrategicas;
 IF antes<>depois THEN RAISE EXCEPTION 'Duplicação'; END IF;
 IF assinatura IS DISTINCT FROM (SELECT md5(string_agg(to_jsonb(x)::text,'|' ORDER BY codigo)) FROM public.decisoes_estrategicas x WHERE codigo ~ '^D-[0-9]{3}$') THEN RAISE EXCEPTION 'D-NNN mudou'; END IF;
 RAISE NOTICE 'Código, reserva, mapeamento, grants, preservação, idempotência e assinatura aprovados';
END $$;
ROLLBACK;