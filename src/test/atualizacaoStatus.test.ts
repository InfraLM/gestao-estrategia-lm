// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { filtrarAtualizacao, retornoStatus } from "../lib/atualizacaoStatus";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
describe("Links de atualização", () => {
  it("abre somente os quatro status em aberto e respeita cadeira/tipo", () => {
    const rows = ["Em Andamento", "Atrasado", "Pausado", "A Iniciar", "Concluído", "Cancelado"].map(status => ({ status, cadeira: "CFO", tipo: "projeto" }));
    expect(filtrarAtualizacao(rows, new URLSearchParams("status=aberto&cadeira=CFO&tipo=projeto"))).toHaveLength(4);
    expect(filtrarAtualizacao(rows, new URLSearchParams("cadeira=COO"))).toHaveLength(0);
  });
  it("preserva o filtro no login sem permitir redirecionamento externo", () => {
    expect(retornoStatus("/pmo/atualizar-status?status=aberto&cadeira=CFO")).toBe("/pmo/atualizar-status?status=aberto&cadeira=CFO");
    expect(retornoStatus("https://evil.test/pmo/atualizar-status")).toBe("/");
  });
});
describe("Atualização auditada em banco isolado", () => {
  let pg: PGlite;
  beforeEach(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${id(1)}'::uuid$$;
      CREATE FUNCTION acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION proj_eh_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
      CREATE FUNCTION editor_modulo(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
      CREATE TYPE status_execucao_enum AS ENUM ('Em Andamento','Atrasado','Pausado','A Iniciar','Concluído','Cancelado');
      CREATE TABLE profiles(user_id uuid,display_name text);
      CREATE TABLE projetos(id uuid PRIMARY KEY,status status_execucao_enum,termino text,updated_at timestamptz);
      INSERT INTO projetos VALUES('${id(10)}','Em Andamento','2026-12-31','2026-10-01'),('${id(11)}','A Iniciar','2026-12-31','2026-10-01');
      INSERT INTO profiles VALUES('${id(1)}','Editor');`);
    await pg.exec(readFileSync("drizzle/migrations/0032_pmo_atualizacao_direta_auditada.sql", "utf8"));
  });
  afterEach(async () => { await pg.close(); });
  const item = (n = 10) => ({ id: id(n), status: "Pausado", termino: "2026-12-31", avanco_pct: 35, comentario: "Revisão de prazo", updated_at: "2026-10-01" });
  const save = (items: any[]) => pg.query("select pmo_atualizar_status($1::jsonb)", [JSON.stringify(items)]);
  it("salva só selecionados e registra antes/depois, ator e data", async () => {
    await save([item()]);
    const a = await pg.query<any>("select * from pmo_atualizacoes_auditoria");
    expect(a.rows).toHaveLength(1); expect(a.rows[0].usuario_id).toBe(id(1)); expect(a.rows[0].created_at).toBeTruthy();
    expect(a.rows[0].anterior.status).toBe("Em Andamento"); expect(a.rows[0].novo.status).toBe("Pausado"); expect(a.rows[0].novo.avanco_pct).toBe(35);
    expect((await pg.query<any>(`select status from projetos where id='${id(11)}'`)).rows[0].status).toBe("A Iniciar");
  });
  it("encerrar/cancelar continua exigindo SR", async () => {
    for (const status of ["Concluído", "Cancelado"]) await expect(save([{ ...item(), status }])).rejects.toThrow("decisão SR");
  });
  it("leitor não pode salvar", async () => {
    await pg.exec("CREATE OR REPLACE FUNCTION editor_modulo(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$");
    await expect(save([item()])).rejects.toThrow("Sem permissão");
  });
  it("CEO com leitura pode salvar mesmo sem ser editor", async () => {
    await pg.exec("CREATE OR REPLACE FUNCTION editor_modulo(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$; CREATE OR REPLACE FUNCTION proj_eh_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$");
    await save([item()]); expect((await pg.query<any>("select count(*)::int n from pmo_atualizacoes_auditoria")).rows[0].n).toBe(1);
  });
  it("lote inválido desfaz tudo e não grava auditoria", async () => {
    await expect(save([item(), { ...item(11), avanco_pct: 101 }])).rejects.toThrow("entre 0 e 100");
    expect((await pg.query<any>("select count(*)::int n from pmo_atualizacoes_auditoria")).rows[0].n).toBe(0);
  });
  it("não sobrescreve alteração concorrente", async () => {
    await expect(save([{ ...item(), updated_at: "2026-09-01" }])).rejects.toThrow("outra pessoa");
  });
});