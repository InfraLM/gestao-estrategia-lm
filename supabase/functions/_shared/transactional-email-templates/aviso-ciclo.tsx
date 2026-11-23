import type { TemplateEntry } from './registry.ts'
import { assunto, LayoutLM } from './layout-lm.tsx'
import { montarEmail } from '../avisosEmail.ts'

export const template = {
  component: LayoutLM,
  subject: assunto,
  displayName: 'Aviso do ciclo semanal',
  previewData: montarEmail({ nome: "Naira", ciclo: "2026-11-09", tipo: "abertura", pendencias: { prioridades: 5, kpis: 3, atas: 1, status_reports: 0 } }).dados,
} satisfies TemplateEntry
