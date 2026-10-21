/** Regras puras do formulário semanal (check-in / checkout). Lê registros antigos (sem `v`) sem perder dados. */
import type { PrioridadeSemanal } from "@/lib/governancaPendencias";

export type Responsavel = { tipo: "" | "eu" | "cadeira" | "externo"; cadeira_id?: string; nome?: string; email?: string; contato_id?: string };
export type Prioridade = PrioridadeSemanal & { id: string; prazo: string; responsavel: Responsavel };
export type CheckinV2 = { v: 2; prioridades: Prioridade[]; riscos: string; apoio: string; confianca: number };
export type Entrega = {
  titulo: string; status: "entregue" | "parcial" | "nao_entregue" | ""; motivo: string; iniciativa_id?: string; novo_status_ini?: string;
  gov_acao_id?: string; gov_comite_codigo?: string; prioridade_id?: string; responsavel?: Responsavel; herdada_de?: string;
};
export type KpiRetrato = {
  indicador_id: string; codigo: string; nome: string; origem: "bsc" | "okr" | "cesta"; peso: number; unidade: string | null;
  competencia: string | null; meta_mes: number | null; realizado: number | null; atingimento: number | null; faixa: string | null; congelado_em: string;
  sentido?: "maior" | "menor"; nivel?: string | null; meta_semestre?: number | null; meta_texto?: string | null;
};
export type KpiResposta = {
  indicador_id: string; ok: boolean | null; impacto: string; plano: string; vira_iniciativa: boolean; prazo: string;
  responsavel: Responsavel; status_ini: string; reaproveitar: "" | "sim" | "nova"; iniciativa_alvo_id?: string; iniciativa_criada_id?: string;
  situacao_atual?: string;
};
export type KpiLegado = { indicador_id: string; valor: string; situacao: string; comentario: string };
export type CheckoutV2 = {
  v: 2; entregas: Entrega[]; extras: string; aprendizados: string; proxima: string; ritmo: number;
  kpis?: KpiLegado[]; kpis_retrato?: KpiRetrato[]; kpis_resposta: KpiResposta[]; envio_token?: string; primeiro_envio_em?: string;
};

export const LIMITE_TEXTO = 4000;
export const novoId = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
const respVazio = (): Responsavel => ({ tipo: "" });

export function normalizarResponsavel(r: any): Responsavel {
  if (!r || typeof r !== "object") return respVazio();
  if (r.tipo === "eu") return { tipo: "eu" };
  if (r.tipo === "cadeira") return { tipo: "cadeira", cadeira_id: r.cadeira_id ?? "" };
  if (r.tipo === "externo") return { tipo: "externo", nome: r.nome ?? "", email: r.email ?? "", contato_id: r.contato_id };
  return respVazio();
}

export function normalizarCheckin(c: any): CheckinV2 {
  const pri = Array.isArray(c?.prioridades) ? c.prioridades : [];
  return {
    v: 2,
    prioridades: (pri.length ? pri : [{}]).map((p: any, i: number) => ({
      ...p, id: p.id || `legado-${i}-${p.titulo ?? ""}`, titulo: p.titulo ?? "", iniciativa_id: p.iniciativa_id ?? "", resultado: p.resultado ?? "",
      prazo: p.prazo ?? "", responsavel: normalizarResponsavel(p.responsavel),
    })),
    riscos: c?.riscos ?? "", apoio: c?.apoio ?? "", confianca: c?.confianca ?? 3,
  };
}

export function normalizarCheckout(c: any): CheckoutV2 {
  return {
    v: 2,
    entregas: (Array.isArray(c?.entregas) ? c.entregas : []).map((e: any) => ({ ...e, titulo: e.titulo ?? "", status: e.status ?? "", motivo: e.motivo ?? "", responsavel: normalizarResponsavel(e.responsavel) })),
    extras: c?.extras ?? "", aprendizados: c?.aprendizados ?? "", proxima: c?.proxima ?? "", ritmo: c?.ritmo ?? 3,
    kpis: Array.isArray(c?.kpis) ? c.kpis : [],
    kpis_retrato: Array.isArray(c?.kpis_retrato) ? c.kpis_retrato : undefined,
    kpis_resposta: Array.isArray(c?.kpis_resposta) ? c.kpis_resposta.map((k: any) => ({ ...respostaVazia(k.indicador_id), ...k, responsavel: normalizarResponsavel(k.responsavel) })) : [],
    envio_token: c?.envio_token, primeiro_envio_em: c?.primeiro_envio_em,
  };
}

