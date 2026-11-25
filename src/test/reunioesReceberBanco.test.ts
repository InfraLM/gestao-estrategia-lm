// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ErroContrato, LIMITE_BYTES, tokenConfere, validarReuniao } from "../../supabase/functions/reunioes-receber/validar";

const db = new PGlite();
const tabelas = ["reun_reunioes", "reun_participantes", "reun_pauta", "reun_deliberacoes", "reun_acoes", "reun_recebimentos"];
const uid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const dados = {
  id: "teste-reuniao", titulo: "Reunião fictícia", inicio: "2026-11-25T15:00:00Z", atualizado_em: "2026-11-25T16:00:00Z",
  participantes: [{ chave: "exemplo", nome: "Pessoa fictícia" }],
  pauta: [{ ordem: 1, titulo: "Pauta fictícia" }],
  deliberacoes: [{ origem_id: "d1", titulo: "Deliberação fictícia" }],
  acoes: [{ origem_id: "a1", titulo: "Ação fictícia", status: "aberta", prioridade: "alta" }],
};
const receber = async (valor: unknown) => (await db.query<{ resultado: string }>("SELECT public.reun_receber($1::jsonb) AS resultado", [JSON.stringify(valor)])).rows[0]?.resultado;
const como = async (role: string, n = 0) => {
  await db.exec(`RESET ROLE; SET app.uid = '${uid(n)}'; SET app.role = '${role}'; SET ROLE ${role};`);
};

beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('app.uid')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('app.role') $$;
    CREATE FUNCTION public.proj_gov_ou_ceo(_uid uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT _uid IN ('${uid(1)}'::uuid, '${uid(2)}'::uuid) $$;
    GRANT USAGE ON SCHEMA auth TO authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;`);
  await db.exec(readFileSync("drizzle/migrations/0129_integracao_reunioes_ti.sql", "utf8").split("--> statement-breakpoint").join(""));
  await como("service_role");
  expect(await receber(dados)).toBe("gravado");
});
afterAll(() => db.close());

describe("reuniões TI: gravação e acesso isolados", () => {
  it("as seis tabelas têm RLS ligado", async () => {
    await db.exec("RESET ROLE");
    const r = await db.query<{ relname: string; relrowsecurity: boolean }>("SELECT relname, relrowsecurity FROM pg_class WHERE relname = ANY($1)", [tabelas]);
    expect(r.rows).toHaveLength(6);
    expect(r.rows.every(x => x.relrowsecurity)).toBe(true);
  });
  it.each([1, 2])("Governança/CEO (%s) leem todas as seis tabelas mas não gravam", async n => {
    await como("authenticated", n);
    for (const t of tabelas) {
      expect((await db.query(`SELECT * FROM public.${t}`)).rows).toHaveLength(1);
      const campo = t === "reun_recebimentos" ? "reuniao_id" : t === "reun_reunioes" ? "id" : "reuniao_id";
      expect((await db.query(`UPDATE public.${t} SET ${campo} = ${campo} RETURNING ${campo}`)).rows).toHaveLength(0);
      expect((await db.query(`DELETE FROM public.${t} RETURNING ${campo}`)).rows).toHaveLength(0);
    }
    expect((await db.query("UPDATE public.reun_reunioes SET titulo='Proibido' RETURNING id")).rows).toHaveLength(0);
    await expect(db.query("INSERT INTO public.reun_recebimentos(reuniao_id,resultado) VALUES ('proibido','proibido')")).rejects.toThrow(/row-level security/);
    expect((await db.query("DELETE FROM public.reun_reunioes RETURNING id")).rows).toHaveLength(0);
  });
  it("outro usuário não lê reuniões, e anon não tem leitura", async () => {
    await como("authenticated", 3);
    for (const t of tabelas) expect((await db.query(`SELECT * FROM public.${t}`)).rows).toHaveLength(0);
    await como("anon");
    for (const t of tabelas) await expect(db.query(`SELECT * FROM public.${t}`)).rejects.toThrow(/permission denied/);
  });
  it("somente service_role executa reun_receber", async () => {
    for (const role of ["anon", "authenticated"]) {
      await como(role, 1);
      await expect(receber(dados)).rejects.toThrow(/permission denied/);
    }
    await como("service_role");
    expect(await receber(dados)).toBe("gravado");
  });
  it("envio antigo é ignorado sem sobrescrever título", async () => {
    await como("service_role");
    expect(await receber({ ...dados, atualizado_em: "2026-11-25T15:59:00Z", titulo: "Antigo" })).toBe("ignorado_antigo");
    expect((await db.query<{ titulo: string }>("SELECT titulo FROM public.reun_reunioes")).rows[0]?.titulo).toBe("Reunião fictícia");
  });
  it("itens ausentes ficam removidos e reuniões excluídas continuam guardadas", async () => {
    await como("service_role");
    expect(await receber({ ...dados, atualizado_em: "2026-11-25T17:00:00Z", participantes: [], pauta: [], deliberacoes: [], acoes: [] })).toBe("gravado");
    for (const t of tabelas.slice(1, 5)) expect((await db.query<{ removido: boolean }>(`SELECT removido FROM public.${t}`)).rows).toEqual([{ removido: true }]);
    expect(await receber({ id: dados.id, atualizado_em: "2026-11-25T18:00:00Z", excluida: true })).toBe("excluida");
    expect((await db.query<{ excluida: boolean }>("SELECT excluida FROM public.reun_reunioes")).rows).toEqual([{ excluida: true }]);
  });
});

describe("respostas HTTP do código original em ambiente isolado", () => {
  // Valor exclusivamente fictício: nunca é armazenado como segredo nem enviado ao serviço publicado.
  const tokenFicticio = "token-ficticio-para-teste-isolado-0000";
  const handler = (token: string | undefined) => {
    let tratar: ((r: Request) => Promise<Response>) | undefined;
    const fonte = transformSync(readFileSync("supabase/functions/reunioes-receber/index.ts", "utf8").replace(/^import .*;\r?\n/gm, ""), { loader: "ts" }).code;
    new Function("Deno", "postgres", "ErroContrato", "LIMITE_BYTES", "tokenConfere", "validarReuniao", fonte)(
      { env: { get: (nome: string) => nome === "REUNIOES_INGEST_TOKEN" ? token : undefined }, serve: (fn: (r: Request) => Promise<Response>) => { tratar = fn; } },
      () => { throw new Error("Nenhuma gravação deve ocorrer"); }, ErroContrato, LIMITE_BYTES, tokenConfere, validarReuniao,
    );
    if (!tratar) throw new Error("Handler não registrado");
    return tratar;
  };
  it("sem configuração responde 503", async () => {
    expect((await handler(undefined)(new Request("https://teste.invalid", { method: "POST", body: "{}" }))).status).toBe(503);
  });
  it("com configuração, chamada sem token responde 401", async () => {
    expect((await handler(tokenFicticio)(new Request("https://teste.invalid", { method: "POST", body: "{}" }))).status).toBe(401);
  });
  it("com token, mas sem o banco de reuniões configurado, o GET de conferência responde 503 sem conectar", async () => {
    expect((await handler(tokenFicticio)(new Request("https://teste.invalid", { method: "GET", headers: { "x-integracao-token": tokenFicticio } }))).status).toBe(503);
  });
  it("métodos diferentes de GET e POST respondem 405", async () => {
    expect((await handler(tokenFicticio)(new Request("https://teste.invalid", { method: "PUT", body: "{}" }))).status).toBe(405);
  });
  it.each(["{}", "não é JSON"])("com token e corpo inválido %s responde 400", async body => {
    expect((await handler(tokenFicticio)(new Request("https://teste.invalid", { method: "POST", headers: { "x-integracao-token": tokenFicticio }, body }))).status).toBe(400);
  });
});