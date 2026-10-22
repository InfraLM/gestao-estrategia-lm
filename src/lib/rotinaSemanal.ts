/** Regras puras do formulário semanal (check-in / checkout). Lê registros antigos (sem `v`) sem perder dados. */
import type { PrioridadeSemanal } from "@/lib/governancaPendencias";
import { EntregaExtra, normalizarExtras, errosExtras } from "@/lib/entregasExtras";
import type { CalendarioKpi } from '@/lib/frequenciaApontamento';

export type Responsavel = { tipo: "" | "eu" | "lider" | "cadeira" | "externo"; cadeira_id?: string; nome?: string; email?: string; contato_id?: string; cargo_id?: string };
/** Vínculos múltiplos de uma ação (ids de mt_indicadores / projetos). */
export type Vinculos = { bsc: string[]; kr: string[]; cesta: string[]; projetos: string[] };
export const vinculosVazios = (): Vinculos => ({ bsc: [], kr: [], cesta: [], projetos: [] });
export function normalizarVinculos(v: any): Vinculos {
  const arr = (x: any) => (Array.isArray(x) ? x.filter((y) => typeof y === "string") : []);
  return { bsc: arr(v?.bsc), kr: arr(v?.kr), cesta: arr(v?.cesta), projetos: arr(v?.projetos) };
}
/** Status do diretor numa pendência de ata (vale até a baixa na Governança). */
export type AtaStatus = { gov_acao_id: string; titulo: string; status: "" | "entregue" | "em_andamento" | "nao_entregue"; comentario: string };
export type Prioridade = PrioridadeSemanal & { id: string; prazo: string; responsavel: Responsavel; vinculos?: Vinculos };
export type CheckinV2 = { v: 2; prioridades: Prioridade[]; riscos: string; apoio: string; confianca: number; envio_token?: string; primeiro_envio_em?: string };
export type Entrega = {
  titulo: string; status: "entregue" | "parcial" | "nao_entregue" | ""; motivo: string; iniciativa_id?: string; novo_status_ini?: string;
  gov_acao_id?: string; gov_comite_codigo?: string; prioridade_id?: string; responsavel?: Responsavel; herdada_de?: string; vinculos?: Vinculos;
};
export type KpiRetrato = CalendarioKpi & {
  indicador_id: string; codigo: string; nome: string; origem: "bsc" | "okr" | "cesta"; peso: number; unidade: string | null;
  competencia: string | null; meta_mes: number | null; realizado: number | null; atingimento: number | null; faixa: string | null; congelado_em: string;
  sentido?: "maior" | "menor"; nivel?: string | null; meta_semestre?: number | null; meta_texto?: string | null;
  tipo_apontamento?: "valor_mensal" | "valor_periodo" | "entrega"; prazo_entrega?: string | null;
  periodo_inicio?: string; periodo_fim?: string; periodo_label?: string; desvio_critico?: boolean; desvio_id?: string;
};
export type KpiResposta = {
  indicador_id: string; ok: boolean | null; impacto: string; plano: string; vira_iniciativa: boolean; prazo: string;
  responsavel: Responsavel; status_ini: string; reaproveitar: "" | "sim" | "nova"; iniciativa_alvo_id?: string; iniciativa_criada_id?: string;
  situacao_atual?: string; vinculos?: Vinculos;
  /** Tipo S: declaração do diretor no mês. Tipo E: status de entrega. */
  declaracao?: "on" | "off" | null; justificativa?: string; status_entrega?: "" | "nao_iniciada" | "em_implantacao" | "implantada" | "atrasada" | "cancelada"; avanco_pct?: string; evidencia?: string;
  desvio_critico?: boolean; causa?: string; periodo_apontado?: string;
};
export type KpiLegado = { indicador_id: string; valor: string; situacao: string; comentario: string };
export type CheckoutV2 = {
  v: 2; entregas: Entrega[]; extras: string; extras_lista?: EntregaExtra[]; aprendizados: string; proxima: string; ritmo: number;
  kpis?: KpiLegado[]; kpis_retrato?: KpiRetrato[]; kpis_resposta: KpiResposta[]; envio_token?: string; primeiro_envio_em?: string; atas?: AtaStatus[];
  /** Gravada no primeiro envio: itens obrigatórios preenchidos (taxa de conformidade). */
  completude?: { feitos: number; total: number; faltando: string[] };
};

