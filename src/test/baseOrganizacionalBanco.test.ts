// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const uid = '00000000-0000-4000-8000-000000000001';
const cadeira = '00000000-0000-4000-8000-000000000002';
const projeto = '00000000-0000-4000-8000-000000000003';
async function setup() {
 const pg = new PGlite();
 await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${uid}'::uuid$$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT 'authenticated'$$;
 CREATE FUNCTION public.proj_gov_ou_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.gov',true),'false')='true' OR coalesce(current_setting('test.ceo',true),'false')='true'$$;
 CREATE FUNCTION public.mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.gov',true),'false')='true'$$;
 CREATE FUNCTION public.mt_cadeira_do_usuario(uuid) RETURNS uuid LANGUAGE sql AS $$SELECT '${cadeira}'::uuid$$;
 CREATE FUNCTION public.acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE TABLE mt_cadeiras(id uuid PRIMARY KEY,nome text,diretor_user_id uuid,diretor_nome text,ativo boolean DEFAULT true);
 CREATE TABLE mt_usuarios(user_id uuid,cadeira_id uuid);
 CREATE TABLE profiles(user_id uuid,display_name text,email text);
 CREATE TABLE org_organograma_cargos(id uuid PRIMARY KEY,nome text,ocupante_nome text,nivel text,parent_id uuid,mt_cadeira_id uuid,ativo boolean DEFAULT true);
 CREATE TABLE org_cadeiras(id uuid PRIMARY KEY,nome text);
 CREATE TABLE melhoria_business_case(id uuid PRIMARY KEY,responsavel text);
 CREATE TABLE projetos(id uuid PRIMARY KEY,diretor text,gerente text,cadeira_id uuid);
 CREATE TABLE mt_iniciativas(id uuid PRIMARY KEY,responsavel_nome text,cadeira_id uuid);
 CREATE TABLE rotina_acoes_entrega(id uuid PRIMARY KEY,responsavel text,cadeira_id uuid);
 CREATE TABLE cronograma_itens(id uuid PRIMARY KEY,responsavel text);
 CREATE TABLE eap_itens(id uuid PRIMARY KEY,responsavel text);
 CREATE TABLE gov_acoes(id uuid PRIMARY KEY,responsavel_origem text);
 CREATE TABLE processos(id text PRIMARY KEY,diretor text,dono text);
 CREATE TABLE decisoes_estrategicas(id uuid PRIMARY KEY,responsavel text);
 CREATE TABLE riscos_institucionais(id text PRIMARY KEY,responsaveis text);
 CREATE FUNCTION rotina_acao_salvar(uuid,uuid,date,jsonb) RETURNS rotina_acoes_entrega LANGUAGE sql AS $$SELECT NULL::rotina_acoes_entrega$$;
 INSERT INTO mt_cadeiras VALUES('${cadeira}','COO',NULL,'Yuri',true);
 INSERT INTO projetos VALUES('${projeto}','Yuri Ribeiro',NULL,'${cadeira}');
 INSERT INTO profiles VALUES('${uid}','Diretor teste','teste@example.invalid');
 SELECT set_config('test.gov','true',false);`);
 for (const f of ['0078_base_organizacional_pessoas_correspondencias.sql','0079_base_organizacional_projecoes_guardas.sql','0080_base_organizacional_leitura_minima_vinculos.sql','0081_base_organizacional_vigencia_sem_ambiguidade.sql','0082_base_organizacional_vinculos_aditivos_extra.sql','0083_base_organizacional_revisao_titulares.sql','0084_base_organizacional_iniciativa_referencia.sql']) await pg.exec(readFileSync(`drizzle/migrations/${f}`, 'utf8'));
 return pg;
}
const salvar = async (pg: PGlite, id: string | null = null, dados: Record<string, unknown> = {}) => (await pg.query<{ id: string }>('SELECT org_pessoa_salvar($1,$2::jsonb) id', [id, JSON.stringify({ nome: 'Yuri Garcia', aliases: ['Yuri Ribeiro'], cadeira_id: cadeira, vigencia_inicio: '2026-10-27', ...dados })])).rows[0].id;
describe('Base organizacional · banco isolado', () => {
 it('iniciativa preserva texto e cadeira; diretor não vincula iniciativa alheia', async () => { const pg=await setup();try { const p=await salvar(pg);await pg.query('INSERT INTO mt_iniciativas(id,responsavel_nome,cadeira_id) VALUES($1,$2,$3)',[projeto,'Yuri Ribeiro',cadeira]);await pg.query('SELECT org_iniciativa_vincular($1,$2)',[projeto,p]);const row=(await pg.query<any>('SELECT * FROM mt_iniciativas')).rows[0];expect(row.responsavel_pessoa_id).toBe(p);expect(row.responsavel_nome).toBe('Yuri Ribeiro');expect(row.cadeira_id).toBe(cadeira);await pg.exec("SELECT set_config('test.gov','false',false); UPDATE mt_iniciativas SET cadeira_id='00000000-0000-4000-8000-000000000099'");await expect(pg.query('SELECT org_iniciativa_vincular($1,$2)',[projeto,p])).rejects.toThrow('Sem permissão');}finally{await pg.close();}},30000);
 it('fonte alterada bloqueia aprovação; rejeitar aprovado retira só referência', async () => { const pg=await setup();try{const p=await salvar(pg);await pg.query(`INSERT INTO org_correspondencias(fonte,registro_id,campo,texto_original,pessoa_id) VALUES('projetos',$1,'diretor','Yuri Ribeiro',$2)`,[projeto,p]);await pg.exec("UPDATE projetos SET diretor='Outro texto'");await expect(pg.exec("SELECT org_correspondencia_revisar(ARRAY(SELECT id FROM org_correspondencias),'aprovar')")).rejects.toThrow('Texto de origem mudou');await pg.exec("UPDATE projetos SET diretor='Yuri Ribeiro'; SELECT org_correspondencia_revisar(ARRAY(SELECT id FROM org_correspondencias),'aprovar'); SELECT org_correspondencia_revisar(ARRAY(SELECT id FROM org_correspondencias),'rejeitar')");const row=(await pg.query<any>('SELECT * FROM projetos')).rows[0];expect(row.diretor_pessoa_id).toBeNull();expect(row.diretor).toBe('Yuri Ribeiro');}finally{await pg.close();}},30000);
 it('diretor não edita; Governança e CEO editam', async () => { const pg = await setup(); try { await pg.exec("SELECT set_config('test.gov','false',false)"); await expect(salvar(pg)).rejects.toThrow('Somente Governança/CEO'); await pg.exec("SELECT set_config('test.ceo','true',false)"); expect(await salvar(pg)).toBeTruthy(); } finally { await pg.close(); } }, 30000);
 it('sugestão não muda projeto; aprovação explícita grava só ID e preserva cadeira/texto', async () => { const pg = await setup(); try { const p = await salvar(pg); await pg.query(`INSERT INTO org_correspondencias(fonte,registro_id,campo,texto_original,pessoa_id) VALUES('projetos',$1,'diretor','Yuri Ribeiro',$2)`, [projeto,p]); expect((await pg.query<any>('SELECT diretor_pessoa_id FROM projetos')).rows[0].diretor_pessoa_id).toBeNull(); await pg.exec("SELECT org_correspondencia_revisar(ARRAY(SELECT id FROM org_correspondencias),'aprovar')"); const row = (await pg.query<any>('SELECT * FROM projetos')).rows[0]; expect(row.diretor).toBe('Yuri Ribeiro'); expect(row.diretor_pessoa_id).toBe(p); expect(row.cadeira_id).toBe(cadeira); expect((await pg.query<any>("SELECT status FROM org_correspondencias")).rows[0].status).toBe('aprovado'); } finally { await pg.close(); } }, 30000);
 it('mudança cargo/cadeira tem vigência e auditoria; não muda usuários', async () => { const pg = await setup(); try { const p = await salvar(pg); await salvar(pg,p,{ cadeira_id: null, vigencia_inicio: '2026-11-02' }); const v = (await pg.query<any>('SELECT * FROM org_vigencias ORDER BY inicio')).rows; expect(v).toHaveLength(2); expect(new Date(v[0].fim).toISOString().slice(0,10)).toBe('2026-11-02'); expect(v[1].cadeira_id).toBeNull(); expect((await pg.query('SELECT * FROM org_auditoria')).rows).toHaveLength(2); expect((await pg.query('SELECT * FROM mt_usuarios')).rows).toHaveLength(0); } finally { await pg.close(); } }, 30000);
 it('gestor próprio é negado; rejeitar não aprova nem muda legado', async () => { const pg = await setup(); try { const p = await salvar(pg); await expect(salvar(pg,p,{ gestor_id:p })).rejects.toThrow('Gestor'); await pg.query(`INSERT INTO org_correspondencias(fonte,registro_id,campo,texto_original,pessoa_id) VALUES('projetos',$1,'diretor','Yuri Ribeiro',$2)`,[projeto,p]); await pg.exec("SELECT org_correspondencia_revisar(ARRAY(SELECT id FROM org_correspondencias),'rejeitar')"); expect((await pg.query<any>('SELECT diretor_pessoa_id FROM projetos')).rows[0].diretor_pessoa_id).toBeNull(); expect((await pg.query<any>('SELECT status FROM org_correspondencias')).rows[0].status).toBe('rejeitado'); } finally { await pg.close(); } },30000);
 it('diretório mínimo não retorna e-mail nem gestor; auditoria somente administrativa', async () => { const pg=await setup(); try { await salvar(pg,null,{email:'privado@example.invalid'}); const d=(await pg.query<any>('SELECT org_diretorio() d')).rows[0].d; expect(d.pessoas[0]).not.toHaveProperty('email'); expect(d.pessoas[0]).not.toHaveProperty('gestor_id'); await pg.exec("SELECT set_config('test.gov','false',false); SET ROLE authenticated"); expect((await pg.query('SELECT * FROM org_auditoria')).rows).toHaveLength(0); expect((await pg.query('SELECT * FROM org_pessoas')).rows).toHaveLength(0); } finally {await pg.close();}},30000);
});