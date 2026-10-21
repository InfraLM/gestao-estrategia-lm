import type { Database } from "@/integrations/supabase/types";
import { canAccessModule, type ModuleGrant } from "./moduleAccess";
import { semAcentos } from "@/pages/contextoDecisoes";
import * as XLSX from "xlsx";

export type Cargo = Database["public"]["Tables"]["org_organograma_cargos"]["Row"];
export type CargoImportado = Pick<Cargo, "id" | "nome" | "ocupante_nome" | "nivel" | "parent_id" | "ordem" | "fonte_celula" | "texto_original" | "observacoes">;
export function podeEditarEstrutura(grants: ModuleGrant[], roles: string[]) {
  return canAccessModule(grants, "estrutura", true, roles.includes("super_admin"), roles.includes("admin"));
}
export function descendentes(id: string, cargos: Pick<Cargo, "id" | "parent_id">[]): Set<string> {
  const encontrados = new Set([id]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const cargo of cargos) if (cargo.parent_id && encontrados.has(cargo.parent_id) && !encontrados.has(cargo.id)) { encontrados.add(cargo.id); mudou = true; }
  }
  return encontrados;
}
export function validarCargo(cargo: { id?: string; nome: string; parent_id: string | null }, cargos: Pick<Cargo, "id" | "parent_id">[]) {
  if (!cargo.nome.trim()) return "Informe o nome do cargo.";
  if (cargo.id && cargo.parent_id && descendentes(cargo.id, cargos).has(cargo.parent_id)) return "A cadeira superior não pode ser o próprio cargo ou um subordinado.";
  return null;
}
export function buscarCargos(cargos: Cargo[], busca: string) {
  const termo = semAcentos(busca.trim());
  return cargos.filter(c => !termo || semAcentos(`${c.nome} ${c.ocupante_nome ?? ""} ${c.texto_original ?? ""}`).includes(termo));
}
export function lerOrganograma(bytes: ArrayBuffer): CargoImportado[] {
  const wb = XLSX.read(bytes, { type: "array" });
  const visiveis = wb.SheetNames.filter((_, i) => !wb.Workbook?.Sheets?.[i]?.Hidden);
  const nome = visiveis.find(n => n.trim() === "Organograma LM") ?? visiveis[0];
  const folha = nome ? wb.Sheets[nome] : undefined;
  if (!folha) throw new Error("Não foi encontrada uma aba visível de organograma.");
  const merges = folha["!merges"] ?? [];
  const celulas = Object.entries(folha).filter(([ref, cell]) => !ref.startsWith("!") && cell?.v && typeof cell.v === "string")
    .map(([ref, cell]) => ({ ref, texto: String(cell.v).trim(), ...XLSX.utils.decode_cell(ref) }))
    .filter(c => c.texto).sort((a, b) => a.r - b.r || a.c - b.c);
  if (!celulas.length) throw new Error("A planilha não contém cargos legíveis.");
  const cargos = celulas.map((cell, ordem) => {
    const linhas = cell.texto.split(/\n+/).map(t => t.trim()).filter(Boolean);
    const temPessoa = linhas.length > 1 && !["Buda"].includes(linhas[0] ?? "");
    const nomeCargo = temPessoa ? linhas.slice(1).join(" · ") : cell.texto.replace(/\n+/g, " · ");
    const n = semAcentos(nomeCargo);
    return { id: crypto.randomUUID(), nome: nomeCargo, ocupante_nome: temPessoa ? linhas[0] ?? null : null,
      nivel: /chief|\bceo\b/.test(n) ? "diretoria" : /gerente/.test(n) ? "gerencia" : /coord/.test(n) ? "coordenacao" : /supervis/.test(n) ? "supervisao" : "outro",
      parent_id: null, ordem, fonte_celula: cell.ref, texto_original: cell.texto,
      observacoes: "Agrupamento visual da planilha; relação de chefia a confirmar." } as CargoImportado;
  });
  // Only spanning group headers above a cell determine grouping; peer rows are never chained.
  celulas.forEach((cell, index) => {
    const acima = celulas.map((c, i) => ({ ...c, i, merge: merges.find(m => m.s.r === c.r && m.s.c === c.c) }))
      .filter(c => c.r < cell.r && (c.r <= 8 || /gerente|coordenador|chief/i.test(c.texto)) && c.merge && c.merge.s.c <= cell.c && c.merge.e.c >= cell.c)
      .sort((a, b) => b.r - a.r);
    const pai = acima[0];
    const cargo = cargos[index];
    if (cargo && pai) cargo.parent_id = cargos[pai.i]?.id ?? null;
  });
  return cargos;
}