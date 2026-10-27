/** Avaliação dos KPIs de BSC (fora da nota): On track / Off track só depois do fim do mês ou do período da meta. Calculada na leitura, nunca gravada. */
import { fimSemestre } from './analiseMetas';
import { previstoNoMes, type CalendarioKpi } from '@/lib/frequenciaApontamento';
export type MetaLida = { tipo: "valor"; v: number; sentido?: "maior" | "menor" } | { tipo: "faixa"; min: number; max: number };
export type Avaliacao = "on" | "off" | "acomp" | "sem_meta" | "pendente" | "encerrada";
export const AVALIACAO_LBL: Record<Avaliacao, string> = { on: "On track", off: "Off track", acomp: "Em acompanhamento", sem_meta: "Sem meta registrada", pendente: "Pendente de apontamento", encerrada: "Encerrada" };
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
  const n = (a: Avaliacao) => lista.filter((x) => x === a).length;
  return { on: n("on"), off: n("off"), acomp: n("acomp"), sem_meta: n("sem_meta"), pendente: n("pendente"), encerrada: n("encerrada") };
}

// ---- Regra única (formulário de checkout, Painel de Metas e Visão semanal) ----
import { normalizarCheckout, competenciaDaSemana } from "@/lib/rotinaSemanal";

export type CheckoutReg = { semana: string; status: string; enviado_em: string | null; conteudo: any };
export type ArvoreSit = { valor: string; data: string | null } | null;
const dmBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Última situação atual NUMÉRICA: checkout ENVIADO (até a competência) ou árvore de KPIs, valendo a mais recente. Texto livre é ignorado. */
export function situacaoNumerica(indicador_id: string, arvore: ArvoreSit, checkouts: CheckoutReg[], competencia: string | null) {
  let ck: { valor: number; fonte: string; data: string } | null = null;
  const enviados = checkouts.filter((r) => r.status === "enviado" && (!competencia || (r.conteudo?.kpis_resposta?.find((k:any)=>k.indicador_id===indicador_id)?.periodo_apontado ?? competenciaDaSemana(r.semana)) <= competencia)).sort((a, b) => b.semana.localeCompare(a.semana));
  for (const r of enviados) {
    const k = normalizarCheckout(r.conteudo).kpis_resposta.find((x) => x.indicador_id === indicador_id && x.situacao_atual?.trim() && numeroBr(x.situacao_atual) != null);
    if (k) { ck = { valor: numeroBr(k.situacao_atual!)!, fonte: `checkout de ${dmBr(r.semana)}`, data: r.enviado_em ?? r.semana }; break; }
  }
  const nArv = arvore?.valor?.trim() ? numeroBr(arvore.valor) : null;
  const av = nArv != null ? { valor: nArv, fonte: "Árvore de KPIs", data: arvore!.data ?? "" } : null;
  if (!ck) return av; if (!av) return ck;
  return (av.data || "") > ck.data ? av : ck;
}

export type EntradaKpiBsc = Omit<EntradaBsc, "situacao"> & CalendarioKpi & { indicador_id: string; fora_calendario?: boolean; origem?:string; analise_configurada_em?:string|null; tolerancia?:number|null };
/** Apontamento: (1) realizado lançado no mês; (2) situação numérica mais recente. Devolve a origem quando vem da situação. */
export function avaliarKpiBsc(e: EntradaKpiBsc, arvore: ArvoreSit, checkouts: CheckoutReg[], hoje = new Date()): { aval: Avaliacao; origem: string | null } {
  const sit = e.realizado == null ? situacaoNumerica(e.indicador_id, arvore, checkouts, e.competencia) : null;
  const fora = e.fora_calendario ?? (!!e.competencia && !!e.frequencia && !previstoNoMes(e,e.competencia));
  const valor = e.realizado ?? sit?.valor ?? null;
  const tolerancia=e.origem!=="bsc"&&e.analise_configurada_em?Number(e.tolerancia??0):0;
  const meta = lerMeta(e.meta_mes ?? e.meta_semestre ?? e.meta_texto);
  const mensalAjustada=e.meta_mes==null?null:e.meta_mes+(e.sentido==='menor'?tolerancia:-tolerancia);
  const aval = fora ? (valor!=null && meta ? (cumpre(valor,meta.tipo==='valor'?{...meta,v:meta.v+(e.sentido==='menor'?tolerancia:-tolerancia)}:meta,e.sentido)?'on':'off') : 'acomp') : avaliarBsc({ ...e, meta_mes:mensalAjustada, realizado: valor }, hoje);
  const origem = sit && (aval === "on" || aval === "off") ? `pela situação apontada no ${sit.fonte === "Árvore de KPIs" ? "Árvore de KPIs" : sit.fonte}` : null;
  return { aval, origem: origem?.replace("no Árvore", "na Árvore") ?? null };
}

/** Mapa nome do KPI → situação atual, a partir do conteúdo editável da árvore (ou Rev.02). */
export function mapaArvore(valor: any[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const o of valor ?? []) for (const k of o.kpis ?? []) if (k.situacaoAtual) m[String(k.kpi).trim()] = k.situacaoAtual;
  return m;
}

