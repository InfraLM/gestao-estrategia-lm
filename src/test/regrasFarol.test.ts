import { describe, it, expect } from "vitest";
import { montarRegras, pctDoIndicador, lerPct, fmtPct, exemploFaixa, REGRAS_PADRAO } from "@/features/metas/lib/regrasFarol";
import { farol } from "@/lib/farol";
import { celulaMes } from "@/features/metas/lib/matrizApontamentos";

describe("regras do farol configuráveis", () => {
  it("sem tabela no banco vale o padrão de 5%", () => {
    expect(pctDoIndicador(null, "x")).toBe(0.05);
    expect(montarRegras(null, null)).toEqual(REGRAS_PADRAO);
  });

  it("exceção ativa substitui a faixa geral só no indicador dela", () => {
    const r = montarRegras({ amarelo_pct: "0.08" }, [
      { indicador_id: "a", amarelo_pct: 0.02, motivo: "sensível", ativo: true },
      { indicador_id: "b", amarelo_pct: 0.3, ativo: false },
    ]);
    expect(r.ativas).toBe(true);
    expect(pctDoIndicador(r, "a")).toBe(0.02);
    expect(pctDoIndicador(r, "b")).toBe(0.08);
    expect(pctDoIndicador(r, "c")).toBe(0.08);
  });

  it("lê o percentual digitado e recusa fora de 0% a 50%", () => {
    expect(lerPct("5")).toBe(0.05);
    expect(lerPct("2,5%")).toBe(0.025);
    expect(lerPct("0")).toBe(0);
    expect(lerPct("")).toBeNull();
    expect(lerPct("abc")).toBeNull();
    expect(lerPct("51")).toBeNull();
    expect(lerPct("-1")).toBeNull();
    expect(fmtPct(0.025)).toBe("2,5%");
    expect(exemploFaixa(0.05)).toContain("amarelo de 95");
  });

  it("a faixa muda a cor: 92 com meta 100 é vermelho a 5% e amarelo a 10%", () => {
    const base = { aval: "off" as const, valor: 92, meta: 100, sentido: "maior" as const };
    expect(farol({ ...base, toleranciaPct: 0.05 })).toBe("vermelho");
    expect(farol({ ...base, toleranciaPct: 0.1 })).toBe("amarelo");
  });

  it("a célula da matriz usa a faixa do indicador (farol_pct)", () => {
    const ind = { id: "i1", sentido: "maior" as const, meta_semestre: 100, meta_texto: null, tipo_apontamento: "valor_mensal" as const, origem: "okr" };
    const fim = new Date("2026-09-15T12:00:00Z");
    expect(celulaMes(ind as any, "2026-07", 100, 92, null, [], fim).farol).toBe("vermelho");
    expect(celulaMes({ ...ind, farol_pct: 0.1 } as any, "2026-07", 100, 92, null, [], fim).farol).toBe("amarelo");
  });
});
