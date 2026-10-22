import { describe, it, expect } from "vitest";
import { avaliarKpiBsc } from "@/lib/avaliacaoBsc";

// Formulário, Painel de Metas e Visão semanal chamam esta mesma função (via useAvaliacoesBsc).
const ck = (semana: string, status: string, v: string) => ({ semana, status, enviado_em: semana + "T20:00:00Z", conteudo: { kpis_resposta: [{ indicador_id: "k1", situacao_atual: v }] } });
const kpi = { indicador_id: "k1", sentido: "maior" as const, competencia: "2026-10", meta_mes: 10, meta_semestre: null, meta_texto: null, realizado: null };
const depois = new Date("2026-11-05T12:00:00");

describe("Avaliação BSC única", () => {
  it("sem lançamento, usa situação numérica de checkout enviado e informa a origem", () => {
    const r = avaliarKpiBsc(kpi, null, [ck("2026-10-12", "enviado", "8")], depois);
    expect(r).toEqual({ aval: "off", origem: "pela situação apontada no checkout de 12/10" });
  });
  it("checkout só em rascunho não conta", () => {
    expect(avaliarKpiBsc(kpi, null, [ck("2026-10-19", "rascunho", "12")], depois).aval).toBe("acomp");
  });
  it("realizado lançado prevalece e não mostra origem", () => {
    expect(avaliarKpiBsc({ ...kpi, realizado: 12 }, null, [ck("2026-10-12", "enviado", "8")], depois)).toEqual({ aval: "on", origem: null });
  });
  it("situação em texto livre não avalia; antes do fim do mês fica em acompanhamento", () => {
    expect(avaliarKpiBsc(kpi, null, [ck("2026-10-12", "enviado", "em análise")], depois).aval).toBe("acomp");
    expect(avaliarKpiBsc(kpi, null, [ck("2026-10-12", "enviado", "12")], new Date("2026-10-20T12:00:00")).aval).toBe("acomp");
  });
  it("árvore mais recente que o checkout vale", () => {
    expect(avaliarKpiBsc(kpi, { valor: "15", data: "2026-10-20" }, [ck("2026-10-12", "enviado", "8")], depois)).toEqual({ aval: "on", origem: "pela situação apontada na Árvore de KPIs" });
  });
});