// ---- Tipo de apontamento (V = valor mensal, S = meta do período, E = entrega) ----
export type TipoApontamento = "valor_mensal" | "valor_periodo" | "entrega";
export const TIPO_LBL: Record<TipoApontamento, string> = { valor_mensal: "Valor mensal", valor_periodo: "Meta semestral/anual", entrega: "Entrega" };
export type StatusEntrega = "nao_iniciada" | "em_implantacao" | "implantada" | "atrasada" | "cancelada";
export const STATUS_ENTREGA_LBL: Record<StatusEntrega, string> = { nao_iniciada: "Não iniciada", em_implantacao: "Em implantação", implantada: "Implantada", atrasada: "Atrasada", cancelada: "Cancelada" };
export type Fonte = "calculado" | "declarado" | "entrega";
export type Apontamento = { analise_snapshot?:any; declaracao?: "on" | "off" | null; justificativa?: string | null; status_entrega?: StatusEntrega | null; avanco_pct?: number | null; data: string; origem: string };

/** Apontamento mais recente (declaração ou status) entre o lançamento do mês e os checkouts ENVIADOS da competência. */
export function apontamentoMaisRecente(indicador_id: string, competencia: string | null,
  lanc: { declaracao?: string | null; justificativa?: string | null; status_entrega?: string | null; avanco_pct?: number | null; updated_at?: string | null; analise_snapshot?:any } | null,
  checkouts: CheckoutReg[]): Apontamento | null {
  const cand: Apontamento[] = [];
  if (lanc && (lanc.declaracao || lanc.status_entrega)) cand.push({ analise_snapshot:lanc.analise_snapshot, declaracao: (lanc.declaracao as any) ?? null, justificativa: lanc.justificativa ?? null, status_entrega: (lanc.status_entrega as any) ?? null, avanco_pct: lanc.avanco_pct ?? null, data: lanc.updated_at ?? "", origem: "Lançar mês" });
  for (const r of checkouts) {
    if (r.status !== "enviado") continue;
    const k = (r.conteudo?.kpis_resposta ?? []).find((x: any) => x.indicador_id === indicador_id && (x.declaracao || x.status_entrega));
    if (competencia && (k?.periodo_apontado ?? competenciaDaSemana(r.semana)) !== competencia) continue;
    if (k) cand.push({ declaracao: k.declaracao ?? null, justificativa: k.justificativa ?? null, status_entrega: k.status_entrega ?? null, avanco_pct: k.avanco_pct != null && k.avanco_pct !== "" ? Number(k.avanco_pct) : null, data: r.enviado_em ?? r.semana, origem: `checkout de ${dmBr(r.semana)}` });
  }
  return cand.sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;
}

/** Farol de entrega (regra simples): Implantada = On; Cancelada = Encerrada; Atrasada ou prazo vencido sem Implantada = Off; no prazo = acompanhamento. */
export function farolEntrega(status: StatusEntrega | null | undefined, prazo: string | null, hoje = new Date(), implantadaEm?:string|null): Avaliacao {
  if (status === "cancelada") return "encerrada";
  if (status === "implantada") return prazo&&implantadaEm&&implantadaEm.slice(0,10)>prazo?"off":"on";
  if (status === "atrasada") return "off";
  if (prazo && hojeIso(hoje) > prazo) return "off";
  return status ? "acomp" : "pendente";
}

export type EntradaTipo = EntradaKpiBsc & { tipo?: TipoApontamento | null; prazo_entrega?: string | null; apontamento?: Apontamento | null };
export type ResultadoTipo = { aval: Avaliacao; origem: string | null; fonte: Fonte };

/** Regra única por tipo. V: automático após o fim do mês. S: declaração do diretor no mês; automático só no fim do período. E: status × prazo. */
export function avaliarPorTipo(e: EntradaTipo, arvore: ArvoreSit, checkouts: CheckoutReg[], hoje = new Date()): ResultadoTipo {
  const tipo = e.tipo ?? "valor_mensal";
  const fora = e.fora_calendario ?? (!!e.competencia && !!e.frequencia && !previstoNoMes(e,e.competencia));
  const h = hojeIso(hoje);
  const mesFechado = !!e.competencia && h > fimDoMes(e.competencia);
  const ap = e.apontamento ?? null;
  if (tipo === "entrega") {
    const aval = farolEntrega(ap?.status_entrega ?? null, e.prazo_entrega ?? null, hoje,e.analise_configurada_em&&e.origem!=='bsc'?ap?.data:null);
    return { aval: aval === "pendente" && (!mesFechado || fora) ? "acomp" : aval, origem: ap?.status_entrega ? `status de entrega · ${ap.origem}` : null, fonte: "entrega" };
  }
  if (tipo === "valor_periodo") {
    const final=e.origem!=='bsc'&&e.analise_configurada_em&&e.competencia?fimSemestre(e.competencia):FIM_PERIODO;
    if (h > final) {
      if(e.analise_configurada_em&&e.origem!=='bsc'){const valor=e.realizado??situacaoNumerica(e.indicador_id,arvore,checkouts,e.competencia)?.valor??null;const meta=lerMeta(e.meta_semestre??e.meta_texto);return {aval:!meta?'sem_meta':valor==null?'pendente':cumpre(valor,meta,e.sentido)?'on':'off',origem:null,fonte:'calculado'};}
      const r = avaliarKpiBsc({ ...e, meta_mes: null }, arvore, checkouts, hoje);
      return { ...r, aval: r.aval === "acomp" ? "pendente" : r.aval, fonte: "calculado" };
    }
    if (ap?.declaracao) return { aval: ap.declaracao, origem: `declarado pelo diretor · ${ap.origem}`, fonte: "declarado" };
    return { aval: mesFechado && !fora ? "pendente" : "acomp", origem: null, fonte: "declarado" };
  }
  const r = avaliarKpiBsc(e, arvore, checkouts, hoje);
  return { ...r, aval: r.aval === "acomp" && mesFechado && !fora ? "pendente" : r.aval, fonte: "calculado" };
}
