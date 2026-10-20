import type { Database } from "@/integrations/supabase/types";
import { semAcentos } from "./contextoDecisoes";

export type InsightSocio = Database["public"]["Tables"]["socios_insights"]["Row"];
export const STATUS_INSIGHTS = ["Passa", "Piloto", "Máquina", "Gestão interna", "Decidido", "Registrado", "Arquivado", "Outros"] as const;
export type GrupoStatus = typeof STATUS_INSIGHTS[number];
export const ORIGENS_INSIGHTS = ["Evento, início de 2026", "Anotações de Ian", "Pensamentos estratégicos, 17/10", "Ian, 18/10 a 20/10"] as const;
export function agruparStatus(status: string | null): GrupoStatus {
  const texto = semAcentos((status ?? "").trim());
  if (texto.startsWith("decidido") || texto.startsWith("em execucao")) return "Decidido";
  if (["registrado", "encaminhado", "processo desenhado"].some(prefixo => texto.startsWith(prefixo))) return "Registrado";
  return STATUS_INSIGHTS.find(grupo => grupo !== "Outros" && semAcentos(grupo) === texto) ?? "Outros";
}
export function agruparOrigem(origem: string | null): typeof ORIGENS_INSIGHTS[number] | null {
  const texto = semAcentos((origem ?? "").trim());
  if (texto.startsWith("ian,")) return "Ian, 18/10 a 20/10";
  return ORIGENS_INSIGHTS.slice(0, 3).find(grupo => texto.startsWith(semAcentos(grupo))) ?? null;
}
export type FiltrosInsights = { busca: string; origem: string; status: string };
export function filtrarInsights(insights: InsightSocio[], filtros: FiltrosInsights): InsightSocio[] {
  const busca = semAcentos(filtros.busca.trim());
  return insights.filter(insight =>
    (!busca || [insight.codigo, insight.desejo, insight.origem, insight.dono_proposto, insight.leitura_filtro].some(texto => semAcentos(texto ?? "").includes(busca)))
    && (filtros.origem === "todos" || agruparOrigem(insight.origem) === filtros.origem)
    && (filtros.status === "todos" || agruparStatus(insight.status) === filtros.status));
}