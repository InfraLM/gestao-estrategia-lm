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
  await rpc(LIDER, "SELECT public.qw_vincular()");
  await rpc(LIDER_COM_PAPEL, "SELECT public.qw_vincular()");
  await rpc(GOV, "SELECT public.qw_abrir_ciclo(id) FROM public.qw_ciclos WHERE ano=2026");
}, 60000);
afterAll(() => db.close());

describe("Quick Wins: regras no banco", () => {
  it("são 36 policies abertas alteradas", () => expect(abertas).toHaveLength(36));

  it("e-mail fora do domínio corporativo é recusado", async () => {
    await expect(db.exec(`INSERT INTO public.qw_lideres(email,nome,cargo) VALUES ('x@gmail.com','X','gerente')`)).rejects.toThrow();
  });

  it("classifica automaticamente e bloqueia o 11º item", async () => {
    const ids: string[] = [];
    for (let n = 0; n < 10; n++) ids.push((await rpc(LIDER, `SELECT public.qw_salvar_item(null, '{}'::jsonb) AS id`)).rows[0] as any);
    await expect(rpc(LIDER, `SELECT public.qw_salvar_item(null, '{}'::jsonb)`)).rejects.toThrow(/10/);
    const id = ((ids[0] as any).id) as string;
    const cls = async (d: object) => { await rpc(LIDER, `SELECT public.qw_salvar_item('${id}', '${JSON.stringify(d)}'::jsonb)`); return ((await db.query<{ c: string }>(`SELECT classificacao c FROM public.qw_itens WHERE id='${id}'`)).rows[0].c); };
    expect(await cls({ faixa_investimento: "5k_20k", aprovacao_necessaria: "diretor", prazo_resultado: "61_90" })).toBe("quick_win");
    expect(await cls({ faixa_investimento: "acima_20k" })).toBe("iniciativa_maior");
    expect(await cls({ faixa_investimento: "sem_custo", aprovacao_necessaria: "comite_ceo" })).toBe("iniciativa_maior");
    expect(await cls({ aprovacao_necessaria: "diretor", prazo_resultado: "acima_90" })).toBe("iniciativa_maior");
    // retirar um item libera vaga (cancelado, nunca apagado)
    await rpc(LIDER, `SELECT public.qw_cancelar_item('${(ids[9] as any).id}')`);
    await rpc(LIDER, `SELECT public.qw_salvar_item(null, '{}'::jsonb)`);
    expect((await db.query(`SELECT * FROM public.qw_itens`)).rows).toHaveLength(11);
  });

  it("envio exige campos obrigatórios; triagem exige comentário exceto aprovar", async () => {
    const envio = ((await db.query<{ id: string }>(`SELECT id FROM public.qw_envios`)).rows[0]).id;
    await expect(rpc(LIDER, `SELECT public.qw_enviar('${envio}')`)).rejects.toThrow(/obrigatórios/);
    const completo = { observacao: "O", acao_proposta: "A", investimento_estimado: "" };
    await db.exec(`UPDATE public.qw_itens SET status_execucao='cancelado' WHERE ordem>1`);
    const item = ((await db.query<{ id: string }>(`SELECT id FROM public.qw_itens WHERE ordem=1 AND status_execucao<>'cancelado'`)).rows[0]).id;
    await rpc(LIDER, `SELECT public.qw_salvar_item('${item}', '${JSON.stringify(completo)}'::jsonb)`);
    await rpc(LIDER, `SELECT public.qw_enviar('${envio}')`);
    await expect(rpc(LIDER, `SELECT public.qw_salvar_item('${item}', '{"titulo":"x"}'::jsonb)`)).rejects.toThrow(/ajustar/);
    await expect(rpc(DIRETOR, `SELECT public.qw_triar('${item}','devolver','')`)).rejects.toThrow(/Comentário/);
    await expect(rpc(LIDER, `SELECT public.qw_triar('${item}','aprovar',null)`)).rejects.toThrow(/diretor/);
    await rpc(DIRETOR, `SELECT public.qw_triar('${item}','aprovar',null)`);
    await rpc(GOV, "SELECT public.qw_fechar_ciclo(id) FROM public.qw_ciclos WHERE ano=2026");
    await expect(rpc(LIDER, `SELECT public.qw_atualizar_execucao('${item}','concluido','')`)).rejects.toThrow(/resultado/);
    await rpc(LIDER, `SELECT public.qw_atualizar_execucao('${item}','concluido','12')`);
    expect((await db.query(`SELECT 1 FROM public.mt_auditoria WHERE tabela='qw_itens' AND campo='status_triagem'`)).rows).toHaveLength(1);
  });

  it("líder restrito não lê nenhuma das 36 tabelas e só tem o módulo quick_wins", async () => {
    for (const a of abertas) expect((await como(LIDER, () => db.query(`SELECT * FROM public.${a.tabela}`))).rows, a.tabela).toHaveLength(0);
    const m = await db.query<{ q: boolean; e: boolean }>(`SELECT public.acesso_modulo('${LIDER}','quick_wins') q, public.acesso_modulo('${LIDER}','estrategia') e`);
    expect(m.rows[0]).toEqual({ q: true, e: false });
  });

  it("diretor, Governança, super_admin e líder com papel mantêm o acesso de antes", async () => {
    for (const uid of [DIRETOR, GOV, SUPER, LIDER_COM_PAPEL]) {
      for (const a of abertas) expect((await como(uid, () => db.query(`SELECT * FROM public.${a.tabela}`))).rows.length, `${uid} ${a.tabela}`).toBeGreaterThan(0);
      expect((await db.query<{ e: boolean }>(`SELECT public.acesso_modulo('${uid}','estrategia') e`)).rows[0].e).toBe(true);
    }
  });

  it("diretor só vê os próprios líderes; outro usuário não vê nada", async () => {
    expect((await como(DIRETOR, () => db.query(`SELECT * FROM public.qw_lideres`))).rows).toHaveLength(2);
    expect((await como("00000000-0000-0000-0000-000000000099", () => db.query(`SELECT * FROM public.qw_itens`))).rows).toHaveLength(0);
    expect((await como(LIDER, () => db.query(`SELECT * FROM public.qw_lideres`))).rows).toHaveLength(1);
  });
});
