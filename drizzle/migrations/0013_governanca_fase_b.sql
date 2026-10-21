CREATE TABLE public.gov_responsaveis_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_origem text NOT NULL,
  nome_normalizado text NOT NULL UNIQUE,
  mt_cadeira_id uuid NULL REFERENCES public.mt_cadeiras(id),
  situacao text NOT NULL DEFAULT 'sem_cadeira' CHECK (situacao IN ('mapeado','sem_cadeira','coletivo','ignorar')),
  observacao text,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.gov_responsaveis_map.mt_cadeira_id IS 'DEPRECATED: sempre nulo; o vínculo fica em gov_responsaveis_map_cadeiras';
CREATE TABLE public.gov_responsaveis_map_cadeiras (
  map_id uuid NOT NULL REFERENCES public.gov_responsaveis_map(id) ON DELETE CASCADE,
  mt_cadeira_id uuid NOT NULL REFERENCES public.mt_cadeiras(id),
  PRIMARY KEY (map_id, mt_cadeira_id)
);
CREATE TABLE public.gov_acoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_id uuid NOT NULL UNIQUE,
  titulo text NOT NULL,
  descricao text, responsavel_origem text,
  responsavel_normalizado text,
  prazo date, status text, prioridade text, precisa_escalar boolean, concluida_em date,
  comite_codigo text, comite_nome text, reuniao_origem_id uuid, reuniao_titulo text, reuniao_data timestamptz,
  origem_created_at timestamptz, origem_updated_at timestamptz,
  sincronizado_em timestamptz DEFAULT now()
);
CREATE INDEX gov_acoes_resp_norm ON public.gov_acoes(responsavel_normalizado);
CREATE TABLE public.gov_deliberacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_origem_id uuid NOT NULL, indice int NOT NULL,
  titulo text, pauta text, racional text, comite_codigo text, comite_nome text,
  reuniao_titulo text, reuniao_data timestamptz, reuniao_updated_at timestamptz,
  sincronizado_em timestamptz DEFAULT now(),
  UNIQUE (reuniao_origem_id, indice)
);
CREATE TABLE public.gov_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iniciado_em timestamptz DEFAULT now(), concluido_em timestamptz, iniciado_por uuid,
  ok boolean, status_http int, acoes_recebidas int, acoes_inseridas int, acoes_atualizadas int,
  deliberacoes_recebidas int, deliberacoes_excluidas int, nomes_novos int, erro text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gov_responsaveis_map, public.gov_responsaveis_map_cadeiras TO authenticated;
GRANT SELECT ON public.gov_acoes, public.gov_deliberacoes, public.gov_sync_log TO authenticated;
GRANT ALL ON public.gov_responsaveis_map, public.gov_responsaveis_map_cadeiras, public.gov_acoes, public.gov_deliberacoes, public.gov_sync_log TO service_role;

ALTER TABLE public.gov_responsaveis_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_responsaveis_map_cadeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_deliberacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_sync_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.gov_is_admin(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND (public.has_role(_uid,'super_admin') OR public.has_role(_uid,'admin'))
$$;
CREATE OR REPLACE FUNCTION public.gov_diretor_da_acao(_uid uuid, _nome_norm text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND _nome_norm IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.gov_responsaveis_map m
    JOIN public.gov_responsaveis_map_cadeiras mc ON mc.map_id = m.id
    JOIN public.mt_cadeiras c ON c.id = mc.mt_cadeira_id
    WHERE m.nome_normalizado = _nome_norm AND m.situacao = 'mapeado' AND c.diretor_user_id = _uid)
$$;
REVOKE EXECUTE ON FUNCTION public.gov_is_admin(uuid), public.gov_diretor_da_acao(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gov_is_admin(uuid), public.gov_diretor_da_acao(uuid, text) TO authenticated, service_role;

CREATE POLICY gov_map_admin ON public.gov_responsaveis_map FOR ALL TO authenticated
  USING (public.gov_is_admin(auth.uid())) WITH CHECK (public.gov_is_admin(auth.uid()));
CREATE POLICY gov_map_cad_admin ON public.gov_responsaveis_map_cadeiras FOR ALL TO authenticated
  USING (public.gov_is_admin(auth.uid())) WITH CHECK (public.gov_is_admin(auth.uid()));
CREATE POLICY gov_acoes_ler ON public.gov_acoes FOR SELECT TO authenticated
  USING (public.gov_is_admin(auth.uid()) OR public.gov_diretor_da_acao(auth.uid(), responsavel_normalizado));
CREATE POLICY gov_delib_ler ON public.gov_deliberacoes FOR SELECT TO authenticated
  USING (public.gov_is_admin(auth.uid()));
CREATE POLICY gov_log_ler ON public.gov_sync_log FOR SELECT TO authenticated
  USING (public.gov_is_admin(auth.uid()));

CREATE TRIGGER gov_map_updated BEFORE UPDATE ON public.gov_responsaveis_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();