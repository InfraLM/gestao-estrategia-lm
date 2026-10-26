import { describe, expect, it } from "vitest";
import { consensoEixo, identidadesSocios, respostasDoEixo } from "@/lib/sociosEixos";

describe("Eixos dos Sócios · comparação", () => {
  const pessoas = ["Yuri Ribeiro", "Naira", "Iuri", "Ian", "Cleto"].map(nome => ({ nome, id: nome }));
  it("ordem alfabética e siglas exclusivas para os cinco participantes", () => {
    expect(identidadesSocios(pessoas).map(p => [p.nome, p.sigla])).toEqual([["Cleto", "CL"], ["Ian", "IA"], ["Iuri", "IU"], ["Naira", "NA"], ["Yuri Ribeiro", "YR"]]);
  });
  it("novos participantes recebem duas letras sem reutilizar as siglas existentes", () => {
    const resultado = identidadesSocios([...pessoas, { id: "6", nome: "Ian Souza" }, { id: "7", nome: "Igor Andrade" }]);
    expect(new Set(resultado.map(p => p.sigla)).size).toBe(7);
    expect(resultado.every(p => /^[A-Z]{2}$/.test(p.sigla))).toBe(true);
    expect(identidadesSocios([...pessoas].reverse())).toEqual(identidadesSocios(pessoas));
  });
  it("cores não dependem da ordem nem de ausência de respostas", () => {
    expect(identidadesSocios(pessoas).map(p => p.cor)).toEqual([0, 1, 2, 3, 4]);
    expect(identidadesSocios(pessoas.slice(0, 1))[0]?.cor).toBe(4);
  });
  it.each([[14, "baixa"], [15, "média"], [30, "média"], [31, "alta"], [34, "alta"]])("amplitude %s classifica divergência %s", (amplitude, divergencia) => {
    expect(consensoEixo([10, 10 + Number(amplitude), null])).toMatchObject({ amplitude, divergencia });
  });
  it("valores iguais preservam todos os respondentes e amplitude zero", () => {
    expect(consensoEixo([62, 62, 62])).toEqual({ min: 62, max: 62, amplitude: 0, divergencia: "baixa", participantes: 3 });
    expect(consensoEixo([null, null])).toBeNull();
    expect(consensoEixo([0, 100])?.amplitude).toBe(100);
  });
  it("decomposição usa apenas respostas do eixo e ranking confirmado", () => {
    const r = { motor: "B", portfolio: "C", portfolio_v: 2, trafego: "B", invest: ["sp", "reserva", "tech", "novos", "pessoas", "distrib"], invest_ok: true };
    expect(respostasDoEixo(r, "core")).toEqual(["Motor B", "Portfólio C", "Mídia B", "Ranking “novos” 4º"]);
    expect(respostasDoEixo({ ...r, invest_ok: false }, "core")).toHaveLength(3);
    expect(respostasDoEixo({}, "caixa")).toEqual([]);
    expect(respostasDoEixo({ portfolio: "C" }, "core")).toEqual(["Portfólio D"]);
  });
});