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
 UPDATE public.qw_itens SET titulo=coalesce(left(_dados->>'titulo',80),titulo),observacao=coalesce(_dados->>'observacao',observacao),acao_proposta=coalesce(_dados->>'acao_proposta',acao_proposta),indicador=coalesce(_dados->>'indicador',indicador),valor_atual=CASE WHEN _dados ? 'valor_atual' THEN _dados->>'valor_atual' ELSE valor_atual END,valor_alvo=coalesce(_dados->>'valor_alvo',valor_alvo),objetivo_id=CASE WHEN _dados ? 'objetivo_id' THEN nullif(_dados->>'objetivo_id','')::uuid ELSE objetivo_id END,faixa_investimento=coalesce(_dados->>'faixa_investimento',faixa_investimento),aprovacao_necessaria=coalesce(_dados->>'aprovacao_necessaria',aprovacao_necessaria),prazo_resultado=coalesce(_dados->>'prazo_resultado',prazo_resultado),mudanca_maior=coalesce(_dados->>'mudanca_maior',mudanca_maior),responsavel_execucao=coalesce(_dados->>'responsavel_execucao',responsavel_execucao),area_rotulo=CASE WHEN _dados ? 'area_rotulo' THEN nullif(btrim(_dados->>'area_rotulo'),'') ELSE area_rotulo END WHERE id=_item.id;
 PERFORM public.qw_audit('qw_itens',_item.id,'salvar',null,_dados::text); RETURN _item.id;
