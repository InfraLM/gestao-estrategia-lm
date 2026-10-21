import { describe, expect, it } from "vitest";
import { codigoEstrategicoValido, lerFichaEstrategica, linkEstrategico, parametrosFicha } from "@/lib/linksEstrategicos";

describe("Links diretos dos espaços estratégicos", () => {
  it("aceita GOV somente na página de decisões e respeita visibilidade", () => {
    const codigo = "GOV-CES-20260618-03";
    expect(linkEstrategico(codigo)).toBe(`/contexto-decisoes?codigo=${codigo}`);
    expect(codigoEstrategicoValido(codigo, "DS")).toBe(false);
    expect(lerFichaEstrategica(new URLSearchParams(`codigo=${codigo}`), "D", new Set([codigo]), true)).toEqual({ codigo, indisponivel: false });
    expect(lerFichaEstrategica(new URLSearchParams(`codigo=${codigo}`), "D", new Set(), true)).toEqual({ codigo: null, indisponivel: true });
    for (const invalido of ["GOV-CES-20260618-3", "GOV-CES1-20260618-03", "GOV-CES-20260618-03x"]) expect(linkEstrategico(invalido)).toBeNull();
  });
  it("gera URLs para decisão e desejo", () => {
    expect(linkEstrategico("D-060")).toBe("/contexto-decisoes?codigo=D-060");
    expect(linkEstrategico("DS-43")).toBe("/socios/insights?codigo=DS-43");
  });
  it.each([null, "", "D-60", "DS-043", "d-060", "D-060x", "D-060&admin=true", "https://site/D-060"])("rejeita código inválido %s", codigo => {
    expect(linkEstrategico(codigo)).toBeNull();
  });
  it("distingue o tipo da página", () => {
    expect(codigoEstrategicoValido("DS-43", "D")).toBe(false);
    expect(codigoEstrategicoValido("D-060", "DS")).toBe(false);
  });
  it("abre D-060 somente se estiver visível", () => {
    expect(lerFichaEstrategica(new URLSearchParams("codigo=D-060"), "D", new Set(["D-060"]), true)).toEqual({ codigo: "D-060", indisponivel: false });
  });
  it("abre DS-43 somente se estiver visível", () => {
    expect(lerFichaEstrategica(new URLSearchParams("codigo=DS-43"), "DS", new Set(["DS-43"]), true)).toEqual({ codigo: "DS-43", indisponivel: false });
  });
  it("avisa sem abrir ficha para registro ausente ou sem acesso", () => {
    expect(lerFichaEstrategica(new URLSearchParams("codigo=D-006"), "D", new Set(["D-060"]), true)).toEqual({ codigo: null, indisponivel: true });
    expect(lerFichaEstrategica(new URLSearchParams("codigo=D-060"), "D", new Set(), true)).toEqual({ codigo: null, indisponivel: true });
  });
  it("avisa para parâmetro inválido ou tipo incorreto", () => {
    for (const search of ["codigo=", "codigo=D-60", "codigo=DS-43"]) {
      expect(lerFichaEstrategica(new URLSearchParams(search), "D", new Set(["D-060"]), true)).toEqual({ codigo: null, indisponivel: true });
    }
  });
  it("não mostra aviso antes da consulta concluir", () => {
    expect(lerFichaEstrategica(new URLSearchParams("codigo=D-060"), "D", new Set(), false)).toEqual({ codigo: null, indisponivel: false });
  });
  it("sem parâmetro mantém somente a lista", () => {
    expect(lerFichaEstrategica(new URLSearchParams(), "D", new Set(["D-060"]), true)).toEqual({ codigo: null, indisponivel: false });
  });
  it("substitui o código preservando outros parâmetros sem mutar a origem", () => {
    const antes = new URLSearchParams("codigo=D-060&filtro=abc");
    expect(parametrosFicha(antes, "D-061").toString()).toBe("codigo=D-061&filtro=abc");
    expect(antes.get("codigo")).toBe("D-060");
    expect(parametrosFicha(antes, null).toString()).toBe("filtro=abc");
  });
});