import { avaliarKpiBsc, situacaoNumerica, type Avaliacao, type ArvoreSit, type CheckoutReg } from "@/lib/avaliacaoBsc";

export type Grupo = "estrategico" | "tatico" | "kr" | "cesta";
export const GRUPO_LBL: Record<Grupo, string> = { estrategico: "KPI estratégico", tatico: "KPI tático", kr: "OKR / KR", cesta: "Cesta de metas" };
export const LIMITE_CRITICO = 0.7;

export function grupoDo(ind: { origem: string; nivel?: string | null }): Grupo | null {
  if (ind.origem === "okr") return "kr";
  if (ind.origem === "cesta") return "cesta";
  if (ind.origem === "bsc") return (ind.nivel ?? "Tático") === "Estratégico" ? "estrategico" : (ind.nivel ?? "Tático") === "Operacional" ? null : "tatico";
  return null;
}

/** Atingimento: maior é melhor → valor/meta; menor é melhor → meta/valor. */
export function atingimento(valor: number | null, meta: number | null, sentido: "maior" | "menor"): number | null {
  if (valor == null || meta == null) return null;
  if (sentido === "maior") return meta === 0 ? null : valor / meta;
  return valor === 0 ? (meta >= 0 ? 1 : null) : meta / valor;
}

export type Celula = { valor: number | null; meta: number | null; aval: Avaliacao; origem: string | null; ating: number | null; critico?: boolean };

/** Célula mensal pela regra única `avaliarKpiBsc` (vale para BSC, KR e cesta). */
export function celulaMes(ind: { id: string; sentido: "maior" | "menor"; meta_semestre: number | null; meta_texto: string | null }, competencia: string,
  meta_mes: number | null, realizado: number | null, arvore: ArvoreSit, checkouts: CheckoutReg[], hoje = new Date()): Celula {
  const r = avaliarKpiBsc({ indicador_id: ind.id, sentido: ind.sentido, competencia, meta_mes, meta_semestre: ind.meta_semestre, meta_texto: ind.meta_texto, realizado }, arvore, checkouts, hoje);
  const valor = realizado ?? situacaoNumerica(ind.id, arvore, checkouts, competencia)?.valor ?? null;
  const meta = meta_mes ?? ind.meta_semestre;
  return { valor, meta, aval: r.aval, origem: realizado != null ? "lançado" : r.origem, ating: atingimento(valor, meta, ind.sentido) };
}

/** Desvio crítico: Off track em 2+ períodos seguidos E atingimento abaixo de 70% (as duas juntas). Marca cada célula da sequência a partir da 2ª. */
export function marcarCriticos(celulas: Celula[]): Celula[] {
  let seguidos = 0;
  return celulas.map((c) => {
    seguidos = c.aval === "off" ? seguidos + 1 : 0;
    if (c.aval !== "off") return { ...c, critico: false };
    return { ...c, critico: seguidos >= 2 && c.ating != null && c.ating < LIMITE_CRITICO };
  });
}
