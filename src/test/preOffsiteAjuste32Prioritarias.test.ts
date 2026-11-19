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
