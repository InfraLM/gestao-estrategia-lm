# BSC Rev.02 → Rev.03 no app — análise de impacto e plano

Nada foi alterado. Os números abaixo vêm de uma leitura do banco em 29/10/2026.

## Situação atual (conferida)
- 9 objetivos em `mt_objetivos` (F.01, F.02, C.01, P.01–P.03, AC.01–AC.03). **C.02 não existe.**
- 43 KPIs `origem='bsc'`, todos com status `ativo`. Existem também 23 KPIs de Cesta e 13 de OKR.
- O código que aparece na tela fica no começo do **nome** (ex.: "F02.02 Despesas adm / ROL"). A coluna `codigo` guarda um código interno diferente (ex.: `f.02.03`). Ou seja, existem dois códigos, e os dois precisam ser tratados.
- Dados ligados aos KPIs do BSC: 186 metas mensais, 0 lançamentos, 0 desvios, 2 vigências de peso, 36 propostas de frequência, 408 vínculos de portfólio (só 1 validado; o resto é proposta) e 2 check-ins. Nada de orçamento ou meta 2030 está preenchido.
- Outros dados que dependem dos objetivos: 295 vínculos de portfólio com objetivos (4 validados) e 9 ligações entre OKR e objetivo.
- Quase tudo aponta para o KPI pelo **id interno**: metas, lançamentos, pesos, frequência, desvios, iniciativas, vínculos, check-ins e respostas do Pré-Off-site.
- Existe uma estrutura Rev.02 fixa no código, usada como reserva para situação atual e meta 2026. Ela é lida pelo nome do KPI em `useKpisObjetivo`, no Pré-Off-site, em MetasSemanal, na Matriz e na árvore do BSC.

## a) Onde objetivos e KPIs são usados e o efeito de cada operação
| Módulo | Como liga | Renomear / recodificar (mesmo id) | Fundir | Criar | Inativar |
|---|---|---|---|---|---|
| BSC / árvore / avaliações | objetivo_id, nome, Rev.02 fixa | Nome novo aparece; a reserva Rev.02 deixa de bater pelo nome | Precisa escolher o KPI sobrevivente | Aparece sem histórico, "sem status" | Some das telas, histórico fica |
| Metas mensais, lançamentos, pesos | indicador_id | Preserva tudo | Histórico do KPI absorvido não soma sozinho | Vazio | Fica no histórico; apagar levaria os dados junto |
| Rotina semanal, check-in/checkout, calendário, desvios | indicador_id e retrato do ciclo | Ciclos enviados preservados | Leituras antigas ficam no KPI de origem | Entra no calendário só com cadência definida | Sai dos próximos ciclos |
| OKRs e Cesta | objetivo_id, ligação OKR↔objetivo | Preserva | — | — | Inativar um objetivo deixa OKRs e Cesta sem pai |
| Vínculos de portfólio, impacto de projetos, sugestões de IA | ref_id | Preserva | Vínculos precisam ser movidos, com auditoria | Sem vínculos | Vínculo fica "a revisar" |
| Financeiro por objetivo, meta 2030 | objetivo_id e campos do KPI | Preserva (hoje vazio) | — | — | — |
| Processos e Zeev | tabela de correspondência (0 linhas) | Sem impacto hoje | — | — | — |
| Incentivos, Dashboard, Estratégia, funções de IA | leem os KPIs ativos | Mostram o nome novo | — | Entra nas listas | Sai das listas |
| Pré-Off-site | ver item d | | | | |

## b) Como preservar o histórico
- **Regra recomendada:** KPI que só muda de código ou nome **mantém o id interno**, com nome e código novos e o anterior registrado em histórico e auditoria. Isso preserva metas, vínculos e ciclos.
- **KPI novo ou com definição diferente:** cria-se um KPI novo, "sem status" pela regra D-091. O antigo é **inativado, nunca apagado**. Na Rev.03 isso vale para F01 (novo), F02 (NRR), C01-A, AC02 e AC03 estratégicos, e os itens marcados "novo".
- **Fusões** (AC02+AC02.02, AC02.01+AC02.06, P03-a+P03-b): o KPI novo recebe id novo e os de origem são inativados, guardando a referência "fundido em". Metas e leituras antigas ficam nos de origem, consultáveis. Os vínculos de projeto são **copiados como proposta** para o novo, para revisão; não são movidos já validados.
- **Recodificações em cadeia** (F02↔F01, AC01↔AC03, F01.01→F02.01…): todas as trocas no mesmo passo, com mapeamento simultâneo, para nenhum código ser trocado duas vezes. KPIs que mudam de objetivo trocam `objetivo_id`.
- **Objetivos:** renomear as 9 linhas mantendo o id (AC.01/AC.02/AC.03 trocam de nome entre si, sempre pelo mapeamento simultâneo) e criar C.02. Os vínculos validados com objetivo (4) e os propostos precisam de revisão onde o sentido mudou, principalmente C.01 → C.01/C.02.
- **NSM** (F01.02): o KPI é inativado como objetivo e o histórico fica preservado. Ele passa a ser a métrica-mãe, ligada ao mesmo id.
- **Itens "a confirmar"** (P02.02, AC02.04, AC03.02, C02-a.04 faturamento): ficam inativos até a Naira decidir. Nada é removido.

