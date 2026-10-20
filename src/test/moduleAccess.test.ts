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
import { canAccessSocios } from "@/lib/moduleAccess";
describe("Desejos dos Sócios · acesso fechado por padrão", () => {
  it("quem não é participante não entra, mesmo sem exceções", () => {
    expect(canAccessSocios(null)).toBe(false);
    expect(moduleForPath("/socios/formulario")).toBe("socios");
  });
  it("consolidado só com permissão explícita", () => {
    expect(canAccessSocios({ respondente: true, pode_ver_consolidado: false, ativo: true }, "/socios/consolidado")).toBe(false);
    expect(canAccessSocios({ respondente: true, pode_ver_consolidado: true, ativo: true }, "/socios/consolidado")).toBe(true);
  });
  it("Naira (não respondente) vê consolidado mas não tem formulário", () => {
    const naira = { respondente: false, pode_ver_consolidado: true, ativo: true };
    expect(canAccessSocios(naira, "/socios/formulario")).toBe(false);
    expect(canAccessSocios(naira, "/socios/consolidado")).toBe(true);
  });
});
