create table public.conteudo_editavel (
  chave text primary key,
  valor jsonb not null,
  atualizado_por uuid,
  atualizado_por_nome text,
  updated_at timestamptz not null default now()
);
grant select on public.conteudo_editavel to authenticated;
grant insert, update on public.conteudo_editavel to authenticated;
grant all on public.conteudo_editavel to service_role;
alter table public.conteudo_editavel enable row level security;
create policy "ler conteudo" on public.conteudo_editavel for select to authenticated using (true);
create policy "inserir conteudo" on public.conteudo_editavel for insert to authenticated
  with check (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'admin') or has_role(auth.uid(),'pmo'));
create policy "editar conteudo" on public.conteudo_editavel for update to authenticated
  using (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'admin') or has_role(auth.uid(),'pmo'))
  with check (has_role(auth.uid(),'super_admin') or has_role(auth.uid(),'admin') or has_role(auth.uid(),'pmo'));
create trigger trg_conteudo_updated before update on public.conteudo_editavel
  for each row execute function update_updated_at_column();