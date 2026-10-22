import { describe, it, expect } from "vitest";
import { cronSemanal, mensagemAviso, podeReceberAviso, semanaLink, type DestinatarioAviso } from "@/lib/avisosCiclo";
import { retornoStatus } from "@/lib/atualizacaoStatus";
import { prazoCiclo } from "@/lib/rotinaSemanal";
import { COMPLETUDE_MINIMA } from "@/lib/conformidade";
const d: DestinatarioAviso = { cadeira_id: "c1", cadeira: "CPPO", usuario_id: "u1", nome: "Naira", email: "naira@example.test", motivo: null, enviado: false, pendencias: { prioridades: 1, kpis: 3, atas: 2, status_reports: 0 } };
describe("Avisos semanais", () => {
  it("abre sexta 8h São Paulo = sexta 11h UTC", () => expect(cronSemanal(5, "08:00")).toBe("0 11 * * 5"));
  it("lembra segunda 14h São Paulo = segunda 17h UTC", () => expect(cronSemanal(1, "14:00")).toBe("0 17 * * 1"));
  it("respeita a troca de dia UTC nos horários editados", () => expect(cronSemanal(6, "23:15")).toBe("15 2 * * 0"));
  it("não lembra quem enviou o ciclo inteiro", () => expect(podeReceberAviso({ ...d, enviado: true }, "lembrete")).toBe(false));
  it("não envia para diretor sem vínculo ou e-mail válido", () => expect(podeReceberAviso({ ...d, motivo: "Sem e-mail válido" }, "abertura")).toBe(false));
  it("preserva a segunda do ciclo no link e no retorno do login", () => { expect(semanaLink("2026-10-26")).toBe("2026-10-26"); expect(retornoStatus("/metas/semanal?semana=2026-10-26")).toBe("/metas/semanal?semana=2026-10-26"); });
  it("rejeita data inexistente ou semana não iniciada na segunda", () => { expect(semanaLink("2026-02-30")).toBeNull(); expect(semanaLink("2026-10-23")).toBeNull(); });
  it("não permite retorno externo pelo link do e-mail", () => expect(retornoStatus("//evil.test/metas/semanal")).toBe("/"));
  it("projeta somente nome e contagens da própria cadeira", () => { const a = mensagemAviso({ ...d, financeiro: 98765, socios: "RESERVADO", outra_cadeira: "OUTRA" } as DestinatarioAviso, "2026-10-26"); expect(JSON.stringify(a)).not.toMatch(/98765|RESERVADO|OUTRA/); expect(a.text).toContain("3 KPI(s)"); });
  it("mantém segunda 23h59 e conformidade 90%", () => { expect(prazoCiclo("2026-10-26").toISOString()).toBe("2026-10-27T02:59:59.000Z"); expect(COMPLETUDE_MINIMA).toBe(0.9); });
});