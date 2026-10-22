/** Dashboard consolidado da Rotina Semanal: classificação dos apontamentos de KPI vindos da projeção segura do banco. */
import { numeroBr } from "@/lib/avaliacaoBsc";
import { LIMITE_CRITICO } from "@/lib/matrizApontamentos";

export type KpiDash = {
  indicador_id: string; codigo: string; nome: string; origem: "bsc" | "okr" | "cesta"; nivel?: string | null;
  tipo_apontamento?: string | null; sentido?: string | null; periodo_label?: string | null;
  meta_mes?: number | null; meta_semestre?: number | null; meta_texto?: string | null; realizado?: number | null; prazo_entrega?: string | null;
  voluntario?: boolean; desvio_critico?: boolean; situacao_atual?: string | null; declaracao?: string | null; status_entrega?: string | null; avanco_pct?: string | null;
};
export type Situacao = "on" | "off" | "acomp" | "pendente" | "fora";
export const SITUACAO_DASH_LBL: Record<Situacao, string> = { on: "On track", off: "Off track", acomp: "Em acompanhamento", pendente: "Pendente", fora: "Fora do calendário" };
export type OrigemDash = "bsc_estrategico" | "bsc_tatico" | "okr" | "cesta";
export const ORIGEM_DASH_LBL: Record<OrigemDash, string> = { bsc_estrategico: "BSC estratégico", bsc_tatico: "BSC tático", okr: "KR de OKR", cesta: "Cesta de metas" };

export const origemDash = (k: Pick<KpiDash, "origem" | "nivel">): OrigemDash =>
  k.origem === "okr" ? "okr" : k.origem === "cesta" ? "cesta" : (k.nivel ?? "").toLowerCase().startsWith("estrat") ? "bsc_estrategico" : "bsc_tatico";

/** Avaliação do apontamento do ciclo pelo tipo V/S/E (sem considerar a frequência). */
export function avaliarApontamento(k: KpiDash): { aval: Exclude<Situacao, "fora">; ating: number | null } {
  const tipo = k.tipo_apontamento ?? "valor_mensal";
  if (tipo === "entrega") {
    const s = k.status_entrega ?? "";
    if (!s) return { aval: "pendente", ating: null };
    if (s === "atrasada") return { aval: "off", ating: null };
    if (s === "implantada") return { aval: "on", ating: null };
    if (k.prazo_entrega && s !== "cancelada" && k.prazo_entrega < new Date().toISOString().slice(0, 10)) return { aval: "off", ating: null };
    return { aval: "acomp", ating: null };
  }
  if (tipo === "valor_periodo") {
    if (k.declaracao === "on") return { aval: "on", ating: null };
    if (k.declaracao === "off") return { aval: "off", ating: null };
    return { aval: "pendente", ating: null };
  }
  const n = (k.situacao_atual ? numeroBr(k.situacao_atual) : null) ?? (k.realizado ?? null);
  if (n == null) return { aval: "pendente", ating: null };
  const meta = k.meta_mes ?? null;
  if (meta == null || meta === 0) return { aval: "acomp", ating: null };
  const ating = k.sentido === "menor" ? (n === 0 ? 1 : meta / n) : n / meta;
  return { aval: ating >= 1 ? "on" : "off", ating };
}

/** Situação no painel: voluntário entra como "fora do calendário" (não conta pendência). */
export function situacaoDash(k: KpiDash): Situacao {
  const { aval } = avaliarApontamento(k);
  if (k.voluntario && !k.desvio_critico) return "fora";
  return aval;
}

/** Sugere virar desvio crítico: Off track e, havendo atingimento numérico, abaixo de 70% (regra da matriz). */
export function sugerirDesvio(k: KpiDash): boolean {
  if (k.desvio_critico) return false;
  const { aval, ating } = avaliarApontamento(k);
  return aval === "off" && (ating == null || ating < LIMITE_CRITICO);
}

export type Contagem = Record<Situacao, number> & { criticos: number; total: number };
export function contar(kpis: KpiDash[]): Contagem {
  const c: Contagem = { on: 0, off: 0, acomp: 0, pendente: 0, fora: 0, criticos: 0, total: 0 };
  for (const k of kpis) { c[situacaoDash(k)]++; c.total++; if (k.desvio_critico) c.criticos++; }
  return c;
}
