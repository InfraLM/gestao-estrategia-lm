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
const ORDEM_PERSPECTIVA=['f','c','p','ac'];
const perspectivaKpi=(codigo:string)=>{const c=String(codigo??'').toLowerCase();return c.startsWith('ac')?3:c.startsWith('p')?2:c.startsWith('c')?1:0;};
/** Exibição da árvore de KPIs: só o código e o nome da árvore (o nome já traz o código), sem o código interno. */
export const rotuloKpi=(k:{nome?:string;codigo?:string})=>String(k?.nome??k?.codigo??'').trim();
/** Rótulo de um KPI pelo id: ativo, arquivado na Rev.03 ou o próprio valor salvo. */
export const rotuloKpiId=(id:string,kpis:any[]=[],arquivados:any[]=[])=>{const k=kpis.find((x:any)=>x.id===id);if(k)return rotuloKpi(k);const a=arquivados.find((x:any)=>x.id===id);return a?`KPI arquivado (Rev.02): ${String(a.nome_anterior??a.nome??'').trim()}`:id;};
export const ordenarKpis=<T extends {codigo?:string;nome?:string}>(ks:T[])=>[...(ks??[])].sort((a,b)=>perspectivaKpi(a.codigo??'')-perspectivaKpi(b.codigo??'')||String(a.codigo).localeCompare(String(b.codigo),'pt-BR',{numeric:true}));
export const kpisSelecionados=(v:any):string[]=>Array.isArray(v)?v.filter((x:any)=>typeof x==='string'&&x):typeof v==='string'&&v?[v]:[];
export {ORDEM_PERSPECTIVA};

/** Blocos exibidos: o 0 sempre; os demais só quando têm pergunta ativa (bloco todo arquivado some). */
export const blocosVisiveis = (c: Config) => c.blocos.map((_, i) => i).filter(i => i === 0 || (c.perguntas[i]?.length ?? 0) > 0);
/** Número exibido do bloco, renumerado após blocos ocultos; o índice interno não muda. */
export const numeroBloco = (c: Config, i: number) => blocosVisiveis(c).indexOf(i);
/** Rótulo exibido da pergunta; o id interno (chave das respostas) não muda. */
export const rotuloPergunta = (p: Pergunta) => p.rotulo ?? p.id;
export const prefixoPergunta = (p: Pergunta) => (p.id === '5.riscos' ? '' : `${rotuloPergunta(p)} · `);
const slug = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const idBsc2027 = (codigo: string, nome?: string) => `rev041:${codigo}${nome ? ':' + slug(nome) : ''}`;
/** Com bsc2027 na configuração, objetivos/KPIs dos seletores passam a ser os dele; os do app ficam só para ler respostas antigas. */
export function aplicarBsc2027<R extends { objetivos: any[]; kpis: any[] }>(refs: R, c: Config): R {
  const b = c.bsc2027;
  if (!b?.objetivos?.length) return refs;
  const anterior = (x: any) => ({ ...x, nome: `${x.nome} (BSC anterior)`, oculto: true });
  return {
    ...refs,
    objetivos: [...b.objetivos.map(o => ({ id: idBsc2027(o.codigo), codigo: o.codigo, nome: o.nome })), ...refs.objetivos.map(anterior)],
    kpis: [...b.kpis.map(k => ({ id: idBsc2027(k.codigo, k.nome), codigo: k.codigo, nome: k.nome })), ...refs.kpis.map(anterior)],
  };
}
