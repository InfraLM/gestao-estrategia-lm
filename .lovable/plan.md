## Objetivo
Novo módulo "Desejos dos Sócios 2027": um formulário em 6 etapas para Ian, Yuri e Cleto, com rascunho salvo sozinho, resumo do trade-off, diretrizes e projetos ligados ao BSC e aos KPIs, e uma visão consolidada só para a Naira (admin). Prazo exibido: 06/11/26.

## 1. Modelo de dados
Duas tabelas novas. Nenhuma tabela atual muda.

**socios_participantes** (quem deve responder)
- user_id (uuid, pk), nome_exibicao (Ian/Yuri/Cleto), ativo, created_at
- A Naira cadastra a lista. Um trigger também pode vincular pelo e-mail do convite, como já faz o `mt_convites`.

**socios_respostas_2027** (uma linha por sócio)
- id, user_id (unique), ciclo text default '2027'
- status text: rascunho | enviado ("Pendente" é calculado quando não existe linha)
- respostas jsonb (etapas 2–4, por código da pergunta: motor, principio, ritmo, portfolio, trafego, novo, invest, caixa_min, divida, ddl, venda, sucessao, resultados, papel, linhas_vermelhas…)
- diretrizes jsonb (lista de {texto, objetivos[], porque})
- projetos jsonb (lista ordenada de {nome, objetivos[], kpis[], kpi_outro, problema, esforco, dono})
- extras jsonb (parar/reduzir, comentários)
- versao int, enviado_em, primeiro_envio_em, updated_at
- Por que JSON: o formulário é longo, vai mudar e só é lido inteiro. Colunas fixas só para status e datas.

**Segurança (RLS)**
- Sócio: SELECT/INSERT/UPDATE só onde `user_id = auth.uid()` e ele está em `socios_participantes`. Sem DELETE.
- Consolidado: SELECT para `is_super_admin` ou `has_role(...,'admin')`. Ninguém mais lê, nem PMO.
- GRANT só para `authenticated` e `service_role`, nunca para `anon`.
- Os dados de DDL e venda ficam dentro do JSON protegido pela mesma regra. Não entram em logs, em exportações gerais nem em envios para IA.
- Histórico de reenvios (opcional): tabela `socios_respostas_versoes`, que guarda uma cópia a cada envio. Só a admin lê.

## 2. Reaproveitamento
- Login Google e convite por link: usa o fluxo atual. A Naira convida os sócios e depois marca cada um como participante.
- Objetivos e KPIs: novo hook `useObjetivosKpis()`, que lê a mesma fonte do BSC (`useConteudo("bsc.rev02")` com os ajustes de `useBaseOverrides("estrategia")`). Assim tudo fica igual ao que aparece em BscArvoreKpis. Filtra `nivel` Estratégico/Tático e agrupa por perspectiva (F./C./P./AC.). Nada fica fixo no código.
- Listas suspensas com lupa e escolha múltipla: usa o componente de busca atual (Command/Popover) e o padrão de DiretoresMultiSelect.
- Os textos de contexto da etapa 1 ficam numa chave do `useConteudo` (`socios.contexto2027`). Assim a Naira pode editar os textos com o EditarConteudo, sem programação.

## 3. Endereços, menu e permissão
- `/socios/formulario`: o wizard do sócio logado.
- `/socios/consolidado`: só admin. A página bloqueia o acesso e a regra de segurança do banco também.
- Novo grupo no menu "Desejos dos Sócios 2027", só visível para participantes e admin.
- Novo módulo `socios` em `ACCESS_MODULES` e em `moduleForPath`. Diferença importante: neste módulo, a falta de uma exceção **não** libera o acesso (as outras áreas liberam por padrão). Ele fica fechado por padrão, porque o conteúdo é sensível. Isso entra em teste.
- "Quem está respondendo": vem do usuário logado e não pode ser trocado. A admin pode escolher um sócio só para leitura no consolidado.

