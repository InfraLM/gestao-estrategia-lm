import { describe, expect, it } from "vitest";
import { canAccessModule, canAccessQuickWins, moduleForPath, rotaPermitidaLiderRestrito } from "@/lib/moduleAccess";
import { camposFaltando, classificar, faixaIce, iceScore, linhaVazia, comentarioObrigatorio, contagem, csv, podeEditarItem, tituloAutomatico, type QwItem } from "@/lib/quickWins";

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
    expect(out).toContain("Iniciativa;Justificativa;Tem custo;Valor estimado;Impacto;Confiança;Facilidade;ICE");
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
  it("após envio só edita itens em ajustar/devolvido; ciclo fechado é leitura", () => {
    expect(podeEditarItem("enviado", { status_triagem: "pendente", status_execucao: "nao_iniciado" }, true)).toBe(false);
    expect(podeEditarItem("enviado", { status_triagem: "ajustar", status_execucao: "nao_iniciado" }, true)).toBe(true);
    expect(podeEditarItem("rascunho", { status_triagem: "pendente", status_execucao: "nao_iniciado" }, false)).toBe(false);
  });
  it("comentário obrigatório exceto aprovar", () => {
    expect(comentarioObrigatorio("aprovar")).toBe(false);
    expect(comentarioObrigatorio("devolver")).toBe(true);
  });
  it("líder restrito só navega em /quick-wins", () => {
    expect(rotaPermitidaLiderRestrito("/quick-wins")).toBe(true);
    expect(rotaPermitidaLiderRestrito("/estrategia")).toBe(false);
    expect(moduleForPath("/quick-wins")).toBe("quick_wins");
  });
  it("módulo fechado para quem não é líder, diretor ou Gov/CEO; demais módulos inalterados", () => {
    expect(canAccessQuickWins({ lider_id: null, diretor: false, gov_ceo: false }, [])).toBe(false);
    expect(canAccessQuickWins({ lider_id: "x", diretor: false, gov_ceo: false }, [])).toBe(true);
    expect(canAccessQuickWins({ lider_id: null, diretor: true, gov_ceo: false }, [{ modulo: "quick_wins", nivel: "nenhum" }])).toBe(false);
    expect(canAccessModule([], "estrategia")).toBe(true);
  });
});
