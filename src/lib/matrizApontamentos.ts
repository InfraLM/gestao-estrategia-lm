import { avaliarPorTipo, apontamentoMaisRecente, situacaoNumerica, FIM_PERIODO, type Avaliacao, type ArvoreSit, type CheckoutReg, type Fonte, type TipoApontamento, type StatusEntrega } from "@/lib/avaliacaoBsc";

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

export type Celula = { valor: number | null; meta: number | null; aval: Avaliacao; origem: string | null; ating: number | null; critico?: boolean;
  fonte?: Fonte; status_entrega?: StatusEntrega | null; alertaDeclarado?: boolean; prazoVencido?: boolean };
type IndM = { id: string; sentido: "maior" | "menor"; meta_semestre: number | null; meta_texto: string | null; tipo_apontamento?: TipoApontamento | null; prazo_entrega?: string | null };
type LancM = { declaracao?: string | null; justificativa?: string | null; status_entrega?: string | null; avanco_pct?: number | null; updated_at?: string | null } | null;

/** Célula mensal pela regra única por tipo. Atingimento numérico só para V (e S depois do fim do período). */
export function celulaMes(ind: IndM, competencia: string, meta_mes: number | null, realizado: number | null, arvore: ArvoreSit, checkouts: CheckoutReg[], hoje = new Date(), lanc: LancM = null): Celula {
  const tipo = ind.tipo_apontamento ?? "valor_mensal";
  const ap = apontamentoMaisRecente(ind.id, competencia, lanc, checkouts);
  const r = avaliarPorTipo({ indicador_id: ind.id, sentido: ind.sentido, competencia, meta_mes: tipo === "valor_mensal" ? meta_mes : null, meta_semestre: ind.meta_semestre, meta_texto: ind.meta_texto, realizado,
    tipo, prazo_entrega: ind.prazo_entrega ?? null, apontamento: ap }, arvore, checkouts, hoje);
  const valor = tipo === "entrega" ? null : realizado ?? situacaoNumerica(ind.id, arvore, checkouts, competencia)?.valor ?? null;
  const meta = tipo === "valor_mensal" ? meta_mes ?? ind.meta_semestre : tipo === "valor_periodo" ? ind.meta_semestre : null;
  const numerico = tipo === "valor_mensal" || (tipo === "valor_periodo" && r.fonte === "calculado" && hojeIso(hoje) > FIM_PERIODO);
  return { valor, meta, aval: r.aval, origem: realizado != null && r.fonte === "calculado" ? "lançado" : r.origem, ating: numerico ? atingimento(valor, meta, ind.sentido) : null,
    fonte: r.fonte, status_entrega: ap?.status_entrega ?? null, prazoVencido: tipo === "entrega" && r.aval === "off" && ap?.status_entrega !== "atrasada" };
}
const hojeIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Desvio crítico: Off track em 2+ períodos seguidos E atingimento abaixo de 70% (só onde há atingimento numérico).
 *  Declarações: "2+ meses declarados Off" vira alerta próprio, sem chama de crítico. */
export function marcarCriticos(celulas: Celula[]): Celula[] {
  let seguidos = 0, decl = 0;
  return celulas.map((c) => {
    seguidos = c.aval === "off" ? seguidos + 1 : 0;
    decl = c.aval === "off" && c.fonte === "declarado" ? decl + 1 : 0;
    if (c.aval !== "off") return { ...c, critico: false, alertaDeclarado: false };
    return { ...c, critico: seguidos >= 2 && c.ating != null && c.ating < LIMITE_CRITICO, alertaDeclarado: decl >= 2 };
  });
}
