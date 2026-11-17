CREATE OR REPLACE FUNCTION public.qw_enviar(_envio uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _e public.qw_envios%ROWTYPE; _l public.qw_lideres%ROWTYPE; _n int; _incompletos int;
BEGIN
 SELECT * INTO _e FROM public.qw_envios WHERE id=_envio FOR UPDATE;
 SELECT * INTO _l FROM public.qw_lideres WHERE id=_e.lider_id;
 IF _l.user_id IS DISTINCT FROM auth.uid() OR NOT _l.ativo THEN RAISE EXCEPTION 'Envio não pertence ao líder'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.qw_ciclos WHERE id=_e.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo não está aberto'; END IF;
 SELECT count(*),count(*) FILTER(WHERE coalesce(btrim(observacao),'')='' OR ice_impacto IS NULL OR ice_confianca IS NULL OR ice_facilidade IS NULL) INTO _n,_incompletos
   FROM public.qw_itens WHERE envio_id=_envio AND status_execucao<>'cancelado' AND coalesce(btrim(acao_proposta),'')<>'';
 IF _n<1 THEN RAISE EXCEPTION 'Inclua ao menos 1 quick win para enviar'; END IF;
 IF _n>10 THEN RAISE EXCEPTION 'Limite de 10 quick wins por envio atingido'; END IF;
 IF _incompletos>0 THEN RAISE EXCEPTION 'Há % item(ns) com campos obrigatórios em branco',_incompletos; END IF;
 UPDATE public.qw_itens SET titulo=left(btrim(acao_proposta),80) WHERE envio_id=_envio AND status_execucao<>'cancelado' AND coalesce(btrim(titulo),'')='' AND coalesce(btrim(acao_proposta),'')<>'';
 UPDATE public.qw_envios SET status='enviado',enviado_em=now(),aguardando_diretor=false,updated_at=now() WHERE id=_envio;
 PERFORM public.qw_audit('qw_envios',_envio,'status',_e.status,'enviado');
END $$;