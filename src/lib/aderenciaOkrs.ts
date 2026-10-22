import type { Avaliacao } from "./avaliacaoBsc";

/** Semestre vigente no fuso de São Paulo, no formato "2026/2". */
export function semestreVigente(hoje = new Date()): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(hoje);
  return `${p.find((x) => x.type === "year")?.value}/${Number(p.find((x) => x.type === "month")?.value) <= 6 ? 1 : 2}`;
}

/** Sem avaliação calculada (falta dado ou o KR não é visível) → sempre "pendente", nunca valor de exemplo. */
export function avaliacaoKr(aval: Avaliacao | undefined | null): Avaliacao {
  return aval && aval !== "sem_meta" ? aval : "pendente";
}

/** Itens distintos vinculados ao KR: validado vence proposto; removidos não contam. */
export function contarVinculosKr(vs: { fonte_tipo: string; fonte_id: string; ref_id: string; status: string }[], krId: string) {
  const m = new Map<string, string>();
  for (const v of vs) if (v.ref_id === krId && v.status !== "removido") { const k = `${v.fonte_tipo}:${v.fonte_id}`; if (m.get(k) !== "validado") m.set(k, v.status); }
  const validados = [...m.values()].filter((s) => s === "validado").length;
  return { validados, propostos: m.size - validados };
}
