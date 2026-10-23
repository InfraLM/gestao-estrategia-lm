ALTER TABLE public.status_reports ADD COLUMN farois_dimensoes jsonb;
COMMENT ON COLUMN public.status_reports.farois_dimensoes IS 'Faróis dimensionais registrados neste report. NULL nos reports anteriores ou fluxos sem apontamento dimensional; não inferir histórico.';

CREATE OR REPLACE FUNCTION public.status_report_validar_farois()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE item jsonb;
BEGIN
  IF NEW.farois_dimensoes IS NOT NULL THEN
    IF jsonb_typeof(NEW.farois_dimensoes) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Faróis devem ser uma lista de dimensões';
    END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(NEW.farois_dimensoes) LOOP
      IF jsonb_typeof(item) IS DISTINCT FROM 'object'
        OR jsonb_typeof(item->'dimensao') IS DISTINCT FROM 'string'
        OR nullif(btrim(item->>'dimensao'),'') IS NULL
        OR coalesce(item->>'status','') NOT IN ('verde','amarelo','vermelho')
        OR jsonb_typeof(item->'obs') IS DISTINCT FROM 'string' THEN
        RAISE EXCEPTION 'Dimensão, farol e observação inválidos';
      END IF;
    END LOOP;
    IF (SELECT count(*) FROM jsonb_array_elements(NEW.farois_dimensoes)) <> (SELECT count(DISTINCT value->>'dimensao') FROM jsonb_array_elements(NEW.farois_dimensoes)) THEN
      RAISE EXCEPTION 'Dimensões de farol não podem se repetir';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER status_report_validar_farois BEFORE INSERT OR UPDATE OF farois_dimensoes ON public.status_reports FOR EACH ROW EXECUTE FUNCTION public.status_report_validar_farois();

CREATE OR REPLACE FUNCTION public.status_report_auditar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE anterior jsonb; atual jsonb := to_jsonb(NEW); campo_nome text;
BEGIN
  IF TG_OP='UPDATE' THEN
    anterior := to_jsonb(OLD);
  ELSE
    SELECT to_jsonb(s) INTO anterior FROM public.status_reports s
      WHERE s.projeto_id=NEW.projeto_id AND s.id<>NEW.id ORDER BY s.created_at DESC LIMIT 1;
  END IF;
  FOREACH campo_nome IN ARRAY ARRAY['periodo','avancos','desvios','saude','causa_raiz','plano_acao','farois_dimensoes'] LOOP
    IF (anterior->campo_nome) IS DISTINCT FROM (atual->campo_nome) THEN
      INSERT INTO public.mt_auditoria(tabela,registro_id,competencia,campo,valor_anterior,valor_novo,alterado_por)
      VALUES('status_reports',NEW.id::text,NEW.periodo,campo_nome,anterior->>campo_nome,atual->>campo_nome,auth.uid());
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.status_report_auditar() FROM PUBLIC;
CREATE TRIGGER status_report_auditar AFTER INSERT OR UPDATE ON public.status_reports FOR EACH ROW EXECUTE FUNCTION public.status_report_auditar();