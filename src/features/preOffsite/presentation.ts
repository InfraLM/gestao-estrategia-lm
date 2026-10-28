import type { Config, Pergunta } from './config';
import { perguntaPara } from './bloco0';

export const PROJETOS_HISTORICOS = [
  { id: 'v311-receita', titulo: 'Receita inteligente' },
  { id: 'v311-caixa', titulo: 'Caixa em tempo real' },
];
export function perguntasVisiveis(c: Config, nome: string, todos = false): Pergunta[][] {
  return c.perguntas.map(ps => ps.map(p => todos ? p : perguntaPara(p, nome)).filter((p): p is Pergunta => p !== null));
}
export function contagemVisivel(c: Config, nome: string, todos = false) {
  const visiveis = perguntasVisiveis(c, nome, todos).flat().length;
  return { visiveis, ocultas: c.perguntas.flat().length - visiveis };
}
export const avisoVisibilidade = (nome: string, n: number, m: number) => `${nome} vê ${n} perguntas; ${m === 0 ? 'nenhuma fica oculta' : m === 1 ? '1 fica oculta' : `${m} ficam ocultas`}`;
export function perspectivaClasse(p: Pergunta) {
  if (p.id === '0.17') return 'offsite-fechamento';
  const code = p.objetivos?.[0] ?? '';
  return code.startsWith('AC') ? 'offsite-aprendizado' : code.startsWith('P.') ? 'offsite-processos' : code.startsWith('C.') ? 'offsite-clientes' : 'offsite-financeira';
}