/** Avaliação dos KPIs de BSC (fora da nota): On track / Off track só depois do fim do mês ou do período da meta. Calculada na leitura, nunca gravada. */
export type MetaLida = { tipo: "valor"; v: number; sentido?: "maior" | "menor" } | { tipo: "faixa"; min: number; max: number };
export type Avaliacao = "on" | "off" | "acomp" | "sem_meta";
export const AVALIACAO_LBL: Record<Avaliacao, string> = { on: "On track", off: "Off track", acomp: "Em acompanhamento", sem_meta: "Sem meta registrada" };
export const FIM_PERIODO = "2026-12-31";

export function numeroBr(s: string): number | null {
  const m = s.replace(/\s/g, "").match(/-?[\d.,]+/);
  if (!m) return null;
  let t = m[0];
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Lê metas numéricas ou em texto: "> 70", "≤ 1,5%", "70 a 80". Texto sem número = null. */
export function lerMeta(meta: number | string | null | undefined): MetaLida | null {
  if (meta == null) return null;
  if (typeof meta === "number") return Number.isFinite(meta) ? { tipo: "valor", v: meta } : null;
  const s = meta.trim();
  const faixa = s.match(/(-?[\d.,]+)\s*%?\s*(?:a|até|-|–)\s*(-?[\d.,]+)/i);
  if (faixa) {
    const a = numeroBr(faixa[1]), b = numeroBr(faixa[2]);
    if (a != null && b != null) return { tipo: "faixa", min: Math.min(a, b), max: Math.max(a, b) };
  }
  const v = numeroBr(s);
  if (v == null) return null;
  const sentido = /^(>|≥)/.test(s) ? "maior" : /^(<|≤)/.test(s) ? "menor" : undefined;
  return { tipo: "valor", v, ...(sentido ? { sentido } : {}) };
}

export function cumpre(valor: number, meta: MetaLida, sentido: "maior" | "menor") {
  if (meta.tipo === "faixa") return valor >= meta.min && valor <= meta.max;
  return (meta.sentido ?? sentido) === "maior" ? valor >= meta.v : valor <= meta.v;
}

const fimDoMes = (comp: string) => { const [y, m] = comp.split("-").map(Number); return new Date(y, m, 0).toISOString().slice(0, 10); };
const hojeIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type EntradaBsc = {
  sentido: "maior" | "menor"; competencia: string | null; meta_mes: number | null; meta_semestre: number | null; meta_texto: string | null;
  realizado: number | null; situacao?: string | null;
};
/** Com meta mensal: avalia após o fim do mês. Só meta do período: avalia após o fim do período. */
export function avaliarBsc(e: EntradaBsc, hoje = new Date()): Avaliacao {
  const h = hojeIso(hoje);
  const valor = e.realizado ?? (e.situacao ? numeroBr(e.situacao) : null);
  if (e.meta_mes != null && e.competencia) {
    if (h <= fimDoMes(e.competencia)) return "acomp";
    return valor == null ? "acomp" : cumpre(valor, { tipo: "valor", v: e.meta_mes }, e.sentido) ? "on" : "off";
  }
  const meta = lerMeta(e.meta_semestre ?? e.meta_texto);
  if (!meta) return "sem_meta";
  if (h <= FIM_PERIODO) return "acomp";
  return valor == null ? "acomp" : cumpre(valor, meta, e.sentido) ? "on" : "off";
}

export function contarAvaliacoes(lista: Avaliacao[]) {
  return { on: lista.filter((x) => x === "on").length, off: lista.filter((x) => x === "off").length, acomp: lista.filter((x) => x === "acomp").length, sem_meta: lista.filter((x) => x === "sem_meta").length };
}
