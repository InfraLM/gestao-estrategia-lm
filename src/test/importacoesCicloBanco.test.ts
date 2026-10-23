// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { it,expect } from 'vitest';
it('modelo importa budget auditado, propõe centros e altera só metas selecionadas; falha reverte',async()=>{
 const id='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';const pg=new PGlite();try{
 await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${id}'::uuid$$;
 CREATE FUNCTION acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE FUNCTION mt_cadeira_do_usuario(uuid) RETURNS uuid LANGUAGE sql AS $$SELECT null::uuid$$;
 CREATE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.gov',true)='true'$$;
 CREATE FUNCTION proj_gov_ou_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.gov',true)='true'$$;
 CREATE FUNCTION portfolio_fonte_visivel(text,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE FUNCTION portfolio_pode_editar(text,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 CREATE TABLE mt_cadeiras(id uuid PRIMARY KEY,diretor_user_id uuid,ativo boolean);
 CREATE TABLE projetos(id uuid PRIMARY KEY,codigo text);INSERT INTO projetos VALUES('${id}','P001');
 CREATE TABLE mt_indicadores(id uuid PRIMARY KEY,origem text,status text,parent_id uuid,nome text);INSERT INTO mt_indicadores VALUES('${id}','bsc','ativo',null,'KPI'),('${other}','bsc','ativo',null,'KPI 2');
 CREATE TABLE mt_auditoria(tabela text,registro_id text,campo text,valor_anterior text,valor_novo text,alterado_por uuid);SET test.gov='true';`);
 await pg.exec(readFileSync('drizzle/migrations/0039_impacto_financeiro_orcamento.sql','utf8'));
 await pg.exec(readFileSync('drizzle/migrations/0040_orcamento_validacao_lotes.sql','utf8'));
 await pg.exec(readFileSync('drizzle/migrations/0055_preparacao_propostas_cadeiras_frequencia_importacoes.sql','utf8'));
 const rows=[{codigo:'P001',budget:1234.56,fonte:'BC aprovado',centros:['CC001','CC002']}];
 await pg.query('select orc_importar_modelo($1::jsonb,$2)',[JSON.stringify(rows),'modelo.xlsx']);
 expect((await pg.query<any>('select budget_liberado from orc_projeto_budget')).rows[0].budget_liberado).toBe('1234.56');
 expect((await pg.query('select status from orc_projeto_centros')).rows).toEqual([{status:'proposto'},{status:'proposto'}]);
 expect((await pg.query('select * from orc_auditoria')).rows.length).toBeGreaterThan(0);
 await expect(pg.query('select orc_importar_modelo($1::jsonb,$2)',[JSON.stringify([{...rows[0],budget:2000},{codigo:'UNKNOWN',budget:2,fonte:'BC'}]),'bad.xlsx'])).rejects.toThrow('desconhecido');
 expect((await pg.query<any>('select budget_liberado from orc_projeto_budget')).rows[0].budget_liberado).toBe('1234.56');
 await pg.query('select orc_importar_metas2030($1::jsonb,$2)',[JSON.stringify([{id,meta:'200 mi'}]),'arvore.xlsx']);
 expect((await pg.query('select id,meta_2030 from mt_indicadores order by id')).rows).toEqual([{id,meta_2030:'200 mi'},{id:other,meta_2030:null}]);
 expect((await pg.query<any>('select ok,registros from orc_sync_log order by iniciado_em')).rows).toEqual([{ok:true,registros:1},{ok:true,registros:1}]);
 }finally{await pg.close();}
},30000);