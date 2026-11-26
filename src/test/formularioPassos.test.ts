import { describe, it, expect } from "vitest";
import { passosDoCiclo, passoDaSecao, pendenciasPorPasso, mesclarJustificativas, pendenciasFarol, secaoDaPendencia, type JustificativaFarol } from "@/features/metas/lib/guiaSemanal";
import { kpisForaDaMeta } from "@/features/metas/lib/farolDaCadeira";
import { REGRAS_PADRAO } from "@/features/metas/lib/regrasFarol";

const item = (id: string, cor: "vermelho" | "amarelo") => ({ indicador_id: id, codigo: id.toUpperCase(), nome: `Indicador ${id}`, cor, competencia: "2026-10", valor: 80, meta: 100 });

describe("formulário semanal em passos (decisão da Naira, 26/11)", () => {
  it("o passo dos indicadores fora da meta só existe quando há algum", () => {
    expect(passosDoCiclo(true)).toEqual(["farol", "semana", "riscos", "reunioes", "plano", "revisao"]);
    expect(passosDoCiclo(false)).toEqual(["semana", "riscos", "reunioes", "plano", "revisao"]);
  });

  it("cada seção cai no seu passo, e as pendências são contadas por passo", () => {
    expect(passoDaSecao("bloco-extras")).toBe("semana");
    expect(passoDaSecao("bloco-impedimentos")).toBe("riscos");
    expect(passoDaSecao("bloco-status-report")).toBe("reunioes");
    expect(passoDaSecao("bloco-apoio")).toBe("plano");
    expect(passoDaSecao("bloco-kpis")).toBe("farol");
    expect(secaoDaPendencia("farol-abc")).toBe("bloco-farol");
    expect(pendenciasPorPasso([{ campo: "farol-a", texto: "" }, { campo: "kpi-b-desvio", texto: "" }, { campo: "ent-0", texto: "" }, { campo: "pri-1-titulo", texto: "" }]))
      .toEqual({ farol: 2, semana: 1, plano: 1 });
  });

  it("vermelho exige causa, impacto e ação; amarelo é opcional", () => {
    const lista = mesclarJustificativas([item("a", "vermelho"), item("b", "amarelo")], []);
    expect(pendenciasFarol(lista).map((p) => p.campo)).toEqual(["farol-a"]);
    const ok = lista.map((j) => j.cor === "vermelho" ? { ...j, causa: "c", impacto: "i", acao: "a" } : j);
    expect(pendenciasFarol(ok)).toEqual([]);
  });

  it("ao recalcular, mantém o que já foi escrito e tira quem saiu da lista", () => {
    const salvas: JustificativaFarol[] = [{ ...item("a", "amarelo"), causa: "texto", impacto: "", acao: "" }, { ...item("z", "vermelho"), causa: "x", impacto: "y", acao: "w" }];
    const nova = mesclarJustificativas([item("a", "vermelho")], salvas);
    expect(nova).toHaveLength(1);
    expect(nova[0]).toMatchObject({ indicador_id: "a", cor: "vermelho", causa: "texto" });
  });
});

describe("KPIs fora da meta da cadeira (mesma regra da Matriz)", () => {
  const ind = (id: string, o: Record<string, unknown> = {}) => ({ id, codigo: id.toUpperCase(), nome: `KPI ${id}`, cadeira_id: "c1", status: "ativo", parent_id: null,
    origem: "bsc", nivel: "Estratégico", sentido: "maior", meta_semestre: 100, meta_texto: null, tipo_apontamento: "valor_mensal", unidade: "%", ...o });
  const lanc = (id: string, valor: number) => ({ indicador_id: id, competencia: "2026-10", valor, revisao: 1, sem_medicao: false, updated_at: "2026-11-05T12:00:00Z" });
  const base = {
    cadeiraId: "c1", meses: ["2026-09", "2026-10", "2026-11", "2026-12"], arvore: { m: {}, d: null }, checkouts: [], regras: REGRAS_PADRAO, hoje: new Date(2026, 10, 20),
    metas: ["v", "a", "g", "x"].map((id) => ({ indicador_id: id, competencia: "2026-10", meta_mes: 100 })),
  };

  it("lista vermelhos primeiro, depois amarelos; ignora verde, mês aberto e outra cadeira", () => {
    const r = kpisForaDaMeta({ ...base, indicadores: [ind("a"), ind("v"), ind("g"), ind("x", { cadeira_id: "c2" })], lancs: [lanc("a", 96), lanc("v", 80), lanc("g", 100), lanc("x", 10)] });
    expect(r.map((k) => [k.codigo, k.cor, k.competencia])).toEqual([["V", "vermelho", "2026-10"], ["A", "amarelo", "2026-10"]]);
    expect(r[0]).toMatchObject({ valor: 80, meta: 100 });
  });

  it("a faixa configurada nas regras do farol muda a cor", () => {
    const regras = { ...REGRAS_PADRAO, geralPct: 0.25, ativas: true };
    const r = kpisForaDaMeta({ ...base, regras, indicadores: [ind("v")], lancs: [lanc("v", 80)] });
    expect(r.map((k) => k.cor)).toEqual(["amarelo"]);
  });
});
