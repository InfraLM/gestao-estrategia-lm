import { describe, expect, it } from "vitest";
import { doMapaArvore, ehMetricaMae, itemArvore } from "@/lib/bscRev03";
import { rotuloKpiId } from "@/features/preOffsite/presentation";

describe("BSC Rev.03", () => {
  it("encontra a situação Rev.02 pelo nome anterior após a renomeação", () => {
    const mapa = { "F01 Receita Líquida": "14,6 mi" };
    expect(doMapaArvore(mapa, { nome: "F01.01 Receita líquida (piso, meta e superação)", nome_anterior: "F01 Receita Líquida" })).toBe("14,6 mi");
    expect(doMapaArvore(mapa, { nome: "F01.02 VP vendido", nome_anterior: null })).toBeUndefined();
  });
  it("item da árvore também vem pelo nome anterior", () => {
    const arv = [{ kpis: [{ kpi: "AC02.01 eNPS", meta2026: "70" }] }];
    expect(itemArvore(arv, { nome: "AC01.04 eNPS e turnover", nome_anterior: "AC02.01 eNPS" })?.meta2026).toBe("70");
  });
  it("NSM é métrica-mãe e não KPI de objetivo", () => {
    expect(ehMetricaMae({ nivel: "Métrica-mãe" })).toBe(true);
    expect(ehMetricaMae({ nivel: "Estratégico" })).toBe(false);
  });
  it("KPI arquivado aparece com o nome da Rev.02", () => {
    expect(rotuloKpiId("x", [], [{ id: "x", nome: "P03-a Cobertura", nome_anterior: "P03-a Cobertura de prática" }])).toBe("KPI arquivado (Rev.02): P03-a Cobertura de prática");
    expect(rotuloKpiId("y", [{ id: "y", nome: "P03 Ocupação" }], [])).toBe("P03 Ocupação");
  });
});
