import { describe, it, expect } from "vitest";
import { linkSocio, linhasCsvLinks, type LinkPainel } from "@/lib/linksSocios";

const base: LinkPainel = { participante_id: "1", nome: "Iuri", email: "iuri@x", token: "a".repeat(64), link_ativo: true, criado_em: null,
  expira_em: "2026-11-07T02:59:59Z", primeiro_acesso_em: null, ultimo_acesso_em: null, acessos: 0, situacao: "nao_abriu", enviado_em: null };

describe("links dos sócios", () => {
  it("usa sempre o endereço publicado, nunca o da prévia", () => {
    expect(linkSocio("a".repeat(64))).toBe(`https://gestao-estrategia-lm.lovable.app/responder/${"a".repeat(64)}`);
  });
  it("recusa token malformado", () => {
    expect(() => linkSocio("../auth")).toThrow();
  });
  it("planilha inclui só sócios com link vigente", () => {
    const linhas = linhasCsvLinks([base, { ...base, participante_id: "2", nome: "Cleto", token: null }, { ...base, participante_id: "3", nome: "Yuri", link_ativo: false }]);
    expect(linhas).toHaveLength(2);
    expect(linhas[1][0]).toBe("Iuri");
  });
});
