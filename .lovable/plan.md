# Pedidos da Naira — padronização, OKRs, Lançamentos, transparência e relatório com IA

Seis etapas, na ordem 0 → 5. Cada etapa é entregue e conferida antes da próxima.

## Etapa 0 — "Yuri Ribeiro" vira "Yuri Garcia"

O que foi encontrado:
- Banco: 30 projetos (campos de diretor/responsável/textos). Nenhuma ocorrência em cadeiras, indicadores, organograma, fichas, ações da Governança, conteúdo editável, decisões e iniciativas.
- Telas e dados fixos do app: árvore BSC Rev.02 (1), Melhorias (1), lista de processos (3), dados de exemplo (37 em mockData, 7 em repositório de exemplo).

Antes de alterar: uma lista com cada projeto (código, campo, valor atual → novo) para a Naira conferir. Depois, troca só desse texto, sem mexer em status, cadeira ou outros campos. Os registros de Contexto e Decisões e das respostas dos Sócios não são tocados (não há ocorrências).

Decisão: trocar também nos dados de exemplo (mockData/repositório), que aparecem em telas antigas? Proposta: sim.

## Etapa 1 — pendências do último passo

- OKRs do Semestre: em cada KR, bloco "Iniciativas e projetos vinculados", o mesmo bloco já usado em Iniciativas por vínculo.
- Cesta de Metas: o mesmo bloco em cada item da cesta.
- Painel da Governança: contador "status reports pendentes no mês" por cadeira (projetos abertos da cadeira principal sem status report no último ciclo do mês).
- AGENTS.md: o arquivo raiz fica só com regras gerais e uma linha apontando para notas por pasta. Novos arquivos: `src/pages/AGENTS.md` (rotina semanal, metas, projetos, sócios), `supabase/AGENTS.md` (Governança, RLS, funções), `src/components/AGENTS.md` (menu lateral: o mesmo menu serve desktop e celular, restaurando a regra removida). Nenhuma regra é apagada, só movida.

## Etapa 2 — espaço "OKRs" com 4 listas

Menu final: OKRs do Semestre · Cesta de Metas · Lançamentos · Insights.

Para onde vai cada função atual:

| Hoje | Passa para |
|---|---|
| Cadastros › OKRs/KRs e metas mensais dos KRs | OKRs do Semestre › aba "Cadastro" |
| Cadastros › Cesta (indicadores, pesos com vigência, metas mensais) | Cesta de Metas › aba "Cadastro" |
| Cadastros › Árvore de KPIs BSC e objetivos | Espaço Estratégia › Estratégia LM, aba "Cadastro BSC" |
| Cadastros › Cadeiras, usuários/convites | Gestão de usuários (menu do perfil), nova seção "Cadeiras" |
| Cadastros › Iniciativas | Iniciativas por vínculo (PMO) |
| Cadastros › Parâmetros de faixas | Lançamentos › aba "Configuração" (só Governança) |
| Lançamento mensal | Lançamentos › aba "Lançar mês" |
| Painel da Governança (notas, faixas, envios, fechar/reabrir mês) | Lançamentos › aba "Painel" |
| Insights da Cesta | Insights (renomeado) |

Links antigos `/metas/cadastros`, `/metas/painel`, `/metas/lancamento` redirecionam para a aba equivalente. As regras de edição continuam as mesmas (cadastro só Governança; lançamento só a própria cadeira).

Decisão: a parte de cadeiras ficar em Gestão de usuários ou na Estrutura organizacional? Proposta: Estrutura organizacional, junto da ligação cargo ↔ cadeira que já existe.

## Etapa 3 — matriz consolidada em "Lançamentos"

- Grupos: KPI estratégico · KPI tático · OKR/KR · Cesta de metas.
- Linhas = indicadores; colunas = meses (padrão) ou semanas (alternância).
- Célula: valor/situação, meta, farol e origem (lançado / checkout de dd/mm / árvore). Usa a mesma regra única de avaliação (`avaliarKpiBsc`), então bate com formulário, Painel e Visão semanal.
- Na visão por semana, o valor é a situação numérica do checkout enviado daquela semana; meta é a do mês da semana.
- KR e cesta: realizado lançado contra meta mensal; antes do fim do mês "Em acompanhamento".
- Filtros: cadeira/diretor, período (de–até), grupo.
- Cores: Off track em vermelho; desvio crítico em vermelho escuro com ícone.

Decisão — critério de "desvio crítico" (escolher um ou combinar):
- A. Off track em 2 ou mais períodos seguidos.
- B. Atingimento abaixo de X% da meta (sugestão 70%).
- C. Off track com risco aberto ligado ao indicador (riscos da rotina) ou plano de ação "Não" sem iniciativa.
Proposta: A ou B, com C como marcador adicional.

## Etapa 4 — transparência para todos os diretores