export const LIMITE_TEXTO = 4000;
export const novoId = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
const respVazio = (): Responsavel => ({ tipo: "" });

export function normalizarResponsavel(r: any): Responsavel {
  if (!r || typeof r !== "object") return respVazio();
  if (r.tipo === "eu") return { tipo: "eu" };
  if (r.tipo === "lider") return { tipo: "lider", nome: r.nome ?? "", cargo_id: r.cargo_id };
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
      prazo: p.prazo ?? "", responsavel: normalizarResponsavel(p.responsavel), vinculos: normalizarVinculos(p.vinculos),
    })),
    riscos: c?.riscos ?? "", apoio: c?.apoio ?? "", confianca: c?.confianca ?? 3,
    envio_token: c?.envio_token, primeiro_envio_em: c?.primeiro_envio_em,
  };
}

export function normalizarCheckout(c: any): CheckoutV2 {
  return {
    v: 2,
    entregas: (Array.isArray(c?.entregas) ? c.entregas : []).map((e: any) => ({ ...e, titulo: e.titulo ?? "", status: e.status ?? "", motivo: e.motivo ?? "", responsavel: normalizarResponsavel(e.responsavel), vinculos: normalizarVinculos(e.vinculos) })),
    extras: c?.extras ?? "", aprendizados: c?.aprendizados ?? "", proxima: c?.proxima ?? "", ritmo: c?.ritmo ?? 3,
    extras_lista: normalizarExtras(c?.extras_lista),
    kpis: Array.isArray(c?.kpis) ? c.kpis : [],
    kpis_retrato: Array.isArray(c?.kpis_retrato) ? c.kpis_retrato : undefined,
    kpis_resposta: Array.isArray(c?.kpis_resposta) ? c.kpis_resposta.map((k: any) => ({ ...respostaVazia(k.indicador_id), ...k, responsavel: normalizarResponsavel(k.responsavel), vinculos: normalizarVinculos(k.vinculos) })) : [],
    envio_token: c?.envio_token, primeiro_envio_em: c?.primeiro_envio_em,
    ...(c?.completude ? { completude: c.completude } : {}),
    atas: Array.isArray(c?.atas) ? c.atas.filter((a: any) => a?.gov_acao_id).map((a: any) => ({ gov_acao_id: a.gov_acao_id, titulo: a.titulo ?? "", status: a.status ?? "", comentario: a.comentario ?? "" })) : [],
  };
}

export function respostaVazia(indicador_id: string, sem = ""): KpiResposta {
  return { indicador_id, ok: null, impacto: "", plano: "", vira_iniciativa: false, prazo: sem ? addDias(sem, 4) : "", responsavel: { tipo: "eu" }, status_ini: "em_andamento", reaproveitar: "" };
}

