import { describe, it, expect } from "vitest";
import { codigoDoNome, rotuloMaturidade, rotuloGrau, melhoriaRelevante, divergencias } from "@/lib/processosImpacto";
import { estaAtrasado } from "@/lib/impactoObjetivo";
import { mapearExport, sugerirIndicador, kpiChave } from "../../supabase/functions/processos-sync/mapear";

describe("processos no impacto estratégico", () => {
  it("maturidade principal é nível/gate, nunca ICEP", () => {
    expect(rotuloMaturidade(3, "Gate 2")).toBe("Nível 3 · Gate 2");
    expect(rotuloMaturidade(null, null)).toBeNull();
  });
  it("grau = hoje → alvo", () => { expect(rotuloGrau(2, 4)).toBe("2 → 4"); });
  it("melhorias só em andamento e implantadas", () => {
    expect(melhoriaRelevante("Em andamento")).toBe(true);
    expect(melhoriaRelevante("Implantada")).toBe(true);
    expect(melhoriaRelevante("Backlog")).toBe(false);
    expect(melhoriaRelevante("Cancelada")).toBe(false);
  });
  it("melhoria em andamento com previsão vencida conta como atrasada; implantada não", () => {
    expect(estaAtrasado({ origem: "processo", prazo: "2026-10-01", status: "Em andamento" }, "2026-10-22")).toBe(true);
    expect(estaAtrasado({ origem: "processo", prazo: "2026-10-01", status: "Implantada" }, "2026-10-22")).toBe(false);
  });
  it("divergências local × espelho por código", () => {
    expect(codigoDoNome("02.10.06 – Operar Experiência")).toBe("02.10.06");
    const d = divergencias([{ id: "x", nome: "02.10.06 – Operar Experiência", maturidade: 2 }, { id: "y", nome: "01.01 - Só local", maturidade: null }],
      [{ codigo: "02.10.06", nome: "Operar experiência", maturidade_nivel: 3 }, { codigo: "09.09", nome: "Novo", maturidade_nivel: 1 }]);
    expect(d.map((x) => `${x.codigo}:${x.tipo}`).sort()).toEqual(["01.01:so_local", "02.10.06:maturidade", "09.09:so_zeev"]);
  });
  it("exportação vira um registro por KPI e correspondência é só sugestão", () => {
    const m = mapearExport({ processos: [{ id: 1, codigo: "02.10.06", impactos: [{ kpi_codigo: "f.01.02", kpi_nome: "LTV / CAC", vinculo: "Direto" }, { kpi_nome: "NPS" }] }] });
    expect(m.imps).toHaveLength(2);
    expect(kpiChave("F.01.02", "x")).toBe("c:f.01.02");
    const inds = [{ id: "a", codigo: "f.01.02", nome: "F01.01 LTV / CAC" }, { id: "b", codigo: "c.01", nome: "NPS" }];
    expect(sugerirIndicador("f.01.02", "qualquer", inds)).toBe("a");
    expect(sugerirIndicador(null, "nps", inds)).toBe("b");
    expect(sugerirIndicador(null, "inexistente", inds)).toBeNull();
  });
});
