import { describe,it,expect } from 'vitest';
import { financeiroObjetivo,principalProjeto,realizadoProjeto,atingimentoMeta,validarPlanilha,valorEscalar } from '@/lib/impactoFinanceiro';
import { montarKpisObjetivo } from '@/hooks/useKpisObjetivo';
import { validarExport } from '../../supabase/functions/orcamento-sync/validar';
const v=(id:string,obj:string,status='proposto',impacto='principal')=>({fonte_tipo:'projeto',fonte_id:id,tipo:'objetivo',ref_id:obj,status,impacto});
describe('Financeiro por objetivo',()=>{
 it('budget conta uma vez no principal; proposto e validado separados; secundário não soma',()=>{
  const ps=[{id:'p1'},{id:'p2'}],vs=[v('p1','F1'),v('p1','F2','proposto','secundario'),v('p2','F1','validado')],bs=[{projeto_id:'p1',budget_liberado:100},{projeto_id:'p2',budget_liberado:200}];
  expect(financeiroObjetivo('F1',ps,vs,[],bs,[],[],'2026-10')).toMatchObject({budget:300,proposto:100,validado:200,projetos:2});
  expect(financeiroObjetivo('F2',ps,vs,[],bs,[],[],'2026-10')).toMatchObject({budget:null,projetos:0});
 });
 it('objetivo de KPI/KR/cesta principal resolvido; conflito não atribui orçamento sozinho',()=>{
  expect(principalProjeto('p',[{...v('p','k'),tipo:'indicador'}],[{id:'k',objetivo_id:'F1'}])).toMatchObject({objetivo:'F1'});
  expect(principalProjeto('p',[v('p','F1'),v('p','F2')],[])).toMatchObject({objetivo:null,conflito:true});
 });
 it('sem budget/realizado é ausência, mas zero confirmado é zero',()=>{
  expect(financeiroObjetivo('F1',[{id:'p'}],[v('p','F1')],[],[],[],[],'2026-10')).toMatchObject({budget:null,realizado:null,semBudget:1});
  expect(financeiroObjetivo('F1',[{id:'p'}],[v('p','F1')],[],[{projeto_id:'p',budget_liberado:0}],[],[],'2026-10')).toMatchObject({budget:0,pct:null});
 });
 it('realizado só centros confirmados, vários centros, acumulado até mês atual',()=>{
  const cs=[{projeto_id:'p',centro_custo:'a',status:'confirmado'},{projeto_id:'p',centro_custo:'b',status:'confirmado'},{projeto_id:'p',centro_custo:'c',status:'proposto'}];
  const es=[{centro_custo:'a',competencia:'2026-09',realizado:10},{centro_custo:'b',competencia:'2026-10',realizado:20},{centro_custo:'c',competencia:'2026-10',realizado:100},{centro_custo:'a',competencia:'2026-11',realizado:100}];
  expect(realizadoProjeto('p',cs,es,'2026-10')).toMatchObject({valor:30,centros:2,faltantes:0});
 });
 it('importação rejeita duplicados/mês inválido e aceita valor negativo de estorno',()=>{
  const r={centro_custo:'001',competencia:'2026-10',realizado:'1.250,50'};
  expect(validarPlanilha([r])[0]).toMatchObject({centro_custo:'001',realizado:1250.5});
  expect(()=>validarPlanilha([r,r])).toThrow('duplicados');expect(()=>validarPlanilha([{...r,competencia:'2026-13'}])).toThrow('inválido');
  expect(validarPlanilha([{...r,realizado:-100}])[0].realizado).toBe(-100);
 });
 it('contrato API rejeita números textuais/duplicados, aceita totais corrigidos',()=>{
  expect(()=>validarExport({registros:[{centro_custo:'a',competencia:'2026-10',realizado:'10'}]})).toThrow();
  expect(validarExport({registros:[{centro_custo:'a',competencia:'2026-10',realizado:-5}]})).toHaveLength(1);
 });
 it('atingimento 2030 respeita escala milhões/percentual/sentido, não extrai datas de narrativas',()=>{
  expect(atingimentoMeta(14.6e6,'200 mi','maior')).toBeCloseTo(7.3);expect(atingimentoMeta(50,'100','menor')).toBe(200);
  expect(valorEscalar('jan-maio 3,7')).toBeNull();expect(atingimentoMeta(90,'95% (15 dias)','maior')).toBeNull();
 });
});
describe('KPIs por objetivo',()=>{
 const i={id:'k',nome:'F01 Receita Líquida',origem:'bsc',nivel:'Estratégico',sentido:'maior',tipo_apontamento:'valor_mensal',meta_semestre:100};
 it('recupera meta 2030 da árvore; atualização de cadastro tem precedência',()=>{
  expect(montarKpisObjetivo([i],[],[],[],[],null)[0].meta2030).toBe('200 mi');
  expect(montarKpisObjetivo([{...i,meta_2030:'250 mi'}],[],[],[],[],null)[0].meta2030).toBe('250 mi');
 });
 it('último lançamento e checkout por data; V/S/E usam avaliação única sem avaliar contra 2030',()=>{
  const now=new Date('2026-11-05');const ls=[{indicador_id:'k',competencia:'2026-10',valor:10,revisao:0,updated_at:'2026-10-20'}];
  const ck=[{semana:'2026-10-19',status:'enviado',enviado_em:'2026-10-26',conteudo:{kpis_resposta:[{indicador_id:'k',situacao_atual:'20'}]}}];
  const r=montarKpisObjetivo([i],[],ls,ck,[],null,now)[0];expect(r.valor).toBe(20);expect(r.aval).toBe('acomp');
  expect(montarKpisObjetivo([{...i,tipo_apontamento:'entrega',prazo_entrega:'2026-10-01'}],[],[],[],[],null,now)[0].aval).toBe('off');
  expect(montarKpisObjetivo([{...i,tipo_apontamento:'valor_periodo'}],[],[],[],[],null,now)[0].aval).toBe('acomp');
 });
});