import { describe, it, expect } from "vitest";
import {
  alternar, confirmarNoAlvo, kpisDaCadeira, montarRetrato, normalizarCheckin, normalizarCheckout, pendenciasCheckin, pendenciasCheckout,
  periodoSemana, prioridadesHerdadas, responsavelOk, semEmail, idadeSemanas, riscoAberto, respostaVazia,
} from "@/lib/rotinaSemanal";

const ind = (id: string, origem: string, cadeira = "A", extra: any = {}) => ({ id, origem, cadeira_id: cadeira, status: "ativo", parent_id: null, peso: 1, ...extra });
const faixas = [{ nome: "Crítico", min: 0 }, { nome: "Atenção", min: 70 }, { nome: "No alvo", min: 90 }, { nome: "Superado", min: 110 }];

describe("Rotina semanal", () => {
  it("lista BSC, KRs e toda a cesta da cadeira, inclusive peso 0; outra cadeira e componentes ficam fora", () => {
    const l = kpisDaCadeira([ind("b", "bsc"), ind("k", "okr"), ind("c0", "cesta", "A", { peso: 0 }), ind("x", "bsc", "B"), ind("p", "cesta", "A", { parent_id: "c0" }), ind("arq", "bsc", "A", { status: "arquivado" })], "A");
    expect(l.map((i) => i.id)).toEqual(["b", "k", "c0"]);
  });
  it("retrato calcula atingimento e faixa; sem competência fica vazio", () => {
    const r = montarRetrato([{ indicador_id: "a", codigo: "A", nome: "A", origem: "cesta", peso: 0, sentido: "maior", meta_mes: 100, realizado: 95 }], "2026-10", faixas, "t");
    expect(r[0]).toMatchObject({ atingimento: 0.95, faixa: "No alvo", peso: 0, congelado_em: "t" });
    expect(montarRetrato([{ indicador_id: "a", sentido: "maior", meta_mes: 100, realizado: 95 }], null, faixas)[0].atingimento).toBeNull();
  });
  it("Sim/Não podem ser desmarcados e o atalho só marca os no alvo/superados sem resposta", () => {
    expect(alternar(true, true)).toBeNull();
    expect(alternar(null, false)).toBe(false);
    const ret: any[] = [{ indicador_id: "a", faixa: "No alvo" }, { indicador_id: "b", faixa: "Superado" }, { indicador_id: "c", faixa: "Crítico" }];
    const out = confirmarNoAlvo(ret, [{ ...respostaVazia("b"), ok: false }], "2026-10-19");
    expect(out.find((k) => k.indicador_id === "a")?.ok).toBe(true);
    expect(out.find((k) => k.indicador_id === "b")?.ok).toBe(false);
    expect(out.some((k) => k.indicador_id === "c")).toBe(false);
  });
  it("responsável de fora exige nome e e-mail juntos e nunca cadeira ao mesmo tempo", () => {
    expect(responsavelOk({ tipo: "externo", nome: "Ana", email: "" })).toBe(false);
    expect(responsavelOk({ tipo: "externo", nome: "", email: "a@b.com" })).toBe(false);
    expect(responsavelOk({ tipo: "externo", nome: "Ana", email: "a@b.com", cadeira_id: "A" })).toBe(false);
    expect(responsavelOk({ tipo: "externo", nome: "Ana", email: "a@b.com" })).toBe(true);
    expect(responsavelOk({ tipo: "cadeira", cadeira_id: "" })).toBe(false);
  });
  it("e-mail nunca vai para o JSON da semana", () => {
    expect(JSON.stringify(semEmail({ r: { tipo: "externo", nome: "Ana", email: "a@b.com", contato_id: "c1" } }))).not.toContain("a@b.com");
  });
  it("prioridade com título sem prazo bloqueia o check-in", () => {
    const c = normalizarCheckin({ prioridades: [{ titulo: "X", iniciativa_id: "", resultado: "" }] });
    expect(pendenciasCheckin(c).some((p) => p.texto.includes("sem prazo"))).toBe(true);
    c.prioridades[0].prazo = "2026-10-23";
    expect(pendenciasCheckin(c)).toEqual([]);
  });
  it("plano que vira iniciativa sem prazo bloqueia; reaproveitamento sem escolha bloqueia", () => {
    const co = normalizarCheckout({ kpis_resposta: [{ ...respostaVazia("a"), ok: false, plano: "p", vira_iniciativa: true, prazo: "" }] });
    expect(pendenciasCheckout(co).map((p) => p.campo)).toContain("kpi-a-prazo");
    co.kpis_resposta[0].prazo = "2026-10-23";
    expect(pendenciasCheckout(co, { a: [{}] }).map((p) => p.campo)).toContain("kpi-a-reap");
    co.kpis_resposta[0].reaproveitar = "nova";
    expect(pendenciasCheckout(co, { a: [{}] })).toEqual([]);
  });
  it("prioridade não entregue reaparece até ser marcada como entregue", () => {
    const rows = [
      { semana: "2026-10-12", tipo: "checkin", conteudo: { prioridades: [{ id: "p1", titulo: "A", iniciativa_id: "", resultado: "" }, { id: "p2", titulo: "B", iniciativa_id: "", resultado: "" }] } },
      { semana: "2026-10-12", tipo: "checkout", conteudo: { entregas: [{ prioridade_id: "p1", titulo: "A", status: "entregue" }, { prioridade_id: "p2", titulo: "B", status: "parcial" }] } },
    ];
    expect(prioridadesHerdadas(rows, "2026-10-19").map((e) => e.titulo)).toEqual(["B"]);
    rows.push({ semana: "2026-10-19", tipo: "checkout", conteudo: { entregas: [{ prioridade_id: "p2", titulo: "B", status: "entregue", herdada_de: "2026-10-12" } as any] } });
    expect(prioridadesHerdadas(rows, "2026-10-26")).toEqual([]);
  });
  it("registro antigo sem versão é lido sem erro", () => {
    const ci = normalizarCheckin({ prioridades: [{ titulo: "Antiga", iniciativa_id: "i", resultado: "r" }], riscos: "texto livre", apoio: "", confianca: 4 });
    expect(ci.prioridades[0]).toMatchObject({ titulo: "Antiga", prazo: "", responsavel: { tipo: "" } });
    expect(ci.riscos).toBe("texto livre");
    const co = normalizarCheckout({ entregas: [{ titulo: "Antiga", status: "entregue", motivo: "" }], kpis: [{ indicador_id: "x", valor: "1", situacao: "fora", comentario: "" }] });
    expect(co.kpis).toHaveLength(1);
    expect(co.kpis_resposta).toEqual([]);
    expect(normalizarCheckout(null).entregas).toEqual([]);
  });
  it("período, idade e reabertura de riscos", () => {
    expect(periodoSemana("2026-10-26")).toBe("Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26");
    expect(idadeSemanas("2026-10-19", "2026-10-19")).toBe("esta semana");
    expect(idadeSemanas("2026-10-05", "2026-10-19")).toBe("há 2 semanas");
    expect(riscoAberto({ resolvido_em: "2026-10-10", reaberto_em: "2026-10-12" })).toBe(true);
    expect(riscoAberto({ resolvido_em: "2026-10-10", reaberto_em: null })).toBe(false);
  });
});
