## Objetivo
Gerar um único arquivo **`BPMO_Documentacao.docx`** em `/mnt/documents/` reunindo toda a parte do BPMO do app, pronto para download.

## Escopo do BPMO (páginas/arquivos a incluir)
- `src/pages/MatrizProcessos.tsx` — Matriz de Processos
- `src/pages/GestaoProcessos.tsx` — Gestão de Processos (escopo, KPIs, riscos, planos)
- `src/pages/DashboardProcessos.tsx` — Dashboard BPMO
- `src/pages/StatusReportProcessos.tsx` — Status Report de Processos
- `src/pages/MatrizRiscosInstitucionais.tsx` — Matriz de Riscos
- `src/pages/CadeiaValor.tsx` e `src/pages/GerenciarCadeia.tsx` — Cadeia de Valor
- `src/components/DiretoresMultiSelect.tsx` — multi-seleção de diretores
- `src/components/UploadRiscosInstitucionais.tsx`
- `src/hooks/useProcessosDB.ts`, `src/hooks/useRiscosInstitucionaisDB.ts`
- `src/lib/bpmoRisco.ts`
- `src/data/processos.json` (referência de seed — incluir apenas amostra)

## Estrutura do .docx
1. **Capa** — título, data, projeto.
2. **Sumário** (TOC).
3. **Visão geral do BPMO** — propósito do módulo e rotas (`/matriz-processos`, `/gestao-processos`, `/dashboard-processos`, `/status-report-processos`, `/matriz-riscos`).
4. **Funcionalidades por página** — para cada arquivo acima: descrição, principais ações do usuário, filtros, exports, integrações (Supabase, IA, multi-diretor, etc.).
5. **Esquema de dados** — tabela `processos` (21 colunas) com tipos, e tabelas auxiliares relevantes (`riscos_institucionais`). Obtido via `supabase--read_query` (`information_schema.columns`).
6. **Código-fonte** — uma seção por arquivo, com cabeçalho (caminho) e o conteúdo completo do `.tsx`/`.ts` em bloco mono-espaçado (fonte Consolas, tamanho reduzido, `pageBreakBefore` por arquivo).
7. **Apêndice** — lista de rotas no `App.tsx` ligadas ao BPMO e item do menu em `AppLayout.tsx`.

## Como será gerado (técnico)
- Script Node usando `docx` (já em `package.json` via export utils? caso contrário `npm i -g docx`) em `/tmp/gen_bpmo.js`.
- Lê os arquivos listados via `fs.readFileSync`.
- Consulta o schema da tabela `processos` no Supabase para listar colunas/tipos atualizados.
- US Letter, margens 1", Arial 11pt, código em Consolas 8pt, TOC com `HeadingLevel`.
- Salva em `/mnt/documents/BPMO_Documentacao.docx` e entrega via `<presentation-artifact>`.

## Entrega
Mensagem final com o componente `<presentation-artifact path="BPMO_Documentacao.docx" mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"></presentation-artifact>` para download direto.