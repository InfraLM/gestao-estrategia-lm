alter table public.mt_envios add column if not exists primeiro_envio_em timestamptz, add column if not exists nota_original numeric;

create or replace function public.mt_envio_primeiro() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'enviado' and new.primeiro_envio_em is null then
    new.primeiro_envio_em := now(); new.nota_original := new.nota;
  end if;
  return new;
end $$;
create trigger trg_mt_envio_primeiro before insert or update on public.mt_envios for each row execute function public.mt_envio_primeiro();

create table public.mt_parametros (
  chave text primary key,
  valor jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.mt_parametros to authenticated;
grant all on public.mt_parametros to service_role;
alter table public.mt_parametros enable row level security;
create policy "mt ler" on public.mt_parametros for select to authenticated using (true);
create policy "mt gov" on public.mt_parametros for all to authenticated using (public.mt_is_governanca(auth.uid())) with check (public.mt_is_governanca(auth.uid()));
create trigger trg_mt_param_upd before update on public.mt_parametros for each row execute function public.update_updated_at_column();
insert into public.mt_parametros (chave, valor) values ('regua', '{"ativa": false, "faixas": [
  {"nome": "Crítico", "min": 0, "cor": "destructive"},
  {"nome": "Atenção", "min": 70, "cor": "warning"},
  {"nome": "No alvo", "min": 90, "cor": "success"},
  {"nome": "Superado", "min": 110, "cor": "info"}]}');

-- Formulário semanal (check-in / checkout) — base para o módulo semanal
create table public.mt_checkins (
  id uuid primary key default gen_random_uuid(),
  cadeira_id uuid not null references public.mt_cadeiras(id) on delete cascade,
  semana date not null,
  tipo text not null check (tipo in ('checkin','checkout')),
  status text not null default 'rascunho' check (status in ('rascunho','enviado')),
  conteudo jsonb not null default '{}'::jsonb,
  enviado_por uuid, enviado_por_nome text, enviado_em timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (cadeira_id, semana, tipo)
);
grant select, insert, update on public.mt_checkins to authenticated;
grant all on public.mt_checkins to service_role;
alter table public.mt_checkins enable row level security;
create policy "mt ler" on public.mt_checkins for select to authenticated using (true);
create policy "mt inserir" on public.mt_checkins for insert to authenticated with check (public.mt_is_governanca(auth.uid()) or cadeira_id = public.mt_cadeira_do_usuario(auth.uid()));
create policy "mt editar" on public.mt_checkins for update to authenticated using (public.mt_is_governanca(auth.uid()) or cadeira_id = public.mt_cadeira_do_usuario(auth.uid()));
create trigger trg_mt_checkins_upd before update on public.mt_checkins for each row execute function public.update_updated_at_column();