END $$;
CREATE OR REPLACE FUNCTION public.qw_enviar(_envio uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _e public.qw_envios%ROWTYPE; _l public.qw_lideres%ROWTYPE; _n int; _incompletos int; _areas int;
BEGIN
 SELECT * INTO _e FROM public.qw_envios WHERE id=_envio FOR UPDATE;
 SELECT * INTO _l FROM public.qw_lideres WHERE id=_e.lider_id;
 IF _l.user_id IS DISTINCT FROM auth.uid() OR NOT _l.ativo THEN RAISE EXCEPTION 'Envio não pertence ao líder'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.qw_ciclos WHERE id=_e.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo não está aberto'; END IF;
 SELECT count(*),count(*) FILTER(WHERE btrim(titulo)='' OR btrim(observacao)='' OR btrim(acao_proposta)='' OR btrim(indicador)='' OR btrim(valor_alvo)='' OR objetivo_id IS NULL OR btrim(mudanca_maior)='' OR btrim(responsavel_execucao)='') INTO _n,_incompletos FROM public.qw_itens WHERE envio_id=_envio AND status_execucao<>'cancelado';
 SELECT count(*) INTO _areas FROM public.qw_lider_diretores WHERE lider_id=_l.id AND ativo;
 IF _areas>1 AND EXISTS(SELECT 1 FROM public.qw_itens WHERE envio_id=_envio AND status_execucao<>'cancelado' AND nullif(btrim(area_rotulo),'') IS NULL) THEN RAISE EXCEPTION 'Área obrigatória'; END IF;
 IF _n<1 THEN RAISE EXCEPTION 'Inclua ao menos 1 quick win para enviar'; END IF;
 IF _incompletos>0 THEN RAISE EXCEPTION 'Há % item(ns) com campos obrigatórios em branco',_incompletos; END IF;
 UPDATE public.qw_itens SET status_triagem='pendente' WHERE envio_id=_envio AND status_triagem IN ('ajustar','devolvido');
 UPDATE public.qw_envios SET status='enviado',enviado_em=now(),updated_at=now() WHERE id=_envio;
 PERFORM public.qw_atualizar_encaminhamentos(); PERFORM public.qw_audit('qw_envios',_envio,'status',_e.status,'enviado');
END $$;
CREATE OR REPLACE FUNCTION public.qw_triar(_item uuid,_acao text,_comentario text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _i public.qw_itens%ROWTYPE; _e public.qw_envios%ROWTYPE; _l public.qw_lideres%ROWTYPE; _novo text;
BEGIN
 SELECT * INTO _i FROM public.qw_itens WHERE id=_item FOR UPDATE; SELECT * INTO _e FROM public.qw_envios WHERE id=_i.envio_id; SELECT * INTO _l FROM public.qw_lideres WHERE id=_e.lider_id;
 IF NOT public.qw_pode_triar_item(_item) THEN RAISE EXCEPTION 'Somente o diretor do líder ou Governança/CEO'; END IF;
 IF _e.status<>'enviado' THEN RAISE EXCEPTION 'Envio ainda em rascunho'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.qw_ciclos WHERE id=_e.ciclo_id AND status='aberto') THEN RAISE EXCEPTION 'Ciclo fechado'; END IF;
 IF _i.status_execucao='cancelado' THEN RAISE EXCEPTION 'Item cancelado'; END IF;
 _novo:=CASE _acao WHEN 'aprovar' THEN 'aprovado' WHEN 'ajustar' THEN 'ajustar' WHEN 'devolver' THEN 'devolvido' WHEN 'converter' THEN 'convertido_iniciativa' END;
 IF _novo IS NULL THEN RAISE EXCEPTION 'Ação inválida'; END IF;
 IF _acao<>'aprovar' AND coalesce(btrim(_comentario),'')='' THEN RAISE EXCEPTION 'Comentário obrigatório'; END IF;
 UPDATE public.qw_itens SET status_triagem=_novo,comentario_diretor=nullif(btrim(coalesce(_comentario,'')),''),triado_por=auth.uid(),triado_em=now() WHERE id=_item;
 IF _acao IN ('ajustar','devolver') THEN INSERT INTO public.qw_avisos(tipo,destinatario_user_id,destinatario_email,envio_id,item_id) VALUES(CASE _acao WHEN 'ajustar' THEN 'ajustar_lider' ELSE 'devolver_lider' END,_l.user_id,_l.email,_e.id,_item); END IF;
 PERFORM public.qw_atualizar_encaminhamentos(); PERFORM public.qw_audit('qw_itens',_item,'status_triagem',_i.status_triagem,_novo);
END $$;
CREATE OR REPLACE FUNCTION public.qw_vincular_lider_auth() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _l public.qw_lideres%ROWTYPE; BEGIN
 IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO _l FROM public.qw_lideres WHERE public.qw_email_chave(email)=public.qw_email_chave(NEW.email) AND user_id IS NULL AND ativo FOR UPDATE;
 IF FOUND AND NOT EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=NEW.id) AND (SELECT count(*) FROM auth.users WHERE public.qw_email_chave(email)=public.qw_email_chave(NEW.email) AND email_confirmed_at IS NOT NULL)=1 THEN UPDATE public.qw_lideres SET user_id=NEW.id,updated_at=now() WHERE id=_l.id; PERFORM public.qw_audit('qw_lideres',_l.id,'user_id',null,NEW.id::text); END IF;
 RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.qw_vincular() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _email text; _l public.qw_lideres%ROWTYPE; BEGIN
 SELECT email INTO _email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL; IF _email IS NULL THEN RETURN false; END IF;
 SELECT * INTO _l FROM public.qw_lideres WHERE public.qw_email_chave(email)=public.qw_email_chave(_email) AND user_id IS NULL AND ativo FOR UPDATE;
 IF FOUND AND NOT EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=auth.uid()) AND (SELECT count(*) FROM auth.users WHERE public.qw_email_chave(email)=public.qw_email_chave(_email) AND email_confirmed_at IS NOT NULL)=1 THEN UPDATE public.qw_lideres SET user_id=auth.uid(),updated_at=now() WHERE id=_l.id; PERFORM public.qw_audit('qw_lideres',_l.id,'user_id',null,auth.uid()::text); END IF;
 RETURN EXISTS(SELECT 1 FROM public.qw_lideres WHERE user_id=auth.uid() AND ativo); END $$;
CREATE OR REPLACE FUNCTION public.qw_meu_perfil() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _l uuid; BEGIN
 PERFORM public.qw_vincular(); SELECT id INTO _l FROM public.qw_lideres WHERE user_id=auth.uid() AND ativo;
 RETURN jsonb_build_object('lider_id',_l,'lider_restrito',public.is_lider_restrito(auth.uid()),'diretor',EXISTS(SELECT 1 FROM public.qw_lideres WHERE public.qw_diretor_do_lider(id,auth.uid())),'governanca',public.mt_is_governanca(auth.uid()),'gov_ceo',public.qw_gov(auth.uid())); END $$;
