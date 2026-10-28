CREATE TABLE public.offsite_config_rascunhos(
 id text PRIMARY KEY,
 conteudo jsonb NOT NULL,
 mapeamentos jsonb NOT NULL DEFAULT '[]'::jsonb,
 base_atualizado_em timestamptz,
 autor uuid,
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offsite_config_rascunhos TO authenticated;
GRANT ALL ON public.offsite_config_rascunhos TO service_role;
ALTER TABLE public.offsite_config_rascunhos ENABLE ROW LEVEL SECURITY;
CREATE POLICY administrar ON public.offsite_config_rascunhos FOR ALL TO authenticated USING (public.offsite_admin()) WITH CHECK (public.offsite_admin());

CREATE OR REPLACE FUNCTION public.offsite_config_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE k text; ids_old jsonb; ids_new jsonb; publicando boolean:=coalesce(current_setting('offsite.publicacao',true),'')='1'; faltando int; BEGIN
 IF jsonb_typeof(NEW.conteudo)<>'object' OR octet_length(NEW.conteudo::text)>1000000 THEN RAISE EXCEPTION 'Configuração inválida'; END IF;
 IF NEW.conteudo<>'{}' THEN
  IF jsonb_typeof(NEW.conteudo->'perguntas') IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.conteudo->'perguntas')<>9 OR jsonb_array_length(NEW.conteudo->'blocos')<>9 THEN RAISE EXCEPTION 'Mantenha nove etapas'; END IF;
  IF TG_OP='UPDATE' AND OLD.conteudo<>'{}' THEN
   IF publicando THEN
    -- Publicação estruturada: permite incluir e reordenar, nunca remover identificadores (itens removidos ficam arquivados).
    FOREACH k IN ARRAY ARRAY['diretrizes','projetos','andamento','produtos','escolhas'] LOOP
     SELECT count(*) INTO faltando FROM jsonb_array_elements(coalesce(OLD.conteudo->k,'[]')) x WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(NEW.conteudo->k,'[]')) y WHERE y->>'id'=x->>'id');
     IF faltando>0 THEN RAISE EXCEPTION 'Itens não podem ser apagados; arquive-os'; END IF;
     IF (SELECT count(*)<>count(DISTINCT y->>'id') FROM jsonb_array_elements(coalesce(NEW.conteudo->k,'[]')) y) THEN RAISE EXCEPTION 'Identificadores de itens repetidos'; END IF;
    END LOOP;
    SELECT count(*) INTO faltando FROM jsonb_array_elements(OLD.conteudo->'perguntas') b CROSS JOIN LATERAL jsonb_array_elements(b) p WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.conteudo->'perguntas') b2 CROSS JOIN LATERAL jsonb_array_elements(b2) p2 WHERE p2->>'id'=p->>'id');
    IF faltando>0 THEN RAISE EXCEPTION 'Perguntas não podem ser apagadas; arquive-as'; END IF;
    IF (SELECT count(*)<>count(DISTINCT p->>'id') FROM jsonb_array_elements(NEW.conteudo->'perguntas') b CROSS JOIN LATERAL jsonb_array_elements(b) p) THEN RAISE EXCEPTION 'Identificadores de perguntas repetidos'; END IF;
   ELSE
    FOREACH k IN ARRAY ARRAY['diretrizes','projetos','andamento','produtos','escolhas'] LOOP
     SELECT jsonb_agg(x->>'id') INTO ids_old FROM jsonb_array_elements(OLD.conteudo->k) x; SELECT jsonb_agg(x->>'id') INTO ids_new FROM jsonb_array_elements(NEW.conteudo->k) x;
     IF ids_old IS DISTINCT FROM ids_new AND NOT (k='projetos' AND (NEW.conteudo->>'versao') IS DISTINCT FROM (OLD.conteudo->>'versao')) THEN RAISE EXCEPTION 'Preserve identificadores e ordem dos itens (projetos só mudam com nova versão)'; END IF;
    END LOOP;
    SELECT jsonb_agg(p->>'id') INTO ids_old FROM jsonb_array_elements(OLD.conteudo->'perguntas') b CROSS JOIN LATERAL jsonb_array_elements(b) p; SELECT jsonb_agg(p->>'id') INTO ids_new FROM jsonb_array_elements(NEW.conteudo->'perguntas') b CROSS JOIN LATERAL jsonb_array_elements(b) p;
    IF ids_old IS DISTINCT FROM ids_new AND (NEW.conteudo->>'versao') IS NOT DISTINCT FROM (OLD.conteudo->>'versao') THEN RAISE EXCEPTION 'Preserve identificadores das perguntas (troca de perguntas só com nova versão)'; END IF;
   END IF;
  END IF;
 END IF;
 NEW.atualizado_em:=now();
 INSERT INTO public.offsite_historico(ator,acao,antes,depois) VALUES(auth.uid(),CASE WHEN publicando THEN 'publicacao_config' ELSE 'configuracao' END,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,to_jsonb(NEW));
 RETURN NEW; END $function$;

