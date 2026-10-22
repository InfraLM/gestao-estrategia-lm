import { describe, it, expect } from "vitest";
import { seloCiclo, prazoCiclo, lembreteAtivo, prioridadesHerdadas, atasAnteriores, empilharAtas, vinculosDoProjeto, vinculosParaGravar, normalizarCheckin, responsavelOk, addDias } from "@/lib/rotinaSemanal";

const env = (primeiro: string) => ({ status: "enviado", enviado_em: primeiro, conteudo: { primeiro_envio_em: primeiro } });

describe("Ciclo único", () => {
  it("prazo do ciclo 26/10 = segunda 26/10 23h59 em São Paulo", () => {
    expect(prazoCiclo("2026-10-26").toISOString()).toBe("2026-10-27T02:59:59.000Z");
  });
  it("selo: enviado no prazo, fora do prazo, parcial (registro antigo) e pendente", () => {
    expect(seloCiclo(env("2026-10-26T20:00:00-03:00"), env("2026-10-26T20:00:00-03:00"), "2026-10-26")).toMatchObject({ estado: "enviado", atrasado: false });
    expect(seloCiclo(env("2026-10-27T00:30:00-03:00"), env("2026-10-27T00:30:00-03:00"), "2026-10-26")).toMatchObject({ estado: "enviado", atrasado: true });
    expect(seloCiclo(env("2026-10-20T10:00:00-03:00"), null, "2026-10-19", new Date("2026-10-19T12:00:00-03:00")).estado).toBe("parcial");
    expect(seloCiclo(null, null, "2026-10-26", new Date("2026-10-28T12:00:00-03:00"))).toMatchObject({ estado: "pendente", atrasado: true });
  });
  it("lembrete aparece só a partir de sexta 8h (São Paulo) e some após o envio", () => {
    expect(lembreteAtivo("2026-10-26", false, new Date("2026-10-23T07:59:00-03:00"))).toBe(false);
    expect(lembreteAtivo("2026-10-26", false, new Date("2026-10-23T08:00:00-03:00"))).toBe(true);
    expect(lembreteAtivo("2026-10-26", true, new Date("2026-10-24T08:00:00-03:00"))).toBe(false);
  });
});

describe("Pendências empilhadas", () => {
  it("prioridade de 10 semanas atrás, não entregue, continua aparecendo", () => {
    const antiga = addDias("2026-10-26", -70);
    const rows = [{ semana: antiga, tipo: "checkin", conteudo: { prioridades: [{ id: "p1", titulo: "Velha" }] } }];
    expect(prioridadesHerdadas(rows, "2026-10-19").map((e) => e.herdada_de)).toEqual([antiga]);
  });
  it("ata marcada entregue permanece na lista (no fim) até a baixa na Governança; rascunho não carrega status", () => {
    const rows: any[] = [
      { semana: "2026-10-12", tipo: "checkout", status: "enviado", conteudo: { atas: [{ gov_acao_id: "a1", titulo: "A1", status: "entregue", comentario: "" }] } },
      { semana: "2026-10-19", tipo: "checkout", status: "rascunho", conteudo: { atas: [{ gov_acao_id: "a1", titulo: "A1", status: "", comentario: "" }] } },
    ];
    const st = atasAnteriores(rows, "2026-10-26");
    expect(st[0].status).toBe("entregue");
    const lista = empilharAtas([{ id: "a1", titulo: "A1" }, { id: "a2", titulo: "A2" }], st);
    expect(lista.map((a) => a.id)).toEqual(["a2", "a1"]);
    expect(empilharAtas([{ id: "a2", titulo: "A2" }], st).map((a) => a.id)).toEqual(["a2"]); // baixa na origem = sai
  });
});

describe("Vínculos e responsáveis", () => {
  it("projeto sugere KPIs de BSC pelos objetivos dele", () => {
    const inds = [{ id: "k1", origem: "bsc", objetivo_id: "o1", codigo: "f.01.01" }, { id: "k2", origem: "bsc", objetivo_id: "o2", codigo: "c.01.01" }];
    expect(vinculosDoProjeto({ objetivos: ["F.01"], krs: null }, inds, [{ id: "o1", codigo: "F.01" }, { id: "o2", codigo: "C.01" }]).bsc).toEqual(["k1"]);
  });
  it("vínculo principal não é regravado como secundário", () => {
    expect(vinculosParaGravar({ bsc: ["k1", "k2"], kr: [], cesta: [], projetos: ["p"] }, "k1")).toEqual([{ tipo: "bsc", ref_id: "k2" }, { tipo: "projeto", ref_id: "p" }]);
  });
  it("registros antigos sem vínculos são lidos com listas vazias; líder exige nome", () => {
    expect(normalizarCheckin({ prioridades: [{ titulo: "x" }] }).prioridades[0].vinculos).toEqual({ bsc: [], kr: [], cesta: [], projetos: [] });
    expect(responsavelOk({ tipo: "lider", nome: "" })).toBe(false);
    expect(responsavelOk({ tipo: "lider", nome: "Ana" })).toBe(true);
  });
});
