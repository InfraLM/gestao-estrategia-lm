import { describe, expect, it } from "vitest";
import { marcarCriticos, atingimento, celulaMes, type Celula } from "@/lib/matrizApontamentos";
import { avaliarKpiBsc } from "@/lib/avaliacaoBsc";
import { srPendentesPorCadeira } from "@/lib/projetosGestao";
import { validarFontes, temSemFonte } from "@/lib/planejamentoFontes";
import { cadeirasVisiveisBsc } from "@/hooks/useAvaliacoesBsc";
import { moduleForPath } from "@/lib/moduleAccess";

const c = (aval: Celula["aval"], ating: number | null): Celula => ({ valor: 1, meta: 1, aval, origem: null, ating });

describe("Matriz de apontamentos", () => {
  it("desvio crítico exige 2 períodos off seguidos E atingimento abaixo de 70%", () => {
    const r = marcarCriticos([c("off", 0.5), c("off", 0.6), c("off", 0.8), c("on", 1), c("off", 0.4)]);
    expect(r.map((x) => !!x.critico)).toEqual([false, true, false, false, false]);
  });
  it("um único off abaixo de 70% não é crítico", () => {
    expect(marcarCriticos([c("on", 1), c("off", 0.1)])[1].critico).toBe(false);
  });
  it("atingimento respeita o sentido", () => {
    expect(atingimento(60, 100, "maior")).toBe(0.6);
    expect(atingimento(2, 1, "menor")).toBe(0.5);
  });
  it("célula usa a mesma avaliação que avaliarKpiBsc", () => {
    const ind = { id: "k1", sentido: "maior" as const, meta_semestre: null, meta_texto: null };
    const cks = [{ semana: "2026-09-14", status: "enviado", enviado_em: "2026-09-20", conteudo: { kpis_resposta: [{ indicador_id: "k1", situacao_atual: "50" }] } }];
    const hoje = new Date("2026-10-15");
    const cel = celulaMes(ind, "2026-09", 100, null, null, cks, hoje);
    const ref = avaliarKpiBsc({ indicador_id: "k1", sentido: "maior", competencia: "2026-09", meta_mes: 100, meta_semestre: null, meta_texto: null, realizado: null }, null, cks, hoje);
    expect(cel.aval).toBe(ref.aval);
    expect(cel.aval).toBe("off");
    expect(cel.ating).toBe(0.5);
  });
});

describe("Transparência e acesso", () => {
  it("todo diretor com cadeira vê a avaliação de todas as cadeiras; sem cadeira, nada", () => {
    expect(cadeirasVisiveisBsc({ isGovernanca: false, minhaCadeira: "x", cadeiras: [] })).toBeNull();
    expect(cadeirasVisiveisBsc({ isGovernanca: true, minhaCadeira: null, cadeiras: [] })).toBeNull();
    expect(cadeirasVisiveisBsc({ isGovernanca: false, minhaCadeira: null, cadeiras: [] })).toEqual([]);
  });
  it("Lançamentos segue o acesso de Metas", () => { expect(moduleForPath("/lancamentos")).toBe("metas"); });
});

describe("Status reports pendentes por cadeira", () => {
  it("conta só projetos em aberto sem anexo ou sem os três faróis", () => {
    const p = [{ codigo: "P1", status: "Em Andamento", cadeira_id: "a" }, { codigo: "P2", status: "Concluído", cadeira_id: "a" }, { codigo: "P3", status: "Atrasado", cadeira_id: "a" }];
    const r = srPendentesPorCadeira(p, [{ projeto_codigo: "P1", arquivo_path: "x", farol_escopo: "verde", farol_custo: "verde", farol_cronograma: "verde" }]);
    expect(r.a).toEqual({ total: 2, pendentes: ["P3"] });
  });
});

describe("Fontes da IA", () => {
  it("código inexistente vira [sem fonte] e bloqueia aprovação", () => {
    const v = validarFontes("A [FONTE: D-012]. B [FONTE: D-999].", new Set(["D-012"]));
    expect(v.texto).toBe("A [FONTE: D-012]. B [sem fonte].");
    expect(v.invalidas).toEqual(["D-999"]);
    expect(temSemFonte(v.texto)).toBe(true);
  });
});
