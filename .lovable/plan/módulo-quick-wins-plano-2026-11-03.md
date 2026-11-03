# Módulo Quick Wins — plano

Regras lidas: AGENTS.md raiz, docs/agents/metas-rotina.md, src/components/AGENTS.md, src/components/estrutura/AGENTS.md e planos em .lovable/plan/. Última migration confirmada: 0093.

## Estado atual verificado
- `acesso_modulo` hoje: `_uid IS NOT NULL AND (is_super_admin(_uid) OR COALESCE((nivel em usuario_acessos), true))`.
- As 36 policies abertas existem exatamente como listado abaixo (35 SELECT com `qual = true`; 1 ALL em `user_roles`).

## O que será criado

### Migration 0094 — tabelas, triggers e RPCs
- `qw_lideres`, `qw_ciclos`, `qw_envios`, `qw_itens` conforme o pedido (FK para `org_cadeiras` e `mt_objetivos`; `user_id` sem FK para auth.users, conforme regra do projeto). GRANT a authenticated/service_role; sem anon.
- Triggers: limite de 10 itens por envio; classificação automática (quick_win x iniciativa_maior, usando `limite_investimento` do ciclo); bloqueio de edição direta (envio enviado só edita itens em ajustar/devolvido; ciclo fechado só execução/resultado de aprovados); um ciclo aberto por vez; e-mail do líder só `@liberdademedicaedu.com.br`.
- RPCs SECURITY DEFINER auditadas em `mt_auditoria`: `qw_salvar_item`, `qw_enviar` (mín. 1 item), `qw_triar` (aprovar|ajustar|devolver|converter; comentário obrigatório exceto aprovar), `qw_atualizar_execucao`, `qw_abrir_ciclo`, `qw_fechar_ciclo`, `qw_lider_salvar`/`qw_lider_inativar` (Governança). Cancelar = status; nada é apagado.
- `qw_vincular_lider()` chamado no 1º login com e-mail verificado: grava `user_id` pelo e-mail (mesmo padrão dos convites verificados).
- RLS: líder vê só o próprio registro/envio/itens; diretor lê os líderes com `diretor_user_id = auth.uid()`; Governança (`mt_is_governanca`), admin e super_admin leem tudo. Escritas só via RPC.
- Pré-carga de `qw_lideres` a partir de `org_pessoas` (cargo contendo coordenador/supervisor/gerente; diretor = `user_id` do gestor), marcada para revisão da Governança. Seed: ciclo 2026 em rascunho (limite 20000, 90 dias).

### Migration 0095 — restrição de líder
- `is_lider_restrito(_uid)`: true se `qw_lideres` ativo com esse user_id E sem linha em `user_roles` E sem linha em `mt_usuarios`.
- `acesso_modulo` passa a: se `is_lider_restrito(_uid)` → `_modulo = 'quick_wins'`; senão, expressão atual idêntica.

### Migration 0096 — 36 policies
Em cada uma, o texto passa de `X` para `(X) AND NOT public.is_lider_restrito(auth.uid())`. Antes = `true` em todas; depois = `true AND NOT public.is_lider_restrito(auth.uid())` (na `user_roles`, `with_check` permanece igual).

