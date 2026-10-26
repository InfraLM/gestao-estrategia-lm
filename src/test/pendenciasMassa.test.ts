import { describe, it, expect } from "vitest";
import { filtrarItens, planoEmMassa, ItemPendencia, Sugestao } from "@/lib/pendenciasMassa";

const it1: ItemPendencia = { tipo: "ata", ref: "a1", titulo: "A", comite: "CEA", reuniao: "R1", data: null, detalhe: "", cadeiras: [] };
const it2: ItemPendencia = { ...it1, ref: "a2", comite: "CES" };
const pri: ItemPendencia = { ...it1, tipo: "prioridade", ref: "2026-06-01|x" };
const s: Sugestao[] = [
  { tipo: "ata", item_ref: "a1", contexto: "aguardando", sugestao: "atribuir", cadeira_id: "cfo", confianca: "alta", justificativa: "financeiro", motivo_sugerido: "" },
  { tipo: "ata", item_ref: "a2", contexto: "aguardando", sugestao: "baixar", cadeira_id: null, confianca: "baixa", justificativa: "vaga", motivo_sugerido: "Sem dono" },
];
const todos = { confianca: "todas", comite: "todos", reuniao: "todas", sugestao: "todas" };

describe("ações em massa sobre pendências", () => {
  it("filtra por confiança, comitê e sugestão", () => {
    expect(filtrarItens([it1, it2], s, { ...todos, confianca: "alta" }).map((i) => i.ref)).toEqual(["a1"]);
    expect(filtrarItens([it1, it2], s, { ...todos, comite: "CES" }).map((i) => i.ref)).toEqual(["a2"]);
    expect(filtrarItens([it1, it2, pri], s, { ...todos, confianca: "sem" }).map((i) => i.ref)).toEqual([pri.ref]);
  });
  it("aplicar sugestão atribui à cadeira sugerida e baixa com o motivo sugerido", () => {
    const p = planoEmMassa([it1, it2, pri], s, "sugerida", {});
    expect(p.ops).toEqual([{ tipo: "ata", ref: "a1", acao: "atribuir", cadeira: "cfo" }, { tipo: "ata", ref: "a2", acao: "baixar", motivo: "Sem dono" }]);
    expect(p.ignorados).toBe(1);
  });
  it("atribuir a… nunca atribui prioridades; baixar usa um motivo para todas", () => {
    expect(planoEmMassa([it1, pri], s, "atribuir", { cadeira: "coo" }).ops).toEqual([{ tipo: "ata", ref: "a1", acao: "atribuir", cadeira: "coo" }]);
    expect(planoEmMassa([it1, pri], s, "baixar", { motivo: " Obsoleta " }).ops.map((o) => o.motivo)).toEqual(["Obsoleta", "Obsoleta"]);
    expect(planoEmMassa([it1], s, "baixar", { motivo: "" }).ops).toEqual([]);
  });
});
