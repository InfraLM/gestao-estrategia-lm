export type DocumentoConteudo = 'diagnostico' | 'estrategia';
export type RevisaoItemStatus = 'pendente' | 'aprovado' | 'aprovado_ajuste' | 'rejeitado';
export type Revisao = { id: string; documento: DocumentoConteudo; numero: number; titulo: string; fonte: string | null; resumo_mudancas: string | null; status: 'rascunho' | 'publicada' | 'substituida'; snapshot: Record<string, any>; criado_em: string; publicado_em: string | null; publicado_por_nome: string | null; substituido_em: string | null };
export type RevisaoItem = { id: string; revisao_id: string; chave: string; secao: string; valor_anterior: any; valor_proposto: any; valor_final: any; justificativa: string | null; referencias: string | null; origem: string; observacao: string | null; status: RevisaoItemStatus; motivo_rejeicao: string | null; decidido_por_nome: string | null; decidido_em: string | null };
export const NOMES_CONTEUDO: Record<string, string> = {
  'diag.proposito': 'Diagnóstico · Propósito, BHAG e Valores', 'diag.pestel': 'Diagnóstico · PESTEL', 'diag.porter': 'Diagnóstico · 5 Forças',
  'diag.rbv': 'Diagnóstico · RBV/VRIN', 'diag.swot': 'Diagnóstico · SWOT', 'diag.ansoff': 'Diagnóstico · Ansoff', 'diag.errc': 'Diagnóstico · Oceano Azul', 'diag.saidas': 'Diagnóstico · Principais Saídas e Síntese',
  'estr.tese': 'Estratégia · Tese', 'estr.ambicao': 'Estratégia · Ambição', 'estr.pilares': 'Estratégia · Pilares não-negociáveis', 'estr.waves': 'Estratégia · Waves de Priorização',
  'estr.icp': 'Estratégia · ICP', 'estr.playtowin': 'Estratégia · Play to Win', 'estr.ansoff': 'Estratégia · Ansoff', 'estr.errc': 'Estratégia · Oceano Azul',
  'estr.vrin': 'Estratégia · VRIN', 'estr.swot': 'Estratégia · SWOT', 'estr.hipoteses': 'Estratégia · Hipóteses TOWS',
  'bsc.rev02': 'BSC Rev.02 · Objetivos e KPIs', 'estr.okrs-semestrais': 'OKRs Semestrais',
};
export function documentoDaChave(chave: string): DocumentoConteudo | null {
  if (chave.startsWith('diag.')) return 'diagnostico';
  if (chave.startsWith('estr.') && !chave.includes('okr')) return 'estrategia';
  return null;
}
export function valoresRevisao(revisao: Revisao, itens: RevisaoItem[]): Record<string, any> {
  if (revisao.status !== 'rascunho') return revisao.snapshot;
  return { ...revisao.snapshot, ...Object.fromEntries(itens.filter(i => i.status !== 'rejeitado').map(i => [i.chave, i.status === 'aprovado_ajuste' ? i.valor_final : i.valor_proposto])) };
}
export function podePublicar(itens: RevisaoItem[]) { return itens.length > 0 && itens.every(i => i.status !== 'pendente'); }
export function jsonLinhas(value: any): string[] { return JSON.stringify(value, null, 2)?.split('\n') ?? []; }
export function diffJson(anterior: any, proposto: any) {
  const a = jsonLinhas(anterior), b = jsonLinhas(proposto);
  return { anterior: a.map(texto => ({ texto, removido: !b.includes(texto) })), proposto: b.map(texto => ({ texto, adicionado: !a.includes(texto) })) };
}