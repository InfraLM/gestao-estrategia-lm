# Formulário semanal: envio único, lembrete, vínculos múltiplos, responsáveis e pendências acumuladas

## O que foi verificado no app hoje
- **Iniciativas:** guardam um único vínculo (indicador, além de OKR e objetivo). As iniciativas criadas pelo checkout exigem um indicador da própria cadeira.
- **Portfólio:** 152 projetos, com vínculo a objetivos BSC por código (ex. A.02, F.01). Os KRs estão quase sempre vazios e não há campo de KPI.
- **OKRs:** todos os 4 cadastrados são 2026/2.
- **Organograma:** 145 cargos com hierarquia e nome do ocupante, sem ligação com a cadeira do formulário.
- **Pendências de atas:** hoje chegam 182 ações, só dos comitês CEA, CES e MBX. Este app não filtra por comitê: a sincronização grava tudo o que a Governança exporta. A atribuição é pelo nome do responsável na ata, mapeado para as cadeiras.
- **Deliberações:** a área já existe. É a tela "Contexto e Decisões", e cada sincronização já publica as deliberações lá com código GOV. Hoje são 12, só de CEA e CES.
- **Prioridades herdadas:** já se acumulam por todas as semanas, mas só dentro das últimas 8 semanas carregadas.
- **Canais de aviso:** só o e-mail de convite de acesso, que não serve para lembretes. Existem tarefas agendadas no servidor, mas não há e-mail livre, WhatsApp nem notificações.

## Etapa 1 — Nomes, visões separadas e envio único
- **Nomes:** Checkout = perguntas 1–4 (retrospectiva da semana que passou). Check-in = prioridades da semana seguinte. Coincide com o tipo já gravado em cada registro, então nenhum dado muda.
- **Tela:** duas abas separadas, uma única Revisão com as pendências dos dois blocos e um único botão "Enviar ciclo" (ou "Reenviar ciclo").
- **Envio sem duplicar:** os dois registros são gravados juntos, com o mesmo código de envio e o mesmo horário. Se houver falha, nada é marcado como enviado, e a nova tentativa não repete iniciativas. O retrato dos KPIs congela nesse momento.
- **Prazo único:** o ciclo abre na sexta 00h, como hoje, e fecha na **segunda 23h59, horário de São Paulo**.
- **Selo único do ciclo:**
  - "Enviado" ou "Enviado · fora do prazo", conforme o primeiro envio do ciclo.
  - "Parcial" para ciclos antigos em que só um dos dois foi enviado.
  - Visão semanal e Painel de Metas passam a mostrar um selo por cadeira e ciclo.
- **AGENTS.md:** a regra do ciclo passa a dizer "envio único por ciclo, um prazo, dois registros gravados".

## Etapa 2 — Vínculos múltiplos em cada ação
- Cada entrega, plano de KPI "Não" e prioridade ganha quatro listas de seleção múltipla com busca:
  - BSC: todos os KPIs, de todas as cadeiras.
  - KRs: todos os de 2026/2.
  - Cesta: só a da cadeira que está preenchendo.
  - Projetos do portfólio.
- Escolher um projeto preenche os objetivos dele e sugere os KPIs de BSC desses objetivos; o diretor pode ajustar.
- O vínculo principal continua sendo gravado no campo único de hoje, então painéis, iniciativas em Metas e pendências de comitês não mudam. Os vínculos atuais são copiados como principais.
- KPI de outra cadeira só como vínculo secundário.

## Etapa 3 — Responsáveis
- "Diretor responsável": automático, sem edição.
- **"Responsável pela entrega":** substitui "Eu". A lista traz o diretor e os líderes um nível abaixo dele no organograma, e mantém "outra cadeira" e "pessoa de fora" (com e-mail protegido). Registros antigos com "Eu" mostram o diretor.
- **Ligação cargo ↔ cadeira:** cadastrada pela Governança na Estrutura Organizacional. Até lá, a lista mostra só o diretor.

