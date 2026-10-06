create table public.base_submissoes (
  id uuid primary key default gen_random_uuid(),
  modulo text not null check (modulo in ('estrategia','okrs','pmo')),
  titulo text not null,
  descricao text,
  arquivo_nome text not null,
  arquivo_path text not null,
  arquivo_tipo text,
  arquivo_tamanho integer,
  contexto text,
  status text not null default 'pendente',
  resumo_ia text,
  erro text,
  submitted_by uuid not null,
  submitted_by_nome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.base_propostas_ia (
  id uuid primary key default gen_random_uuid(),
  submissao_id uuid not null references public.base_submissoes(id) on delete cascade,
  modulo text not null,
  entidade text not null,
  ref text not null,
  campo text not null,
  valor_atual text,
  valor_novo text not null,
  justificativa text,
  confianca numeric,
  status text not null default 'pendente',
  revisado_por uuid,
  revisado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.base_submissoes to authenticated;
grant select, update on public.base_propostas_ia to authenticated;
grant all on public.base_submissoes to service_role;
grant all on public.base_propostas_ia to service_role;
alter table public.base_submissoes enable row level security;
alter table public.base_propostas_ia enable row level security;

create or replace function public.can_review_modulo(_user_id uuid, _modulo text)
returns boolean language sql stable security definer set search_path = public as $$
  select has_role(_user_id,'super_admin') or has_role(_user_id,'admin') or has_role(_user_id,'pmo')
      or exists (select 1 from public.admin_modulos where user_id=_user_id and modulo=_modulo);
$$;

create policy "ler submissoes" on public.base_submissoes for select to authenticated using (true);
create policy "criar submissao propria" on public.base_submissoes for insert to authenticated with check (submitted_by = auth.uid());
create policy "atualizar submissao" on public.base_submissoes for update to authenticated using (submitted_by = auth.uid() or public.can_review_modulo(auth.uid(), modulo));
create policy "ler propostas" on public.base_propostas_ia for select to authenticated using (true);
create policy "revisar propostas" on public.base_propostas_ia for update to authenticated using (public.can_review_modulo(auth.uid(), modulo)) with check (public.can_review_modulo(auth.uid(), modulo));

create trigger trg_base_sub_updated before update on public.base_submissoes for each row execute function public.update_updated_at_column();
create trigger trg_base_prop_updated before update on public.base_propostas_ia for each row execute function public.update_updated_at_column();

alter publication supabase_realtime add table public.base_submissoes;
alter publication supabase_realtime add table public.base_propostas_ia;

create policy "base sub upload proprio" on storage.objects for insert to authenticated with check (bucket_id = 'base-submissoes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "base sub leitura" on storage.objects for select to authenticated using (bucket_id = 'base-submissoes');