import { describe, it, expect } from "vitest";
import { montarConviteQuickWins, QW_LINK } from "../../supabase/functions/rotina-avisos-enviar/email";
import { retornoStatus } from "@/lib/atualizacaoStatus";

describe("Convite por e-mail do Quick Wins", () => {
  it("usa o texto aprovado com link e data limite do ciclo", () => {
    const m = montarConviteQuickWins({ ano: 2026, prazo: "2026-11-30" });
    expect(m.subject).toBe("Quick Wins 2026: quais vocês enxergam para a sua área?");
    expect(m.text).toContain("Olá, líderes LM!");
    expect(m.text).toContain(`1. Entre em ${QW_LINK}`);
    expect(m.text).toContain("e envie até 30/11/2026.");
    expect(m.text).toContain("Cada líder pode registrar até 10.");
    expect(m.text.trim().endsWith("Naira")).toBe(true);
    expect(m.html).toContain(QW_LINK);
    expect(m.html).not.toContain("responda pelo app");
  });
  it("sem data de fechamento não deixa marcador no texto", () => {
    const m = montarConviteQuickWins({ ano: 2026, prazo: null });
    expect(m.text).not.toMatch(/\[|undefined|null/);
    expect(m.text).toContain("dentro do prazo do ciclo");
  });
  it("teste é identificado no assunto", () => expect(montarConviteQuickWins({ ano: 2026, prazo: null, teste: true }).subject.startsWith("[Teste] ")).toBe(true));
  it("o link abre a página só do formulário e volta para ela após o login", () => {
    expect(QW_LINK).toBe("https://gestao-estrategia-lm.lovable.app/quick-wins/formulario");
    expect(retornoStatus("/quick-wins/formulario")).toBe("/quick-wins/formulario");
    expect(retornoStatus("//evil.test/quick-wins/formulario")).toBe("/");
  });
});
