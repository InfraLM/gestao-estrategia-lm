CREATE TABLE public.mt_acao_vinculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iniciativa_id uuid NOT NULL REFERENCES public.mt_iniciativas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('bsc','kr','cesta','projeto','objetivo')),
  ref_id uuid NOT NULL,
  principal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (iniciativa_id, tipo, ref_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mt_acao_vinculos TO authenticated;
GRANT ALL ON public.mt_acao_vinculos TO service_role;
ALTER TABLE public.mt_acao_vinculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vinculos ler" ON public.mt_acao_vinculos FOR SELECT TO authenticated USING (public.acesso_modulo(auth.uid(),'rotina',false));
CREATE POLICY "vinculos escrever" ON public.mt_acao_vinculos FOR ALL TO authenticated
  USING (public.acesso_modulo(auth.uid(),'rotina',true) AND EXISTS (SELECT 1 FROM public.mt_iniciativas i WHERE i.id=iniciativa_id AND (public.mt_is_governanca(auth.uid()) OR i.cadeira_id=public.mt_cadeira_do_usuario(auth.uid()))))
  WITH CHECK (public.acesso_modulo(auth.uid(),'rotina',true) AND EXISTS (SELECT 1 FROM public.mt_iniciativas i WHERE i.id=iniciativa_id AND (public.mt_is_governanca(auth.uid()) OR i.cadeira_id=public.mt_cadeira_do_usuario(auth.uid()))));

INSERT INTO public.mt_acao_vinculos (iniciativa_id, tipo, ref_id, principal)
SELECT i.id, CASE ind.origem WHEN 'okr' THEN 'kr' WHEN 'cesta' THEN 'cesta' ELSE 'bsc' END, i.indicador_id, true
FROM public.mt_iniciativas i JOIN public.mt_indicadores ind ON ind.id=i.indicador_id
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.rotina_vincular_iniciativa(_iniciativa uuid, _vinculos jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_cad uuid;
BEGIN
  SELECT cadeira_id INTO v_cad FROM mt_iniciativas WHERE id=_iniciativa;
  IF v_cad IS NULL OR NOT public.acesso_modulo(auth.uid(),'rotina',true) OR NOT (public.mt_is_governanca(auth.uid()) OR v_cad = public.mt_cadeira_do_usuario(auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão para esta cadeira';
  END IF;
  DELETE FROM mt_acao_vinculos WHERE iniciativa_id=_iniciativa AND NOT principal;
  INSERT INTO mt_acao_vinculos (iniciativa_id, tipo, ref_id, principal)
  SELECT _iniciativa, x->>'tipo', (x->>'ref_id')::uuid, false FROM jsonb_array_elements(coalesce(_vinculos,'[]'::jsonb)) x
  WHERE x->>'tipo' IN ('bsc','kr','cesta','projeto','objetivo')
  ON CONFLICT DO NOTHING;
END $$;
REVOKE EXECUTE ON FUNCTION public.rotina_vincular_iniciativa(uuid, jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rotina_vincular_iniciativa(uuid, jsonb) TO authenticated;

ALTER TABLE public.org_organograma_cargos ADD COLUMN IF NOT EXISTS mt_cadeira_id uuid REFERENCES public.mt_cadeiras(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.org_organograma_cargos.mt_cadeira_id IS 'Cadeira (formulário semanal) cujo diretor ocupa este cargo; líderes diretos = filhos deste cargo';

ALTER TABLE public.gov_acoes ADD COLUMN IF NOT EXISTS responsavel_email text;

CREATE OR REPLACE FUNCTION public.gov_acoes_da_cadeira(_cadeira uuid)
 RETURNS TABLE(id uuid, origem_id uuid, titulo text, descricao text, responsavel_origem text, prazo date, status text, prioridade text, precisa_escalar boolean, comite_codigo text, reuniao_titulo text, reuniao_data timestamp with time zone, outros_responsaveis text[])
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT a.id, a.origem_id, a.titulo, a.descricao, a.responsavel_origem, a.prazo, a.status, a.prioridade, a.precisa_escalar, a.comite_codigo, a.reuniao_titulo, a.reuniao_data,
 ARRAY(SELECT DISTINCT c.nome FROM public.gov_responsaveis_map m2 JOIN public.gov_responsaveis_map_cadeiras mc2 ON mc2.map_id=m2.id JOIN public.mt_cadeiras c ON c.id=mc2.mt_cadeira_id WHERE m2.nome_normalizado=a.responsavel_normalizado AND m2.situacao='mapeado' AND mc2.mt_cadeira_id<>_cadeira ORDER BY c.nome)
 FROM public.gov_acoes a
 WHERE auth.uid() IS NOT NULL
 AND (public.gov_is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.mt_cadeiras c WHERE c.id=_cadeira AND c.diretor_user_id=auth.uid()))
 AND a.concluida_em IS NULL
 AND lower(translate(trim(coalesce(a.status,'')), 'áàâãéêíóôõúç', 'aaaaeeiooouc')) NOT IN ('concluido','concluida','cancelado','cancelada')
 AND (
   (nullif(trim(a.responsavel_email),'') IS NOT NULL AND EXISTS(SELECT 1 FROM public.mt_cadeiras c JOIN public.profiles p ON p.user_id=c.diretor_user_id WHERE c.id=_cadeira AND lower(trim(p.email))=lower(trim(a.responsavel_email))))
   OR (nullif(trim(a.responsavel_email),'') IS NULL AND EXISTS(SELECT 1 FROM public.gov_responsaveis_map m JOIN public.gov_responsaveis_map_cadeiras mc ON mc.map_id=m.id WHERE m.nome_normalizado=a.responsavel_normalizado AND m.situacao='mapeado' AND mc.mt_cadeira_id=_cadeira))
 );
$function$;