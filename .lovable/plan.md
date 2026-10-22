# Formulário semanal: envio único, vínculos múltiplos, responsáveis e pendências acumuladas

## O que foi verificado no app hoje
- **Iniciativas:** guardam um único vínculo (indicador, além de OKR e objetivo). As iniciativas criadas pelo checkout exigem um indicador da própria cadeira.
- **Portfólio:** 152 projetos, com vínculo a objetivos BSC por código (ex. A.02, F.01). Os KRs estão quase sempre vazios e **não há campo de KPI**.
- **OKRs:** todos os 4 cadastrados são 2026/2.
- **Organograma:** 145 cargos com hierarquia e nome do ocupante, sem usuário nem e-mail, e **sem ligação com a cadeira do formulário**.
- **Pendências de atas:** hoje chegam 182 ações, só dos comitês CEA, CES e MBX. **Este app não filtra por comitê:** a sincronização grava tudo o que a Governança exporta, então a limitação está no que a Governança envia. A atribuição é pelo **nome do responsável na ata**, mapeado para as cadeiras.
- **Deliberações:** **a área já existe.** É a tela "Contexto e Decisões", e cada sincronização já publica as deliberações lá com código GOV. Hoje são 12, só de CEA e CES.
- **Prioridades herdadas:** já se acumulam por todas as semanas, mas só dentro da janela carregada (8 semanas).

## Etapa 1 — Nomes, visões separadas e envio único
- **Nomes:** Checkout = perguntas 1–4 (KPIs, entregas, riscos, reuniões), a retrospectiva da semana que passou. Check-in = prioridades da semana seguinte. Coincide com o que está gravado hoje (tipo `checkout` = retrospectiva, tipo `checkin` = prioridades), então **nenhum dado muda** e não há inversão.
- **Tela:** as duas visões ficam em abas separadas. A Revisão passa a ser uma só, com as pendências dos dois blocos, e um único botão "Enviar ciclo" (ou "Reenviar ciclo").
- **Envio sem duplicar:** o botão grava os dois registros juntos, com o mesmo código de envio e o mesmo horário. Se um falhar, nenhum aparece como enviado e o diretor pode tentar de novo sem criar iniciativas repetidas (o código é reaproveitado no reenvio). O retrato dos KPIs congela nesse mesmo momento.
- **Selo único do ciclo:**
  - "Enviado" quando os dois registros foram enviados.
  - "Enviado · fora do prazo" se o primeiro envio do ciclo passou do prazo único.
  - "Parcial" para ciclos antigos em que só um dos dois foi enviado.
  - Visão semanal e Painel de Metas passam a mostrar um selo por cadeira e ciclo, no lugar dos dois atuais.
- **Opções de prazo único (a Naira escolhe):**
  - **A. Sexta 18h da semana retratada.** Atenção: o ciclo novo abre na sexta 00h, então haveria só 18 horas para preencher.
  - **B. Segunda 12h da semana do check-in.** Dá cerca de 3,5 dias depois da abertura, e as prioridades são declaradas no início da semana.
- **AGENTS.md:** a regra do ciclo passa a dizer "envio único por ciclo, um prazo, dois registros gravados".

## Etapa 2 — Vínculos múltiplos em cada ação
- Cada entrega, plano de KPI "Não" e prioridade ganha quatro listas de seleção múltipla com busca:
  - BSC: todos os KPIs, de todas as cadeiras.
  - KRs: todos os de 2026/2.
  - Cesta: só a da cadeira que está preenchendo.
  - Projetos do portfólio.
- **Escolher um projeto** preenche os objetivos dele e **sugere os KPIs de BSC desses objetivos**, e o diretor pode ajustar.
- **Compatibilidade:** o vínculo principal continua sendo gravado no campo único de hoje. Por isso, painel de Governança, iniciativas em Metas e pendências de comitês não mudam. Os vínculos atuais são copiados como vínculo principal.
- **KPI de outra cadeira:** só como vínculo secundário.

