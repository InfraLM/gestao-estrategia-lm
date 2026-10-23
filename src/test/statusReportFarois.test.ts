// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { faroisParaEdicao, lerFarois } from "@/lib/statusReportFarois";

describe("Faróis de status report, banco isolado", () => {
  let pg: PGlite;
  const uid = "00000000-0000-4000-8000-000000000001";
  const projeto = "00000000-0000-4000-8000-000000000002";
  const antigo = "00000000-0000-4000-8000-000000000003";
  const novo = "00000000-0000-4000-8000-000000000004";
  const farois = [{ dimensao: "Escopo", status: "amarelo", obs: "Revisão" }, { dimensao: "Cronograma", status: "vermelho", obs: "Atrasado" }, { dimensao: "Custo", status: "verde", obs: "—" }, { dimensao: "Riscos", status: "amarelo", obs: "Acompanhar" }];
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${uid}'::uuid$$;
      CREATE TABLE status_reports(id uuid PRIMARY KEY,projeto_id uuid,periodo text,avancos text,desvios text,saude text,causa_raiz text,plano_acao text,created_at timestamptz DEFAULT now());
      CREATE TABLE mt_auditoria(tabela text,registro_id text,competencia text,campo text,valor_anterior text,valor_novo text,alterado_por uuid);
      CREATE TABLE mt_status_projetos(id uuid,farol_escopo text);
      INSERT INTO mt_status_projetos VALUES('${antigo}','vermelho');
      INSERT INTO status_reports(id,projeto_id,periodo,avancos,created_at) VALUES('${antigo}','${projeto}','Anterior','Histórico preservado','2026-10-01');`);
    await pg.exec(readFileSync("drizzle/migrations/0052_status_reports_farois_auditados.sql", "utf8"));
  }, 30000);
  afterAll(async () => { await pg.close(); });
  it("não inventa faróis nos reports históricos", async () => {
    const row = (await pg.query<any>(`SELECT * FROM status_reports WHERE id='${antigo}'`)).rows[0];
    expect(row.avancos).toBe("Histórico preservado");
    expect(row.farois_dimensoes).toBeNull();
    expect(lerFarois(row.farois_dimensoes)).toBeNull();
  });
  it("salva e relê a escolha de todas as dimensões no mesmo report", async () => {
    await pg.query(`INSERT INTO status_reports(id,projeto_id,periodo,avancos,farois_dimensoes) VALUES($1,$2,'Atual','Avanço atual',$3::jsonb)`, [novo, projeto, JSON.stringify(farois)]);
    const row = (await pg.query<any>(`SELECT * FROM status_reports WHERE id='${novo}'`)).rows[0];
    expect(row.farois_dimensoes).toEqual(farois);
    expect(faroisParaEdicao(row.farois_dimensoes)).toEqual(farois);
    expect((await pg.query(`SELECT * FROM status_reports`)).rows).toHaveLength(2);
  });
  it("audita faróis e outros campos com antes/depois e autor", async () => {
    const audit = (await pg.query<any>(`SELECT * FROM mt_auditoria WHERE registro_id='${novo}' AND campo='farois_dimensoes'`)).rows[0];
    expect(audit.valor_anterior).toBeNull();
    expect(JSON.parse(audit.valor_novo)).toEqual(farois);
    expect(audit.alterado_por).toBe(uid);
    await pg.query(`UPDATE status_reports SET farois_dimensoes=$1::jsonb WHERE id=$2`, [JSON.stringify([{ dimensao: "Escopo", status: "verde", obs: "Resolvido" }]), novo]);
    const audits = (await pg.query<any>(`SELECT * FROM mt_auditoria WHERE registro_id='${novo}' AND campo='farois_dimensoes'`)).rows;
    expect(audits).toHaveLength(2);
    expect(JSON.parse(audits[1].valor_anterior)).toEqual(farois);
    expect(JSON.parse(audits[1].valor_novo)[0].status).toBe("verde");
    expect((await pg.query(`SELECT * FROM mt_auditoria WHERE campo='avancos'`)).rows).toHaveLength(1);
  });
  it("preserva o fluxo do status report do ciclo sem copiar faróis", async () => {
    expect((await pg.query<any>("SELECT farol_escopo FROM mt_status_projetos")).rows[0].farol_escopo).toBe("vermelho");
  });
  it("rejeita cor inválida e dimensões duplicadas", async () => {
    for (const value of [[{ dimensao: "Escopo", status: "azul", obs: "" }], [farois[0], farois[0]]]) {
      await expect(pg.query(`UPDATE status_reports SET farois_dimensoes=$1::jsonb WHERE id=$2`, [JSON.stringify(value), novo])).rejects.toThrow();
    }
  });
});