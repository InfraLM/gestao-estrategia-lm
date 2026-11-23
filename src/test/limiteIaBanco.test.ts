// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const sql = readFileSync("drizzle/migrations/0118_ia_limite_diario.sql", "utf8").split("--> statement-breakpoint").join("");
const chamar = async (n: number) => {
  await db.exec(`SET app.uid = '${u(n)}'; SET ROLE authenticated;`);
  const r = (await db.query<{ r: { permitido: boolean } }>(`SELECT public.ia_registrar_uso('diagnostico-ai') r`)).rows[0].r;
  await db.exec("RESET ROLE;");
  return r;
};
const chamarVezes = async (n: number, vezes: number) => { let ok = 0; for (let i = 0; i < vezes; i++) if ((await chamar(n)).permitido) ok++; return ok; };
const alertas = async (n: number) => (await db.query<{ tipo: string }>(`SELECT tipo FROM public.ia_uso_alertas WHERE user_id='${u(n)}' ORDER BY criado_em, tipo`)).rows.map(r => r.tipo);

beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.uid', true),'')::uuid $$;
    CREATE FUNCTION public.is_super_admin(_uid uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT _uid = '${u(9)}'::uuid $$;
    CREATE FUNCTION public.mt_is_governanca(_uid uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT _uid = '${u(8)}'::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
  await db.exec(sql);
});
afterAll(() => db.close());

describe("limite diário de IA por pessoa", () => {
  it("100 passam; a 101ª passa e sobe o teto para 150 com 1 alerta", async () => {
    expect(await chamarVezes(1, 100)).toBe(100);
    expect(await alertas(1)).toEqual([]);
    expect((await chamar(1)).permitido).toBe(true);
    expect(await alertas(1)).toEqual(["subiu"]);
    const r = (await db.query<{ teto_do_dia: number; chamadas: number }>(`SELECT * FROM public.ia_uso_diario WHERE user_id='${u(1)}'`)).rows[0];
    expect(r).toMatchObject({ teto_do_dia: 150, chamadas: 101 });
  });
  it("a 151ª é recusada com 1 alerta 'bloqueou'; a 152ª sem novo alerta", async () => {
    expect(await chamarVezes(1, 49)).toBe(49);
    expect((await chamar(1)).permitido).toBe(false);
    expect(await alertas(1)).toEqual(["subiu", "bloqueou"]);
    expect((await chamar(1)).permitido).toBe(false);
    expect(await alertas(1)).toEqual(["subiu", "bloqueou"]);
  });
  it("uma pessoa não afeta a outra", async () => {
    expect((await chamar(2)).permitido).toBe(true);
    expect(await alertas(2)).toEqual([]);
  });
  it("no dia seguinte o teto volta a 100", async () => {
    await db.exec(`UPDATE public.ia_uso_diario SET dia = dia - 1 WHERE user_id='${u(1)}'`);
    expect((await chamar(1)).permitido).toBe(true);
    const r = (await db.query<{ teto_do_dia: number; chamadas: number }>(`SELECT * FROM public.ia_uso_diario WHERE user_id='${u(1)}' ORDER BY dia DESC`)).rows[0];
    expect(r).toMatchObject({ teto_do_dia: 100, chamadas: 1 });
  });
  it("chamadas sem usuário logado não contam", async () => {
    await db.exec(`SET app.uid = ''`);
    const r = (await db.query<{ r: { contado: boolean } }>(`SELECT public.ia_registrar_uso('x') r`)).rows[0].r;
    expect(r.contado).toBe(false);
  });
  it("usuário comum não lê nem grava as tabelas de uso", async () => {
    await db.exec(`SET app.uid = '${u(1)}'; SET ROLE authenticated;`);
    expect((await db.query(`SELECT * FROM public.ia_uso_diario`)).rows.length).toBe(0);
    expect((await db.query(`SELECT * FROM public.ia_uso_alertas`)).rows.length).toBe(0);
    expect((await db.query(`SELECT * FROM public.ia_limite_parametros`)).rows.length).toBe(0);
    await expect(db.exec(`UPDATE public.ia_uso_diario SET chamadas = 0`)).rejects.toThrow();
    await expect(db.exec(`INSERT INTO public.ia_uso_alertas(user_id,dia,tipo,funcao,chamadas) VALUES ('${u(1)}',current_date,'subiu','x',1)`)).rejects.toThrow();
    await db.exec(`RESET ROLE; SET app.uid = '${u(8)}'; SET ROLE authenticated;`);
    expect((await db.query(`SELECT * FROM public.ia_uso_alertas`)).rows.length).toBe(2);
    await db.exec(`RESET ROLE;`);
  });
});
