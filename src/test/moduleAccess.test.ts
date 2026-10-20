import { describe, expect, it } from "vitest";
import { canAccessModule, moduleForPath } from "@/lib/moduleAccess";

describe("Acessos por usuário e módulo", () => {
  it("bloqueia consulta e edição quando não há acesso", () => {
    expect(canAccessModule([{ modulo: "pmo", nivel: "nenhum" }], "pmo")).toBe(false);
    expect(canAccessModule([{ modulo: "pmo", nivel: "nenhum" }], "pmo", true)).toBe(false);
  });
  it("consulta não permite edição", () => {
    expect(canAccessModule([{ modulo: "okrs", nivel: "leitura" }], "okrs")).toBe(true);
    expect(canAccessModule([{ modulo: "okrs", nivel: "leitura" }], "okrs", true)).toBe(false);
  });
  it("edição permite ler e editar somente o módulo configurado", () => {
    const grants = [{ modulo: "pmo", nivel: "edicao" as const }, { modulo: "okrs", nivel: "nenhum" as const }];
    expect(canAccessModule(grants, "pmo", true)).toBe(true);
    expect(canAccessModule(grants, "okrs")).toBe(false);
  });
  it("preserva acesso existente quando não foi configurada uma exceção", () => {
    expect(canAccessModule([], "metas")).toBe(true);
  });
  it("mantém acesso total para Admin Principal", () => {
    expect(canAccessModule([{ modulo: "pmo", nivel: "nenhum" }], "pmo", true, true)).toBe(true);
  });
  it("protege projeto individual e distingue semanal do mensal", () => {
    expect(moduleForPath("/gestao/P143")).toBe("pmo");
    expect(moduleForPath("/metas/semanal")).toBe("rotina");
    expect(moduleForPath("/metas/lancamento")).toBe("metas");
    expect(moduleForPath("/historico/okrs")).toBe("historico");
  });
});