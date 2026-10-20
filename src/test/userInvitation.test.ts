import { describe, expect, it } from "vitest";
import { invitationId, invitationLink, invitationSchema } from "@/lib/userInvitation";

const invite = { email: " Pessoa@Gmail.com ", display_name: "Pessoa", cargo: "Diretor", departamento_id: null, acessos: { pmo: "leitura" } };
describe("Cadastro por convite", () => {
  it("gera um link público de entrada vinculado ao convite", () => {
    const id = "c7a9dfd2-1285-42be-af82-caf5229a55e5";
    expect(invitationLink(id, "https://nextlevel-lm.lovable.app")).toBe(`https://nextlevel-lm.lovable.app/auth?convite=${id}`);
    expect(invitationId(id)).toBe(id);
  });
  it("rejeita identificadores de convite inválidos", () => {
    expect(invitationId("admin")).toBeNull();
    expect(invitationId(null)).toBeNull();
    expect(() => invitationLink("admin", "https://nextlevel-lm.lovable.app")).toThrow();
  });
  it("normaliza o e-mail para vincular a mesma conta Google", () => {
    expect(invitationSchema.parse(invite).email).toBe("pessoa@gmail.com");
  });
  it("exige nome no cadastro completo", () => {
    expect(invitationSchema.safeParse({ ...invite, display_name: " " }).success).toBe(false);
  });
  it("não aceita papéis administrativos como nível de acesso", () => {
    expect(invitationSchema.safeParse({ ...invite, acessos: { pmo: "super_admin" } }).success).toBe(false);
  });
});