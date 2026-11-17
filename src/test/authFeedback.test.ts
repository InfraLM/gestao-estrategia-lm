import { describe, expect, it } from 'vitest';
import { authFeedback, confirmationRedirect } from '@/lib/authFeedback';

describe('Primeiro acesso seguro', () => {
  it('distingue confirmação pendente sem expor existência da conta no erro de credenciais', () => {
    expect(authFeedback({ code: 'email_not_confirmed' })).toContain('Confirme seu e-mail');
    expect(authFeedback({ code: 'invalid_credentials' })).toContain('E-mail ou senha incorretos');
    expect(authFeedback({ code: 'invalid_credentials' })).not.toContain('Confirme');
  });
  it('preserva convite e destino na confirmação do domínio publicado', () => {
    const url = new URL(confirmationRedirect('6d03b566-bc92-4f28-90a7-5ddb793dcbb0', '/pre-offsite'));
    expect(url.origin).toBe('https://gestao-estrategia-lm.lovable.app');
    expect(url.searchParams.get('convite')).toBe('6d03b566-bc92-4f28-90a7-5ddb793dcbb0');
    expect(url.searchParams.get('retorno')).toBe('/pre-offsite');
  });
});
import { emailCorporativo, MSG_EMAIL_CORPORATIVO, authFeedback as fb } from '@/lib/authFeedback';
describe('cadastro só com e-mail corporativo', () => {
  it('aceita apenas @liberdademedicaedu.com.br', () => {
    expect(emailCorporativo('ana@liberdademedicaedu.com.br')).toBe(true);
    expect(emailCorporativo('ana@gmail.com')).toBe(false);
    expect(emailCorporativo('ana@liberdademedicaedu.com.br.evil.com')).toBe(false);
  });
  it('erro do servidor vira mensagem de e-mail corporativo', () => {
    expect(fb({ message: 'Database error saving new user' })).toBe(MSG_EMAIL_CORPORATIVO);
  });
});
