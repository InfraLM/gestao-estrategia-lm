# Evolução do Check-in / Checkout semanal

Continua gravando em `mt_checkins` (cadeira + semana + tipo) e lendo `mt_*` via `useMetasBase`. Nada altera nota, lançamento mensal ou réguas. Pendências de comitês (`puxarAcao`, `entregasDoCheckin`, `gov_acao_id`) seguem iguais.

## Situação atual verificada
- `mt_checkins` está **vazia hoje** (0 registros). A leitura retrocompatível ainda será feita, mas não há dado legado a migrar.
- `mt_indicadores` tem só **um** `cadeira_id` (não existe corresponsável) e `mt_okrs` **não tem dono** (sem `cadeira_id`).
- Atingimento já existe em `atingimento()` (MetasLancamento) e a régua de faixas em `mt_parametros.regua`.
- Criar em `mt_iniciativas` exige edição em **Metas** (política `acesso_inserir`); ler `mt_lancamentos` exige consulta em **Metas**.

## Conflitos para você decidir (não decidi)
1. **"KRs dos OKRs que a cadeira possui"**: OKR não tem dono no banco. Proposta: usar os KRs (`origem='okr'`) cujo `cadeira_id` é a cadeira. Alternativa: adicionar dono ao OKR (muda os Cadastros).
2. **"Corresponsável não responde"**: não há corresponsável hoje; a regra fica automaticamente satisfeita (só o responsável vê). Sem mudança.
3. **Criar iniciativa a partir do plano**: diretor com acesso só a Rotina (sem edição em Metas) é barrado pela política atual. Opções: (a) exigir edição em Metas; (b) função no servidor `rotina_criar_iniciativa` que valida cadeira/Governança + edição em Rotina. Recomendo (b), mas altera a regra de acesso atual.
4. **Realizado do mês**: quem só tem Rotina não lê `mt_lancamentos`. O retrato congelado (item 1) resolve a exibição depois, mas a primeira abertura precisa ler. Mesma solução: função no servidor que monta o retrato da cadeira.
5. **E-mail de pessoa de fora só para a própria cadeira**: `mt_checkins` é legível por todos com Rotina; esconder no JSON é só visual. Para garantia real, o contato vai numa tabela separada com RLS (ver abaixo).
6. **"Reenviar" após enviado**: hoje o envio fica editável; mantido. Prazo "fora do prazo" passa a usar o **primeiro** envio (novo campo no JSON), para não penalizar reenvios.

## Mudanças no JSON `conteudo` (versão `v: 2`)
Check-in:
- `prioridades[]` ganha `id` (uuid local), `prazo`, `responsavel` `{tipo:'eu'|'cadeira'|'externo', cadeira_id?, nome?, contato_id?}`, `origem_semana` (quando reaparece). Campos antigos preservados.
- `riscos` (texto) mantido só para leitura de registros antigos; novos riscos vão para tabela.

Checkout:
- `kpis_retrato[]`: `{indicador_id, codigo, nome, origem, peso, competencia, meta_mes, realizado, atingimento, faixa, congelado_em}` — gravado na primeira abertura e nunca recalculado.
- `kpis_resposta[]`: `{indicador_id, ok: true|false|null, impacto, plano, vira_iniciativa, prazo, responsavel, status_ini, reaproveitar: 'sim'|'nova'|null, iniciativa_alvo_id, iniciativa_criada_id}`.
- `entregas[]` ganha `prioridade_id`, `responsavel`, `herdada_de` (semana) e `entreguei_tardio`.
- `primeiro_envio_em`, `envio_token` (para impedir duplicar iniciativas).
- `kpis` (situação manual antiga) mantido em leitura.

Leitura retrocompatível: uma função `normalizarCheckin/Checkout(conteudo)` preenche padrões quando `v` não existe; o painel e o formulário só usam o objeto normalizado.

## Tabelas novas (com GRANT + RLS)
- `mt_rotina_riscos`: id, cadeira_id, tipo (risco|impedimento|decisao), descricao (imutável por gatilho), semana_criada, criado_por, resolvido_em, resolvido_por, reaberto_em. Ler: regra atual de Rotina; inserir/resolver/reabrir: própria cadeira ou Governança. Sem exclusão.
- `mt_rotina_contatos`: id, cadeira_id, nome, email. Ler/escrever: só própria cadeira ou Governança (atende o item 5).
- Iniciativas criadas pelo checkout: coluna nova opcional `mt_iniciativas.origem_checkin` (cadeira+semana+indicador) para detectar "iniciativa aberta do mesmo indicador criada em check-in anterior" e evitar duplicidade (índice único por envio_token+indicador).

## De onde vêm meta / realizado / atingimento
- Competência = mês da segunda-feira da semana (fora de jul–dez: mostra "sem competência").
- Meta do mês: `mt_metas_mensais.meta_mes` (indicador + competência).
- Realizado: `mt_lancamentos.valor` da maior `revisao` da competência (vazio se não lançado).
- Atingimento: mesma função `atingimento(real, meta, sentido)` do lançamento mensal.
- Status: `faixaDaNota` com a régua de `mt_parametros` ("No alvo"/"Superado" alimentam o atalho "Confirmar Sim nos N no alvo").
- Lista: BSC (`origem='bsc'`) + KRs (`origem='okr'`) + Cesta (`origem='cesta'`, inclusive peso 0), `status='ativo'`, `cadeira_id` = cadeira. Aviso fixo para BSC.

## Painel de Governança (SemanalVisao)
- Conta KPIs "Não" a partir de `kpis_resposta` (e `kpis` antigo, se houver).
- Novo bloco por cadeira: riscos abertos com idade, prioridades herdadas não entregues, iniciativas criadas no checkout.
- E-mail de pessoa de fora não aparece (só nome).

## Etapas de entrega
1. **Base**: normalizador retrocompatível + testes; cabeçalho de período (item 8); autosave com rodapé e fila única (item 7).
2. **KPIs no checkout** (itens 1): retrato congelado, Sim/Não desmarcável, atalho, aviso BSC.
3. **Plano vira iniciativa** (item 2): tabelas/coluna, função de criação no servidor, reaproveitar/criar outra, envio idempotente.
4. **Prioridades herdadas + Responsável** (itens 3 e 5) com tabela de contatos.
5. **Riscos persistentes** (item 4) com tabela própria.
6. **Revisão antes de enviar** (item 6) + ajustes do painel de Governança + teste ponta a ponta.

## Detalhes técnicos
- Lógica pura em `src/lib/rotinaSemanal.ts` (normalizar, montar lista de KPIs, pendências de envio, idade de risco, período) com testes em `src/test/rotinaSemanal.test.ts`.
- Testes de regra: corresponsável/outra cadeira fora da lista; cesta peso 0 incluída; Sim/Não desmarcável; plano sem prazo bloqueia; reaproveitamento sem escolha bloqueia; responsável externo exige nome e e-mail e não aceita cadeira junto; envio duplo não cria segunda iniciativa; registro antigo sem `v` lido sem erro.
- Autosave: debounce 1s, uma gravação por vez, rascunho também em armazenamento local até confirmar sucesso.
- AGENTS.md: registrar regra do retrato congelado e da idempotência do envio.
