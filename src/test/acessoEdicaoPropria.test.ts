import { describe, expect, it } from "vitest";
import { canAccessModule, MODULOS_EDICAO_PROPRIA } from "@/lib/moduleAccess";

describe("nível Edição dos próprios", () => {
  const grants = [{ modulo: "okrs", nivel: "edicao_propria" as const }, { modulo: "repositorios", nivel: "edicao_propria" as const }];
  it("lê o módulo como consulta", () => {
    expect(canAccessModule(grants, "okrs")).toBe(true);
    expect(canAccessModule(grants, "repositorios")).toBe(true);
  });
  it("não dá edição geral", () => {
    expect(canAccessModule(grants, "okrs", true)).toBe(false);
    expect(canAccessModule(grants, "repositorios", true)).toBe(false);
  });
  it("só existe para OKRs e Repositórios", () => {
    expect([...MODULOS_EDICAO_PROPRIA].sort()).toEqual(["okrs", "repositorios"]);
  });
});
