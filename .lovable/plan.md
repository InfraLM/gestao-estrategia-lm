# Iniciativas e projetos empilhados, status report mensal, farol e atualização do portfólio

## Situação hoje (conferida no banco)
- 152 projetos. 128 têm algum texto em "diretor", mas em 18 grafias diferentes, que misturam nome de pessoa ("Yuri Ribeiro", "Bruno Garcia") com cargo ("CTO", "Dir. Operações", "CTO + Dir. Acadêmica"). 24 não têm diretor nenhum.
- Nenhum projeto está ligado a uma cadeira: o vínculo é só pelo nome. Das 8 cadeiras, apenas CEO (Ian) e Governança (Naira) têm diretor vinculado. As demais 6 estão sem usuário, e isso continua pendente.
- Vínculos dos projetos: 10 têm objetivo BSC, 0 têm KR, nenhum tem KPI ou cesta.
- Vínculos múltiplos das iniciativas: 0 registros até agora. O formulário novo ainda não foi enviado.
- Status report: 0 registros. Hoje ele fica no lançamento mensal (Metas), com saúde geral, % do cronograma e custo, mas não tem farol de escopo/custo/cronograma.
- Onde as iniciativas aparecem hoje: em lugar nenhum por vínculo. Na ficha do projeto existe a aba Status Report, mas sem iniciativas. OKRs, Cesta e a árvore do BSC não listam iniciativas.

## Etapas (5)

### Etapa 1 – Responsável e vínculos de impacto do projeto (base para o resto)
- Cada projeto ganha uma **cadeira responsável** e **vínculos de impacto múltiplos** (objetivo BSC, KPI BSC, KR 2026/2, item de cesta), no mesmo formato dos vínculos de ação.
- **Uso dos dados atuais:** os 10 objetivos existentes viram vínculos. O "diretor" em texto é só uma *sugestão* de cadeira e não é gravado automaticamente.
- **Fila da Governança:** projetos sem cadeira confirmada ficam numa lista. A Naira atribui a cadeira e o diretor confirma no primeiro status report.
- **Quem preenche os vínculos:** o diretor da cadeira (nos projetos dele) e a Governança (em todos).

### Etapa 2 – Empilhamento de iniciativas e projetos
Um único bloco reaproveitável, "Iniciativas e projetos vinculados", mostra: status, prazo, responsável pela entrega, cadeira, origem ("checkout de 12/10", "Metas") e atrasadas em destaque (atraso calculado na leitura). Ele aparece em:
- Ficha do projeto (nova aba "Iniciativas").
- OKRs do semestre, ao abrir um KR.
- Cesta de metas, ao abrir um item.
- Árvore BSC / Impacto Estratégico: no objetivo e no KPI. O objetivo junta os vínculos dos seus KPIs.

Os projetos aparecem empilhados no KR, na cesta, no KPI e no objetivo pelos vínculos da Etapa 1.

### Etapa 3 – Status report no último ciclo do mês
- **Definição proposta:** o último apontamento do mês M é o ciclo cujo checkout retrata a última semana com domingo em M.
  - Outubro/2026: o último domingo é 25/10. O ciclo do check-in de 26/10 tem checkout de 19 a 25/10. Abre na sexta 23/10 e vence na segunda 26/10 às 23h59.
  - Novembro/2026: o último domingo é 29/11. O ciclo do check-in de 30/11 tem checkout de 23 a 29/11. Abre na sexta 27/11 e vence na segunda 30/11.
- Nesse ciclo, o checkout ganha a etapa "Status report dos projetos". Ela lista os projetos **em aberto** da cadeira (sem Concluído e Cancelado) e pede, para cada um:
  - anexo;
  - farol de escopo, custo e cronograma;
  - comentário;
  - no primeiro report, a confirmação de situação: em andamento / concluído / suspenso / cancelado / "não é meu".
- **Proposta para o anexo:** a falta de anexo vira pendência visível na Revisão e no Painel, mas **não bloqueia** o envio, para não travar KPIs e prioridades. A alternativa é bloquear. Precisa de decisão.
- **Onde guardar:** no mesmo cofre privado de arquivos que já existe para status report, com acesso restrito à própria cadeira, à Governança e ao CEO. O histórico fica um por projeto por mês; reenvio no mesmo mês substitui e guarda o anterior.
- O formulário mensal de Metas deixa de pedir o status report, para não ser pedido em dobro. Precisa de decisão.