## 4. Lógica do trade-off
- Um arquivo de regras puro, `src/lib/sociosTradeoff.ts`, com: eixos (tabelas de pesos da especificação), posicionamento, "escolhe / abre mão de", tensões, objetivos do BSC sugeridos, diretrizes sugeridas e validação de envio.
- Roda no navegador nas etapas 5 e 6 e também no consolidado (os 3 sócios na mesma régua). Nada disso é gravado, é sempre recalculado.
- Testes em `src/test/sociosTradeoff.test.ts`: um teste por regra (ex.: motor A + portfolio A + trafego A + novos em 6º dá eixo 1 = 0; core com caixa < 50 dá "Arrumar a casa"; dívida para distribuir com a linha vermelha marcada dispara a tensão; teto de custo < 2,45% gera alerta; motor A dispensa a pergunta 6).

## 5. Salvamento e envio
- Salva sozinho 1,5 s depois da última alteração e ao trocar de etapa, além do botão "Salvar". Mostra "Salvo às hh:mm".
- Enviar: valida as perguntas 1–6 (a 6 é opcional com motor A), 8–12, a confirmação do ranking e pelo menos 1 diretriz. Destaca o que falta e leva até a primeira pendência.
- Editar depois de enviar: continua como "enviado". O consolidado mostra "reenviado em…" e `versao` aumenta.

## 6. Visão consolidada
Status por sócio; número de divergências; os 3 eixos numa régua única; mapa de divergências (pergunta × sócio, com a linha destacada quando as respostas diferem); linhas vermelhas e limites; diretrizes e projetos por objetivo; ranking de projetos (1º = 5 pts … 5º = 1); respostas abertas; exportação CSV pelo `exportCsv` atual (só nesta tela).

## 7. Envio ao Backlog Estratégico (avaliar)
Botão "Promover ao backlog" em cada projeto do ranking, só para a admin. Cria uma ação no Backlog Estratégico com ferramenta de origem "Desejos dos Sócios" (novo valor no filtro), objetivos e KPIs no texto ou nos campos de vínculo, e uma referência ao projeto. Não leva DDL nem dados pessoais. Fica para a última etapa. Antes, confirmar se o backlog guarda objetivos/KPIs estruturados ou só texto.

## 8. Riscos para os módulos atuais
- Mudar o padrão de acesso de forma global: o fechado por padrão vale **só** para `socios`, e os testes atuais de moduleAccess continuam passando.
- Menu: o novo grupo não pode aparecer para outros usuários.
- Ler o BSC: é só leitura, sem impacto.
- Backlog: só acrescenta uma ferramenta de origem e não muda as ações atuais.

## 9. Etapas de entrega
1. Tabelas, segurança, módulo de acesso, menu e endereços, com testes de acesso. (pequena)
2. Regras do trade-off e testes. (média)
3. Wizard etapas 1–4 com salvamento automático. (grande)
4. Etapas 5–6: trade-off, diretrizes, projetos e envio. (média/grande)
5. Consolidado e CSV. (média)
6. Promoção ao backlog. (pequena)
Teste completo no navegador ao final: um sócio preenche e envia, outro sócio não vê a resposta, a admin vê o consolidado.
Ao todo, cerca de 5 a 6 entregas.

## Dúvidas em aberto
1. Cleto ainda não tem conta nem cadastro. Os 3 serão convidados agora? Quais são os e-mails?
2. A Naira é a única que vê o consolidado, ou todo admin/super_admin vê?
3. Um sócio deve ver as respostas dos outros depois que todos enviarem?
4. Editar depois de enviar deve ser bloqueado após 06/11/26?
5. Guardar o histórico de cada reenvio (tabela de versões)?
6. Na lista de KPIs, usar a árvore do BSC (Rev.02) ou os indicadores das Metas 2S26? O plano usa a árvore do BSC.
7. A promoção ao backlog entra nesta fase?