## c) Métricas-mãe
Hoje o app não tem um nível acima dos objetivos. BHAG, NSM e número crítico existem só como texto. Para ter métricas-mãe é preciso uma mudança pequena no modelo: uma tabela nova de métricas-mãe (nome, meta, tipo BHAG/NSM/crítico, KPI opcional para reaproveitar a NSM) e um bloco no topo do BSC. Ela não entra na conformidade nem no calendário até a Naira decidir.

## d) Impacto no Pré-Off-site
- As respostas guardam o KPI pelo **id interno**: a 2.1 com várias escolhas e a área de indicadores do Bloco 0. Mantendo os ids, as respostas continuam válidas. KPIs inativados saem das listas de escolha, e as respostas antigas viram "KPI arquivado"; esse tratamento precisa ser criado para não aparecer um id solto.
- A lista de KPIs e de objetivos que o formulário recebe mostra só KPIs ativos, então ela muda na hora em que o cadastro muda.
- As perguntas do Bloco 0 citam os KPIs pelo código antigo da tela (ex.: "AC02.02"). Esses códigos precisam ser traduzidos no código do app e na configuração salva, no mesmo passo. Os nomes dos objetivos já estão na Rev.03.
- A função que monta a área de indicadores define dono e apoios pelo código interno antigo, fixo dentro dela, e precisa ser reescrita para os KPIs novos.
- A reserva Rev.02 (situação atual e meta 2026, buscada pelo nome) precisa de uma versão Rev.03, ou deixa de preencher esses campos.
- Hoje há 1 resposta salva, o rascunho da Naira. O prazo das respostas já passou (28/10) e o off-site é em 27 e 28/11.

## e) Plano passo a passo
1. **Aprovação do mapa:** tabela final com cada KPI (manter id, criar ou inativar), dono por cadeira, cadência e itens "a confirmar". Nada roda antes disso.
2. **Retrato de segurança:** cópia completa de objetivos, KPIs e configuração do Pré-Off-site, marcada "Rev.02", para poder desfazer.
3. **Estrutura:** campos de versão do BSC, "fundido em" e "código anterior" nos KPIs; tabela de métricas-mãe. Tudo aditivo.
4. **Objetivos:** renomear os 9, criar C.02, registrar na auditoria.
5. **KPIs:** recodificar mantendo os ids (troca simultânea), criar os novos "sem status", inativar fundidos e removidos. Os 43 BSC viram um total novo; o número exato sai do mapa aprovado.
6. **Ajustes no app:** reserva Rev.03, árvore do BSC, função de indicadores do Pré-Off-site, códigos do Bloco 0, aviso de "KPI arquivado".
7. **Rotina:** calendário e cadência dos KPIs novos entram como **proposta** para Gov/CEO aprovar. O efeito vale só a partir do próximo ciclo; ciclos enviados ficam intactos.
8. **Vínculos:** copiar como proposta para os KPIs novos e marcar "a revisar" os vínculos de KPIs inativados. Nada é validado automaticamente.
9. **Testes isolados** (sem dados reais): histórico preservado, ciclos enviados intactos, rascunho do Pré-Off-site abre e exporta, contagens batem.
10. **Desfazer:** restaurar o retrato do passo 2. KPIs criados ficam inativos, nunca apagados.

**Riscos:** troca dupla de códigos (AC e F); a reserva Rev.02 parar de preencher valores; ciclo semanal em andamento com KPIs trocados no meio; vínculos com sentido diferente (C.01); respostas do Pré-Off-site apontando para KPI inativado; IA e relatórios citando nomes antigos.

**Complexidade:** alta. São cerca de 45 KPIs envolvidos, 3 fusões, cerca de 15 novos e 10 módulos. Estimativa de 3 a 4 rodadas de trabalho, mais a revisão da Naira.

**Recomendação:** fazer **depois do off-site (27 e 28/11)**. O consolidado, o Excel e a área de indicadores do off-site foram montados sobre a Rev.02, e as metas de 2027 sairão de lá. Até o off-site, só os textos (já feito no formulário) e, se a Naira quiser, a criação das métricas-mãe como mostrador, sem efeito em mais nada. A troca completa entraria no primeiro ciclo depois do off-site, já com as metas de 2027.

## Detalhes técnicos
- As ligações de metas, lançamentos e pesos apagam os dados junto se o KPI for excluído; por isso nunca excluir, só mudar o status.
- O "sem status" da D-091 pode reaproveitar o campo de status de implantação da medição, com bloqueio na avaliação.
- O texto final de cada KPI deve ficar só no `nome`, com `codigo` alinhado; hoje os dois divergem.
