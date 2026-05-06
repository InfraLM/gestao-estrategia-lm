
CREATE TABLE IF NOT EXISTS public.infra_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_custom_id text,
  task_external_id text,
  nome text NOT NULL,
  assignee text,
  status text NOT NULL DEFAULT 'BACKLOG',
  due_date date,
  classificacao text,
  categoria text,
  time_logged text,
  time_estimate text,
  sprint_semana date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.infra_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "infra_tasks_select_auth" ON public.infra_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "infra_tasks_write_pmo" ON public.infra_tasks FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR is_admin_of_modulo(auth.uid(),'infra_tech'))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'pmo'::app_role) OR is_admin_of_modulo(auth.uid(),'infra_tech'));

CREATE TRIGGER trg_infra_tasks_updated BEFORE UPDATE ON public.infra_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_infra_tasks_sprint ON public.infra_tasks(sprint_semana);
CREATE INDEX IF NOT EXISTS idx_infra_tasks_status ON public.infra_tasks(status);
