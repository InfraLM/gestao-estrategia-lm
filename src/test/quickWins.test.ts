import { describe, expect, it } from "vitest";
import { canAccessModule, canAccessQuickWins, moduleForPath, rotaPermitidaLiderRestrito } from "@/lib/moduleAccess";
import { camposFaltando, classificar, faixaIce, iceScore, linhaVazia, contagem, csv, indicadores, ordenarPorIce, tituloAutomatico, type QwItem } from "@/lib/quickWins";

describe("Quick Wins: regras de tela", () => {
  it("área é obrigatória apenas para líderes com mais de um vínculo", () => {
    const item = { observacao: "O", acao_proposta: "A", tem_custo: false, ice_impacto: 3, ice_confianca: 3, ice_facilidade: 3 };
    expect(camposFaltando(item, false)).toEqual([]);
    expect(camposFaltando(item, true)).toEqual(["area_rotulo"]);
    expect(camposFaltando({ ...item, area_rotulo: "Jurídico" }, true)).toEqual([]);
  });
  it("linha parcial exige iniciativa, justificativa, custo e os 3 critérios ICE", () => {
    expect(camposFaltando({ acao_proposta: "A" })).toEqual(["observacao", "tem_custo", "ice_impacto", "ice_confianca", "ice_facilidade"]);
  });
  it("custo = Sim exige valor estimado", () => {
    const base = { observacao: "O", acao_proposta: "A", ice_impacto: 3, ice_confianca: 3, ice_facilidade: 3 };
    expect(camposFaltando({ ...base, tem_custo: true })).toEqual(["investimento_estimado"]);
    expect(camposFaltando({ ...base, tem_custo: true, investimento_estimado: "R$ 2 mil" })).toEqual([]);
    expect(camposFaltando({ ...base, tem_custo: false })).toEqual([]);
  });
  it("linhas vazias são ignoradas", () => {
    expect(linhaVazia({ acao_proposta: " ", observacao: "", tem_custo: null })).toBe(true);
    expect(linhaVazia({ ice_impacto: 2 })).toBe(false);
  });
  it("ICE é a média dos três com 1 casa e cores por faixa", () => {
    expect(iceScore({ ice_impacto: 5, ice_confianca: 4, ice_facilidade: 4 })).toBe(4.3);
    expect(iceScore({ ice_impacto: 5, ice_confianca: 4 })).toBeNull();
    expect(faixaIce(4)).toBe("alto");
    expect(faixaIce(3.9)).toBe("medio");
    expect(faixaIce(3)).toBe("medio");
    expect(faixaIce(2.9)).toBe("baixo");
  });
  it("título é preenchido com os primeiros 80 caracteres da iniciativa", () => {
    expect(tituloAutomatico("x".repeat(100))).toHaveLength(80);
    expect(tituloAutomatico("  Revisar escala  ")).toBe("Revisar escala");
  });
  it("CSV traz custo, valor e ICE", () => {
    const item = { ordem: 1, acao_proposta: "Iniciativa X", observacao: "Problema Y", tem_custo: true, investimento_estimado: "R$ 2 mil", ice_impacto: 5, ice_confianca: 4, ice_facilidade: 4, status_triagem: "pendente", status_execucao: "nao_iniciado" } as QwItem;
    const out = csv([{ item, lider: { id: "1", nome: "Ana", cargo: "gerente", cadeira: "C" }, enviado: true }]);
    expect(out).toContain("Líder;Cargo;Cadeira;#;Iniciativa;Justificativa;Tem custo;Valor estimado;Impacto;Confiança;Facilidade;ICE");
    expect(out).not.toContain("Triagem");
    expect(out).toContain("Iniciativa X;Problema Y;Sim;R$ 2 mil;5;4;4;4,3");
  });
  it("classificação ao vivo segue os 3 critérios", () => {
    expect(classificar("5k_20k", "diretor", "61_90", 20000)).toBe("quick_win");
    expect(classificar("acima_20k", "proprio_lider", "ate_30", 20000)).toBe("iniciativa_maior");
    expect(classificar("sem_custo", "comite_ceo", "ate_30", 20000)).toBe("iniciativa_maior");
    expect(classificar("sem_custo", "proprio_lider", "acima_90", 20000)).toBe("iniciativa_maior");
    expect(classificar("5k_20k", "proprio_lider", "ate_30", 5000)).toBe("iniciativa_maior");
  });
  it("contagem ignora cancelados", () => {
    const i = (s: string) => ({ status_execucao: s }) as QwItem;
    expect(contagem([i("nao_iniciado"), i("cancelado")])).toBe("1 de 10");
  });
  it("indicadores do painel: % respondentes, % com custo e ICE médio", () => {
    const it = (c: boolean, n: number) => ({ tem_custo: c, ice_impacto: n, ice_confianca: n, ice_facilidade: n, status_execucao: "nao_iniciado" }) as QwItem;
    expect(indicadores(4, 1, [it(true, 5), it(false, 3)])).toEqual({ pctResponderam: 25, total: 2, pctComCusto: 50, iceMedio: 4 });
  });
  it("ordenação por ICE coloca maior primeiro e sem ICE no fim", () => {
    const l = (n: number | null) => ({ item: { ice_impacto: n, ice_confianca: n, ice_facilidade: n } as QwItem });
    expect(ordenarPorIce([l(null), l(2), l(5)]).map((x) => x.item.ice_impacto)).toEqual([5, 2, null]);
  });
  it("líder restrito só navega em /quick-wins", () => {
    expect(rotaPermitidaLiderRestrito("/quick-wins")).toBe(true);
    expect(rotaPermitidaLiderRestrito("/estrategia")).toBe(false);
    expect(moduleForPath("/quick-wins")).toBe("quick_wins");
  });
  it("módulo só para líder cadastrado ou Governança/admin; diretor sem cadastro não acessa", () => {
    expect(canAccessQuickWins({ lider_id: null, governanca: false }, [])).toBe(false);
    expect(canAccessQuickWins({ lider_id: "x", governanca: false }, [])).toBe(true);
    expect(canAccessQuickWins({ lider_id: null, governanca: true }, [])).toBe(true);
    expect(canAccessQuickWins({ lider_id: "x", governanca: false }, [{ modulo: "quick_wins", nivel: "nenhum" }])).toBe(false);
    expect(canAccessModule([], "estrategia")).toBe(true);
  });
});
