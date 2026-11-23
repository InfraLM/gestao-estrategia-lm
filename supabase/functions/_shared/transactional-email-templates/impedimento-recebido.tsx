import type { TemplateEntry } from './registry.ts'
import { assunto, LayoutLM } from './layout-lm.tsx'
import { montarImpedimento } from '../avisosEmail.ts'

export const template = {
  component: LayoutLM,
  subject: assunto,
  displayName: 'Impedimento recebido',
  previewData: montarImpedimento({ nome: "Naira", ciclo: "2026-11-09", pendencias: { cadeira_origem: "COO", quem_sinalizou: "Yuri", prazo_desejado: "2026-11-20" } }).dados,
} satisfies TemplateEntry
