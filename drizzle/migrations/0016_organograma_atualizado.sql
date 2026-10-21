CREATE TABLE public.org_organograma_cargos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 nome text NOT NULL,
 ocupante_nome text,
 nivel text NOT NULL DEFAULT 'outro',
 parent_id uuid REFERENCES public.org_organograma_cargos(id),
 ordem integer NOT NULL DEFAULT 0,
 ativo boolean NOT NULL DEFAULT true,
 fonte_celula text UNIQUE,
 texto_original text,
 observacoes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.org_organograma_cargos TO authenticated;
GRANT ALL ON public.org_organograma_cargos TO service_role;
ALTER TABLE public.org_organograma_cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY organograma_ler ON public.org_organograma_cargos FOR SELECT TO authenticated USING (public.fase1_acesso('estrutura', false));
CREATE POLICY organograma_inserir ON public.org_organograma_cargos FOR INSERT TO authenticated WITH CHECK (public.fase1_acesso('estrutura', true));
CREATE POLICY organograma_editar ON public.org_organograma_cargos FOR UPDATE TO authenticated USING (public.fase1_acesso('estrutura', true)) WITH CHECK (public.fase1_acesso('estrutura', true));
CREATE OR REPLACE FUNCTION public.org_validar_hierarquia() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(7263814);
 IF btrim(NEW.nome) = '' THEN RAISE EXCEPTION 'Informe o nome do cargo'; END IF;
 IF NEW.parent_id = NEW.id OR EXISTS (
 WITH RECURSIVE pais AS (
 SELECT id, parent_id FROM public.org_organograma_cargos WHERE id = NEW.parent_id
 UNION
 SELECT c.id, c.parent_id FROM public.org_organograma_cargos c JOIN pais p ON c.id = p.parent_id
 ) SELECT 1 FROM pais WHERE id = NEW.id
 ) THEN RAISE EXCEPTION 'A hierarquia não pode conter ciclos'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER org_organograma_validar BEFORE INSERT OR UPDATE ON public.org_organograma_cargos FOR EACH ROW EXECUTE FUNCTION public.org_validar_hierarquia();
CREATE TRIGGER org_organograma_atualizar BEFORE UPDATE ON public.org_organograma_cargos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();