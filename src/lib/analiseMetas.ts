import type { TipoApontamento } from './avaliacaoBsc';
export const ANALISE_LABEL:Record<TipoApontamento,string>={valor_mensal:'Meta numérica MENSAL (V)',valor_periodo:'Meta numérica SEMESTRAL (S)',entrega:'Meta de ENTREGA (E)'};
export const ANALISE_AJUDA:Record<TipoApontamento,string>={valor_mensal:'Valor mensal comparado com a meta após o fechamento do mês. Tolerância na mesma unidade da meta.',valor_periodo:'On/Off declarado no mês; Off exige justificativa. Referência mensal não gera farol automático; comparação ao fim do semestre.',entrega:'Status, prazo obrigatório, avanço e evidência. Atrasada ou prazo vencido sem implantação fica Off.'};
export function fimSemestre(comp:string){return `${comp.slice(0,4)}-${Number(comp.slice(5,7))<=6?'06-30':'12-31'}`;}
export type AnaliseMeta={origem?:string;tipo_apontamento?:TipoApontamento;analise_configurada_em?:string|null;analise_historico?:any[];tolerancia?:number|null;prazo_entrega?:string|null;meta_semestre?:number|null;meta_texto?:string|null;sentido?:'maior'|'menor';unidade?:string|null};
/** Resolve past configuration without mutating stored records. New launches carry their own snapshot. */
export function analiseNaData<T extends AnaliseMeta>(i:T,data:string|null,snapshot?:any):T {
 if(i.origem==='bsc'||!i.analise_configurada_em)return i;
 if(snapshot&&typeof snapshot==='object')return {...i,...snapshot};
 if(!data)return i;
 const old=(i.analise_historico??[]).find(h=>h.ate&&data<h.ate);
 return old?{...i,...old}:i;
}
export const tipoMudou=(atual:string|undefined,novo:string)=> (atual??'valor_mensal')!==novo;
export const analiseDefinida=(i:AnaliseMeta)=>i.origem==='bsc'||!!i.analise_configurada_em;