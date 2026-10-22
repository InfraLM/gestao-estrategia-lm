import { describe, it, expect } from "vitest";
import { avaliarPorTipo, farolEntrega, apontamentoMaisRecente } from "@/lib/avaliacaoBsc";
import { celulaMes, marcarCriticos } from "@/lib/matrizApontamentos";
import { avaliarCiclo, taxa, semanasDevidas, calcularCompletude, conformidadeCadeira } from "@/lib/conformidade";
import { normalizarCheckin, normalizarCheckout, pendenciasCheckout } from "@/lib/rotinaSemanal";

const base = { indicador_id: "k", sentido: "maior" as const, competencia: "2026-10", meta_mes: 10, meta_semestre: 100, meta_texto: null, realizado: null as number | null };
const dentro = new Date("2026-10-20T12:00:00"), depois = new Date("2026-11-05T12:00:00"), fimAno = new Date("2027-01-05T12:00:00");
const ap = (x: any) => ({ data: "2026-10-30", origem: "Lançar mês", ...x });

describe("Tipo V — valor mensal", () => {
  it("automático só depois do fim do mês", () => {
    expect(avaliarPorTipo({ ...base, realizado: 12 }, null, [], dentro).aval).toBe("acomp");
    expect(avaliarPorTipo({ ...base, realizado: 12 }, null, [], depois)).toMatchObject({ aval: "on", fonte: "calculado" });
    expect(avaliarPorTipo({ ...base, realizado: 8 }, null, [], depois).aval).toBe("off");
  });
  it("sem apontamento depois do mês = Pendente de apontamento", () => {
    expect(avaliarPorTipo(base, null, [], depois).aval).toBe("pendente");
  });
});

describe("Tipo S — meta semestral/anual", () => {
  const s = { ...base, tipo: "valor_periodo" as const, meta_mes: null, realizado: 5 };
  it("usa a declaração do diretor no mês, não o cálculo", () => {
    expect(avaliarPorTipo({ ...s, apontamento: ap({ declaracao: "off", justificativa: "x" }) }, null, [], depois)).toMatchObject({ aval: "off", fonte: "declarado" });
    expect(avaliarPorTipo({ ...s, apontamento: ap({ declaracao: "on" }) }, null, [], depois).aval).toBe("on");
  });
  it("sem declaração: acompanhamento no mês, pendente depois", () => {
    expect(avaliarPorTipo(s, null, [], dentro).aval).toBe("acomp");
    expect(avaliarPorTipo(s, null, [], depois).aval).toBe("pendente");
  });
  it("no fim do período compara meta × resultado automaticamente", () => {
    expect(avaliarPorTipo({ ...s, realizado: 120, apontamento: ap({ declaracao: "off" }) }, null, [], fimAno)).toMatchObject({ aval: "on", fonte: "calculado" });
  });
  it("Off declarado sem justificativa vira pendência do checkout", () => {
    const co = normalizarCheckout({ kpis_retrato: [{ indicador_id: "k", codigo: "S1", tipo_apontamento: "valor_periodo" }], kpis_resposta: [{ indicador_id: "k", declaracao: "off" }] });
    expect(pendenciasCheckout(co).map((p) => p.campo)).toContain("kpi-k-just");
  });
});

describe("Tipo E — entrega (regra simples)", () => {
  it("Implantada = On; Cancelada = Encerrada; Atrasada = Off", () => {
    expect(farolEntrega("implantada", "2026-12-31", depois)).toBe("on");
    expect(farolEntrega("cancelada", "2026-12-31", depois)).toBe("encerrada");
    expect(farolEntrega("atrasada", "2026-12-31", dentro)).toBe("off");
  });
  it("prazo vencido sem Implantada = Off; no prazo = acompanhamento", () => {
    expect(farolEntrega("em_implantacao", "2026-10-31", depois)).toBe("off");
    expect(farolEntrega("em_implantacao", "2026-12-31", depois)).toBe("acomp");
  });
  it("na matriz a entrega não tem atingimento nem chama crítica", () => {
    const c = celulaMes({ id: "k", sentido: "maior", meta_semestre: 5, meta_texto: null, tipo_apontamento: "entrega", prazo_entrega: "2026-09-30" }, "2026-10", 1, null, null, [], depois, { status_entrega: "em_implantacao", updated_at: "2026-10-30" });
    expect(c).toMatchObject({ aval: "off", ating: null, fonte: "entrega", prazoVencido: true });
    expect(marcarCriticos([c, c]).every((x) => !x.critico)).toBe(true);
  });
});

