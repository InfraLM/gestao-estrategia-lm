import { describe, it, expect } from "vitest";
import { estaAtrasado, resumoImpacto, ItemImpacto } from "@/lib/impactoObjetivo";

const it_ = (p: Partial<ItemImpacto>): ItemImpacto => ({ id: "1", titulo: "x", origem: "ata", status: "Em andamento", prazo: "2026-10-01", responsavel: null, cadeira: null, ...p });

describe("impacto por objetivo", () => {
  it("atrasado = prazo vencido e não concluído", () => {
    expect(estaAtrasado(it_({}), "2026-10-22")).toBe(true);
    expect(estaAtrasado(it_({ status: "Concluída" }), "2026-10-22")).toBe(false);
    expect(estaAtrasado(it_({ prazo: "2026-11-01" }), "2026-10-22")).toBe(false);
  });
  it("decisão é marco e nunca atrasa", () => {
    expect(estaAtrasado(it_({ origem: "decisao" }), "2026-10-22")).toBe(false);
  });
  it("resumo conta por origem sem duplicar o mesmo item", () => {
    const r = resumoImpacto([it_({}), it_({}), it_({ id: "2", origem: "projeto", prazo: null })], "2026-10-22");
    expect(r).toEqual({ total: 2, porOrigem: { ata: 1, projeto: 1 }, atrasados: 1 });
  });
});
