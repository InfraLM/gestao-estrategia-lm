export const LIMITE_GERACAO = 20;
export const TAMANHO_LOTE = 10;
export type Fonte = { chave: string; origem_tipo: 'acao' | 'decisao'; origem_id: string; codigo: string; titulo: string; texto: string; comite: string };
export type Alvo = { id: string; tipo: 'objetivo' | 'indicador'; codigo: string; nome: string; perspectiva: string; origem: string };
export type SugestaoAnterior = { origem_tipo: string; origem_id: string; tipo: string; ref_id: string; status: string };
export type Proposta = { fonte: string; alvo: string; justificativa: string; trecho: string; confianca: 'alta' | 'media' | 'baixa' };

export function validarPropostas(propostas: Proposta[], fontes: Fonte[], alvos: Alvo[], anteriores: SugestaoAnterior[], novamente: boolean) {
  const contagem = new Map<string, number>();
  const vistas = new Set<string>();
  return propostas.flatMap(p => {
    const f = fontes.find(f => f.chave === p.fonte);
    const a = alvos.find(a => `${a.tipo}:${a.id}` === p.alvo);
    if (!f || !a || !p.trecho.trim() || !f.texto.includes(p.trecho) || !p.justificativa.trim()) return [];
    const anterior = anteriores.find(s => s.origem_tipo === f.origem_tipo && s.origem_id === f.origem_id && s.tipo === a.tipo && s.ref_id === a.id);
    if (anterior && !(novamente && anterior.status === 'rejeitada')) return [];
    const chave = `${f.chave}:${p.alvo}`;
    if (vistas.has(chave) || (contagem.get(f.chave) ?? 0) >= 3) return [];
    vistas.add(chave); contagem.set(f.chave, (contagem.get(f.chave) ?? 0) + 1);
    return [{ origem_tipo: f.origem_tipo, origem_id: f.origem_id, tipo: a.tipo, ref_id: a.id, justificativa: p.justificativa.slice(0, 1000), trecho: p.trecho.slice(0, 1000), confianca: p.confianca, status: 'pendente' as const }];
  });
}