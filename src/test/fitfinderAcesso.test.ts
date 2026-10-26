// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

const db = new PGlite();
const diretor = "00000000-0000-0000-0000-000000000003";
const cadeira = "00000000-0000-0000-0000-000000000011";
beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.uid',true),'')::uuid $$;
    CREATE FUNCTION public.proj_gov_ou_ceo(u uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT u IN ('00000000-0000-0000-0000-000000000001'::uuid,'00000000-0000-0000-0000-000000000002'::uuid) $$;
    CREATE FUNCTION public.mt_cadeira_do_usuario(u uuid) RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT CASE WHEN u='${diretor}'::uuid THEN '${cadeira}'::uuid END $$;
    CREATE TABLE public.mt_cadeiras(id uuid PRIMARY KEY,ativo boolean,diretor_user_id uuid);
    GRANT USAGE ON SCHEMA public,auth TO authenticated;
    INSERT INTO public.mt_cadeiras VALUES('${cadeira}',true,'${diretor}'),('00000000-0000-0000-0000-000000000012',true,NULL);`);
  const baseline = readFileSync("drizzle/migrations/0066_fitfinder_raio_x_prestadores.sql", "utf8");
  await db.exec(baseline);
  await db.exec(readFileSync("drizzle/migrations/0067_fitfinder_multiplas_cadeiras_acesso_restrito.sql", "utf8"));
  await db.exec(`INSERT INTO public.fitfinder_diretoria_cadeiras(diretoria,cadeira_id,status) VALUES('CRO','${cadeira}','confirmado'),('CRO','00000000-0000-0000-0000-000000000012','sugerido');
    INSERT INTO public.fitfinder_espelho(diretoria) VALUES('CRO'),('CEO');`);
});
afterAll(() => db.close());
async function verComo(uid: string) {
  await db.exec(`SET ROLE authenticated; SET request.uid='${uid}';`);
  try { return (await db.query<{ diretoria: string }>("SELECT diretoria FROM public.fitfinder_espelho ORDER BY diretoria")).rows; }
  finally { await db.exec("RESET ROLE; RESET request.uid;"); }
}
describe("Fit Finder: banco e pares múltiplos", () => {
  it("aceita duas cadeiras da mesma diretoria", async () => {
    expect((await db.query("SELECT cadeira_id FROM public.fitfinder_diretoria_cadeiras WHERE diretoria='CRO'")).rows).toHaveLength(2);
  });
  it("rejeita o mesmo par duplicado", async () => {
    await expect(db.exec(`INSERT INTO public.fitfinder_diretoria_cadeiras(diretoria,cadeira_id) VALUES('CRO','${cadeira}')`)).rejects.toThrow(/duplicate key/);
  });
  it.each(["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"])("Gov/CEO %s lê todas", async uid => {
    expect(await verComo(uid)).toEqual([{ diretoria: "CEO" }, { diretoria: "CRO" }]);
  });
  it("diretor não lê nem a própria diretoria com vínculo confirmado", async () => {
    expect(await verComo(diretor)).toEqual([]);
  });
  it("usuário sem cadeira não lê", async () => {
    expect(await verComo("00000000-0000-0000-0000-000000000004")).toEqual([]);
  });
  it("interruptor começa desligado e não pode ser alterado pelo diretor", async () => {
    await db.exec(`SET ROLE authenticated; SET request.uid='${diretor}';`);
    try { expect((await db.query("UPDATE public.fitfinder_integracao_config SET diretores_podem_ler=true RETURNING id")).rows).toEqual([]); }
    finally { await db.exec("RESET ROLE; RESET request.uid;"); }
    expect((await db.query<{ diretores_podem_ler: boolean }>("SELECT diretores_podem_ler FROM public.fitfinder_integracao_config")).rows[0].diretores_podem_ler).toBe(false);
  });
  it("liberação futura só expõe a diretoria confirmada, nunca as demais", async () => {
    await db.exec("UPDATE public.fitfinder_integracao_config SET diretores_podem_ler=true");
    try { expect(await verComo(diretor)).toEqual([{ diretoria: "CRO" }]); }
    finally { await db.exec("UPDATE public.fitfinder_integracao_config SET diretores_podem_ler=false"); }
  });
});