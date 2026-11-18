import type { TemplateEntry } from './registry.ts'
import { assunto, LayoutLM } from './layout-lm.tsx'
import { montarConviteQuickWins } from '../avisosEmail.ts'

export const template = {
  component: LayoutLM,
  subject: assunto,
  displayName: 'Convite Quick Wins',
  previewData: montarConviteQuickWins({ ano: 2026, prazo: "2026-11-30" }).dados,
} satisfies TemplateEntry