export function respostaVazia(indicador_id: string, sem = ""): KpiResposta {
  return { indicador_id, ok: null, impacto: "", plano: "", vira_iniciativa: false, prazo: sem ? addDias(sem, 4) : "", responsavel: { tipo: "eu" }, status_ini: "em_andamento", reaproveitar: "" };
}

/** Prioridades do check-in → entregas do checkout, levando id e responsável. */
export function entregasDePrioridades(p: Prioridade[]): Entrega[] {
  return p.filter((x) => x.titulo.trim()).map((x) => ({
    titulo: x.titulo, status: "", motivo: "", iniciativa_id: x.iniciativa_id, prioridade_id: x.id, responsavel: x.responsavel,
    ...(x.gov_acao_id ? { gov_acao_id: x.gov_acao_id, gov_comite_codigo: x.gov_comite_codigo } : {}),
  }));
}

/** Remove o e-mail (vai para tabela própria, protegida) antes de gravar no JSON da semana. */
export function semEmail<T>(x: T): T {
  return JSON.parse(JSON.stringify(x, (k, v) => (k === "email" ? undefined : v)));
}

// ---------- KPIs ----------
type IndLista = { id: string; cadeira_id: string | null; status: string; origem: string; parent_id: string | null };
/** Responsável único da cadeira: BSC + KRs + toda a cesta (inclusive peso 0), ativos, sem componentes. */
export function kpisDaCadeira<T extends IndLista>(inds: T[], cadeira: string): T[] {
  return inds.filter((i) => i.cadeira_id === cadeira && i.status === "ativo" && !i.parent_id && ["bsc", "okr", "cesta"].includes(i.origem));
}

export function atingir(real: number | null, meta: number | null, sentido: "maior" | "menor") {
  if (real == null || meta == null || meta === 0) return null;
  if (sentido === "maior") return real / meta;
  return real === 0 ? null : meta / real;
}
type Faixa = { nome: string; min: number };
export function faixaDe(at: number | null, faixas: Faixa[] | undefined) {
  if (at == null || !faixas?.length) return null;
  return [...faixas].sort((a, b) => b.min - a.min).find((f) => at * 100 >= f.min)?.nome ?? null;
}
export const NO_ALVO = ["No alvo", "Superado"];

export function montarRetrato(base: any[], competencia: string | null, faixas: Faixa[] | undefined, agora = new Date().toISOString()): KpiRetrato[] {
  return base.map((b) => {
    const at = competencia ? atingir(b.realizado ?? null, b.meta_mes ?? null, b.sentido) : null;
    return {
      indicador_id: b.indicador_id, codigo: b.codigo, nome: b.nome, origem: b.origem, peso: Number(b.peso ?? 0), unidade: b.unidade ?? null,
      competencia, meta_mes: competencia ? b.meta_mes ?? null : null, realizado: competencia ? b.realizado ?? null : null,
      atingimento: b.origem === "bsc" ? null : at, faixa: b.origem === "bsc" ? null : faixaDe(at, faixas), congelado_em: agora,
      sentido: b.sentido, nivel: b.nivel ?? null, meta_semestre: b.meta_semestre ?? null, meta_texto: b.meta_texto ?? null,
    };
  });
}

