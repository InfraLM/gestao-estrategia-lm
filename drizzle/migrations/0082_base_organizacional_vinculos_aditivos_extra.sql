ALTER TABLE public.melhoria_business_case ADD COLUMN IF NOT EXISTS responsavel_pessoa_id uuid REFERENCES public.org_pessoas(id);
ALTER TABLE public.org_cadeiras ADD COLUMN IF NOT EXISTS pessoa_id uuid REFERENCES public.org_pessoas(id);
CREATE TRIGGER org_ficha_referencia BEFORE INSERT OR UPDATE ON public.org_cadeiras FOR EACH ROW EXECUTE FUNCTION public.org_referencia_guard('pessoa_id');
CREATE TRIGGER org_cargo_referencia BEFORE INSERT OR UPDATE ON public.org_organograma_cargos FOR EACH ROW EXECUTE FUNCTION public.org_referencia_guard('pessoa_id');
CREATE TRIGGER org_bc_referencia BEFORE INSERT OR UPDATE ON public.melhoria_business_case FOR EACH ROW EXECUTE FUNCTION public.org_referencia_guard('responsavel_pessoa_id');
CREATE OR REPLACE FUNCTION public.org_correspondencia_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE texto text;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.fonte,NEW.registro_id,NEW.campo,NEW.texto_original) IS DISTINCT FROM (OLD.fonte,OLD.registro_id,OLD.campo,OLD.texto_original) THEN RAISE EXCEPTION 'Texto e origem imutáveis'; END IF;
 IF NEW.status NOT IN ('sugerido','aprovado','rejeitado') THEN RAISE EXCEPTION 'Situação inválida'; END IF;
 IF NEW.confianca<0 OR NEW.confianca>1 THEN RAISE EXCEPTION 'Confiança inválida'; END IF;
 IF NEW.status='aprovado' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
 IF NEW.fonte NOT IN ('projetos','gov_acoes','org_organograma_cargos','org_cadeiras','mt_cadeiras','processos','decisoes_estrategicas','riscos_institucionais','mt_iniciativas','rotina_acoes_entrega','cronograma_itens','eap_itens') OR NEW.campo NOT IN ('diretor','gerente','responsavel_origem','ocupante_nome','diretor_nome','dono','responsavel','responsaveis','responsavel_nome') THEN RAISE EXCEPTION 'Origem/campo inválido'; END IF;
 EXECUTE format('SELECT %I::text FROM public.%I WHERE id::text=$1',NEW.campo,NEW.fonte) INTO texto USING NEW.registro_id;
 IF texto IS DISTINCT FROM NEW.texto_original THEN RAISE EXCEPTION 'Texto de origem mudou; revise antes de aprovar'; END IF;
 IF NEW.pessoa_id IS NULL AND NEW.cadeira_id IS NULL THEN RAISE EXCEPTION 'Correspondência sem candidato'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER org_correspondencia_validar BEFORE INSERT OR UPDATE ON public.org_correspondencias FOR EACH ROW EXECUTE FUNCTION public.org_correspondencia_guard();
CREATE OR REPLACE FUNCTION public.org_correspondencia_vinculo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.fonte='org_cadeiras' AND NEW.campo='ocupante_nome' AND NEW.status='aprovado' AND NEW.pessoa_id IS NOT NULL THEN UPDATE public.org_cadeiras SET pessoa_id=NEW.pessoa_id WHERE id::text=NEW.registro_id; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER org_correspondencia_ficha AFTER UPDATE ON public.org_correspondencias FOR EACH ROW EXECUTE FUNCTION public.org_correspondencia_vinculo();