CREATE OR REPLACE FUNCTION public.qw_lider_salvar(_id uuid,_dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _r uuid; _antes jsonb; _user uuid; _n int; _diretor uuid; BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança'; END IF;
 _diretor:=nullif(_dados->>'diretor_lider_id','')::uuid;
 IF _diretor IS NOT NULL AND (_diretor=_id OR NOT EXISTS(SELECT 1 FROM public.qw_lideres WHERE id=_diretor AND ativo AND cargo='diretor')) THEN RAISE EXCEPTION 'Diretor inválido'; END IF;
 IF _id IS NULL THEN
 SELECT count(*),(array_agg(id))[1] INTO _n,_user FROM auth.users WHERE public.qw_email_chave(email)=public.qw_email_chave(_dados->>'email') AND email_confirmed_at IS NOT NULL;
 IF _n>1 THEN RAISE EXCEPTION 'E-mail corresponde a mais de uma conta; revisar identidade'; END IF;
 INSERT INTO public.qw_lideres(email,nome,cargo,cadeira_id,diretor_user_id,diretor_lider_id,user_id) VALUES(lower(btrim(_dados->>'email')),_dados->>'nome',_dados->>'cargo',nullif(_dados->>'cadeira_id','')::uuid,nullif(_dados->>'diretor_user_id','')::uuid,_diretor,_user) RETURNING id INTO _r;
 ELSE
 SELECT to_jsonb(l) INTO _antes FROM public.qw_lideres l WHERE id=_id FOR UPDATE; IF _antes IS NULL THEN RAISE EXCEPTION 'Líder não encontrado'; END IF;
 IF _dados ? 'cargo' AND _dados->>'cargo'<>'diretor' AND EXISTS(SELECT 1 FROM public.qw_lideres WHERE diretor_lider_id=_id AND ativo UNION ALL SELECT 1 FROM public.qw_lider_diretores WHERE diretor_lider_id=_id AND ativo) THEN RAISE EXCEPTION 'Diretor possui vínculos ativos'; END IF;
 UPDATE public.qw_lideres SET nome=coalesce(_dados->>'nome',nome),cargo=coalesce(_dados->>'cargo',cargo),cadeira_id=CASE WHEN _dados ? 'cadeira_id' THEN nullif(_dados->>'cadeira_id','')::uuid ELSE cadeira_id END,diretor_user_id=CASE WHEN _dados ? 'diretor_user_id' THEN nullif(_dados->>'diretor_user_id','')::uuid ELSE diretor_user_id END,diretor_lider_id=CASE WHEN _dados ? 'diretor_lider_id' THEN _diretor ELSE diretor_lider_id END,revisao_pendente=false,updated_at=now() WHERE id=_id RETURNING id INTO _r;
 END IF;
 PERFORM public.qw_audit('qw_lideres',_r,'salvar',_antes::text,(SELECT to_jsonb(l)::text FROM public.qw_lideres l WHERE id=_r)); RETURN _r;
END $$;
CREATE FUNCTION public.qw_diretor_salvar(_id uuid,_lider uuid,_dados jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE _r uuid; _antes jsonb; _dl uuid; BEGIN
 IF NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Somente Governança'; END IF;
 PERFORM 1 FROM public.qw_lideres WHERE id=_lider FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Líder não encontrado'; END IF;
 _dl:=nullif(_dados->>'diretor_lider_id','')::uuid;
 IF _dl IS NOT NULL AND (_dl=_lider OR NOT EXISTS(SELECT 1 FROM public.qw_lideres WHERE id=_dl AND ativo AND cargo='diretor')) THEN RAISE EXCEPTION 'Diretor inválido'; END IF;
 IF _id IS NULL THEN INSERT INTO public.qw_lider_diretores(lider_id,area_rotulo,diretor_lider_id,diretor_user_id) VALUES(_lider,btrim(_dados->>'area_rotulo'),_dl,nullif(_dados->>'diretor_user_id','')::uuid) RETURNING id INTO _r;
 ELSE
 SELECT to_jsonb(d) INTO _antes FROM public.qw_lider_diretores d WHERE id=_id AND lider_id=_lider FOR UPDATE; IF _antes IS NULL THEN RAISE EXCEPTION 'Vínculo não encontrado'; END IF;
 IF _dados ? 'area_rotulo' AND _dados->>'area_rotulo' IS DISTINCT FROM _antes->>'area_rotulo' AND EXISTS(SELECT 1 FROM public.qw_itens i JOIN public.qw_envios e ON e.id=i.envio_id WHERE e.lider_id=_lider AND i.area_rotulo=_antes->>'area_rotulo') THEN RAISE EXCEPTION 'Área já utilizada; inative o vínculo e cadastre outra área para preservar histórico'; END IF;
 UPDATE public.qw_lider_diretores SET area_rotulo=coalesce(btrim(_dados->>'area_rotulo'),area_rotulo),diretor_lider_id=CASE WHEN _dados ? 'diretor_lider_id' THEN _dl ELSE diretor_lider_id END,diretor_user_id=CASE WHEN _dados ? 'diretor_user_id' THEN nullif(_dados->>'diretor_user_id','')::uuid ELSE diretor_user_id END,ativo=coalesce((_dados->>'ativo')::boolean,ativo),updated_at=now() WHERE id=_id RETURNING id INTO _r;
 END IF;
 PERFORM public.qw_audit('qw_lider_diretores',_r,'salvar',_antes::text,(SELECT to_jsonb(d)::text FROM public.qw_lider_diretores d WHERE id=_r)); RETURN _r;
END $$;
CREATE OR REPLACE FUNCTION public.qw_contexto() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN RETURN jsonb_build_object(
 'lideres',coalesce((SELECT jsonb_agg(jsonb_build_object('id',l.id,'cadeira',c.nome,'diretor',CASE WHEN l.triagem_governanca THEN 'Governança' ELSE coalesce(dl.nome,nullif(p.display_name,''),p.email) END,'diretor_efetivo',public.qw_diretor_item(l.id,null),
 'areas',coalesce((SELECT jsonb_agg(jsonb_build_object('id',d.id,'area_rotulo',d.area_rotulo,'ativo',d.ativo,'diretor_lider_id',d.diretor_lider_id,'diretor_user_id',d.diretor_user_id,'diretor_efetivo',public.qw_resolver_diretor(d.diretor_user_id,d.diretor_lider_id),'diretor',coalesce(dlr.nome,dp.display_name,dp.email)) ORDER BY d.area_rotulo) FROM public.qw_lider_diretores d LEFT JOIN public.qw_lideres dlr ON dlr.id=d.diretor_lider_id LEFT JOIN public.profiles dp ON dp.user_id=d.diretor_user_id WHERE d.lider_id=l.id AND (d.ativo OR public.mt_is_governanca(auth.uid())) AND (public.qw_gov(auth.uid()) OR l.user_id=auth.uid() OR public.qw_resolver_diretor(d.diretor_user_id,d.diretor_lider_id)=auth.uid())),'[]'::jsonb),
 'aguardando_diretor',CASE WHEN l.triagem_governanca THEN false WHEN EXISTS(SELECT 1 FROM public.qw_lider_diretores WHERE lider_id=l.id AND ativo) THEN EXISTS(SELECT 1 FROM public.qw_lider_diretores WHERE lider_id=l.id AND ativo AND public.qw_resolver_diretor(diretor_user_id,diretor_lider_id) IS NULL) ELSE public.qw_diretor_item(l.id,null) IS NULL END)) FROM public.qw_lideres l LEFT JOIN public.org_cadeiras c ON c.id=l.cadeira_id LEFT JOIN public.qw_lideres dl ON dl.id=l.diretor_lider_id LEFT JOIN public.profiles p ON p.user_id=l.diretor_user_id WHERE public.qw_pode_ler_lider(l.id)),'[]'::jsonb),
 'cadeiras',CASE WHEN public.mt_is_governanca(auth.uid()) THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',nome) ORDER BY nome) FROM public.org_cadeiras WHERE ativo),'[]'::jsonb) ELSE '[]'::jsonb END,
 'diretores',CASE WHEN public.mt_is_governanca(auth.uid()) THEN coalesce((SELECT jsonb_agg(jsonb_build_object('user_id',u.user_id,'nome',coalesce(p.display_name,p.email))) FROM public.mt_usuarios u LEFT JOIN public.profiles p ON p.user_id=u.user_id WHERE u.perfil IN ('diretor','governanca')),'[]'::jsonb) ELSE '[]'::jsonb END,
 'diretores_lideres',CASE WHEN public.mt_is_governanca(auth.uid()) THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',nome,'user_id',user_id) ORDER BY nome) FROM public.qw_lideres WHERE ativo AND cargo='diretor'),'[]'::jsonb) ELSE '[]'::jsonb END,
 'itens_triaveis',coalesce((SELECT jsonb_agg(id) FROM public.qw_itens WHERE public.qw_pode_triar_item(id)),'[]'::jsonb)); END $$;
REVOKE EXECUTE ON FUNCTION public.qw_diretor_salvar(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.qw_diretor_salvar(uuid,uuid,jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.qw_contexto(),public.qw_vincular(),public.qw_meu_perfil() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.qw_contexto(),public.qw_vincular(),public.qw_meu_perfil() TO authenticated;