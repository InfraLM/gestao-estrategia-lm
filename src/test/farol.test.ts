import { describe, it, expect } from "vitest";
import { farol, contarFarol, distanciaDaMeta, TOLERANCIA_PADRAO_PCT } from "@/lib/farol";

describe("farol de 3 cores (glossário: verde, amarelo até 5% abaixo, vermelho)", () => {
  it("On track é verde; sem avaliação não tem farol", () => {
    expect(farol({ aval: "on", valor: 100, meta: 100, sentido: "maior" })).toBe("verde");
    for (const aval of ["acomp", "pendente", "sem_meta", "encerrada"] as const) expect(farol({ aval, valor: 50, meta: 100, sentido: "maior" })).toBeNull();
  });

  it("maior é melhor: até 5% abaixo é amarelo, mais que isso é vermelho", () => {
    expect(TOLERANCIA_PADRAO_PCT).toBe(0.05);
    expect(farol({ aval: "off", valor: 95, meta: 100, sentido: "maior" })).toBe("amarelo");
    expect(farol({ aval: "off", valor: 94.9, meta: 100, sentido: "maior" })).toBe("vermelho");
  });

  it("menor é melhor: até 5% acima é amarelo", () => {
    expect(farol({ aval: "off", valor: 1.05, meta: 1, sentido: "menor" })).toBe("amarelo");
    expect(farol({ aval: "off", valor: 1.2, meta: 1, sentido: "menor" })).toBe("vermelho");
  });

  it("meta em texto com sentido próprio e faixa", () => {
    expect(farol({ aval: "off", valor: 66, meta: "> 70", sentido: "maior" })).toBe("vermelho");
    expect(farol({ aval: "off", valor: 68, meta: "≥ 70", sentido: "maior" })).toBe("amarelo");
    expect(farol({ aval: "off", valor: 78, meta: "80 a 90", sentido: "maior" })).toBe("amarelo");
    expect(farol({ aval: "off", valor: 70, meta: "80 a 90", sentido: "maior" })).toBe("vermelho");
    expect(distanciaDaMeta(95, { tipo: "faixa", min: 80, max: 90 }, "maior")).toBe(5);
  });

  it("tolerância cadastrada no indicador (unidade da meta) substitui os 5%", () => {
    expect(farol({ aval: "off", valor: 90, meta: 100, sentido: "maior", tolerancia: 10 })).toBe("amarelo");
    expect(farol({ aval: "off", valor: 89, meta: 100, sentido: "maior", tolerancia: 10 })).toBe("vermelho");
    expect(farol({ aval: "off", valor: 99, meta: 100, sentido: "maior", tolerancia: 0 })).toBe("amarelo");
  });

  it("On track só pela tolerância cadastrada (abaixo da meta) é amarelo", () => {
    expect(farol({ aval: "on", valor: 92, meta: 100, sentido: "maior", tolerancia: 10 })).toBe("amarelo");
    expect(farol({ aval: "on", valor: 101, meta: 100, sentido: "maior", tolerancia: 10 })).toBe("verde");
    expect(farol({ aval: "on", valor: null, meta: "Implantar", sentido: "maior" })).toBe("verde");
  });

  it("Off track sem número (declarado ou entrega) é vermelho", () => {
    expect(farol({ aval: "off", valor: null, meta: 100, sentido: "maior" })).toBe("vermelho");
    expect(farol({ aval: "off", valor: 50, meta: "Implantar o CRM", sentido: "maior" })).toBe("vermelho");
  });

  it("meta zero: só a tolerância cadastrada gera amarelo", () => {
    expect(farol({ aval: "off", valor: 1, meta: 0, sentido: "menor" })).toBe("vermelho");
    expect(farol({ aval: "off", valor: 1, meta: 0, sentido: "menor", tolerancia: 2 })).toBe("amarelo");
  });

  it("conta as cores", () => {
    expect(contarFarol(["verde", "amarelo", "vermelho", "vermelho", null])).toEqual({ verde: 1, amarelo: 1, vermelho: 2, sem_farol: 1 });
  });
});
