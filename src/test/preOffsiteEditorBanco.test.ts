// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
const D = '00000000-0000-0000-0000-000000000001', A = '00000000-0000-0000-0000-000000000002', C = '00000000-0000-0000-0000-000000000004';
const cfg = (extra: any[] = [], arquivada = false) => JSON.stringify({ versao: 'v3.13', blocos: Array(9).fill('b'), perguntas: [[{ id: '0.1', texto: 'a', ...(arquivada ? { arquivada: true } : {}) }], ...Array(8).fill(null).map((_, i) => i === 0 ? [{ id: '1.1', texto: 'x' }, ...extra] : [])], diretrizes: [], projetos: [{ id: 'p1', titulo: 'P' }], andamento: [], produtos: [], escolhas: [] });
async function setup() {
  const p = new PGlite();
  await p.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;CREATE TABLE mt_usuarios(user_id uuid,cadeira_id uuid,perfil text);CREATE TABLE mt_cadeiras(id uuid,diretor_user_id uuid,ativo boolean);CREATE TABLE profiles(user_id uuid,display_name text);INSERT INTO mt_usuarios VALUES('${D}','${C}','diretor');INSERT INTO profiles VALUES('${D}','Diretor fictício');`);
  for (const f of ['0058_pre_offsite_2027_privado', '0061_pre_offsite_promocao_nome', '0062_pre_offsite_cadeira_vinculada', '0063_pre_offsite_config_estavel', '0088_offsite_config_editor_estruturado']) await p.exec(readFileSync(`drizzle/migrations/${f}.sql`, 'utf8'));
  await p.exec(`INSERT INTO offsite_admins VALUES('${A}')`);
  await p.query(`INSERT INTO offsite_config(id,conteudo) VALUES('2027',$1::jsonb)`, [cfg()]);
  return p;
}
const como = (p: PGlite, u: string) => p.exec(`RESET ROLE;SELECT set_config('test.uid','${u}',false);SET ROLE authenticated`);
const base = async (p: PGlite) => (await p.query<any>(`SELECT atualizado_em FROM offsite_config WHERE id='2027'`)).rows[0].atualizado_em;

describe('Pré-Offsite · publicação do editor (banco isolado)', () => {
  it('gravação direta continua sem poder apagar ou trocar perguntas', async () => {
    const p = await setup(); try {
      await como(p, A);
      await expect(p.query(`UPDATE offsite_config SET conteudo=$1::jsonb WHERE id='2027'`, [cfg([{ id: '1.9', texto: 'n' }])])).rejects.toThrow(/Preserve/);
    } finally { await p.close(); }
  }, 30000);

  it('admin publica pergunta nova e arquivamento, migra resposta sem mudar status e registra histórico', async () => {
    const p = await setup(); try {
      await como(p, D); await p.query(`SELECT offsite_salvar('{"1.1":"velho"}',0,true)`);
      const r = (await p.query<any>('SELECT id,revisao,status,enviado_em FROM offsite_respostas')).rows[0];
      await como(p, A);
      await p.query(`SELECT offsite_config_publicar($1::jsonb,$2,$3::jsonb)`, [cfg([{ id: '1.9', texto: 'n' }], true), await base(p), JSON.stringify([{ id: r.id, revisao: r.revisao, respostas: { '1.1': 'novo' } }])]);
      const depois = (await p.query<any>('SELECT respostas,status,enviado_em,revisao FROM offsite_respostas')).rows[0];
      expect(depois.respostas).toEqual({ '1.1': 'novo' }); expect(depois.status).toBe('enviado'); expect(depois.enviado_em).toEqual(r.enviado_em); expect(depois.revisao).toBe(r.revisao + 1);
      const c = (await p.query<any>(`SELECT conteudo FROM offsite_config`)).rows[0].conteudo;
      expect(c.revisao_config).toBe(1); expect(c.perguntas[0][0].arquivada).toBe(true);
      const h = (await p.query<any>(`SELECT acao FROM offsite_historico ORDER BY criado_em`)).rows.map(x => x.acao);
      expect(h).toContain('migracao_config'); expect(h).toContain('publicacao_config');
    } finally { await p.close(); }
  }, 30000);

  it('publicação não apaga perguntas, recusa base desatualizada e não-admin', async () => {
    const p = await setup(); try {
      await como(p, A);
      const sem = JSON.parse(cfg()); sem.perguntas[1] = [];
      await expect(p.query(`SELECT offsite_config_publicar($1::jsonb,$2,'[]')`, [JSON.stringify(sem), await base(p)])).rejects.toThrow(/arquive/);
      await expect(p.query(`SELECT offsite_config_publicar($1::jsonb,now()-interval '1 day','[]')`, [cfg()])).rejects.toThrow(/outra pessoa/);
      await como(p, D);
      await expect(p.query(`SELECT offsite_config_publicar($1::jsonb,now(),'[]')`, [cfg()])).rejects.toThrow(/administradores/);
      await expect(p.query(`SELECT * FROM offsite_config_rascunhos`)).resolves.toMatchObject({ rows: [] });
    } finally { await p.close(); }
  }, 30000);
});
