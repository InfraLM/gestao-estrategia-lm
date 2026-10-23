import { describe,it,expect } from 'vitest';
import { previewBudget,previewMetas2030 } from '@/lib/importacoesCiclo';
const projetos=[{codigo:'P001',nome:'Projeto real'}];
const indicadores=[{id:'1',codigo:'F.01',nome:'Receita',origem:'bsc',status:'ativo',parent_id:null,meta_2030:'100 mi'},{id:'2',codigo:'C.02',nome:'NPS',origem:'bsc',status:'ativo',parent_id:null,meta_2030:null}];
describe('Modelo budget e metas 2030',()=>{
 it('modelo vazio não inventa budget nem centros',()=>{expect(previewBudget([{'Código do projeto':'P001',Nome:'Projeto real','Budget liberado R$':'','Fonte da aprovação':'','Centro(s) de custo':''}],projetos)[0]).toMatchObject({budget:null,centros:[],erro:null});});
 it('valor brasileiro mantém magnitude e exige fonte',()=>{expect(previewBudget([{'Código do projeto':'P001','Budget liberado R$':'R$ 1.500,50','Fonte da aprovação':'SR-01','Centro(s) de custo':'001;002'}],projetos)[0]).toMatchObject({budget:1500.5,centros:['001','002'],erro:null});expect(previewBudget([{'Código do projeto':'P001',budget:'100'}],projetos)[0].erro).toContain('fonte');});
 it('recusa código desconhecido e projeto duplicado',()=>{expect(previewBudget([{codigo:'X'}],projetos)[0].erro).toContain('desconhecido');expect(previewBudget([{codigo:'P001'},{codigo:'P001'}],projetos)[1].erro).toContain('duplicado');});
 it('metas vazias preservam faltantes e só metas preenchidas entram na prévia',()=>{const r=previewMetas2030([{Código:'F.01',KPI:'Receita','Meta 2030':'200 mi'},{Código:'C.02',KPI:'NPS','Meta 2030':''}],indicadores);expect(r).toHaveLength(1);expect(r[0]).toMatchObject({id:'1',meta:'200 mi',anterior:'100 mi',erro:null});expect(indicadores[1].meta_2030).toBeNull();});
 it('não adivinha quando código duplicado sem nome',()=>{expect(previewMetas2030([{Código:'F.01','Meta 2030':'200'}],[...indicadores,{...indicadores[0],id:'3',nome:'Outra receita'}])[0].erro).toBe('Correspondência ambígua');});
});