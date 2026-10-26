import { describe, it, expect } from "vitest";
import { mapearExport, sugerirCadeira } from "../../supabase/functions/fitfinder-sync/mapear";

describe("Fit Finder: privacidade dos agregados", () => {
  it("diretoria com menos de 3 prestadores vira grupo pequeno sem indicadores", () => {
    const m = mapearExport({ diretorias: [{ diretoria: "CFO", total_prestadores: 2, aderencia: { media: 80 } }] });
    expect(m.diretorias[0]).toMatchObject({ total_prestadores: null, grupo_pequeno: true, aderencia: {} });
  });
  it("contagens de 1 e 2 são mascaradas; 0 e 3+ ficam", () => {
    const m = mapearExport({ diretorias: [{ diretoria: "COO", total_prestadores: 10,
      por_cargo: [{ cargo: "Analista", qtd: 7 }, { cargo: "Gerente", qtd: 2 }],
      testes: { validos: 3, invalidos: 1, incompletos: 0, sem_teste: 6 } }] }).diretorias[0] as any;
    expect(m.por_cargo).toEqual([{ rotulo: "Analista", qtd: 7 }, { rotulo: "Gerente", qtd: null, pequeno: true }]);
    expect(m.testes.invalidos).toEqual({ qtd: null, pequeno: true });
    expect(m.testes.incompletos).toEqual({ qtd: 0 });
  });
  it("descarta campos individuais (nomes, e-mails, prestadores)", () => {
    const m = mapearExport({ diretorias: [{ diretoria: "CMO", total_prestadores: 5, prestadores: [{ nome: "Fulano", email: "f@x.com" }],
      por_cargo: [{ cargo: "f@x.com", qtd: 5 }] }] });
    const json = JSON.stringify(m);
    expect(json).not.toContain("Fulano");
    expect(json).not.toContain("@");
  });
  it("sugere cadeira por nome, sem ambiguidade", () => {
    const cads = [{ id: "1", nome: "CFO" }, { id: "2", nome: "COO" }];
    expect(sugerirCadeira("cfo", cads)).toBe("1");
    expect(sugerirCadeira("Diretoria X", cads)).toBeNull();
  });
});
