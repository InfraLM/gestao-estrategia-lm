import { describe, expect, it } from 'vitest';
import { PADRAO } from '@/features/preOffsite/config';
import { prepararConfig, converterRespostas4A, CAMPOS_4A } from '@/features/preOffsite/editorConfig';
import { resumoResposta } from '@/features/preOffsite/domain';

describe('3.2 absorve 3.3/3.4 e nova 4A', () => {
  it('3.3 e 3.4 somem do formulário', () => {
    const ids = prepararConfig(PADRAO).perguntas[3].map(p => p.id);
    expect(ids).toContain('3.2'); expect(ids).not.toContain('3.3'); expect(ids).not.toContain('3.4');
  });
  it('resumo da 3.2 traz detalhe das escolhidas e ajuste', () => {
    const r = { '3.selecionadas': ['1'], '3.pos.1': 'Concordo', '3.detalhe.1': { 'Objeção mais forte': 'x' }, '3.pos.2': 'Discordo', '3.ajuste.2': 'y' };
    const linhas = resumoResposta(r, '3.2', PADRAO);
    expect(linhas[0]['Objeção mais forte']).toBe('x'); expect(linhas[1].Ajuste).toBe('y');
  });
  it('4A tem os cinco campos novos, com Impacto mantido e sinal opcional', () => {
    expect(CAMPOS_4A.map(f => f.nome)).toEqual(['Impacto', 'Premissa', 'Motivo provável', 'O que a área entrega ou cede', 'Sinal em 90 dias']);
    expect(CAMPOS_4A[4].opcional).toBe(true);
  });
  it('migra Por que fracassou para Motivo provável e preserva os demais, de forma idempotente', () => {
    const r = { '4A.v311-hospital': { 'Por que fracassou': 'm', 'Ponto cego da ficha': 'p', Comentário: 'c', Impacto: 'Ajuda' } };
    const n = converterRespostas4A(r);
    expect(n['4A.v311-hospital']).toEqual({ 'Motivo provável': 'm', 'Ponto cego da ficha': 'p', Comentário: 'c', Impacto: 'Ajuda' });
    expect(converterRespostas4A(n)).toEqual(n);
  });
});
