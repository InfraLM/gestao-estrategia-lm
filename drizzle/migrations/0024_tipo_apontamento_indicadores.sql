ALTER TABLE public.mt_indicadores
  ADD COLUMN IF NOT EXISTS tipo_apontamento text NOT NULL DEFAULT 'valor_mensal',
  ADD COLUMN IF NOT EXISTS prazo_entrega date,
  ADD COLUMN IF NOT EXISTS status_implantacao_medicao text;
ALTER TABLE public.mt_indicadores ADD CONSTRAINT mt_indicadores_tipo_apont_chk CHECK (tipo_apontamento IN ('valor_mensal','valor_periodo','entrega'));
ALTER TABLE public.mt_lancamentos
  ADD COLUMN IF NOT EXISTS declaracao text,
  ADD COLUMN IF NOT EXISTS justificativa text,
  ADD COLUMN IF NOT EXISTS status_entrega text,
  ADD COLUMN IF NOT EXISTS avanco_pct numeric,
  ADD COLUMN IF NOT EXISTS evidencia text;
ALTER TABLE public.mt_lancamentos ADD CONSTRAINT mt_lanc_decl_chk CHECK (declaracao IS NULL OR declaracao IN ('on','off'));
ALTER TABLE public.mt_lancamentos ADD CONSTRAINT mt_lanc_entrega_chk CHECK (status_entrega IS NULL OR status_entrega IN ('nao_iniciada','em_implantacao','implantada','atrasada','cancelada'));
ALTER TABLE public.mt_lancamentos ADD CONSTRAINT mt_lanc_avanco_chk CHECK (avanco_pct IS NULL OR (avanco_pct >= 0 AND avanco_pct <= 100));
UPDATE public.mt_indicadores SET tipo_apontamento='valor_periodo' WHERE codigo IN ('ac.02.01','ac.02.02','ac.02.03','ac.02.04','ac.02.05','ac.02.06','ac.03.01','ac.03.02','ac.03.03','c.01.01','c.01.03','c.01.04','p.01.01','p.01.02','p.02.01','p.03.01','p.03.02','p.03.04','p.03.05','cesta.bruno.01','cesta.bruno.03','cesta.cleto.03','cesta.felipe.02','cesta.guilhe.02','cesta.guilhe.04','cesta.iurifr.02','cesta.yuri.02','cesta.ian.01','cesta.naira.01','cesta.yuri.01','OKR1-KR2','OKR1-KR4','OKR2-KR1','OKR2-KR2','OKR3-KR3');
UPDATE public.mt_indicadores SET tipo_apontamento='entrega', prazo_entrega = CASE WHEN codigo='cesta.naira.02' THEN date '2026-11-30' ELSE date '2026-12-31' END WHERE codigo IN ('cesta.cleto.01','cesta.naira.02','cesta.naira.03','cesta.naira.04','OKR3-KR2');
UPDATE public.mt_indicadores i SET status_implantacao_medicao=v.st FROM (VALUES ('F01.02 NSM(%) - adimplentes','To Do'),('F02 Geração de Caixa Operacional','Implementation'),('F02.01 Margem Bruta  (%)','Ready for Review'),('F01 Receita Líquida','Ready for Review'),('F01.01 LTV / CAC','Deployed'),('F01.03 % de Vendas por Indicação (Advocacy) - PPG','Deployed'),('C02-a.02 % TTFV alunos ativos (+ 90d)','Deployed'),('P01.01 Matriz RFV - taxa de alunos campeões e fiéis','Implementation'),('P01.02 SLA de Onboarding','Deployed'),('P01.03 Churn mensal pela base de alunos','Deployed'),('P02.04 Receita / lead','Deployed'),('AC01 % Execução dos rituais executivos de gestão','Ready for Review'),('P02 % Crescimento da base dentro do ICP','Implementation'),('P02.01 CAC PPG','To Do'),('P02.02 % de mix qualidade do MQL','Deployed'),('AC01.02 % de decisões dentro da alçada (DOA)','To Do'),('AC03 Saving financeiro por IA e automação','Implementation'),('AC03.01 Taxa de processos elegíveis com IA/automação embarcada (%)','Implementation'),('AC03.02 horas economizadas por automação e IA','Ready for Review'),('C01-a NPS contínuo da marca','Planning'),('C01-a.01 CSAT da prática / imersão','Deployed'),('C.02-a.04 % Aumento do Faturamento do Aluno','To Do'),('C.02-a.04 % Aumento da Percepção Atual de Carreira','To Do'),('P01 Taxa de Conclusão da Jornada do Aluno','Implementation'),('P03-a Cobertura de prática (% até x R$) para alunos','Ready for Review'),('P03.01 SLA de agendamento da prática','To Do'),('P03.02 Tempo de ramp-up de nova praça','To Do'),('P03.03 Qualidade da nova praça vs baseline','To Do'),('AC01.01 % 1:1 realizados (liderança)','To Do'),('AC02 Score de Maturidade de Liderança','Planning'),('AC02.01 eNPS','Planning'),('AC02.02 % líderes com PDI ativo','To Do'),('AC02.03 % cargos com JD atualizado','To Do'),('AC02.04 % de prestadores com treinamento obrigatório por funçao concluido','Planning'),('AC02.05 % posições-chave com sucessor mapeado','To Do'),('AC02.06 Turnover','To Do')) v(nome,st) WHERE i.origem='bsc' AND trim(i.nome)=v.nome;

