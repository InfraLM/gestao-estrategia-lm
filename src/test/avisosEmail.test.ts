import { describe, it, expect } from "vitest";
import { base64url, cicloAtual, mensagemMime, montarEmail, montarImpedimento, tokenValido } from "../../supabase/functions/rotina-avisos-enviar/email";
import { alternarPermitido, recebeAutomatico } from "@/lib/avisosCiclo";
import { credencialGmail, dicaOAuth } from "../../supabase/functions/rotina-avisos-enviar/gmail";

const p = { prioridades: 1, kpis: 3, atas: 2, status_reports: 0 };
describe("E-mails semanais via Gmail", () => {
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
  it("lembrete identificado no assunto e sem marca de teste", () => {
    const m = montarEmail({ nome: "Naira", ciclo: "2026-11-09", tipo: "lembrete", pendencias: p });
    expect(m.subject).toBe("Lembrete: check-in/checkout vence hoje às 23h59");
    expect(m.html + m.text).not.toMatch(/teste/i);
  });
  it("HTML formatado com a marca LM e o mesmo texto", () => {
    const m = montarEmail({ nome: "Naira Yurie", ciclo: "2026-11-09", tipo: "abertura", pendencias: p });
    expect(m.html).toContain("<!doctype html>");
    expect(m.html).toContain("Gestão e Estratégia");
    expect(m.html).toContain("Olá, Naira.");
    expect(m.html).toContain("3 KPI(s) a apontar");
    expect(m.html).toContain("Abrir meu check-in/checkout");
    expect(m.html).toContain("semana=2026-11-09");
    const i = montarImpedimento({ nome: "Ana", ciclo: "2026-11-09", pendencias: { cadeira_origem: "Financeiro" } });
    expect(i.subject).toBe("Impedimento recebido · Financeiro");
    expect(i.html).toContain("Ver impedimento");
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
  it("MIME do Gmail codifica assunto/corpo em UTF-8 e bloqueia injeção de cabeçalho", () => {
    const m = montarEmail({ nome: "Naira", ciclo: "2026-11-09", tipo: "abertura", pendencias: p });
    const raw = mensagemMime({ nome: "Gestão Estratégica LM", email: "gestao@liberdademedicaedu.com.br" }, "naira@x.com", { ...m, subject: "Olá\r\nBcc: x@evil.com" });
    expect(raw).toContain("To: <naira@x.com>");
    expect(raw).not.toMatch(/^Bcc:/m);
    const assunto = raw.match(/^Subject: =\?UTF-8\?B\?(.+)\?=$/m)![1];
    expect(new TextDecoder().decode(Uint8Array.from(atob(assunto), c => c.charCodeAt(0)))).toBe("Olá Bcc: x@evil.com");
    expect(raw.split("\r\n").every(l => l.length <= 998)).toBe(true);
    expect(() => mensagemMime({ nome: "x", email: "gestao@x.com" }, "a@x.com>\r\nBcc: b@x.com", m)).toThrow();
  });
  it("base64url sem padding", () => expect(base64url(new Uint8Array([251, 255]))).toBe("-_8"));
  it("credencial ignora espaços colados e prefere refresh token sem conta de serviço", () => {
    const env: Record<string, string> = { GMAIL_CLIENT_ID: " id.apps.googleusercontent.com\n", GMAIL_CLIENT_SECRET: "segredo ", GMAIL_REFRESH_TOKEN: "	1//tok", GMAIL_SERVICE_ACCOUNT_JSON: "  " };
    expect(credencialGmail(k => env[k])).toEqual({ tipo: "oauth", id: "id.apps.googleusercontent.com", segredo: "segredo", refresh: "1//tok" });
  });
  it("prefere o conector Gmail gerenciado quando vinculado, mesmo com refresh token cadastrado", () => {
    const env: Record<string, string> = { LOVABLE_API_KEY: "lk", GOOGLE_MAIL_API_KEY: " ck ", GMAIL_CLIENT_ID: "id", GMAIL_CLIENT_SECRET: "s", GMAIL_REFRESH_TOKEN: "r" };
    expect(credencialGmail(k => env[k])).toEqual({ tipo: "conector", lovable: "lk", conexao: "ck" });
    expect(credencialGmail(k => ({ ...env, GOOGLE_MAIL_API_KEY: "" })[k])?.tipo).toBe("oauth");
  });
  it("explica os erros comuns do Google", () => {
    expect(dicaOAuth("oauth", "unauthorized_client")).toContain("Use your own OAuth credentials");
    expect(dicaOAuth("service_account", "unauthorized_client")).toContain("delegação");
    expect(dicaOAuth("oauth", "invalid_grant")).toContain("Refresh token");
  });
});
