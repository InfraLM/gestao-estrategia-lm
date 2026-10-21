# Fase C — Pendências de comitês e sincronização horária

## Entrega
- Acrescentar “Pendências de comitês” recolhível no Check-in, com contadores, prazos, responsáveis compartilhados e opção de puxar para as prioridades.
- Manter o limite de cinco prioridades, impedir duplicatas e carregar o vínculo opcional também no Checkout; não enviar alterações à Governança.
- Sincronizar a cada hora, no minuto 7, com consulta incremental somente nas chamadas agendadas. A sincronização manual continua completa.
- Conferir a cadeira CFO com sessão admin, sem salvar nenhum formulário real.

## Preservação
Nenhuma alteração nas tabelas, RLS, acessos, validações, prazos ou na regra `podeEditar`. Conteúdo antigo permanece compatível. O cron executa 24 vezes por dia: atualização pode levar até uma hora, com custo recorrente de consultas.

## Detalhes técnicos
- Criar `gov_acoes_da_cadeira` com autorização interna admin/diretor e EXECUTE apenas authenticated; excluir ações encerradas e retornar os nomes das demais cadeiras.
- Usar componentes próprios e helpers puros para ordenação, contadores, inclusão e transporte do vínculo opcional `gov_acao_id`.
- Gerar `GOV_SYNC_CRON_TOKEN` automaticamente, sem revelar o valor. Acrescentar autenticação cron em `governanca-sincronizar`, mantendo o caminho manual.
- Configurar pg_cron/pg_net por uma função de configuração exclusiva de service_role, chamada por uma função administrativa separada. O segredo passa diretamente entre funções, sem aparecer nas respostas ou arquivos; não agendar se estiver ausente.
- Acrescentar consulta autorizada apenas do horário da última sincronização bem-sucedida para o rodapé, sem expor o conteúdo dos logs aos diretores.
- Executar testes existentes e novos, incluindo autorização SQL, autenticação cron e conferência da tela.