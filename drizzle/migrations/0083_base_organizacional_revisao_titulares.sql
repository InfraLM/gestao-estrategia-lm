CREATE OR REPLACE FUNCTION public.org_correspondencia_vinculo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tabela text; coluna text;
BEGIN
 IF NEW.fonte='mt_cadeiras' AND NEW.campo='diretor_nome' AND NEW.status='aprovado' AND NEW.pessoa_id IS NOT NULL THEN UPDATE public.mt_cadeiras SET titular_pessoa_id=NEW.pessoa_id WHERE id::text=NEW.registro_id; END IF;
 IF NEW.fonte='org_cadeiras' AND NEW.campo='ocupante_nome' AND NEW.status='aprovado' AND NEW.pessoa_id IS NOT NULL THEN UPDATE public.org_cadeiras SET pessoa_id=NEW.pessoa_id WHERE id::text=NEW.registro_id; END IF;
 IF OLD.status='aprovado' AND NEW.status<>'aprovado' THEN
 tabela:=NULL;coluna:=NULL;
 IF NEW.fonte='projetos' AND NEW.campo IN ('diretor','gerente') THEN tabela:='projetos';coluna:=NEW.campo||'_pessoa_id';
 ELSIF NEW.fonte IN ('mt_iniciativas','rotina_acoes_entrega','cronograma_itens','eap_itens') AND NEW.campo IN ('responsavel','responsavel_nome') THEN tabela:=NEW.fonte;coluna:='responsavel_pessoa_id';
 ELSIF NEW.fonte IN ('org_cadeiras','org_organograma_cargos') AND NEW.campo='ocupante_nome' THEN tabela:=NEW.fonte;coluna:='pessoa_id';
 ELSIF NEW.fonte='mt_cadeiras' AND NEW.campo='diretor_nome' THEN tabela:='mt_cadeiras';coluna:='titular_pessoa_id'; END IF;
 IF tabela IS NOT NULL THEN EXECUTE format('UPDATE public.%I SET %I=NULL WHERE id::text=$1 AND %I=$2',tabela,coluna,coluna) USING NEW.registro_id,OLD.pessoa_id; END IF;
 END IF; RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.org_manutencao_auditar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.org_auditoria(entidade,registro_id,antes,depois,autor) VALUES(TG_TABLE_NAME,NEW.id::text,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END,to_jsonb(NEW),auth.uid()); RETURN NEW;
END $$;
CREATE TRIGGER org_cadeira_manutencao AFTER INSERT OR UPDATE ON public.mt_cadeiras FOR EACH ROW EXECUTE FUNCTION public.org_manutencao_auditar();
CREATE TRIGGER org_cargo_manutencao AFTER INSERT OR UPDATE ON public.org_organograma_cargos FOR EACH ROW EXECUTE FUNCTION public.org_manutencao_auditar();
CREATE TRIGGER org_ficha_manutencao AFTER INSERT OR UPDATE ON public.org_cadeiras FOR EACH ROW EXECUTE FUNCTION public.org_manutencao_auditar();