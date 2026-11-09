# Permissão restrita para testar e-mail

## Resultado
- Felipe Rabello poderá testar o envio exclusivamente para `naira.yurie@liberdademedicaedu.com.br`, com contagens fictícias.
- Não será concedido perfil Governança, acesso a relatórios, destinatários, histórico de outros usuários ou configuração dos avisos.
- A permissão será temporária, com validade de 24 horas, e poderá ser revogada pela Governança.

## Segurança e dados
- Identificar a conta de Felipe pelo login autenticado e conferir seu cadastro; não vincular por nome nem atribuir acesso a uma conta presumida.
- A concessão exige aprovação de uma conta da Governança já autorizada no aplicativo; não contornar a autorização atual.
- Criar tabela de permissões de teste com RLS fechada e RPCs auditadas para conceder/revogar; o usuário pode consultar apenas sua própria validade.
- Verificar a permissão e a validade no servidor a cada teste. Bloquear qualquer destinatário diferente da Naira e qualquer ação de configurar/processar fila para quem tem apenas esta permissão.

## Arquivos e módulos
- Nova migração a partir de `0105`, sem editar as migrações existentes: permissões, RLS, RPCs e auditoria em `mt_auditoria`.
- `supabase/functions/rotina-avisos-enviar/index.ts`: autorização específica somente na ação `teste`, sem consultar dados de cadeiras.
- Novo helper de autorização e testes isolados junto aos testes de avisos existentes.
- Disponibilizar controle de teste isolado para a conta autorizada, sem abrir o painel de administração; reutilizar componentes e proteção de navegação existentes.
- Atualizar documentação de rotina e a referência técnica no `AGENTS.md`.

## Não muda
- Nenhum perfil, cadeira, resposta ou acesso a outro módulo.
- Nenhum segredo cadastrado/alterado, nenhum aviso automático ativado e nenhuma fila processada.
- Não publicar o aplicativo. Informar separadamente a necessidade de republicar a função para a nova permissão funcionar.

## Validação
- Vitest: permissão vencida/revogada negada; só Naira permitida; ações administrativas negadas; Governança mantém os acessos atuais.
- Testar o controle com sessão real da conta autorizada; um único envio real à Naira somente após a concessão autorizada, verificando a resposta do Gmail.
- Conferir que `remetente_pronto` e a ativação dos avisos não mudaram.

## Pendência
- Aprovação da Governança para conceder a permissão à conta autenticada de Felipe; a aprovação deste plano não substitui essa autorização no aplicativo.