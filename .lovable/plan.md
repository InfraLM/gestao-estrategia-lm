## Objetivo

Substituir o toast simulado do botão "Gerar PDF" em `StatusReportProcessos.tsx` por geração real de arquivo, e adicionar exportações em Markdown, CSV e XLSX — respeitando os filtros aplicados (período, diretor, status) e centralizando a lógica em utilitários reutilizáveis.

## Dependências

- `xlsx` já está instalado (`^0.18.5`) — reutilizar.
- Adicionar `jspdf` e `jspdf-autotable` (mais leve e confiável que html2canvas em Vite/React; gera PDF vetorial com tabelas paginadas automaticamente, sem depender de renderização HTML offscreen).

## Arquivos novos

### `src/utils/exportUtils.ts`
Funções utilitárias puras e tipadas:
- `formatDateForFilename()` → string `YYYY-MM-DD`.
- `downloadBlob(blob, filename)` → cria `<a>` temporário e dispara download.
- `escapeCsvValue(v)` → escapa vírgula, aspas, quebras, null/undefined.
- `exportToCsv(filename, rows, columns?)` → gera CSV UTF-8 com BOM.
- `exportToXlsx(filename, sheets)` → aceita 1+ planilhas no mesmo workbook usando `xlsx`.
- `buildStatusReportMarkdown(payload)` → string `.md` com seções, metadados e tabelas markdown.
- `buildStatusReportHtml(payload)` → HTML estruturado (usado opcionalmente para preview/print).
- `exportStatusReportPdf(payload, filename)` → usa `jspdf` + `autoTable` para gerar PDF A4 paginado com cabeçalho, metadados, cards-resumo e tabelas de processos, riscos críticos e atrasos.

Tipo `StatusReportPayload` exportado com os dados consolidados (filtros, contagens, linhas, riscos, atrasos, séries mensais).

## Mudanças em `src/pages/StatusReportProcessos.tsx`

1. Substituir botão único "Gerar PDF" por um `DropdownMenu` "Exportar" com itens:
   - Gerar PDF (Status Report)
   - Exportar Markdown (.md)
   - Exportar Matriz (XLSX) — respeita filtros
   - Exportar Riscos (CSV)
   - Exportar Planos de Ação (XLSX)
2. Estado local `exporting` para desabilitar o botão e mostrar spinner durante geração.
3. Cada handler:
   - Monta payload a partir de `linhas`, `counts`, `riscosCriticos`, `atividadesAtraso`, `aguardandoValidacao`, filtros (`periodo`, `diretorFilter`, `statusFilter`).
   - Chama o utilitário correspondente envolto em `try/catch`.
   - Toast de sucesso apenas após retorno bem-sucedido; toast de erro em caso de exceção.
4. Nomes de arquivo padronizados:
   - `status-report-processos-YYYY-MM-DD.pdf|.md`
   - `matriz-processos-YYYY-MM-DD.xlsx`
   - `riscos-processos-YYYY-MM-DD.csv`
   - `planos-acao-processos-YYYY-MM-DD.xlsx`

## Layout do PDF (jspdf + autoTable)

- A4 retrato, margens 14mm.
- Cabeçalho: título "Status Report de Processos — BPMO", data de geração, período, filtros aplicados.
- Bloco de cards-resumo (On-Track / Alerta / Off-Track) como mini-tabela.
- Tabelas (com quebra de página automática):
  1. Processos filtrados (ID, Nome, Diretor, Status, Maturidade, Completude, Farol).
  2. Aguardando validação/aprovação.
  3. Riscos críticos (score ≥ 15).
  4. Atividades/planos atrasados (com dias de atraso).
- Rodapé com numeração `Página X / Y`.

## Cuidados técnicos

- Tipagem explícita em todos os utilitários.
- Tratar valores ausentes (`?? "—"`, `?? 0`).
- Nenhuma alteração de business logic — apenas leitura dos dados já calculados.
- Não tocar em `StatusReport.tsx` (escopo do pedido é Processos).
- Reutilizar `src/lib/exportCsv.ts` existente? Ele só faz XLSX; manteremos para compatibilidade, mas as novas exportações usarão `exportUtils.ts` para multi-sheet e CSV verdadeiro.

## Critérios de aceite (mapeados ao pedido)

- ✅ Botão gera arquivo PDF real (jspdf).
- ✅ Toast só após sucesso real; toast de erro em falha.
- ✅ Export Markdown disponível.
- ✅ Matriz/Riscos/Planos em CSV e XLSX.
- ✅ Filtros (período, diretor, status) respeitados.
- ✅ Nomes com data padronizados.
- ✅ Lógica centralizada em `src/utils/exportUtils.ts`.
- ✅ Build não quebra (TS estrito, imports limpos).
