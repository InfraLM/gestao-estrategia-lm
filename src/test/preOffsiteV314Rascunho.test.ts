import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import conteudo from './fixtures/preOffsiteV314Rascunho.json';
import { PADRAO, type Config } from '@/features/preOffsite/config';
import { aplicarMapeamentos, camposProjeto, prepararConfig, validarRascunho } from '@/features/preOffsite/editorConfig';
import { completude, resumoResposta } from '@/features/preOffsite/domain';
import { exportarTudo, traduzir } from '@/features/preOffsite/export';

vi.mock('xlsx', async original => ({ ...await original<typeof import('xlsx')>(), writeFile: vi.fn() }));
const config = () => prepararConfig({ ...structuredClone(PADRAO), ...structuredClone(conteudo) } as Config);
const refs = { respondentes: [], cadeiras: [], objetivos: [], kpis: [], processos: [] };

describe('Pré-Offsite v3.14 · configuração somente em rascunho', () => {
  it('mantém o ID do Método e todos os IDs anteriores sem precisar migrar respostas', () => {
    const c = config();
    expect(c.projetos.find(p => p.id === 'v311-metodo')?.selo).toBe('Estruturante');
    for (const p of PADRAO.projetos) expect(c.projetos.map(p => p.id)).toContain(p.id);
    const respostas = { '4A.v311-metodo': { Impacto: 'Ajuda', Premissa: 'Preservar' }, '4.1': ['v311-metodo'], '4.2': 'v311-metodo' };
    const antes = structuredClone(respostas);
    aplicarMapeamentos(respostas, [], c);
    resumoResposta(respostas, '4A', c);
    expect(respostas).toEqual(antes);
  });

  it('FIDC usa os mesmos cinco campos e o sinal em 90 dias permanece opcional', () => {
    const c = config();
    const fidc = c.projetos.find(p => p.id === 'v314-fidc-lm');
    const metodo = c.projetos.find(p => p.id === 'v311-metodo');
    if (!fidc || !metodo) throw new Error('Projetos ausentes');
    expect(camposProjeto(c, fidc)).toEqual(camposProjeto(c, metodo));
    expect(camposProjeto(c, fidc).map(f => f.nome)).toEqual(['Impacto', 'Premissa', 'Motivo provável', 'O que a área entrega ou cede', 'Sinal em 90 dias']);
    expect(camposProjeto(c, fidc).find(f => f.nome === 'Sinal em 90 dias')?.opcional).toBe(true);
  });

  it('FIDC participa de 4.1 e 4.2 mantendo o limite de dois projetos', () => {
    const c = config();
    c.perguntas = c.perguntas.map((ps, b) => b === 4 ? ps.filter(p => ['4.1', '4.2'].includes(p.id)) : []);
    const r = { '4.1': ['v311-metodo', 'v314-fidc-lm'], '4.1.porque': 'Escolha fictícia', '4.2': 'v314-fidc-lm', '4.2.porque': 'Condição fictícia' };
    expect(completude(r, c).percentual).toBe(100);
    expect(completude({ ...r, '4.1': ['v314-fidc-lm'] }, c).percentual).toBeLessThan(100);
    expect(traduzir('v314-fidc-lm', refs, c)).toBe('FIDC LM');
  });

  it('consolidado e Excel recebem os projetos configurados sem gravar respostas', () => {
    const c = config();
    const respostas = { '4A.v314-fidc-lm': { Impacto: 'Ajuda', Premissa: 'Carteira fictícia' }, '4.1': ['v314-fidc-lm', 'v311-metodo'], '4.2': 'v314-fidc-lm' };
    expect(resumoResposta(respostas, '4A', c).find((p: { Item: string }) => p.Item === 'FIDC LM')?.Premissa).toBe('Carteira fictícia');
    const spy = vi.mocked(XLSX.writeFile); spy.mockClear();
    exportarTudo([{ id: 'ficticio', nome: 'Fictício', cadeira_id: 'ficticia', respostas } as any], refs, c, '2026-10-28');
    const wb = spy.mock.calls[0]?.[0] as XLSX.WorkBook | undefined;
    if (!wb) throw new Error('Excel ausente');
    const rows = XLSX.utils.sheet_to_json<{ Pergunta: string; Campo: string; Resposta: string }>(wb.Sheets['Bloco 4']);
    expect(rows.filter(r => r.Pergunta === '4A' && r.Campo.endsWith('Item')).map(r => r.Resposta)).toContain('FIDC LM');
    expect(rows.filter(r => r.Pergunta === '4.2' && r.Campo === 'Seleção').map(r => r.Resposta)).toEqual(['FIDC LM']);
    spy.mockClear();
  });

  it('o rascunho preserva nove blocos, roteamento e a configuração publicada', () => {
    const c = config();
    expect(c.versao).toBe('v3.14');
    expect(PADRAO.versao).toBe('v3.13');
    expect(c.projetos.filter(p => p.selo === 'Estruturante')).toHaveLength(3);
    expect(c.projetos.filter(p => p.selo === 'Condicionado')).toHaveLength(1);
    const diretores = ['Naira Yurie', 'Ian Camilo', 'Yuri Ribeiro', 'Iuri Franco', 'Guilherme Vieira', 'Bruno Garcia', 'Felipe Souza'];
    expect(validarRascunho({ ...PADRAO, ...conteudo } as Config, PADRAO, diretores)).toEqual([]);
    expect(c.perguntas).toEqual(prepararConfig(PADRAO).perguntas);
  });
});