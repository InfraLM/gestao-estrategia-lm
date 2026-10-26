CREATE TABLE public.rotina_pendencias_gestao(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tipo text NOT NULL CHECK (tipo IN ('ata','prioridade','impedimento')),
 item_ref text NOT NULL,
 cadeira_id uuid REFERENCES public.mt_cadeiras(id),
 reativada_ciclo date,
 baixada_em timestamptz,
 motivo text NOT NULL DEFAULT '',
 atualizado_por uuid, atualizado_nome text,
 atualizado_em timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tipo,item_ref));
GRANT SELECT ON public.rotina_pendencias_gestao TO authenticated;
GRANT ALL ON public.rotina_pendencias_gestao TO service_role;
ALTER TABLE public.rotina_pendencias_gestao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura da gestão de pendências" ON public.rotina_pendencias_gestao FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'rotina',false));

CREATE OR REPLACE FUNCTION public.rotina_dentro_janela(_tipo text,_ref text,_origem date,_ciclo date) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.rotina_pendencias_gestao g WHERE g.tipo=_tipo AND g.item_ref=_ref AND g.baixada_em IS NOT NULL)
 AND greatest(coalesce(_origem,'-infinity'::date), coalesce((SELECT g.reativada_ciclo FROM public.rotina_pendencias_gestao g WHERE g.tipo=_tipo AND g.item_ref=_ref),'-infinity'::date)) >= (_ciclo - interval '3 months')::date $$;

CREATE OR REPLACE FUNCTION public.rotina_ata_aberta(a public.gov_acoes) RETURNS boolean LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT a.concluida_em IS NULL AND lower(translate(trim(coalesce(a.status,'')), 'áàâãéêíóôõúç', 'aaaaeeiooouc')) NOT IN ('concluido','concluida','cancelado','cancelada') $$;

CREATE OR REPLACE FUNCTION public.rotina_ata_da_cadeira(a public.gov_acoes,_cadeira uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN (SELECT g.cadeira_id FROM public.rotina_pendencias_gestao g WHERE g.tipo='ata' AND g.item_ref=a.id::text) IS NOT NULL
  THEN (SELECT g.cadeira_id FROM public.rotina_pendencias_gestao g WHERE g.tipo='ata' AND g.item_ref=a.id::text)=_cadeira
  ELSE (nullif(trim(a.responsavel_email),'') IS NOT NULL AND EXISTS(SELECT 1 FROM public.mt_cadeiras c JOIN public.profiles p ON p.user_id=c.diretor_user_id WHERE c.id=_cadeira AND lower(trim(p.email))=lower(trim(a.responsavel_email))))
   OR (nullif(trim(a.responsavel_email),'') IS NULL AND EXISTS(SELECT 1 FROM public.gov_responsaveis_map m JOIN public.gov_responsaveis_map_cadeiras mc ON mc.map_id=m.id WHERE m.nome_normalizado=a.responsavel_normalizado AND m.situacao='mapeado' AND mc.mt_cadeira_id=_cadeira)) END $$;

CREATE OR REPLACE FUNCTION public.gov_acoes_da_cadeira(_cadeira uuid)
 RETURNS TABLE(id uuid, origem_id uuid, titulo text, descricao text, responsavel_origem text, prazo date, status text, prioridade text, precisa_escalar boolean, comite_codigo text, reuniao_titulo text, reuniao_data timestamp with time zone, outros_responsaveis text[])
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT a.id, a.origem_id, a.titulo, a.descricao, a.responsavel_origem, a.prazo, a.status, a.prioridade, a.precisa_escalar, a.comite_codigo, a.reuniao_titulo, a.reuniao_data,
 ARRAY(SELECT DISTINCT c.nome FROM public.gov_responsaveis_map m2 JOIN public.gov_responsaveis_map_cadeiras mc2 ON mc2.map_id=m2.id JOIN public.mt_cadeiras c ON c.id=mc2.mt_cadeira_id WHERE m2.nome_normalizado=a.responsavel_normalizado AND m2.situacao='mapeado' AND mc2.mt_cadeira_id<>_cadeira ORDER BY c.nome)
 FROM public.gov_acoes a
 WHERE auth.uid() IS NOT NULL
 AND (public.gov_is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.mt_cadeiras c WHERE c.id=_cadeira AND c.diretor_user_id=auth.uid()))
 AND public.rotina_ata_aberta(a)
 AND public.rotina_ata_da_cadeira(a,_cadeira)
 AND public.rotina_dentro_janela('ata',a.id::text,coalesce(a.reuniao_data,a.origem_created_at,a.sincronizado_em)::date,(now() AT TIME ZONE 'America/Sao_Paulo')::date);