CREATE OR REPLACE FUNCTION public.offsite_config_publicar(_conteudo jsonb, _base timestamptz, _respostas jsonb DEFAULT '[]'::jsonb)
 RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE cfg offsite_config; x jsonb; r offsite_respostas; novo offsite_respostas; BEGIN
 IF NOT offsite_admin() THEN RAISE EXCEPTION 'Somente administradores do Pré-Offsite'; END IF;
 IF jsonb_typeof(_respostas)<>'array' THEN RAISE EXCEPTION 'Migração inválida'; END IF;
 SELECT * INTO cfg FROM offsite_config WHERE id='2027' FOR UPDATE;
 IF cfg.atualizado_em IS DISTINCT FROM _base THEN RAISE EXCEPTION 'A configuração foi alterada por outra pessoa. Recarregue antes de publicar'; END IF;
 FOR x IN SELECT * FROM jsonb_array_elements(_respostas) LOOP
  SELECT * INTO r FROM offsite_respostas WHERE id=(x->>'id')::uuid FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Resposta não encontrada'; END IF;
  IF r.revisao<>(x->>'revisao')::int THEN RAISE EXCEPTION 'Uma resposta mudou durante a publicação. Recarregue e tente de novo'; END IF;
  IF jsonb_typeof(x->'respostas')<>'object' OR octet_length((x->'respostas')::text)>1000000 THEN RAISE EXCEPTION 'Respostas inválidas'; END IF;
  UPDATE offsite_respostas SET respostas=x->'respostas', revisao=revisao+1, atualizado_em=now() WHERE id=r.id RETURNING * INTO novo;
  INSERT INTO offsite_historico(resposta_id,ator,acao,antes,depois) VALUES(r.id,auth.uid(),'migracao_config',to_jsonb(r),to_jsonb(novo));
 END LOOP;
 PERFORM set_config('offsite.publicacao','1',true);
 UPDATE offsite_config SET conteudo=jsonb_set(_conteudo,'{revisao_config}',to_jsonb(coalesce((cfg.conteudo->>'revisao_config')::int,0)+1)) WHERE id='2027' RETURNING * INTO cfg;
 PERFORM set_config('offsite.publicacao','',true);
 DELETE FROM offsite_config_rascunhos WHERE id='2027';
 RETURN cfg.atualizado_em; END $function$;
REVOKE ALL ON FUNCTION public.offsite_config_publicar(jsonb,timestamptz,jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.offsite_config_publicar(jsonb,timestamptz,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.offsite_salvar(_respostas jsonb, _revisao integer, _enviar boolean DEFAULT false)
 RETURNS offsite_respostas LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE r offsite_respostas; c uuid; k text; antigo jsonb; lim int; cfg jsonb; BEGIN c:=offsite_cadeira(); IF c IS NULL THEN RAISE EXCEPTION 'Conta sem cadeira de diretoria vinculada'; END IF; IF jsonb_typeof(_respostas)<>'object' OR octet_length(_respostas::text)>1000000 THEN RAISE EXCEPTION 'Respostas inválidas'; END IF;
 SELECT conteudo INTO cfg FROM offsite_config WHERE id='2027';
 FOREACH k IN ARRAY ARRAY['1.1','1.2','2.1','4.3','6.2'] LOOP
  SELECT greatest(3,coalesce(max((p->>'limite')::int),3)) INTO lim FROM jsonb_array_elements(coalesce(cfg->'perguntas','[]')) b CROSS JOIN LATERAL jsonb_array_elements(b) p WHERE p->>'id'=k AND jsonb_typeof(p->'limite')='number';
  IF _respostas ? k AND (jsonb_typeof(_respostas->k)<>'array' OR jsonb_array_length(_respostas->k)>lim) THEN RAISE EXCEPTION 'Limite de % itens',lim; END IF;
 END LOOP;
 SELECT greatest(2,coalesce(max((p->>'limite')::int),2)) INTO lim FROM jsonb_array_elements(coalesce(cfg->'perguntas','[]')) b CROSS JOIN LATERAL jsonb_array_elements(b) p WHERE p->>'id'='4.1' AND jsonb_typeof(p->'limite')='number';
 IF jsonb_array_length(coalesce(_respostas->'3.selecionadas','[]'))>3 OR jsonb_array_length(coalesce(_respostas->'4.1','[]'))>lim THEN RAISE EXCEPTION 'Seleção excede o limite'; END IF;
 INSERT INTO offsite_respostas(user_id,cadeira_id,nome) SELECT auth.uid(),c,coalesce(p.display_name,'Diretor') FROM profiles p WHERE p.user_id=auth.uid() ON CONFLICT(user_id) DO NOTHING; SELECT * INTO r FROM offsite_respostas WHERE user_id=auth.uid() FOR UPDATE; IF r.id IS NULL THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF; IF r.status='enviado' THEN RAISE EXCEPTION 'Resposta enviada, solicite reabertura'; END IF; IF r.revisao<>_revisao THEN RAISE EXCEPTION 'Resposta alterada em outra sessão. Recarregue antes de editar'; END IF; antigo:=to_jsonb(r); UPDATE offsite_respostas SET cadeira_id=c,respostas=_respostas,revisao=revisao+1,status=CASE WHEN _enviar THEN 'enviado' ELSE 'rascunho' END,enviado_em=CASE WHEN _enviar THEN now() ELSE enviado_em END,atualizado_em=now() WHERE id=r.id RETURNING * INTO r; IF _enviar THEN INSERT INTO offsite_historico(resposta_id,ator,acao,antes,depois) VALUES(r.id,auth.uid(),'enviar',antigo,to_jsonb(r)); END IF; RETURN r; END $function$;