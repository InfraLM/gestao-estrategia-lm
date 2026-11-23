// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const sql = (f: string) => readFileSync(`drizzle/migrations/${f}.sql`, "utf8").split("--> statement-breakpoint").join("");
const acesso = async (n: number, m: string, ed: boolean) =>
  (await db.query<{ r: boolean }>(`SELECT public.acesso_modulo('${u(n)}','${m}',${ed}) r`)).rows[0].r;

beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.uid', true),'')::uuid $$;
    CREATE TABLE public.usuario_acessos(user_id uuid, modulo text, nivel text, PRIMARY KEY(user_id, modulo));
    CREATE FUNCTION public.is_lider_restrito(_uid uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION public.is_super_admin(_uid uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION public.mt_is_governanca(_uid uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT _uid = '${u(1)}'::uuid $$;
    CREATE TABLE public.mt_auditoria(id int); INSERT INTO public.mt_auditoria VALUES (1);
    GRANT USAGE ON SCHEMA auth TO authenticated; GRANT SELECT ON public.mt_auditoria TO authenticated;
    ALTER TABLE public.mt_auditoria ENABLE ROW LEVEL SECURITY;
    INSERT INTO auth.users VALUES ('${u(2)}','felipe.rabello@liberdademedicaedu.com.br'),('${u(3)}','bruno.garcia@liberdademedicaedu.com.br');
    INSERT INTO public.usuario_acessos VALUES ('${u(2)}','pmo','leitura');`);
  await db.exec(sql("0114_acesso_modulo_fechado_padrao"));
  await db.exec(sql("0115_mt_auditoria_governanca"));
});
afterAll(() => db.close());

describe("acesso por módulo fechado por padrão", () => {
  it("membro sem linha não acessa nenhum módulo", async () => {
    expect(await acesso(9, "pmo", false)).toBe(false);
    expect(await acesso(9, "repositorios", false)).toBe(false);
  });
  it("linhas preservadas mantêm o nível e não sobrescrevem as existentes", async () => {
    expect(await acesso(2, "metas", true)).toBe(true);
    expect(await acesso(2, "pmo", true)).toBe(false);
    expect(await acesso(2, "repositorios", false)).toBe(true);
    expect(await acesso(2, "repositorios", true)).toBe(false);
    expect(await acesso(3, "repositorios", false)).toBe(true);
    expect(await acesso(3, "metas", false)).toBe(false);
  });
  it("auditoria só é lida pela Governança", async () => {
    const ler = async (n: number) => {
      await db.exec(`SET app.uid = '${u(n)}'; SET ROLE authenticated;`);
      const r = (await db.query(`SELECT * FROM public.mt_auditoria`)).rows.length;
      await db.exec(`RESET ROLE;`);
      return r;
    };
    expect(await ler(1)).toBe(1);
    expect(await ler(2)).toBe(0);
  });
});
