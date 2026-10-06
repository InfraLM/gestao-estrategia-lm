-- Base compartilhada do Sistema de Metas 2S26
create or replace function public.mt_email_corporativo() returns boolean language sql stable set search_path = public as $$
  select coalesce(lower(auth.jwt()->>'email') like '%@liberdademedicaedu.com.br', false);
$$;

create table public.mt_cadeiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  diretor_user_id uuid,
  diretor_nome text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mt_usuarios (
  user_id uuid primary key,
  perfil text not null default 'diretor' check (perfil in ('diretor','governanca')),
  cadeira_id uuid references public.mt_cadeiras(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.mt_is_governanca(_uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select has_role(_uid,'super_admin') or has_role(_uid,'admin')
      or exists (select 1 from public.mt_usuarios where user_id=_uid and perfil='governanca');
$$;
create or replace function public.mt_cadeira_do_usuario(_uid uuid) returns uuid language sql stable security definer set search_path = public as $$
  select cadeira_id from public.mt_usuarios where user_id=_uid;
$$;
revoke execute on function public.mt_is_governanca(uuid) from anon, public;
revoke execute on function public.mt_cadeira_do_usuario(uuid) from anon, public;
grant execute on function public.mt_is_governanca(uuid) to authenticated;
grant execute on function public.mt_cadeira_do_usuario(uuid) to authenticated;

create table public.mt_objetivos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  perspectiva text not null,
  descricao text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mt_okrs (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  semestre text not null default '2026/2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mt_okr_objetivos (
  okr_id uuid not null references public.mt_okrs(id) on delete cascade,
  objetivo_id uuid not null references public.mt_objetivos(id) on delete cascade,
  primary key (okr_id, objetivo_id)
);

-- Indicadores: KPIs do BSC, KRs de OKR e metas da cesta (mesma estrutura, origem diferente)
create table public.mt_indicadores (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  origem text not null check (origem in ('bsc','okr','cesta')),
  objetivo_id uuid references public.mt_objetivos(id) on delete set null,
  okr_id uuid references public.mt_okrs(id) on delete set null,
  cadeira_id uuid references public.mt_cadeiras(id) on delete set null,
  unidade text,
  sentido text not null default 'maior' check (sentido in ('maior','menor')),
  peso numeric not null default 0 check (peso >= 0),
  status text not null default 'ativo' check (status in ('ativo','arquivado')),
  meta_semestre numeric,
  meta_texto text,
  parent_id uuid references public.mt_indicadores(id) on delete cascade,
  regra_consolidacao text not null default 'pior' check (regra_consolidacao in ('pior','media_ponderada')),
  peso_componente numeric,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mt_metas_mensais (
  id uuid primary key default gen_random_uuid(),
  indicador_id uuid not null references public.mt_indicadores(id) on delete cascade,
  competencia text not null check (competencia ~ '^\d{4}-\d{2}$'),
  meta_mes numeric,
  meta_acumulada numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (indicador_id, competencia)
);

create table public.mt_iniciativas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  okr_id uuid references public.mt_okrs(id) on delete set null,
  indicador_id uuid references public.mt_indicadores(id) on delete set null,
  objetivo_id uuid references public.mt_objetivos(id) on delete set null,
  cadeira_id uuid references public.mt_cadeiras(id) on delete set null,
  responsavel_user_id uuid,
  responsavel_nome text,
  prazo date,
  status text not null default 'a_iniciar' check (status in ('a_iniciar','em_andamento','concluida','cancelada')),
  comentario text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Grants
grant select, insert, update, delete on public.mt_cadeiras, public.mt_usuarios, public.mt_objetivos, public.mt_okrs,
  public.mt_okr_objetivos, public.mt_indicadores, public.mt_metas_mensais, public.mt_iniciativas to authenticated;
grant all on public.mt_cadeiras, public.mt_usuarios, public.mt_objetivos, public.mt_okrs,
  public.mt_okr_objetivos, public.mt_indicadores, public.mt_metas_mensais, public.mt_iniciativas to service_role;

alter table public.mt_cadeiras enable row level security;
alter table public.mt_usuarios enable row level security;
alter table public.mt_objetivos enable row level security;
alter table public.mt_okrs enable row level security;
alter table public.mt_okr_objetivos enable row level security;
alter table public.mt_indicadores enable row level security;
alter table public.mt_metas_mensais enable row level security;
alter table public.mt_iniciativas enable row level security;

-- Leitura: e-mail corporativo ou Governança. Escrita dos cadastros: só Governança.
do $$ declare t text; begin
  foreach t in array array['mt_cadeiras','mt_usuarios','mt_objetivos','mt_okrs','mt_okr_objetivos','mt_indicadores','mt_metas_mensais'] loop
    execute format('create policy "mt ler" on public.%I for select to authenticated using (public.mt_email_corporativo() or public.mt_is_governanca(auth.uid()))', t);
    execute format('create policy "mt gov escreve" on public.%I for all to authenticated using (public.mt_is_governanca(auth.uid())) with check (public.mt_is_governanca(auth.uid()))', t);
  end loop;
end $$;

-- Iniciativas: Governança tudo; diretor cria/edita as da própria cadeira; responsável edita as suas
create policy "mt ler" on public.mt_iniciativas for select to authenticated using (public.mt_email_corporativo() or public.mt_is_governanca(auth.uid()));
create policy "mt gov escreve" on public.mt_iniciativas for all to authenticated using (public.mt_is_governanca(auth.uid())) with check (public.mt_is_governanca(auth.uid()));
create policy "mt diretor cria" on public.mt_iniciativas for insert to authenticated
  with check (public.mt_email_corporativo() and cadeira_id = public.mt_cadeira_do_usuario(auth.uid()));
create policy "mt diretor edita" on public.mt_iniciativas for update to authenticated
  using (public.mt_email_corporativo() and (cadeira_id = public.mt_cadeira_do_usuario(auth.uid()) or responsavel_user_id = auth.uid()))
  with check (public.mt_email_corporativo() and (cadeira_id = public.mt_cadeira_do_usuario(auth.uid()) or responsavel_user_id = auth.uid()));

do $$ declare t text; begin
  foreach t in array array['mt_cadeiras','mt_usuarios','mt_objetivos','mt_okrs','mt_indicadores','mt_metas_mensais','mt_iniciativas'] loop
    execute format('create trigger trg_%s_upd before update on public.%I for each row execute function public.update_updated_at_column()', t, t);
  end loop;
end $$;