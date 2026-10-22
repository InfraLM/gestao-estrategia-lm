# Pedidos da Naira — versão final aprovada

Implementação na ordem 0 → 5, cada etapa conferida antes da próxima.

## Etapa 0 — "Yuri Ribeiro" vira "Yuri Garcia" (aplicar direto)

Prévia da troca no banco — só o campo "diretor" de 30 projetos, valor "Yuri Ribeiro" → "Yuri Garcia":
P011, P018, P020, P021, P022, P026, P028, P029, P033, P039, P041, P044, P049, P057, P067, P075, P076, P078, P080, P089, P090, P094, P099, P102, P109, P119, P121, P122, P123, P125.

Nenhuma ocorrência em cadeiras, indicadores, organograma, fichas, ações da Governança, conteúdo editável, decisões, iniciativas e respostas dos Sócios.

Dados fixos do app: árvore BSC Rev.02 (1), Melhorias (1), lista de processos (3), dados de exemplo (37 + 7). Todos trocados.

Nada além do nome muda (status, cadeira e demais campos ficam iguais).

## Etapa 1 — pendências do último passo

- OKRs do Semestre: bloco "Iniciativas e projetos vinculados" em cada KR.
- Cesta de Metas: o mesmo bloco em cada item.
- Painel da Governança: "status reports pendentes no mês" por cadeira.
- AGENTS.md dividido: raiz com regras gerais; notas em `src/pages/AGENTS.md`, `supabase/AGENTS.md` e `src/components/AGENTS.md` (restaura a regra do menu lateral). Nenhuma regra apagada.

## Etapa 2 — espaço "OKRs" com 4 listas

Menu: OKRs do Semestre · Cesta de Metas · Lançamentos · Insights.

| Hoje | Passa para |
|---|---|
| Cadastros › OKRs/KRs e metas | OKRs do Semestre › aba "Cadastro" |
| Cadastros › Cesta (indicadores, pesos com vigência, metas) | Cesta de Metas › aba "Cadastro" |
| Cadastros › Árvore de KPIs BSC e objetivos | Estratégia LM › aba "Cadastro BSC" |
| Cadastros › Cadeiras | Estrutura organizacional › seção "Cadeiras" |
| Usuários/convites | Gestão de usuários (sem mudança) |
| Cadastros › Iniciativas | Iniciativas por vínculo (PMO) |
| Cadastros › Parâmetros de faixas | Lançamentos › aba "Configuração" (Governança) |
| Lançamento mensal | Lançamentos › aba "Lançar mês" |
| Painel da Governança | Lançamentos › aba "Painel" |
| Insights da Cesta | Insights |

Links antigos redirecionam para a aba equivalente. Regras de edição sem mudança.

## Etapa 3 — matriz consolidada em "Lançamentos"

- Grupos: KPI estratégico · KPI tático · OKR/KR · Cesta.
- Linhas = indicadores; colunas = meses ou semanas.
- Célula: valor/situação, meta, farol e origem. Mesma regra única de avaliação das outras telas.
- Filtros: cadeira/diretor, período, grupo.
- Cores: Off track = vermelho. Desvio crítico = vermelho escuro com ícone, quando as duas condições valem juntas: off track em 2+ períodos seguidos E atingimento abaixo de 70% da meta.
- Ícone separado de alerta quando houver risco aberto ligado ao indicador ou plano "Não" sem iniciativa.

## Etapa 4 — transparência entre diretores

- Novo interruptor "Transparência entre diretores", só a Governança liga; começa DESLIGADO. Quem ligou/desligou e quando fica na auditoria.
- Sempre visível a todos os diretores: matriz consolidada, status do ciclo de cada cadeira, farol de status report, painel de Objetivos/OKRs/Cesta (metas, situação e farol).
- Com o interruptor ligado: também o conteúdo dos formulários semanais das outras cadeiras em leitura (KPIs, entregas, riscos, prioridades). Ao ligar, cada diretor vê um aviso no app: "o conteúdo do formulário semanal passa a ser visível para todos os diretores", e o formulário mostra essa frase fixa.
- Sempre protegido: contatos de pessoas de fora, anexos de status report, comentários reservados, edição só da própria cadeira, respostas dos Sócios.
- Nota mensal: só Governança, CEO e a própria cadeira (outros diretores não a veem no painel).
- Perfil "leitura" só vê com acesso ao módulo OKRs no controle de acessos.
- Leitura dos formulários semanais no banco fechada para diretor com cadeira, Governança e CEO.

## Etapa 5 — relatório mensal e diagnóstico com IA

- Tabela de revisões (relatório e diagnóstico por ferramenta): número, data, status (rascunho / aprovado / substituído), conteúdo, fontes, quem gerou e quem aprovou.
- Botão "Gerar rascunho" só para a Governança, manual após o fechamento do mês; limite de 3 gerações por mês por tipo.
- Entradas: decisões D-NNN, SR e GOV, lançamentos e notas, matriz, checkouts enviados (sem contatos), farol de status report, diagnóstico vigente. Respostas dos Sócios ficam de fora.
- Cada afirmação cita o código da fonte; o app confere os códigos e marca "sem fonte" o que não confere, bloqueando a aprovação até ajuste.
- Naira edita, compara com a revisão anterior lado a lado e aprova; só então vira vigente. Diagnóstico revisado por ferramenta (PESTEL, Porter, VRIN, Oceano Azul, SWOT, Ansoff), cada uma com aprovação própria. Versões antigas somente leitura.
- IA: Lovable AI (Gemini), sem chave externa; custo pelo saldo do workspace.

## Riscos

- Volume da matriz semanal com todas as cadeiras: carga por período filtrado.
- Mudança de lugar dos cadastros: redirecionamentos dos links antigos.

## Detalhes técnicos

- Etapa 0: UPDATE `projetos.diretor` nos 30 códigos; edição dos JSON/TS fixos.
- Etapa 2: rotas antigas → `<Navigate>` com `?aba=`; `moduleForPath` e testes de acesso.
- Etapa 3: função pura de matriz e desvio crítico em `src/lib`, com testes (70%, 2 períodos, mesmo farol que `avaliarKpiBsc`).
- Etapa 4: tabela de configuração `transparencia_diretores` + auditoria; política de leitura de `mt_checkins` (cadeira, Governança, CEO; conteúdo de outras cadeiras só com interruptor ligado via função de leitura); testes de edição, contatos e nota.
- Etapa 5: tabela `planejamento_revisoes` com RLS (escrita Governança); função de borda com Lovable AI, contagem mensal e validação de códigos citados.
