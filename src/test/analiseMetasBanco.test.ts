// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const k='00000000-0000-4000-8000-000000000001';
async function setup(){const pg=new PGlite();await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${k}'::uuid$$;CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT 'authenticated'$$;
CREATE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.gov',true)='true'$$;CREATE FUNCTION proj_eh_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.ceo',true)='true'$$;CREATE FUNCTION acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
CREATE TABLE mt_indicadores(id uuid PRIMARY KEY,origem text,tipo_apontamento text,prazo_entrega date,meta_semestre numeric,meta_texto text,unidade text,sentido text);
CREATE TABLE mt_metas_mensais(indicador_id uuid,competencia text,meta_mes numeric,UNIQUE(indicador_id,competencia));
CREATE TABLE mt_lancamentos(indicador_id uuid,valor numeric,declaracao text,justificativa text,status_entrega text,avanco_pct numeric,evidencia text);
CREATE TABLE mt_checkins(conteudo jsonb);
CREATE TABLE mt_auditoria(tabela text,registro_id text,campo text,valor_anterior text,valor_novo text,alterado_por uuid);
INSERT INTO mt_indicadores VALUES('${k}','cesta','valor_mensal',NULL,100,NULL,'%', 'maior');SELECT set_config('test.gov','true',false);`);await pg.exec(readFileSync('drizzle/migrations/0075_metas_tipos_analise_configuracao.sql','utf8'));await pg.exec('CREATE TRIGGER trg_mt_tipo_apontamento BEFORE UPDATE ON mt_indicadores FOR EACH ROW EXECUTE FUNCTION mt_tipo_apontamento_guard()');return pg;}
async function change(pg:PGlite,confirm=false,prior='valor_mensal',type='entrega'){return pg.query('SELECT mt_analise_configurar($1,$2::jsonb,$3,$4)',[k,JSON.stringify({tipo_apontamento:type,prazo_entrega:'2026-11-30',sentido:'maior',tolerancia:0}),prior,confirm]);}
describe('Cadastro análise · banco fictício',()=>{
 it('sem histórico permite configuração e audita de/para sem alterar valores',async()=>{const pg=await setup();try{await change(pg);expect((await pg.query<any>('SELECT tipo_apontamento FROM mt_indicadores')).rows[0].tipo_apontamento).toBe('entrega');expect((await pg.query("SELECT * FROM mt_auditoria WHERE campo='analise_configuracao'")).rows).toHaveLength(1);}finally{await pg.close()}},30000);
 it('histórico exige confirmação e preserva valor ao apontar E',async()=>{const pg=await setup();try{await pg.exec(`INSERT INTO mt_lancamentos(indicador_id,valor) VALUES('${k}',88)`);await expect(change(pg)).rejects.toThrow('Confirmação obrigatória');await change(pg,true);await pg.exec("UPDATE mt_lancamentos SET valor=NULL,status_entrega='em_implantacao'");expect(Number((await pg.query<any>('SELECT valor FROM mt_lancamentos')).rows[0].valor)).toBe(88);}finally{await pg.close()}},30000);
 it('diretor negado, CEO autorizado, BSC rejeitado, prazo obrigatório',async()=>{const pg=await setup();try{await pg.exec("SELECT set_config('test.gov','false',false)");await expect(change(pg)).rejects.toThrow('Somente Governança/CEO');await pg.exec("SELECT set_config('test.ceo','true',false)");await change(pg);await expect(change(pg,false)).rejects.toThrow('Tipo mudou');await pg.exec("UPDATE mt_indicadores SET origem='bsc'");await expect(change(pg,false,'entrega')).rejects.toThrow('BSC fora');}finally{await pg.close()}},30000);
});