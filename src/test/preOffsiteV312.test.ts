import { describe, it, expect } from 'vitest';
import { NOVO_BLOCO0, CHAVE_BLOCO0, perguntaPara, bloco0Completo, converterRespostasV312 } from '@/features/preOffsite/bloco0';
import { PADRAO } from '@/features/preOffsite/config';
import { completude } from '@/features/preOffsite/domain';
const by=(id:string)=>NOVO_BLOCO0.find(p=>p.id===id)!;
describe('Pré-Offsite v3.12 · roteamento por diretor',()=>{
 it('0.8 só existe para Yuri Ribeiro',()=>{expect(perguntaPara(by('0.8'),'Yuri Ribeiro')).not.toBeNull();expect(perguntaPara(by('0.8'),'Bruno Garcia')).toBeNull();});
 it('Yuri vê só Onboarding → primeira prática na 0.9, sem Outro',()=>{expect(perguntaPara(by('0.9'),'Yuri Ribeiro')!.itens).toEqual(['Onboarding → primeira prática']);expect(perguntaPara(by('0.9'),'Felipe Souza')!.itens).toEqual(['MQL → SQL','SQL → venda','Outro']);});
 it('extra direcionado some para quem não é alvo',()=>{const nomes=(n:string)=>perguntaPara(by('0.13'),n)!.extras!.map(f=>f.nome);expect(nomes('Felipe Souza').some(x=>x.startsWith('Dos alunos'))).toBe(false);expect(nomes('Iuri Franco').some(x=>x.startsWith('Dos alunos'))).toBe(true);});
 it('item não direcionado não conta para concluir',()=>{expect(bloco0Completo(by('0.8'),undefined,'Bruno Garcia')).toBe(true);expect(bloco0Completo(by('0.8'),undefined,'Yuri Ribeiro')).toBe(false);});
 it('0.18 e 0.19 são opcionais',()=>{expect(bloco0Completo(by('0.18'),undefined,'Bruno Garcia')).toBe(true);expect(completude({},PADRAO,'Bruno Garcia').avisos.some(a=>a.startsWith('0.18')||a.startsWith('0.19')||a.startsWith('0.8 '))).toBe(false);});
 it('converte valores antigos da v3.11',()=>{const r=converterRespostasV312({[CHAVE_BLOCO0+'0.1']:{extras:{'Como fechar':'Terceirizar'}},[CHAVE_BLOCO0+'0.5']:{itens:[{Item:'Contratação',Avaliação:'Aplicados de forma estruturada'}],extras:{'Um desvio inaceitável na sua área':'x'}},[CHAVE_BLOCO0+'0.12']:{extras:{'Caso real de 2026':'y'}},'6.2':[{Entrega:'A'}],'7.2':'menos'});
  expect(r[CHAVE_BLOCO0+'0.1'].extras['Como fechar']).toBe('Contratar ou terceirizar');expect(r[CHAVE_BLOCO0+'0.5'].itens[0].Avaliação).toBe('Aplicados de forma processual');expect(r[CHAVE_BLOCO0+'0.5'].extras['Um comportamento que contradiz a cultura que você observou na sua área em 2026']).toBe('x');expect(Object.values(r[CHAVE_BLOCO0+'0.12'].extras)).toContain('y');expect(r['2.1']).toEqual([{Prioridade:'A'}]);expect(r['7.2']).toEqual({'O que mudaria primeiro com 15% menos custo de estrutura':'menos'});expect(converterRespostasV312(r)).toEqual(r);});
});
