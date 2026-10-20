import { describe, expect, it } from "vitest";
import { agruparOrigem, agruparStatus, filtrarInsights, type InsightSocio } from "@/pages/sociosInsights";

const insight = (campos: Partial<InsightSocio> = {}): InsightSocio => ({
  id: "teste", codigo: "DS-01", desejo: "Desejo", origem: null, dono_proposto: null,
  prazo_custo: null, leitura_filtro: null, status: null, fonte: null, observacoes: null,
  created_at: "", updated_at: "", ...campos,
});
describe("Insights Sócios · somente leitura", () => {
  it.each(["Passa", "Piloto", "Máquina", "Gestão interna", "Arquivado"])("mantém o grupo %s", status => {
    expect(agruparStatus(status)).toBe(status);
  });
  it.each(["Decidido (D-024)", "Decidido provisório (D-035)", "Em execução: item (1) decidido na D-064"])("agrupa %s em Decidido", status => {
    expect(agruparStatus(status)).toBe("Decidido");
  });
  it.each(["Registrado", "Registrado; pedir dado", "Encaminhado pela D-111", "Processo desenhado (D-088); sem prazo"])("agrupa %s em Registrado", status => {
    expect(agruparStatus(status)).toBe("Registrado");
  });
  it.each(["Dividir", "Coberto", "Sem contexto", "Tópico próprio", "Ideia", null, "Desconhecido"])("agrupa %s em Outros", status => {
    expect(agruparStatus(status)).toBe("Outros");
  });
  it.each([
    ["Evento, início de 2026 [premissa]", "Evento, início de 2026"],
    ["Anotações de Ian [premissa: data]", "Anotações de Ian"],
    ["Pensamentos estratégicos, 17/10", "Pensamentos estratégicos, 17/10"],
    ["Ian, 18/10 (áudio; a confirmar)", "Ian, 18/10 a 20/10"],
    ["Ian, 19/10 (prioridade máxima declarada)", "Ian, 18/10 a 20/10"],
    ["Ian, 20/10", "Ian, 18/10 a 20/10"],
    ["Outro Ian, 19/10", null], [null, null],
  ])("agrupa origem %s como %s", (origem, esperado) => expect(agruparOrigem(origem)).toBe(esperado));
  it("combina origem agrupada, status e busca sem acento nos cinco campos", () => {
    const filtros = { busca: "", origem: "Ian, 18/10 a 20/10", status: "Decidido" };
    const item = insight({ origem: "Ian, 19/10 (pergunta)", status: "Em execução: D-064" });
    expect(filtrarInsights([item, insight()], filtros)).toEqual([item]);
    expect(filtrarInsights([item], { ...filtros, origem: "Anotações de Ian" })).toEqual([]);
    expect(filtrarInsights([item], { ...filtros, status: "Registrado" })).toEqual([]);
    for (const campo of ["codigo", "desejo", "origem", "dono_proposto", "leitura_filtro"] as const) {
      expect(filtrarInsights([insight({ [campo]: "Reunião Ágil" })], { busca: " REUNIAO agil ", origem: "todos", status: "todos" })).toHaveLength(1);
    }
    expect(filtrarInsights([item], { ...filtros, busca: "inexistente" })).toEqual([]);
  });
});