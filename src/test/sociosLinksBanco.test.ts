// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const NAIRA = '00000000-0000-0000-0000-0000000000aa';
const SETUP = `CREATE ROLE authenticated;CREATE ROLE anon;CREATE ROLE service_role;CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
CREATE TABLE public.socios_participantes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, nome_exibicao text NOT NULL, user_id uuid,
  respondente boolean NOT NULL DEFAULT true, pode_ver_consolidado boolean NOT NULL DEFAULT false, ativo boolean NOT NULL DEFAULT true, user_id_provisorio boolean NOT NULL DEFAULT false);
CREATE TABLE public.socios_links(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), participante_id uuid NOT NULL REFERENCES socios_participantes(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, criado_por uuid, criado_em timestamptz NOT NULL DEFAULT now(), expira_em timestamptz NOT NULL DEFAULT now()+interval '10 days', revogado_em timestamptz, ultimo_acesso_em timestamptz);
GRANT SELECT ON public.socios_links TO authenticated;ALTER TABLE public.socios_links ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.socios_respostas_2027(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE NOT NULL, status text NOT NULL DEFAULT 'rascunho', respostas jsonb, diretrizes jsonb, projetos jsonb, extras jsonb,
  versao int NOT NULL DEFAULT 0, enviado_em timestamptz, primeiro_envio_em timestamptz, reaberto_ate timestamptz, updated_at timestamptz);
CREATE TABLE public.socios_respostas_versoes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), resposta_id uuid, user_id uuid, versao int, respostas jsonb, diretrizes jsonb, projetos jsonb, extras jsonb, enviado_em timestamptz DEFAULT now());
CREATE TABLE public.conteudo_editavel(chave text, valor jsonb);
CREATE FUNCTION public.socios_pode_consolidar(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM public.socios_participantes WHERE user_id=_uid AND ativo AND pode_ver_consolidado)$$;
CREATE FUNCTION public.socios_prazo_aberto(_r timestamptz) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
CREATE FUNCTION public.socios_link_uid(_t text) RETURNS uuid LANGUAGE sql AS $$SELECT NULL::uuid$$;
CREATE FUNCTION public.socios_link_revogar(_p uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$BEGIN IF NOT public.socios_pode_consolidar(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF; UPDATE public.socios_links SET revogado_em=now() WHERE participante_id=_p AND revogado_em IS NULL; END$$;
INSERT INTO socios_participantes(email,nome_exibicao,user_id,respondente,pode_ver_consolidado) VALUES ('naira@x','Naira','${NAIRA}',true,true);
INSERT INTO socios_participantes(id,email,nome_exibicao) VALUES ('00000000-0000-0000-0000-0000000000b1','ficticio@gmail.com','Sócio Fictício');`;

async function banco() {
  const pg = new PGlite();
  await pg.exec(SETUP);
  await pg.exec(readFileSync('drizzle/migrations/0057_socios_links_painel_acessos.sql', 'utf8'));
  return pg;
}
const comoAnon = (pg: PGlite) => pg.exec(`SELECT set_config('test.uid','',false); SET ROLE anon`);
const comoNaira = (pg: PGlite) => pg.exec(`RESET ROLE; SELECT set_config('test.uid','${NAIRA}',false); SET ROLE authenticated`);
const FICT = '00000000-0000-0000-0000-0000000000b1';

describe('Links pessoais dos sócios', () => {
  it('link abre, salva e envia só o formulário do próprio sócio, registrando acessos', async () => {
    const pg = await banco();
    try {
      await comoNaira(pg);
      const tok = (await pg.query<{ t: string }>(`SELECT socios_link_gerar('${FICT}', now()+interval '5 days') t`)).rows[0].t;
      expect(tok).toMatch(/^[0-9a-f]{64}$/);
      expect((await pg.query<any>(`SELECT situacao FROM socios_links_painel() WHERE nome='Sócio Fictício'`)).rows[0].situacao).toBe('nao_abriu');
      await comoAnon(pg);
      const c = (await pg.query<any>(`SELECT socios_link_carregar('${tok}') j`)).rows[0].j;
      expect(c.participante.nome_exibicao).toBe('Sócio Fictício');
      expect(c.resposta).toBeNull();
      await pg.query(`SELECT socios_link_salvar('${tok}','{"a":1}','[]','[]','{}')`);
      await comoNaira(pg);
      expect((await pg.query<any>(`SELECT situacao FROM socios_links_painel() WHERE nome='Sócio Fictício'`)).rows[0].situacao).toBe('rascunho');
      await comoAnon(pg);
      await pg.query(`SELECT socios_link_enviar('${tok}')`);
      await comoNaira(pg);
      const p = (await pg.query<any>(`SELECT situacao, acessos, token FROM socios_links_painel() WHERE nome='Sócio Fictício'`)).rows[0];
      expect(p.situacao).toBe('enviado');
      expect(Number(p.acessos)).toBe(3);
      expect(p.token).toBe(tok);
      // Somente a resposta do sócio fictício existe; a da Naira não foi tocada.
      await pg.exec('RESET ROLE');
      expect((await pg.query(`SELECT * FROM socios_respostas_2027`)).rows).toHaveLength(1);
    } finally { await pg.close(); }
  }, 30000);

  it('novo link revoga o anterior; link revogado ou expirado não abre', async () => {
    const pg = await banco();
    try {
      await comoNaira(pg);
      const t1 = (await pg.query<{ t: string }>(`SELECT socios_link_gerar('${FICT}', now()+interval '5 days') t`)).rows[0].t;
      const t2 = (await pg.query<{ t: string }>(`SELECT socios_link_gerar('${FICT}', now()+interval '5 days') t`)).rows[0].t;
      await comoAnon(pg);
      await expect(pg.query(`SELECT socios_link_carregar('${t1}')`)).rejects.toThrow(/inválido/);
      await pg.query(`SELECT socios_link_carregar('${t2}')`);
      await pg.exec(`RESET ROLE; UPDATE socios_links SET expira_em = now() - interval '1 minute' WHERE revogado_em IS NULL`);
      await comoAnon(pg);
      await expect(pg.query(`SELECT socios_link_carregar('${t2}')`)).rejects.toThrow(/expirado/);
    } finally { await pg.close(); }
  }, 30000);

  it('sem permissão de consolidado não gera links nem lê tokens', async () => {
    const pg = await banco();
    try {
      await comoAnon(pg);
      await expect(pg.query(`SELECT socios_links_painel()`)).rejects.toThrow();
      await pg.exec(`RESET ROLE; SELECT set_config('test.uid','00000000-0000-0000-0000-0000000000cc',false); SET ROLE authenticated`);
      await expect(pg.query(`SELECT socios_link_gerar('${FICT}')`)).rejects.toThrow(/Sem permissão/);
      await expect(pg.query(`SELECT socios_links_painel()`)).rejects.toThrow(/Sem permissão/);
      await expect(pg.query(`SELECT token FROM socios_links`)).rejects.toThrow(/permission denied/);
    } finally { await pg.close(); }
  }, 30000);

  it('validade precisa ser futura e no máximo um ano', async () => {
    const pg = await banco();
    try {
      await comoNaira(pg);
      await expect(pg.query(`SELECT socios_link_gerar('${FICT}', now()-interval '1 day')`)).rejects.toThrow(/futura/);
      await expect(pg.query(`SELECT socios_link_gerar('${FICT}', now()+interval '400 days')`)).rejects.toThrow(/um ano/);
    } finally { await pg.close(); }
  }, 30000);
});
