// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('confirma convite sem falhar em quick_wins, preservando senha e acessos', async () => {
  const p = new PGlite();
  try {
    await p.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,encrypted_password text);
    CREATE TABLE usuario_convites(id uuid,email text,display_name text,cargo text,departamento_id uuid,acessos jsonb,criado_por uuid,aceito_em timestamptz,user_id uuid);
    CREATE TABLE profiles(user_id uuid,display_name text,cargo text,departamento_id uuid);
    CREATE TABLE usuario_acessos(user_id uuid,modulo text CONSTRAINT usuario_acessos_modulo_check CHECK(modulo IN('rotina')),nivel text,atualizado_por uuid,updated_at timestamptz,PRIMARY KEY(user_id,modulo));
    INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001','teste-diretor@example.test',null,'hash-preservado');
    INSERT INTO profiles(user_id) VALUES('00000000-0000-0000-0000-000000000001');
    INSERT INTO usuario_convites VALUES('00000000-0000-0000-0000-000000000002','teste-diretor@example.test','Diretor fictício','CFO',null,'{"rotina":"nenhum","quick_wins":"edicao"}','00000000-0000-0000-0000-000000000003',null,null);`);
    const source = readFileSync('drizzle/migrations/0095_quick_wins_lider_restrito.sql','utf8');
    await p.exec(source.slice(source.indexOf('CREATE OR REPLACE FUNCTION public.aplicar_convite_usuario()')));
    await p.exec(`CREATE TRIGGER convite AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION aplicar_convite_usuario();`);
    await expect(p.exec(`UPDATE auth.users SET email_confirmed_at=now()`)).rejects.toThrow(/check constraint/);
    await p.exec(readFileSync('drizzle/migrations/0102_convites_modulo_quick_wins_compativel.sql','utf8'));
    await p.exec(`UPDATE auth.users SET email_confirmed_at=now()`);
    expect((await p.query<{encrypted_password:string}>('SELECT encrypted_password FROM auth.users')).rows[0].encrypted_password).toBe('hash-preservado');
    expect((await p.query('SELECT modulo,nivel FROM usuario_acessos ORDER BY modulo')).rows).toEqual([{modulo:'quick_wins',nivel:'edicao'},{modulo:'rotina',nivel:'nenhum'}]);
    expect((await p.query<{aceito:boolean}>('SELECT aceito_em IS NOT NULL AS aceito FROM usuario_convites')).rows[0].aceito).toBe(true);
    await expect(p.exec(`INSERT INTO usuario_acessos(user_id,modulo,nivel) VALUES('00000000-0000-0000-0000-000000000099','inventado','edicao')`)).rejects.toThrow(/check constraint/);
  } finally { await p.close(); }
},30000);