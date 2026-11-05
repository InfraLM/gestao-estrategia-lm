export const APP_ORIGIN = 'https://gestao-estrategia-lm.lovable.app';

export function authFeedback(error: { code?: string; message?: string }): string {
  if (error.code === 'email_not_confirmed') return 'Confirme seu e-mail pelo link enviado. Você pode reenviar a confirmação abaixo.';
  if (error.code === 'invalid_credentials') return 'E-mail ou senha incorretos. Confira o e-mail ou recupere sua senha.';
  if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (error.code === 'weak_password') return 'Escolha uma senha mais segura, com pelo menos 6 caracteres.';
  if (error.code === 'user_already_exists') return 'Esta conta já existe. Entre ou recupere sua senha.';
  if (error.code === 'email_address_invalid') return 'Informe um e-mail válido.';
  return 'Não foi possível concluir. Tente novamente em alguns minutos.';
}

export function confirmationRedirect(invite: string | null, returnTo: string): string {
  const url = new URL('/auth', APP_ORIGIN);
  if (invite) url.searchParams.set('convite', invite);
  url.searchParams.set('retorno', returnTo);
  return url.toString();
}