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

// ---- Regra única (formulário de checkout, Painel de Metas e Visão semanal) ----
import { normalizarCheckout, competenciaDaSemana } from "@/lib/rotinaSemanal";

export type CheckoutReg = { semana: string; status: string; enviado_em: string | null; conteudo: any };
export type ArvoreSit = { valor: string; data: string | null } | null;
const dmBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Última situação atual NUMÉRICA: checkout ENVIADO (até a competência) ou árvore de KPIs, valendo a mais recente. Texto livre é ignorado. */
export function situacaoNumerica(indicador_id: string, arvore: ArvoreSit, checkouts: CheckoutReg[], competencia: string | null) {
  let ck: { valor: number; fonte: string; data: string } | null = null;
  const enviados = checkouts.filter((r) => r.status === "enviado" && (!competencia || competenciaDaSemana(r.semana) <= competencia)).sort((a, b) => b.semana.localeCompare(a.semana));
  for (const r of enviados) {
    const k = normalizarCheckout(r.conteudo).kpis_resposta.find((x) => x.indicador_id === indicador_id && x.situacao_atual?.trim() && numeroBr(x.situacao_atual) != null);
    if (k) { ck = { valor: numeroBr(k.situacao_atual!)!, fonte: `checkout de ${dmBr(r.semana)}`, data: r.enviado_em ?? r.semana }; break; }
  }
  const nArv = arvore?.valor?.trim() ? numeroBr(arvore.valor) : null;
  const av = nArv != null ? { valor: nArv, fonte: "Árvore de KPIs", data: arvore!.data ?? "" } : null;
  if (!ck) return av; if (!av) return ck;
  return (av.data || "") > ck.data ? av : ck;
}

export type EntradaKpiBsc = Omit<EntradaBsc, "situacao"> & { indicador_id: string };
/** Apontamento: (1) realizado lançado no mês; (2) situação numérica mais recente. Devolve a origem quando vem da situação. */
export function avaliarKpiBsc(e: EntradaKpiBsc, arvore: ArvoreSit, checkouts: CheckoutReg[], hoje = new Date()): { aval: Avaliacao; origem: string | null } {
  const sit = e.realizado == null ? situacaoNumerica(e.indicador_id, arvore, checkouts, e.competencia) : null;
  const aval = avaliarBsc({ ...e, realizado: e.realizado ?? sit?.valor ?? null }, hoje);
  const origem = sit && (aval === "on" || aval === "off") ? `pela situação apontada no ${sit.fonte === "Árvore de KPIs" ? "Árvore de KPIs" : sit.fonte}` : null;
  return { aval, origem: origem?.replace("no Árvore", "na Árvore") ?? null };
}

/** Mapa nome do KPI → situação atual, a partir do conteúdo editável da árvore (ou Rev.02). */
export function mapaArvore(valor: any[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const o of valor ?? []) for (const k of o.kpis ?? []) if (k.situacaoAtual) m[String(k.kpi).trim()] = k.situacaoAtual;
  return m;
}
