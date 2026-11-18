import type { ComponentType } from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome.tsx'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
import { template as avisoCiclo } from './aviso-ciclo.tsx'
import { template as impedimentoRecebido } from './impedimento-recebido.tsx'
import { template as conviteQuickWins } from './convite-quick-wins.tsx'
import { template as alertaUsoIa } from './alerta-uso-ia.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'aviso-ciclo': avisoCiclo,
  'impedimento-recebido': impedimentoRecebido,
  'convite-quick-wins': conviteQuickWins,
  'alerta-uso-ia': alertaUsoIa,
}
