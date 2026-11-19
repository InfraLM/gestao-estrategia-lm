import { describe, it, expect } from 'vitest';
import { PADRAO } from '@/features/preOffsite/config';
import { completude, resumoResposta } from '@/features/preOffsite/domain';
const det={'O que sua área vai fazer':'c'};
describe('3.2 ajuste também nas prioritárias',()=>{
  const base=()=>{const r:any={'3.selecionadas':['1','2','3']};for(const d of PADRAO.diretrizes)r[`3.pos.${d.id}`]='Concordo';for(const id of ['1','2','3'])r[`3.detalhe.${id}`]=det;r['3.pos.1']='Ajustaria';return r;};
  it('prioritária marcada Ajustaria exige o ajuste',()=>{const r=base();expect(completude(r,PADRAO).avisos.some(a=>a.startsWith('3.2'))).toBe(true);r['3.ajuste.1']='x';expect(completude(r,PADRAO).avisos.some(a=>a.startsWith('3.2'))).toBe(false);});
  it('ajuste da prioritária aparece no resumo',()=>{const r=base();r['3.ajuste.1']='meu ajuste';expect(resumoResposta(r,'3.2',PADRAO)[0].Ajuste).toBe('meu ajuste');expect(resumoResposta(r,'3.4',PADRAO).some((l:any)=>l.Ajuste==='meu ajuste')).toBe(true);});
});
describe('3.2 só "O que sua área vai fazer"',()=>{
  it('campos removidos não bloqueiam nem aparecem',()=>{const r:any={'3.selecionadas':['1','2','3']};for(const d of PADRAO.diretrizes)r[`3.pos.${d.id}`]='Concordo';for(const id of ['1','2','3'])r[`3.detalhe.${id}`]={'O que sua área vai fazer':'c',KPI:'antigo'};
    expect(completude(r,PADRAO).avisos.some(a=>a.startsWith('3.2'))).toBe(false);
    const l=resumoResposta(r,'3.2',PADRAO)[0];expect(l['O que sua área vai fazer']).toBe('c');expect(l.KPI).toBeUndefined();expect(r['3.detalhe.1'].KPI).toBe('antigo');});
  it('anexo item 1 atualizado',()=>expect(PADRAO.anexo).toContain('1. Diretrizes marcadas como Discordo ou Ajustaria e o ajuste proposto (bloco 3).'));
});
import { completudeDetalhada } from '@/features/preOffsite/domain';
import { prepararConfig } from '@/features/preOffsite/editorConfig';
describe('progresso por etapa',()=>{
  const c=prepararConfig(structuredClone(PADRAO));
  it('pergunta opcional ou de outra cadeira não conta',()=>{const cc:any=structuredClone(c);const p=cc.perguntas[1][0];
    const base=completudeDetalhada({},cc,'Fulano').detalhes[1].total;
    p.opcional=true;expect(completudeDetalhada({},cc,'Fulano').detalhes[1].total).toBe(base-1);
    delete p.opcional;p.cadeiras=['Outro Nome'];expect(completudeDetalhada({},cc,'Fulano').detalhes[1].faltas.some((f:any)=>f.id===p.id)).toBe(false);});
  it('lista faltas com número e % por etapa',()=>{const d=completudeDetalhada({'3.1':'x'},c,'Fulano').detalhes[3];expect(d.faltas.some(f=>f.id==='3.1')).toBe(false);expect(d.percentual).toBe(Math.round(d.feitas/d.total*100));});
  it('item arquivado (5.4) não é exigido nos riscos',()=>expect(c.escolhas.some(e=>e.id==='5.4')).toBe(false));
});
describe('pergunta opcional fora do bloco 0',()=>{it('8.3 opcional não conta',()=>{const cc:any=prepararConfig(structuredClone(PADRAO));const i=cc.perguntas.findIndex((ps:any)=>ps.some((p:any)=>p.id==='8.3'));if(i<0)return;cc.perguntas[i].find((p:any)=>p.id==='8.3').opcional=true;expect(completudeDetalhada({},cc,'X').detalhes[i].faltas.some((f:any)=>f.id==='8.3')).toBe(false);});});
