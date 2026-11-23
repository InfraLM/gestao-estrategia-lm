import { describe, it, expect } from "vitest";
import { celulaMes } from "@/features/metas/lib/matrizApontamentos";

const ind = (o: Record<string, unknown> = {}) => ({ id: "k1", sentido: "maior" as const, meta_semestre: 100, meta_texto: null, tipo_apontamento: "valor_mensal" as const, origem: "bsc", ...o });
const depois = new Date(2026, 11, 15);

describe("farol na matriz de apontamentos", () => {
  it("valor mensal: até 5% abaixo da meta do mês é amarelo; mais que isso, vermelho; na meta, verde", () => {
    expect(celulaMes(ind(), "2026-10", 100, 96, null, [], depois).farol).toBe("amarelo");
    expect(celulaMes(ind(), "2026-10", 100, 80, null, [], depois).farol).toBe("vermelho");
    expect(celulaMes(ind(), "2026-10", 100, 100, null, [], depois).farol).toBe("verde");
  });
  it("mês ainda aberto não tem farol", () => {
    expect(celulaMes(ind(), "2026-12", 100, 96, null, [], depois).farol).toBeNull();
  });
  it("meta semestral declarada pelo diretor: Off é vermelho, sem medir distância", () => {
    const i = ind({ tipo_apontamento: "valor_periodo" });
    const lanc = { declaracao: "off", updated_at: "2026-10-20T10:00:00Z" };
    expect(celulaMes(i, "2026-10", null, 97, null, [], depois, lanc).farol).toBe("vermelho");
  });
});
