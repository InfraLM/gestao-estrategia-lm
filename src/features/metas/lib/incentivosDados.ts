import type { Database } from "@/integrations/supabase/types";
export type Sistema = Database["public"]["Tables"]["incentivo_sistemas"]["Row"];
export type MetaIncentivo = Database["public"]["Tables"]["incentivo_metas"]["Row"];
export type IndicadorIncentivo = Database["public"]["Tables"]["mt_indicadores"]["Row"];
export const BLOCOS_METAS = { bsc: "Árvore de KPIs (BSC)", okr: "OKRs", cesta: "Cesta de metas" } as const;
export function agruparOrigemMeta(origem: string | null): keyof typeof BLOCOS_METAS | null {
  if (origem === "bsc" || origem === "arvore_kpis") return "bsc";
  if (origem === "okr") return "okr";
  if (origem === "cesta" || origem === "cesta_metas") return "cesta";
  return null;
}
export function formatarMeta(meta: { meta_texto: string | null; meta_semestre?: number | null; unidade?: string | null }) {
  if (meta.meta_texto?.trim()) return meta.meta_texto;
  if (meta.meta_semestre == null) return "a definir";
  return [meta.meta_semestre.toLocaleString("pt-BR"), meta.unidade].filter(Boolean).join(" ");
}
export function sistemaMetasAoVivo(nome: string | null) { return nome?.startsWith("Metas 2S26") === true; }