## Etapa 3 — Responsáveis
- **"Diretor responsável":** automático, sem edição.
- **"Responsável pela entrega":** substitui "Eu". A lista traz o diretor e os líderes um nível abaixo dele no organograma, e mantém "outra cadeira" e "pessoa de fora" (com e-mail protegido como hoje). Registros antigos com "Eu" passam a mostrar o diretor.
- **Ligação cargo ↔ cadeira:** cadastrada pela Governança na Estrutura Organizacional. Até lá, a lista mostra só o diretor.

## Etapa 4 — Pendências acumuladas no Check-in
- **Prioridades em aberto:** de **todas** as semanas anteriores, sem o limite de 8. Cada uma mostra "prioridade da semana de dd/mm" e as opções Entregue / Em andamento / Não entregue, sem duplicar.
- **Pendências de atas:** mostram a origem (comitê ou reunião, título e data da ata) e ficam no empilhamento **até a baixa na Governança**.
- **Status do diretor até a baixa:** o diretor registra "Entregue", "Em andamento" ou "Não entregue", com comentário opcional.
  - O status fica guardado por pendência e é carregado para os ciclos seguintes, sem precisar marcar de novo.
  - Com "Entregue", o item vai para o fim da lista com o selo "Entregue · aguardando baixa na Governança".
  - Quando a Governança dá baixa, o item some na sincronização seguinte (de hora em hora).
  - A Visão semanal mostra quantas estão aguardando baixa por cadeira, para a Governança cobrar.
- **Deliberações:** nada muda neste app. Todas as que a Governança exportar entram automaticamente em "Contexto e Decisões".

### Pedido para o App Governança (não alterado daqui)
1. Exportar ações de **todas as atas**, não só CEA, CES e MBX. Para cada ação: tipo e nome da reunião, título e data da ata, responsável, prazo e status.
2. Exportar as **deliberações de todas as atas**, com o mesmo formato atual.
3. Para atribuir por diretor: incluir o **e-mail do responsável** em cada ação. Com isso, este app liga a ação direto ao diretor da cadeira, e o mapeamento por nome fica como reserva.
4. Opcional, para o futuro: receber o status registrado pelo diretor. Hoje a integração é só de leitura e continuaria assim até haver aprovação.

## Decisões necessárias
1. Prazo único do ciclo: **A** (sexta 18h) ou **B** (segunda 12h).
2. Quando a Governança passar a enviar o e-mail do responsável: atribuir pelo e-mail ou manter o nome como regra principal.

## Detalhes técnicos
- Envio do ciclo: uma função no servidor, `rotina_enviar_ciclo(cadeira, semana, token, conteudo_checkin, conteudo_checkout)`, grava os dois `mt_checkins` na mesma transação e cria as iniciativas pelo `rotina_criar_iniciativa` existente, que continua idempotente por token + indicador. A RLS atual é mantida (própria cadeira ou Governança).
- `prazoDe` vira `prazoCiclo(semana)` com o horário escolhido. O selo é calculado na leitura pelo menor `primeiro_envio_em` dos dois registros, com compatibilidade para os registros antigos.
- Nova tabela `mt_acao_vinculos` (origem da ação, tipo de vínculo, referência, `principal`), com GRANTs e RLS iguais a `mt_checkins`, e cópia inicial dos vínculos únicos. `rotina_criar_iniciativa` ganha um parâmetro opcional de vínculos secundários.
- `org_organograma_cargos` ganha a coluna opcional `mt_cadeira_id`, editada só pela Governança.
- Status do diretor nas atas: entra no JSON do checkout por `gov_acao_id` e é carregado do último checkout enviado. A remoção da lista segue `gov_acoes_da_cadeira`, sem alteração.
- `prioridadesHerdadas` passa a ler todos os check-ins anteriores da cadeira.
- Testes: ciclo enviado de uma vez, reenvio sem duplicar, selo único com registros antigos, empilhamento de mais de 8 semanas, ata "entregue" que continua na lista até a baixa.
