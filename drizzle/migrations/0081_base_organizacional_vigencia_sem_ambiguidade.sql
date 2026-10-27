CREATE OR REPLACE FUNCTION public.org_pessoa_salvar(_id uuid,_dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE anterior public.org_pessoas; novo public.org_pessoas; pid uuid:=coalesce(_id,gen_random_uuid()); gestor uuid:=nullif(_dados->>'gestor_id','')::uuid; data_inicio date:=coalesce(nullif(_dados->>'vigencia_inicio','')::date,CURRENT_DATE); ciclos boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.proj_gov_ou_ceo(auth.uid()),false) THEN RAISE EXCEPTION 'Somente Governança/CEO'; END IF;
 IF nullif(btrim(_dados->>'nome'),'') IS NULL THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
 IF gestor=pid THEN RAISE EXCEPTION 'Gestor não pode ser a própria pessoa'; END IF;
 WITH RECURSIVE cadeia AS (SELECT id,gestor_id FROM public.org_pessoas WHERE id=gestor UNION SELECT p.id,p.gestor_id FROM public.org_pessoas p JOIN cadeia c ON p.id=c.gestor_id) SELECT EXISTS(SELECT 1 FROM cadeia WHERE id=pid) INTO ciclos;
 IF ciclos THEN RAISE EXCEPTION 'Relação de gestor cria ciclo'; END IF;
 SELECT * INTO anterior FROM public.org_pessoas WHERE id=pid FOR UPDATE;
 IF anterior.id IS NOT NULL AND data_inicio<anterior.vigencia_inicio THEN RAISE EXCEPTION 'Vigência anterior à vigente'; END IF;
 INSERT INTO public.org_pessoas(id,nome,aliases,email,cargo_id,cadeira_id,gestor_id,user_id,ativo,revisao_pendente,vigencia_inicio) VALUES(pid,btrim(_dados->>'nome'),ARRAY(SELECT btrim(jsonb_array_elements_text(coalesce(_dados->'aliases','[]'::jsonb)))),nullif(btrim(_dados->>'email'),''),nullif(_dados->>'cargo_id','')::uuid,nullif(_dados->>'cadeira_id','')::uuid,gestor,nullif(_dados->>'user_id','')::uuid,coalesce((_dados->>'ativo')::boolean,true),coalesce((_dados->>'revisao_pendente')::boolean,true),data_inicio) ON CONFLICT(id) DO UPDATE SET nome=excluded.nome,aliases=excluded.aliases,email=excluded.email,cargo_id=excluded.cargo_id,cadeira_id=excluded.cadeira_id,gestor_id=excluded.gestor_id,user_id=excluded.user_id,ativo=excluded.ativo,revisao_pendente=excluded.revisao_pendente,vigencia_inicio=excluded.vigencia_inicio,updated_at=now() RETURNING * INTO novo;
 IF anterior.id IS NULL OR (anterior.cargo_id,anterior.cadeira_id,anterior.gestor_id) IS DISTINCT FROM (novo.cargo_id,novo.cadeira_id,novo.gestor_id) THEN
 UPDATE public.org_vigencias SET fim=data_inicio WHERE pessoa_id=pid AND fim IS NULL;
 INSERT INTO public.org_vigencias(pessoa_id,cargo_id,cadeira_id,gestor_id,inicio,criado_por) VALUES(pid,novo.cargo_id,novo.cadeira_id,novo.gestor_id,data_inicio,auth.uid());
 END IF;
 INSERT INTO public.org_auditoria(entidade,registro_id,antes,depois,autor) VALUES('pessoa',pid::text,to_jsonb(anterior),to_jsonb(novo),auth.uid()); RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.org_pessoa_salvar(uuid,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_pessoa_salvar(uuid,jsonb) TO authenticated;