$function$;

CREATE OR REPLACE FUNCTION public.rotina_atas_aguardando() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',a.id,'titulo',a.titulo,'descricao',a.descricao,'responsavel_origem',a.responsavel_origem,'responsavel_email',a.responsavel_email,'prazo',a.prazo,'comite_codigo',a.comite_codigo,'reuniao_titulo',a.reuniao_titulo,'reuniao_data',a.reuniao_data,
  'motivo',CASE WHEN coalesce(trim(a.responsavel_origem),'')='' AND coalesce(trim(a.responsavel_email),'')='' THEN 'sem_responsavel' ELSE 'sem_cadeira' END) ORDER BY a.reuniao_data DESC NULLS LAST),'[]'::jsonb)
 FROM public.gov_acoes a
 WHERE public.mt_is_governanca(auth.uid()) AND public.rotina_ata_aberta(a)
 AND NOT EXISTS(SELECT 1 FROM public.rotina_pendencias_gestao g WHERE g.tipo='ata' AND g.item_ref=a.id::text AND (g.cadeira_id IS NOT NULL OR g.baixada_em IS NOT NULL))
 AND NOT EXISTS(SELECT 1 FROM public.mt_cadeiras c WHERE c.ativo AND public.rotina_ata_da_cadeira(a,c.id)) $$;

