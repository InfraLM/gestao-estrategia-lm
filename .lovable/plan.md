# Quick Wins — ajustes de diretores, áreas e cadastro

## Alterações
- Aceitar os cinco cargos solicitados. Diretor nunca será líder restrito; Yuri Garcia será vinculado à conta existente `yuri.garcia@liberdademicaedu.com.br` (domínio efetivo: `liberdademedicaedu.com.br`), preservando seus acessos anteriores.
- Adicionar diretor pré-cadastrado e vínculos múltiplos por área. Resolver o diretor por `diretor_user_id`, com alternativa no `user_id` de `diretor_lider_id`. Se houver vínculos ativos por área, eles determinam a triagem; dois vínculos exigem Área no item.
- Diretores veem e triam somente itens das suas áreas; Governança/CEO mantêm a visão total. Cadastro e edição dos vínculos serão auditados, com inativação em vez de exclusão.
- Comparar e-mails sem distinção de maiúsculas ou pontos antes do @, somente no Quick Wins; vinculação no login exige e-mail verificado e não sobrescreve contas vinculadas. Correspondências ambíguas serão sinalizadas, não escolhidas arbitrariamente.
- Permitir rascunho e envio sem diretor identificado; apresentar “Aguardando diretor” e alertas no Painel/Administração. Ian sem diretor será encaminhado à Governança, sem ser tratado como pendência.
- Incluir os 26 cadastros solicitados e os dois vínculos de Marcya, sem duplicações nem alteração de cadastros existentes. Rany e as duas áreas de Marcya permanecem pendentes.

## Arquivos e tabelas afetados
- Nova migration a partir da **0098** em `drizzle/migrations/`: CHECK de cargo, colunas `qw_lideres.diretor_lider_id`, `qw_itens.area_rotulo`, indicador aditivo de envio aguardando diretor, tabela `qw_lider_diretores`, funções de resolução, triggers, RPCs e RLS do Quick Wins.
- `src/pages/QuickWins.tsx`, `src/lib/quickWins.ts`, `src/hooks/useQuickWins.ts`: cargos, edição de vínculos, Área, contexto de triagem e alertas; reaproveitar controles existentes.
- Testes em `src/test/`, regras em `docs/agents/quick-wins.md` e acompanhamento em `roadmap.md`. Tipos do banco regenerados pela ferramenta.

## Dados, acesso e impacto
- Nenhuma exclusão ou alteração de respostas, histórico ou permissões de outros módulos. As 36 policies existentes e `acesso_modulo` continuam usando `is_lider_restrito`; só a exceção explícita de cargo diretor muda seu resultado.
- RLS e RPCs compartilham a mesma resolução de diretor por item, evitando que um diretor veja itens da outra área. Escritas sensíveis continuam por RPCs auditadas; nenhuma concessão anônima.
- **A carga inicial não pode ser executada como seed dentro de migration pelas regras da plataforma.** O schema entra na 0098; a carga será uma operação separada, transacional, idempotente com `ON CONFLICT DO NOTHING` e auditada, sem editar migrations antigas.
- E-mails continuam apenas na fila, sem envio real. Destinatários são resolvidos por área; os pendentes não recebem mensagens nem expondo itens a outro diretor.

## Verificação e o que não muda
- Vitest: diretor não restrito; resolução sem login e após vínculo; triagem/RLS por duas áreas; e-mails com/sem ponto; acesso anterior de Yuri; 26 registros; envio pendente e encaminhamento de Ian à Governança.
- Conferir cadastro, alertas e telas em computador/celular; testes de escrita e triagem somente isolados.
- Não mudar limite de 10, critérios de classificação, ciclos, regras de edição/execução, outros módulos, rotas ou configurações de login gerais. **Não publicar.**