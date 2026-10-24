import {describe,it,expect} from 'vitest';
import {PADRAO} from '@/features/preOffsite/config';
import {completude,custoDiverge,divergencias,numero,validarConfig} from '@/features/preOffsite/domain';
import {retornoStatus} from '@/lib/atualizacaoStatus';
describe('Pré-Offsite v3.10',()=>{
 it('configuração conserva identificadores das respostas',()=>{const c=structuredClone(PADRAO);c.diretrizes[0].id='alterado';expect(()=>validarConfig(c,PADRAO)).toThrow(/identificadores/);expect(validarConfig(PADRAO,PADRAO).perguntas).toHaveLength(9)}); 
 it('tem nove blocos, dez diretrizes e oito projetos propostos',()=>{expect(PADRAO.blocos).toHaveLength(9);expect(PADRAO.diretrizes).toHaveLength(10);expect(PADRAO.projetos).toHaveLength(8)});
 it('rascunho vazio aceita revisão com avisos sem exigir campos',()=>{const p=completude({},PADRAO);expect(p.percentual).toBeLessThan(10);expect(p.avisos.length).toBeGreaterThan(0)});
 it('três diretrizes prioritárias são necessárias para concluir 3.2',()=>{const r:any={'3.selecionadas':['1','2']};for(const d of PADRAO.diretrizes)r[`3.pos.${d.id}`]='Concordo';expect(completude(r,PADRAO).avisos.some(a=>a.startsWith('3.2'))).toBe(true);r['3.selecionadas'].push('3');expect(completude(r,PADRAO).avisos.some(a=>a.startsWith('3.2'))).toBe(false)});
 it('aprovaria exatamente dois projetos, lacuna só gera aviso',()=>{expect(completude({'4.1':['p1'],'4.1.porque':'Prioridade'},PADRAO).avisos.some(a=>a.startsWith('4.1'))).toBe(true);expect(completude({'4.1':['p1','p2'],'4.1.porque':'Prioridade'},PADRAO).avisos.some(a=>a.startsWith('4.1'))).toBe(false)});
 it('não se aplica não exige respostas ocultas em 4B',()=>{const r:any={};for(const d of PADRAO.andamento)r[`4B.${d.id}`]={Relação:'Não se aplica'};expect(completude(r,PADRAO).avisos.some(a=>a.startsWith('4B'))).toBe(false)});
 it('compara custos brasileiros por trimestre sem arredondamento indevido',()=>{expect(numero('1.250,50')).toBe(1250.5);expect(custoDiverge({'Custo total':'1.000,00',T1:'250',T2:'250',T3:'250',T4:'250'})).toBe(false);expect(custoDiverge({'Custo total':1000,T1:200,T2:250,T3:250,T4:250})).toBe(true)});
 it('discordâncias entram primeiro com dados do KPI',()=>{const d=divergencias({'3.pos.1':'Discordo','3.detalhe.1':{KPI:'k1'}},PADRAO);expect(d[0].titulo.startsWith('1')).toBe(true);expect(d[0].dados[0].detalhes.KPI).toBe('k1');expect(d.map(x=>x.titulo[0])).toEqual(['1','2','3','4','5','6'])});
 it('login retorna ao módulo e rejeita endereço externo',()=>{expect(retornoStatus('/pre-offsite?etapa=2')).toBe('/pre-offsite?etapa=2');expect(retornoStatus('https://externo.test/pre-offsite')).toBe('/')});
});
