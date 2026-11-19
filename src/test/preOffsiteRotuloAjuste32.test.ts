import { describe, it, expect } from 'vitest';
import { rotuloAjuste32, tituloAjuste32 } from '@/features/preOffsite/domain';
describe('3.2 rótulo do ajuste conforme posição', () => {
  it('Ajustaria', () => { expect(tituloAjuste32('Ajustaria')).toBe('Qual o ajuste?'); expect(rotuloAjuste32('Ajustaria')).toBe('Ajuste'); });
  it('Discordo', () => { expect(tituloAjuste32('Discordo')).toBe('Por que você discorda? O que proporia no lugar?'); expect(rotuloAjuste32('Discordo')).toBe('Motivo da discordância'); });
});
