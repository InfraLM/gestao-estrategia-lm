import { describe, expect, it } from "vitest";
import { canAccessModule, MODULOS_EDICAO_PROPRIA } from "@/lib/moduleAccess";

describe("nível Edição dos próprios", () => {
  const grants = [{ modulo: "okrs", nivel: "edicao_propria" as const }];
  it("lê o módulo como consulta", () => {
    expect(canAccessModule(grants, "okrs")).toBe(true);
  });
  it("não dá edição geral", () => {
    expect(canAccessModule(grants, "okrs", true)).toBe(false);
  });
  it("só existe para OKRs", () => {
    expect([...MODULOS_EDICAO_PROPRIA].sort()).toEqual(["okrs"]);
  });
});
