import { describe, expect, it } from "vitest";
import { invitationSchema } from "@/lib/userInvitation";

const invite = { email: " Pessoa@Gmail.com ", display_name: "Pessoa", cargo: "Diretor", departamento_id: null, acessos: { pmo: "leitura" } };
describe("Cadastro por convite", () => {
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