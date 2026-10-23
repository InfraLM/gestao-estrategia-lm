import { describe,it,expect } from 'vitest';
import { normalizarFrequencia,distribuir } from '../../supabase/functions/ciclo-preparar/domain';
describe('Framework das propostas KR/Cesta',()=>{
 it('usa a velocidade mais lenta entre mudança e reação',()=>{expect(normalizarFrequencia({velocidade_mudanca:'semanal',velocidade_reacao:'trimestral'},'KR').frequencia).toBe('trimestral');});
 it('DRE impõe piso mensal',()=>{expect(normalizarFrequencia({velocidade_mudanca:'semanal',velocidade_reacao:'quinzenal',fonte:'DRE'},'Receita').frequencia).toBe('mensal');});
 it('distribui mensais sem alterar BSC nem frequência',()=>{const fixos=[{cadeira_id:'CFO',frequencia:'semanal'}];const antes=JSON.stringify(fixos);const ps=Array.from({length:8},(_,i)=>({indicador_id:String(i),cadeira_id:'CFO',dados:normalizarFrequencia({velocidade_mudanca:'mensal',velocidade_reacao:'mensal'},'K')}));const r=distribuir(ps,fixos);expect(r.cargas[0].maximo).toBe(3);expect(new Set(r.propostas.map(p=>p.dados.frequencia))).toEqual(new Set(['mensal']));expect(JSON.stringify(fixos)).toBe(antes);});
 it('declara conflito quando BSC sozinho ultrapassa três',()=>{const r=distribuir([{cadeira_id:'COO',dados:normalizarFrequencia({},'K')}],Array.from({length:4},()=>({cadeira_id:'COO',frequencia:'semanal'})));expect(r.cargas[0].maximo).toBeGreaterThan(3);expect(r.cargas[0].semanas_acima_3).toBe(27);});
});