/** Atalho: marca Sim nos KPIs no alvo/superados ainda sem resposta. */
export function confirmarNoAlvo(ret: KpiRetrato[], resp: KpiResposta[], sem: string): KpiResposta[] {
  const alvo = ret.filter((k) => k.faixa && NO_ALVO.includes(k.faixa)).map((k) => k.indicador_id);
  const out = [...resp];
  for (const id of alvo) {
    const i = out.findIndex((r) => r.indicador_id === id);
    if (i < 0) out.push({ ...respostaVazia(id, sem), ok: true });
    else if (out[i].ok == null) out[i] = { ...out[i], ok: true };
  }
  return out;
}
/** Clicar na opção já marcada desmarca. */
export const alternar = (atual: boolean | null, clicado: boolean) => (atual === clicado ? null : clicado);

// ---------- Prioridades herdadas ----------
type Row = { semana: string; tipo: string; conteudo: any };
/** Prioridades de semanas anteriores ainda não entregues (nem no checkout da própria semana, nem depois). */
export function prioridadesHerdadas(rows: Row[], sem: string): Entrega[] {
  const ant = rows.filter((r) => r.semana < sem);
  const entregues = new Set<string>();
  for (const r of ant.filter((r) => r.tipo === "checkout")) {
    for (const e of normalizarCheckout(r.conteudo).entregas) if (e.status === "entregue") entregues.add(chave(e.herdada_de ?? r.semana, e));
  }
  const out: Entrega[] = [];
  for (const r of ant.filter((r) => r.tipo === "checkin").sort((a, b) => a.semana.localeCompare(b.semana))) {
    for (const e of entregasDePrioridades(normalizarCheckin(r.conteudo).prioridades)) {
      if (!entregues.has(chave(r.semana, e))) out.push({ ...e, herdada_de: r.semana });
    }
  }
  return out;
}
const chave = (semana: string, e: Pick<Entrega, "prioridade_id" | "titulo">) => `${semana}|${e.prioridade_id || e.titulo}`;

/** Junta herdadas às entregas atuais sem duplicar. */
export function mesclarHerdadas(atuais: Entrega[], herdadas: Entrega[]): Entrega[] {
  const tem = new Set(atuais.filter((e) => e.herdada_de).map((e) => chave(e.herdada_de!, e)));
  return [...atuais, ...herdadas.filter((h) => !tem.has(chave(h.herdada_de!, h)))];
}

// ---------- Responsável ----------
export function responsavelOk(r: Responsavel | undefined) {
  if (!r || !r.tipo || r.tipo === "eu") return true;
  if (r.tipo === "cadeira") return !!r.cadeira_id && !r.nome && !r.email;
  return !!r.nome?.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email?.trim() ?? "") && !r.cadeira_id;
}

// ---------- Pendências ----------
export type Pendencia = { campo: string; texto: string };
export function pendenciasCheckin(c: CheckinV2): Pendencia[] {
  const p: Pendencia[] = [];
  if (!c.prioridades.some((x) => x.titulo.trim())) p.push({ campo: "pri-0-titulo", texto: "Informe ao menos uma prioridade." });
  c.prioridades.forEach((x, i) => {
    const algo = x.titulo.trim() || x.resultado.trim() || x.prazo;
    if (algo && !x.titulo.trim()) p.push({ campo: `pri-${i}-titulo`, texto: `Prioridade ${i + 1} sem título.` });
    if (x.titulo.trim() && !x.prazo) p.push({ campo: `pri-${i}-prazo`, texto: `Prioridade ${i + 1} sem prazo.` });
    if (!responsavelOk(x.responsavel)) p.push({ campo: `pri-${i}-resp`, texto: `Prioridade ${i + 1}: responsável incompleto.` });
  });
  return p;
}
export function pendenciasCheckout(c: CheckoutV2, reaproveitaveis: Record<string, unknown[]> = {}): Pendencia[] {
  const p: Pendencia[] = [];
  c.entregas.forEach((e, i) => {
    if (e.herdada_de) return;
    if (!e.status) p.push({ campo: `ent-${i}`, texto: `Marque o resultado de "${e.titulo}".` });
    else if (e.status !== "entregue" && !e.motivo.trim()) p.push({ campo: `ent-${i}-motivo`, texto: `Explique o motivo de "${e.titulo}".` });
    if (!responsavelOk(e.responsavel)) p.push({ campo: `ent-${i}-resp`, texto: `"${e.titulo}": responsável incompleto.` });
  });
  for (const k of c.kpis_resposta) {
    if (k.ok !== false || !k.plano.trim() || !k.vira_iniciativa) continue;
    const nome = c.kpis_retrato?.find((r) => r.indicador_id === k.indicador_id)?.codigo ?? "KPI";
    if (!k.prazo) p.push({ campo: `kpi-${k.indicador_id}-prazo`, texto: `${nome}: plano sem prazo.` });
    if (!responsavelOk(k.responsavel)) p.push({ campo: `kpi-${k.indicador_id}-resp`, texto: `${nome}: responsável incompleto.` });
    if ((reaproveitaveis[k.indicador_id]?.length ?? 0) > 0 && !k.reaproveitar && !k.iniciativa_criada_id)
      p.push({ campo: `kpi-${k.indicador_id}-reap`, texto: `${nome}: escolha reaproveitar ou criar outra iniciativa.` });
  }
  return p;
}

