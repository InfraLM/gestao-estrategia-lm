// @vitest-environment node
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const N='86f15c17-b6ca-4f09-acd4-41ae10a68012', I='6c3d08a8-be85-4a9c-a3f9-228218649069';
const pessoas=[
 ['Iuri Franco','iuri.franco@liberdademedicaedu.com.br','a647837e-aab2-40a8-b9a7-81a0e2e57684'],
 ['Yuri Ribeiro','yuri.ribeiro@liberdademedicaedu.com.br','27e2df35-ac37-42bd-9238-5dad25951e47'],
 ['Guilherme Vieira','guilherme.vieira@liberdademedicaedu.com.br','21ddd17a-49da-481b-a9ae-9eba78bd0b2b'],
 ['Bruno Garcia','bruno.garcia@liberdademedicaedu.com.br','c4c75eac-5263-4fec-91d6-59220769d4a2'],
 ['Felipe Souza','felipe.souza@liberdademedicaedu.com.br','ad7ac8c4-e4b2-40c9-989b-14206de9be8d'],
 ['Naira Yurie','naira.yurie@liberdademedicaedu.com.br','b12a1098-9c7f-4ed1-a194-b34c27254a4c'],
];
const uid=(i:number)=>i===5?N:`00000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`;
async function setup(){const p=new PGlite();await p.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
 CREATE TABLE mt_usuarios(user_id uuid,cadeira_id uuid,perfil text);
 CREATE TABLE mt_cadeiras(id uuid PRIMARY KEY,diretor_user_id uuid,ativo boolean);
 CREATE TABLE profiles(user_id uuid,display_name text,cargo text,departamento_id uuid);
 CREATE TABLE usuario_convites(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text,display_name text,cargo text,departamento_id uuid,acessos jsonb DEFAULT '{}',criado_por uuid,aceito_em timestamptz,user_id uuid);
 CREATE TABLE usuario_acessos(user_id uuid,modulo text,nivel text,atualizado_por uuid,updated_at timestamptz DEFAULT now(),PRIMARY KEY(user_id,modulo));
 GRANT SELECT ON usuario_acessos TO authenticated;`);
 for(const f of ['0058_pre_offsite_2027_privado.sql','0062_pre_offsite_cadeira_vinculada.sql','0070_pre_offsite_participantes_convites_isolados.sql'])await p.exec(readFileSync(`drizzle/migrations/${f}`,'utf8'));
 await p.exec(readFileSync('drizzle/migrations/0010_fase1_ampliar_modulos_e_convites.sql','utf8').split('\n').slice(2).join('\n'));
 for(const [i,[nome,email,cadeira]] of pessoas.entries()){
  await p.query('INSERT INTO mt_cadeiras VALUES($1,NULL,true)',[cadeira]);
  await p.query('INSERT INTO auth.users VALUES($1,$2,now())',[uid(i),email]);
  await p.query('INSERT INTO profiles(user_id,display_name) VALUES($1,$2)',[uid(i),nome]);
  await p.query('INSERT INTO offsite_participantes(email,nome,cadeira_id) VALUES($1,$2,$3)',[email,nome,cadeira]);
 }
 await p.exec(`INSERT INTO auth.users VALUES('${I}','ian.camilo@liberdademedicaedu.com.br',now());INSERT INTO profiles(user_id,display_name) VALUES('${I}','Ian');INSERT INTO mt_usuarios VALUES('${I}','11277b35-3559-44dc-8ae7-739692906d9e','diretor');INSERT INTO mt_cadeiras VALUES('11277b35-3559-44dc-8ae7-739692906d9e','${I}',true);INSERT INTO offsite_admins VALUES('${N}'),('${I}');`);
 return p;}
const como=(p:PGlite,u:string)=>p.exec(`RESET ROLE;SELECT set_config('test.uid','${u}',false);SET ROLE authenticated`);
describe('Pré-Offsite · seis respondentes e admins independentes',()=>{
 it.each(pessoas.map((p,i)=>({nome:p[0],cadeira:p[2],i})))('$nome tem a cadeira indicada e só salva/lê a própria resposta',async({cadeira,i})=>{const p=await setup();try{
  await como(p,uid(i));const a=(await p.query<any>('SELECT offsite_acesso() a')).rows[0].a;expect(a.permitido).toBe(true);expect(a.cadeira_id).toBe(cadeira);expect(a.admin).toBe(i===5);
  await p.query(`SELECT offsite_salvar('{"0.1":"Fictício"}',0,false)`);expect((await p.query<any>('SELECT user_id,cadeira_id FROM offsite_respostas')).rows).toEqual([{user_id:uid(i),cadeira_id:cadeira}]);
  if(i!==5){await como(p,uid((i+1)%5));expect((await p.query('SELECT * FROM offsite_respostas')).rows).toHaveLength(0);}
  await p.exec('RESET ROLE');expect((await p.query('SELECT * FROM mt_usuarios WHERE user_id<>$1',[I])).rows).toHaveLength(0);expect((await p.query('SELECT * FROM usuario_acessos')).rows).toHaveLength(0);
 }finally{await p.close()}},30000);
 it('Ian permanece admin sem resposta, mesmo vinculado à cadeira CEO',async()=>{const p=await setup();try{await como(p,I);expect((await p.query<any>('SELECT offsite_acesso() a')).rows[0].a).toEqual({admin:true,permitido:true,cadeira_id:null});await expect(p.query(`SELECT offsite_salvar('{}',0,false)`)).rejects.toThrow(/sem cadeira/);expect((await p.query('SELECT * FROM offsite_respostas')).rows).toHaveLength(0);}finally{await p.close()}},30000);
 it('Naira responde e aparece para ambos os admins, sem alterar seu perfil de governança',async()=>{const p=await setup();try{await p.exec(`INSERT INTO mt_usuarios VALUES('${N}','${pessoas[5][2]}','governanca')`);await como(p,N);await p.query(`SELECT offsite_salvar('{}',0,false)`);await como(p,I);expect((await p.query<any>('SELECT nome FROM offsite_respostas')).rows).toEqual([{nome:'Naira Yurie'}]);expect((await p.query('SELECT * FROM offsite_participantes')).rows).toHaveLength(6);await p.exec('RESET ROLE');expect((await p.query<any>(`SELECT perfil FROM mt_usuarios WHERE user_id='${N}'`)).rows[0].perfil).toBe('governanca');}finally{await p.close()}},30000);
 it('convite existente aplica por conta verificada sem conceder rotina nem alterar acessos prévios',async()=>{const p=await setup();try{const u=uid(0);await p.exec(`INSERT INTO usuario_acessos(user_id,modulo,nivel) VALUES('${u}','pmo','leitura');INSERT INTO usuario_convites(id,email,display_name,cargo,acessos,criado_por) VALUES('00000000-0000-0000-0000-000000000099','${pessoas[0][1]}','Iuri Franco','CMO','{}','${N}')`);await como(p,u);await p.query(`SELECT aceitar_convite_usuario('00000000-0000-0000-0000-000000000099')`);await p.query(`SELECT aceitar_convite_usuario('00000000-0000-0000-0000-000000000099')`);expect((await p.query<any>('SELECT modulo,nivel FROM usuario_acessos')).rows).toEqual([{modulo:'pmo',nivel:'leitura'}]);expect((await p.query<any>('SELECT offsite_acesso() a')).rows[0].a.cadeira_id).toBe(pessoas[0][2]);}finally{await p.close()}},30000);
 it('e-mail não verificado ou diferente não autoriza resposta ou convite',async()=>{const p=await setup();try{await p.query('UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1',[uid(0)]);await como(p,uid(0));expect((await p.query<any>('SELECT offsite_acesso() a')).rows[0].a.permitido).toBe(false);await expect(p.query(`SELECT offsite_salvar('{}',0,false)`)).rejects.toThrow(/sem cadeira/);await p.exec(`RESET ROLE;INSERT INTO usuario_convites(id,email,display_name,acessos) VALUES('00000000-0000-0000-0000-000000000099','${pessoas[0][1]}','Iuri','{}')`);await como(p,uid(1));await expect(p.query(`SELECT aceitar_convite_usuario('00000000-0000-0000-0000-000000000099')`)).rejects.toThrow(/e-mail convidado/);}finally{await p.close()}},30000);
});