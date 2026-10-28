import { describe, it, expect } from 'vitest';
import { NOVO_BLOCO0, converterRespostasV312, opcoesLacuna, perguntaPara, CHAVE_BLOCO0 } from '@/features/preOffsite/bloco0';
const P=(id:string)=>NOVO_BLOCO0.find(p=>p.id===id)!;
const SUC='Para cada posição-chave da sua área, quem assume amanhã se a pessoa sair?';
describe('Ajustes 28/10 Pré-Offsite',()=>{
 it('0.2 sem coluna antiga e com extra logo após a lista',()=>{expect(P('0.2').campos!.some(c=>c.nome==='Quem assume amanhã')).toBe(false);expect(P('0.2').campos!.some(c=>c.nome.startsWith('Tempo para recompor'))).toBe(true);expect(P('0.2').extras![0]).toMatchObject({nome:SUC,tipo:'texto',opcional:true});});
 it('migra coluna antiga uma linha por posição',()=>{const r=converterRespostasV312({[CHAVE_BLOCO0+'0.2']:{linhas:[{'Nome e cargo':'Ana, gerente','Quem assume amanhã':'Beto'},{'Nome e cargo':'Caio'}]}});expect(r[CHAVE_BLOCO0+'0.2'].extras[SUC]).toBe('Ana, gerente: Beto');});
 it('opções das decisões',()=>{const s=P('0.2').sublista!.campos;expect(s[1].opcoes).toEqual(['Eu','CEO','Sócios','Outra área']);expect(s[2].opcoes).toEqual(['Liderança direta','Time','Outra área','Felipe Souza','Guilherme Vieira','Iuri Franco','Yuri Ribeiro','Bruno Garcia','Naira Yurie']);});
 it('lacuna usa competências e Outro digitado',()=>{const o=opcoesLacuna(P('0.1'),{itens:[{Item:'Negociação com hospitais',Outro:true}]});expect(o).toContain('Uso de IA e automação');expect(o).toContain('Negociação com hospitais');expect(o).not.toContain('Outra');expect(opcoesLacuna(P('0.1'),{})).toContain('Outra');});
 it('0.11 e 0.13 roteadas',()=>{expect(P('0.11').cadeiras).toEqual(['Guilherme Vieira','Iuri Franco','Yuri Ribeiro']);expect(P('0.13').cadeiras).toEqual(['Guilherme Vieira','Iuri Franco','Felipe Souza','Yuri Ribeiro']);expect(perguntaPara(P('0.13'),'Bruno Garcia')).toBeNull();const f=perguntaPara(P('0.13'),'Felipe Souza')!.extras!.map(x=>x.nome);expect(f.some(n=>n.startsWith('O churn'))).toBe(false);expect(perguntaPara(P('0.13'),'Yuri Ribeiro')!.extras!.some(x=>x.nome.startsWith('O churn'))).toBe(true);});
});
