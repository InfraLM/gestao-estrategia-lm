import { describe, it, expect } from 'vitest';
import { errosExtras, resumoExtras } from '@/lib/entregasExtras';
import { normalizarCheckout, normalizarCheckin, pendenciasCheckout } from '@/lib/rotinaSemanal';
import { calcularCompletude } from '@/lib/conformidade';
import { entregaFonte } from '../../supabase/functions/planejamento-gerar/entregas';
const extra = { id: 'e', descricao: 'Regularizar contrato', motivo_id: 'outros', motivo_nome: 'Outros', exige_detalhe: true, detalhe: '' };
describe('Entregas extras', () => {
  it('lista vazia é opcional', () => { expect(pendenciasCheckout(normalizarCheckout({ extras_lista: [] }))).toEqual([]); });
  it('Outros exige especificação, sem exigir detalhe dos outros motivos', () => {
    expect(errosExtras([extra]).map(e => e.campo)).toEqual(['extra-0-detalhe']);
    expect(errosExtras([{ ...extra, detalhe: 'Contrato do novo fornecedor' }])).toEqual([]);
    expect(errosExtras([{ ...extra, motivo_nome: 'Exigência legal/regulatória', exige_detalhe: false }])).toEqual([]);
  });
  it('linha adicionada exige descrição e motivo', () => {
    expect(errosExtras([{ ...extra, descricao: '', motivo_id: '', exige_detalhe: false }]).map(e => e.campo)).toEqual(['extra-0-descricao', 'extra-0-motivo']);
  });
  it('preserva textos legados e o motivo histórico mesmo renomeado no cadastro', () => {
    expect(normalizarCheckout({ extras: 'Entrega antiga', aprendizados: 'Aprendi', proxima: 'Foco', extras_lista: [extra] })).toMatchObject({ extras: 'Entrega antiga', aprendizados: 'Aprendi', proxima: 'Foco', extras_lista: [extra] });
  });
  it('extras/aprendizados/foco nunca contam na completude', () => {
    const ci = normalizarCheckin({ prioridades: [{ titulo: 'P' }] });
    expect(calcularCompletude(normalizarCheckout({ extras_lista: [extra], extras: 'Texto', aprendizados: 'A', proxima: 'F' }), ci, null)).toEqual({ feitos: 1, total: 1, faltando: [] });
  });
  it('resumo conta entregas enviadas por motivo/cadeira no mês do domingo, nunca rascunhos', () => {
    const r = { cadeira_id: 'CPPO', semana: '2026-09-28', tipo: 'checkout', status: 'enviado', conteudo: { extras_lista: [extra, extra] } };
    expect(resumoExtras([r, { ...r, cadeira_id: 'CFO', conteudo: { extras_lista: [extra] } }, { ...r, status: 'rascunho' }], '2026-10')).toEqual([{ cadeira: 'CPPO', motivo: 'Outros', quantidade: 2 }, { cadeira: 'CFO', motivo: 'Outros', quantidade: 1 }]);
    expect(resumoExtras([r], '2026-09')).toEqual([]);
  });
  it('IA recebe entrega/motivo/detalhe e legado, nunca aprendizados/foco/reservados', () => {
    expect(entregaFonte({ extras_lista: [{ ...extra, detalhe: 'Fornecedor' }], extras: 'Legado', aprendizados: 'segredo', proxima: 'reservado', contatos: 'privado' })).toBe('Regularizar contrato — motivo: Outros (Fornecedor); Registro anterior (texto livre): Legado');
  });
});