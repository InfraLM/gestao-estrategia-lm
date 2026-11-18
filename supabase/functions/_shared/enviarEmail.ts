// Single e-mail path of the app: Lovable Emails (notifylv.liberdademedicaedu.com.br) via the scaffolded send helper.
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.8.0'
import { sendTemplateEmail } from './transactional-email-templates/send-email.ts'
import { falhaTemporaria, type DadosEmail } from './avisosEmail.ts'

/** Carries whether retrying later can succeed (429/5xx/network) or not (suppressed, invalid address). */
export class ErroEnvio extends Error {
  constructor(message: string, readonly temporaria: boolean) { super(message); }
}

export const REMETENTE_EMAIL = 'noreply@notifylv.liberdademedicaedu.com.br'

export async function enviarEmail(modelo: string, para: string, dados: DadosEmail, chave: string): Promise<void> {
  try {
    const r = await sendTemplateEmail(modelo, para, { templateData: dados, idempotencyKey: chave })
    if (!r.sent) throw new ErroEnvio('Destinatário bloqueado (descadastrado ou e-mail devolvido)', false)
  } catch (e) {
    if (e instanceof ErroEnvio) throw e
    if (e instanceof EmailAPIError) throw new ErroEnvio(`Lovable Emails ${e.status ?? ''} ${e.code ?? ''}: ${e.message}`.slice(0, 400), falhaTemporaria(Number(e.status ?? 0)))
    throw new ErroEnvio(`Envio indisponível: ${(e as Error)?.message ?? e}`.slice(0, 400), true)
  }
}
