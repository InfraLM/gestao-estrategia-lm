// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { describe,it,expect } from 'vitest';
const id='00000000-0000-0000-0000-000000000001';
describe('Orçamento em banco isolado',()=>{
 it('acessos, importação atômica/idempotente, centro exclusivo confirmado e budget auditado',async()=>{
  const pg=new PGlite();await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${id}'::uuid$$;
   CREATE FUNCTION acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
   CREATE FUNCTION mt_cadeira_do_usuario(uuid) RETURNS uuid LANGUAGE sql AS $$SELECT null::uuid$$;
   CREATE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.gov',true)='true'$$;
   CREATE FUNCTION proj_gov_ou_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.gov',true)='true' OR current_setting('test.ceo',true)='true'$$;
   CREATE FUNCTION portfolio_fonte_visivel(text,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
   CREATE FUNCTION portfolio_pode_editar(text,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
   CREATE TABLE mt_cadeiras(id uuid,diretor_user_id uuid,ativo boolean);
   CREATE TABLE projetos(id uuid PRIMARY KEY);INSERT INTO projetos VALUES('${id}'),('00000000-0000-0000-0000-000000000002');
   CREATE TABLE mt_indicadores(id uuid PRIMARY KEY);SET test.gov='true';`);
  await pg.exec(readFileSync('drizzle/migrations/0039_impacto_financeiro_orcamento.sql','utf8'));await pg.exec(readFileSync('drizzle/migrations/0040_orcamento_validacao_lotes.sql','utf8'));
  await pg.exec('insert into orc_integracao_config(id,ativo) values(true,false)');
  const importRows=(rows:any[],mode='planilha')=>pg.query('select orc_importar($1::jsonb,$2,$3)',[JSON.stringify(rows),'test.csv',mode]);
  const row={centro_custo:'001',competencia:'2026-10',realizado:100,orcado:200};
  await importRows([row]);await importRows([{...row,realizado:120}]);expect((await pg.query<any>('select realizado from orc_realizado_espelho')).rows).toEqual([{realizado:'120'}]);
  await expect(importRows([row,row])).rejects.toThrow('duplicado');await expect(importRows([{...row,orcado:'errado'}])).rejects.toThrow('inválida');
  expect((await pg.query('select * from orc_sync_log')).rows).toHaveLength(2);
  await expect(importRows([row],'api')).rejects.toThrow('desligada');
  await pg.query('select orc_centro_salvar($1,$2,$3)',[id,'001','propor']);await pg.query('select orc_centro_salvar($1,$2,$3)',[id,'001','confirmar']);
  await pg.query('select orc_centro_salvar($1,$2,$3)',['00000000-0000-0000-0000-000000000002','001','propor']);
  await expect(pg.query('select orc_centro_salvar($1,$2,$3)',['00000000-0000-0000-0000-000000000002','001','confirmar'])).rejects.toThrow('orc_centro_unico');
  await pg.query('select orc_budget_salvar($1,$2,$3)',[id,100,'SR-001']);expect((await pg.query('select * from orc_auditoria')).rows.length).toBe(4);
  await pg.exec("SET test.gov='false';SET test.ceo='true'");await expect(importRows([row])).rejects.toThrow('permissão');await expect(pg.query('select orc_centro_salvar($1,$2,$3)',['00000000-0000-0000-0000-000000000002','001','confirmar'])).rejects.toThrow('Somente');
  await pg.exec("SET test.ceo='false';SET ROLE authenticated");expect((await pg.query('select * from orc_projeto_budget')).rows).toHaveLength(0);expect((await pg.query('select * from orc_realizado_espelho')).rows).toHaveLength(0);
  await pg.exec(`RESET ROLE;INSERT INTO mt_cadeiras VALUES('${id}','${id}',true);SET ROLE authenticated`);expect((await pg.query('select * from orc_projeto_budget')).rows).toHaveLength(1);
  await pg.close();
 });
});