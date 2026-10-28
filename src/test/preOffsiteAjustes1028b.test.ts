import { describe, it, expect } from 'vitest';
import { PADRAO } from '@/features/preOffsite/config';
import { configBloco0, converterRespostasV312 } from '@/features/preOffsite/bloco0';
import { ordenarKpis, rotuloKpi } from '@/features/preOffsite/presentation';
import { traduzir } from '@/features/preOffsite/export';
const c=configBloco0(PADRAO as any);const P=(id:string)=>c.perguntas.flat().find(p=>p.id===id)!;
describe('ajustes 28/10 (0.15, 1.2, 2.1)',()=>{
 it('0.15 só para Felipe, Guilherme e Bruno',()=>expect(P('0.15').cadeiras).toEqual(['Felipe Souza','Guilherme Vieira','Bruno Garcia']));
 it('1.2 tem terceira coluna opcional e limite 3',()=>{const p=P('1.2');expect(p.campos?.map(f=>f.nome)).toEqual(['O que não funcionou','Causa principal','O que precisa ser feito?']);expect(p.campos?.[2].opcional).toBe(true);expect(p.limite).toBe(3);});
 it('2.1 KPI é multisseleção opcional',()=>{const f=P('2.1').campos!.find(f=>f.nome==='KPI')!;expect(f.multipla).toBe(true);expect(f.opcional).toBe(true);});
 it('converte KPI único antigo em lista',()=>{expect(converterRespostasV312({'2.1':[{Prioridade:'a',KPI:'k1'},{Prioridade:'b',KPI:''}]})['2.1']).toEqual([{Prioridade:'a',KPI:['k1']},{Prioridade:'b',KPI:[]}]);});
 const kpis=[{id:'1',codigo:'ac.01.03',nome:'AC01.02 % de decisões dentro da alçada (DOA)'},{id:'2',codigo:'p.01.01',nome:'P01 X'},{id:'3',codigo:'f.01.01',nome:'F01 Y'},{id:'4',codigo:'c.01.01',nome:'C01 Z'}];
 it('ordena Financeira, Clientes, Processos, Aprendizado e exibe sem código interno',()=>{expect(ordenarKpis(kpis).map(k=>k.id)).toEqual(['3','4','2','1']);expect(rotuloKpi(kpis[0])).toBe('AC01.02 % de decisões dentro da alçada (DOA)');});
 it('consolidado junta KPIs por vírgula',()=>expect(traduzir({KPI:['3','1']},{kpis,objetivos:[],cadeiras:[],processos:[]},c).KPI).toBe('F01 Y, AC01.02 % de decisões dentro da alçada (DOA)'));
});
