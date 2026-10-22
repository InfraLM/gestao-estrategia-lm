import { describe, it, expect } from "vitest";
import { cicloPadrao, semanaCheckout, competenciaDaSemana, ultimaSituacao, montarRetrato } from "@/lib/rotinaSemanal";
import { prazoDe } from "@/pages/MetasSemanal";
import { avaliarBsc, lerMeta } from "@/lib/avaliacaoBsc";
import { notaMensal, pesoVigente } from "@/lib/notaMensal";

describe("Ciclo semanal", () => {
  it("quinta 22/10 abre o ciclo 19/10; sexta 23/10 00h em São Paulo já abre 26/10", () => {
    expect(cicloPadrao(new Date("2026-10-22T15:00:00-03:00"))).toBe("2026-10-19");
    expect(cicloPadrao(new Date("2026-10-23T00:00:00-03:00"))).toBe("2026-10-26");
    expect(cicloPadrao(new Date("2026-10-22T23:59:00-03:00"))).toBe("2026-10-19");
  });
  it("checkout = ciclo − 7; competência pelo domingo; checkout e check-in vencem juntos na segunda 23h59 (São Paulo) do ciclo", () => {
    expect(semanaCheckout("2026-10-26")).toBe("2026-10-19");
    expect(competenciaDaSemana("2026-09-28")).toBe("2026-10");
    expect(prazoDe(semanaCheckout("2026-10-26"), "checkout").toISOString()).toBe("2026-10-27T02:59:59.000Z");
    expect(prazoDe("2026-10-26", "checkin").toISOString()).toBe("2026-10-27T02:59:59.000Z");
  });
  it("última situação: a mais recente entre árvore e checkout enviado; rascunho não conta", () => {
    const ck = (semana: string, status: string, v: string) => ({ semana, status, enviado_em: semana + "T20:00:00Z", conteudo: { kpis_resposta: [{ indicador_id: "a", situacao_atual: v }] } });
    expect(ultimaSituacao("a", { valor: "10", data: "2026-10-01" }, [ck("2026-10-12", "enviado", "12"), ck("2026-10-19", "rascunho", "99")], "2026-10-26"))
      .toMatchObject({ valor: "12", fonte: "checkout de 12/10" });
    expect(ultimaSituacao("a", { valor: "10", data: "2026-10-20" }, [ck("2026-10-12", "enviado", "12")], "2026-10-26")?.fonte).toBe("Árvore de KPIs");
  });
  it("retrato do BSC não tem atingimento nem faixa", () => {
    const r = montarRetrato([{ indicador_id: "a", origem: "bsc", sentido: "maior", meta_mes: 10, realizado: 10 }], "2026-10", [{ nome: "No alvo", min: 90 }]);
    expect(r[0].atingimento).toBeNull(); expect(r[0].faixa).toBeNull();
  });
});

describe("Avaliação BSC", () => {
  const base = { sentido: "maior" as const, competencia: "2026-10", meta_mes: 80, meta_semestre: null, meta_texto: null, realizado: 85 };
  it("durante o mês fica em acompanhamento; após o fim do mês vira on/off", () => {
    expect(avaliarBsc(base, new Date(2026, 9, 31))).toBe("acomp");
    expect(avaliarBsc(base, new Date(2026, 10, 1))).toBe("on");
    expect(avaliarBsc({ ...base, realizado: 70 }, new Date(2026, 10, 1))).toBe("off");
  });
  it("menor é melhor", () => {
    expect(avaliarBsc({ ...base, sentido: "menor", meta_mes: 5, realizado: 4 }, new Date(2026, 10, 2))).toBe("on");
    expect(avaliarBsc({ ...base, sentido: "menor", meta_mes: 5, realizado: 6 }, new Date(2026, 10, 2))).toBe("off");
  });
  it("metas em texto: '> 70', '< 1,5%', faixa e texto sem número", () => {
    expect(lerMeta("> 70")).toEqual({ tipo: "valor", v: 70, sentido: "maior" });
    expect(lerMeta("< 1,5%")).toEqual({ tipo: "valor", v: 1.5, sentido: "menor" });
    expect(lerMeta("70 a 80")).toEqual({ tipo: "faixa", min: 70, max: 80 });
    expect(lerMeta("verificar com ian")).toBeNull();
    expect(avaliarBsc({ ...base, meta_mes: null, meta_texto: "verificar com ian" })).toBe("sem_meta");
  });
  it("meta só do período: em acompanhamento até dezembro; avaliada depois", () => {
    const p = { ...base, meta_mes: null, meta_texto: "< 1,5%", realizado: 1.2 };
    expect(avaliarBsc(p, new Date(2026, 11, 31))).toBe("acomp");
    expect(avaliarBsc(p, new Date(2027, 0, 2))).toBe("on");
  });
});

describe("Nota mensal", () => {
  const ind = (id: string, origem: string, peso: number) => ({ id, origem, peso });
  it("BSC fica fora; CEO = só a cesta 50/50 a partir de julho", () => {
    const itens = [ind("ac01", "bsc", 1), ind("ebitda", "cesta", 0.33), ind("nps", "cesta", 0.33)];
    const vig = [{ indicador_id: "ebitda", competencia_inicio: "2026-07", peso: 0.5 }, { indicador_id: "nps", competencia_inicio: "2026-07", peso: 0.5 }];
    const atg: Record<string, number> = { ac01: 0, ebitda: 1, nps: 0.8 };
    expect(notaMensal(itens, (i) => atg[i.id], "2026-10", vig)).toBeCloseTo(0.9);
  });
  it("peso vigente por competência", () => {
    const vig = [{ indicador_id: "x", competencia_inicio: "2026-09", peso: 0.5 }];
    expect(pesoVigente({ id: "x", peso: 0.33 }, "2026-08", vig)).toBe(0.33);
    expect(pesoVigente({ id: "x", peso: 0.33 }, "2026-10", vig)).toBe(0.5);
  });
});