// ---------- Datas ----------
export function addDias(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
/** Ciclo S = check-in da semana S + checkout da semana S−7 (segunda a domingo). */
export const semanaCheckout = (ciclo: string) => addDias(ciclo, -7);
/** "Checkout dd/mm a dd/mm · Check-in dd/mm a dd/mm/aa". */
export function periodoSemana(ciclo: string) {
  const co = semanaCheckout(ciclo), fim = addDias(ciclo, 4);
  return `Checkout ${dm(co)} a ${dm(addDias(co, 6))} · Check-in ${dm(ciclo)} a ${dm(fim)}/${fim.slice(2, 4)}`;
}
/** Competência = mês do domingo da semana. */
export const competenciaDaSemana = (semana: string) => addDias(semana, 6).slice(0, 7);
/** Ciclo padrão no horário de São Paulo: de sexta 00h a domingo já abre o ciclo da segunda seguinte. */
export function cicloPadrao(agora = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
    .formatToParts(agora).map((x) => [x.type, x.value]));
  const hoje = `${p.year}-${p.month}-${p.day}`;
  const w = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
  const seg = addDias(hoje, -w);
  return w >= 4 ? addDias(seg, 7) : seg;
}
export const ciclosDisponiveis = (agora = new Date()) => [0, 1, 2, 3, 4, 5, 6].map((n) => addDias(cicloPadrao(agora), -7 * n));

/** Última situação atual: a mais recente entre a árvore de KPIs e o último checkout enviado que apontou o KPI. */
export function ultimaSituacao(indicador_id: string, arvore: { valor: string; data: string | null } | null, checkouts: { semana: string; status: string; enviado_em: string | null; conteudo: any }[], antesDe: string) {
  let ck: { valor: string; fonte: string; data: string } | null = null;
  for (const r of [...checkouts].filter((r) => r.status === "enviado" && r.semana < antesDe).sort((a, b) => b.semana.localeCompare(a.semana))) {
    const k = normalizarCheckout(r.conteudo).kpis_resposta.find((x) => x.indicador_id === indicador_id && x.situacao_atual?.trim());
    if (k) { ck = { valor: k.situacao_atual!.trim(), fonte: `checkout de ${dm(r.semana)}`, data: r.enviado_em ?? r.semana }; break; }
  }
  const av = arvore?.valor?.trim() ? { valor: arvore.valor.trim(), fonte: "Árvore de KPIs", data: arvore.data ?? "" } : null;
  if (!ck) return av; if (!av) return ck;
  return (av.data || "") > ck.data ? av : ck;
}
export function idadeSemanas(criada: string, sem: string) {
  const n = Math.round((new Date(sem + "T12:00").getTime() - new Date(criada + "T12:00").getTime()) / (7 * 864e5));
  return n <= 0 ? "esta semana" : n === 1 ? "há 1 semana" : `há ${n} semanas`;
}
export const riscoAberto = (r: { resolvido_em: string | null; reaberto_em: string | null }) =>
  !r.resolvido_em || (!!r.reaberto_em && r.reaberto_em > r.resolvido_em);
