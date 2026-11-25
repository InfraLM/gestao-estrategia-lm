// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const uid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const tabelas = ["mt_farol_regras", "mt_farol_excecoes"];
const como = async (n: number, modulo = "metas", corporativo = true, role = "authenticated") => {
  await db.exec(`RESET ROLE; SET app.uid = '${uid(n)}'; SET app.modulo = '${modulo}'; SET app.corporativo = '${corporativo}'; SET ROLE ${role};`);
};
const salvar = (indicador: string | null, pct: number | null, motivo = "Teste fictício") => db.query(
  "SELECT public.mt_farol_salvar($1::uuid,$2::numeric,$3::text)", [indicador, pct, motivo],
);
const auditoria = async () => {
  await db.exec("RESET ROLE");
  return (await db.query<{ tabela: string; registro_id: string; valor_anterior: string | null; valor_novo: string | null; alterado_por: string }>(
    "SELECT tabela,registro_id,valor_anterior,valor_novo,alterado_por FROM public.mt_auditoria ORDER BY sequencia",
  )).rows;
};

beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('app.uid')::uuid $$;
    CREATE FUNCTION public.mt_is_governanca(_uid uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT _uid = '${uid(1)}'::uuid $$;
    CREATE FUNCTION public.mt_email_corporativo() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT current_setting('app.corporativo')::boolean $$;
    CREATE FUNCTION public.acesso_modulo(_uid uuid,_modulo text,_editar boolean) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT _modulo = current_setting('app.modulo') $$;
    GRANT USAGE ON SCHEMA auth TO authenticated,service_role;
    CREATE TABLE public.mt_indicadores(id uuid PRIMARY KEY, origem text);
    CREATE TABLE public.mt_auditoria(sequencia serial PRIMARY KEY,tabela text,registro_id text,campo text,valor_anterior text,valor_novo text,alterado_por uuid,alterado_em timestamptz);
    INSERT INTO public.mt_indicadores VALUES ('${uid(10)}','bsc');
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;`);
  await db.exec(readFileSync("drizzle/migrations/0130_metas_regras_farol.sql", "utf8").split("--> statement-breakpoint").join(""));
  // Inicialização aplicada separadamente no Cloud, pois migrations aceitam apenas DDL.
  await db.exec("INSERT INTO public.mt_farol_regras(id) VALUES (1) ON CONFLICT (id) DO NOTHING;");
});
afterAll(() => db.close());

describe("regras do farol: padrão e permissões", () => {
  it("nasce com exatamente id 1 e faixa 0.05", async () => {
    await db.exec("RESET ROLE");
    expect((await db.query("SELECT id,amarelo_pct::text FROM public.mt_farol_regras")).rows).toEqual([{ id: 1, amarelo_pct: "0.05" }]);
    expect((await db.query("SELECT * FROM public.mt_farol_excecoes")).rows).toHaveLength(0);
    const r = await db.query<{ relrowsecurity: boolean }>("SELECT relrowsecurity FROM pg_class WHERE relname = ANY($1)", [tabelas]);
    expect(r.rows).toEqual([{ relrowsecurity: true }, { relrowsecurity: true }]);
  });
  it.each(["metas", "rotina", "cesta", "okrs"])("leitura corporativa autorizada pelo módulo %s", async modulo => {
    await como(2, modulo);
    expect((await db.query("SELECT * FROM public.mt_farol_regras")).rows).toHaveLength(1);
  });
  it("sem módulo ou sem identidade corporativa/Governança não lê", async () => {
    await como(2, "nenhum");
    expect((await db.query("SELECT * FROM public.mt_farol_regras")).rows).toHaveLength(0);
    await como(2, "metas", false);
    expect((await db.query("SELECT * FROM public.mt_farol_regras")).rows).toHaveLength(0);
    await como(1, "metas", false);
    expect((await db.query("SELECT * FROM public.mt_farol_regras")).rows).toHaveLength(1);
  });
  it("anon não lê nem executa a função", async () => {
    await como(0, "metas", false, "anon");
    for (const t of tabelas) await expect(db.query(`SELECT * FROM public.${t}`)).rejects.toThrow(/permission denied/);
    await expect(salvar(null, 0.1)).rejects.toThrow(/permission denied/);
  });
  it("usuário fora da Governança não salva nem gera auditoria", async () => {
    await como(2);
    await expect(salvar(null, 0.1)).rejects.toThrow(/Somente a Governança/);
    expect(await auditoria()).toHaveLength(0);
  });
  it("gravação direta é bloqueada até para Governança", async () => {
    await como(1);
    expect((await db.query("UPDATE public.mt_farol_regras SET amarelo_pct=0.2 RETURNING id")).rows).toHaveLength(0);
    expect((await db.query("DELETE FROM public.mt_farol_regras RETURNING id")).rows).toHaveLength(0);
    await expect(db.query("INSERT INTO public.mt_farol_excecoes(indicador_id,amarelo_pct) VALUES ($1,0.2)", [uid(10)])).rejects.toThrow(/row-level security/);
  });
  it.each([-0.01, 0.51])("recusa faixa %s fora de 0 a 0.5", async pct => {
    await como(1);
    await expect(salvar(null, pct)).rejects.toThrow(/entre 0% e 50%/);
    await expect(salvar(uid(10), pct)).rejects.toThrow(/entre 0% e 50%/);
    expect(await auditoria()).toHaveLength(0);
  });
  it("faixa geral exige valor e exceção exige indicador existente", async () => {
    await como(1);
    await expect(salvar(null, null)).rejects.toThrow(/Informe a faixa geral/);
    await expect(salvar(uid(99), 0.1)).rejects.toThrow(/Indicador não encontrado/);
    expect(await auditoria()).toHaveLength(0);
  });
  it("aceita limites 0 e 0.5, com um registro de auditoria por gravação", async () => {
    await como(1);
    await salvar(null, 0);
    await salvar(null, 0.5);
    expect(await auditoria()).toEqual([
      { tabela: "mt_farol_regras", registro_id: "geral", valor_anterior: "0.05", valor_novo: "0", alterado_por: uid(1) },
      { tabela: "mt_farol_regras", registro_id: "geral", valor_anterior: "0", valor_novo: "0.5", alterado_por: uid(1) },
    ]);
    expect((await db.query("SELECT amarelo_pct::text,atualizado_por FROM public.mt_farol_regras")).rows).toEqual([{ amarelo_pct: "0.5", atualizado_por: uid(1) }]);
    await db.exec("INSERT INTO public.mt_farol_regras(id) VALUES (1) ON CONFLICT (id) DO NOTHING;");
    expect((await db.query("SELECT amarelo_pct::text FROM public.mt_farol_regras")).rows).toEqual([{ amarelo_pct: "0.5" }]);
  });
  it("BSC pode ter exceção; editar, retirar e reativar preserva dados e audita", async () => {
    await como(1);
    await salvar(uid(10), 0.1);
    await salvar(uid(10), 0.2);
    await salvar(uid(10), null, "Retirada");
    const logs = await auditoria();
    expect(logs.slice(2)).toEqual([
      { tabela: "mt_farol_excecoes", registro_id: uid(10), valor_anterior: null, valor_novo: "0.1", alterado_por: uid(1) },
      { tabela: "mt_farol_excecoes", registro_id: uid(10), valor_anterior: "0.1", valor_novo: "0.2", alterado_por: uid(1) },
      { tabela: "mt_farol_excecoes", registro_id: uid(10), valor_anterior: "0.2", valor_novo: null, alterado_por: uid(1) },
    ]);
    expect((await db.query("SELECT ativo,amarelo_pct::text,motivo,atualizado_por FROM public.mt_farol_excecoes")).rows).toEqual([{ ativo: false, amarelo_pct: "0.2", motivo: "Retirada", atualizado_por: uid(1) }]);
    await como(1);
    await salvar(uid(10), null);
    expect(await auditoria()).toHaveLength(5);
    await como(1);
    await salvar(uid(10), 0.15);
    expect((await auditoria()).at(-1)).toMatchObject({ valor_anterior: null, valor_novo: "0.15" });
    expect((await db.query("SELECT ativo FROM public.mt_farol_excecoes")).rows).toEqual([{ ativo: true }]);
  });
  it("mesmo depois de existir exceção, usuários só leem e não editam nem apagam", async () => {
    await como(2, "okrs");
    expect((await db.query("SELECT * FROM public.mt_farol_excecoes")).rows).toHaveLength(1);
    expect((await db.query("UPDATE public.mt_farol_excecoes SET ativo=false RETURNING indicador_id")).rows).toHaveLength(0);
    expect((await db.query("DELETE FROM public.mt_farol_excecoes RETURNING indicador_id")).rows).toHaveLength(0);
    await como(2, "nenhum");
    expect((await db.query("SELECT * FROM public.mt_farol_excecoes")).rows).toHaveLength(0);
  });
});