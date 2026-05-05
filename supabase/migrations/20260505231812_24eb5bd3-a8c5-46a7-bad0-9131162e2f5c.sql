
DO $$ BEGIN
  CREATE TYPE public.categoria_estrategica_enum AS ENUM (
    'Crescimento de Receita',
    'Retenção e Experiência do Aluno',
    'Eficiência e Escala Operacional',
    'Fundação Tecnológica e Dados',
    'Marca e Posicionamento'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS categoria public.categoria_estrategica_enum;
