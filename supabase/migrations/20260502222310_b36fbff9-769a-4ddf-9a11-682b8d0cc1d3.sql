
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'pmo', 'viewer');
CREATE TYPE public.wave_enum AS ENUM ('W1', 'W2', 'W3');
CREATE TYPE public.classificacao_enum AS ENUM ('Institucional', 'Melhoria Contínua', 'Melhoria Contínua com EPP', 'Novo Produto');
CREATE TYPE public.status_execucao_enum AS ENUM ('Backlog', 'A Iniciar', 'Em Andamento', 'Pausado', 'Atrasado', 'Concluído', 'Cancelado', 'Em Avaliação');
CREATE TYPE public.status_bc_enum AS ENUM ('Em Revisão', 'BC em Construção', 'Ativo EPP', 'Projeto Concluído', 'BC não aplicável', 'Sem BC', 'Adiado', 'Validado');
CREATE TYPE public.saude_enum AS ENUM ('On-Track', 'Alerta', 'Off-Track');
CREATE TYPE public.cronograma_status_enum AS ENUM ('Não Iniciado', 'Em Andamento', 'Concluído', 'Atrasado');
CREATE TYPE public.eap_status_enum AS ENUM ('Pendente', 'Em Andamento', 'Concluído', 'Bloqueado');

-- ========== UTILITY: updated_at trigger ==========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== PROJETOS ==========
CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  wave public.wave_enum NOT NULL DEFAULT 'W1',
  classificacao public.classificacao_enum NOT NULL DEFAULT 'Institucional',
  status public.status_execucao_enum NOT NULL DEFAULT 'Backlog',
  status_bc public.status_bc_enum NOT NULL DEFAULT 'Sem BC',
  saude public.saude_enum NOT NULL DEFAULT 'On-Track',
  diretor TEXT,
  gerente TEXT,
  budget NUMERIC(14,2) NOT NULL DEFAULT 0,
  realizado NUMERIC(14,2) NOT NULL DEFAULT 0,
  ice NUMERIC(4,1) NOT NULL DEFAULT 0,
  inicio TEXT,
  termino TEXT,
  objetivos TEXT[] NOT NULL DEFAULT '{}',
  krs TEXT[] NOT NULL DEFAULT '{}',
  avancos TEXT,
  causa_raiz TEXT,
  plano_acao TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projetos_codigo ON public.projetos(codigo);
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projetos_select_authenticated" ON public.projetos FOR SELECT TO authenticated USING (true);
CREATE POLICY "projetos_insert_pmo" ON public.projetos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE POLICY "projetos_update_pmo" ON public.projetos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE POLICY "projetos_delete_admin" ON public.projetos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_projetos_updated BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== CRONOGRAMA ==========
CREATE TABLE public.cronograma_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  fase TEXT NOT NULL,
  responsavel TEXT,
  data_prevista DATE,
  data_conclusao DATE,
  status public.cronograma_status_enum NOT NULL DEFAULT 'Não Iniciado',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cronograma_projeto ON public.cronograma_itens(projeto_id);
ALTER TABLE public.cronograma_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cron_select_authenticated" ON public.cronograma_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "cron_write_pmo" ON public.cronograma_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE TRIGGER trg_cron_updated BEFORE UPDATE ON public.cronograma_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== EAP ==========
CREATE TABLE public.eap_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  pacote TEXT NOT NULL,
  entregavel TEXT NOT NULL,
  responsavel TEXT,
  data_prevista DATE,
  data_conclusao DATE,
  status public.eap_status_enum NOT NULL DEFAULT 'Pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_eap_projeto ON public.eap_itens(projeto_id);
ALTER TABLE public.eap_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eap_select_authenticated" ON public.eap_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "eap_write_pmo" ON public.eap_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE TRIGGER trg_eap_updated BEFORE UPDATE ON public.eap_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== STATUS REPORTS ==========
CREATE TABLE public.status_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  avancos TEXT,
  desvios TEXT,
  saude public.saude_enum,
  causa_raiz TEXT,
  plano_acao TEXT,
  reportado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sr_projeto ON public.status_reports(projeto_id);
ALTER TABLE public.status_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_select_authenticated" ON public.status_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "sr_write_pmo" ON public.status_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE TRIGGER trg_sr_updated BEFORE UPDATE ON public.status_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== SUBMISSOES DE ENTREGAS ==========
CREATE TABLE public.entrega_submissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  eap_item_id UUID REFERENCES public.eap_itens(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo_arquivo TEXT,
  arquivo_path TEXT,
  arquivo_nome TEXT,
  arquivo_tamanho INTEGER,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sub_projeto ON public.entrega_submissoes(projeto_id);
CREATE INDEX idx_sub_eap ON public.entrega_submissoes(eap_item_id);
ALTER TABLE public.entrega_submissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_select_authenticated" ON public.entrega_submissoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "sub_insert_authenticated" ON public.entrega_submissoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "sub_update_own_or_pmo" ON public.entrega_submissoes FOR UPDATE TO authenticated
  USING (auth.uid() = submitted_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE POLICY "sub_delete_own_or_pmo" ON public.entrega_submissoes FOR DELETE TO authenticated
  USING (auth.uid() = submitted_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pmo'));
CREATE TRIGGER trg_sub_updated BEFORE UPDATE ON public.entrega_submissoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== STORAGE: bucket privado para entregas ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('entregas', 'entregas', false);

CREATE POLICY "entregas_select_authenticated" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'entregas');
CREATE POLICY "entregas_insert_authenticated" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'entregas' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "entregas_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'entregas' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "entregas_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'entregas' AND auth.uid()::text = (storage.foldername(name))[1]);
