import { describe, it, expect } from 'vitest';
import { PADRAO } from '@/features/preOffsite/config';
import { completude } from '@/features/preOffsite/domain';
const falta4B=(r:any)=>completude(r,PADRAO).avisos.some(a=>a.startsWith('4B'));
describe('completude só com obrigatórios',()=>{
  it('4B vazio conta como completo',()=>expect(falta4B({})).toBe(false));
  it('4B com linha exige só Nome, Posição e Status hoje',()=>{
    expect(falta4B({'4B':[{Nome:'X'}]})).toBe(true);
    expect(falta4B({'4B':[{Nome:'X','Posição':'Mantém','Status hoje':'ok'}]})).toBe(false);
  });
});