CREATE OR REPLACE FUNCTION public.rotina_pendencias_antigas() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE hoje date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; saida jsonb:='[]'; a record; c record; p record; r record; BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RETURN saida; END IF;
 FOR a IN SELECT * FROM public.gov_acoes x WHERE public.rotina_ata_aberta(x) AND NOT public.rotina_dentro_janela('ata',x.id::text,coalesce(x.reuniao_data,x.origem_created_at,x.sincronizado_em)::date,hoje)
  AND NOT EXISTS(SELECT 1 FROM public.rotina_pendencias_gestao g WHERE g.tipo='ata' AND g.item_ref=x.id::text AND g.baixada_em IS NOT NULL) LOOP
  saida:=saida||jsonb_build_array(jsonb_build_object('tipo','ata','ref',a.id::text,'titulo',a.titulo,'origem',coalesce(a.reuniao_data,a.origem_created_at)::date,'detalhe','Ata · '||coalesce(a.reuniao_titulo,'Reunião')||' · '||coalesce(a.responsavel_origem,'sem responsável'),
   'cadeiras',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',cc.id,'nome',cc.nome)),'[]') FROM public.mt_cadeiras cc WHERE cc.ativo AND public.rotina_ata_da_cadeira((SELECT y FROM public.gov_acoes y WHERE y.id=a.id),cc.id))));
 END LOOP;
 FOR r IN SELECT rr.*,d.nome destino FROM public.mt_rotina_riscos rr LEFT JOIN public.mt_cadeiras d ON d.id=rr.atribuido_cadeira_id WHERE rr.publicado_em IS NOT NULL AND rr.atribuido_cadeira_id IS NOT NULL AND coalesce(rr.resposta_status,'aberto') NOT IN ('resolvido','nao_procede')
  AND NOT public.rotina_dentro_janela('impedimento',rr.id::text,rr.publicado_ciclo,hoje) AND NOT EXISTS(SELECT 1 FROM public.rotina_pendencias_gestao g WHERE g.tipo='impedimento' AND g.item_ref=rr.id::text AND g.baixada_em IS NOT NULL) LOOP
  saida:=saida||jsonb_build_array(jsonb_build_object('tipo','impedimento','ref',r.id::text,'titulo',r.descricao,'origem',r.publicado_ciclo,'detalhe','Impedimento atribuído','cadeiras',jsonb_build_array(jsonb_build_object('id',r.atribuido_cadeira_id,'nome',r.destino))));
 END LOOP;
 FOR c IN SELECT * FROM public.mt_cadeiras WHERE ativo LOOP
  FOR p IN SELECT w.semana,q.value item FROM public.mt_checkins w CROSS JOIN LATERAL jsonb_array_elements(coalesce(w.conteudo->'prioridades','[]')) q WHERE w.cadeira_id=c.id AND w.tipo='checkin' AND w.status='enviado' AND btrim(coalesce(q.value->>'titulo',''))<>''
   AND NOT EXISTS(SELECT 1 FROM public.mt_checkins co CROSS JOIN LATERAL jsonb_array_elements(coalesce(co.conteudo->'entregas','[]')) e WHERE co.cadeira_id=c.id AND co.tipo='checkout' AND co.status='enviado' AND e->>'status'='entregue' AND coalesce(e->>'herdada_de',co.semana::text)=w.semana::text AND coalesce(nullif(e->>'prioridade_id',''),e->>'titulo')=coalesce(nullif(q.value->>'id',''),q.value->>'titulo')) LOOP
   IF NOT public.rotina_dentro_janela('prioridade',p.semana::text||'|'||coalesce(nullif(p.item->>'id',''),p.item->>'titulo'),p.semana,hoje) AND NOT EXISTS(SELECT 1 FROM public.rotina_pendencias_gestao g WHERE g.tipo='prioridade' AND g.item_ref=p.semana::text||'|'||coalesce(nullif(p.item->>'id',''),p.item->>'titulo') AND g.baixada_em IS NOT NULL) THEN
    saida:=saida||jsonb_build_array(jsonb_build_object('tipo','prioridade','ref',p.semana::text||'|'||coalesce(nullif(p.item->>'id',''),p.item->>'titulo'),'titulo',p.item->>'titulo','origem',p.semana,'detalhe','Prioridade estratégica','cadeiras',jsonb_build_array(jsonb_build_object('id',c.id,'nome',c.nome))));
   END IF;
  END LOOP;
 END LOOP;
 RETURN saida; END $$;

CREATE OR REPLACE FUNCTION public.rotina_pendencia_gerir(_tipo text,_ref text,_acao text,_cadeira uuid DEFAULT NULL,_motivo text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE hoje date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; ant public.rotina_pendencias_gestao%ROWTYPE; nome text; BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente a Governança gerencia pendências'; END IF;
 IF _tipo NOT IN ('ata','prioridade','impedimento') OR _acao NOT IN ('atribuir','reativar','baixar') THEN RAISE EXCEPTION 'Operação inválida'; END IF;
 IF _acao='atribuir' AND _tipo='prioridade' THEN RAISE EXCEPTION 'Prioridades pertencem à cadeira que as declarou'; END IF;
 IF _acao='atribuir' AND NOT EXISTS(SELECT 1 FROM public.mt_cadeiras WHERE id=_cadeira AND ativo) THEN RAISE EXCEPTION 'Escolha uma cadeira ativa'; END IF;
 IF _acao='baixar' AND btrim(coalesce(_motivo,''))='' THEN RAISE EXCEPTION 'Informe o motivo da baixa'; END IF;
 IF _tipo='ata' AND NOT EXISTS(SELECT 1 FROM public.gov_acoes WHERE id::text=_ref) THEN RAISE EXCEPTION 'Ação não encontrada'; END IF;
 IF _tipo='impedimento' AND NOT EXISTS(SELECT 1 FROM public.mt_rotina_riscos WHERE id::text=_ref AND publicado_em IS NOT NULL) THEN RAISE EXCEPTION 'Impedimento não encontrado'; END IF;
 SELECT * INTO ant FROM public.rotina_pendencias_gestao WHERE tipo=_tipo AND item_ref=_ref;
 SELECT display_name INTO nome FROM public.profiles WHERE user_id=auth.uid();
 IF _acao='atribuir' AND _tipo='impedimento' THEN
  PERFORM set_config('app.impedimento_operacao',_ref,true);
  UPDATE public.mt_rotina_riscos SET atribuido_cadeira_id=_cadeira WHERE id::text=_ref;
 END IF;
 INSERT INTO public.rotina_pendencias_gestao(tipo,item_ref,cadeira_id,reativada_ciclo,baixada_em,motivo,atualizado_por,atualizado_nome,atualizado_em)
 VALUES(_tipo,_ref,CASE WHEN _acao='atribuir' AND _tipo='ata' THEN _cadeira END,CASE WHEN _acao IN ('atribuir','reativar') THEN hoje END,CASE WHEN _acao='baixar' THEN now() END,coalesce(_motivo,''),auth.uid(),nome,now())
 ON CONFLICT(tipo,item_ref) DO UPDATE SET
  cadeira_id=CASE WHEN _acao='atribuir' AND _tipo='ata' THEN _cadeira ELSE rotina_pendencias_gestao.cadeira_id END,
  reativada_ciclo=CASE WHEN _acao IN ('atribuir','reativar') THEN hoje ELSE rotina_pendencias_gestao.reativada_ciclo END,
  baixada_em=CASE WHEN _acao='baixar' THEN now() ELSE NULL END,
  motivo=coalesce(_motivo,''),atualizado_por=auth.uid(),atualizado_nome=nome,atualizado_em=now();
 INSERT INTO public.mt_auditoria(tabela,registro_id,competencia,campo,valor_anterior,valor_novo,alterado_por)
 VALUES('rotina_pendencias_gestao',_tipo||':'||_ref,to_char(hoje,'YYYY-MM'),_acao,CASE WHEN ant.id IS NOT NULL THEN to_jsonb(ant)::text END,(SELECT to_jsonb(g)::text FROM public.rotina_pendencias_gestao g WHERE tipo=_tipo AND item_ref=_ref),auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.rotina_pendencia_gerir(text,text,text,uuid,text) FROM anon;

CREATE OR REPLACE FUNCTION public.rotina_impedimentos_ciclo(_cadeira uuid, _ciclo date)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('origem_nome',o.nome,'destino_nome',d.nome,'resposta_ciclo',(SELECT to_jsonb(x) FROM public.mt_impedimento_respostas x WHERE x.risco_id=r.id AND x.ciclo=_ciclo AND (r.reaberto_em IS NULL OR x.respondido_em>r.reaberto_em)))), '[]'::jsonb) FROM public.mt_rotina_riscos r JOIN public.mt_cadeiras o ON o.id=r.cadeira_id LEFT JOIN public.mt_cadeiras d ON d.id=r.atribuido_cadeira_id WHERE public.rotina_atividade_permitida(r.cadeira_id,CASE WHEN r.publicado_em IS NOT NULL THEN r.atribuido_cadeira_id END) AND coalesce((public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR _cadeira=public.mt_cadeira_do_usuario(auth.uid())),false) AND r.atribuido_cadeira_id IS NOT NULL AND r.semana_criada<=_ciclo AND (r.cadeira_id=_cadeira OR (r.atribuido_cadeira_id=_cadeira AND r.publicado_ciclo<_ciclo AND public.rotina_dentro_janela('impedimento',r.id::text,r.publicado_ciclo,_ciclo))) $function$;

CREATE OR REPLACE FUNCTION public.rotina_impedimentos_completude()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE r record; resp public.mt_impedimento_respostas%ROWTYPE; c jsonb; total integer:=0; feitos integer:=0; v_ciclo date; BEGIN
 IF NEW.tipo<>'checkout' OR NEW.status<>'enviado' THEN RETURN NEW; END IF; v_ciclo:=NEW.semana+7;
 FOR r IN SELECT * FROM public.mt_rotina_riscos WHERE atribuido_cadeira_id=NEW.cadeira_id AND publicado_ciclo<v_ciclo AND public.rotina_dentro_janela('impedimento',mt_rotina_riscos.id::text,publicado_ciclo,v_ciclo) AND (resposta_status NOT IN ('resolvido','nao_procede') OR EXISTS(SELECT 1 FROM public.mt_impedimento_respostas x WHERE x.risco_id=mt_rotina_riscos.id AND x.ciclo=v_ciclo)) LOOP
 total:=total+1; SELECT * INTO resp FROM public.mt_impedimento_respostas WHERE risco_id=r.id AND ciclo=v_ciclo AND (r.reaberto_em IS NULL OR respondido_em>r.reaberto_em);
 IF NOT FOUND OR btrim(resp.plano)='' OR resp.prazo IS NULL OR (resp.status='nao_procede' AND btrim(resp.justificativa)='') THEN RAISE EXCEPTION 'Responda plano, prazo e status do impedimento recebido: %',r.descricao; END IF; feitos:=feitos+1; END LOOP;
 IF TG_OP='UPDATE' AND OLD.conteudo->>'primeiro_envio_em' IS NOT NULL THEN RETURN NEW; END IF;
 c:=coalesce(NEW.conteudo->'completude','{"total":0,"feitos":0,"faltando":[]}');
 NEW.conteudo:=jsonb_set(NEW.conteudo,'{completude}',jsonb_build_object('total',coalesce((c->>'total')::int,0)+total,'feitos',coalesce((c->>'feitos')::int,0)+feitos,'faltando',coalesce(c->'faltando','[]'::jsonb))); RETURN NEW; END $function$;

CREATE OR REPLACE FUNCTION public.rotina_atividades_abertas(_ciclo date)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE saida jsonb:='[]'; c record; a record; r record; p record; st jsonb; BEGIN
 IF auth.uid() IS NULL OR NOT public.acesso_modulo(auth.uid(),'rotina',false) THEN RETURN saida; END IF;
 FOR r IN SELECT rr.*,o.nome origem_nome,d.nome destino_nome FROM public.mt_rotina_riscos rr JOIN public.mt_cadeiras o ON o.id=rr.cadeira_id LEFT JOIN public.mt_cadeiras d ON d.id=rr.atribuido_cadeira_id WHERE rr.publicado_em IS NOT NULL AND rr.publicado_ciclo<=_ciclo AND public.rotina_atividade_permitida(rr.cadeira_id,rr.atribuido_cadeira_id) AND (rr.resposta_status IN ('resolvido','nao_procede') OR public.rotina_dentro_janela('impedimento',rr.id::text,rr.publicado_ciclo,_ciclo)) LOOP
 saida:=saida||jsonb_build_array(jsonb_build_object('id',r.id,'origem','impedimento','titulo',r.descricao,'origem_label','Impedimento sinalizado por '||coalesce(r.sinalizado_por_nome,r.origem_nome)||' / '||r.origem_nome||' (ciclo '||to_char(r.publicado_ciclo,'DD/MM')||')','responsavel',r.destino_nome,'quem_sinalizou',r.sinalizado_por_nome,'plano',r.plano_acao,'prazo',r.prazo_plano,'status',r.resposta_status,'cadeira_id',r.atribuido_cadeira_id,'sinalizador_cadeira_id',r.cadeira_id,'atrasado',public.rotina_impedimento_atrasado(r.prazo_plano,r.resposta_status,(now() AT TIME ZONE 'America/Sao_Paulo')::date)));
 END LOOP;
 FOR c IN SELECT * FROM public.mt_cadeiras WHERE public.rotina_atividade_permitida(id,NULL) LOOP
 FOR a IN SELECT * FROM public.gov_acoes_da_cadeira(c.id) LOOP
 SELECT x INTO st FROM public.mt_checkins w CROSS JOIN LATERAL jsonb_array_elements(coalesce(w.conteudo->'atas','[]')) x WHERE w.cadeira_id=c.id AND w.tipo='checkout' AND w.status='enviado' AND w.semana<_ciclo AND x->>'gov_acao_id'=a.id::text ORDER BY w.semana DESC LIMIT 1;
 saida:=saida||jsonb_build_array(jsonb_build_object('id',a.id,'origem','ata','titulo',a.titulo,'origem_label','Ata · '||coalesce(a.reuniao_titulo,'Reunião')||' ('||coalesce(to_char(a.reuniao_data,'DD/MM/YYYY'),'sem data')||')','responsavel',c.nome,'quem_sinalizou','Governança','plano',coalesce(nullif(st->>'comentario',''),a.descricao),'prazo',a.prazo,'status',CASE WHEN st->>'status'='em_andamento' THEN 'em_andamento' ELSE 'aberto' END,'cadeira_id',c.id,'atrasado',coalesce(a.prazo<(now() AT TIME ZONE 'America/Sao_Paulo')::date,false),'aguardando_baixa',coalesce(st->>'status'='entregue',false)));
 END LOOP;
 FOR p IN SELECT w.semana,q.value item FROM public.mt_checkins w CROSS JOIN LATERAL jsonb_array_elements(coalesce(w.conteudo->'prioridades','[]')) q WHERE w.cadeira_id=c.id AND w.tipo='checkin' AND w.status='enviado' AND w.semana<=_ciclo AND btrim(coalesce(q.value->>'titulo',''))<>'' AND public.rotina_dentro_janela('prioridade',w.semana::text||'|'||coalesce(nullif(q.value->>'id',''),q.value->>'titulo'),w.semana,_ciclo) AND NOT EXISTS(SELECT 1 FROM public.mt_checkins co CROSS JOIN LATERAL jsonb_array_elements(coalesce(co.conteudo->'entregas','[]')) e WHERE co.cadeira_id=c.id AND co.tipo='checkout' AND co.status='enviado' AND co.semana<=_ciclo AND e->>'status'='entregue' AND coalesce(e->>'herdada_de',co.semana::text)=w.semana::text AND coalesce(nullif(e->>'prioridade_id',''),e->>'titulo')=coalesce(nullif(q.value->>'id',''),q.value->>'titulo')) LOOP
 saida:=saida||jsonb_build_array(jsonb_build_object('id',coalesce(p.item->>'id',p.item->>'titulo')||p.semana::text,'origem','prioridade','titulo',p.item->>'titulo','origem_label','Prioridade estratégica apontada (ciclo '||to_char(p.semana,'DD/MM')||')','responsavel',c.nome,'quem_sinalizou',c.diretor_nome,'plano',p.item->>'resultado','prazo',p.item->>'prazo','status','aberto','cadeira_id',c.id,'atrasado',coalesce(nullif(p.item->>'prazo','')::date<(now() AT TIME ZONE 'America/Sao_Paulo')::date,false)));
 END LOOP; END LOOP; RETURN saida; END $function$;

CREATE TABLE public.rotina_acoes_entrega(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id),
 ciclo_origem date NOT NULL,
 ciclo_atualizacao date NOT NULL,
 projeto_id uuid REFERENCES public.projetos(id) ON DELETE SET NULL,
 iniciativa_id uuid REFERENCES public.mt_iniciativas(id) ON DELETE SET NULL,
 responsavel text NOT NULL DEFAULT '',
 descricao text NOT NULL,
 vinculos jsonb NOT NULL DEFAULT '[]',
 status text NOT NULL CHECK (status IN ('em_andamento','concluida','cancelada')),
 data_conclusao date, data_prevista date,
 motivo_cancelamento text NOT NULL DEFAULT '',
 criado_por uuid, criado_nome text, atualizado_por uuid, atualizado_nome text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (projeto_id IS NULL OR iniciativa_id IS NULL));
CREATE INDEX rotina_acoes_entrega_cadeira ON public.rotina_acoes_entrega(cadeira_id,status);
CREATE INDEX rotina_acoes_entrega_projeto ON public.rotina_acoes_entrega(projeto_id);
GRANT SELECT ON public.rotina_acoes_entrega TO authenticated;
GRANT ALL ON public.rotina_acoes_entrega TO service_role;
ALTER TABLE public.rotina_acoes_entrega ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura das entregas de ações" ON public.rotina_acoes_entrega FOR SELECT TO authenticated USING (
 public.acesso_modulo(auth.uid(),'rotina',false) AND (public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR cadeira_id=public.mt_cadeira_do_usuario(auth.uid()) OR (projeto_id IS NOT NULL AND public.proj_principal(auth.uid(),projeto_id))));

