import type { TemplateEntry } from './registry.ts'
import { assunto, LayoutLM } from './layout-lm.tsx'

export const template = {
  component: LayoutLM,
  subject: assunto,
  displayName: 'Alerta de uso da IA',
  previewData: { subject: 'Alerta de uso da IA: Fulano atingiu 100, teto subiu para 150', titulo: 'Alerta de uso da IA', blocos: [{ tipo: 'p', texto: 'atingiu 100, teto subiu para 150.' }, { tipo: 'lista', itens: ['Pessoa: Fulano', 'Função: diagnostico-ai', 'Horário: 18/11/2026 15:00', 'Total de chamadas no dia: 101'] }] },
} satisfies TemplateEntry
