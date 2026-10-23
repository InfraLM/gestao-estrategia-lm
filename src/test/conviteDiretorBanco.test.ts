// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { it,expect } from 'vitest';
it('vínculo de diretor depende do e-mail verificado e não permite troca de cadeira',async()=>{
 const pg=new PGlite();try{
 await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '00000000-0000-0000-0000-000000000001'::uuid$$;
 CREATE TABLE mt_convites(email text PRIMARY KEY,perfil text,cadeira_id uuid);
 CREATE TABLE mt_cadeiras(id uuid PRIMARY KEY,ativo boolean,diretor_user_id uuid);
 CREATE TABLE mt_usuarios(user_id uuid PRIMARY KEY,perfil text,cadeira_id uuid);
 CREATE TABLE usuario_acessos(user_id uuid,modulo text,nivel text,UNIQUE(user_id,modulo));
 CREATE TABLE mt_auditoria(tabela text,registro_id text,campo text,valor_anterior text,valor_novo text,alterado_por uuid);
 INSERT INTO mt_cadeiras VALUES('00000000-0000-0000-0000-000000000010',true,null);
 INSERT INTO mt_convites VALUES('rodrigocleto@hotmail.com','diretor','00000000-0000-0000-0000-000000000010');`);
 const sql=readFileSync('drizzle/migrations/0053_ciclo_diretores_vinculo_verificado_seguranca.sql','utf8');await pg.exec(sql.slice(0,sql.indexOf('CREATE OR REPLACE FUNCTION public.rotina_pode_ler_checkin')));
 await pg.exec(`INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001','rodrigocleto@hotmail.com',null)`);
 expect((await pg.query('select * from mt_usuarios')).rows).toHaveLength(0);
 await pg.exec(`UPDATE auth.users SET email_confirmed_at=now() WHERE id='00000000-0000-0000-0000-000000000001'`);
 expect((await pg.query('select perfil,cadeira_id from mt_usuarios')).rows).toEqual([{perfil:'diretor',cadeira_id:'00000000-0000-0000-0000-000000000010'}]);
 expect((await pg.query('select modulo,nivel from usuario_acessos')).rows).toEqual([{modulo:'rotina',nivel:'edicao'}]);
 await pg.query('select mt_aceitar_meu_convite()');expect((await pg.query('select * from mt_auditoria')).rows).toHaveLength(1);
 await pg.exec(`INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000002','intruso@example.test',now())`);
 expect((await pg.query('select * from mt_usuarios')).rows).toHaveLength(1);
 }finally{await pg.close();}
},30000);