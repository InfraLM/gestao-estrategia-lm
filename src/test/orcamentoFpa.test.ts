import { describe, it, expect } from "vitest";
import { converterResumo, anoAtual } from "../../supabase/functions/orcamento-sync/converter";

// Resumo fictício no formato da API do orçamento do FP&A (/resumo-centros-custo); valores inventados.
const mes = (m: number, o: number, r: number, p: number) => ({ mes: m, orcado: o, realizado: r, projetado: p });
const resumo = {
  visao: "competencia", ano: 2026, mesInicio: 1, mesFim: 12,
  forecast: { id: 9, nome: "Forecast fictício", mesCorte: 10, ativo: true },
  centrosCusto: [{
    centroCusto: { id: 7, nome: "Centro fictício", buId: 2 },
    categorias: [{ categoria1: { id: 1, codigo: "3.1", nome: "Receita Bruta", tipo: "receita" }, meses: [mes(1, 100, 90, 95), mes(2, 100, 110, 105)] }],
    camposCalculados: [{ nome: "EBITDA", formato: "monetario", meses: [mes(1, 10, 8, 9), mes(2, 10, 12, 11)] }],
  }],
  empresa: {
    categorias: [{ categoria1: { id: 1, codigo: "3.1", nome: "Receita Bruta", tipo: "receita" }, meses: [mes(1, 1000, 900, 950)] }],
    camposCalculados: [{ nome: "Margem EBITDA (%)", formato: "porcentagem", meses: [mes(1, 0.2, 0.18, 0.19)] }],
  },
};

describe("API do orçamento do FP&A: conversão do resumo", () => {
  it("gera uma linha por centro × item × mês, com o consolidado da empresa no centro 0", () => {
    const l = converterResumo(resumo, "competencia");
    expect(l).toHaveLength(6);
    expect(l.filter((x) => x.centro_custo_id === 0)).toHaveLength(2);
    expect(l[0]).toEqual({ visao: "competencia", ano: 2026, mes: 1, centro_custo_id: 7, centro_custo_nome: "Centro fictício", bu_id: 2,
      item_tipo: "categoria", item_chave: "3.1", item_nome: "Receita Bruta", categoria_tipo: "receita", formato: null,
      orcado: 100, realizado: 90, projetado: 95, forecast_nome: "Forecast fictício" });
    expect(l.find((x) => x.item_nome === "Margem EBITDA (%)")).toMatchObject({ item_tipo: "calculado", formato: "porcentagem", centro_custo_id: 0, realizado: 0.18 });
  });

  it("recusa visão trocada, formato estranho e mês inválido", () => {
    expect(() => converterResumo(resumo, "caixa")).toThrow("Contrato inválido");
    expect(() => converterResumo({ ...resumo, centrosCusto: null }, "competencia")).toThrow("Contrato inválido");
    const mesRuim = structuredClone(resumo); mesRuim.centrosCusto[0].categorias[0].meses[0].mes = 13;
    expect(() => converterResumo(mesRuim, "competencia")).toThrow("Contrato inválido");
  });

  it("recusa linha repetida e transforma número inválido em vazio", () => {
    const dup = structuredClone(resumo); dup.centrosCusto[0].categorias.push(structuredClone(dup.centrosCusto[0].categorias[0]));
    expect(() => converterResumo(dup, "competencia")).toThrow("Linha duplicada no resumo");
    const nan = structuredClone(resumo) as any; nan.empresa.categorias[0].meses[0].realizado = "abc";
    expect(converterResumo(nan, "competencia").find((x) => x.centro_custo_id === 0 && x.item_tipo === "categoria")!.realizado).toBeNull();
  });

  it("ano atual é o de São Paulo (virada do ano em UTC não adianta)", () => {
    expect(anoAtual(new Date("2027-01-01T02:00:00Z"))).toBe(2026);
    expect(anoAtual(new Date("2027-01-01T04:00:00Z"))).toBe(2027);
  });
});
