import { describe, it, expect } from "vitest";
import { ultimoCicloDoMes, projetoEmAberto, temDesvio, decisaoPendente, sugerirCadeiras, iniciativasDoItem, podeDecidir } from "@/lib/projetosGestao";

describe("último ciclo do mês", () => {
  it("outubro/2026: ciclo de 26/10 (checkout 19 a 25/10)", () => {
    expect(ultimoCicloDoMes("2026-10-26")).toBe("2026-10");
    expect(ultimoCicloDoMes("2026-10-19")).toBeNull();
  });
  it("novembro/2026: ciclo de 30/11 (checkout 23 a 29/11)", () => {
    expect(ultimoCicloDoMes("2026-11-30")).toBe("2026-11");
    expect(ultimoCicloDoMes("2026-11-23")).toBeNull();
    expect(ultimoCicloDoMes("2026-11-02")).toBeNull();
  });
});

describe("projeto em aberto", () => {
  it("Em Andamento, Atrasado, Pausado e A Iniciar contam", () => {
    for (const s of ["Em Andamento", "Atrasado", "Pausado", "A Iniciar"]) expect(projetoEmAberto(s)).toBe(true);
  });
  it("Backlog, Concluído e Cancelado ficam fora", () => {
    for (const s of ["Backlog", "Concluído", "Cancelado"]) expect(projetoEmAberto(s)).toBe(false);
  });
});

describe("desvio e decisão", () => {
  it("qualquer amarelo ou vermelho é desvio", () => {
    expect(temDesvio({ farol_escopo: "verde", farol_custo: "amarelo", farol_cronograma: "verde" })).toBe(true);
    expect(temDesvio({ farol_escopo: "verde", farol_custo: "verde", farol_cronograma: "verde" })).toBe(false);
  });
  it("decisão na mesma competência tira a pendência", () => {
    const r = { competencia: "2026-10", farol_cronograma: "vermelho" };
    expect(decisaoPendente(r, [])).toBe(true);
    expect(decisaoPendente(r, [{ competencia: "2026-10" }])).toBe(false);
    expect(decisaoPendente(r, [{ competencia: "2026-09" }])).toBe(true);
  });
  it("só Governança e CEO decidem", () => {
    expect(podeDecidir({ governanca: false, ceo: false })).toBe(false);
    expect(podeDecidir({ governanca: false, ceo: true })).toBe(true);
  });
});

describe("sugestão de cadeira", () => {
  const cads = [{ id: "ceo", nome: "CEO", diretor_nome: "Ian Camilo" }, { id: "coo", nome: "COO", diretor_nome: null }, { id: "cmo", nome: "CMO / BU Certificações", diretor_nome: null }];
  it("dupla responsabilidade: principal primeiro", () => {
    expect(sugerirCadeiras("CMO + Dir. Operações", cads)).toEqual(["cmo", "coo"]);
  });
  it("pelo primeiro nome do diretor da cadeira", () => {
    expect(sugerirCadeiras("Ian", cads)).toEqual(["ceo"]);
  });
  it("sem diretor não sugere", () => {
    expect(sugerirCadeiras(null, cads)).toEqual([]);
    expect(sugerirCadeiras("Não atribuído", cads)).toEqual([]);
  });
});

describe("empilhamento", () => {
  const inis = [{ id: "a", indicador_id: "k1" }, { id: "b", indicador_id: "k2" }, { id: "c", indicador_id: "k3" }];
  it("principal e secundário entram; demais não", () => {
    const r = iniciativasDoItem(inis, [{ iniciativa_id: "b", tipo: "kr", ref_id: "kr9" }, { iniciativa_id: "c", tipo: "projeto", ref_id: "p1" }], ["k1", "kr9"]);
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
    expect(iniciativasDoItem(inis, [{ iniciativa_id: "c", tipo: "projeto", ref_id: "p1" }], [], "p1").map((x) => x.id)).toEqual(["c"]);
  });
});
