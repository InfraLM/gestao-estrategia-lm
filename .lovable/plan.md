# Impacto Estratégico com drill-down por objetivo + integração Gestão Processos (Zeev)

## Como está hoje

- **PMO › Iniciativas por vínculo** (`/pmo/vinculos`): mostra iniciativas e projetos empilhados por vínculo, com uma aba de cadastro de iniciativas. Os cadastros antigos de iniciativas já redirecionam para essa aba.
- **Impacto Estratégico** (`/impacto-estrategico`): lista os objetivos por perspectiva do BSC. Ao clicar num objetivo, abre os itens do portfólio ligados a ele.
- **Dados de vínculo encontrados:**
  - Decisões (Contexto e Decisões): 122 registros, sendo 12 com código GOV. A única ligação com a estratégia é o campo de texto "impacto BSC", que guarda só a perspectiva (ex.: "Processos / Aprendizado e pessoas"). Não aponta objetivo, KPI, KR nem item da cesta. Decisões não têm prazo nem status de execução.
  - Ações das atas (Governança): 182 registros com status, prazo, responsável e comitê, mas **nenhuma ligação** com objetivo, KPI, KR ou cesta.
  - Iniciativas de Metas e check-in/checkout: 0 cadastradas até agora e 0 vínculos múltiplos. A estrutura já existe, mas está vazia.
  - Projetos do portfólio: 4 vínculos gravados, todos com objetivo do BSC. Os outros vêm do campo antigo de objetivo do projeto.
  - Processos neste app: já existe uma lista local com 106 processos e um campo "maturidade", carregada de documento. Não está ligada ao app Zeev.
- **App Gestão Processos - Zeev (código lido, banco não):**
  - Matriz de impacto com 12 eixos de nota 0–5 (F01–F02, C01–C03, P01–P03, AC01–AC03), e não 9 como se imaginava. Tem também diretoria e diretor responsável.
  - Avaliação de maturidade: nota, "nível/gate", indicador de fragilidade e data, com itens por critério. Há ainda um nível de maturidade e um rótulo vindos do Zeev.
  - Contribuição Estratégica: por processo, guarda o KPI da árvore **como texto** (vários nomes separados por " · "). Também guarda vínculo Direto/Indireto/Sem vínculo, tipo (Resultado/Controle), grau hoje/alvo, prioridade, mecanismo, defasagem, baseline→meta e compartilhado com.
  - ICEP 0–100: cinco critérios de 0–5 com pesos (Rastreabilidade, Qualidade da hipótese, Relevância, Governabilidade, Consistência). Mede a **qualidade da ligação** com a estratégia, não a maturidade.
  - Melhorias: título, status, prioridade, responsável e se é automação, por código de processo.
  - Não existe função de exportação para outros apps.

## Etapas

### Etapa 1 — Mover "Iniciativas por vínculo" para Impacto Estratégico
- Impacto Estratégico passa a ter abas: **Objetivos** (drill-down), **Por vínculo** (a visão atual do PMO) e **Cadastro de iniciativas**.
- Sai do menu do PMO. `/pmo/vinculos` redireciona para `/impacto-estrategico?aba=vinculos`. A aba de cadastro e o redirecionamento antigo das iniciativas passam a apontar para `?aba=cadastro`.
- Atualizar a regra do menu nas notas do projeto.

### Etapa 2 — Drill-down do objetivo (com as origens que já existem)
- Cabeçalho do objetivo com um resumo: itens por origem, quantos atrasados e faróis dos KPIs (On/Off/Pendente, usando a avaliação por tipo que já existe).
- Blocos: KPIs de BSC do objetivo, KRs ligados, itens da cesta ligados. Em cada um, os itens vinculados ficam empilhados.
- Para cada item: origem (selo), status, prazo, responsável/cadeira e destaque para atrasado. Atrasado = prazo vencido e status diferente de concluído ou cancelado.
- Itens que se ligam só ao objetivo, e não a um KPI, KR ou cesta, aparecem num bloco "Direto no objetivo".
- Fontes: projetos do portfólio e iniciativas de Metas/check-in, pelo vínculo principal e pelos secundários.

