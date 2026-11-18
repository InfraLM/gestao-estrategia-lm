import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { PADRAO, POSICOES_PRODUTO } from '@/features/preOffsite/config';
import { prepararConfig } from '@/features/preOffsite/editorConfig';
import { completude, divergencias, resumoResposta } from '@/features/preOffsite/domain';
import { exportarTudo } from '@/features/preOffsite/export';

vi.mock('xlsx', async original => ({ ...await original<typeof import('xlsx')>(), writeFile: vi.fn() }));
const refs = { respondentes: [], cadeiras: [], objetivos: [], kpis: [], processos: [] };

describe('Pré-Offsite · ajustes de 18/11', () => {
  it('arquiva 5.4 sem apagar respostas nem exigir seus riscos', () => {
    const c = prepararConfig(PADRAO);
    expect(PADRAO.escolhas.find(d => d.id === '5.4')?.arquivado).toBe(true);
    expect(c.escolhas.map(d => d.id)).toEqual(['5.1', '5.6', '5.7']);
    expect(c.arquivo.itens.escolhas.map(d => d.id)).toContain('5.4');
    c.perguntas = c.perguntas.map((ps, i) => i === 5 ? ps : []);
    const r = Object.fromEntries(c.escolhas.map(d => [d.id, { Risco: 'Teste', 'Como mitigaria': 'Teste' }]));
    r['5.4'] = { Risco: 'Histórico', 'Como mitigaria': 'Preservar' };
    const antes = structuredClone(r);
    expect(completude(r, c).percentual).toBe(100);
    expect(resumoResposta(r, '5.riscos', c)).toHaveLength(3);
    expect(divergencias(r, c)[0].dados).not.toHaveProperty('5.4');
    expect(r).toEqual(antes);
  });

  it('4.3 mantém os demais campos em ordem e completa sem Diretriz', () => {
    const c = prepararConfig(PADRAO);
    const p = c.perguntas[4].find(p => p.id === '4.3');
    if (!p?.campos) throw new Error('4.3 ausente');
    expect(p.campos.map(f => f.nome)).toEqual(['Nome', 'Justificativa', 'Objetivo BSC', 'KPI', 'Mês de início', 'Mês de fim', 'Custo total', 'T1', 'T2', 'T3', 'T4', 'O que entrega com metade do orçamento']);
    c.perguntas = c.perguntas.map((_, i) => i === 4 ? [p] : []);
    const row = Object.fromEntries(p.campos.map(f => [f.nome, f.tipo === 'numero' ? 0 : 'Teste']));
    expect(completude({ '4.3': [row] }, c).percentual).toBe(100);
  });

  it('4C reconhece as quatro posições no resumo administrativo e no Excel', () => {
    expect(POSICOES_PRODUTO).toEqual(['Encerrar', 'Manter como complemento de baixo contato', 'Manter sem investimento em ads', 'Manter e investir no crescimento, com budget previsto']);
    const c = prepararConfig(PADRAO);
    const rs = POSICOES_PRODUTO.map((posicao, i) => ({ id: String(i), nome: 'Fictício', cadeira_id: 'ficticia', respostas: { '4C.prod0': { Posição: posicao, 'Impacto na sua área e o que garantir na transição': 'Teste' } } }));
    const antes = structuredClone(rs);
    for (const r of rs) {
      expect(resumoResposta(r.respostas, '4C', c)[0]).toEqual({ Item: c.produtos[0].titulo, Posição: r.respostas['4C.prod0'].Posição });
      expect(JSON.stringify(divergencias(r.respostas, c))).not.toContain('Impacto na sua área e o que garantir na transição');
    }
    exportarTudo(rs as any, refs, c, '2026-11-12');
    const wb = vi.mocked(XLSX.writeFile).mock.calls.at(-1)?.[0] as XLSX.WorkBook | undefined;
    if (!wb) throw new Error('Excel ausente');
    const rows = XLSX.utils.sheet_to_json<{ Pergunta: string; Campo: string; Resposta: string }>(wb.Sheets['Bloco 4']);
    expect(rows.filter(r => r.Pergunta === '4C' && r.Campo === 'Item 1 · Posição').map(r => r.Resposta)).toEqual(POSICOES_PRODUTO);
    for (const sheet of Object.values(wb.Sheets)) expect(JSON.stringify(XLSX.utils.sheet_to_json(sheet))).not.toContain('Impacto na sua área e o que garantir na transição');
    expect(rs).toEqual(antes);
  });

  it('4C exige apenas Posição nos produtos fixos', () => {
    const c = prepararConfig(PADRAO);
    c.perguntas = c.perguntas.map(ps => ps.filter(p => p.id === '4C'));
    const r = Object.fromEntries(c.produtos.filter(d => d.titulo !== 'Outro').map(d => [`4C.${d.id}`, { Posição: 'Encerrar' }]));
    expect(completude(r, c).percentual).toBe(100);
    delete r[`4C.${c.produtos[0].id}`];
    expect(completude(r, c).percentual).toBe(0);
  });

  it('4C exige Nome e Posição no Outro quando utilizado, ignorando impacto antigo', () => {
    const c = prepararConfig(PADRAO);
    c.perguntas = c.perguntas.map(ps => ps.filter(p => p.id === '4C'));
    const outro = c.produtos.find(d => d.titulo === 'Outro');
    if (!outro) throw new Error('Outro ausente');
    const r = Object.fromEntries(c.produtos.filter(d => d.titulo !== 'Outro').map(d => [`4C.${d.id}`, { Posição: 'Encerrar' }]));
    const chave = `4C.${outro.id}`;
    const impacto = { 'Impacto na sua área e o que garantir na transição': 'Histórico' };
    expect(completude({ ...r, [chave]: impacto }, c).percentual).toBe(100);
    expect(completude({ ...r, [chave]: { ...impacto, Nome: 'Produto' } }, c).percentual).toBe(0);
    expect(completude({ ...r, [chave]: { ...impacto, Posição: 'Encerrar' } }, c).percentual).toBe(0);
    expect(completude({ ...r, [chave]: { ...impacto, Nome: 'Produto', Posição: 'Encerrar' } }, c).percentual).toBe(100);
  });
});