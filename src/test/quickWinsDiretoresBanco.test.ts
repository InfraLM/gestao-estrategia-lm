// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const LIDER = "00000000-0000-0000-0000-0000000000a1";
const LIDER_COM_PAPEL = "00000000-0000-0000-0000-0000000000a2";
const DIRETOR = "00000000-0000-0000-0000-0000000000d1";
const GOV = "00000000-0000-0000-0000-0000000000b1";
const SUPER = "00000000-0000-0000-0000-0000000000c1";
const OBJ = "00000000-0000-0000-0000-0000000000f1";
const m96 = readFileSync("drizzle/migrations/0096_quick_wins_policies_lider_restrito.sql", "utf8");
const abertas = [...m96.matchAll(/ALTER POLICY ("[^"]+"|\S+) ON public\.(\w+)/g)].map((m) => ({ policy: m[1], tabela: m[2] }));

async function como<T>(uid: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`SET ROLE authenticated; SET request.uid='${uid}';`);
  try { return await fn(); } finally { await db.exec("RESET ROLE; RESET request.uid;"); }
}
const rpc = (uid: string, sql: string) => como(uid, () => db.query(sql));

beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.uid',true),'')::uuid $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
    CREATE TYPE public.app_role AS ENUM ('admin','pmo','viewer','super_admin');
    CREATE TABLE public.user_roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, role app_role);
    CREATE TABLE public.mt_usuarios(user_id uuid PRIMARY KEY, perfil text, cadeira_id uuid);
    CREATE TABLE public.usuario_acessos(user_id uuid, modulo text, nivel text, atualizado_por uuid, updated_at timestamptz, UNIQUE(user_id, modulo));
    CREATE TABLE public.usuario_convites(id uuid PRIMARY KEY, email text, display_name text, cargo text, departamento_id uuid, acessos jsonb, aceito_em timestamptz, user_id uuid, criado_por uuid);
    CREATE TABLE public.profiles(user_id uuid PRIMARY KEY, display_name text, email text, cargo text, departamento_id uuid);
    CREATE TABLE public.org_cadeiras(id uuid PRIMARY KEY, nome text, ativo boolean DEFAULT true);
    CREATE TABLE public.org_organograma_cargos(id uuid PRIMARY KEY, nome text);
    CREATE TABLE public.org_pessoas(id uuid PRIMARY KEY, nome text, email text, cargo_id uuid, cadeira_id uuid, gestor_id uuid, user_id uuid, ativo boolean);
    CREATE TABLE public.mt_objetivos(id uuid PRIMARY KEY, codigo text, descricao text);
    CREATE TABLE public.mt_auditoria(id uuid DEFAULT gen_random_uuid(), tabela text, registro_id text, competencia text, campo text, valor_anterior text, valor_novo text, alterado_por uuid, alterado_em timestamptz DEFAULT now());
    CREATE FUNCTION public.has_role(u uuid, r app_role) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=u AND role=r) $$;
    CREATE FUNCTION public.is_super_admin(u uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT public.has_role(u,'super_admin') $$;
    CREATE FUNCTION public.mt_is_governanca(u uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT public.has_role(u,'super_admin') OR public.has_role(u,'admin') OR EXISTS(SELECT 1 FROM public.mt_usuarios WHERE user_id=u AND perfil='governanca') $$;
    CREATE FUNCTION public.proj_eh_ceo(u uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;
    GRANT USAGE ON SCHEMA public, auth TO authenticated;
    INSERT INTO public.mt_objetivos VALUES ('${OBJ}','F.01','Receita');
    INSERT INTO public.mt_usuarios VALUES ('${DIRETOR}','diretor',null), ('${GOV}','governanca',null);
    INSERT INTO public.user_roles(user_id, role) VALUES ('${SUPER}','super_admin'), ('${LIDER_COM_PAPEL}','viewer');`);
  // Recria as 36 policies abertas (qual = true) exatamente como estavam antes.
  for (const t of [...new Set(abertas.map((a) => a.tabela))].filter((t) => !["user_roles", "profiles", "mt_auditoria"].includes(t)))
    await db.exec(`CREATE TABLE public.${t}(id int); INSERT INTO public.${t} VALUES (1);`);
  await db.exec(`INSERT INTO public.profiles(user_id) VALUES ('${DIRETOR}');
    INSERT INTO public.mt_auditoria(tabela) VALUES ('seed');`);
  for (const a of abertas) await db.exec(`GRANT SELECT ON public.${a.tabela} TO authenticated; ALTER TABLE public.${a.tabela} ENABLE ROW LEVEL SECURITY; CREATE POLICY ${a.policy} ON public.${a.tabela} FOR SELECT TO authenticated USING (true);`);
  for (const f of ["0094_quick_wins_modulo", "0095_quick_wins_lider_restrito", "0096_quick_wins_policies_lider_restrito", "0097_quick_wins_contexto", "0098_quick_wins_diretores_areas", "0099_quick_wins_resolucao_rpcs", "0100_quick_wins_formulario_simplificado"])
    await db.exec(readFileSync(`drizzle/migrations/${f}.sql`, "utf8").split("--> statement-breakpoint").join(""));
  await db.exec(`INSERT INTO auth.users VALUES ('${LIDER}','lider@liberdademedicaedu.com.br',now()), ('${LIDER_COM_PAPEL}','antigo@liberdademedicaedu.com.br',now());
    INSERT INTO public.qw_lideres(email,nome,cargo,diretor_user_id) VALUES ('lider@liberdademedicaedu.com.br','Líder','coordenador','${DIRETOR}'),('antigo@liberdademedicaedu.com.br','Antigo','gerente','${DIRETOR}');`);
  await db.exec(`INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-0000000000e1','yuri.garcia@liberdademedicaedu.com.br',null), ('00000000-0000-0000-0000-0000000000e2','iancamilo@liberdademedicaedu.com.br',now());`);
  await db.exec(readFileSync("src/test/fixtures/quickWinsCarga26.sql", "utf8"));
  await rpc(LIDER, "SELECT public.qw_vincular()");
  await rpc(LIDER_COM_PAPEL, "SELECT public.qw_vincular()");
  await rpc(GOV, "SELECT public.qw_abrir_ciclo(id) FROM public.qw_ciclos WHERE ano=2026");
}, 60000);
afterAll(() => db.close());


const YURI = "00000000-0000-0000-0000-0000000000e1";
const emailId = async (email: string) => (await db.query<{id:string}>(`SELECT id FROM public.qw_lideres WHERE email='${email}@liberdademedicaedu.com.br'`)).rows[0].id;
const completo = { observacao: "O", acao_proposta: "A", investimento_estimado: "" };
describe("Quick Wins: diretores, áreas e carga", () => {
 it("carga inclui exatamente 26 pessoas e não duplica ao repetir", async () => {
  const n = async () => (await db.query<{n:number}>("SELECT count(*)::int n FROM public.qw_lideres WHERE revisao_pendente")).rows[0].n;
  expect(await n()).toBe(26); await db.exec(readFileSync("src/test/fixtures/quickWinsCarga26.sql","utf8")); expect(await n()).toBe(26);
  expect((await db.query("SELECT area_rotulo FROM public.qw_lider_diretores ORDER BY area_rotulo")).rows).toEqual([{area_rotulo:"Governança"},{area_rotulo:"Jurídico"}]);
 });
 it("cargo diretor sem papéis não é restrito e Yuri mantém todas as 36 leituras e acesso", async () => {
  expect((await db.query<{r:boolean}>(`SELECT public.is_lider_restrito('${YURI}') r`)).rows[0].r).toBe(false);
  for (const a of abertas) expect((await como(YURI,()=>db.query(`SELECT * FROM public.${a.tabela}`))).rows.length,a.tabela).toBeGreaterThan(0);
  expect((await db.query<{a:boolean}>(`SELECT public.acesso_modulo('${YURI}','estrategia') a`)).rows[0].a).toBe(true);
  expect((await db.query<{u:string}>(`SELECT user_id u FROM public.qw_lideres WHERE email='yuri.ribeiro@liberdademedicaedu.com.br'`)).rows[0].u).toBe(YURI);
 });
 it("cinco cargos são aceitos; outro continua restrito sem papel", async () => {
  for (const cargo of ['diretor','gerente','coordenador','supervisor','outro']) await db.exec(`INSERT INTO public.qw_lideres(email,nome,cargo) VALUES ('cargo${cargo}@liberdademedicaedu.com.br','Cargo','${cargo}')`);
  await db.exec(`INSERT INTO public.qw_lideres(email,nome,cargo,user_id) VALUES ('outroteste@liberdademedicaedu.com.br','Outro','outro','00000000-0000-0000-0000-000000000077')`);
  expect((await db.query<{r:boolean}>("SELECT public.is_lider_restrito('00000000-0000-0000-0000-000000000077') r")).rows[0].r).toBe(true);
 });
 it("e-mail com e sem ponto vincula no login verificado e cadastro recusa duplicado", async () => {
  expect((await db.query<{e:boolean}>("SELECT public.qw_email_chave('IAN.CAMILO@liberdademedicaedu.com.br')=public.qw_email_chave('iancamilo@liberdademedicaedu.com.br') e")).rows[0].e).toBe(true);
  const user='00000000-0000-0000-0000-000000000078';
  await db.exec("INSERT INTO public.qw_lideres(email,nome,cargo) VALUES ('teste.ponto@liberdademedicaedu.com.br','Ponto','gerente')");
  await db.exec(`INSERT INTO auth.users VALUES ('${user}','TESTEPONTO@liberdademedicaedu.com.br',null)`);
  expect((await rpc(user,"SELECT public.qw_vincular() v")).rows[0]).toEqual({v:false});
  await db.exec(`UPDATE auth.users SET email_confirmed_at=now() WHERE id='${user}'`);
  expect((await db.query<{u:string}>("SELECT user_id u FROM public.qw_lideres WHERE nome='Ponto'")).rows[0].u).toBe(user);
  await expect(rpc(GOV,`SELECT public.qw_lider_salvar(null,'{"email":"testeponto@liberdademedicaedu.com.br","nome":"Duplicado","cargo":"outro"}')`)).rejects.toThrow();
 });
 it("diretor_lider_id resolve depois do primeiro login e respeita precedência explícita", async () => {
  const lider=await emailId('veridiana.neves'); const iuri=await emailId('iuri.franco');
  expect((await db.query<{u:string|null}>(`SELECT public.qw_diretor_item('${lider}',null) u`)).rows[0].u).toBeNull();
  const u='00000000-0000-0000-0000-000000000079';
  await db.exec(`INSERT INTO auth.users VALUES ('${u}','iurifranco@liberdademedicaedu.com.br',now())`);
  expect((await db.query<{u:string}>(`SELECT public.qw_diretor_item('${lider}',null) u`)).rows[0].u).toBe(u);
  expect((await db.query<{u:string}>(`SELECT public.qw_resolver_diretor('${DIRETOR}','${iuri}') u`)).rows[0].u).toBe(DIRETOR);
  expect((await rpc(u,"SELECT public.qw_meu_perfil() p")).rows[0] as any).toMatchObject({p:{diretor:true,lider_restrito:false}});
 });
 it("dois diretores: Área obrigatória, RLS e triagem isoladas, avisos por item", async () => {
  const uid='00000000-0000-0000-0000-000000000080'; const lider=await emailId('marcya.santos');
  await db.exec(`INSERT INTO auth.users VALUES ('${uid}','marcyasantos@liberdademedicaedu.com.br',now())`);
  const areas=(await db.query<{id:string;area_rotulo:string}>(`SELECT id,area_rotulo FROM public.qw_lider_diretores WHERE lider_id='${lider}' ORDER BY area_rotulo`)).rows;
  await rpc(GOV,`SELECT public.qw_diretor_salvar('${areas[0].id}','${lider}','{"diretor_user_id":"${DIRETOR}"}')`);
  await rpc(GOV,`SELECT public.qw_diretor_salvar('${areas[1].id}','${lider}','{"diretor_lider_id":"${await emailId('yuri.ribeiro')}"}')`);
  const ids:string[]=[];
  for(let n=0;n<2;n++) ids.push(((await rpc(uid,"SELECT public.qw_salvar_item(null,'{}') id")).rows[0] as any).id);
  for(const id of ids) await rpc(uid,`SELECT public.qw_salvar_item('${id}','${JSON.stringify(completo)}')`);
  const envio=(await db.query<{id:string}>(`SELECT id FROM public.qw_envios WHERE lider_id='${lider}'`)).rows[0].id;
  await expect(rpc(uid,`SELECT public.qw_enviar('${envio}')`)).rejects.toThrow(/Área/);
  for(let n=0;n<2;n++) await rpc(uid,`SELECT public.qw_salvar_item('${ids[n]}','{"area_rotulo":"${areas[n].area_rotulo}"}')`);
  await rpc(uid,`SELECT public.qw_enviar('${envio}')`);
  expect((await como(DIRETOR,()=>db.query(`SELECT id FROM public.qw_itens WHERE envio_id='${envio}'`))).rows).toEqual([{id:ids[0]}]);
  expect((await como(YURI,()=>db.query(`SELECT id FROM public.qw_itens WHERE envio_id='${envio}'`))).rows).toEqual([{id:ids[1]}]);
  await expect(rpc(DIRETOR,`SELECT public.qw_triar('${ids[1]}','aprovar',null)`)).rejects.toThrow(/diretor/);
  await rpc(DIRETOR,`SELECT public.qw_triar('${ids[0]}','aprovar',null)`); await rpc(YURI,`SELECT public.qw_triar('${ids[1]}','ajustar','Revisar')`);
  expect((await como(YURI,()=>db.query("SELECT * FROM public.qw_avisos"))).rows).toHaveLength(0);
  expect((await db.query(`SELECT item_id FROM public.qw_avisos WHERE envio_id='${envio}' AND tipo='envio_diretor'`)).rows).toHaveLength(2);
  await expect(como(uid,()=>db.exec(`UPDATE public.qw_lider_diretores SET ativo=false WHERE lider_id='${lider}'`))).rejects.toThrow();
 });
 it("pendente permite preencher/enviar e atualiza após vincular; Ian segue Governança", async () => {
  const uid='00000000-0000-0000-0000-000000000081'; const lider=await emailId('rany.araujo');
  await db.exec(`INSERT INTO auth.users VALUES ('${uid}','rany.araujo@liberdademedicaedu.com.br',now())`);
  const id=((await rpc(uid,`SELECT public.qw_salvar_item(null,'${JSON.stringify(completo)}') id`)).rows[0] as any).id;
  const e=(await db.query<{envio_id:string}>(`SELECT envio_id FROM public.qw_itens WHERE id='${id}'`)).rows[0].envio_id;
  await rpc(uid,`SELECT public.qw_enviar('${e}')`);
  expect((await db.query<{a:boolean}>(`SELECT aguardando_diretor a FROM public.qw_envios WHERE id='${e}'`)).rows[0].a).toBe(true);
  await rpc(GOV,`SELECT public.qw_lider_salvar('${lider}','{"diretor_lider_id":"${await emailId('yuri.ribeiro')}"}')`);
  expect((await db.query<{a:boolean}>(`SELECT aguardando_diretor a FROM public.qw_envios WHERE id='${e}'`)).rows[0].a).toBe(false);
  const ian='00000000-0000-0000-0000-0000000000e2';
  const ii=((await rpc(ian,`SELECT public.qw_salvar_item(null,'${JSON.stringify(completo)}') id`)).rows[0] as any).id;
  const ie=(await db.query<{envio_id:string}>(`SELECT envio_id FROM public.qw_itens WHERE id='${ii}'`)).rows[0].envio_id;
  await rpc(ian,`SELECT public.qw_enviar('${ie}')`);
  expect((await db.query<{a:boolean}>(`SELECT aguardando_diretor a FROM public.qw_envios WHERE id='${ie}'`)).rows[0].a).toBe(false);
  await rpc(GOV,`SELECT public.qw_triar('${ii}','aprovar',null)`);
 });
});