O que todos os diretores passam a ver, de todas as cadeiras:
- a. Matriz consolidada (etapa 3).
- b. Status do ciclo de cada cadeira (enviado / fora do prazo / parcial / pendente).
- c. Farol de status report.
- d. Novo painel "Objetivos, OKRs e Cesta": cadastros vigentes, metas, situação registrada e farol.

Decisão (b) — conteúdo ou só status:
- Opção 1: só status. Opção 2: status + conteúdo (KPIs, entregas, riscos, prioridades) em leitura.
- Proposta: opção 2, sem e-mails/contatos de pessoas de fora, sem comentários das atas reservadas e sem anexos.

Conflitos com regras atuais:
- A avaliação BSC hoje é "diretor vê só a própria cadeira" (regra registrada). Passa a ser "todos os diretores veem todas"; a regra é reescrita.
- Leitura dos checkins no banco já é aberta a qualquer usuário logado; a restrição é só nas telas. Proposta: fechar no banco para "diretor com cadeira, Governança ou CEO" (hoje qualquer login corporativo lê), e abrir nas telas para esses perfis.
- Continua restrito: edição só da própria cadeira; anexos de status report (cadeira principal, Governança, CEO); contatos externos (`mt_rotina_contatos`); respostas dos Sócios; notas de cadeiras de outros diretores continuam visíveis? — ver decisão abaixo.

Decisões:
- Perfil "leitura" (usuário sem cadeira) vê esses painéis? Proposta: não, só se tiver acesso de visualização ao módulo OKRs dado no controle de acessos.
- A nota mensal de cada cadeira (Painel) também fica visível a todos os diretores? Proposta: sim no painel (d), sem auditoria de edição.

## Etapa 5 — relatório mensal e diagnóstico com IA

Situação atual: o Diagnóstico Estratégico é uma tela com conteúdo fixo e campos editáveis (PESTEL, Porter, VRIN, Oceano Azul, SWOT, Ansoff) e já existe uma função de IA de diagnóstico que grava sugestões em `diagnostico_insights` (hoje com 0 registros). Não há controle de revisões.

O que construir:
- Tabela de revisões (relatório e diagnóstico): número, tipo, competência, status (rascunho / aprovado / substituído), conteúdo, fontes citadas, quem gerou, quem aprovou e quando.
- Botão "Gerar rascunho" (só Governança). A IA recebe: decisões D-NNN, SR e GOV do período; lançamentos e notas; matriz de apontamentos; resumo dos checkouts enviados (sem contatos externos); farol de status report; diagnóstico vigente.
- Contra invenção: cada afirmação traz o código da fonte (D-012, SR-…, GOV-…, KPI, mês). O app confere os códigos citados; afirmação sem fonte válida aparece marcada "sem fonte" e bloqueia a aprovação até ser editada ou removida.
- Naira edita, compara com a revisão anterior (diferenças lado a lado) e aprova; só então vira vigente. Versões antigas ficam somente leitura.
- Periodicidade: mensal, gerado manualmente após o fechamento do mês (sem geração automática).

IA: modelos do Lovable AI já usados no projeto (Gemini), sem chave externa. Custo: uma chamada grande por geração, cobrada do saldo do workspace; limite de uso por minuto pode exigir tentar de novo. Proposta: limitar a 3 gerações por mês por tipo.

Decisões:
- Respostas e insights dos Sócios entram como entrada? Proposta: não (confidenciais).
- Diagnóstico atualiza todas as ferramentas de uma vez ou por ferramenta? Proposta: por ferramenta, mesmo fluxo de aprovação.

## Riscos

- Abrir checkouts a todos expõe textos que os diretores escreveram achando que eram privados; avisar antes de ligar.
- Matriz semanal com todas as cadeiras pode ficar pesada; carregamento por período filtrado.
- Mover cadastros pode confundir quem usa os links antigos; redirecionamentos e aviso por um ciclo.

## Detalhes técnicos

- Etapa 0: UPDATE só em colunas de texto dos 30 projetos, com prévia em SELECT; edição de JSON fixos.
- Etapa 2: rotas antigas → `<Navigate>` com `?aba=`; `moduleForPath` e testes de acesso atualizados.
- Etapa 3: função pura de matriz em `src/lib` com testes (mesmo KPI, mesma competência = mesmo farol que `avaliarKpiBsc`; critério de desvio crítico escolhido).
- Etapa 4: nova política de leitura em `mt_checkins`/avaliação; `cadeirasVisiveisBsc` passa a devolver todas para diretores; testes de que diretor não edita outra cadeira e não lê contatos externos.
- Etapa 5: tabela `planejamento_revisoes` com RLS (leitura Governança/CEO/diretores aprovados, escrita Governança); função de borda gera rascunho com Lovable AI e validação de códigos citados.
