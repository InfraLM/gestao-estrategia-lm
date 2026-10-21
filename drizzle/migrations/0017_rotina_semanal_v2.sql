CREATE TABLE public.mt_rotina_riscos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('risco','impedimento','decisao')),
  descricao text NOT NULL,
  semana_criada date NOT NULL,
  criado_por uuid,
  resolvido_em timestamptz,
  resolvido_por uuid,
  reaberto_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mt_rotina_riscos TO authenticated;
GRANT ALL ON public.mt_rotina_riscos TO service_role;
ALTER TABLE public.mt_rotina_riscos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riscos ler" ON public.mt_rotina_riscos FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'rotina',false));
CREATE POLICY "riscos inserir" ON public.mt_rotina_riscos FOR INSERT TO authenticated WITH CHECK (public.acesso_modulo(auth.uid(),'rotina',true) AND (public.mt_is_governanca(auth.uid()) OR cadeira_id = public.mt_cadeira_do_usuario(auth.uid())));
CREATE POLICY "riscos atualizar" ON public.mt_rotina_riscos FOR UPDATE TO authenticated USING (public.acesso_modulo(auth.uid(),'rotina',true) AND (public.mt_is_governanca(auth.uid()) OR cadeira_id = public.mt_cadeira_do_usuario(auth.uid()))) WITH CHECK (public.acesso_modulo(auth.uid(),'rotina',true) AND (public.mt_is_governanca(auth.uid()) OR cadeira_id = public.mt_cadeira_do_usuario(auth.uid())));

CREATE OR REPLACE FUNCTION public.mt_rotina_riscos_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.descricao IS DISTINCT FROM OLD.descricao OR NEW.tipo IS DISTINCT FROM OLD.tipo OR NEW.cadeira_id IS DISTINCT FROM OLD.cadeira_id OR NEW.semana_criada IS DISTINCT FROM OLD.semana_criada THEN
    RAISE EXCEPTION 'A descrição do risco não pode ser alterada depois de registrada';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_mt_rotina_riscos_guard BEFORE UPDATE ON public.mt_rotina_riscos FOR EACH ROW EXECUTE FUNCTION public.mt_rotina_riscos_guard();

CREATE TABLE public.mt_rotina_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mt_rotina_contatos TO authenticated;
GRANT ALL ON public.mt_rotina_contatos TO service_role;
ALTER TABLE public.mt_rotina_contatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contatos propria cadeira" ON public.mt_rotina_contatos FOR ALL TO authenticated
  USING (public.mt_is_governanca(auth.uid()) OR cadeira_id = public.mt_cadeira_do_usuario(auth.uid()))
  WITH CHECK (public.acesso_modulo(auth.uid(),'rotina',true) AND (public.mt_is_governanca(auth.uid()) OR cadeira_id = public.mt_cadeira_do_usuario(auth.uid())));

ALTER TABLE public.mt_iniciativas ADD COLUMN checkin_semana date, ADD COLUMN checkin_token text;
CREATE UNIQUE INDEX mt_iniciativas_checkin_token_ind ON public.mt_iniciativas (checkin_token, indicador_id) WHERE checkin_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.rotina_retrato(_cadeira uuid, _comp text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN NOT public.acesso_modulo(auth.uid(),'rotina',false) THEN '[]'::jsonb ELSE COALESCE(jsonb_agg(jsonb_build_object(
    'indicador_id', i.id, 'codigo', i.codigo, 'nome', i.nome, 'origem', i.origem, 'peso', i.peso, 'sentido', i.sentido, 'unidade', i.unidade,
    'meta_mes', (SELECT m.meta_mes FROM mt_metas_mensais m WHERE m.indicador_id = i.id AND m.competencia = _comp LIMIT 1),
    'realizado', (SELECT l.valor FROM mt_lancamentos l WHERE l.indicador_id = i.id AND l.competencia = _comp AND NOT l.sem_medicao ORDER BY l.revisao DESC LIMIT 1)
  ) ORDER BY i.origem, i.codigo), '[]'::jsonb) END
  FROM mt_indicadores i
  WHERE i.cadeira_id = _cadeira AND i.status = 'ativo' AND i.origem IN ('bsc','okr','cesta') AND i.parent_id IS NULL;
$$;
REVOKE EXECUTE ON FUNCTION public.rotina_retrato(uuid,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rotina_retrato(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rotina_criar_iniciativa(_cadeira uuid, _semana date, _token text, _indicador uuid, _titulo text, _comentario text, _prazo date, _resp_nome text, _status text, _reaproveitar uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_ind mt_indicadores%ROWTYPE;
BEGIN
  IF NOT public.acesso_modulo(auth.uid(),'rotina',true) OR NOT (public.mt_is_governanca(auth.uid()) OR _cadeira = public.mt_cadeira_do_usuario(auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão para esta cadeira';
  END IF;
  IF _status NOT IN ('a_iniciar','em_andamento','concluida','cancelada') THEN RAISE EXCEPTION 'Status inválido'; END IF;
  SELECT * INTO v_ind FROM mt_indicadores WHERE id = _indicador AND cadeira_id = _cadeira;
  IF NOT FOUND THEN RAISE EXCEPTION 'Indicador não pertence à cadeira'; END IF;
  IF _reaproveitar IS NOT NULL THEN
    UPDATE mt_iniciativas SET comentario = _comentario, prazo = COALESCE(_prazo, prazo), responsavel_nome = COALESCE(_resp_nome, responsavel_nome)
      WHERE id = _reaproveitar AND cadeira_id = _cadeira AND indicador_id = _indicador RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Iniciativa para reaproveitar não encontrada'; END IF;
    RETURN v_id;
  END IF;
  SELECT id INTO v_id FROM mt_iniciativas WHERE checkin_token = _token AND indicador_id = _indicador;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  INSERT INTO mt_iniciativas (titulo, indicador_id, okr_id, objetivo_id, cadeira_id, responsavel_nome, prazo, status, comentario, created_by, checkin_semana, checkin_token)
  VALUES (_titulo, _indicador, v_ind.okr_id, v_ind.objetivo_id, _cadeira, _resp_nome, _prazo, _status, _comentario, auth.uid(), _semana, _token)
  ON CONFLICT (checkin_token, indicador_id) WHERE checkin_token IS NOT NULL DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN SELECT id INTO v_id FROM mt_iniciativas WHERE checkin_token = _token AND indicador_id = _indicador; END IF;
  RETURN v_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.rotina_criar_iniciativa(uuid,date,text,uuid,text,text,date,text,text,uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rotina_criar_iniciativa(uuid,date,text,uuid,text,text,date,text,text,uuid) TO authenticated;