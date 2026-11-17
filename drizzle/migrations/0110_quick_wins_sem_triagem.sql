CREATE OR REPLACE FUNCTION public.qw_pode_ler_lider(_lider uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.mt_is_governanca(auth.uid()) OR EXISTS(SELECT 1 FROM public.qw_lideres WHERE id=_lider AND user_id=auth.uid()); $$;
CREATE OR REPLACE FUNCTION public.qw_pode_ler_item(_item uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.mt_is_governanca(auth.uid()) OR EXISTS(SELECT 1 FROM public.qw_itens i JOIN public.qw_envios e ON e.id=i.envio_id JOIN public.qw_lideres l ON l.id=e.lider_id WHERE i.id=_item AND l.user_id=auth.uid()); $$;
CREATE OR REPLACE FUNCTION public.qw_meu_perfil() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _l uuid; BEGIN
 PERFORM public.qw_vincular(); SELECT id INTO _l FROM public.qw_lideres WHERE user_id=auth.uid() AND ativo;
 RETURN jsonb_build_object('lider_id',_l,'lider_restrito',public.is_lider_restrito(auth.uid()),'diretor',false,'governanca',public.mt_is_governanca(auth.uid()),'gov_ceo',public.mt_is_governanca(auth.uid())); END $$;
CREATE OR REPLACE FUNCTION public.qw_area_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _l uuid; _n int; BEGIN SELECT lider_id INTO _l FROM public.qw_envios WHERE id=NEW.envio_id; SELECT count(*) INTO _n FROM public.qw_lider_diretores WHERE lider_id=_l AND ativo; NEW.area_rotulo:=nullif(btrim(NEW.area_rotulo),''); IF NEW.area_rotulo IS NOT NULL AND NEW.area_rotulo IS DISTINCT FROM OLD.area_rotulo AND _n>0 AND NOT EXISTS(SELECT 1 FROM public.qw_lider_diretores WHERE lider_id=_l AND ativo AND area_rotulo=NEW.area_rotulo) THEN RAISE EXCEPTION 'Área inválida'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.qw_cancelar_item(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _item public.qw_itens%ROWTYPE; _envio public.qw_envios%ROWTYPE;
BEGIN
 SELECT * INTO _item FROM public.qw_itens WHERE id=_id FOR UPDATE;
 SELECT * INTO _envio FROM public.qw_envios WHERE id=_item.envio_id;
 IF NOT EXISTS (SELECT 1 FROM public.qw_lideres WHERE id=_envio.lider_id AND user_id=auth.uid() AND ativo) THEN RAISE EXCEPTION 'Item não pertence ao líder'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.qw_ciclos WHERE id=_envio.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo fechado: itens somente leitura'; END IF;
 UPDATE public.qw_itens SET status_execucao='cancelado' WHERE id=_id;
 PERFORM public.qw_audit('qw_itens', _id, 'status_execucao', _item.status_execucao, 'cancelado');
END $$;
CREATE OR REPLACE FUNCTION public.qw_salvar_item(_id uuid, _dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _lider uuid; _ciclo uuid; _envio public.qw_envios%ROWTYPE; _item public.qw_itens%ROWTYPE; _ordem integer;
BEGIN
 SELECT id INTO _lider FROM public.qw_lideres WHERE user_id=auth.uid() AND ativo;
 IF _lider IS NULL THEN RAISE EXCEPTION 'Somente líderes cadastrados'; END IF;
 IF _id IS NULL THEN
 SELECT id INTO _ciclo FROM public.qw_ciclos WHERE status='aberto';
 IF _ciclo IS NULL THEN RAISE EXCEPTION 'Não há ciclo aberto'; END IF;
 INSERT INTO public.qw_envios(ciclo_id,lider_id) VALUES(_ciclo,_lider) ON CONFLICT(ciclo_id,lider_id) DO NOTHING;
 SELECT * INTO _envio FROM public.qw_envios WHERE ciclo_id=_ciclo AND lider_id=_lider FOR UPDATE;
 SELECT coalesce(max(ordem),0)+1 INTO _ordem FROM public.qw_itens WHERE envio_id=_envio.id AND status_execucao<>'cancelado';
 IF _ordem>10 THEN RAISE EXCEPTION 'Limite de 10 quick wins por envio atingido'; END IF;
 INSERT INTO public.qw_itens(envio_id,ordem) VALUES(_envio.id,_ordem) RETURNING * INTO _item;
 PERFORM public.qw_audit('qw_itens',_item.id,'criar',null,null);
 ELSE
 SELECT * INTO _item FROM public.qw_itens WHERE id=_id FOR UPDATE;
 SELECT * INTO _envio FROM public.qw_envios WHERE id=_item.envio_id;
 IF _envio.lider_id IS DISTINCT FROM _lider THEN RAISE EXCEPTION 'Item não pertence ao líder'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.qw_ciclos WHERE id=_envio.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo fechado: itens somente leitura'; END IF;
 IF _item.status_execucao='cancelado' THEN RAISE EXCEPTION 'Item cancelado'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM unnest(ARRAY['ice_impacto','ice_confianca','ice_facilidade']) k WHERE _dados ? k AND nullif(_dados->>k,'') IS NOT NULL AND (_dados->>k) !~ '^[1-5]$') THEN RAISE EXCEPTION 'ICE deve ser de 1 a 5'; END IF;
 UPDATE public.qw_itens SET
  titulo=CASE WHEN _dados ? 'acao_proposta' THEN left(btrim(_dados->>'acao_proposta'),80) ELSE coalesce(left(_dados->>'titulo',80),titulo) END,
  observacao=coalesce(_dados->>'observacao',observacao),acao_proposta=coalesce(_dados->>'acao_proposta',acao_proposta),
  investimento_estimado=CASE WHEN _dados ? 'investimento_estimado' THEN nullif(btrim(_dados->>'investimento_estimado'),'') ELSE investimento_estimado END,
  tem_custo=CASE WHEN _dados ? 'tem_custo' THEN nullif(_dados->>'tem_custo','')::boolean ELSE tem_custo END,
  ice_impacto=CASE WHEN _dados ? 'ice_impacto' THEN nullif(_dados->>'ice_impacto','')::smallint ELSE ice_impacto END,
  ice_confianca=CASE WHEN _dados ? 'ice_confianca' THEN nullif(_dados->>'ice_confianca','')::smallint ELSE ice_confianca END,
  ice_facilidade=CASE WHEN _dados ? 'ice_facilidade' THEN nullif(_dados->>'ice_facilidade','')::smallint ELSE ice_facilidade END
 WHERE id=_item.id;
 PERFORM public.qw_audit('qw_itens',_item.id,'salvar',null,_dados::text); RETURN _item.id;
END $$;
CREATE OR REPLACE FUNCTION public.qw_enviar(_envio uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _e public.qw_envios%ROWTYPE; _l public.qw_lideres%ROWTYPE; _n int; _incompletos int;
BEGIN
 SELECT * INTO _e FROM public.qw_envios WHERE id=_envio FOR UPDATE;
 SELECT * INTO _l FROM public.qw_lideres WHERE id=_e.lider_id;
 IF _l.user_id IS DISTINCT FROM auth.uid() OR NOT _l.ativo THEN RAISE EXCEPTION 'Envio não pertence ao líder'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.qw_ciclos WHERE id=_e.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo não está aberto'; END IF;
 SELECT count(*),count(*) FILTER(WHERE coalesce(btrim(observacao),'')='' OR coalesce(btrim(acao_proposta),'')='' OR tem_custo IS NULL OR (tem_custo AND coalesce(btrim(investimento_estimado),'')='') OR ice_impacto IS NULL OR ice_confianca IS NULL OR ice_facilidade IS NULL) INTO _n,_incompletos FROM public.qw_itens WHERE envio_id=_envio AND status_execucao<>'cancelado';
 IF _n<1 THEN RAISE EXCEPTION 'Inclua ao menos 1 quick win para enviar'; END IF;
 IF _n>10 THEN RAISE EXCEPTION 'Limite de 10 quick wins por envio atingido'; END IF;
 IF _incompletos>0 THEN RAISE EXCEPTION 'Há % item(ns) com campos obrigatórios em branco',_incompletos; END IF;
 UPDATE public.qw_itens SET titulo=left(btrim(acao_proposta),80) WHERE envio_id=_envio AND status_execucao<>'cancelado' AND coalesce(btrim(titulo),'')='';
 UPDATE public.qw_envios SET status='enviado',enviado_em=now(),aguardando_diretor=false,updated_at=now() WHERE id=_envio;
 PERFORM public.qw_audit('qw_envios',_envio,'status',_e.status,'enviado');
END $$;
COMMENT ON COLUMN public.qw_itens.status_triagem IS 'DEPRECATED: triagem removida (nov/2026); mantido para histórico.';
COMMENT ON COLUMN public.qw_itens.comentario_diretor IS 'DEPRECATED: triagem removida (nov/2026); mantido para histórico.';