### Etapa 4 – Farol "Status Report" e tomada de decisão
- Nova tela com todos os 152 projetos, nas colunas escopo / custo / cronograma (verde, amarelo, vermelho ou sem apontamento), mais mês do último apontamento, cadeira/diretor e link para o anexo. Tem filtros por cadeira, farol e "com desvio".
- Projetos com algum amarelo ou vermelho recebem a marcação "Decisão pendente".
- Opções de decisão:
  - Manter com aceite de desvios e projeções.
  - Manter com ajustes.
  - Encerrar.
  - **Sugestões para decidir (não serão incluídas sem aprovação):** "Suspender" e "Replanejar (nova linha de base)".
- Cada decisão registra quem decidiu, quando, justificativa e as projeções/ajustes aceitos. Ela entra em "Contexto e Decisões" com código próprio (proposta: `SR-AAAAMM-<projeto>`), separado dos D-NNN e GOV.
- "Encerrar" muda o status do projeto para Cancelado ou Concluído (qual dos dois precisa de decisão), com registro de quem mudou.
- **Quem decide (proposta):** Governança e CEO. O diretor vê a decisão dos seus projetos.

### Etapa 5 – Primeira atualização do portfólio
- Lista de conferência inicial para a Naira: os 128 projetos com nome sugerido de cadeira (ela confirma em lote) e os 24 sem diretor (fila).
- O status só muda pela confirmação do diretor no status report (Etapa 3) ou por decisão (Etapa 4), nunca de forma automática.

## Decisões necessárias
1. Falta de anexo: bloqueia o envio ou só gera pendência (proposta: pendência).
2. Tirar o status report do formulário mensal de Metas (proposta: sim).
3. Incluir "Suspender" e/ou "Replanejar" nas decisões.
4. "Encerrar" grava o projeto como Cancelado ou Concluído.
5. Quem registra decisões (proposta: Governança e CEO).
6. Projetos "CTO + Dir. Acadêmica" (dupla responsabilidade): uma cadeira principal e outra como apoio, ou só uma.
7. Projetos "Pausado/Backlog/A Iniciar" contam como "em aberto" e exigem status report (proposta: Em Andamento, Atrasado, Pausado e A Iniciar sim; Backlog não).
8. Vínculos atuais dos projetos (listas de texto): continuam sendo atualizados ou viram somente leitura (proposta: o novo modelo vira a referência e os antigos ficam como histórico).

## Conflitos com regras atuais
- O status report já existe no lançamento mensal (regra registrada). A mudança desloca o pedido para o checkout.
- Diretores sem usuário vinculado (6 cadeiras): sem isso, apenas a Governança e o CEO conseguem enviar. Isso continua pendente.
- Os checkouts são lidos por qualquer usuário logado. O empilhamento vai mostrar só iniciativas e projetos, não o texto dos checkouts, para não ampliar o que cada um já vê hoje.

## Riscos
- **Acesso aos anexos:** o cofre de arquivos precisa de regras por cadeira; hoje o acesso é pelo caminho do projeto. Será revisado para cadeira + Governança + CEO.
- **Volume (152 projetos):** a conferência inicial precisa ser feita em lote. No ciclo de outubro, um diretor pode ter até 30 projetos, o que pede um formulário compacto, com cada projeto recolhido por padrão.
- **Nomes inconsistentes:** "Yuri Ribeiro" e "Iuri Eloi Franco" podem confundir a sugestão. Por isso nada é gravado sem confirmação.
- **Prazo:** o ciclo de outubro vence em 26/10. As Etapas 1 e 3 precisam estar prontas antes, senão o primeiro status report fica para novembro.

## Detalhes técnicos
- Nova tabela de vínculos do projeto (projeto, tipo, ref_id) com RLS: escreve a Governança ou a cadeira do projeto; lê qualquer usuário logado. Adiciona a coluna de cadeira responsável em `projetos`, sem ser obrigatória e sem preenchimento automático.
- Leitura do empilhamento: o vínculo principal da iniciativa (`indicador_id`/`okr_id`/`objetivo_id`) junto com `mt_acao_vinculos`, mais os vínculos de projeto. Tudo numa função compartilhada, com teste.
- `mt_status_projetos` ganha as colunas farol_escopo, farol_custo, farol_cronograma, comentario, confirmacao_status e o ciclo de origem, sem mudança que quebre o que já existe. Os reenvios vão para um histórico.
- Função `ultimoCicloDoMes(semana)` em `rotinaSemanal.ts`, com testes para out/nov 2026.
- Tabela de decisões de projeto com RLS (registram Governança e CEO). "Contexto e Decisões" passa a ler essas decisões também, sem alterar `decisoes_estrategicas`.
- Testes: definição do último ciclo, quais projetos contam como "em aberto", farol com desvio, atraso calculado e permissão para decidir.
