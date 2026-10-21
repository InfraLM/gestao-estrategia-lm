import { describe, it, expect } from "vitest";
import { GovAcao, PrioridadeSemanal, contarPendencias, entregasDoCheckin, ordenarPendencias, puxarAcao, seloPrazo } from "@/lib/governancaPendencias";
const acao = (id: string, prazo: string | null): GovAcao => ({ id, origem_id: id, titulo: id, prazo, descricao: null, responsavel_origem: null, status: "aberto", prioridade: null, precisa_escalar: false, comite_codigo: "CEA", reuniao_titulo: null, reuniao_data: null, outros_responsaveis: [] });
describe("Pendências de comitês", () => {
  it("ordena vencidas, futuras e sem prazo sem mutar entrada", () => {
    const lista = [acao("sem", null), acao("futura", "2026-10-25"), acao("hoje", "2026-10-21"), acao("v2", "2026-10-20"), acao("v1", "2026-10-10")];
    expect(ordenarPendencias(lista, "2026-10-21").map(a => a.id)).toEqual(["v1", "v2", "hoje", "futura", "sem"]);
    expect(lista[0].id).toBe("sem");
  });
  it("prazo de hoje não está vencido; contadores e selos corretos", () => {
    expect(seloPrazo("2026-10-21", "2026-10-21")).toBe("data");
    expect(seloPrazo("2026-10-20", "2026-10-21")).toBe("Vencida");
    expect(seloPrazo(null)).toBe("Sem prazo");
    expect(contarPendencias([acao("a", null), acao("b", "2026-10-20")], "2026-10-21")).toEqual({ total: 2, vencidas: 1, semPrazo: 1 });
  });
  it("puxa título e vínculo sem duplicar", () => {
    const r = puxarAcao([], acao("a", null));
    expect(r.prioridades[0]).toEqual({ titulo: "a", iniciativa_id: "", resultado: "", gov_acao_id: "a", gov_comite_codigo: "CEA" });
    expect(puxarAcao(r.prioridades, acao("a", null)).erro).toBe("duplicada");
    expect(puxarAcao(r.prioridades, acao("a", null)).prioridades).toHaveLength(1);
  });
  it("permite quinta mas impede sexta prioridade", () => {
    const quatro: PrioridadeSemanal[] = Array.from({ length: 4 }, () => ({ titulo: "Manual", iniciativa_id: "", resultado: "" }));
    const cinco = puxarAcao(quatro, acao("a", null));
    expect(cinco.erro).toBeNull(); expect(cinco.prioridades).toHaveLength(5);
    expect(puxarAcao(cinco.prioridades, acao("b", null)).erro).toBe("cheio");
    expect(puxarAcao(cinco.prioridades, acao("b", null)).prioridades).toHaveLength(5);
  });
  it("conteúdo antigo mantém entregas; vínculo novo chega ao checkout", () => {
    expect(entregasDoCheckin([{ titulo: "Antiga", iniciativa_id: "ini", resultado: "ok" }])).toEqual([{ titulo: "Antiga", status: "", motivo: "", iniciativa_id: "ini" }]);
    expect(entregasDoCheckin(puxarAcao([], acao("a", null)).prioridades)[0]).toMatchObject({ gov_acao_id: "a", gov_comite_codigo: "CEA" });
    expect(entregasDoCheckin([{ titulo: "", iniciativa_id: "", resultado: "" }])).toEqual([]);
  });
});