CREATE OR REPLACE FUNCTION public.rotina_acao_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF btrim(coalesce(NEW.descricao,''))='' THEN RAISE EXCEPTION 'Descreva a entrega'; END IF;
 IF NEW.status='concluida' AND NEW.data_conclusao IS NULL THEN RAISE EXCEPTION 'Informe a data de conclusão'; END IF;
 IF NEW.status='em_andamento' AND NEW.data_prevista IS NULL THEN RAISE EXCEPTION 'Informe a data prevista de conclusão'; END IF;
 IF NEW.status='cancelada' AND btrim(NEW.motivo_cancelamento)='' THEN RAISE EXCEPTION 'Informe o motivo do cancelamento'; END IF;
 IF jsonb_typeof(NEW.vinculos)<>'array' THEN RAISE EXCEPTION 'Vínculos inválidos'; END IF;
 IF TG_OP='UPDATE' AND (NEW.cadeira_id<>OLD.cadeira_id OR NEW.ciclo_origem<>OLD.ciclo_origem OR NEW.criado_por IS DISTINCT FROM OLD.criado_por) THEN RAISE EXCEPTION 'Origem da entrega não pode ser alterada'; END IF;
 NEW.updated_at:=now(); RETURN NEW; END $$;
CREATE TRIGGER rotina_acao_guard BEFORE INSERT OR UPDATE ON public.rotina_acoes_entrega FOR EACH ROW EXECUTE FUNCTION public.rotina_acao_guard();

