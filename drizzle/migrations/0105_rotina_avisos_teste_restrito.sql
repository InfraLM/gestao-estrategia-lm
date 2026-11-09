CREATE TABLE public.rotina_avisos_testadores (user_id uuid PRIMARY KEY, valido_ate timestamptz NOT NULL, revogado_em timestamptz, concedido_por uuid NOT NULL);
GRANT SELECT ON public.rotina_avisos_testadores TO authenticated;
GRANT ALL ON public.rotina_avisos_testadores TO service_role;
ALTER TABLE public.rotina_avisos_testadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY teste_leitura ON public.rotina_avisos_testadores FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.mt_is_governanca(auth.uid()));
CREATE FUNCTION public.rotina_avisos_teste_info() RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT valido_ate FROM public.rotina_avisos_testadores WHERE user_id=auth.uid() AND revogado_em IS NULL AND valido_ate>now() $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_teste_info() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_teste_info() TO authenticated;
CREATE FUNCTION public.rotina_avisos_teste_conceder(_email text, _revogar boolean DEFAULT false) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid; anterior text; prazo timestamptz;
BEGIN
 IF NOT coalesce(public.mt_is_governanca(auth.uid()),false) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT user_id INTO u FROM public.profiles WHERE lower(trim(email))=lower(trim(_email));
 IF u IS NULL THEN RAISE EXCEPTION 'Conta não encontrada'; END IF;
 SELECT row_to_json(t)::text INTO anterior FROM public.rotina_avisos_testadores t WHERE user_id=u;
 IF _revogar THEN
  UPDATE public.rotina_avisos_testadores SET revogado_em=now() WHERE user_id=u;
 ELSE
  prazo:=now()+interval '24 hours';
  INSERT INTO public.rotina_avisos_testadores(user_id,valido_ate,revogado_em,concedido_por) VALUES(u,prazo,NULL,auth.uid()) ON CONFLICT(user_id) DO UPDATE SET valido_ate=excluded.valido_ate,revogado_em=NULL,concedido_por=excluded.concedido_por;
 END IF;
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por) VALUES('rotina_avisos_testadores',u::text,'permissao_teste',anterior,CASE WHEN _revogar THEN 'revogado' ELSE prazo::text END,auth.uid());
 RETURN prazo;
END $$;
REVOKE ALL ON FUNCTION public.rotina_avisos_teste_conceder(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rotina_avisos_teste_conceder(text,boolean) TO authenticated;