import { describe, it, expect } from 'vitest';
import { converterRespostasV312, NOVO_BLOCO0, CHAVE_BLOCO0 } from './bloco0';
const K=(id:string)=>CHAVE_BLOCO0+id;
describe('Rev.03 financeira', () => {
  it('mantém códigos de KPI', () => {
    const k=Object.fromEntries(NOVO_BLOCO0.map(p=>[p.id,p.kpis]));
    expect(k['0.13']).toEqual(["P01.01","P01.03","F01.03","C02-a.02"]);
    expect(k['0.14']).toEqual(["F02","F02.04","F02.05"]);
    expect(k['0.15']).toEqual(["F01.02","F01.01"]);
  });
  it('migra linhas e alavancas da 0.14', () => {
    const r=converterRespostasV312({[K('0.14')]:{itens:[{Item:'Forma de pagamento das vendas',x:1}],extras:{'E a segunda de maior impacto? (2ª)':'Previsibilidade das despesas da área'}}});
    expect(r[K('0.14')].itens[0].Item).toBe('Forma de pagamento das vendas (cartão ou à vista × boleto)');
    expect(r[K('0.14')].extras['E a segunda de maior impacto? (2ª)']).toBe('Previsão das despesas da área (erro do forecast)');
  });
  it('migra extra da 0.15 e campo da 7.2', () => {
    const r=converterRespostasV312({[K('0.15')]:{extras:{'Na sua visão, qual a estratégia para atingirmos 1.158 alunos adimplentes?':'a'}},'7.2':{'Qual custo da sua área cresce junto com a receita e, num modelo asset-light, não deveria crescer?':'b'}});
    expect(r[K('0.15')].extras['Na sua visão, qual a estratégia para chegarmos a cerca de 2.000 alunos ativos e adimplentes na PPG em 2027, a North Star da LM?']).toBe('a');
    expect(r['7.2']['Qual custo da sua área cresce junto com a receita e não deveria crescer, porque reduz a margem de contribuição?']).toBe('b');
  });
});