### Etapa 3 — Ligar atas e decisões ao objetivo, KPI, KR e cesta
Hoje não há ligação estruturada. Proposta: nova tabela de vínculos neste app, sem alterar os registros vindos da Governança. Ela liga uma ação de ata ou decisão a objetivo, KPI, KR ou cesta, e é editada por Governança/CEO.
- Decisões entram como **marco** (data da decisão e responsável, sem prazo nem status). Elas não contam como atrasadas.
- Uma sugestão automática pela perspectiva do "impacto BSC" só serviria de filtro, porque a perspectiva não identifica o objetivo.

### Etapa 4 — Integração com o app de processos
- **No app Zeev:** função de exportação somente leitura, protegida por token (contrato abaixo).
- **Neste app:**
  - Função de teste de conexão, igual à da Governança.
  - Sincronização a cada hora que grava espelhos somente leitura: processos, impactos por KPI e melhorias.
  - Log de sincronização.
  - Botão "sincronizar agora" para Governança.
- **Correspondência de KPIs:** tabela "KPI do app de processos → indicador deste app", com status sugerido/confirmado.
  - A sugestão é feita por nome normalizado. A Governança confirma numa tela.
  - KPI sem correspondência confirmada não aparece no drill-down. Fica listado como "sem correspondência".
- **Cadeira:** o texto da diretoria vira cadeira por uma correspondência confirmada (as cadeiras mudaram de nome, por exemplo CPTO e CPPO).

### Etapa 5 — Processos no drill-down
- No objetivo e em cada KPI: processos que impactam, com maturidade, grau (Direto/Indireto, grau hoje→alvo), mecanismo, dono e cadeira.
- Melhorias do processo entram como origem "Processos" na lista de itens, com status e data.

### Etapa 6 — Acesso, testes e notas
- Leitura: diretores, Governança e CEO, conforme a transparência atual, e quem tem acesso ao módulo Impacto Estratégico. A edição continua só com quem já edita (cadastro de iniciativas e vínculos). Correspondências e vínculos de atas ficam com Governança/CEO.
- Espelhos do Zeev: só leitura para todos; quem grava é apenas a sincronização.
- Testes de: atraso, contagem por origem, desempate entre vínculo principal e secundário, correspondência confirmada versus sugerida e redirecionamento do link antigo.

## Riscos
- **Volume e ruído:** 182 ações de atas sem vínculo. Até alguém vincular, elas não aparecem nos objetivos. Ligar à mão é trabalhoso.
- **Nomes de KPI como texto no Zeev:** a correspondência automática vai falhar em grafias diferentes. A confirmação manual é obrigatória.
- **Duas listas de processos:** a lista local (106) e o espelho do Zeev podem divergir em código, nome e maturidade.
- **Maturidade com réguas diferentes:** nota da avaliação, nível do Zeev e o número local. Misturar confunde.
- **Iniciativas ainda vazias:** o drill-down vai parecer pobre até o primeiro ciclo de check-in (26/10).
- **Dependência de outro app:** sem a função de exportação lá, as etapas 4 e 5 não avançam.
- **Confidencialidade:** decisões reservadas (acesso reservado) continuam ocultas para quem não pode ver.

## Decisões necessárias
1. **Cadastro de iniciativas:** fica numa aba de Impacto Estratégico (proposta) ou volta para Metas/OKRs?
2. **Ações das atas:** vincular manualmente (Governança) ou pedir ao app de Governança que exporte o vínculo (objetivo/KPI) já na ata? Ou os dois?
3. **Decisões D/GOV:** entram como "marco" sem atraso, ou ficam fora da lista de itens e aparecem só como contexto?
4. **Régua de maturidade:**
   - (a) nível 1–5 do Zeev / gate da avaliação;
   - (b) nota da avaliação de maturidade;
   - (c) mostrar as duas.
   - O ICEP 0–100 mede a qualidade do vínculo. Proposta de exibição: "confiança do vínculo", não maturidade.
