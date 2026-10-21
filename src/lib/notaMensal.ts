/** Regras da nota mensal: BSC fica fora; KRs e cesta entram com o peso vigente na competência. */
export type PesoVigencia = { indicador_id: string; competencia_inicio: string; peso: number };

export function pesoVigente(ind: { id: string; peso: number }, competencia: string, vig: PesoVigencia[]) {
  const v = vig.filter((x) => x.indicador_id === ind.id && x.competencia_inicio <= competencia)
    .sort((a, b) => b.competencia_inicio.localeCompare(a.competencia_inicio))[0];
  return v ? Number(v.peso) : Number(ind.peso);
}

export const entraNaNota = (i: { origem: string }) => i.origem !== "bsc";

/** Média ponderada dos itens com atingimento, só KRs e cesta, peso vigente > 0. */
export function notaMensal<T extends { id: string; peso: number; origem: string }>(itens: T[], atg: (i: T) => number | null, competencia: string, vig: PesoVigencia[]) {
  let sp = 0, s = 0;
  for (const i of itens) {
    if (!entraNaNota(i)) continue;
    const p = pesoVigente(i, competencia, vig); if (!(p > 0)) continue;
    const a = atg(i); if (a == null) continue;
    sp += p; s += a * p;
  }
  return sp ? s / sp : null;
}