describe("Apontamento mais recente e alertas", () => {
  it("checkout enviado mais novo que o Lançar mês prevalece; rascunho não conta", () => {
    const ck = (st: string, d: string) => ({ semana: "2026-10-19", status: st, enviado_em: d, conteudo: { kpis_resposta: [{ indicador_id: "k", declaracao: "on" }] } });
    expect(apontamentoMaisRecente("k", "2026-10", { declaracao: "off", updated_at: "2026-10-20T00:00:00Z" }, [ck("enviado", "2026-10-27T10:00:00Z")])?.declaracao).toBe("on");
    expect(apontamentoMaisRecente("k", "2026-10", { declaracao: "off", updated_at: "2026-10-20T00:00:00Z" }, [ck("rascunho", "2026-10-27T10:00:00Z")])?.declaracao).toBe("off");
  });
  it("2+ meses declarados Off = alerta, sem desvio crítico", () => {
    const d = { valor: null, meta: 100, aval: "off" as const, origem: null, ating: null, fonte: "declarado" as const };
    const r = marcarCriticos([d, d]);
    expect(r[1]).toMatchObject({ critico: false, alertaDeclarado: true });
  });
});

describe("Taxa de conformidade", () => {
  const reg = (semana: string, enviado: string, feitos: number, total = 4) => ({ cadeira_id: "c", semana, status: "enviado", enviado_em: enviado, primeiro_envio_em: enviado, completude: { feitos, total, faltando: [] } });
  it("conforme = no prazo (segunda 23h59) e completude ≥ 90%; não enviado = não conforme", () => {
    expect(avaliarCiclo("2026-10-19", reg("2026-10-19", "2026-10-26T23:00:00-03:00", 4)).conforme).toBe(true);
    expect(avaliarCiclo("2026-10-19", reg("2026-10-19", "2026-10-27T00:30:00-03:00", 4))).toMatchObject({ conforme: false, noPrazo: false });
    expect(avaliarCiclo("2026-10-19", reg("2026-10-19", "2026-10-26T10:00:00-03:00", 3)).conforme).toBe(false);
    expect(avaliarCiclo("2026-10-19", reg("2026-10-19", "2026-10-26T10:00:00-03:00", 9, 10)).conforme).toBe(true);
    expect(avaliarCiclo("2026-10-19", reg("2026-10-19", "2026-10-26T10:00:00-03:00", 8, 10)).conforme).toBe(false);
    expect(avaliarCiclo("2026-10-19", undefined).conforme).toBe(false);
  });
  it("ciclos devidos começam no ciclo de 26/10 (checkout de 19/10) e só contam depois do prazo", () => {
    expect(semanasDevidas("2026-10-19", new Date("2026-10-26T20:00:00-03:00"))).toEqual([]);
    expect(semanasDevidas("2026-10-19", new Date("2026-11-03T10:00:00-03:00"))).toEqual(["2026-10-19", "2026-10-26"]);
  });
  it("taxa = conformes ÷ devidos, com pontualidade e completude média", () => {
    const r = conformidadeCadeira("c", [reg("2026-10-19", "2026-10-26T10:00:00-03:00", 4)], new Date("2026-11-03T10:00:00-03:00"));
    expect(r.acumulado).toMatchObject({ devidos: 2, conformes: 1, taxa: 0.5, pontualidade: 0.5, completudeMedia: 0.5 });
    expect(taxa([]).taxa).toBeNull();
  });
  it("completude conta KPI por tipo, prioridades e atas", () => {
    const co = normalizarCheckout({ kpis_retrato: [{ indicador_id: "v", codigo: "V", realizado: null }, { indicador_id: "s", codigo: "S", tipo_apontamento: "valor_periodo" }, { indicador_id: "e", codigo: "E", tipo_apontamento: "entrega" }],
      kpis_resposta: [{ indicador_id: "v", situacao_atual: "10" }, { indicador_id: "s", declaracao: "off", justificativa: "" }, { indicador_id: "e", status_entrega: "em_implantacao" }],
      atas: [{ gov_acao_id: "a", titulo: "A", status: "" }] });
    const ci = normalizarCheckin({ prioridades: [{ titulo: "P" }] });
    const c = calcularCompletude(co, ci, null);
    expect({ feitos: c.feitos, total: c.total }).toEqual({ feitos: 3, total: 5 });
    // status report: 1 item por projeto em aberto da cadeira principal; sem anexo/faróis = incompleto
    const c2 = calcularCompletude(co, ci, { total: 2, completos: 1 });
    expect({ feitos: c2.feitos, total: c2.total }).toEqual({ feitos: 4, total: 7 });
  });
});
