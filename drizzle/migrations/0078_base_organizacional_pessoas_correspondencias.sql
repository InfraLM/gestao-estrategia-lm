ALTER TABLE public.mt_cadeiras ADD COLUMN IF NOT EXISTS codigo_org text, ADD COLUMN IF NOT EXISTS sigla_org text, ADD COLUMN IF NOT EXISTS titular_pessoa_id uuid;
ALTER TABLE public.org_organograma_cargos ADD COLUMN IF NOT EXISTS nivel_org text, ADD COLUMN IF NOT EXISTS pessoa_id uuid, ADD COLUMN IF NOT EXISTS revisao_org boolean NOT NULL DEFAULT true;
CREATE TABLE public.org_pessoas (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, aliases text[] NOT NULL DEFAULT '{}', email text, cargo_id uuid REFERENCES public.org_organograma_cargos(id), cadeira_id uuid REFERENCES public.mt_cadeiras(id), gestor_id uuid REFERENCES public.org_pessoas(id), user_id uuid, ativo boolean NOT NULL DEFAULT true, revisao_pendente boolean NOT NULL DEFAULT true, fonte text, vigencia_inicio date NOT NULL DEFAULT CURRENT_DATE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.org_pessoas TO authenticated; GRANT ALL ON public.org_pessoas TO service_role;
ALTER TABLE public.org_pessoas ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_pessoas_admin ON public.org_pessoas FOR SELECT TO authenticated USING(public.proj_gov_ou_ceo(auth.uid()));
CREATE UNIQUE INDEX org_pessoas_user_unico ON public.org_pessoas(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX org_pessoas_fonte_unica ON public.org_pessoas(fonte) WHERE fonte IS NOT NULL;
CREATE TABLE public.org_vigencias (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pessoa_id uuid NOT NULL REFERENCES public.org_pessoas(id), cargo_id uuid REFERENCES public.org_organograma_cargos(id), cadeira_id uuid REFERENCES public.mt_cadeiras(id), gestor_id uuid REFERENCES public.org_pessoas(id), inicio date NOT NULL, fim date, criado_por uuid, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.org_vigencias TO authenticated; GRANT ALL ON public.org_vigencias TO service_role;
ALTER TABLE public.org_vigencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_vigencias_admin ON public.org_vigencias FOR SELECT TO authenticated USING(public.proj_gov_ou_ceo(auth.uid()));
CREATE TABLE public.org_auditoria (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entidade text NOT NULL, registro_id text NOT NULL, antes jsonb, depois jsonb, autor uuid, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.org_auditoria TO authenticated; GRANT ALL ON public.org_auditoria TO service_role;
ALTER TABLE public.org_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_auditoria_admin ON public.org_auditoria FOR SELECT TO authenticated USING(public.proj_gov_ou_ceo(auth.uid()));
CREATE TABLE public.org_correspondencias (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fonte text NOT NULL, registro_id text NOT NULL, campo text NOT NULL, texto_original text NOT NULL, pessoa_id uuid REFERENCES public.org_pessoas(id), cadeira_id uuid REFERENCES public.mt_cadeiras(id), confianca numeric NOT NULL DEFAULT 0, motivo text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'sugerido', revisado_por uuid, revisado_em timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(fonte,registro_id,campo));
GRANT SELECT ON public.org_correspondencias TO authenticated; GRANT ALL ON public.org_correspondencias TO service_role;
ALTER TABLE public.org_correspondencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_correspondencias_admin ON public.org_correspondencias FOR SELECT TO authenticated USING(public.proj_gov_ou_ceo(auth.uid()));
ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS diretor_pessoa_id uuid REFERENCES public.org_pessoas(id), ADD COLUMN IF NOT EXISTS gerente_pessoa_id uuid REFERENCES public.org_pessoas(id);
ALTER TABLE public.mt_iniciativas ADD COLUMN IF NOT EXISTS responsavel_pessoa_id uuid REFERENCES public.org_pessoas(id);
ALTER TABLE public.rotina_acoes_entrega ADD COLUMN IF NOT EXISTS responsavel_pessoa_id uuid REFERENCES public.org_pessoas(id);
ALTER TABLE public.cronograma_itens ADD COLUMN IF NOT EXISTS responsavel_pessoa_id uuid REFERENCES public.org_pessoas(id);
ALTER TABLE public.eap_itens ADD COLUMN IF NOT EXISTS responsavel_pessoa_id uuid REFERENCES public.org_pessoas(id);
CREATE OR REPLACE FUNCTION public.org_normalizar(_texto text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT regexp_replace(lower(translate(coalesce(_texto,''),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc')),'[^a-z0-9]+',' ','g') $$;
CREATE OR REPLACE FUNCTION public.org_diretorio() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE permitido boolean;
BEGIN
 permitido:=auth.uid() IS NOT NULL AND (public.proj_gov_ou_ceo(auth.uid()) OR EXISTS(SELECT 1 FROM public.mt_usuarios WHERE user_id=auth.uid() AND cadeira_id IS NOT NULL) OR public.acesso_modulo(auth.uid(),'estrutura',false) OR public.acesso_modulo(auth.uid(),'pmo',false) OR public.acesso_modulo(auth.uid(),'metas',false) OR public.acesso_modulo(auth.uid(),'rotina',false) OR public.acesso_modulo(auth.uid(),'cesta',false) OR public.acesso_modulo(auth.uid(),'okrs',false));
 IF NOT coalesce(permitido,false) THEN RAISE EXCEPTION 'Sem acesso ao diretório organizacional'; END IF;
 RETURN jsonb_build_object('pode_editar',public.proj_gov_ou_ceo(auth.uid()),'pessoas',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',nome,'aliases',aliases,'cargo_id',cargo_id,'cadeira_id',cadeira_id,'user_id',user_id,'ativo',ativo,'revisao_pendente',revisao_pendente)) FROM public.org_pessoas),'[]'::jsonb),'cadeiras',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',nome,'codigo',codigo_org,'sigla',sigla_org,'ativo',ativo,'titular_pessoa_id',titular_pessoa_id)) FROM public.mt_cadeiras),'[]'::jsonb),'cargos',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',nome,'nivel',coalesce(nivel_org,nivel),'parent_id',parent_id,'cadeira_id',mt_cadeira_id,'pessoa_id',pessoa_id,'ativo',ativo,'revisao_pendente',revisao_org)) FROM public.org_organograma_cargos),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.org_diretorio() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_diretorio() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.org_pessoa_salvar(_id uuid,_dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE anterior public.org_pessoas; novo public.org_pessoas; pid uuid:=coalesce(_id,gen_random_uuid()); gestor uuid:=nullif(_dados->>'gestor_id','')::uuid; inicio date:=coalesce(nullif(_dados->>'vigencia_inicio','')::date,CURRENT_DATE); ciclos boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT public.proj_gov_ou_ceo(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança/CEO'; END IF;
 IF nullif(btrim(_dados->>'nome'),'') IS NULL THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
 IF gestor=pid THEN RAISE EXCEPTION 'Gestor não pode ser a própria pessoa'; END IF;
 WITH RECURSIVE cadeia AS (SELECT id,gestor_id FROM public.org_pessoas WHERE id=gestor UNION SELECT p.id,p.gestor_id FROM public.org_pessoas p JOIN cadeia c ON p.id=c.gestor_id) SELECT EXISTS(SELECT 1 FROM cadeia WHERE id=pid) INTO ciclos;
 IF ciclos THEN RAISE EXCEPTION 'Relação de gestor cria ciclo'; END IF;
 SELECT * INTO anterior FROM public.org_pessoas WHERE id=pid FOR UPDATE;
 IF anterior.id IS NOT NULL AND inicio<anterior.vigencia_inicio THEN RAISE EXCEPTION 'Vigência anterior à vigente'; END IF;
 INSERT INTO public.org_pessoas(id,nome,aliases,email,cargo_id,cadeira_id,gestor_id,user_id,ativo,revisao_pendente,vigencia_inicio) VALUES(pid,btrim(_dados->>'nome'),ARRAY(SELECT jsonb_array_elements_text(coalesce(_dados->'aliases','[]'::jsonb))),nullif(btrim(_dados->>'email'),''),nullif(_dados->>'cargo_id','')::uuid,nullif(_dados->>'cadeira_id','')::uuid,gestor,nullif(_dados->>'user_id','')::uuid,coalesce((_dados->>'ativo')::boolean,true),coalesce((_dados->>'revisao_pendente')::boolean,true),inicio) ON CONFLICT(id) DO UPDATE SET nome=excluded.nome,aliases=excluded.aliases,email=excluded.email,cargo_id=excluded.cargo_id,cadeira_id=excluded.cadeira_id,gestor_id=excluded.gestor_id,user_id=excluded.user_id,ativo=excluded.ativo,revisao_pendente=excluded.revisao_pendente,vigencia_inicio=excluded.vigencia_inicio,updated_at=now() RETURNING * INTO novo;
 IF anterior.id IS NULL OR (anterior.cargo_id,anterior.cadeira_id,anterior.gestor_id) IS DISTINCT FROM (novo.cargo_id,novo.cadeira_id,novo.gestor_id) THEN
 UPDATE public.org_vigencias SET fim=inicio WHERE pessoa_id=pid AND fim IS NULL;
 INSERT INTO public.org_vigencias(pessoa_id,cargo_id,cadeira_id,gestor_id,inicio,criado_por) VALUES(pid,novo.cargo_id,novo.cadeira_id,novo.gestor_id,inicio,auth.uid());
 END IF;
 INSERT INTO public.org_auditoria(entidade,registro_id,antes,depois,autor) VALUES('pessoa',pid::text,to_jsonb(anterior),to_jsonb(novo),auth.uid()); RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.org_pessoa_salvar(uuid,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_pessoa_salvar(uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.org_estrutura_salvar(_tipo text,_id uuid,_dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE antes jsonb; depois jsonb; pid uuid:=coalesce(_id,gen_random_uuid()); pai uuid:=nullif(_dados->>'parent_id','')::uuid; ciclo boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT public.proj_gov_ou_ceo(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança/CEO'; END IF;
 IF nullif(btrim(_dados->>'nome'),'') IS NULL THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
 IF _tipo='cadeira' THEN
 SELECT to_jsonb(t) INTO antes FROM public.mt_cadeiras t WHERE id=pid FOR UPDATE;
 INSERT INTO public.mt_cadeiras(id,nome,codigo_org,sigla_org,titular_pessoa_id,ativo) VALUES(pid,btrim(_dados->>'nome'),nullif(_dados->>'codigo',''),nullif(_dados->>'sigla',''),nullif(_dados->>'titular_pessoa_id','')::uuid,coalesce((_dados->>'ativo')::boolean,true)) ON CONFLICT(id) DO UPDATE SET nome=excluded.nome,codigo_org=excluded.codigo_org,sigla_org=excluded.sigla_org,titular_pessoa_id=excluded.titular_pessoa_id,ativo=excluded.ativo;
 SELECT to_jsonb(t) INTO depois FROM public.mt_cadeiras t WHERE id=pid;
 ELSIF _tipo='cargo' THEN
 IF _dados->>'nivel' NOT IN ('diretor','head','gerente','coordenador','analista','outro') THEN RAISE EXCEPTION 'Nível inválido'; END IF;
 WITH RECURSIVE cadeia AS (SELECT id,parent_id FROM public.org_organograma_cargos WHERE id=pai UNION SELECT c.id,c.parent_id FROM public.org_organograma_cargos c JOIN cadeia p ON c.id=p.parent_id) SELECT EXISTS(SELECT 1 FROM cadeia WHERE id=pid) INTO ciclo;
 IF pai=pid OR ciclo THEN RAISE EXCEPTION 'Cargo superior cria ciclo'; END IF;
 SELECT to_jsonb(t) INTO antes FROM public.org_organograma_cargos t WHERE id=pid FOR UPDATE;
 INSERT INTO public.org_organograma_cargos(id,nome,nivel_org,parent_id,mt_cadeira_id,ativo,revisao_org) VALUES(pid,btrim(_dados->>'nome'),_dados->>'nivel',pai,nullif(_dados->>'cadeira_id','')::uuid,coalesce((_dados->>'ativo')::boolean,true),coalesce((_dados->>'revisao_pendente')::boolean,true)) ON CONFLICT(id) DO UPDATE SET nome=excluded.nome,nivel_org=excluded.nivel_org,parent_id=excluded.parent_id,mt_cadeira_id=excluded.mt_cadeira_id,ativo=excluded.ativo,revisao_org=excluded.revisao_org;
 SELECT to_jsonb(t) INTO depois FROM public.org_organograma_cargos t WHERE id=pid;
 ELSE RAISE EXCEPTION 'Tipo inválido'; END IF;
 INSERT INTO public.org_auditoria(entidade,registro_id,antes,depois,autor) VALUES(_tipo,pid::text,antes,depois,auth.uid()); RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.org_estrutura_salvar(text,uuid,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_estrutura_salvar(text,uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.org_correspondencia_revisar(_ids uuid[],_acao text,_pessoa uuid DEFAULT NULL,_cadeira uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item public.org_correspondencias; antes jsonb; coluna text; tabela text; n integer:=0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.proj_gov_ou_ceo(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança/CEO'; END IF;
 IF _acao NOT IN ('aprovar','rejeitar','candidato') OR coalesce(cardinality(_ids),0)=0 OR cardinality(_ids)>500 THEN RAISE EXCEPTION 'Seleção/ação inválida'; END IF;
 FOR item IN SELECT * FROM public.org_correspondencias WHERE id=ANY(_ids) ORDER BY id FOR UPDATE LOOP
 antes:=to_jsonb(item);
 IF _acao='candidato' THEN item.pessoa_id:=_pessoa; item.cadeira_id:=_cadeira; item.status:='sugerido'; item.motivo:='Candidato escolhido manualmente';
 ELSIF _acao='rejeitar' THEN item.status:='rejeitado';
 ELSE
 item.pessoa_id:=coalesce(_pessoa,item.pessoa_id); item.cadeira_id:=coalesce(_cadeira,item.cadeira_id);
 IF item.pessoa_id IS NULL AND item.cadeira_id IS NULL THEN RAISE EXCEPTION 'Correspondência sem candidato'; END IF;
 IF item.pessoa_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.org_pessoas WHERE id=item.pessoa_id AND ativo) THEN RAISE EXCEPTION 'Pessoa inativa ou inexistente'; END IF;
 item.status:='aprovado';
 tabela:=NULL;coluna:=NULL;
 IF item.fonte='projetos' AND item.campo IN ('diretor','gerente') THEN tabela:='projetos';coluna:=item.campo||'_pessoa_id';
 ELSIF item.fonte IN ('mt_iniciativas','rotina_acoes_entrega','cronograma_itens','eap_itens') AND item.campo IN ('responsavel','responsavel_nome') THEN tabela:=item.fonte;coluna:='responsavel_pessoa_id';
 ELSIF item.fonte='org_organograma_cargos' AND item.campo='ocupante_nome' THEN tabela:=item.fonte;coluna:='pessoa_id'; END IF;
 IF tabela IS NOT NULL AND item.pessoa_id IS NOT NULL THEN EXECUTE format('UPDATE public.%I SET %I=$1 WHERE id::text=$2',tabela,coluna) USING item.pessoa_id,item.registro_id; END IF;
 END IF;
 UPDATE public.org_correspondencias SET pessoa_id=item.pessoa_id,cadeira_id=item.cadeira_id,status=item.status,motivo=item.motivo,revisado_por=auth.uid(),revisado_em=now() WHERE id=item.id;
 INSERT INTO public.org_auditoria(entidade,registro_id,antes,depois,autor) VALUES('correspondencia',item.id::text,antes,to_jsonb(item),auth.uid());n:=n+1;
 END LOOP;RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.org_correspondencia_revisar(uuid[],text,uuid,uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_correspondencia_revisar(uuid[],text,uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.org_acao_salvar(_id uuid,_cadeira uuid,_ciclo date,_dados jsonb) RETURNS public.rotina_acoes_entrega LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE item public.rotina_acoes_entrega; pessoa uuid:=nullif(_dados->>'responsavel_pessoa_id','')::uuid;
BEGIN
 SELECT * INTO item FROM public.rotina_acao_salvar(_id,_cadeira,_ciclo,_dados);
 UPDATE public.rotina_acoes_entrega SET responsavel_pessoa_id=pessoa WHERE id=item.id RETURNING * INTO item;
 RETURN item;
END $$;
REVOKE ALL ON FUNCTION public.org_acao_salvar(uuid,uuid,date,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.org_acao_salvar(uuid,uuid,date,jsonb) TO authenticated;
COMMENT ON COLUMN public.projetos.diretor IS 'Legacy source text retained; approved person reference is diretor_pessoa_id. Not an access grant.';
COMMENT ON COLUMN public.org_organograma_cargos.ocupante_nome IS 'Legacy source text retained; approved person reference is pessoa_id.';