## Etapa 4 — Pendências acumuladas no Check-in
- **Prioridades em aberto:** de todas as semanas anteriores, sem limite. Cada uma mostra a semana de origem e as opções Entregue / Em andamento / Não entregue, sem duplicar.
- **Pendências de atas:** mostram a origem (reunião, título e data da ata) e ficam no empilhamento até a baixa na Governança.
  - O diretor registra o próprio status (com comentário opcional), que é carregado para os ciclos seguintes.
  - "Entregue" vai para o fim da lista com o selo "Entregue · aguardando baixa na Governança". O item só some depois da baixa na Governança.
  - A Visão semanal mostra quantas pendências aguardam baixa por cadeira.
- **Atribuição:** pelo e-mail do responsável quando a Governança passar a enviá-lo; o nome fica como reserva. Até lá, segue pelo nome.
- **Deliberações:** todas as que a Governança exportar entram automaticamente em "Contexto e Decisões".

## Etapa 5 — Lembrete de sexta 8h
- Sem integração externa nova: **aviso no app** a partir de sexta 8h (São Paulo) para cada diretor com cadeira vinculada, até o envio do ciclo.
  - Faixa no topo das telas: "Formulário semanal do ciclo de dd/mm aberto — prazo segunda 23h59".
  - Contador no item "Rotina Semanal" do menu.
- É calculado na hora e não envia nada para fora, então nenhum lembrete de teste chega aos diretores reais.
- **Para um lembrete por e-mail, faltaria:** configurar um domínio de envio de e-mails e uma tarefa agendada para sexta 8h. Fica como próximo passo opcional.

## Pedido para o App Governança (não alterado daqui; o texto pronto será entregue ao fim da implementação)
1. Exportar ações de **todas as atas**, com tipo e nome da reunião, título e data da ata, responsável, prazo e status.
2. Exportar as **deliberações de todas as atas**, no formato atual.
3. Incluir o **e-mail do responsável** em cada ação.
4. Opcional: receber o status registrado pelo diretor. Hoje a integração segue só de leitura.

## Decisões tomadas
- Prazo único: segunda 23h59 (São Paulo); abertura sexta 00h.
- Lembrete: sexta 8h, como aviso no app.
- Atribuição das atas por e-mail quando disponível, com o nome como reserva.
- Projeto sugere KPIs de BSC pelo objetivo; organograma ligado à cadeira pela Governança; novo responsável substitui "Eu"; KPI de outra cadeira só como vínculo secundário.

## Detalhes técnicos
- `rotina_enviar_ciclo(cadeira, semana, token, conteudo_checkin, conteudo_checkout)` (security definer, com a mesma checagem de cadeira/Governança) grava os dois `mt_checkins` numa transação e chama o `rotina_criar_iniciativa` idempotente.
- `prazoCiclo(semana)` = segunda da semana do check-in, 23h59 em São Paulo. O selo é calculado na leitura pelo menor `primeiro_envio_em` dos dois registros, com compatibilidade para os antigos.
- Nova tabela `mt_acao_vinculos` (origem da ação, tipo de vínculo, referência, `principal`), com GRANTs e RLS como `mt_checkins` e cópia inicial dos vínculos únicos. `rotina_criar_iniciativa` ganha um parâmetro opcional de vínculos secundários.
- Coluna opcional `org_organograma_cargos.mt_cadeira_id`, editada só pela Governança.
- `gov_acoes` ganha a coluna opcional `responsavel_email`, preenchida pela sincronização quando a Governança enviar esse dado. `gov_acoes_da_cadeira` atribui pelo e-mail do diretor e, na falta dele, pelo nome mapeado, mantendo a checagem de acesso.
- Status do diretor nas atas: entra no JSON do checkout por `gov_acao_id` e é carregado do último envio.
- Hook `useLembreteCiclo` no AppLayout: cadeira do usuário, sem envio do ciclo e a partir de sexta 8h em São Paulo.
- `prioridadesHerdadas` passa a ler todos os check-ins anteriores da cadeira.
- Testes:
  - ciclo enviado de uma vez e reenvio sem duplicar;
  - prazo de segunda 23h59 e selo único com registros antigos;
  - empilhamento de mais de 8 semanas;
  - ata "entregue" que permanece na lista até a baixa;
  - aviso que aparece só a partir de sexta 8h.
