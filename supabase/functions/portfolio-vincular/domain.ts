export const LIMITE = 20;
export const LOTE = 5;
export type Alvo = { id: string; tipo: 'objetivo' | 'indicador'; codigo: string; nome: string; origem?: string; okr_id?: string | null };
export type Fonte = { id: string; fonte_tipo: 'projeto' | 'iniciativa'; codigo?: string; nome: string; texto: string; objetivos?: string[]; krs?: string[]; indicador_id?: string | null; objetivo_id?: string | null; okr_id?: string | null };
export type Proposta = { tipo: string; ref_id: string; origem: 'legado' | 'ia'; justificativa: string; confianca: 'alta' | 'media' | 'baixa' | null; status: 'proposto' };
const norm = (s: string) => s.trim().toLowerCase();
export function legado(f: Fonte, alvos: Alvo[], existentes: { tipo: string; ref_id: string }[]): Proposta[] {
 const ids = new Set([f.indicador_id,f.objetivo_id].filter(Boolean));
 const cods = new Set([...(f.objetivos ?? []),...(f.krs ?? [])].map(norm));
 return alvos.filter(a => ids.has(a.id) || cods.has(norm(a.codigo)) || existentes.some(v => v.ref_id === a.id && v.tipo === a.tipo)).map(a => ({tipo:a.tipo,ref_id:a.id,origem:'legado',justificativa:'Vínculo existente ou referência legada do cadastro.',confianca:null,status:'proposto'}));
}
export function propostasIa(saida: { fonte: string; alvo: string; justificativa: string; confianca: 'alta' | 'media' | 'baixa' }[], fontes: Fonte[], alvos: Alvo[], validados: Set<string>): Map<string, Proposta[]> {
 const out = new Map<string,Proposta[]>();
 for (const p of saida) {
  const f = fontes.find(f => `${f.fonte_tipo}:${f.id}` === p.fonte); const a = alvos.find(a => `${a.tipo}:${a.id}` === p.alvo);
  if (!f || !a || validados.has(p.fonte) || !p.justificativa.trim()) continue;
  const l = out.get(p.fonte) ?? [];
  if(l.length >= 4 || l.some(v => v.tipo === a.tipo && v.ref_id === a.id)) continue;
  l.push({tipo:a.tipo,ref_id:a.id,origem:'ia',justificativa:p.justificativa.slice(0,1000),confianca:p.confianca,status:'proposto'}); out.set(p.fonte,l);
 }
 return out;
}
// Only explicit public project fields; SR/BC content requires the principal chair or Governança/CEO.
export function textoSeguroProjeto(p: Record<string,unknown>, detalhesPermitidos: boolean, reports: Record<string,unknown>[], bcs: Record<string,unknown>[]) {
 const base = { nome:p.nome,descricao:p.descricao };
 return JSON.stringify(detalhesPermitidos ? {...base,statusReports:reports.map(r => ({competencia:r.competencia,avancos:r.avancos,entregas:r.entregas})),businessCase:bcs.map(b=>({problema:b.problema_descricao,acao:b.hipotese_acao,resultado:b.hipotese_resultado,criterio:b.criterio_sucesso}))} : base).slice(0,16000);
}
export type ObjetivoRevisao = { objetivo: Alvo; impacto: 'principal'|'secundario'; justificativa: string; confianca: 'alta'|'media'|'baixa'; indicadores: Alvo[] };
/** Review: 1–4 distinct objectives, exactly one principal; KPIs/KRs/cesta only when they belong to the chosen objective. */
export function propostasRevisao(objs: { objetivo?: Alvo; impacto: string; justificativa: string; confianca: 'alta'|'media'|'baixa'; indicadores: (Alvo|undefined)[] }[], existentes: { id: string; tipo: string; ref_id: string }[], revisarIa: { id?: string; justificativa: string }[]) {
 const vistos = new Set<string>(); const lista: ObjetivoRevisao[] = [];
 for (const o of objs) {
  if (!o.objetivo || o.objetivo.tipo !== 'objetivo' || vistos.has(o.objetivo.id) || !o.justificativa.trim() || lista.length >= 4) continue;
  vistos.add(o.objetivo.id);
  lista.push({ objetivo: o.objetivo, impacto: 'secundario', justificativa: o.justificativa.slice(0, 1000), confianca: o.confianca, indicadores: o.indicadores.filter((i): i is Alvo => !!i && i.tipo === 'indicador' && (i as any).objetivo_id === o.objetivo!.id).slice(0, 3) });
 }
 const p = objs.findIndex(o => o.impacto === 'principal' && lista.some(l => l.objetivo.id === o.objetivo?.id));
 const principalId = p >= 0 ? objs[p].objetivo!.id : lista[0]?.objetivo.id;
 for (const l of lista) if (l.objetivo.id === principalId) l.impacto = 'principal';
 const novos = lista.flatMap(l => [{ tipo: 'objetivo', ref_id: l.objetivo.id, impacto: l.impacto, justificativa: l.justificativa, confianca: l.confianca }, ...l.indicadores.map(i => ({ tipo: 'indicador', ref_id: i.id, impacto: l.impacto, justificativa: `${l.justificativa} (via ${l.objetivo.codigo})`.slice(0, 1000), confianca: l.confianca }))]);
 const sustentados = new Set(novos.map(n => `${n.tipo}:${n.ref_id}`));
 const revisar = revisarIa.filter(r => r.id && existentes.some(e => e.id === r.id && !sustentados.has(`${e.tipo}:${e.ref_id}`)) && r.justificativa.trim()).map(r => ({ id: r.id!, justificativa: r.justificativa.slice(0, 1000) }));
 return { novos, revisar };
}
