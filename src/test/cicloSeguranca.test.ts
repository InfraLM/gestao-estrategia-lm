// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { describe,it,expect } from 'vitest';
describe('Ciclo 26/10 · usuário sem cadeira',()=>{
 it('RLS fecha sem cadeira e preserva própria, Gov, CEO e transparência',async()=>{
 const pg=new PGlite();try{
 await pg.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '00000000-0000-0000-0000-000000000001'::uuid$$;
 CREATE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.gov',true),'false')='true'$$;
 CREATE FUNCTION proj_eh_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.ceo',true),'false')='true'$$;
 CREATE FUNCTION mt_cadeira_do_usuario(uuid) RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.cadeira',true),'')::uuid$$;
 CREATE TABLE rotina_transparencia(id boolean,ativo boolean);INSERT INTO rotina_transparencia VALUES(true,false);
 CREATE TABLE mt_checkins(cadeira_id uuid);INSERT INTO mt_checkins VALUES('00000000-0000-0000-0000-000000000010'),('00000000-0000-0000-0000-000000000011');
 GRANT SELECT ON mt_checkins TO authenticated;ALTER TABLE mt_checkins ENABLE ROW LEVEL SECURITY;CREATE POLICY baseline ON mt_checkins FOR SELECT TO authenticated USING(true);`);
 const sql=readFileSync('drizzle/migrations/0053_ciclo_diretores_vinculo_verificado_seguranca.sql','utf8');
 await pg.exec(sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.rotina_pode_ler_checkin')));
 await pg.exec('SET ROLE authenticated');expect((await pg.query('SELECT * FROM mt_checkins')).rows).toHaveLength(0);
 await pg.exec(`SELECT set_config('test.cadeira','00000000-0000-0000-0000-000000000010',false)`);expect((await pg.query('SELECT * FROM mt_checkins')).rows).toHaveLength(1);
 await pg.exec(`RESET ROLE;UPDATE rotina_transparencia SET ativo=true;SET ROLE authenticated`);expect((await pg.query('SELECT * FROM mt_checkins')).rows).toHaveLength(2);
 await pg.exec(`SELECT set_config('test.cadeira','',false)`);expect((await pg.query('SELECT * FROM mt_checkins')).rows).toHaveLength(0);
 await pg.exec(`SELECT set_config('test.gov','true',false)`);expect((await pg.query('SELECT * FROM mt_checkins')).rows).toHaveLength(2);
 await pg.exec(`SELECT set_config('test.gov','false',false);SELECT set_config('test.ceo','true',false)`);expect((await pg.query('SELECT * FROM mt_checkins')).rows).toHaveLength(2);
 }finally{await pg.close();}
 },30000);
});