type Reg = Record<string, unknown>;
const txt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const dia = (v: unknown) => { const t = txt(v); return t && /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : null; };
const uuid = (v: unknown) => { const t = txt(v); return t && /^[0-9a-f-]{36}$/i.test(t) ? t : null; };

/** Sem acento, minúsculas, espaços colapsados. */
export function normalizarNome(nome: unknown): string | null {
  const t = txt(nome);
  if (!t) return null;
  const n = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  return n || null;
}

export function mapearAcao(a: Reg) {
  const id = uuid(a.id);
  if (!id) return null;
  return {
    origem_id: id,
    titulo: txt(a.title) ?? "(sem título)",
    descricao: txt(a.description),
    responsavel_origem: txt(a.owner_name),
    responsavel_normalizado: normalizarNome(a.owner_name),
    responsavel_email: txt(a.owner_email)?.toLowerCase() ?? null,
    prazo: dia(a.due_date),
    status: txt(a.status),
    prioridade: txt(a.priority),
    precisa_escalar: typeof a.needs_escalation === "boolean" ? a.needs_escalation : null,
    concluida_em: dia(a.completed_at),
    comite_codigo: txt(a.committee_code),
    comite_nome: txt(a.committee_name),
    reuniao_origem_id: uuid(a.meeting_id),
    reuniao_titulo: txt(a.meeting_title),
    reuniao_data: txt(a.meeting_date),
    origem_created_at: txt(a.created_at),
    origem_updated_at: txt(a.updated_at),
  };
}

export function mapearDeliberacao(d: Reg) {
  const id = uuid(d.meeting_id);
  const indice = typeof d.indice === "number" ? d.indice : Number(d.indice);
  if (!id || !Number.isInteger(indice)) return null;
  return {
    reuniao_origem_id: id, indice,
    titulo: txt(d.title), pauta: txt(d.agenda), racional: txt(d.rationale),
    comite_codigo: txt(d.committee_code), comite_nome: txt(d.committee_name),
    reuniao_titulo: txt(d.meeting_title), reuniao_data: txt(d.meeting_date),
    reuniao_updated_at: txt(d.meeting_updated_at),
  };
}

/** Deduplica por chave mantendo o último (evita erro de upsert com chave repetida no mesmo lote). */
export function dedup<T>(itens: T[], chave: (t: T) => string): T[] {
  const m = new Map<string, T>();
  for (const i of itens) m.set(chave(i), i);
  return [...m.values()];
}

/** Quantos são novos e quantos já existiam. */
export function contarUpsert(existentes: Set<string>, chaves: string[]) {
  let inseridas = 0, atualizadas = 0;
  for (const k of chaves) existentes.has(k) ? atualizadas++ : inseridas++;
  return { inseridas, atualizadas };
}

/** Nomes de responsável ainda não presentes no de-para (um por nome normalizado). */
export function nomesNovos(acoes: { responsavel_origem: string | null; responsavel_normalizado: string | null }[], jaMapeados: Set<string>) {
  const novos = new Map<string, string>();
  for (const a of acoes) {
    const n = a.responsavel_normalizado;
    if (!n || !a.responsavel_origem || jaMapeados.has(n) || novos.has(n)) continue;
    novos.set(n, a.responsavel_origem);
  }
  return [...novos].map(([nome_normalizado, nome_origem]) => ({ nome_normalizado, nome_origem, situacao: "sem_cadeira" }));
}

export function prepararPayload(payload: Reg) {
  const acoes = dedup((Array.isArray(payload?.acoes) ? payload.acoes as Reg[] : []).map(mapearAcao).filter((x): x is NonNullable<ReturnType<typeof mapearAcao>> => !!x), (a) => a.origem_id);
  const delib = dedup((Array.isArray(payload?.deliberacoes) ? payload.deliberacoes as Reg[] : []).map(mapearDeliberacao).filter((x): x is NonNullable<ReturnType<typeof mapearDeliberacao>> => !!x), (d) => `${d.reuniao_origem_id}|${d.indice}`);
  const exc = payload?.deliberacoes_excluidas;
  return {
    acoes, deliberacoes: delib,
    acoes_recebidas: Array.isArray(payload?.acoes) ? payload.acoes.length : 0,
    deliberacoes_recebidas: Array.isArray(payload?.deliberacoes) ? payload.deliberacoes.length : 0,
    deliberacoes_excluidas: typeof exc === "number" ? exc : 0,
  };
}

export const papelAutorizado = (roles: string[]) => roles.includes("super_admin") || roles.includes("admin");
