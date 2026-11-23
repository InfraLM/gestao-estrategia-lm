CREATE OR REPLACE FUNCTION public.offsite_salvar(_respostas jsonb, _revisao integer, _enviar boolean DEFAULT false)
 RETURNS offsite_respostas
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ DECLARE r offsite_respostas; c uuid; k text; antigo jsonb; lim int; cfg jsonb; BEGIN c:=offsite_cadeira(); IF c IS NULL THEN RAISE EXCEPTION 'Conta sem cadeira de diretoria vinculada'; END IF; IF jsonb_typeof(_respostas)<>'object' OR octet_length(_respostas::text)>1000000 THEN RAISE EXCEPTION 'Respostas inválidas'; END IF;
 SELECT conteudo INTO cfg FROM offsite_config WHERE id='2027';
 FOREACH k IN ARRAY ARRAY['1.1','1.2','2.1','4.3'] LOOP
  SELECT greatest(3,coalesce(max((p->>'limite')::int),3)) INTO lim FROM jsonb_array_elements(coalesce(cfg->'perguntas','[]')) b CROSS JOIN LATERAL jsonb_array_elements(b) p WHERE p->>'id'=k AND jsonb_typeof(p->'limite')='number';
  IF _respostas ? k AND (jsonb_typeof(_respostas->k)<>'array' OR jsonb_array_length(_respostas->k)>lim) THEN RAISE EXCEPTION 'Limite de % itens',lim; END IF;
 END LOOP;
 SELECT greatest(2,coalesce(max((p->>'limite')::int),2)) INTO lim FROM jsonb_array_elements(coalesce(cfg->'perguntas','[]')) b CROSS JOIN LATERAL jsonb_array_elements(b) p WHERE p->>'id'='4.1' AND jsonb_typeof(p->'limite')='number';
 IF jsonb_array_length(coalesce(_respostas->'3.selecionadas','[]'))>3 OR jsonb_array_length(coalesce(_respostas->'4.1','[]'))>lim THEN RAISE EXCEPTION 'Seleção excede o limite'; END IF;
 INSERT INTO offsite_respostas(user_id,cadeira_id,nome) SELECT auth.uid(),c,coalesce(p.display_name,'Diretor') FROM profiles p WHERE p.user_id=auth.uid() ON CONFLICT(user_id) DO NOTHING; SELECT * INTO r FROM offsite_respostas WHERE user_id=auth.uid() FOR UPDATE; IF r.id IS NULL THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF; IF r.status='enviado' THEN RAISE EXCEPTION 'Resposta enviada, solicite reabertura'; END IF; IF r.revisao<>_revisao THEN RAISE EXCEPTION 'Resposta alterada em outra sessão. Recarregue antes de editar'; END IF; antigo:=to_jsonb(r); UPDATE offsite_respostas SET cadeira_id=c,respostas=_respostas,revisao=revisao+1,status=CASE WHEN _enviar THEN 'enviado' ELSE 'rascunho' END,enviado_em=CASE WHEN _enviar THEN now() ELSE enviado_em END,atualizado_em=now() WHERE id=r.id RETURNING * INTO r; IF _enviar THEN INSERT INTO offsite_historico(resposta_id,ator,acao,antes,depois) VALUES(r.id,auth.uid(),'enviar',antigo,to_jsonb(r)); END IF; RETURN r; END $function$;