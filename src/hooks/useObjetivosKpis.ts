import { useMemo } from "react";
import rev02 from "@/data/bscRev02.json";
import { useConteudo } from "@/hooks/useConteudo";
import { useBaseOverrides } from "@/hooks/useBaseOverrides";

export type KpiBase = { kpi: string; nivel: string };
export type ObjetivoBase = { codigo: string; nome: string; kpis: KpiBase[] };

export const PERSPECTIVAS = [
  { prefixo: "F.", nome: "Financeira" },
  { prefixo: "C.", nome: "Cliente & Mercado" },
  { prefixo: "P.", nome: "Processos" },
  { prefixo: "AC.", nome: "Aprendizagem & Crescimento" },
];

/** Separador entre código do objetivo e nome do KPI no valor salvo. */
export const kpiId = (objetivo: string, kpi: string) => `${objetivo}|${kpi}`;
export const kpiObjetivo = (id: string) => id.split("|")[0];
export const kpiNome = (id: string) => id.split("|").slice(1).join("|");

/** Objetivos do BSC Rev.02 (mesma base da Árvore de KPIs), só com KPIs Estratégicos e Táticos. */
export function useObjetivosKpis() {
  const { aplicar } = useBaseOverrides("estrategia");
  const base = useConteudo("bsc.rev02", rev02 as ObjetivoBase[]).data as ObjetivoBase[];
  return useMemo(() => {
    const objetivos = base.map(o => ({
      ...aplicar("objetivo", o.codigo, o),
      kpis: o.kpis.map(k => aplicar("kpi", k.kpi, k)).filter(k => k.nivel === "Estratégico" || k.nivel === "Tático"),
    }));
    const nomeObjetivo = (c: string) => objetivos.find(o => o.codigo === c)?.nome ?? c;
    const grupos = PERSPECTIVAS.map(p => ({ ...p, objetivos: objetivos.filter(o => o.codigo.startsWith(p.prefixo)) })).filter(g => g.objetivos.length);
    return { objetivos, grupos, nomeObjetivo };
  }, [base, aplicar]);
}
