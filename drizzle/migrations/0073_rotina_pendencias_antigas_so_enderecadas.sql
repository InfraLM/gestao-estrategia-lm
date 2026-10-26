CREATE OR REPLACE FUNCTION public.rotina_pendencias_antigas() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE hoje date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; saida jsonb:='[]'; a record; c record; p record; BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RETURN saida; END IF;
 FOR a IN SELECT * FROM public.gov_acoes x WHERE public.rotina_ata_aberta(x) AND NOT public.rotina_dentro_janela('ata',x.id::text,coalesce(x.reuniao_data,x.origem_created_at,x.sincronizado_em)::date,hoje)
  AND NOT EXISTS(SELECT 1 FROM public.rotina_pendencias_gestao g WHERE g.tipo='ata' AND g.item_ref=x.id::text AND g.baixada_em IS NOT NULL)
  AND EXISTS(SELECT 1 FROM public.mt_cadeiras cc WHERE cc.ativo AND public.rotina_ata_da_cadeira(x,cc.id)) LOOP
  saida:=saida||jsonb_build_array(jsonb_build_object('tipo','ata','ref',a.id::text,'titulo',a.titulo,'descricao',a.descricao,'comite_codigo',a.comite_codigo,'reuniao_titulo',a.reuniao_titulo,'responsavel_origem',a.responsavel_origem,'origem',coalesce(a.reuniao_data,a.origem_created_at)::date,'detalhe','Ata · '||coalesce(a.reuniao_titulo,'Reunião')||' · '||coalesce(a.responsavel_origem,'sem responsável'),
   'cadeiras',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',cc.id,'nome',cc.nome)),'[]') FROM public.mt_cadeiras cc WHERE cc.ativo AND public.rotina_ata_da_cadeira((SELECT y FROM public.gov_acoes y WHERE y.id=a.id),cc.id))));
 END LOOP;
 FOR c IN SELECT * FROM public.mt_cadeiras WHERE ativo LOOP
  FOR p IN SELECT w.semana,q.value item FROM public.mt_checkins w CROSS JOIN LATERAL jsonb_array_elements(coalesce(w.conteudo->'prioridades','[]')) q WHERE w.cadeira_id=c.id AND w.tipo='checkin' AND w.status='enviado' AND btrim(coalesce(q.value->>'titulo',''))<>''
   AND NOT EXISTS(SELECT 1 FROM public.mt_checkins co CROSS JOIN LATERAL jsonb_array_elements(coalesce(co.conteudo->'entregas','[]')) e WHERE co.cadeira_id=c.id AND co.tipo='checkout' AND co.status='enviado' AND e->>'status'='entregue' AND coalesce(e->>'herdada_de',co.semana::text)=w.semana::text AND coalesce(nullif(e->>'prioridade_id',''),e->>'titulo')=coalesce(nullif(q.value->>'id',''),q.value->>'titulo')) LOOP
   IF NOT public.rotina_dentro_janela('prioridade',p.semana::text||'|'||coalesce(nullif(p.item->>'id',''),p.item->>'titulo'),p.semana,hoje) AND NOT EXISTS(SELECT 1 FROM public.rotina_pendencias_gestao g WHERE g.tipo='prioridade' AND g.item_ref=p.semana::text||'|'||coalesce(nullif(p.item->>'id',''),p.item->>'titulo') AND g.baixada_em IS NOT NULL) THEN
    saida:=saida||jsonb_build_array(jsonb_build_object('tipo','prioridade','ref',p.semana::text||'|'||coalesce(nullif(p.item->>'id',''),p.item->>'titulo'),'titulo',p.item->>'titulo','descricao',p.item->>'resultado','origem',p.semana,'detalhe','Prioridade estratégica','cadeiras',jsonb_build_array(jsonb_build_object('id',c.id,'nome',c.nome))));
   END IF;
  END LOOP;
 END LOOP;
 RETURN saida; END $$;