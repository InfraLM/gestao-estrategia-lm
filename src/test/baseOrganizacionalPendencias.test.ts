import { describe, expect, it } from 'vitest';
import { faixaConfianca, pendenciasCorrespondencias } from '@/lib/baseOrganizacional';

describe('Correspondências organizacionais pendentes', () => {
  it('separa confiança alta, média e baixa nas fronteiras', () => {
    expect(faixaConfianca(0.9)).toBe('alta');
    expect(faixaConfianca(0.899)).toBe('media');
    expect(faixaConfianca(0.7)).toBe('media');
    expect(faixaConfianca(0.699)).toBe('baixa');
  });
  it('conta somente sugestões, sem incluir aprovadas ou rejeitadas', () => {
    expect(pendenciasCorrespondencias([
      {status:'sugerido',confianca:1}, {status:'sugerido',confianca:0.8},
      {status:'sugerido',confianca:0}, {status:'aprovado',confianca:1},
      {status:'rejeitado',confianca:0},
    ])).toEqual({alta:1,media:1,baixa:1});
  });
});