import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { PADRAO, type Config } from '@/features/preOffsite/config';
import { completude, situacaoResposta } from '@/features/preOffsite/domain';
import { exportarTudo } from '@/features/preOffsite/export';
import type { Resposta } from '@/features/preOffsite/usePreOffsite';

vi.mock('xlsx', async original => ({ ...await original<typeof import('xlsx')>(), writeFile: vi.fn() }));

describe('Situação do Pré-Offsite calculada pela conclusão', () => {
  it('sem resposta salva é Não iniciado, mesmo com percentual 100', () => {
    expect(situacaoResposta(undefined, 100)).toBe('Não iniciado');
  });
  it('rascunho abaixo de 100% é Em andamento', () => {
    expect(situacaoResposta({ status: 'rascunho' }, 0)).toBe('Em andamento');
    expect(situacaoResposta({ status: 'rascunho' }, 99)).toBe('Em andamento');
  });
  it('rascunho em 100% é Concluído sem modificar o status salvo', () => {
    const r = Object.freeze({ status: 'rascunho' });
    expect(situacaoResposta(r, 100)).toBe('Concluído');
    expect(r.status).toBe('rascunho');
  });
  it('Enviado prevalece sobre qualquer percentual', () => {
    for (const pct of [0, 67, 100]) expect(situacaoResposta({ status: 'enviado' }, pct)).toBe('Enviado');
  });
  it('Excel usa o mesmo percentual e Situação, sem alterar respostas ou datas', () => {
    const c: Config = { ...PADRAO, perguntas: PADRAO.perguntas.map((_, b) => b === 1 ? [
      { id: '1.teste', tipo: 'texto', texto: 'Resposta principal' },
      { id: '1.opcional', tipo: 'texto', texto: 'Observação', opcional: true },
    ] : []) };
    const rs: Resposta[] = ['andamento', 'completo', 'enviado'].map((id, i) => ({
      id, user_id: id, cadeira_id: id, nome: id, respostas: i === 1 ? { '1.teste': 'Preenchido' } : {},
      status: i === 2 ? 'enviado' : 'rascunho', revisao: 1, enviado_em: null, atualizado_em: '2026-11-19T18:38:00Z',
    }));
    const antes = JSON.stringify(rs);
    const respondentes = ['ausente', ...rs.map(r => r.id)].map(id => ({ id, diretor_nome: id }));
    exportarTudo(rs, { respondentes, cadeiras: respondentes, objetivos: [], kpis: [], processos: [] }, c, '2026-11-12');
    const wb = vi.mocked(XLSX.writeFile).mock.calls.at(-1)?.[0] as XLSX.WorkBook | undefined;
    if (!wb) throw new Error('Excel não gerado');
    const rows = XLSX.utils.sheet_to_json<{ Diretor: string; Status: string; Concluído: number }>(wb.Sheets.Status);
    expect(rows.map(r => [r.Status, r.Concluído])).toEqual([
      ['Não iniciado', 0], ['Em andamento', 0], ['Concluído', 100], ['Enviado', 0],
    ]);
    for (const r of rs) {
      const row = rows.find(x => x.Diretor === r.nome);
      const pct = completude(r.respostas, c, r.nome).percentual;
      expect(row?.Concluído).toBe(pct);
      expect(row?.Status).toBe(situacaoResposta(r, pct));
    }
    expect(JSON.stringify(rs)).toBe(antes);
  });
});