/** Prioridades do check-in → entregas do checkout, levando id e responsável. */
export function entregasDePrioridades(p: Prioridade[]): Entrega[] {
  return p.filter((x) => x.titulo.trim()).map((x) => ({
    titulo: x.titulo, status: "", motivo: "", iniciativa_id: x.iniciativa_id, prioridade_id: x.id, responsavel: x.responsavel, vinculos: x.vinculos,
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
/** No alvo = KR/cesta de valor mensal com atingimento ≥ 100% (substitui a faixa da régua). */
export const noAlvoKpi = (k: KpiRetrato) => k.origem !== "bsc" && (k.tipo_apontamento ?? "valor_mensal") === "valor_mensal" && k.atingimento != null && k.atingimento >= 1;

export function montarRetrato(base: any[], competencia: string | null, faixas: Faixa[] | undefined, agora = new Date().toISOString()): KpiRetrato[] {
  return base.map((b) => {
    const at = competencia ? atingir(b.realizado ?? null, b.meta_mes ?? null, b.sentido) : null;
    return {
      indicador_id: b.indicador_id, codigo: b.codigo, nome: b.nome, origem: b.origem, peso: Number(b.peso ?? 0), unidade: b.unidade ?? null,
      competencia: b.competencia ?? competencia, meta_mes: (b.competencia ?? competencia) ? b.meta_mes ?? null : null, realizado: (b.competencia ?? competencia) ? b.realizado ?? null : null,
      atingimento: b.origem === "bsc" || (b.tipo_apontamento ?? "valor_mensal") !== "valor_mensal" ? null : at, faixa: null, congelado_em: agora,
      sentido: b.sentido, nivel: b.nivel ?? null, meta_semestre: b.meta_semestre ?? null, meta_texto: b.meta_texto ?? null,
      tipo_apontamento: b.tipo_apontamento ?? "valor_mensal", prazo_entrega: b.prazo_entrega ?? null,
      frequencia: b.frequencia, mes_ciclo: b.mes_ciclo, semana_mes: b.semana_mes, tratamento: b.tratamento, origem_frequencia: b.origem_frequencia,
      periodo_inicio: b.periodo_inicio, periodo_fim: b.periodo_fim, periodo_label: b.periodo_label, desvio_critico: b.desvio_critico, desvio_id: b.desvio_id,
    };
  });
}

/** Atalho: marca Sim nos KPIs no alvo/superados ainda sem resposta. */
export function confirmarNoAlvo(ret: KpiRetrato[], resp: KpiResposta[], sem: string): KpiResposta[] {
  const alvo = ret.filter(noAlvoKpi).map((k) => k.indicador_id);
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
  if (r.tipo === "lider") return !!r.nome?.trim();
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
  const p: Pendencia[] = errosExtras(c.extras_lista ?? []);
  c.entregas.forEach((e, i) => {
    if (e.herdada_de) return;
    if (!e.status) p.push({ campo: `ent-${i}`, texto: `Marque o resultado de "${e.titulo}".` });
    else if (e.status !== "entregue" && !e.motivo.trim()) p.push({ campo: `ent-${i}-motivo`, texto: `Explique o motivo de "${e.titulo}".` });
    if (!responsavelOk(e.responsavel)) p.push({ campo: `ent-${i}-resp`, texto: `"${e.titulo}": responsável incompleto.` });
  });
  for (const k of c.kpis_resposta) {
    if (c.kpis_retrato && !c.kpis_retrato.some(r => r.indicador_id === k.indicador_id)) continue;
    if (k.desvio_critico && (!k.situacao_atual?.trim() || !k.causa?.trim() || !k.impacto?.trim() || !k.plano?.trim()))
      p.push({ campo: `kpi-${k.indicador_id}-desvio`, texto: "Desvio crítico: preencha valor, causa, impacto e ação." });
    const ret = c.kpis_retrato?.find((r) => r.indicador_id === k.indicador_id);
    if (ret?.tipo_apontamento === "valor_periodo" && k.declaracao === "off" && !k.justificativa?.trim())
      p.push({ campo: `kpi-${k.indicador_id}-just`, texto: `${ret.codigo}: justifique o Off track declarado.` });
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

// ---------- Ciclo único (check-in + checkout enviados juntos) ----------
/** Prazo único do ciclo S: segunda da semana S, 23h59 em São Paulo (UTC−3). */
export const prazoCiclo = (ciclo: string) => new Date(`${ciclo}T23:59:59-03:00`);
type RegCiclo = { status?: string; enviado_em?: string | null; conteudo?: any } | null | undefined;
export type SeloCiclo = { estado: "enviado" | "parcial" | "rascunho" | "pendente"; atrasado: boolean; enviado_em: string | null };
/** Um selo por ciclo: check-in de S e checkout de S−7. "Parcial" = ciclos antigos com só um dos dois enviado. */
export function seloCiclo(checkin: RegCiclo, checkout: RegCiclo, ciclo: string, agora = new Date()): SeloCiclo {
  const env = [checkin, checkout].filter((r) => r?.status === "enviado") as NonNullable<RegCiclo>[];
  const prazo = prazoCiclo(ciclo);
  const primeiros = env.map((r) => r.conteudo?.primeiro_envio_em ?? r.enviado_em).filter(Boolean).sort() as string[];
  const ultimo = env.map((r) => r.enviado_em).filter(Boolean).sort().pop() ?? null;
  if (env.length === 2) return { estado: "enviado", atrasado: new Date(primeiros[0]) > prazo, enviado_em: ultimo };
  if (env.length === 1) return { estado: "parcial", atrasado: agora > prazo, enviado_em: ultimo };
  return { estado: checkin || checkout ? "rascunho" : "pendente", atrasado: agora > prazo, enviado_em: null };
}
/** Lembrete no app: a partir de sexta 8h (São Paulo) da abertura do ciclo, até o envio. */
export function lembreteAtivo(ciclo: string, enviado: boolean, agora = new Date()) {
  return !enviado && agora >= new Date(`${addDias(ciclo, -3)}T08:00:00-03:00`);
}

// ---------- Pendências de atas ----------
/** Status registrados pelo diretor no último checkout enviado antes desta semana; carregados até a baixa na Governança. */
export function atasAnteriores(rows: Row[], semana: string): AtaStatus[] {
  const ult = rows.filter((r) => r.tipo === "checkout" && r.semana < semana && (r as any).status === "enviado").sort((a, b) => b.semana.localeCompare(a.semana))[0];
  return ult ? normalizarCheckout(ult.conteudo).atas ?? [] : [];
}
/** Lista empilhada: toda pendência aberta na Governança aparece; "entregue" vai para o fim aguardando baixa. */
export function empilharAtas<T extends { id: string; titulo: string }>(abertas: T[], status: AtaStatus[]): (T & { meu: AtaStatus })[] {
  const m = new Map(status.map((s) => [s.gov_acao_id, s]));
  const out = abertas.map((a) => ({ ...a, meu: m.get(a.id) ?? { gov_acao_id: a.id, titulo: a.titulo, status: "" as const, comentario: "" } }));
  return [...out.filter((a) => a.meu.status !== "entregue"), ...out.filter((a) => a.meu.status === "entregue")];
}

// ---------- Vínculos ----------
type IndV = { id: string; origem: string; objetivo_id: string | null; codigo: string; status?: string; parent_id?: string | null };
/** Projeto do portfólio → objetivos dele sugerem os KPIs de BSC desses objetivos; códigos de KR batem com o código do indicador. */
export function vinculosDoProjeto(proj: { objetivos?: string[] | null; krs?: string[] | null }, inds: IndV[], objetivos: { id: string; codigo: string }[]) {
  const cods = new Set((proj.objetivos ?? []).map((c) => c.trim().toUpperCase()));
  const objIds = new Set(objetivos.filter((o) => cods.has(o.codigo.trim().toUpperCase())).map((o) => o.id));
  const krs = new Set((proj.krs ?? []).map((c) => c.trim().toLowerCase()));
  const ativo = (i: IndV) => (i.status ?? "ativo") === "ativo" && !i.parent_id;
  return {
    bsc: inds.filter((i) => ativo(i) && i.origem === "bsc" && i.objetivo_id && objIds.has(i.objetivo_id)).map((i) => i.id),
    kr: inds.filter((i) => ativo(i) && i.origem === "okr" && krs.has(i.codigo.trim().toLowerCase())).map((i) => i.id),
  };
}
/** Junta sem duplicar. */
export const unir = (a: string[], b: string[]) => [...new Set([...a, ...b])];
/** Lista de vínculos para gravar na iniciativa (o principal continua no campo único). */
export function vinculosParaGravar(v: Vinculos | undefined, principal: string | null) {
  const n = normalizarVinculos(v);
  return [
    ...n.bsc.map((ref_id) => ({ tipo: "bsc", ref_id })), ...n.kr.map((ref_id) => ({ tipo: "kr", ref_id })),
    ...n.cesta.map((ref_id) => ({ tipo: "cesta", ref_id })), ...n.projetos.map((ref_id) => ({ tipo: "projeto", ref_id })),
  ].filter((x) => x.ref_id !== principal);
}
