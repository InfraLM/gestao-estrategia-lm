// Helpers compartilhados de risco do BPMO (processos)
export const NATUREZAS_BPMO = [
  "Variação",
  "Ambiguidade",
  "Evento",
  "Emergente",
  "Condição de incerteza",
] as const;
export type NaturezaBPMO = typeof NATUREZAS_BPMO[number];

export const TIPOS_BPMO = [
  "Financeiro",
  "Legal",
  "Reputacional",
  "Processo operacional",
  "Recursos (Pessoas/Materiais)",
  "Tecnologia/Sistemas",
] as const;
export type TipoBPMO = typeof TIPOS_BPMO[number];

export const STATUS_RISCO_BPMO = ["Identificado", "Em mitigação", "Mitigado", "Aceito"] as const;
export type StatusRiscoBPMO = typeof STATUS_RISCO_BPMO[number];

export const IMPACTO_LABEL: Record<number, string> = { 1: "Insignificante", 2: "Baixo", 3: "Moderado", 4: "Alto", 5: "Crítico" };
export const PROB_LABEL: Record<number, string> = { 1: "Raro (<5%)", 2: "Improvável (5–15%)", 3: "Possível (15–40%)", 4: "Provável (40–70%)", 5: "Quase certo (>70%)" };

export type NivelRisco = "Baixo" | "Moderado" | "Alto" | "Extremo";
export function classifRiscoBPMO(impacto?: number, probabilidade?: number): { score: number; nivel: NivelRisco; color: string; cell: string } {
  const score = (impacto || 0) * (probabilidade || 0);
  // 1-3 Baixo · 4-6 Moderado · 8-12 Alto · 15-25 Extremo
  if (score >= 15) return { score, nivel: "Extremo", color: "bg-rose-500/15 text-rose-700 border-rose-500/40", cell: "bg-rose-500 text-white" };
  if (score >= 8)  return { score, nivel: "Alto",    color: "bg-orange-500/15 text-orange-700 border-orange-500/40", cell: "bg-orange-500 text-white" };
  if (score >= 4)  return { score, nivel: "Moderado", color: "bg-amber-500/15 text-amber-700 border-amber-500/40", cell: "bg-amber-400 text-amber-950" };
  return { score, nivel: "Baixo", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40", cell: "bg-emerald-500 text-white" };
}
