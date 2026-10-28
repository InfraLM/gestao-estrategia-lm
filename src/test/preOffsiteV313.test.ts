import { describe, it, expect } from 'vitest';
import { PADRAO } from '@/features/preOffsite/config';
import { bloco0Completo, perguntaPara, linhasMatriz } from '@/features/preOffsite/bloco0';
import { resumoResposta } from '@/features/preOffsite/domain';
import { contagemVisivel, perguntasVisiveis } from '@/features/preOffsite/presentation';
const pergunta=(id:string)=>{const p=PADRAO.perguntas.flat().find(p=>p.id===id);if(!p)throw new Error(id);return p;};
describe('Pré-Offsite v3.13',()=>{
 it('usa os três projetos aprovados na ordem correta',()=>expect(PADRAO.projetos.map(p=>p.id)).toEqual(['v311-hospital','v311-metodo','v312-sede-goiania']));
 it('Bruno não recebe 0.8, 0.9 ou 0.12',()=>expect(perguntasVisiveis(PADRAO,'Bruno Garcia').flat().filter(p=>['0.8','0.9','0.12'].includes(p.id))).toEqual([]));
 it('Guilherme não recebe 0.8',()=>expect(perguntaPara(pergunta('0.8'),'Guilherme Vieira')).toBeNull());
 it('Yuri recebe exclusivamente a linha onboarding, inclusive com respostas ocultas antigas',()=>{const p=perguntaPara(pergunta('0.9'),'Yuri Ribeiro');if(!p)throw new Error('Yuri');expect(linhasMatriz(p,{itens:[{Item:'SQL → venda',Perda:'Alta'},{Item:'Antigo',Outro:true}]}).map(x=>x.Item)).toEqual(['Onboarding → primeira prática']);});
 it('cada linha fixa de Felipe é necessária para completude, Outro não',()=>{const p=pergunta('0.9');expect(bloco0Completo(p,{itens:[{Item:'MQL → SQL',Perda:'Alta','Causa principal':'Atendimento'}]},'Felipe Souza')).toBe(false);expect(bloco0Completo(p,{itens:['MQL → SQL','SQL → venda'].map(Item=>({Item,Perda:'Alta','Causa principal':'Atendimento'})).concat([{Item:'',Outro:true} as any])},'Felipe Souza')).toBe(true);});
 it('mantém projetos removidos no resumo histórico sem modificar a resposta',()=>{const r={'4A.v311-receita':{'Por que fracassou':'motivo'},'4.1':['v311-caixa'],'4.2':'v311-receita'};const before=structuredClone(r);expect(resumoResposta(r,'4A',PADRAO)).toContainEqual({Item:'Receita inteligente',Registro:'Histórico — removido do formulário','Por que fracassou':'motivo'});expect(resumoResposta(r,'4.1',PADRAO).Seleção).toEqual(['v311-caixa']);expect(r).toEqual(before);});
 it('falha grave 0.12 é texto longo',()=>expect(pergunta('0.12').extras?.find(f=>f.nome.startsWith('Qual foi a falha operacional'))?.tipo).toBe('texto'));
 it('Todos preserva perguntas e roteamento; diretor tem contagem filtrada',()=>{expect(contagemVisivel(PADRAO,'',true)).toEqual({visiveis:PADRAO.perguntas.flat().length,ocultas:0});expect(contagemVisivel(PADRAO,'Bruno Garcia').ocultas).toBe(3);expect(perguntasVisiveis(PADRAO,'',true)[0].find(p=>p.id==='0.9')?.itensCadeiras?.['Onboarding → primeira prática']).toEqual(['Guilherme Vieira','Yuri Ribeiro']);});
});