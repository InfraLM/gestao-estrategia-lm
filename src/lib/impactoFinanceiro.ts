import { lerMeta } from '@/lib/avaliacaoBsc';
export const dinheiro = (n: number | null) => n == null ? 'Sem budget informado' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export type Principal = { objetivo: string | null; validado: boolean; conflito: boolean };
export function principalProjeto(id: string, vs: any[], inds: any[]): Principal {
  const ps = vs.filter(v => v.fonte_tipo === 'projeto' && v.fonte_id === id && v.status !== 'removido' && v.impacto === 'principal');
  const refs = ps.map(v => v.tipo === 'objetivo' ? v.ref_id : inds.find(i => i.id === v.ref_id)?.objetivo_id).filter(Boolean);
  const ids = [...new Set<string>(refs)];
  return { objetivo: ids.length === 1 ? ids[0] : null, validado: ps.length > 0 && ps.every(v => v.status === 'validado'), conflito: ids.length > 1 };
}
export function realizadoProjeto(id: string, centros: any[], espelho: any[], ate: string) {
  const cs = centros.filter(c => c.projeto_id === id && c.status === 'confirmado');
  const nomes = new Set(cs.map(c => c.centro_custo));
  const linhas = espelho.filter(e => nomes.has(e.centro_custo) && e.competencia <= ate);
  const faltantes = cs.filter(c => !linhas.some(e => e.centro_custo === c.centro_custo)).length;
  return { valor: linhas.length ? linhas.reduce((s, e) => s + Number(e.realizado), 0) : null, faltantes, centros: cs.length, ultima: linhas.map(e => e.competencia).sort().at(-1) ?? null };
}
export function financeiroObjetivo(obj: string, projetos: any[], vs: any[], inds: any[], budgets: any[], centros: any[], espelho: any[], ate: string) {
  const ps = projetos.filter(p => principalProjeto(p.id, vs, inds).objetivo === obj);
  let validado = 0, proposto = 0, semBudget = 0, realizado = 0, comRealizado = 0;
  for (const p of ps) {
    const b = budgets.find(b => b.projeto_id === p.id)?.budget_liberado;
    if (b == null) semBudget++; else if (principalProjeto(p.id, vs, inds).validado) validado += Number(b); else proposto += Number(b);
    const r = realizadoProjeto(p.id, centros, espelho, ate); if (r.valor != null) { realizado += r.valor; comRealizado++; }
  }
  const budget = ps.length > semBudget ? validado + proposto : null;
  const real = comRealizado ? realizado : null;
  return { projetos: ps.length, budget, validado, proposto, semBudget, realizado: real, semRealizado: ps.length - comRealizado, pct: budget != null && budget > 0 && real != null ? real / budget * 100 : null };
}
/** Only standalone numeric values or thresholds are comparable; free narratives/dates are not values. */
export function valorEscalar(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(?:R\$\s*)?[<>≤≥=]?\s*(-?[\d.,]+)\s*(%|mi|mil|milh(?:ão|ões)|bilh(?:ão|ões))?$/i);
  if (!m) return null;
  const s = m[1]; const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s);
  const unidade = m[2]?.toLowerCase(); const fator = unidade === 'mil' ? 1000 : unidade === 'mi' || unidade?.startsWith('milh') ? 1e6 : unidade?.startsWith('bilh') ? 1e9 : 1;
  return Number.isFinite(n) ? n * fator : null;
}
export function atingimentoMeta(valor: number | null, meta: unknown, sentido: string) {
  if (valor == null) return null;
  const escalar = valorEscalar(meta);
  const m = escalar == null ? lerMeta(typeof meta === 'string' ? meta : null) : { tipo: 'valor' as const, v: escalar };
  if (!m || m.tipo === 'faixa' || m.v === 0) return null;
  const menor = (m.sentido ?? sentido) === 'menor' || typeof meta === 'string' && /^[<≤]/.test(meta.trim());
  return menor ? valor === 0 ? null : m.v / valor * 100 : valor / m.v * 100;
}
export type LinhaOrc = { centro_custo: string; competencia: string; realizado: number; orcado: number | null };
export function validarPlanilha(rows: Record<string, unknown>[]): LinhaOrc[] {
  if (!rows.length || rows.length > 10000) throw new Error('Informe entre 1 e 10.000 linhas.');
  const seen = new Set<string>();
  return rows.map((r,i) => {
    const centro = String(r.centro_custo ?? '').trim(), comp = String(r.competencia ?? '').trim();
    const realizado = valorEscalar(r.valor_realizado ?? r.realizado), orcado = r.orcado == null || r.orcado === '' ? null : valorEscalar(r.orcado);
    if (!centro || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(comp) || realizado == null || r.orcado != null && r.orcado !== '' && orcado == null) throw new Error(`Linha ${i+2}: centro, competência (AAAA-MM) ou valor inválido.`);
    const key = `${centro}:${comp}`; if (seen.has(key)) throw new Error(`Linha ${i+2}: centro e competência duplicados.`); seen.add(key);
    return { centro_custo: centro, competencia: comp, realizado, orcado };
  });
}