5. **Grau de impacto:** Direto/Indireto e grau hoje→alvo da Contribuição, ou também a nota dos 12 eixos da matriz?
6. **Lista local de 106 processos:** substituir pelo espelho do Zeev, manter as duas, ou usar a local só enquanto a integração não existe?
7. **Melhorias de processo:** todas, ou só as implantadas ou em andamento? Contam como atrasadas quando há prazo?
8. **KR e cesta via processos:** o Zeev só conhece KPIs da árvore. A ligação com KR ou cesta só pode vir pela correspondência do KPI (KR/cesta que usa aquele indicador). Aceita assim?

## Detalhes técnicos
- **Novas tabelas** (com GRANT e RLS de leitura conforme a transparência):
  - `estrategia_vinculos_gov` (`origem_tipo` acao|decisao, `origem_id`, `tipo` objetivo|indicador|kr|cesta, `ref_id`);
  - `proc_espelho_processos`, `proc_espelho_impactos`, `proc_espelho_melhorias`;
  - `proc_kpi_correspondencia` (`kpi_nome_origem`, `indicador_id`, `status`, `confirmado_por/em`);
  - `proc_diretoria_cadeira`;
  - `proc_sync_log`.
- **Funções:**
  - `processos-teste-conexao` e `processos-sync` (agendada de hora em hora, upsert por id de origem, sem apagar o que não veio; remoções marcadas como inativas);
  - secret `PROC_EXPORT_TOKEN` + URL.
- **Front:**
  - `ImpactoEstrategico.tsx` com `AbasPagina` e reaproveitamento de `EmpilhadosVinculo`, `carregarBaseVinculos` e `avaliarPorTipo`;
  - nova lib pura `impactoObjetivo.ts` (agrega itens por origem, calcula atraso), com testes.

---

## Texto pronto para o app "Gestão Processos - Zeev"

> **Pedido: lista estratégica de processos e função de exportação para o app Gestão e Estratégia**
>
> Precisamos que o app de processos exponha, somente para leitura, a situação de cada processo para o app estratégico.
>
> **1. Lista estruturada (garantir que exista e esteja preenchida para cada processo ativo):**
> - código, nome, macroprocesso (código e nome), dono (nome e e-mail), diretoria/cadeira responsável e diretor;
> - maturidade: última avaliação (nota, nível/gate, fragilidade, data) e nível do Zeev com rótulo, quando houver;
> - status de mapeamento e de implantação do processo;
> - impacto estratégico (Contribuição Estratégica): para cada KPI da árvore, **um registro por KPI** (não texto com " · "), com nome exato e, se possível, o código do KPI da árvore (rev. 17.09.26). Além disso: vínculo (Direto/Indireto), tipo (Resultado/Controle), grau hoje e alvo, prioridade, mecanismo, defasagem, baseline→meta e ICEP (0–100) com data;
> - objetivo(s) estratégicos impactados, se registrados;
> - notas da matriz de impacto (12 eixos, 0–5);
> - melhorias: id, título, status, prioridade, responsável, se é automação, data de criação, previsão e data de implantação.
>
> **2. Função de exportação:**
> - `GET` numa função própria, autenticada pelo cabeçalho `x-integracao-token` (secret `PROC_EXPORT_TOKEN`, valor combinado entre os apps), somente leitura;
> - parâmetro opcional `desde` (ISO) para devolver só o que mudou;
> - resposta JSON: `{ gerado_em, processos: [ { id, codigo, nome, macro_codigo, macro_nome, dono_nome, dono_email, diretoria, diretor, status_mapeamento, status_implantacao, maturidade: { nota, nivel_gate, fragilidade, avaliado_em, nivel_zeev, nivel_zeev_label }, impactos: [ { kpi_codigo, kpi_nome, vinculo, tipo, grau_hoje, grau_alvo, prioridade, mecanismo, defasagem, baseline_meta, icep, icep_em } ], matriz_impacto: { f01..ac03 }, atualizado_em } ], melhorias: [ { id, processo_codigo, titulo, status, prioridade, responsavel, automacao, criada_em, previsao, implantada_em, atualizado_em } ], removidos: [ids] }`;
> - não incluir dados pessoais além de nome e e-mail corporativo do dono e do responsável; sem anexos nem BPMN;
> - token inválido devolve 401; sem token, nada é devolvido.
