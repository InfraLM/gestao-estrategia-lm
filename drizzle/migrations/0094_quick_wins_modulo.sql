CREATE TABLE public.qw_lideres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text NOT NULL UNIQUE,
  nome text NOT NULL,
  cargo text NOT NULL CHECK (cargo IN ('coordenador','supervisor','gerente')),
  cadeira_id uuid REFERENCES public.org_cadeiras(id),
  diretor_user_id uuid,
  ativo boolean NOT NULL DEFAULT true,
  revisao_pendente boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qw_lideres_email_corporativo CHECK (email = lower(trim(email)) AND email LIKE '%@liberdademedicaedu.com.br')
);
CREATE TABLE public.qw_ciclos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL UNIQUE,
  data_abertura date,
  data_fechamento date,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aberto','fechado','arquivado')),
  limite_investimento numeric NOT NULL DEFAULT 20000 CHECK (limite_investimento >= 0),
  prazo_max_dias integer NOT NULL DEFAULT 90 CHECK (prazo_max_dias > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX qw_ciclos_um_aberto ON public.qw_ciclos ((true)) WHERE status = 'aberto';
CREATE TABLE public.qw_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.qw_ciclos(id),
  lider_id uuid NOT NULL REFERENCES public.qw_lideres(id),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviado')),
  enviado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ciclo_id, lider_id)
);
CREATE TABLE public.qw_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id uuid NOT NULL REFERENCES public.qw_envios(id),
  ordem integer NOT NULL CHECK (ordem BETWEEN 1 AND 10),
  titulo text NOT NULL DEFAULT '' CHECK (char_length(titulo) <= 80),
  observacao text NOT NULL DEFAULT '',
  acao_proposta text NOT NULL DEFAULT '',
  indicador text NOT NULL DEFAULT '',
  valor_atual text,
  valor_alvo text NOT NULL DEFAULT '',
  objetivo_id uuid REFERENCES public.mt_objetivos(id),
  faixa_investimento text NOT NULL DEFAULT 'sem_custo' CHECK (faixa_investimento IN ('sem_custo','ate_5k','5k_20k','acima_20k')),
  aprovacao_necessaria text NOT NULL DEFAULT 'proprio_lider' CHECK (aprovacao_necessaria IN ('proprio_lider','diretor','comite_ceo')),
  prazo_resultado text NOT NULL DEFAULT 'ate_30' CHECK (prazo_resultado IN ('ate_30','31_60','61_90','acima_90')),
  mudanca_maior text NOT NULL DEFAULT '',
  responsavel_execucao text NOT NULL DEFAULT '',
  classificacao text NOT NULL DEFAULT 'quick_win' CHECK (classificacao IN ('quick_win','iniciativa_maior')),
  status_triagem text NOT NULL DEFAULT 'pendente' CHECK (status_triagem IN ('pendente','aprovado','ajustar','devolvido','convertido_iniciativa')),
  comentario_diretor text,
  triado_por uuid,
  triado_em timestamptz,
  status_execucao text NOT NULL DEFAULT 'nao_iniciado' CHECK (status_execucao IN ('nao_iniciado','em_execucao','concluido','cancelado')),
  resultado_medido text,
  concluido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX qw_itens_envio ON public.qw_itens(envio_id);
CREATE TABLE public.qw_avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('envio_diretor','ajustar_lider','devolver_lider')),
  destinatario_user_id uuid,
  destinatario_email text,
  envio_id uuid REFERENCES public.qw_envios(id),
  item_id uuid REFERENCES public.qw_itens(id),
  status text NOT NULL DEFAULT 'aguardando_remetente' CHECK (status IN ('aguardando_remetente','enviado','falhou','cancelado')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  enviado_em timestamptz
);

GRANT SELECT ON public.qw_lideres, public.qw_ciclos, public.qw_envios, public.qw_itens, public.qw_avisos TO authenticated;
GRANT ALL ON public.qw_lideres, public.qw_ciclos, public.qw_envios, public.qw_itens, public.qw_avisos TO service_role;

