// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const c1 = '00000000-0000-4000-8000-000000000010', c2 = '00000000-0000-4000-8000-000000000011';
const u1 = '00000000-0000-4000-8000-000000000001', u2 = '00000000-0000-4000-8000-000000000002', semCad = '00000000-0000-4000-8000-000000000003';
const m0072 = readFileSync('drizzle/migrations/0072_rotina_impedimentos_sem_janela_sugestoes_ia.sql', 'utf8');
const funcJanela = m0072.slice(0, m0072.indexOf('CREATE OR REPLACE FUNCTION public.rotina_pendencias_antigas'));
const politica = m0072.slice(m0072.indexOf('DROP POLICY IF EXISTS "Leitura das entregas'));

describe('Ações do item 2 e impedimentos em banco isolado', () => {
  let pg: PGlite;
  const como = async (uid: string) => { await pg.exec(`RESET ROLE; SELECT set_config('test.uid','${uid}',false); SET ROLE authenticated;`); };
  const ler = async () => (await pg.query<{ cadeira_id: string }>('select cadeira_id from public.rotina_acoes_entrega order by cadeira_id')).rows.map((r) => r.cadeira_id);
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
    CREATE FUNCTION public.acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE FUNCTION public.mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
    CREATE FUNCTION public.proj_eh_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
    CREATE FUNCTION public.proj_principal(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
    CREATE TABLE public.mt_usuarios(user_id uuid,cadeira_id uuid);
    CREATE FUNCTION public.mt_cadeira_do_usuario(uuid) RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$SELECT cadeira_id FROM public.mt_usuarios WHERE user_id=$1$$;
    CREATE TABLE public.rotina_transparencia(id boolean PRIMARY KEY DEFAULT true, ativo boolean NOT NULL DEFAULT false); INSERT INTO public.rotina_transparencia VALUES(true,false);
    CREATE FUNCTION public.rotina_pode_ler_checkin(_cadeira uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
      SELECT public.mt_is_governanca(auth.uid()) OR public.proj_eh_ceo(auth.uid()) OR _cadeira = public.mt_cadeira_do_usuario(auth.uid())
      OR (public.mt_cadeira_do_usuario(auth.uid()) IS NOT NULL AND COALESCE((SELECT ativo FROM public.rotina_transparencia WHERE id), false)) $$;
    CREATE TABLE public.rotina_pendencias_gestao(tipo text,item_ref text,cadeira_id uuid,reativada_ciclo date,baixada_em timestamptz);
    CREATE TABLE public.rotina_acoes_entrega(id uuid DEFAULT gen_random_uuid(),cadeira_id uuid,projeto_id uuid,descricao text);
    GRANT SELECT ON public.rotina_acoes_entrega TO authenticated; ALTER TABLE public.rotina_acoes_entrega ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Leitura das entregas de ações" ON public.rotina_acoes_entrega FOR SELECT TO authenticated USING (true);
    INSERT INTO public.mt_usuarios VALUES('${u1}','${c1}'),('${u2}','${c2}');
    INSERT INTO public.rotina_acoes_entrega(cadeira_id,descricao) VALUES('${c1}','a'),('${c2}','b');`);
    await pg.exec(funcJanela.replace(/CREATE TABLE public\.rotina_pendencia_sugestoes[\s\S]*$/, ''));
    await pg.exec(politica);
  }, 30000);
  afterAll(async () => { await pg.close(); });

  it('transparência desligada: diretor vê só a própria cadeira; sem cadeira não vê nada', async () => {
    await como(u1); expect(await ler()).toEqual([c1]);
    await como(semCad); expect(await ler()).toEqual([]);
  });
  it('transparência ligada: diretores com cadeira veem as das outras cadeiras', async () => {
    await pg.exec('RESET ROLE; UPDATE public.rotina_transparencia SET ativo=true');
    await como(u1); expect(await ler()).toEqual([c1, c2]);
    await como(semCad); expect(await ler()).toEqual([]);
    await pg.exec('RESET ROLE; UPDATE public.rotina_transparencia SET ativo=false');
  });
  it('impedimentos ficam fora da janela; atas e prioridades continuam nela', async () => {
    await pg.exec('RESET ROLE');
    const q = async (t: string, ref = 'x') => (await pg.query<{ v: boolean }>(`select public.rotina_dentro_janela('${t}','${ref}','2026-01-05','2026-10-26') v`)).rows[0].v;
    expect(await q('impedimento')).toBe(true);
    expect(await q('ata')).toBe(false);
    expect(await q('prioridade')).toBe(false);
    await pg.exec(`INSERT INTO public.rotina_pendencias_gestao VALUES('impedimento','y',null,null,now())`);
    expect(await q('impedimento', 'y')).toBe(false);
  });
});