CREATE OR REPLACE FUNCTION public.rotina_acao_auditar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 INSERT INTO public.mt_auditoria(tabela,registro_id,competencia,campo,valor_anterior,valor_novo,alterado_por)
 VALUES('rotina_acoes_entrega',NEW.id::text,to_char(NEW.ciclo_atualizacao,'YYYY-MM'),lower(TG_OP),CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD)::text END,to_jsonb(NEW)::text,auth.uid()); RETURN NEW; END $$;
CREATE TRIGGER rotina_acao_auditar AFTER INSERT OR UPDATE ON public.rotina_acoes_entrega FOR EACH ROW EXECUTE FUNCTION public.rotina_acao_auditar();

CREATE OR REPLACE FUNCTION public.rotina_acao_salvar(_id uuid,_cadeira uuid,_ciclo date,_dados jsonb) RETURNS public.rotina_acoes_entrega LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE linha public.rotina_acoes_entrega; nome text; BEGIN
 IF auth.uid() IS NULL OR NOT public.acesso_modulo(auth.uid(),'rotina',true) OR NOT (public.mt_is_governanca(auth.uid()) OR public.mt_cadeira_do_usuario(auth.uid())=_cadeira) THEN RAISE EXCEPTION 'Sem permissão para registrar entregas desta cadeira'; END IF;
 IF extract(isodow FROM _ciclo)<>1 THEN RAISE EXCEPTION 'Ciclo inválido'; END IF;
 SELECT display_name INTO nome FROM public.profiles WHERE user_id=auth.uid();
 IF _id IS NULL THEN
  INSERT INTO public.rotina_acoes_entrega(cadeira_id,ciclo_origem,ciclo_atualizacao,projeto_id,iniciativa_id,responsavel,descricao,vinculos,status,data_conclusao,data_prevista,motivo_cancelamento,criado_por,criado_nome,atualizado_por,atualizado_nome)
  VALUES(_cadeira,_ciclo,_ciclo,nullif(_dados->>'projeto_id','')::uuid,nullif(_dados->>'iniciativa_id','')::uuid,coalesce(_dados->>'responsavel',''),coalesce(_dados->>'descricao',''),coalesce(_dados->'vinculos','[]'),coalesce(_dados->>'status','em_andamento'),nullif(_dados->>'data_conclusao','')::date,nullif(_dados->>'data_prevista','')::date,coalesce(_dados->>'motivo_cancelamento',''),auth.uid(),nome,auth.uid(),nome) RETURNING * INTO linha;
 ELSE
  UPDATE public.rotina_acoes_entrega SET ciclo_atualizacao=greatest(ciclo_atualizacao,_ciclo),projeto_id=nullif(_dados->>'projeto_id','')::uuid,iniciativa_id=nullif(_dados->>'iniciativa_id','')::uuid,responsavel=coalesce(_dados->>'responsavel',''),descricao=coalesce(_dados->>'descricao',''),vinculos=coalesce(_dados->'vinculos','[]'),status=coalesce(_dados->>'status',status),data_conclusao=nullif(_dados->>'data_conclusao','')::date,data_prevista=nullif(_dados->>'data_prevista','')::date,motivo_cancelamento=coalesce(_dados->>'motivo_cancelamento',''),atualizado_por=auth.uid(),atualizado_nome=nome
  WHERE id=_id AND cadeira_id=_cadeira RETURNING * INTO linha;
  IF NOT FOUND THEN RAISE EXCEPTION 'Entrega não encontrada'; END IF;
 END IF;
 RETURN linha; END $$;
REVOKE ALL ON FUNCTION public.rotina_acao_salvar(uuid,uuid,date,jsonb) FROM anon;