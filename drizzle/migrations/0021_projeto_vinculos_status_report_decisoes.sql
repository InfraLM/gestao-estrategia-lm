ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS cadeira_id uuid REFERENCES public.mt_cadeiras(id),
 ADD COLUMN IF NOT EXISTS cadeira_confirmada_por uuid, ADD COLUMN IF NOT EXISTS cadeira_confirmada_em timestamptz,
 ADD COLUMN IF NOT EXISTS situacao_confirmada_por uuid, ADD COLUMN IF NOT EXISTS situacao_confirmada_em timestamptz;
COMMENT ON COLUMN public.projetos.objetivos IS 'DEPRECATED: histórico somente leitura; usar projeto_vinculos';
COMMENT ON COLUMN public.projetos.krs IS 'DEPRECATED: histórico somente leitura; usar projeto_vinculos';

CREATE OR REPLACE FUNCTION public.proj_eh_ceo(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT _uid IS NOT NULL AND (EXISTS (SELECT 1 FROM mt_cadeiras WHERE nome='CEO' AND diretor_user_id=_uid) OR EXISTS (SELECT 1 FROM mt_usuarios u JOIN mt_cadeiras c ON c.id=u.cadeira_id WHERE u.user_id=_uid AND c.nome='CEO')) $$;
CREATE OR REPLACE FUNCTION public.proj_gov_ou_ceo(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.mt_is_governanca(_uid) OR public.proj_eh_ceo(_uid) $$;
CREATE OR REPLACE FUNCTION public.proj_principal(_uid uuid, _projeto uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT _uid IS NOT NULL AND EXISTS (SELECT 1 FROM projetos p WHERE p.id=_projeto AND p.cadeira_id IS NOT NULL AND (p.cadeira_id=public.mt_cadeira_do_usuario(_uid) OR EXISTS (SELECT 1 FROM mt_cadeiras c WHERE c.id=p.cadeira_id AND c.diretor_user_id=_uid))) $$;

CREATE TABLE public.projeto_cadeiras_apoio (
 projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
 cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (projeto_id, cadeira_id));
GRANT SELECT ON public.projeto_cadeiras_apoio TO authenticated;
GRANT ALL ON public.projeto_cadeiras_apoio TO service_role;
ALTER TABLE public.projeto_cadeiras_apoio ENABLE ROW LEVEL SECURITY;
CREATE POLICY pca_select ON public.projeto_cadeiras_apoio FOR SELECT TO authenticated USING (true);

CREATE TABLE public.projeto_vinculos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
 tipo text NOT NULL CHECK (tipo IN ('bsc_objetivo','bsc_kpi','kr','cesta')),
 ref_id uuid NOT NULL, criado_por uuid, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (projeto_id, tipo, ref_id));
GRANT SELECT, INSERT, DELETE ON public.projeto_vinculos TO authenticated;
GRANT ALL ON public.projeto_vinculos TO service_role;
ALTER TABLE public.projeto_vinculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY pv_select ON public.projeto_vinculos FOR SELECT TO authenticated USING (true);
CREATE POLICY pv_insert ON public.projeto_vinculos FOR INSERT TO authenticated WITH CHECK (public.mt_is_governanca(auth.uid()) OR public.proj_principal(auth.uid(), projeto_id));
CREATE POLICY pv_delete ON public.projeto_vinculos FOR DELETE TO authenticated USING (public.mt_is_governanca(auth.uid()) OR public.proj_principal(auth.uid(), projeto_id));
INSERT INTO public.projeto_vinculos (projeto_id, tipo, ref_id)
 SELECT DISTINCT p.id, 'bsc_objetivo', o.id FROM public.projetos p CROSS JOIN LATERAL unnest(p.objetivos) c JOIN public.mt_objetivos o ON o.codigo = c
 ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.projeto_definir_cadeira(_projetos uuid[], _cadeira uuid, _apoio uuid[] DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Apenas a Governança define a cadeira responsável'; END IF;
 UPDATE projetos SET cadeira_id=_cadeira, cadeira_confirmada_por=CASE WHEN _cadeira IS NULL THEN NULL ELSE auth.uid() END, cadeira_confirmada_em=CASE WHEN _cadeira IS NULL THEN NULL ELSE now() END WHERE id = ANY(_projetos);
 IF _apoio IS NOT NULL THEN
  DELETE FROM projeto_cadeiras_apoio WHERE projeto_id = ANY(_projetos);
  INSERT INTO projeto_cadeiras_apoio(projeto_id, cadeira_id) SELECT p, a FROM unnest(_projetos) p, unnest(_apoio) a WHERE a IS DISTINCT FROM _cadeira ON CONFLICT DO NOTHING;
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.projeto_confirmar_situacao(_projeto uuid, _situacao text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT (public.mt_is_governanca(auth.uid()) OR public.proj_principal(auth.uid(), _projeto)) THEN RAISE EXCEPTION 'Sem permissão para este projeto'; END IF;
 IF _situacao = 'nao_e_meu' THEN
  UPDATE projetos SET cadeira_id=NULL, cadeira_confirmada_por=NULL, cadeira_confirmada_em=NULL WHERE id=_projeto;
 ELSIF _situacao IN ('em_andamento','concluido','suspenso','cancelado') THEN
  UPDATE projetos SET status = (CASE _situacao WHEN 'em_andamento' THEN 'Em Andamento' WHEN 'concluido' THEN 'Concluído' WHEN 'suspenso' THEN 'Pausado' ELSE 'Cancelado' END)::status_execucao_enum,
   situacao_confirmada_por=auth.uid(), situacao_confirmada_em=now() WHERE id=_projeto;
 ELSE RAISE EXCEPTION 'Situação inválida'; END IF;
END $$;

ALTER TABLE public.mt_status_projetos ADD COLUMN IF NOT EXISTS farol_escopo text, ADD COLUMN IF NOT EXISTS farol_custo text,
 ADD COLUMN IF NOT EXISTS farol_cronograma text, ADD COLUMN IF NOT EXISTS comentario text, ADD COLUMN IF NOT EXISTS confirmacao_status text,
 ADD COLUMN IF NOT EXISTS semana_ciclo date, ADD COLUMN IF NOT EXISTS revisao integer NOT NULL DEFAULT 0;

CREATE TABLE public.mt_status_projetos_versoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), status_id uuid NOT NULL REFERENCES public.mt_status_projetos(id) ON DELETE CASCADE,
 revisao integer NOT NULL, dados jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.mt_status_projetos_versoes TO authenticated;
GRANT ALL ON public.mt_status_projetos_versoes TO service_role;
ALTER TABLE public.mt_status_projetos_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY mspv_select ON public.mt_status_projetos_versoes FOR SELECT TO authenticated USING (true);
CREATE OR REPLACE FUNCTION public.mt_status_versionar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 INSERT INTO mt_status_projetos_versoes(status_id, revisao, dados) VALUES (OLD.id, OLD.revisao, to_jsonb(OLD));
 NEW.revisao := OLD.revisao + 1; RETURN NEW;
END $$;
CREATE TRIGGER trg_mt_status_versionar BEFORE UPDATE ON public.mt_status_projetos FOR EACH ROW EXECUTE FUNCTION public.mt_status_versionar();

CREATE OR REPLACE FUNCTION public.status_report_pode_arquivo(_name text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT auth.uid() IS NOT NULL AND (public.proj_gov_ou_ceo(auth.uid())
 OR EXISTS (SELECT 1 FROM projetos p WHERE p.codigo = split_part(_name,'/',1) AND public.proj_principal(auth.uid(), p.id))
 OR EXISTS (SELECT 1 FROM mt_status_projetos s WHERE s.arquivo_path = _name AND s.cadeira_id = public.mt_cadeira_do_usuario(auth.uid()))) $$;
DROP POLICY IF EXISTS status_reports_read ON storage.objects;
DROP POLICY IF EXISTS status_reports_insert ON storage.objects;
CREATE POLICY status_reports_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='status-reports' AND public.status_report_pode_arquivo(name));
CREATE POLICY status_reports_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='status-reports' AND public.status_report_pode_arquivo(name));

CREATE TABLE public.projeto_decisoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
 competencia text NOT NULL, codigo text NOT NULL UNIQUE,
 decisao text NOT NULL CHECK (decisao IN ('manter_aceite','manter_ajustes','suspender','replanejar','encerrar')),
 desfecho text CHECK (desfecho IN ('Concluído','Cancelado')), justificativa text NOT NULL, projecoes text,
 decidido_por uuid NOT NULL, decidido_por_nome text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.projeto_decisoes TO authenticated;
GRANT ALL ON public.projeto_decisoes TO service_role;
ALTER TABLE public.projeto_decisoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY pd_select ON public.projeto_decisoes FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.projeto_registrar_decisao(_projeto uuid, _competencia text, _decisao text, _desfecho text, _justificativa text, _projecoes text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_cod text; v_n int; v_nome text;
BEGIN
 IF NOT public.proj_gov_ou_ceo(auth.uid()) THEN RAISE EXCEPTION 'Apenas Governança e CEO registram decisões'; END IF;
 IF coalesce(btrim(_justificativa),'') = '' THEN RAISE EXCEPTION 'Informe a justificativa'; END IF;
 IF _competencia !~ '^\d{4}-\d{2}$' THEN RAISE EXCEPTION 'Competência inválida'; END IF;
 IF _decisao = 'encerrar' AND _desfecho NOT IN ('Concluído','Cancelado') THEN RAISE EXCEPTION 'Informe se foi Concluído ou Cancelado'; END IF;
 SELECT 'SR-' || replace(_competencia,'-','') || '-' || codigo INTO v_cod FROM projetos WHERE id=_projeto;
 IF v_cod IS NULL THEN RAISE EXCEPTION 'Projeto não encontrado'; END IF;
 SELECT count(*) INTO v_n FROM projeto_decisoes WHERE codigo LIKE v_cod || '%';
 IF v_n > 0 THEN v_cod := v_cod || '-' || (v_n+1); END IF;
 SELECT display_name INTO v_nome FROM profiles WHERE user_id=auth.uid();
 INSERT INTO projeto_decisoes(projeto_id, competencia, codigo, decisao, desfecho, justificativa, projecoes, decidido_por, decidido_por_nome)
 VALUES (_projeto, _competencia, v_cod, _decisao, CASE WHEN _decisao='encerrar' THEN _desfecho END, _justificativa, _projecoes, auth.uid(), v_nome);
 IF _decisao='encerrar' THEN UPDATE projetos SET status=_desfecho::status_execucao_enum WHERE id=_projeto;
 ELSIF _decisao='suspender' THEN UPDATE projetos SET status='Pausado' WHERE id=_projeto; END IF;
 RETURN v_cod;
END $$;

REVOKE EXECUTE ON FUNCTION public.projeto_definir_cadeira(uuid[],uuid,uuid[]), public.projeto_confirmar_situacao(uuid,text), public.projeto_registrar_decisao(uuid,text,text,text,text,text), public.proj_eh_ceo(uuid), public.proj_gov_ou_ceo(uuid), public.proj_principal(uuid,uuid), public.status_report_pode_arquivo(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.projeto_definir_cadeira(uuid[],uuid,uuid[]), public.projeto_confirmar_situacao(uuid,text), public.projeto_registrar_decisao(uuid,text,text,text,text,text), public.proj_eh_ceo(uuid), public.proj_gov_ou_ceo(uuid), public.proj_principal(uuid,uuid), public.status_report_pode_arquivo(text) TO authenticated;