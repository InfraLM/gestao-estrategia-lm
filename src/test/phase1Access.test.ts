import { describe, expect, it } from "vitest";
import { ACCESS_MODULES, canAccessModule, canAccessSocios, moduleForPath } from "@/lib/moduleAccess";
import { canAccessPhase1Path } from "@/lib/phase1Access";

describe("Fase 1 · novos módulos seguros", () => {
  for (const module of ["decisoes", "estrutura", "incentivos"]) {
    it(`${module} fica fechado sem grant`, () => expect(canAccessModule([], module)).toBe(false));
    it(`${module} permite consulta explícita sem edição`, () => {
      const grants = [{ modulo: module, nivel: "leitura" as const }];
      expect(canAccessModule(grants, module)).toBe(true);
      expect(canAccessModule(grants, module, true)).toBe(false);
    });
    it(`${module} permite edição explícita`, () => expect(canAccessModule([{ modulo: module, nivel: "edicao" }], module, true)).toBe(true));
    it(`${module} permite super_admin e admin`, () => {
      expect(canAccessModule([], module, true, true)).toBe(true);
      expect(canAccessModule([{ modulo: module, nivel: "nenhum" }], module, true, false, true)).toBe(true);
    });
  }
  it("mantém os módulos antigos abertos sem override", () => {
    for (const module of ACCESS_MODULES.filter(m => !["decisoes", "estrutura", "incentivos"].includes(m.id))) expect(canAccessModule([], module.id)).toBe(true);
    expect(canAccessModule([], "repositorios")).toBe(true);
    expect(canAccessModule([{ modulo: "pmo", nivel: "nenhum" }], "pmo", false, false, true)).toBe(false);
  });
  it("mapeia as novas páginas sem alterar a Cesta atual", () => {
    expect(moduleForPath("/contexto-decisoes")).toBe("decisoes");
    expect(moduleForPath("/estrutura-organizacional")).toBe("estrutura");
    expect(moduleForPath("/incentivos")).toBe("incentivos");
    expect(moduleForPath("/cesta-metas/insights")).toBe("incentivos");
    expect(moduleForPath("/cesta-metas")).toBe("cesta");
    expect(moduleForPath("/socios/insights")).toBe("socios");
  });
  it("insights sócios exigem consolidado explícito", () => {
    expect(canAccessSocios({ ativo: true, respondente: true, pode_ver_consolidado: false }, "/socios/insights")).toBe(false);
    expect(canAccessSocios({ ativo: true, respondente: false, pode_ver_consolidado: true }, "/socios/insights")).toBe(true);
    expect(canAccessSocios({ ativo: false, respondente: true, pode_ver_consolidado: true }, "/socios/insights")).toBe(false);
  });
  it("ocupante e diretor veem apenas seus respectivos espaços de incentivos", () => {
    const own = { ocupante: true, diretor: false };
    expect(canAccessPhase1Path("/incentivos", [], false, false, own)).toBe(true);
    expect(canAccessPhase1Path("/estrutura-organizacional", [], false, false, own)).toBe(false);
    expect(canAccessPhase1Path("/cesta-metas/insights", [], false, false, own)).toBe(false);
    expect(canAccessPhase1Path("/cesta-metas/insights", [], false, false, { ocupante: false, diretor: true })).toBe(true);
  });
});