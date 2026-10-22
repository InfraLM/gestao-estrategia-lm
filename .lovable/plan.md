# Formulário semanal: vínculos múltiplos, visões separadas, responsáveis e pendências acumuladas

## O que foi verificado no app hoje
- **Iniciativas** (`mt_iniciativas`): um único `indicador_id`, além de `okr_id` e `objetivo_id`. As iniciativas criadas pelo checkout passam por `rotina_criar_iniciativa`, que exige um indicador da própria cadeira.
- **Portfólio** (`projetos`, 152 projetos): os vínculos são `objetivos` (códigos BSC, ex. A.02, F.01) e `krs` (lista de textos, quase sempre vazia). **Não há campo de KPI no projeto.**
- **OKRs**: todos os 4 cadastrados são 2026/2, e os KRs estão em `mt_indicadores` (origem okr).
- **Organograma**: `org_organograma_cargos` tem 145 cargos com hierarquia (`parent_id`). Só existe o nome do ocupante, sem usuário nem e-mail, e **sem ligação com a cadeira do formulário** (`mt_cadeiras`). Na tabela `org_cadeiras`, 8 das 11 cadeiras estão ligadas a `mt_cadeiras`, mas essa tabela não tem os líderes abaixo do diretor.
- **Pendências de atas**: vêm da Governança só para os comitês **CEA, CES e MBX** (182 ações). Não vêm todas as atas. A atribuição é pelo **nome do responsável na ata**, mapeado para uma ou mais cadeiras, e não pelo usuário do diretor. Ações concluídas ou canceladas na origem somem. A integração é só leitura: o app não grava status de volta na Governança.
- **Prioridades herdadas**: já se acumulam por todas as semanas anteriores não entregues, mas só dentro da janela carregada (8 semanas). Uma prioridade mais antiga que isso some sem ter sido resolvida.

## Etapa 1 — Separar as duas visões (renomear, sem mudar dados)
- **Conflito:** a regra atual (igual ao sistema antigo e registrada no AGENTS.md) chama a retrospectiva de "Checkout da semana anterior" (prazo sexta 18h) e as prioridades de "Check-in da semana" (prazo segunda 12h). A Naira pede os nomes invertidos.
- **Proposta:** trocar **só os rótulos** nas telas.
  - "Check-in" = perguntas 1–4: KPIs, entregas, riscos e reuniões.
  - "Checkout" = prioridades da semana seguinte.
  - Os registros continuam gravados como hoje (o tipo `checkout` guarda a retrospectiva, o tipo `checkin` guarda as prioridades), sem migrar nada. Assim, painéis antigos, envio sem duplicar, retrato dos KPIs e pendências de comitês continuam funcionando.
- **O que muda:** abas e cabeçalho do formulário; colunas e selos da Visão semanal e do Painel de Metas; textos de prazo; frase do AGENTS.md (passa a separar o nome na tela do tipo gravado).
- **Prazos:** os horários ficam como estão até haver confirmação. Com a inversão, a tela mostraria "Check-in vence sexta 18h" e "Checkout vence segunda 12h". **Decisão:** manter assim ou trocar os horários. O selo "fora do prazo" segue o horário escolhido.

## Etapa 2 — Vínculos múltiplos em cada ação
- **Nova tabela de vínculos** (ação → tipo + item): tipos `bsc` (KPI da árvore), `kr` (KR 2026/2), `cesta` e `projeto`. O acesso de leitura e gravação segue o do registro semanal ou da iniciativa ligada.
- **No formulário:** quatro listas de seleção múltipla com busca em cada entrega, plano de KPI "Não" e prioridade.
  - BSC: todos os KPIs ativos de todas as cadeiras.
  - KRs: todos os de 2026/2.
  - Cesta: só a da cadeira que está preenchendo.
  - Projetos: lista do portfólio.
