import { describe, expect, it } from "vitest";
import { buscarDecisao, calcularReferencias, filtrarDecisoes, parseStatus, type Decisao, type FiltrosDecisoes } from "@/pages/contextoDecisoes";

const decisao = (codigo: string, campos: Partial<Decisao> = {}): Decisao => ({
  id: codigo, codigo, titulo: "Decisão estratégica", data_decisao: null, acesso_reservado: false,
  atualizado_por: null, comite_codigo: null, created_at: "", updated_at: "", decisao: null,
  decisor: null, fonte: null, foruns_citados: null, impacto_bsc: null, observacoes: null,
  opcoes_descartadas: null, papeis_rapid: null, pergunta: null, premissas: null,
  proxima_revisao: null, racional: null, responsavel: null, reuniao_origem: null,
  revisa_codigo: null, revisao: null, tipo_forum: null, tradeoff: null, ...campos,
});
const filtros: FiltrosDecisoes = { busca: "", tipo: "todos", forum: "todos", impacto: "todos", de: "", ate: "", confirmar: false };
describe("Contexto e decisões · somente leitura", () => {
  it("separa registros D-NNN do Ian e GOV dos comitês sem alterar demais filtros", () => {
    const ian = decisao("D-001"), gov = decisao("GOV-CES-20260618-03");
    expect(filtrarDecisoes([ian, gov], { ...filtros, origem: "ian" })).toEqual([ian]);
    expect(filtrarDecisoes([ian, gov], { ...filtros, origem: "comites" })).toEqual([gov]);
    expect(filtrarDecisoes([ian, gov], { ...filtros, origem: "todos" })).toEqual([ian, gov]);
    expect(filtrarDecisoes([ian, gov], { ...filtros, origem: "comites", busca: "D-001" })).toEqual([]);
  });
  it("busca sem acento e sem distinguir maiúsculas nos nove campos pedidos", () => {
    for (const campo of ["codigo", "titulo", "decisao", "racional", "tradeoff", "premissas", "papeis_rapid", "responsavel", "reuniao_origem"] as const) {
      expect(buscarDecisao(decisao("D-001", { [campo]: "Reunião Ágil" }), " REUNIAO agil ")).toBe(true);
    }
    expect(buscarDecisao(decisao("D-001"), "inexistente")).toBe(false);
    expect(buscarDecisao(decisao("D-001"), "")).toBe(true);
  });
  it("interpreta os quatro marcadores mantendo o texto e ignorando colchetes comuns", () => {
    expect(parseStatus("Antes [premissa: rever] [VALIDADO ontem] [rejeitado] [inconsistência D-010] depois [outro]"))
      .toEqual([{ texto: "Antes " }, { texto: "premissa: rever", status: "premissa" }, { texto: " " }, { texto: "VALIDADO ontem", status: "validado" }, { texto: " " }, { texto: "rejeitado", status: "rejeitado" }, { texto: " " }, { texto: "inconsistência D-010", status: "inconsistencia" }, { texto: " depois [outro]" }]);
    expect(parseStatus("[inconsistencia: conferir]")[0]?.status).toBe("inconsistencia");
    expect(parseStatus("[premissa sem fechar")).toEqual([{ texto: "[premissa sem fechar" }]);
  });
  it("calcula Cita e Citada por sem duplicar, autocitação ou decisão não carregada", () => {
    const refs = calcularReferencias([
      decisao("D-001", { decisao: "D-002, D-002, D-001 e D-006", racional: "D-003" }),
      decisao("D-002", { revisa_codigo: "D-001", observacoes: "D-003" }),
      decisao("D-003", { fonte: "D-003 e D-0020" }),
    ]);
    expect(refs.get("D-001")).toEqual({ cita: ["D-003", "D-002"], citadaPor: ["D-002"] });
    expect(refs.get("D-002")).toEqual({ cita: ["D-003", "D-001"], citadaPor: ["D-001"] });
    expect(refs.get("D-003")).toEqual({ cita: [], citadaPor: ["D-002", "D-001"] });
    expect(refs.has("D-006")).toBe(false);
  });
  it("combina fórum, fóruns citados e impacto por contém", () => {
    const d = decisao("D-001", { tipo_forum: "ritual_executivo", foruns_citados: ["ExCom", "Board"], impacto_bsc: "Financeira / Processos" });
    expect(filtrarDecisoes([d], { ...filtros, tipo: "ritual_executivo", forum: "Board", impacto: "Financeira" })).toEqual([d]);
    expect(filtrarDecisoes([d], { ...filtros, forum: "CEA" })).toEqual([]);
    expect(filtrarDecisoes([d], { ...filtros, tipo: "fora_de_ritual" })).toEqual([]);
    expect(filtrarDecisoes([d], { ...filtros, impacto: "Clientes e mercado" })).toEqual([]);
  });
  it("filtra datas de/até inclusivas sem incluir datas ausentes", () => {
    const d = decisao("D-001", { data_decisao: "2026-10-20" });
    expect(filtrarDecisoes([d, decisao("D-002")], { ...filtros, de: "2026-10-20", ate: "2026-10-20" })).toEqual([d]);
    expect(filtrarDecisoes([d], { ...filtros, de: "2026-10-21" })).toEqual([]);
    expect(filtrarDecisoes([d], { ...filtros, ate: "2026-10-19" })).toEqual([]);
  });
  it("Responsável a confirmar depende de observacoes conter confirmar", () => {
    const d = decisao("D-001", { observacoes: "Responsável a CONFIRMAR" });
    expect(filtrarDecisoes([d, decisao("D-002", { responsavel: "A confirmar" })], { ...filtros, confirmar: true })).toEqual([d]);
  });
});