import { describe, expect, it } from "vitest";
import { destinatariosConviteIndividual } from "../../supabase/functions/rotina-avisos-enviar/conviteIndividual";

const lista = [
  { nome: "Pessoa fictícia A", email: "teste.a@liberdademedicaedu.com.br" },
  { nome: "Pessoa fictícia B", email: "teste.b@liberdademedicaedu.com.br" },
];

describe("Quick Wins: convite individual", () => {
  it("seleciona somente a pessoa solicitada, sem alterar a lista", () => {
    expect(destinatariosConviteIndividual(lista, lista[1].email)).toEqual([lista[1]]);
    expect(lista).toHaveLength(2);
  });
  it("normaliza espaços e maiúsculas", () => {
    expect(destinatariosConviteIndividual(lista, " TESTE.A@LIBERDADEMEDICAEDU.COM.BR ")).toEqual([lista[0]]);
  });
  it("não permite destinatário fora da lista ativa", () => {
    expect(() => destinatariosConviteIndividual(lista, "fora@liberdademedicaedu.com.br")).toThrow(/lista ativa/);
    expect(() => destinatariosConviteIndividual([], lista[0].email)).toThrow(/lista ativa/);
  });
  it("recusa e-mail externo e valores inválidos", () => {
    for (const email of [null, undefined, [], 1, "teste@gmail.com", "a b@liberdademedicaedu.com.br"]) {
      expect(() => destinatariosConviteIndividual(lista, email)).toThrow();
    }
  });
});