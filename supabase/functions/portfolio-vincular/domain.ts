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
