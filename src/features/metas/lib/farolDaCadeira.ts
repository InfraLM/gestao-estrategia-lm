/**
 * Indicadores de uma cadeira que estão fora da meta pelo farol (decisão da Naira, 26/11/2026, d23):
 * vermelho pede causa, impacto e ação obrigatórios no formulário semanal; amarelo (alerta) aparece sem obrigatoriedade.
 * Usa exatamente a regra da Matriz de apontamentos (celulaMes + regras do farol), no mês mais recente que já tem farol.
 */
import { celulaMes, grupoDo } from "@/features/metas/lib/matrizApontamentos";
import { pctDoIndicador, type RegrasFarol } from "@/features/metas/lib/regrasFarol";
import { doMapaArvore } from "@/lib/bscRev03";
import { previstoNoMes } from "@/lib/frequenciaApontamento";
import type { CheckoutReg } from "@/lib/avaliacaoBsc";

export type KpiForaDaMeta = {
  indicador_id: string; codigo: string; nome: string; unidade: string | null;
  cor: "vermelho" | "amarelo"; competencia: string; valor: number | null; meta: number | null;
};

type Entrada = {
  indicadores: any[]; cadeiraId: string; meses: string[];
  lancs: any[]; metas: any[]; arvore: { m: Record<string, string>; d: string | null };
  checkouts: (CheckoutReg & { cadeira_id: string })[]; regras: RegrasFarol | null | undefined; hoje?: Date;
};

export function kpisForaDaMeta({ indicadores, cadeiraId, meses, lancs, metas, arvore, checkouts, regras, hoje = new Date() }: Entrada): KpiForaDaMeta[] {
  const out: KpiForaDaMeta[] = [];
  const doMes = [...meses].sort().reverse();
  for (const i of indicadores) {
    if (i.cadeira_id !== cadeiraId || i.status !== "ativo" || i.parent_id || !grupoDo(i)) continue;
    // Mesmos insumos da Matriz (MatrizApontamentos.tsx), para o diretor ver aqui a mesma cor que vê lá.
    const ck = checkouts.filter((c) => c.cadeira_id === i.cadeira_id);
    const sit = doMapaArvore(arvore.m, i); const arv = sit ? { valor: sit, data: arvore.d } : null;
    const fora = (comp: string) => !!i.frequencia && (!previstoNoMes(i, comp) || ["trimestral", "semestral"].includes(i.frequencia));
    const doIndicador = (comp: string) => lancs.filter((x) => x.indicador_id === i.id && (fora(comp) ? x.competencia <= comp : x.competencia === comp))
      .sort((a, z) => z.competencia.localeCompare(a.competencia) || z.revisao - a.revisao);
    const ind = { ...i, farol_pct: pctDoIndicador(regras, i.id) };
    for (const comp of doMes) {
      const l = doIndicador(comp); const lReal = l.find((x) => !x.sem_medicao);
      const metaMes = metas.find((x) => x.indicador_id === i.id && x.competencia === comp)?.meta_mes ?? null;
      const c = celulaMes(ind, comp, metaMes, lReal?.valor == null ? null : Number(lReal.valor), arv, ck, hoje, l[0] ?? null);
      if (!c.farol) continue;
      if (c.farol !== "verde") out.push({ indicador_id: i.id, codigo: i.codigo, nome: i.nome, unidade: i.unidade ?? null, cor: c.farol, competencia: comp, valor: c.valor, meta: c.meta });
      break;
    }
  }
  return out.sort((a, z) => (a.cor === z.cor ? a.codigo.localeCompare(z.codigo) : a.cor === "vermelho" ? -1 : 1));
}
