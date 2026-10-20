import { describe, it, expect } from "vitest";
import { agruparOrigemMeta, formatarMeta, sistemaMetasAoVivo } from "@/pages/incentivosDados";
import { avaliacaoPayload, contarAderencias, filtrarCombinados, podeEditarCesta, type CombinadoCesta } from "@/pages/cestaInsightsDados";
describe("Incentivos · metas", () => {
  it.each([["bsc", "bsc"], ["arvore_kpis", "bsc"], ["okr", "okr"], ["cesta", "cesta"], ["cesta_metas", "cesta"], ["desconhecida", null], [null, null]])("agrupa origem %s", (origem, grupo) => { expect(agruparOrigemMeta(origem)).toBe(grupo); });
  it("prioriza meta textual", () => { expect(formatarMeta({ meta_texto: "Até 20 dias", meta_semestre: 30, unidade: "dias" })).toBe("Até 20 dias"); });
  it("formata meta numérica com unidade e preserva zero", () => { expect(formatarMeta({ meta_texto: null, meta_semestre: 1234.5, unidade: "%" })).toBe("1.234,5 %"); expect(formatarMeta({ meta_texto: "", meta_semestre: 0 })).toBe("0"); });
  it("mostra a definir quando não há meta", () => { expect(formatarMeta({ meta_texto: "  ", meta_semestre: null })).toBe("a definir"); });
  it("consulta ao vivo só os sistemas Metas 2S26", () => { expect(sistemaMetasAoVivo("Metas 2S26 (sistema de metas)")).toBe(true); expect(sistemaMetasAoVivo("OTE diretores de receita (D-060)")).toBe(false); });
});
describe("Insights da Cesta · avaliação", () => {
  it("conta as quatro aderências sem perder não avaliados", () => { expect(contarAderencias(["atende", "parcial", "nao_atende", "nao_avaliado", null].map(aderencia => ({ aderencia })))).toEqual({ atende: 1, parcial: 1, nao_atende: 1, nao_avaliado: 2 }); });
  it("diretor sem grant de edição não edita", () => { expect(podeEditarCesta(true, [], ["viewer"])).toBe(false); });
  it("consulta não permite editar", () => { expect(podeEditarCesta(true, [{ modulo: "incentivos", nivel: "leitura" }], [])).toBe(false); });
  it("grant edição de incentivos permite avaliar", () => { expect(podeEditarCesta(true, [{ modulo: "incentivos", nivel: "edicao" }], [])).toBe(true); });
  it("grant de outro módulo não permite avaliar", () => { expect(podeEditarCesta(true, [{ modulo: "metas", nivel: "edicao" }], [])).toBe(false); });
  it.each(["admin", "super_admin"])("%s pode avaliar", role => { expect(podeEditarCesta(true, [], [role])).toBe(true); });
  it("visitantes não editam mesmo com roles", () => { expect(podeEditarCesta(false, [], ["super_admin"])).toBe(false); });
  it("payload grava exclusivamente quatro campos e a data de hoje", () => { expect(avaliacaoPayload("parcial", "  Revisar prazo  ", "usuario", new Date(2026, 9, 20))).toEqual({ aderencia: "parcial", observacao: "Revisar prazo", avaliado_em: "2026-10-20", avaliado_por: "usuario" }); });
  it("combina filtros e busca sem acento", () => {
    const item: CombinadoCesta = { id: "1", mt_cadeira_id: "CEO", combinado: "Gestão Ágil", aderencia: "nao_avaliado", decisao_codigo: "D-060", indicador_ref: null, observacao: null, avaliado_em: null, avaliado_por: null, created_at: "", updated_at: "" };
    expect(filtrarCombinados([item], "CEO", "nao_avaliado", "D-060", "GESTAO agil")).toHaveLength(1);
    expect(filtrarCombinados([item], "CEO", "atende", "D-060", "")).toEqual([]);
  });
});