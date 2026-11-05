import { describe, expect, it } from 'vitest';
import conteudo from './fixtures/preOffsiteV315Rascunho.json';
import mapas from './fixtures/preOffsiteV315Mapeamentos.json';
import anterior from './fixtures/preOffsiteV314Rascunho.json';
import { PADRAO, camposDetalhe32, type Config } from '@/features/preOffsite/config';
import { aplicarMapeamentos, prepararConfig, validarRascunho, type Mapeamento } from '@/features/preOffsite/editorConfig';
import { completude, divergencias } from '@/features/preOffsite/domain';
import { aplicarBsc2027, blocosVisiveis, numeroBloco, rotuloPergunta } from '@/features/preOffsite/presentation';

const bruto = () => ({ ...structuredClone(PADRAO), ...structuredClone(conteudo) } as Config);
const config = () => prepararConfig(bruto());
const todas = (c: Config) => c.perguntas.flat();

describe('Pré-Offsite v3.15 · rascunho', () => {
  it('é v3.15, valida no editor e preserva todos os ids da v3.14', () => {
    const c = bruto();
    expect(c.versao).toBe('v3.15');
    const diretores = ['Naira Yurie', 'Yuri Ribeiro', 'Iuri Franco', 'Guilherme Vieira', 'Bruno Garcia', 'Felipe Souza'];
    expect(validarRascunho(c, { ...structuredClone(PADRAO), ...structuredClone(anterior) } as Config, diretores).filter(e => !e.includes('participantes ativos'))).toEqual([]);
  });

  it('Bloco 6 (mandato) sai do formulário e os blocos 7 e 8 passam a 6 e 7 com os mesmos ids', () => {
    const c = config();
    expect(blocosVisiveis(c)).toEqual([0, 1, 2, 3, 4, 5, 7, 8]);
    expect(numeroBloco(c, 7)).toBe(6);
    expect(numeroBloco(c, 8)).toBe(7);
    const rot = Object.fromEntries(todas(c).map(p => [p.id, rotuloPergunta(p)]));
    expect(rot).toMatchObject({ '7.2': '6.1', '8.1': '7.1', '8.3': '7.2', '8.4': '7.3' });
    expect(todas(c).some(p => p.id === '6.1')).toBe(false);
    expect(c.arquivo.perguntas.map(x => x.pergunta.id)).toContain('6.1');
    const r = { '6.1': { Claro: 'x' }, '0.18': 'y' };
    expect(completude(r, c).etapas[6]).toBe(true);
    expect(JSON.stringify(divergencias(r, c))).not.toContain('mandato');
  });

  it('não cita Documento de contexto, mandato enviado, AC.03 nem Rev.03', () => {
    const s = JSON.stringify(conteudo);
    for (const t of ['Documento de contexto', 'enviado junto com este formulário', 'AC.03', 'Rev.03', '1.158']) expect(s).not.toContain(t);
    expect(conteudo.antes).toContain('leia o BSC 2027 (Rev.04.1), disponível em Materiais de apoio');
    expect(conteudo.bscFecho.endsWith('e o portfólio de projetos.')).toBe(true);
    expect(conteudo.anexo).not.toContain('mandato');
    expect(conteudo.materialDestaque).toBe('BSC 2027 · Rev.04.1');
  });

  it('Bloco 0 usa objetivos e KPIs do Rev.04.1', () => {
    const p = (id: string) => config().perguntas[0].find(x => x.id === id)!;
    expect(p('0.4').objetivos).toEqual(['AC.01 Líderes que formam líderes', 'P.01 Jornada do aluno sem perda']);
    expect(p('0.18').kpisTexto).toEqual(['% de 1:1 realizados']);
    expect(p('0.15').extras?.map(e => e.nome)).toContain('Na sua visão, qual a estratégia para atingirmos cerca de 2.000 alunos ativos e adimplentes, a North Star de 2027?');
  });

  it('a resposta da 0.15 acompanha a pergunta renomeada ao publicar', () => {
    const r = { 'b0.v3.0.15': { extras: { 'Na sua visão, qual a estratégia para chegarmos a cerca de 2.000 alunos ativos e adimplentes na PPG em 2027, a North Star da LM?': 'resposta' } } };
    const out = aplicarMapeamentos(r, mapas as Mapeamento[], config());
    expect(out['b0.v3.0.15'].extras).toEqual({ 'Na sua visão, qual a estratégia para atingirmos cerca de 2.000 alunos ativos e adimplentes, a North Star de 2027?': 'resposta' });
  });

  it('seletores usam os nove objetivos do Rev.04.1 e mantêm o BSC antigo só para ler respostas', () => {
    const c = config();
    const refs = aplicarBsc2027({ objetivos: [{ id: 'u1', codigo: 'AC.03', nome: 'Execução' }], kpis: [{ id: 'k1', codigo: 'F01', nome: 'Antigo' }] }, c);
    expect(refs.objetivos.filter((o: any) => !o.oculto).map((o: any) => o.codigo)).toEqual(['F.01', 'F.02', 'C.01', 'C.02', 'P.01', 'P.02', 'P.03', 'AC.01', 'AC.02']);
    expect((refs.objetivos.find((o: any) => o.id === 'u1') as any)?.oculto).toBe(true);
    expect((refs.kpis.find((k: any) => k.id === 'k1') as any)?.oculto).toBe(true);
    expect(camposDetalhe32(c).find(f => f.nome === 'KPI')?.rotulo).toContain('BSC 2027 (Rev.04.1)');
  });

  it('versão publicada sem bsc2027 continua igual', () => {
    const c = prepararConfig(structuredClone(PADRAO));
    expect(blocosVisiveis(c)).toHaveLength(9);
    const refs = { objetivos: [{ id: 'u1' }], kpis: [] };
    expect(aplicarBsc2027(refs, c)).toBe(refs);
  });
});
