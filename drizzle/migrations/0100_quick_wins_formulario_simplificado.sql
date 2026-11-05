ALTER TABLE public.qw_itens ADD COLUMN IF NOT EXISTS investimento_estimado text;
COMMENT ON COLUMN public.qw_itens.investimento_estimado IS 'Investimento estimado informado pelo líder (texto livre, opcional).';
COMMENT ON COLUMN public.qw_itens.indicador IS 'Oculto no formulário simplificado do líder (nov/2026); mantido para histórico.';
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
 IF _envio.status='enviado' THEN RAISE EXCEPTION 'Envio já realizado; só itens em ajuste podem ser editados'; END IF;
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
 IF _envio.status='enviado' AND _item.status_triagem NOT IN ('ajustar','devolvido') THEN RAISE EXCEPTION 'Após o envio, só itens em ajustar/devolvido podem ser editados'; END IF;
 END IF;
 UPDATE public.qw_itens SET
  titulo=CASE WHEN _dados ? 'acao_proposta' THEN left(btrim(_dados->>'acao_proposta'),80) ELSE coalesce(left(_dados->>'titulo',80),titulo) END,
  observacao=coalesce(_dados->>'observacao',observacao),acao_proposta=coalesce(_dados->>'acao_proposta',acao_proposta),
  investimento_estimado=CASE WHEN _dados ? 'investimento_estimado' THEN nullif(btrim(_dados->>'investimento_estimado'),'') ELSE investimento_estimado END,
  indicador=coalesce(_dados->>'indicador',indicador),valor_atual=CASE WHEN _dados ? 'valor_atual' THEN _dados->>'valor_atual' ELSE valor_atual END,valor_alvo=coalesce(_dados->>'valor_alvo',valor_alvo),objetivo_id=CASE WHEN _dados ? 'objetivo_id' THEN nullif(_dados->>'objetivo_id','')::uuid ELSE objetivo_id END,faixa_investimento=coalesce(_dados->>'faixa_investimento',faixa_investimento),aprovacao_necessaria=coalesce(_dados->>'aprovacao_necessaria',aprovacao_necessaria),prazo_resultado=coalesce(_dados->>'prazo_resultado',prazo_resultado),mudanca_maior=coalesce(_dados->>'mudanca_maior',mudanca_maior),responsavel_execucao=coalesce(_dados->>'responsavel_execucao',responsavel_execucao),area_rotulo=CASE WHEN _dados ? 'area_rotulo' THEN nullif(btrim(_dados->>'area_rotulo'),'') ELSE area_rotulo END WHERE id=_item.id;
 PERFORM public.qw_audit('qw_itens',_item.id,'salvar',null,_dados::text); RETURN _item.id;
END $$;
CREATE OR REPLACE FUNCTION public.qw_enviar(_envio uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _e public.qw_envios%ROWTYPE; _l public.qw_lideres%ROWTYPE; _n int; _incompletos int; _areas int;
BEGIN
 SELECT * INTO _e FROM public.qw_envios WHERE id=_envio FOR UPDATE;
 SELECT * INTO _l FROM public.qw_lideres WHERE id=_e.lider_id;
 IF _l.user_id IS DISTINCT FROM auth.uid() OR NOT _l.ativo THEN RAISE EXCEPTION 'Envio não pertence ao líder'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.qw_ciclos WHERE id=_e.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo não está aberto'; END IF;
 SELECT count(*),count(*) FILTER(WHERE coalesce(btrim(observacao),'')='' OR coalesce(btrim(acao_proposta),'')='') INTO _n,_incompletos FROM public.qw_itens WHERE envio_id=_envio AND status_execucao<>'cancelado';
 SELECT count(*) INTO _areas FROM public.qw_lider_diretores WHERE lider_id=_l.id AND ativo;
 IF _areas>1 AND EXISTS(SELECT 1 FROM public.qw_itens WHERE envio_id=_envio AND status_execucao<>'cancelado' AND nullif(btrim(area_rotulo),'') IS NULL) THEN RAISE EXCEPTION 'Área obrigatória'; END IF;
 IF _n<1 THEN RAISE EXCEPTION 'Inclua ao menos 1 quick win para enviar'; END IF;
 IF _n>10 THEN RAISE EXCEPTION 'Limite de 10 quick wins por envio atingido'; END IF;
 IF _incompletos>0 THEN RAISE EXCEPTION 'Há % item(ns) com campos obrigatórios em branco',_incompletos; END IF;
 UPDATE public.qw_itens SET titulo=left(btrim(acao_proposta),80) WHERE envio_id=_envio AND status_execucao<>'cancelado' AND coalesce(btrim(titulo),'')='';
 UPDATE public.qw_itens SET status_triagem='pendente' WHERE envio_id=_envio AND status_triagem IN ('ajustar','devolvido');
 UPDATE public.qw_envios SET status='enviado',enviado_em=now(),updated_at=now() WHERE id=_envio;
 PERFORM public.qw_atualizar_encaminhamentos(); PERFORM public.qw_audit('qw_envios',_envio,'status',_e.status,'enviado');
END $$;