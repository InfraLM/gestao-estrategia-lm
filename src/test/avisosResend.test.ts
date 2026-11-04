import { describe, it, expect } from "vitest";
import { cicloAtual, montarEmail, tokenValido } from "../../supabase/functions/rotina-avisos-enviar/email";
import { alternarPermitido, recebeAutomatico } from "@/lib/avisosCiclo";

const p = { prioridades: 1, kpis: 3, atas: 2, status_reports: 0 };
describe("E-mails semanais via Resend", () => {
  it("sexta 08:00 SP aponta para o ciclo da segunda seguinte", () => expect(cicloAtual(new Date("2026-11-06T11:00:00Z"))).toBe("2026-11-09"));
  it("segunda 09:00 SP usa o próprio ciclo", () => expect(cicloAtual(new Date("2026-11-09T12:00:00Z"))).toBe("2026-11-09"));
  it("domingo à noite SP continua no ciclo de segunda", () => expect(cicloAtual(new Date("2026-11-09T01:00:00Z"))).toBe("2026-11-09"));
  it("abertura traz prazo, contagens e link do ciclo", () => {
    const m = montarEmail({ nome: "Naira Yurie", ciclo: "2026-11-09", tipo: "abertura", pendencias: p });
    expect(m.subject).toBe("Check-in/checkout do ciclo 09/11/2026 está aberto");
    expect(m.text).toContain("Olá, Naira.");
    expect(m.text).toContain("3 KPI(s)");
    expect(m.text).toContain("semana=2026-11-09");
    expect(m.text).not.toContain("status report");
  });
  it("lembrete e teste são identificados no assunto", () => {
    expect(montarEmail({ nome: "Naira", ciclo: "2026-11-09", tipo: "lembrete", pendencias: p, teste: true }).subject).toBe("[Teste] Lembrete: check-in/checkout vence hoje às 23h59");
  });
  it("escapa HTML e ignora campos fora das contagens", () => {
    const m = montarEmail({ nome: "<b>x</b>", ciclo: "2026-11-09", tipo: "abertura", pendencias: { ...p, segredo: "RESERVADO" } as never });
    expect(m.html).not.toContain("<b>x");
    expect(JSON.stringify(m)).not.toContain("RESERVADO");
  });
  it("recusa ciclo que não é segunda", () => expect(() => montarEmail({ nome: "N", ciclo: "2026-11-06", tipo: "abertura", pendencias: p })).toThrow());
  it("token de cron vazio ou curto nunca autoriza", () => {
    const t = "x".repeat(32);
    expect(tokenValido(t, t)).toBe(true);
    expect(tokenValido("", "")).toBe(false);
    expect(tokenValido("abc", "abc")).toBe(false);
    expect(tokenValido(null, t)).toBe(false);
  });
  it("lista nula = todos elegíveis; desmarcar parte de todos", () => {
    expect(recebeAutomatico("a@x.com", null)).toBe(true);
    expect(alternarPermitido(null, ["a@x.com", "b@x.com"], "B@x.com", false)).toEqual(["a@x.com"]);
    expect(recebeAutomatico("b@x.com", ["a@x.com"])).toBe(false);
  });
});
