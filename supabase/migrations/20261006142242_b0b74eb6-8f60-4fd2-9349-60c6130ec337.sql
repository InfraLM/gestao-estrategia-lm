create table public.mt_competencias (
  competencia text primary key,
  estado text not null default 'aberto' check (estado in ('aberto','fechado','reaberto')),
  revisao int not null default 0,
  fechado_por uuid, fechado_em timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, insert, update on public.mt_competencias to authenticated;
grant all on public.mt_competencias to service_role;
alter table public.mt_competencias enable row level security;
create policy "mt ler" on public.mt_competencias for select to authenticated using (true);
create policy "mt gov" on public.mt_competencias for all to authenticated using (public.mt_is_governanca(auth.uid())) with check (public.mt_is_governanca(auth.uid()));
create trigger trg_mt_comp_upd before update on public.mt_competencias for each row execute function public.update_updated_at_column();
insert into public.mt_competencias (competencia) values ('2026-07'),('2026-08'),('2026-09'),('2026-10'),('2026-11'),('2026-12');

create or replace function public.mt_pode_lancar(_ind uuid, _comp text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from mt_competencias c where c.competencia=_comp and c.estado<>'fechado')
     and (mt_is_governanca(auth.uid()) or exists (select 1 from mt_indicadores i where i.id=_ind and i.cadeira_id = mt_cadeira_do_usuario(auth.uid())));
$$;

create table public.mt_lancamentos (
  id uuid primary key default gen_random_uuid(),
  indicador_id uuid not null references public.mt_indicadores(id) on delete cascade,
  competencia text not null,
  revisao int not null default 0,
  valor numeric,
  sem_medicao boolean not null default false,
  comentario text,
  updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (indicador_id, competencia, revisao)
);
grant select, insert, update on public.mt_lancamentos to authenticated;
grant all on public.mt_lancamentos to service_role;
alter table public.mt_lancamentos enable row level security;
create policy "mt ler" on public.mt_lancamentos for select to authenticated using (true);
create policy "mt inserir" on public.mt_lancamentos for insert to authenticated with check (public.mt_pode_lancar(indicador_id, competencia));
create policy "mt editar" on public.mt_lancamentos for update to authenticated using (public.mt_pode_lancar(indicador_id, competencia)) with check (public.mt_pode_lancar(indicador_id, competencia));
create trigger trg_mt_lanc_upd before update on public.mt_lancamentos for each row execute function public.update_updated_at_column();

create table public.mt_envios (
  cadeira_id uuid not null references public.mt_cadeiras(id) on delete cascade,
  competencia text not null,
  revisao int not null default 0,
  status text not null default 'rascunho' check (status in ('rascunho','enviado')),
  nota numeric,
  enviado_por uuid, enviado_por_nome text, enviado_em timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (cadeira_id, competencia, revisao)
);
grant select, insert, update on public.mt_envios to authenticated;
grant all on public.mt_envios to service_role;
alter table public.mt_envios enable row level security;
create policy "mt ler" on public.mt_envios for select to authenticated using (true);
create policy "mt gravar" on public.mt_envios for insert to authenticated with check (
  exists (select 1 from mt_competencias c where c.competencia=mt_envios.competencia and c.estado<>'fechado')
  and (public.mt_is_governanca(auth.uid()) or cadeira_id = public.mt_cadeira_do_usuario(auth.uid())));
create policy "mt atualizar" on public.mt_envios for update to authenticated using (
  exists (select 1 from mt_competencias c where c.competencia=mt_envios.competencia and c.estado<>'fechado')
  and (public.mt_is_governanca(auth.uid()) or cadeira_id = public.mt_cadeira_do_usuario(auth.uid())));
create trigger trg_mt_env_upd before update on public.mt_envios for each row execute function public.update_updated_at_column();

create table public.mt_auditoria (
  id uuid primary key default gen_random_uuid(),
  tabela text not null, registro_id text not null, competencia text,
  campo text not null, valor_anterior text, valor_novo text,
  alterado_por uuid, alterado_em timestamptz not null default now()
);
grant select on public.mt_auditoria to authenticated;
grant all on public.mt_auditoria to service_role;
alter table public.mt_auditoria enable row level security;
create policy "mt ler" on public.mt_auditoria for select to authenticated using (true);

create or replace function public.mt_audit_lanc() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op='INSERT' then
    insert into mt_auditoria(tabela,registro_id,competencia,campo,valor_anterior,valor_novo,alterado_por)
    values ('mt_lancamentos',new.id::text,new.competencia,'valor',null,case when new.sem_medicao then 'Sem medição' else new.valor::text end,auth.uid());
  elsif (old.valor is distinct from new.valor) or (old.sem_medicao is distinct from new.sem_medicao) then
    insert into mt_auditoria(tabela,registro_id,competencia,campo,valor_anterior,valor_novo,alterado_por)
    values ('mt_lancamentos',new.id::text,new.competencia,'valor',case when old.sem_medicao then 'Sem medição' else old.valor::text end,case when new.sem_medicao then 'Sem medição' else new.valor::text end,auth.uid());
  end if;
  if tg_op='UPDATE' and old.comentario is distinct from new.comentario then
    insert into mt_auditoria(tabela,registro_id,competencia,campo,valor_anterior,valor_novo,alterado_por)
    values ('mt_lancamentos',new.id::text,new.competencia,'comentario',old.comentario,new.comentario,auth.uid());
  end if;
  return new;
end $$;
revoke execute on function public.mt_audit_lanc() from public, anon, authenticated;
create trigger trg_mt_lanc_audit after insert or update on public.mt_lancamentos for each row execute function public.mt_audit_lanc();

-- Fechar / reabrir (só Governança). Reabrir cria nova revisão copiando a anterior.
create or replace function public.mt_fechar(_comp text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mt_is_governanca(auth.uid()) then raise exception 'Apenas Governança'; end if;
  update mt_competencias set estado='fechado', fechado_por=auth.uid(), fechado_em=now() where competencia=_comp;
end $$;
create or replace function public.mt_reabrir(_comp text) returns void language plpgsql security definer set search_path = public as $$
declare r int;
begin
  if not mt_is_governanca(auth.uid()) then raise exception 'Apenas Governança'; end if;
  select revisao into r from mt_competencias where competencia=_comp and estado='fechado';
  if r is null then raise exception 'Competência não está fechada'; end if;
  insert into mt_lancamentos(indicador_id,competencia,revisao,valor,sem_medicao,comentario,updated_by)
    select indicador_id,competencia,r+1,valor,sem_medicao,comentario,updated_by from mt_lancamentos where competencia=_comp and revisao=r;
  insert into mt_envios(cadeira_id,competencia,revisao,status,nota)
    select cadeira_id,competencia,r+1,'rascunho',nota from mt_envios where competencia=_comp and revisao=r;
  update mt_competencias set estado='reaberto', revisao=r+1 where competencia=_comp;
end $$;
revoke execute on function public.mt_fechar(text), public.mt_reabrir(text) from public, anon;
grant execute on function public.mt_fechar(text), public.mt_reabrir(text) to authenticated;