CREATE OR REPLACE FUNCTION public.qw_gov(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _uid IS NOT NULL AND (public.mt_is_governanca(_uid) OR coalesce(public.proj_eh_ceo(_uid), false));
$$;
CREATE OR REPLACE FUNCTION public.qw_pode_ler_lider(_lider uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.qw_lideres l WHERE l.id=_lider AND (l.user_id=auth.uid() OR l.diretor_user_id=auth.uid()))
      OR public.qw_gov(auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.qw_pode_ler_envio(_envio uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.qw_envios e WHERE e.id=_envio AND public.qw_pode_ler_lider(e.lider_id));
$$;

ALTER TABLE public.qw_lideres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qw_ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qw_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qw_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qw_avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY qw_lideres_ler ON public.qw_lideres FOR SELECT TO authenticated USING (user_id=auth.uid() OR diretor_user_id=auth.uid() OR public.qw_gov(auth.uid()));
CREATE POLICY qw_ciclos_ler ON public.qw_ciclos FOR SELECT TO authenticated USING (
  public.qw_gov(auth.uid()) OR (status <> 'rascunho' AND EXISTS (SELECT 1 FROM public.qw_lideres l WHERE l.ativo AND (l.user_id=auth.uid() OR l.diretor_user_id=auth.uid()))));
CREATE POLICY qw_envios_ler ON public.qw_envios FOR SELECT TO authenticated USING (public.qw_pode_ler_lider(lider_id));
CREATE POLICY qw_itens_ler ON public.qw_itens FOR SELECT TO authenticated USING (public.qw_pode_ler_envio(envio_id));
CREATE POLICY qw_avisos_ler ON public.qw_avisos FOR SELECT TO authenticated USING (public.qw_gov(auth.uid()));

-- Classificação automática
CREATE OR REPLACE FUNCTION public.qw_classificar(_faixa text, _aprov text, _prazo text, _limite numeric) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN (CASE _faixa WHEN 'sem_custo' THEN 0 WHEN 'ate_5k' THEN 5000 WHEN '5k_20k' THEN 20000 ELSE 'Infinity'::numeric END) <= _limite
              AND _aprov <> 'comite_ceo' AND _prazo <> 'acima_90' THEN 'quick_win' ELSE 'iniciativa_maior' END;
$$;
CREATE OR REPLACE FUNCTION public.qw_itens_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _lim numeric; _n integer;
BEGIN
  SELECT c.limite_investimento INTO _lim FROM public.qw_envios e JOIN public.qw_ciclos c ON c.id=e.ciclo_id WHERE e.id=NEW.envio_id;
  IF TG_OP='INSERT' THEN
    SELECT count(*) INTO _n FROM public.qw_itens WHERE envio_id=NEW.envio_id AND status_execucao<>'cancelado';
    IF _n >= 10 THEN RAISE EXCEPTION 'Limite de 10 quick wins por envio atingido'; END IF;
  END IF;
  NEW.classificacao := CASE WHEN NEW.status_triagem='convertido_iniciativa' THEN 'iniciativa_maior'
    ELSE public.qw_classificar(NEW.faixa_investimento, NEW.aprovacao_necessaria, NEW.prazo_resultado, coalesce(_lim,20000)) END;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER qw_itens_guard BEFORE INSERT OR UPDATE ON public.qw_itens FOR EACH ROW EXECUTE FUNCTION public.qw_itens_guard();

CREATE OR REPLACE FUNCTION public.qw_audit(_tabela text, _id uuid, _campo text, _antes text, _depois text) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.mt_auditoria(tabela, registro_id, campo, valor_anterior, valor_novo, alterado_por) VALUES (_tabela, _id::text, _campo, _antes, _depois, auth.uid());
$$;

-- Vínculo no 1º login (e-mail verificado)
CREATE OR REPLACE FUNCTION public.qw_vincular_lider_auth() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;
  UPDATE public.qw_lideres SET user_id=NEW.id, updated_at=now() WHERE email=lower(trim(NEW.email)) AND user_id IS NULL;
  RETURN NEW;
END $$;
CREATE TRIGGER zz_qw_vincular_lider AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.qw_vincular_lider_auth();

CREATE OR REPLACE FUNCTION public.qw_vincular() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _email text;
BEGIN
  SELECT lower(trim(email)) INTO _email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
  IF _email IS NULL THEN RETURN false; END IF;
  UPDATE public.qw_lideres SET user_id=auth.uid(), updated_at=now() WHERE email=_email AND user_id IS NULL;
  RETURN EXISTS (SELECT 1 FROM public.qw_lideres WHERE user_id=auth.uid());
END $$;

-- Escritas do líder
CREATE OR REPLACE FUNCTION public.qw_salvar_item(_id uuid, _dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _lider uuid; _ciclo uuid; _envio public.qw_envios%ROWTYPE; _item public.qw_itens%ROWTYPE; _ordem integer;
BEGIN
  SELECT id INTO _lider FROM public.qw_lideres WHERE user_id=auth.uid() AND ativo;
  IF _lider IS NULL THEN RAISE EXCEPTION 'Somente líderes cadastrados'; END IF;
  IF _id IS NULL THEN
    SELECT id INTO _ciclo FROM public.qw_ciclos WHERE status='aberto';
    IF _ciclo IS NULL THEN RAISE EXCEPTION 'Não há ciclo aberto'; END IF;
    INSERT INTO public.qw_envios(ciclo_id, lider_id) VALUES (_ciclo, _lider) ON CONFLICT (ciclo_id, lider_id) DO NOTHING;
    SELECT * INTO _envio FROM public.qw_envios WHERE ciclo_id=_ciclo AND lider_id=_lider;
    IF _envio.status='enviado' THEN RAISE EXCEPTION 'Envio já realizado; só itens em ajuste podem ser editados'; END IF;
    SELECT coalesce(max(ordem),0)+1 INTO _ordem FROM public.qw_itens WHERE envio_id=_envio.id AND status_execucao<>'cancelado';
    IF _ordem > 10 THEN RAISE EXCEPTION 'Limite de 10 quick wins por envio atingido'; END IF;
    INSERT INTO public.qw_itens(envio_id, ordem) VALUES (_envio.id, _ordem) RETURNING * INTO _item;
    PERFORM public.qw_audit('qw_itens', _item.id, 'criar', null, null);
  ELSE
    SELECT * INTO _item FROM public.qw_itens WHERE id=_id FOR UPDATE;
    SELECT * INTO _envio FROM public.qw_envios WHERE id=_item.envio_id;
    IF _envio.lider_id IS DISTINCT FROM _lider THEN RAISE EXCEPTION 'Item não pertence ao líder'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.qw_ciclos WHERE id=_envio.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo fechado: itens somente leitura'; END IF;
    IF _item.status_execucao='cancelado' THEN RAISE EXCEPTION 'Item cancelado'; END IF;
    IF _envio.status='enviado' AND _item.status_triagem NOT IN ('ajustar','devolvido') THEN RAISE EXCEPTION 'Após o envio, só itens em ajustar/devolvido podem ser editados'; END IF;
  END IF;
  UPDATE public.qw_itens SET
    titulo=coalesce(left(_dados->>'titulo',80), titulo),
    observacao=coalesce(_dados->>'observacao', observacao),
    acao_proposta=coalesce(_dados->>'acao_proposta', acao_proposta),
    indicador=coalesce(_dados->>'indicador', indicador),
    valor_atual=CASE WHEN _dados ? 'valor_atual' THEN _dados->>'valor_atual' ELSE valor_atual END,
    valor_alvo=coalesce(_dados->>'valor_alvo', valor_alvo),
    objetivo_id=CASE WHEN _dados ? 'objetivo_id' THEN nullif(_dados->>'objetivo_id','')::uuid ELSE objetivo_id END,
    faixa_investimento=coalesce(_dados->>'faixa_investimento', faixa_investimento),
    aprovacao_necessaria=coalesce(_dados->>'aprovacao_necessaria', aprovacao_necessaria),
    prazo_resultado=coalesce(_dados->>'prazo_resultado', prazo_resultado),
    mudanca_maior=coalesce(_dados->>'mudanca_maior', mudanca_maior),
    responsavel_execucao=coalesce(_dados->>'responsavel_execucao', responsavel_execucao)
  WHERE id=_item.id;
  PERFORM public.qw_audit('qw_itens', _item.id, 'salvar', null, _dados::text);
  RETURN _item.id;
END $$;

CREATE OR REPLACE FUNCTION public.qw_cancelar_item(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _item public.qw_itens%ROWTYPE; _envio public.qw_envios%ROWTYPE;
BEGIN
  SELECT * INTO _item FROM public.qw_itens WHERE id=_id FOR UPDATE;
  SELECT * INTO _envio FROM public.qw_envios WHERE id=_item.envio_id;
  IF NOT EXISTS (SELECT 1 FROM public.qw_lideres WHERE id=_envio.lider_id AND user_id=auth.uid() AND ativo) THEN RAISE EXCEPTION 'Item não pertence ao líder'; END IF;
  IF _envio.status<>'rascunho' THEN RAISE EXCEPTION 'Só itens de rascunho podem ser retirados; após o envio use a execução'; END IF;
  UPDATE public.qw_itens SET status_execucao='cancelado' WHERE id=_id;
  PERFORM public.qw_audit('qw_itens', _id, 'status_execucao', _item.status_execucao, 'cancelado');
END $$;

CREATE OR REPLACE FUNCTION public.qw_enviar(_envio uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _e public.qw_envios%ROWTYPE; _l public.qw_lideres%ROWTYPE; _n integer; _incompletos integer;
BEGIN
  SELECT * INTO _e FROM public.qw_envios WHERE id=_envio FOR UPDATE;
  SELECT * INTO _l FROM public.qw_lideres WHERE id=_e.lider_id;
  IF _l.user_id IS DISTINCT FROM auth.uid() OR NOT _l.ativo THEN RAISE EXCEPTION 'Envio não pertence ao líder'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.qw_ciclos WHERE id=_e.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo não está aberto'; END IF;
  SELECT count(*), count(*) FILTER (WHERE btrim(titulo)='' OR btrim(observacao)='' OR btrim(acao_proposta)='' OR btrim(indicador)='' OR btrim(valor_alvo)='' OR objetivo_id IS NULL OR btrim(mudanca_maior)='' OR btrim(responsavel_execucao)='')
    INTO _n, _incompletos FROM public.qw_itens WHERE envio_id=_envio AND status_execucao<>'cancelado';
  IF _n < 1 THEN RAISE EXCEPTION 'Inclua ao menos 1 quick win para enviar'; END IF;
  IF _incompletos > 0 THEN RAISE EXCEPTION 'Há % item(ns) com campos obrigatórios em branco', _incompletos; END IF;
  UPDATE public.qw_itens SET status_triagem='pendente' WHERE envio_id=_envio AND status_triagem IN ('ajustar','devolvido');
  UPDATE public.qw_envios SET status='enviado', enviado_em=now(), updated_at=now() WHERE id=_envio;
  INSERT INTO public.qw_avisos(tipo, destinatario_user_id, envio_id) VALUES ('envio_diretor', _l.diretor_user_id, _envio);
  PERFORM public.qw_audit('qw_envios', _envio, 'status', _e.status, 'enviado');
END $$;

-- Triagem do diretor
CREATE OR REPLACE FUNCTION public.qw_triar(_item uuid, _acao text, _comentario text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _i public.qw_itens%ROWTYPE; _e public.qw_envios%ROWTYPE; _l public.qw_lideres%ROWTYPE; _novo text;
BEGIN
  SELECT * INTO _i FROM public.qw_itens WHERE id=_item FOR UPDATE;
  SELECT * INTO _e FROM public.qw_envios WHERE id=_i.envio_id;
  SELECT * INTO _l FROM public.qw_lideres WHERE id=_e.lider_id;
  IF NOT (_l.diretor_user_id=auth.uid() OR public.qw_gov(auth.uid())) THEN RAISE EXCEPTION 'Somente o diretor do líder ou Governança/CEO'; END IF;
  IF _e.status<>'enviado' THEN RAISE EXCEPTION 'Envio ainda em rascunho'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.qw_ciclos WHERE id=_e.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo fechado'; END IF;
  IF _i.status_execucao='cancelado' THEN RAISE EXCEPTION 'Item cancelado'; END IF;
  _novo := CASE _acao WHEN 'aprovar' THEN 'aprovado' WHEN 'ajustar' THEN 'ajustar' WHEN 'devolver' THEN 'devolvido' WHEN 'converter' THEN 'convertido_iniciativa' END;
  IF _novo IS NULL THEN RAISE EXCEPTION 'Ação inválida'; END IF;
  IF _acao<>'aprovar' AND coalesce(btrim(_comentario),'')='' THEN RAISE EXCEPTION 'Comentário obrigatório'; END IF;
  UPDATE public.qw_itens SET status_triagem=_novo, comentario_diretor=nullif(btrim(coalesce(_comentario,'')),''), triado_por=auth.uid(), triado_em=now() WHERE id=_item;
  IF _acao IN ('ajustar','devolver') THEN
    INSERT INTO public.qw_avisos(tipo, destinatario_user_id, destinatario_email, envio_id, item_id)
    VALUES (CASE _acao WHEN 'ajustar' THEN 'ajustar_lider' ELSE 'devolver_lider' END, _l.user_id, _l.email, _e.id, _item);
  END IF;
  PERFORM public.qw_audit('qw_itens', _item, 'status_triagem', _i.status_triagem, _novo);
END $$;

-- Execução e resultado (permitido também com ciclo fechado, só aprovados)
CREATE OR REPLACE FUNCTION public.qw_atualizar_execucao(_item uuid, _status text, _resultado text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _i public.qw_itens%ROWTYPE; _e public.qw_envios%ROWTYPE;
BEGIN
  SELECT * INTO _i FROM public.qw_itens WHERE id=_item FOR UPDATE;
  SELECT * INTO _e FROM public.qw_envios WHERE id=_i.envio_id;
  IF NOT EXISTS (SELECT 1 FROM public.qw_lideres WHERE id=_e.lider_id AND user_id=auth.uid() AND ativo) AND NOT public.qw_gov(auth.uid()) THEN RAISE EXCEPTION 'Somente o líder ou Governança'; END IF;
  IF _i.status_triagem<>'aprovado' THEN RAISE EXCEPTION 'Execução só para itens aprovados'; END IF;
  IF EXISTS (SELECT 1 FROM public.qw_ciclos WHERE id=_e.ciclo_id AND status='arquivado') THEN RAISE EXCEPTION 'Ciclo arquivado'; END IF;
  IF _status NOT IN ('nao_iniciado','em_execucao','concluido','cancelado') THEN RAISE EXCEPTION 'Status inválido'; END IF;
  IF _status='concluido' AND coalesce(btrim(_resultado),'')='' THEN RAISE EXCEPTION 'Informe o resultado medido para concluir'; END IF;
  UPDATE public.qw_itens SET status_execucao=_status, resultado_medido=nullif(btrim(coalesce(_resultado,'')),''),
    concluido_em=CASE WHEN _status='concluido' THEN coalesce(concluido_em, now()) ELSE NULL END WHERE id=_item;
  PERFORM public.qw_audit('qw_itens', _item, 'execucao', _i.status_execucao||' | '||coalesce(_i.resultado_medido,''), _status||' | '||coalesce(_resultado,''));
END $$;

-- Ciclos (Governança)
CREATE OR REPLACE FUNCTION public.qw_ciclo_salvar(_id uuid, _dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _r uuid;
BEGIN
  IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança'; END IF;
  IF _id IS NULL THEN
    INSERT INTO public.qw_ciclos(ano, data_abertura, data_fechamento, limite_investimento, prazo_max_dias)
    VALUES ((_dados->>'ano')::int, nullif(_dados->>'data_abertura','')::date, nullif(_dados->>'data_fechamento','')::date,
            coalesce((_dados->>'limite_investimento')::numeric, 20000), coalesce((_dados->>'prazo_max_dias')::int, 90)) RETURNING id INTO _r;
  ELSE
    UPDATE public.qw_ciclos SET data_abertura=CASE WHEN _dados ? 'data_abertura' THEN nullif(_dados->>'data_abertura','')::date ELSE data_abertura END,
      data_fechamento=CASE WHEN _dados ? 'data_fechamento' THEN nullif(_dados->>'data_fechamento','')::date ELSE data_fechamento END,
      limite_investimento=coalesce((_dados->>'limite_investimento')::numeric, limite_investimento),
      prazo_max_dias=coalesce((_dados->>'prazo_max_dias')::int, prazo_max_dias),
      status=CASE WHEN _dados->>'status'='arquivado' AND status='fechado' THEN 'arquivado' ELSE status END,
      updated_at=now() WHERE id=_id RETURNING id INTO _r;
  END IF;
  PERFORM public.qw_audit('qw_ciclos', _r, 'salvar', null, _dados::text);
  RETURN _r;
END $$;
CREATE OR REPLACE FUNCTION public.qw_abrir_ciclo(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _s text;
BEGIN
  IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança'; END IF;
  SELECT status INTO _s FROM public.qw_ciclos WHERE id=_id FOR UPDATE;
  IF _s NOT IN ('rascunho','fechado') THEN RAISE EXCEPTION 'Ciclo não pode ser aberto'; END IF;
  IF EXISTS (SELECT 1 FROM public.qw_ciclos WHERE status='aberto' AND id<>_id) THEN RAISE EXCEPTION 'Já existe um ciclo aberto'; END IF;
  UPDATE public.qw_ciclos SET status='aberto', data_abertura=coalesce(data_abertura, (now() AT TIME ZONE 'America/Sao_Paulo')::date), updated_at=now() WHERE id=_id;
  PERFORM public.qw_audit('qw_ciclos', _id, 'status', _s, 'aberto');
END $$;
CREATE OR REPLACE FUNCTION public.qw_fechar_ciclo(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _s text;
BEGIN
  IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança'; END IF;
  SELECT status INTO _s FROM public.qw_ciclos WHERE id=_id FOR UPDATE;
  IF _s<>'aberto' THEN RAISE EXCEPTION 'Ciclo não está aberto'; END IF;
  UPDATE public.qw_ciclos SET status='fechado', data_fechamento=coalesce(data_fechamento, (now() AT TIME ZONE 'America/Sao_Paulo')::date), updated_at=now() WHERE id=_id;
  PERFORM public.qw_audit('qw_ciclos', _id, 'status', _s, 'fechado');
END $$;

-- Líderes (Governança)
CREATE OR REPLACE FUNCTION public.qw_lider_salvar(_id uuid, _dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _r uuid;
BEGIN
  IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança'; END IF;
  IF _id IS NULL THEN
    INSERT INTO public.qw_lideres(email, nome, cargo, cadeira_id, diretor_user_id)
    VALUES (lower(trim(_dados->>'email')), _dados->>'nome', _dados->>'cargo', nullif(_dados->>'cadeira_id','')::uuid, nullif(_dados->>'diretor_user_id','')::uuid) RETURNING id INTO _r;
    UPDATE public.qw_lideres l SET user_id=u.id FROM auth.users u WHERE l.id=_r AND l.user_id IS NULL AND lower(u.email)=l.email AND u.email_confirmed_at IS NOT NULL;
  ELSE
    UPDATE public.qw_lideres SET nome=coalesce(_dados->>'nome', nome), cargo=coalesce(_dados->>'cargo', cargo),
      cadeira_id=CASE WHEN _dados ? 'cadeira_id' THEN nullif(_dados->>'cadeira_id','')::uuid ELSE cadeira_id END,
      diretor_user_id=CASE WHEN _dados ? 'diretor_user_id' THEN nullif(_dados->>'diretor_user_id','')::uuid ELSE diretor_user_id END,
      revisao_pendente=false, updated_at=now() WHERE id=_id RETURNING id INTO _r;
  END IF;
  PERFORM public.qw_audit('qw_lideres', _r, 'salvar', null, _dados::text);
  RETURN _r;
END $$;
CREATE OR REPLACE FUNCTION public.qw_lider_ativar(_id uuid, _ativo boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança'; END IF;
  UPDATE public.qw_lideres SET ativo=_ativo, updated_at=now() WHERE id=_id;
  PERFORM public.qw_audit('qw_lideres', _id, 'ativo', (NOT _ativo)::text, _ativo::text);
END $$;

-- Perfil do usuário no módulo
CREATE OR REPLACE FUNCTION public.qw_meu_perfil() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _l public.qw_lideres%ROWTYPE;
BEGIN
  PERFORM public.qw_vincular();
  SELECT * INTO _l FROM public.qw_lideres WHERE user_id=auth.uid() AND ativo;
  RETURN jsonb_build_object(
    'lider_id', _l.id,
    'lider_restrito', _l.id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid()) AND NOT EXISTS (SELECT 1 FROM public.mt_usuarios WHERE user_id=auth.uid()),
    'diretor', EXISTS (SELECT 1 FROM public.qw_lideres WHERE diretor_user_id=auth.uid() AND ativo),
    'governanca', public.mt_is_governanca(auth.uid()),
    'gov_ceo', public.qw_gov(auth.uid()));
END $$;

-- Pré-carga a partir do organograma (marcada para revisão)
INSERT INTO public.qw_lideres(email, nome, cargo, cadeira_id, diretor_user_id, user_id, revisao_pendente)
SELECT DISTINCT ON (lower(trim(p.email))) lower(trim(p.email)), p.nome,
  CASE WHEN c.nome ILIKE '%gerente%' THEN 'gerente' WHEN c.nome ILIKE '%supervisor%' THEN 'supervisor' ELSE 'coordenador' END,
  p.cadeira_id, g.user_id, p.user_id, true
FROM public.org_pessoas p
JOIN public.org_organograma_cargos c ON c.id=p.cargo_id
LEFT JOIN public.org_pessoas g ON g.id=p.gestor_id
WHERE p.ativo AND lower(trim(p.email)) LIKE '%@liberdademedicaedu.com.br'
  AND (c.nome ILIKE '%coordenador%' OR c.nome ILIKE '%supervisor%' OR c.nome ILIKE '%gerente%')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.qw_ciclos(ano, status) VALUES (2026, 'rascunho') ON CONFLICT (ano) DO NOTHING;

REVOKE EXECUTE ON FUNCTION public.qw_vincular_lider_auth() FROM PUBLIC, anon, authenticated;