| Tabela | Policy | Cmd |
|---|---|---|
| admin_modulos | am_select_auth | SELECT |
| backlog_propostas_ia | bprop_select_auth | SELECT |
| backlog_submissoes | bsub_select_auth | SELECT |
| base_propostas_ia | ler propostas | SELECT |
| base_submissoes | ler submissoes | SELECT |
| bc_scorecard_submissoes | bc_sc_select_auth | SELECT |
| conteudo_editavel | ler conteudo | SELECT |
| cronograma_itens | cron_select_authenticated | SELECT |
| departamentos | dep_select_auth | SELECT |
| diagnostico_insights | di_select_auth | SELECT |
| eap_itens | eap_select_authenticated | SELECT |
| entrega_submissoes | sub_select_authenticated | SELECT |
| estrategia_insights | ei_select_auth | SELECT |
| gmail_processados | gmail_proc_select_auth | SELECT |
| infra_tasks | infra_tasks_select_auth | SELECT |
| melhoria_business_case | mbc_select_auth | SELECT |
| mt_auditoria | mt ler | SELECT |
| mt_competencias | mt ler | SELECT |
| mt_lancamentos | mt ler | SELECT |
| mt_parametros | mt ler | SELECT |
| mt_status_projetos | msp_select | SELECT |
| mt_status_projetos_versoes | mspv_select | SELECT |
| processos | processos_select_auth | SELECT |
| profiles | profiles_select_all_auth | SELECT |
| projeto_cadeiras_apoio | pca_select | SELECT |
| projeto_decisoes | pd_select | SELECT |
| projeto_membros | pm_select_auth | SELECT |
| projeto_reunioes | reunioes_select_auth | SELECT |
| projeto_vinculos | pv_select | SELECT |
| projetos | projetos_select_authenticated | SELECT |
| repositorio_documentos | rd_select_auth | SELECT |
| riscos_institucionais | ri_select_auth | SELECT |
| rotina_transparencia | transp ler | SELECT |
| status_report_drafts | drafts_select_auth | SELECT |
| status_reports | sr_select_authenticated | SELECT |
| user_roles | roles_controle_seguro | ALL |

Aplicado com `ALTER POLICY ... USING (...)` (sem drop/recriação). Para não-líderes o resultado é idêntico.

## Front-end
- `src/pages/QuickWins.tsx` com abas (AbasPagina): Meus quick wins (líder), Triagem (diretor), Painel e Administração (Governança/CEO). Hook `src/hooks/useQuickWins.ts`, regras puras em `src/lib/quickWins.ts` (classificação ao vivo, "x de 10", CSV).
- Reuso: FormField, SaveFeedback, componentes ui, guarda de alterações não salvas.
- Rota `/quick-wins`; guarda global: líder restrito é redirecionado para `/quick-wins` em qualquer outra rota; menu mostra só esse item. Módulo `quick_wins` adicionado em moduleAccess, tela de acessos e convites.
- Auth: login do líder exige e-mail corporativo cadastrado; caso contrário, mensagem e sem acesso.

## E-mails
- Envio → diretor; ajustar/devolver → líder. Entram na mesma fila de saída existente, **desligados**: o envio real depende do domínio de e-mail ainda não configurado (mesma pendência da rotina semanal). Nenhum e-mail real será enviado.

## Testes (vitest)
- Limite de 10 (11º bloqueado); classificação automática nos 3 critérios.
- Logado como líder fictício isolado: sem leitura nas 36 tabelas; `acesso_modulo` falso fora de quick_wins; rotas redirecionadas.
- Diretor, Governança e super_admin: mesmo resultado de antes nas 36 tabelas e em `acesso_modulo`.
- Triagem/RLS: diretor só vê seus líderes; comentário obrigatório; ciclo fechado.
- Dados de teste criados e removidos só em isolamento; nada real alterado.

## Docs
- `docs/agents/quick-wins.md` com as regras; ponteiro curto no AGENTS.md raiz (mantido abaixo de 8 KB).

## Impacto e o que NÃO muda
- Nenhum dado existente é alterado ou apagado; só inclusão de líderes pré-carregados e ciclo 2026.
- Quem já tem `user_roles` ou `mt_usuarios` não é afetado; demais módulos, rotas, BSC, rotina semanal, Sócios e Pré-Offsite intactos. Nenhum acesso é ampliado.
- Rotas antigas permanecem.

## Pontos para confirmar
1. Diretores e Governança verão o item Quick Wins no menu; demais usuários sem papel não verão (o módulo fica fechado por padrão para quem não é líder, diretor ou Governança/CEO). Ok?
2. Pré-carga: líderes cujo cargo em org_pessoas não seja claramente coordenador/supervisor/gerente ficam de fora até a Governança cadastrar.
3. Políticas que já usam `acesso_modulo` (ex.: tabelas por módulo) também ficam fechadas para o líder automaticamente — é o efeito esperado.
