// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const pessoas=[['Naira','naira.yurie@liberdademedicaedu.com.br',true,true,true],['Yuri','yuri.ribeiro@liberdademedicaedu.com.br',true,true,false],['Iuri','iuri.franco@liberdademedicaedu.com.br',true,true,false],['Ian','ian.camilo@liberdademedicaedu.com.br',false,true,true],['Cleto','rodrigocleto@hotmail.com',false,true,false],['Guilherme','guilherme.vieira@liberdademedicaedu.com.br',true,false,false],['Bruno','bruno.garcia@liberdademedicaedu.com.br',true,false,false],['Felipe','felipe.souza@liberdademedicaedu.com.br',true,false,false]] as const;
const id=(n:number)=>`00000000-0000-0000-0000-${String(n+1).padStart(12,'0')}`;
async function banco(){const p=new PGlite();await p.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;CREATE TABLE auth.users(id uuid,email text,email_confirmed_at timestamptz);CREATE TABLE profiles(user_id uuid,display_name text);CREATE TABLE mt_usuarios(user_id uuid,cadeira_id uuid,perfil text);CREATE TABLE mt_cadeiras(id uuid PRIMARY KEY,diretor_user_id uuid,ativo boolean);CREATE TABLE usuario_convites(id uuid PRIMARY KEY);`);
 await p.exec('GRANT USAGE ON SCHEMA auth TO authenticated;');
 for(const file of ['0058_pre_offsite_2027_privado.sql','0070_pre_offsite_participantes_convites_isolados.sql'])await p.exec(readFileSync(`drizzle/migrations/${file}`,'utf8'));
 const sql=readFileSync('drizzle/migrations/0008_socios_desejos_2027.sql','utf8');await p.exec(sql.replace(/INSERT INTO public\.socios_participantes[\s\S]*?CREATE TABLE public\.socios_respostas_2027/,'CREATE TABLE public.socios_respostas_2027'));
 for(const [i,[nome,email,off,socio,admin]] of pessoas.entries()){
  await p.query('INSERT INTO auth.users VALUES($1,$2,now())',[id(i),email]);await p.query('INSERT INTO profiles VALUES($1,$2)',[id(i),nome]);await p.query('INSERT INTO mt_cadeiras VALUES($1,$2,true)',[id(i+20),id(i)]);await p.query("INSERT INTO mt_usuarios VALUES($1,$2,'diretor')",[id(i),id(i+20)]);
  if(off)await p.query('INSERT INTO offsite_participantes(email,nome,cadeira_id) VALUES($1,$2,$3)',[email,nome,id(i+20)]);
  if(socio)await p.query('INSERT INTO socios_participantes(email,nome_exibicao,user_id,pode_ver_consolidado) VALUES($1,$2,$3,$4)',[email,nome,id(i),admin]);
  if(admin)await p.query('INSERT INTO offsite_admins VALUES($1)',[id(i)]);
 }
 await p.query("INSERT INTO socios_respostas_2027(user_id,respostas) VALUES($1,'{\"original\":true}')",[id(0)]);return p;}
describe('Separação dos dois formulários no servidor',()=>{
 it.each(pessoas.map((p,i)=>({nome:p[0],off:p[2],socio:p[3],admin:p[4],i})))('$nome tem exatamente a participação prevista',async({off,socio,admin,i})=>{const p=await banco();try{await p.exec(`SELECT set_config('test.uid','${id(i)}',false);SET ROLE authenticated`);const a=(await p.query<any>('SELECT offsite_acesso() a,socios_eh_respondente(auth.uid()) s')).rows[0];expect(a.a.admin).toBe(admin);expect(a.a.cadeira_id).toBe(off?id(i+20):null);expect(a.s).toBe(socio);
  if(!socio){expect((await p.query('SELECT * FROM socios_participantes')).rows).toHaveLength(0);expect((await p.query('SELECT * FROM socios_respostas_2027')).rows).toHaveLength(0);await expect(p.query('INSERT INTO socios_respostas_2027(user_id) VALUES($1)',[id(i)])).rejects.toThrow(/row-level security/);await expect(p.query('SELECT socios_enviar()')).rejects.toThrow(/Sem resposta/);}
  if(!off)await expect(p.query("SELECT offsite_salvar('{}',0,false)")).rejects.toThrow(/sem cadeira/);
  await p.exec('RESET ROLE');expect((await p.query<any>('SELECT nome FROM offsite_participantes ORDER BY nome')).rows.map(r=>r.nome)).toEqual(['Bruno','Felipe','Guilherme','Iuri','Naira','Yuri']);expect((await p.query<any>('SELECT respostas FROM socios_respostas_2027')).rows).toEqual([{respostas:{original:true}}]);
 }finally{await p.close()}},30000);
});