import { describe, expect, it } from "vitest";
import { avaliacaoKr, contarVinculosKr, semestreVigente } from "@/lib/aderenciaOkrs";
describe("aderência aos OKRs", () => {
  it("sem dado mostra pendente de apontamento", () => { expect(avaliacaoKr(undefined)).toBe("pendente"); expect(avaliacaoKr("sem_meta")).toBe("pendente"); expect(avaliacaoKr("on")).toBe("on"); });
  it("semestre vigente em outubro/2026 é 2026/2", () => { expect(semestreVigente(new Date("2026-10-22T12:00:00Z"))).toBe("2026/2"); });
  it("conta itens distintos, validado vence proposto, ignora removidos", () => {
    const vs = [{ fonte_tipo: "projeto", fonte_id: "a", ref_id: "k", status: "proposto" }, { fonte_tipo: "projeto", fonte_id: "a", ref_id: "k", status: "validado" }, { fonte_tipo: "iniciativa", fonte_id: "b", ref_id: "k", status: "proposto" }, { fonte_tipo: "projeto", fonte_id: "c", ref_id: "k", status: "removido" }];
    expect(contarVinculosKr(vs, "k")).toEqual({ validados: 1, propostos: 1 });
  });
});
