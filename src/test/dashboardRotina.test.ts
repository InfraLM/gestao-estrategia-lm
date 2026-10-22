import { describe, expect, it } from "vitest";
import { contar, origemDash, situacaoDash, sugerirDesvio } from "@/lib/dashboardRotina";
import { calcularCompletude } from "@/lib/conformidade";
import { normalizarCheckout, normalizarCheckin, respostaVazia } from "@/lib/rotinaSemanal";
const base = { indicador_id: "a", codigo: "A", nome: "A", origem: "bsc" as const, nivel: "Estratégico" };
describe("Outros KPIs e dashboard", () => {
  it("voluntário aparece como fora do calendário", () => {
    expect(situacaoDash({ ...base, voluntario: true, situacao_atual: "50", meta_mes: 100 })).toBe("fora");
  });
  it("voluntário não reduz a completude", () => {
    const co = normalizarCheckout({ kpis_retrato: [{ ...base, tipo_apontamento: "valor_mensal", voluntario: true }], kpis_resposta: [{ ...respostaVazia("a"), voluntario: true }] });
    const ci = normalizarCheckin({ prioridades: [{ titulo: "x" }] });
    expect(calcularCompletude(co, ci, null)).toMatchObject({ feitos: 1, total: 1 });
  });
  it("sugere desvio crítico quando Off com atingimento < 70%", () => {
    expect(sugerirDesvio({ ...base, voluntario: true, situacao_atual: "60", meta_mes: 100 })).toBe(true);
    expect(sugerirDesvio({ ...base, voluntario: true, situacao_atual: "80", meta_mes: 100 })).toBe(false);
  });
  it("conta situações e separa origens", () => {
    const c = contar([{ ...base, situacao_atual: "120", meta_mes: 100 }, { ...base, origem: "okr", declaracao: "off", tipo_apontamento: "valor_periodo", desvio_critico: true }, { ...base }]);
    expect(c).toMatchObject({ on: 1, off: 1, pendente: 1, criticos: 1, total: 3 });
    expect(origemDash({ origem: "bsc", nivel: "Tático" })).toBe("bsc_tatico");
  });
});