CREATE OR REPLACE FUNCTION public.mt_tipo_apontamento_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF (NEW.tipo_apontamento IS DISTINCT FROM OLD.tipo_apontamento OR NEW.prazo_entrega IS DISTINCT FROM OLD.prazo_entrega) THEN
    IF coalesce(auth.role(),'')<>'service_role' AND NOT public.mt_is_governanca(auth.uid()) THEN RAISE EXCEPTION 'Só a Governança altera o tipo de apontamento'; END IF;
    INSERT INTO mt_auditoria(tabela,registro_id,campo,valor_anterior,valor_novo,alterado_por)
    VALUES ('mt_indicadores',NEW.id::text,'tipo_apontamento',OLD.tipo_apontamento||' '||coalesce(OLD.prazo_entrega::text,''),NEW.tipo_apontamento||' '||coalesce(NEW.prazo_entrega::text,''),auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_mt_tipo_apontamento BEFORE UPDATE ON public.mt_indicadores FOR EACH ROW EXECUTE FUNCTION public.mt_tipo_apontamento_guard();

CREATE OR REPLACE FUNCTION public.mt_audit_declaracao() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP='INSERT' OR (OLD.declaracao,OLD.justificativa,OLD.status_entrega,OLD.avanco_pct,OLD.evidencia) IS DISTINCT FROM (NEW.declaracao,NEW.justificativa,NEW.status_entrega,NEW.avanco_pct,NEW.evidencia) THEN
    IF NEW.declaracao IS NOT NULL OR NEW.status_entrega IS NOT NULL OR TG_OP='UPDATE' THEN
      INSERT INTO mt_auditoria(tabela,registro_id,competencia,campo,valor_anterior,valor_novo,alterado_por)
      VALUES ('mt_lancamentos',NEW.id::text,NEW.competencia,'apontamento',
        CASE WHEN TG_OP='UPDATE' THEN concat_ws(' | ',OLD.declaracao,OLD.status_entrega,OLD.avanco_pct::text,OLD.justificativa) END,
        concat_ws(' | ',NEW.declaracao,NEW.status_entrega,NEW.avanco_pct::text,NEW.justificativa),auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_mt_audit_declaracao AFTER INSERT OR UPDATE ON public.mt_lancamentos FOR EACH ROW EXECUTE FUNCTION public.mt_audit_declaracao();

DROP FUNCTION IF EXISTS public.rotina_situacoes_kpi();
CREATE FUNCTION public.rotina_situacoes_kpi()
 RETURNS TABLE(cadeira_id uuid, semana date, enviado_em timestamp with time zone, indicador_id text, situacao_atual text, ok boolean, plano_sem_iniciativa boolean, declaracao text, justificativa text, status_entrega text, avanco_pct numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
  SELECT c.cadeira_id, c.semana, c.enviado_em, k->>'indicador_id', NULLIF(k->>'situacao_atual', ''),
    CASE WHEN jsonb_typeof(k->'ok') = 'boolean' THEN (k->>'ok')::boolean END,
    (k->>'ok') = 'false' AND COALESCE(k->>'iniciativa_criada_id', '') = '',
    CASE WHEN k->>'declaracao' IN ('on','off') THEN k->>'declaracao' END, NULLIF(k->>'justificativa',''),
    CASE WHEN k->>'status_entrega' IN ('nao_iniciada','em_implantacao','implantada','atrasada','cancelada') THEN k->>'status_entrega' END,
    CASE WHEN (k->>'avanco_pct') ~ '^[0-9]+(\.[0-9]+)?$' THEN (k->>'avanco_pct')::numeric END
  FROM public.mt_checkins c, jsonb_array_elements(CASE WHEN jsonb_typeof(c.conteudo->'kpis_resposta') = 'array' THEN c.conteudo->'kpis_resposta' ELSE '[]'::jsonb END) k
  WHERE c.tipo = 'checkout' AND c.status = 'enviado'
    AND (COALESCE(k->>'situacao_atual', '') <> '' OR (k->>'ok') = 'false' OR COALESCE(k->>'declaracao','') <> '' OR COALESCE(k->>'status_entrega','') <> '')
    AND public.rotina_ve_todas(auth.uid())
$f$;
REVOKE EXECUTE ON FUNCTION public.rotina_situacoes_kpi() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rotina_situacoes_kpi() TO authenticated;

CREATE OR REPLACE FUNCTION public.rotina_conformidade(_de date, _ate date)
 RETURNS TABLE(cadeira_id uuid, semana date, status text, enviado_em timestamp with time zone, primeiro_envio_em text, completude jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
  SELECT c.cadeira_id, c.semana, c.status, c.enviado_em, c.conteudo->>'primeiro_envio_em', c.conteudo->'completude'
  FROM public.mt_checkins c
  WHERE c.tipo = 'checkout' AND c.semana BETWEEN _de AND _ate AND auth.uid() IS NOT NULL
    AND (public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR c.cadeira_id = public.mt_cadeira_do_usuario(auth.uid()))
$f$;
REVOKE EXECUTE ON FUNCTION public.rotina_conformidade(date,date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.rotina_conformidade(date,date) TO authenticated;