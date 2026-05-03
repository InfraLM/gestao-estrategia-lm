
-- Departamentos
CREATE TABLE IF NOT EXISTS public.departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  origem text NOT NULL DEFAULT 'manual', -- 'zeev' | 'manual'
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY dep_select_auth ON public.departamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY dep_insert_auth ON public.departamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY dep_update_admin ON public.departamentos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin'));
CREATE POLICY dep_delete_super ON public.departamentos FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'));

-- Seed de departamentos comuns
INSERT INTO public.departamentos (nome, origem) VALUES
  ('Acadêmico','manual'),('Comercial','manual'),('Marketing','manual'),
  ('Tecnologia','manual'),('Financeiro','manual'),('Jurídico','manual'),
  ('Pessoas','manual'),('Operações','manual'),('PMO','manual')
ON CONFLICT (nome) DO NOTHING;

-- Adiciona departamento ao perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS departamento_id uuid REFERENCES public.departamentos(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS departamento_nome text; -- texto bruto vindo do Zeev (para reconciliação)

-- Permite usuário visualizar todos os perfis (necessário para painel admin)
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;
CREATE POLICY profiles_select_all_auth ON public.profiles FOR SELECT TO authenticated USING (true);

-- Admin modulos: define quais módulos cada admin pode editar
CREATE TABLE IF NOT EXISTS public.admin_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  modulo text NOT NULL CHECK (modulo IN ('pmo','bpmo','estrategia','repositorios')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, modulo)
);
ALTER TABLE public.admin_modulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY am_select_auth ON public.admin_modulos FOR SELECT TO authenticated USING (true);
CREATE POLICY am_manage_super ON public.admin_modulos FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'super_admin'));

-- Função: admin de módulo (super_admin tem todos)
CREATE OR REPLACE FUNCTION public.is_admin_of_modulo(_user_id uuid, _modulo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT has_role(_user_id,'super_admin')
      OR EXISTS (SELECT 1 FROM public.admin_modulos WHERE user_id=_user_id AND modulo=_modulo);
$$;

-- Função: super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT has_role(_user_id,'super_admin');
$$;

-- Membros de projeto (usuários liberados manualmente para inputs em entregáveis)
CREATE TABLE IF NOT EXISTS public.projeto_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  user_id uuid NOT NULL,
  papel text NOT NULL DEFAULT 'colaborador', -- colaborador | observador
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE(projeto_id, user_id)
);
ALTER TABLE public.projeto_membros ENABLE ROW LEVEL SECURITY;

CREATE POLICY pm_select_auth ON public.projeto_membros FOR SELECT TO authenticated USING (true);
CREATE POLICY pm_manage_admin ON public.projeto_membros FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'pmo'));

CREATE OR REPLACE FUNCTION public.is_membro_projeto(_user_id uuid, _projeto_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projeto_membros WHERE user_id=_user_id AND projeto_id=_projeto_id);
$$;

-- Promove Naira a super_admin (mantém admin existente)
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'super_admin'::app_role FROM public.profiles WHERE email='naira.yurie@liberdademedicaedu.com.br'
ON CONFLICT (user_id, role) DO NOTHING;
