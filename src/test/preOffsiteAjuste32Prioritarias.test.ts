import { describe, it, expect } from 'vitest';
import { PADRAO } from '@/features/preOffsite/config';
import { completude, resumoResposta } from '@/features/preOffsite/domain';
const det={'Objeção mais forte':'a','O que precisa ser verdade':'b','O que sua área vai fazer':'c',KPI:'k','Quanto espera mover em 2027':'d'};
describe('3.2 ajuste também nas prioritárias',()=>{
  const base=()=>{const r:any={'3.selecionadas':['1','2','3']};for(const d of PADRAO.diretrizes)r[`3.pos.${d.id}`]='Concordo';for(const id of ['1','2','3'])r[`3.detalhe.${id}`]=det;r['3.pos.1']='Ajustaria';return r;};
  it('prioritária marcada Ajustaria exige o ajuste',()=>{const r=base();expect(completude(r,PADRAO).avisos.some(a=>a.startsWith('3.2'))).toBe(true);r['3.ajuste.1']='x';expect(completude(r,PADRAO).avisos.some(a=>a.startsWith('3.2'))).toBe(false);});
  it('ajuste da prioritária aparece no resumo',()=>{const r=base();r['3.ajuste.1']='meu ajuste';expect(resumoResposta(r,'3.2',PADRAO)[0].Ajuste).toBe('meu ajuste');expect(resumoResposta(r,'3.4',PADRAO).some((l:any)=>l.Ajuste==='meu ajuste')).toBe(true);});
});
