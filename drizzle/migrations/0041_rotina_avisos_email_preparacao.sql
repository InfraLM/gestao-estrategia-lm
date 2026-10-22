CREATE TABLE public.rotina_avisos_config (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), ativo boolean NOT NULL DEFAULT false,
 abertura_dia integer NOT NULL DEFAULT 5 CHECK(abertura_dia BETWEEN 0 AND 6), abertura_hora time NOT NULL DEFAULT '08:00',
 lembrete_dia integer NOT NULL DEFAULT 1 CHECK(lembrete_dia BETWEEN 0 AND 6), lembrete_hora time NOT NULL DEFAULT '14:00',
 remetente_pronto boolean NOT NULL DEFAULT false, atualizado_por uuid, atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rotina_avisos_config TO authenticated;
GRANT ALL ON public.rotina_avisos_config TO service_role;
ALTER TABLE public.rotina_avisos_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY governanca_le ON public.rotina_avisos_config FOR SELECT TO authenticated USING(public.mt_is_governanca(auth.uid()));
CREATE TABLE public.rotina_avisos_envios (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id), usuario_id uuid NOT NULL,
 ciclo date NOT NULL, canal text NOT NULL DEFAULT 'email' CHECK(canal IN ('email')), tipo text NOT NULL CHECK(tipo IN ('abertura','lembrete','manual')),
 destinatario text NOT NULL, nome text NOT NULL, pendencias jsonb NOT NULL, status text NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando','processando','enviado','falhou')),
 criado_em timestamptz NOT NULL DEFAULT now(), enviado_em timestamptz, abriu_em timestamptz, erro text, provedor_id text, solicitado_por uuid
);
GRANT SELECT ON public.rotina_avisos_envios TO authenticated;
GRANT ALL ON public.rotina_avisos_envios TO service_role;
ALTER TABLE public.rotina_avisos_envios ENABLE ROW LEVEL SECURITY;
CREATE POLICY governanca_le ON public.rotina_avisos_envios FOR SELECT TO authenticated USING(public.mt_is_governanca(auth.uid()));
CREATE UNIQUE INDEX rotina_avisos_automaticos_unicos ON public.rotina_avisos_envios(cadeira_id,usuario_id,ciclo,canal,tipo) WHERE tipo <> 'manual';
CREATE INDEX rotina_avisos_historico ON public.rotina_avisos_envios(criado_em DESC);
CREATE OR REPLACE FUNCTION public.rotina_avisos_destinatarios(_ciclo date) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE resultado jsonb;
BEGIN
 IF NOT (public.mt_is_governanca(auth.uid()) OR auth.role()='service_role') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _ciclo IS NULL OR extract(isodow FROM _ciclo)<>1 THEN RAISE EXCEPTION 'Ciclo deve ser segunda-feira'; END IF;
 WITH base AS (
 SELECT c.id,c.nome AS cadeira,c.diretor_user_id AS usuario_id,coalesce(nullif(p.display_name,''),c.diretor_nome,c.nome) AS nome,lower(trim(p.email)) AS email,
 CASE WHEN c.diretor_user_id IS NULL THEN 'Sem usuário vinculado à cadeira'
 WHEN NOT EXISTS(SELECT 1 FROM public.mt_usuarios u WHERE u.user_id=c.diretor_user_id AND u.cadeira_id=c.id) THEN 'Usuário sem vínculo à própria cadeira'
 WHEN coalesce(p.email,'') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN 'Sem e-mail válido'
 WHEN NOT public.acesso_modulo(c.diretor_user_id,'rotina',false) THEN 'Sem acesso ao formulário semanal'
 ELSE NULL END AS motivo,
 ci.status='enviado' AND co.status='enviado' AS enviado,coalesce(ci.conteudo,'{}'::jsonb) AS ci,coalesce(co.conteudo,'{}'::jsonb) AS co
 FROM public.mt_cadeiras c LEFT JOIN public.profiles p ON p.user_id=c.diretor_user_id
 LEFT JOIN public.mt_checkins ci ON ci.cadeira_id=c.id AND ci.semana=_ciclo AND ci.tipo='checkin'
 LEFT JOIN public.mt_checkins co ON co.cadeira_id=c.id AND co.semana=_ciclo-7 AND co.tipo='checkout'
 WHERE c.ativo
 ) SELECT coalesce(jsonb_agg(jsonb_build_object('cadeira_id',b.id,'cadeira',b.cadeira,'usuario_id',b.usuario_id,'nome',b.nome,'email',b.email,'motivo',b.motivo,'enviado',coalesce(b.enviado,false),
 'pendencias',jsonb_build_object(
 'prioridades',CASE WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(b.ci->'prioridades','[]')) x WHERE length(trim(coalesce(x->>'titulo','')))>0) THEN 0 ELSE 1 END,
 'kpis',(SELECT count(*) FROM public.mt_indicadores i LEFT JOIN LATERAL (SELECT x FROM jsonb_array_elements(coalesce(b.co->'kpis_resposta','[]')) x WHERE x->>'indicador_id'=i.id::text LIMIT 1) r ON true
 LEFT JOIN LATERAL (SELECT l.* FROM public.mt_lancamentos l WHERE l.indicador_id=i.id AND l.competencia=to_char(_ciclo-1,'YYYY-MM') ORDER BY l.updated_at DESC LIMIT 1) l ON true
 WHERE i.cadeira_id=b.id AND i.status='ativo' AND i.parent_id IS NULL AND i.origem IN ('bsc','okr','cesta') AND
 CASE coalesce(i.tipo_apontamento,'valor_mensal') WHEN 'entrega' THEN coalesce(nullif(r.x->>'status_entrega',''),l.status_entrega,'')='' WHEN 'valor_periodo' THEN coalesce(nullif(r.x->>'declaracao',''),l.declaracao,'')='' OR (coalesce(nullif(r.x->>'declaracao',''),l.declaracao)='off' AND coalesce(nullif(trim(r.x->>'justificativa'),''),nullif(trim(l.justificativa),'')) IS NULL) ELSE coalesce(nullif(trim(r.x->>'situacao_atual'),''),l.valor::text) IS NULL END),
 'atas',(SELECT count(*) FROM public.gov_acoes a WHERE a.concluida_em IS NULL AND lower(translate(trim(coalesce(a.status,'')),'áàâãéêíóôõúç','aaaaeeiooouc')) NOT IN ('concluido','concluida','cancelado','cancelada') AND
 ((nullif(trim(a.responsavel_email),'') IS NOT NULL AND lower(trim(a.responsavel_email))=b.email) OR (nullif(trim(a.responsavel_email),'') IS NULL AND EXISTS(SELECT 1 FROM public.gov_responsaveis_map m JOIN public.gov_responsaveis_map_cadeiras mc ON mc.map_id=m.id WHERE m.nome_normalizado=a.responsavel_normalizado AND m.situacao='mapeado' AND mc.mt_cadeira_id=b.id)))
 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(b.co->'atas','[]')) x WHERE x->>'gov_acao_id'=a.id::text AND coalesce(x->>'status','')<>'')),
 'status_reports',CASE WHEN to_char(_ciclo-1,'YYYY-MM')<>to_char(_ciclo+6,'YYYY-MM') THEN (SELECT count(*) FROM public.projetos p WHERE p.cadeira_id=b.id AND p.status::text IN ('Em Andamento','Atrasado','Pausado','A Iniciar') AND NOT EXISTS(SELECT 1 FROM public.mt_status_projetos r WHERE r.projeto_codigo=p.codigo AND r.cadeira_id=b.id AND r.competencia=to_char(_ciclo-1,'YYYY-MM') AND nullif(r.arquivo_path,'') IS NOT NULL AND nullif(r.farol_escopo,'') IS NOT NULL AND nullif(r.farol_custo,'') IS NOT NULL AND nullif(r.farol_cronograma,'') IS NOT NULL)) ELSE 0 END
 )) ORDER BY b.cadeira),'[]'::jsonb) INTO resultado FROM base b;
 RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_destinatarios(date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_destinatarios(date) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.rotina_avisos_preparar(_ciclo date,_tipo text,_cadeira uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d jsonb; n integer:=0; inserted integer;
BEGIN
 IF NOT(public.mt_is_governanca(auth.uid()) OR auth.role()='service_role') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _tipo NOT IN ('abertura','lembrete','manual') OR _tipo IS NULL THEN RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rotina_avisos_config WHERE id AND remetente_pronto AND (ativo OR _tipo='manual')) THEN RAISE EXCEPTION 'Envio indisponível: configure o domínio e conclua a conexão de e-mail'; END IF;
 FOR d IN SELECT value FROM jsonb_array_elements(public.rotina_avisos_destinatarios(_ciclo)) LOOP
 IF d->>'motivo' IS NOT NULL OR (_cadeira IS NOT NULL AND d->>'cadeira_id'<>_cadeira::text) OR (_tipo<>'abertura' AND (d->>'enviado')::boolean AND _cadeira IS NULL) OR (_tipo='lembrete' AND (d->>'enviado')::boolean) THEN CONTINUE; END IF;
 INSERT INTO public.rotina_avisos_envios(cadeira_id,usuario_id,ciclo,tipo,destinatario,nome,pendencias,solicitado_por) VALUES((d->>'cadeira_id')::uuid,(d->>'usuario_id')::uuid,_ciclo,_tipo,d->>'email',d->>'nome',d->'pendencias',auth.uid()) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT; n:=n+inserted;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_preparar(date,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_preparar(date,text,uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.rotina_avisos_agendar(_tipo text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE hoje date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; ciclo date;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.rotina_avisos_config WHERE id AND ativo AND remetente_pronto) THEN RETURN; END IF;
 ciclo:=hoje-(extract(isodow FROM hoje)::integer-1);
 IF extract(isodow FROM hoje)>=5 THEN ciclo:=ciclo+7; END IF;
 PERFORM public.rotina_avisos_preparar(ciclo,_tipo);
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_agendar(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_agendar(text) TO service_role;
CREATE OR REPLACE FUNCTION public.rotina_avisos_salvar(_ativo boolean,_abertura_dia integer,_abertura_hora text,_lembrete_dia integer,_lembrete_hora text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE anterior jsonb; job record; h integer; m integer; d integer; horario text; tipo text;
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _ativo IS NULL OR _abertura_dia IS NULL OR _lembrete_dia IS NULL OR _abertura_dia NOT BETWEEN 0 AND 6 OR _lembrete_dia NOT BETWEEN 0 AND 6 OR coalesce(_abertura_hora,'') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR coalesce(_lembrete_hora,'') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Horário inválido'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('rotina_avisos_config'));
 SELECT to_jsonb(c) INTO anterior FROM public.rotina_avisos_config c WHERE id;
 IF _ativo AND NOT coalesce((anterior->>'remetente_pronto')::boolean,false) THEN RAISE EXCEPTION 'Configure o domínio e conclua a conexão de e-mail antes de ligar'; END IF;
 INSERT INTO public.rotina_avisos_config(id,ativo,abertura_dia,abertura_hora,lembrete_dia,lembrete_hora,atualizado_por) VALUES(true,_ativo,_abertura_dia,_abertura_hora::time,_lembrete_dia,_lembrete_hora::time,auth.uid())
 ON CONFLICT(id) DO UPDATE SET ativo=EXCLUDED.ativo,abertura_dia=EXCLUDED.abertura_dia,abertura_hora=EXCLUDED.abertura_hora,lembrete_dia=EXCLUDED.lembrete_dia,lembrete_hora=EXCLUDED.lembrete_hora,atualizado_por=auth.uid(),atualizado_em=now();
 FOR job IN SELECT jobid FROM cron.job WHERE jobname IN ('rotina-email-abertura','rotina-email-lembrete') LOOP PERFORM cron.unschedule(job.jobid); END LOOP;
 IF _ativo THEN
 FOREACH tipo IN ARRAY ARRAY['abertura','lembrete'] LOOP
 horario:=CASE WHEN tipo='abertura' THEN _abertura_hora ELSE _lembrete_hora END;
 d:=CASE WHEN tipo='abertura' THEN _abertura_dia ELSE _lembrete_dia END;
 h:=split_part(horario,':',1)::integer+3; m:=split_part(horario,':',2)::integer;
 PERFORM cron.schedule('rotina-email-'||tipo,m||' '||(h%24)||' * * '||((d+h/24)%7),format('SELECT public.rotina_avisos_agendar(%L);',tipo));
 END LOOP;
 END IF;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('rotina_avisos_config','true','configuracao',anterior::text,jsonb_build_object('ativo',_ativo,'abertura_dia',_abertura_dia,'abertura_hora',_abertura_hora,'lembrete_dia',_lembrete_dia,'lembrete_hora',_lembrete_hora)::text,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_salvar(boolean,integer,text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_salvar(boolean,integer,text,integer,text) TO authenticated;
COMMENT ON TABLE public.rotina_avisos_envios IS 'Channel-ready notification outbox. Only email currently allowed. Sender adapter must be scaffolded through Lovable transactional email after sender-domain setup; never enable readiness before worker deployment. Open tracking stays null unless supported by provider.';