ALTER TABLE public.mt_indicadores ADD COLUMN nivel text;

CREATE TABLE public.mt_pesos_vigencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id uuid NOT NULL REFERENCES public.mt_indicadores(id) ON DELETE CASCADE,
  competencia_inicio text NOT NULL,
  peso numeric NOT NULL CHECK (peso >= 0),
  alterado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (indicador_id, competencia_inicio)
);
GRANT SELECT, INSERT, UPDATE ON public.mt_pesos_vigencia TO authenticated;
GRANT ALL ON public.mt_pesos_vigencia TO service_role;
ALTER TABLE public.mt_pesos_vigencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pesos ler" ON public.mt_pesos_vigencia FOR SELECT TO authenticated
  USING (public.acesso_modulo(auth.uid(),'metas',false) OR public.acesso_modulo(auth.uid(),'rotina',false));
CREATE POLICY "pesos gov inserir" ON public.mt_pesos_vigencia FOR INSERT TO authenticated WITH CHECK (public.mt_is_governanca(auth.uid()));
CREATE POLICY "pesos gov atualizar" ON public.mt_pesos_vigencia FOR UPDATE TO authenticated USING (public.mt_is_governanca(auth.uid())) WITH CHECK (public.mt_is_governanca(auth.uid()));

CREATE OR REPLACE FUNCTION public.mt_pesos_vigencia_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM mt_competencias WHERE competencia >= NEW.competencia_inicio AND estado = 'fechado') THEN
    RAISE EXCEPTION 'Há competência fechada a partir de %; reabra antes de mudar o peso', NEW.competencia_inicio;
  END IF;
  INSERT INTO mt_auditoria (tabela, registro_id, competencia, campo, valor_anterior, valor_novo, alterado_por)
  VALUES ('mt_pesos_vigencia', NEW.indicador_id::text, NEW.competencia_inicio, 'peso',
          CASE WHEN TG_OP = 'UPDATE' THEN OLD.peso::text END, NEW.peso::text, auth.uid());
  RETURN NEW;
END $$;
CREATE TRIGGER trg_mt_pesos_vigencia BEFORE INSERT OR UPDATE ON public.mt_pesos_vigencia FOR EACH ROW EXECUTE FUNCTION public.mt_pesos_vigencia_guard();

CREATE OR REPLACE FUNCTION public.rotina_retrato(_cadeira uuid, _comp text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN NOT public.acesso_modulo(auth.uid(),'rotina',false) THEN '[]'::jsonb ELSE COALESCE(jsonb_agg(jsonb_build_object(
    'indicador_id', i.id, 'codigo', i.codigo, 'nome', i.nome, 'origem', i.origem, 'peso', i.peso, 'sentido', i.sentido, 'unidade', i.unidade,
    'nivel', i.nivel, 'meta_semestre', i.meta_semestre, 'meta_texto', i.meta_texto,
    'meta_mes', (SELECT m.meta_mes FROM mt_metas_mensais m WHERE m.indicador_id = i.id AND m.competencia = _comp LIMIT 1),
    'realizado', (SELECT l.valor FROM mt_lancamentos l WHERE l.indicador_id = i.id AND l.competencia = _comp AND NOT l.sem_medicao ORDER BY l.revisao DESC LIMIT 1)
  ) ORDER BY i.origem, i.codigo), '[]'::jsonb) END
  FROM mt_indicadores i
  WHERE i.cadeira_id = _cadeira AND i.status = 'ativo' AND i.origem IN ('bsc','okr','cesta') AND i.parent_id IS NULL
    AND (i.origem <> 'bsc' OR COALESCE(i.nivel, 'Tático') IN ('Estratégico','Tático'));
$$;