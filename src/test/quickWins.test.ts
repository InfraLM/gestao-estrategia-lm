import { describe, expect, it } from "vitest";
import { canAccessModule, canAccessQuickWins, moduleForPath, rotaPermitidaLiderRestrito } from "@/lib/moduleAccess";
import { camposFaltando, classificar, comentarioObrigatorio, contagem, csv, podeEditarItem, tituloAutomatico, type QwItem } from "@/lib/quickWins";

describe("Quick Wins: regras de tela", () => {
  it("área é obrigatória apenas para líderes com mais de um vínculo", () => {
    const item = { observacao: "O", acao_proposta: "A" };
    expect(camposFaltando(item, false)).toEqual([]);
    expect(camposFaltando(item, true)).toEqual(["area_rotulo"]);
    expect(camposFaltando({ ...item, area_rotulo: "Jurídico" }, true)).toEqual([]);
  });
  it("formulário simplificado exige só iniciativa e problema/oportunidade", () => {
    expect(camposFaltando({ acao_proposta: "A", observacao: "O" })).toEqual([]);
    expect(camposFaltando({ acao_proposta: " ", observacao: "O", investimento_estimado: "" })).toEqual(["acao_proposta"]);
    expect(camposFaltando({})).toEqual(["acao_proposta", "observacao"]);
  });
  it("título é preenchido com os primeiros 80 caracteres da iniciativa", () => {
    expect(tituloAutomatico("x".repeat(100))).toHaveLength(80);
    expect(tituloAutomatico("  Revisar escala  ")).toBe("Revisar escala");
  });
  it("CSV traz os três campos novos", () => {
    const item = { ordem: 1, acao_proposta: "Iniciativa X", observacao: "Problema Y", investimento_estimado: "R$ 2 mil", status_triagem: "pendente", status_execucao: "nao_iniciado" } as QwItem;
    const out = csv([{ item, lider: { id: "1", nome: "Ana", cargo: "gerente", cadeira: "C" }, enviado: true }]);
    expect(out).toContain("Iniciativa proposta;Problema ou oportunidade que sanaria;Investimento estimado (se aplicável)");
    expect(out).toContain("Iniciativa X;Problema Y;R$ 2 mil");
    expect(out).not.toContain("Objetivo BSC");
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
