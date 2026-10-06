create table public.mt_convites (
  email text primary key,
  perfil text not null default 'diretor',
  cadeira_id uuid references public.mt_cadeiras(id),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.mt_convites to authenticated;
grant all on public.mt_convites to service_role;
alter table public.mt_convites enable row level security;
create policy "mt convites gov" on public.mt_convites for all to authenticated
  using (public.mt_is_governanca(auth.uid())) with check (public.mt_is_governanca(auth.uid()));

insert into public.mt_convites (email, perfil, cadeira_id) values
 ('marcya.santos@liberdademedicaedu.com.br','governanca','b12a1098-9c7f-4ed1-a194-b34c27254a4c'),
 ('ian.camilo@liberdademedicaedu.com.br','diretor','11277b35-3559-44dc-8ae7-739692906d9e'),
 ('yuri.ribeiro@liberdademedicaedu.com.br','diretor','27e2df35-ac37-42bd-9238-5dad25951e47'),
 ('bruno.garcia@liberdademedicaedu.com.br','diretor','c4c75eac-5263-4fec-91d6-59220769d4a2'),
 ('guilherme.vieira@liberdademedicaedu.com.br','diretor','21ddd17a-49da-481b-a9ae-9eba78bd0b2b'),
 ('iuri.franco@liberdademedicaedu.com.br','diretor','a647837e-aab2-40a8-b9a7-81a0e2e57684');

create or replace function public.mt_aplicar_convite() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select * into c from public.mt_convites where lower(email) = lower(new.email);
  if found then
    insert into public.mt_usuarios (user_id, perfil, cadeira_id) values (new.user_id, c.perfil, c.cadeira_id)
      on conflict (user_id) do update set perfil = excluded.perfil, cadeira_id = excluded.cadeira_id;
    if c.perfil = 'diretor' and c.cadeira_id is not null then
      update public.mt_cadeiras set diretor_user_id = new.user_id where id = c.cadeira_id;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.mt_aplicar_convite() from public, anon, authenticated;
create trigger trg_mt_aplicar_convite after insert on public.profiles
  for each row execute function public.mt_aplicar_convite();