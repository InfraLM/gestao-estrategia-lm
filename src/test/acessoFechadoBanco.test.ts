// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const sql = (f: string) => readFileSync(`drizzle/migrations/${f}.sql`, "utf8").split("--> statement-breakpoint").join("");
const restrito = async (n: number) => (await db.query<{ r: boolean }>(`SELECT public.is_lider_restrito('${u(n)}') r`)).rows[0].r;

beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT null::uuid $$;
    CREATE TABLE public.user_roles(user_id uuid, role text);
    CREATE TABLE public.mt_usuarios(user_id uuid);
    CREATE TABLE public.usuario_acessos(user_id uuid, modulo text, nivel text);
    CREATE TABLE public.usuario_convites(user_id uuid, aceito_em timestamptz);
    CREATE TABLE public.qw_lideres(user_id uuid, ativo boolean, cargo text);
    CREATE TABLE public.socios_participantes(user_id uuid, ativo boolean);
    CREATE TABLE public.offsite_admins(user_id uuid);
    CREATE TABLE public.offsite_participantes(email text, ativo boolean);
    INSERT INTO public.user_roles VALUES ('${u(1)}','admin'); INSERT INTO public.mt_usuarios VALUES ('${u(2)}');
    INSERT INTO public.qw_lideres VALUES ('${u(3)}',true,'gerente'),('${u(4)}',true,'diretor');
    INSERT INTO public.socios_participantes VALUES ('${u(5)}',true);`);
  await db.exec(sql("0111_acesso_fechado_contas_sem_cadastro"));
  await db.exec(sql("0112_acesso_geral_separado_socios"));
});
afterAll(() => db.close());

describe("acesso fechado para contas sem cadastro", () => {
  it("conta nova sem vínculo fica sem acesso geral e não liberada", async () => {
    expect(await restrito(9)).toBe(true);
    expect((await db.query<{ l: boolean }>(`SELECT public.usuario_liberado('${u(9)}') l`)).rows[0].l).toBe(false);
  });
  it("admin, usuário de metas e diretor-líder mantêm acesso geral", async () => {
    for (const n of [1, 2, 4]) expect(await restrito(n), String(n)).toBe(false);
  });
  it("líder comum continua restrito ao Quick Wins; sócio só nos módulos próprios", async () => {
    expect(await restrito(3)).toBe(true);
    expect(await restrito(5)).toBe(true);
    expect((await db.query<{ l: boolean }>(`SELECT public.usuario_liberado('${u(5)}') l`)).rows[0].l).toBe(true);
  });
  it("criar conta só com e-mail corporativo", async () => {
    await expect(db.exec(`INSERT INTO auth.users VALUES ('${u(20)}','x@gmail.com')`)).rejects.toThrow(/corporativo/);
    await db.exec(`INSERT INTO auth.users VALUES ('${u(21)}','Ana@LiberdadeMedicaEdu.com.br')`);
  });
});