- **Escolher um projeto** preenche os objetivos e KRs dele, e o diretor pode ajustar. **Conflito:** projeto não tem vínculo de KPI e os KRs dele estão quase todos vazios. Na prática, só os objetivos BSC viriam preenchidos. **Decisão:** a partir do objetivo do projeto, sugerir os KPIs de BSC desse objetivo, ou não sugerir KPI.
- **Compatibilidade com o vínculo único:** `indicador_id`, `okr_id` e `objetivo_id` continuam sendo preenchidos com o **vínculo principal** (o primeiro, ou o KPI do "Não"). Por isso, painel de Governança, iniciativas em Metas e pendências de comitês não mudam. Os dados atuais ficam como estão e são copiados para a nova tabela como vínculo principal.
- **Conflito:** a função que cria a iniciativa exige que o indicador principal seja da própria cadeira. Vincular KPI de BSC de outra cadeira exige permitir isso apenas como vínculo **secundário**, nunca como principal.

## Etapa 3 — Responsáveis
- **"Diretor responsável"**: fixo, preenchido com o diretor da cadeira, sem edição.
- **"Responsável pela entrega"**: lista com o diretor e os cargos **um nível abaixo** dele no organograma.
- **Conflito / falta de fonte:** o organograma não tem ligação entre o cargo do diretor e a cadeira do formulário. **Decisão:** cadastrar essa ligação, com um campo opcional no cargo indicando a cadeira, preenchido pela Governança na tela da Estrutura. Até isso existir, a lista mostra só o diretor. Os líderes aparecem por nome (sem usuário ou e-mail).
- **Convivência com o "Responsável" atual** (Eu / cadeira / pessoa de fora com e-mail): **decisão** entre substituir pelo novo campo, mantendo a leitura dos registros antigos, ou manter os dois. Recomendação: o novo campo substitui "Eu"; "outra cadeira" e "pessoa de fora" continuam como opções extras na mesma lista, e o e-mail externo continua protegido como hoje.

## Etapa 4 — Pendências acumuladas no Check-in
- **Prioridades de semanas anteriores:** passar a buscar todas as semanas com prioridade aberta, não só as últimas 8, para não sumir nada. Cada uma mostra "prioridade da semana de dd/mm" e as opções Entregue / Em andamento / Não entregue, sem duplicar (já é assim pela chave semana + prioridade).
- **Pendências das atas:** mostrar a origem (comitê, reunião e data) e as mesmas opções.
- **Conflito:** a marcação vale só neste app, e a pendência continua aparecendo até ser concluída na Governança, porque o app não grava de volta. **Decisão:** esconder depois de marcada como "Entregue" aqui, ou continuar mostrando com o selo "entregue, aguardando baixa na Governança".
- **Limitação:** só aparecem atas dos comitês exportados (CEA, CES, MBX) e de responsáveis já mapeados para a cadeira. Outras atas exigem mudança no app de Governança.

## Decisões necessárias
1. Prazos depois da inversão dos nomes: manter os horários atuais ou trocar.
2. Projeto sem KPI: sugerir KPIs de BSC pelo objetivo do projeto, ou não sugerir.
3. Ligação cargo do organograma ↔ cadeira: aprovar o cadastro manual pela Governança.
4. Responsável: o novo campo substitui "Eu" e mantém "outra cadeira" e "pessoa de fora"?
5. Pendência de ata marcada "Entregue": esconder ou manter com o selo de aguardando baixa.
6. Vínculo de KPI de outra cadeira permitido só como secundário: confirmar.

## Detalhes técnicos
- Nova tabela `mt_acao_vinculos` (id, `origem_tipo`: entrega | prioridade | kpi_plano | iniciativa, `checkin_id`, `item_ref`, `iniciativa_id` opcional, `tipo_vinculo`, `ref_id`, `principal` booleano). Inclui permissões de acesso, RLS igual a `mt_checkins` (leitura conforme a regra atual; escrita pela própria cadeira ou pela Governança) e cópia inicial de `mt_iniciativas.indicador_id` como principal.
- No JSON semanal, cada ação ganha `vinculos[]` e `responsavel_entrega`, com leitura retrocompatível em `normalizarCheckin` e `normalizarCheckout`.
- `rotina_criar_iniciativa` ganha um parâmetro opcional de vínculos secundários, mantendo a chave idempotente atual.
- Coluna opcional `org_organograma_cargos.mt_cadeira_id` para a ligação do diretor.
- `prioridadesHerdadas` passa a ler todos os check-ins anteriores da cadeira, com consulta separada só das semanas que têm prioridades.
- Testes: vínculos legados lidos como principal; empilhamento de mais de 8 semanas; ausência de duplicata ao reenviar; rótulos novos com os tipos gravados inalterados.
