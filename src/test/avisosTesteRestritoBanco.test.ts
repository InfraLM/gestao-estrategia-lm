// @vitest-environment node
import { it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
it("concessão exige Governança, dura 24h, audita e revoga sem conceder roles", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '00000000-0000-4000-8000-000000000001'::uuid$$;
      CREATE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT current_setting('test.gov',true)='true'$$;
      CREATE TABLE profiles(user_id uuid,email text);
      CREATE TABLE mt_auditoria(tabela text,registro_id text,campo text,valor_anterior text,valor_novo text,alterado_por uuid);
      INSERT INTO profiles VALUES('00000000-0000-4000-8000-000000000001','felipe.rabello@liberdademedicaedu.com.br');`);
    await pg.exec(readFileSync("drizzle/migrations/0105_rotina_avisos_teste_restrito.sql", "utf8"));
    await expect(pg.query("select rotina_avisos_teste_conceder('felipe.rabello@liberdademedicaedu.com.br')")).rejects.toThrow("Sem permissão");
    await pg.exec("select set_config('test.gov','true',false)");
    await pg.query("select rotina_avisos_teste_conceder('felipe.rabello@liberdademedicaedu.com.br')");
    const r = await pg.query<{horas:number}>("select extract(epoch from (valido_ate-now()))/3600 as horas from rotina_avisos_testadores");
    expect(Number(r.rows[0].horas)).toBeGreaterThan(23.99);
    expect(Number(r.rows[0].horas)).toBeLessThanOrEqual(24);
    expect((await pg.query("select rotina_avisos_teste_info() as prazo")).rows[0]).not.toEqual({prazo:null});
    await pg.query("select rotina_avisos_teste_conceder('felipe.rabello@liberdademedicaedu.com.br',true)");
    expect((await pg.query("select rotina_avisos_teste_info() as prazo")).rows[0]).toEqual({prazo:null});
    expect((await pg.query("select * from mt_auditoria")).rows).toHaveLength(2);
  } finally { await pg.close(); }
});