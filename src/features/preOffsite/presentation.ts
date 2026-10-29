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
