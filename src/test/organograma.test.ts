import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { descendentes, validarCargo, podeEditarEstrutura, lerOrganograma } from "@/lib/organograma";

describe("Organograma atualizado", () => {
  it("permite edição somente a administradores ou editores de estrutura", () => {
    expect(podeEditarEstrutura([], [])).toBe(false);
    expect(podeEditarEstrutura([{ modulo: "estrutura", nivel: "leitura" }], [])).toBe(false);
    expect(podeEditarEstrutura([{ modulo: "estrutura", nivel: "edicao" }], [])).toBe(true);
    expect(podeEditarEstrutura([], ["admin"])).toBe(true);
    expect(podeEditarEstrutura([], ["super_admin"])).toBe(true);
    expect(podeEditarEstrutura([], ["pmo"])).toBe(false);
  });
  it("impede ciclos e nomes vazios", () => {
    const cargos = [{ id: "ceo", parent_id: null }, { id: "cro", parent_id: "ceo" }, { id: "cmo", parent_id: "cro" }];
    expect([...descendentes("ceo", cargos)]).toEqual(["ceo", "cro", "cmo"]);
    expect(validarCargo({ id: "ceo", nome: "CEO", parent_id: "cmo" }, cargos)).not.toBeNull();
    expect(validarCargo({ id: "ceo", nome: "CEO", parent_id: "ceo" }, cargos)).not.toBeNull();
    expect(validarCargo({ id: "cmo", nome: "CMO", parent_id: "ceo" }, cargos)).toBeNull();
    expect(validarCargo({ nome: " ", parent_id: null }, cargos)).not.toBeNull();
  });
  it("importa a aba visível e preserva nomes e agrupamento sem encadear pares", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Antigo"]]), "Histórico");
    const s = XLSX.utils.aoa_to_sheet([]);
    s.B3 = { t: "s", v: "Conselho Consultivo" }; s.B5 = { t: "s", v: "Ian\nCEO" }; s.B7 = { t: "s", v: "Guilherme Vieira\nCRO (Chief revenue Officer)" }; s.C9 = { t: "s", v: "Iuri Franco\nCMO (Chief Marketing Officer)" }; s.D9 = { t: "s", v: "Felipe\nCCO" };
    s["!ref"] = "B3:D9"; s["!merges"] = ["B3:D3", "B5:D5", "B7:D7"].map(XLSX.utils.decode_range);
    XLSX.utils.book_append_sheet(wb, s, "Organograma LM "); wb.Workbook = { Sheets: [{ name: "Histórico", Hidden: 1 }, { name: "Organograma LM ", Hidden: 0 }] };
    const cargos = lerOrganograma(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
    expect(cargos).toHaveLength(5);
    expect(cargos[3]?.ocupante_nome).toBe("Iuri Franco");
    expect(cargos[3]?.parent_id).toBe(cargos[2]?.id);
    expect(cargos[4]?.parent_id).toBe(cargos[2]?.id);
    expect(cargos[3]?.texto_original).toBe("Iuri Franco\nCMO (Chief Marketing Officer)");
  });
});