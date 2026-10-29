/** Rev.03 do BSC: KPIs mantêm o id; nome e código antigos ficam em nome_anterior/codigo_anterior. */
export type IndRev = { id?: string; nome?: string | null; nome_anterior?: string | null; status?: string | null; nivel?: string | null };

/** Nomes pelos quais o KPI pode aparecer na árvore Rev.02 fixa (nome atual e nome anterior). */
export const nomesDoKpi = (i: IndRev): string[] =>
  [i.nome, i.nome_anterior].map((x) => String(x ?? "").trim()).filter(Boolean);

/** Valor da árvore Rev.02 por nome, aceitando o nome anterior à Rev.03. */
export function doMapaArvore<T>(mapa: Record<string, T>, i: IndRev): T | undefined {
  for (const n of nomesDoKpi(i)) if (mapa[n] !== undefined) return mapa[n];
  return undefined;
}

/** Item da árvore Rev.02 (lista de objetivos com kpis) correspondente ao KPI. */
export function itemArvore<K extends { kpi: string }>(arv: { kpis?: K[] }[], i: IndRev): K | undefined {
  const nomes = nomesDoKpi(i);
  return (arv ?? []).flatMap((o) => o.kpis ?? []).find((k) => nomes.includes(String(k.kpi).trim()));
}

export const ehMetricaMae = (i: IndRev) => i.nivel === "Métrica-mãe";

/** Rótulo para KPI arquivado na Rev.03, quando uma resposta ou vínculo ainda aponta para ele. */
export const rotuloArquivado = (i: IndRev) => `KPI arquivado (Rev.02): ${String(i.nome_anterior ?? i.nome ?? "").trim()}`;
