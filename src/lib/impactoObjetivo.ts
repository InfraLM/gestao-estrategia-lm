export type OrigemImpacto = "rotina" | "metas" | "projeto" | "ata" | "decisao";
export const ROTULO_ORIGEM: Record<OrigemImpacto, string> = {
  rotina: "Check-in/checkout", metas: "Metas", projeto: "Portfólio", ata: "Ata (Governança)", decisao: "Decisão D/GOV",
};
export type ItemImpacto = {
  id: string; titulo: string; origem: OrigemImpacto; status: string | null; prazo: string | null;
  responsavel: string | null; cadeira: string | null; codigo?: string | null; link?: string | null;
};

const ENCERRADO = /conclu|cancel|encerr|implantad|realizad|feito|done/i;

/** Atrasado = prazo vencido e status não encerrado. Decisões são marco: nunca atrasam. */
export function estaAtrasado(i: Pick<ItemImpacto, "origem" | "prazo" | "status">, hoje: string): boolean {
  if (i.origem === "decisao" || !i.prazo) return false;
  if (/atrasad/i.test(i.status ?? "")) return true;
  return i.prazo.slice(0, 10) < hoje && !ENCERRADO.test(i.status ?? "");
}

/** Quantos itens por origem e quantos atrasados, sem contar o mesmo item duas vezes. */
export function resumoImpacto(itens: ItemImpacto[], hoje: string) {
  const unicos = [...new Map(itens.map((i) => [`${i.origem}|${i.id}`, i])).values()];
  const porOrigem: Partial<Record<OrigemImpacto, number>> = {};
  for (const i of unicos) porOrigem[i.origem] = (porOrigem[i.origem] ?? 0) + 1;
  return { total: unicos.length, porOrigem, atrasados: unicos.filter((i) => estaAtrasado(i, hoje)).length };
}
