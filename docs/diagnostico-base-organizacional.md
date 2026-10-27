# Diagnóstico — base organizacional única

Consulta de leitura em 27/10/2026. Nenhuma resposta, atribuição, permissão ou correspondência foi alterada.

## Inventário numérico

“Com texto” conta registros com ao menos um campo nominal preenchido. “Referência” distingue cadeira, usuário e correspondência indireta: não significa pessoa identificada. As colunas se sobrepõem; não somar como grupos exclusivos.

| Fonte | Total | Com texto nominal | Referência existente |
|---|---:|---:|---|
| Cadeiras de metas/rotina (`mt_cadeiras`) | 8 | 8 diretores | 2 titulares com usuário; 6 sem usuário titular |
| Usuários de metas (`mt_usuarios`) | 2 | — | 2 usuários com cadeira |
| Fichas estratégicas (`org_cadeiras`) | 11 | 9 ocupantes | 8 fichas com cadeira de metas; 3 sem cadeira |
| Organograma/cargos (`org_organograma_cargos`) | 145 | 130 ocupantes | 0 cargos com cadeira de metas; hierarquia por ID de cargo |
| Projetos | 152 | 128 diretores; 0 gerentes | 13 cadeiras principais confirmadas; 115 registros textuais sem cadeira |
| Ações de atas (`gov_acoes`) | 182 | 171 responsáveis | 134 ações com correspondência indireta para cadeira; 48 aguardam avaliação |
| Correspondências de Governança | 74 | 74 nomes de origem | 55 com uma ou mais cadeiras na tabela de pares; 19 sem pares |
| Processos locais | 106 | 76 registros com diretor e/ou dono | 0 referências organizacionais nesses campos |
| Decisões estratégicas | 122 | 110 responsáveis | 0 referências organizacionais para responsável |
| Riscos institucionais | 16 | 16 responsáveis | Responsáveis em texto, inclusive múltiplos |
| Participantes Sócios | 5 | 5 nomes de exibição | 4 com usuário; vínculo de acesso próprio, não cadeira |
| Perfis do aplicativo | 7 | 2 cargos preenchidos | Identidade por usuário, não cadastro organizacional de pessoas |
| Fit Finder — pares diretoria/cadeira | 8 | Diretoria externa textual | 8 pares com cadeira, ainda sujeitos ao fluxo próprio de confirmação |
| Check-in/checkout | 2 | Conteúdo estruturado | Cadeira por ID; 1 item de ata e 2 respostas KPI nos JSON consultados |
| Convites de metas | 8 | E-mail/nome de convite | Identidade/ativação não equivalem a atribuição organizacional |
| Participantes Pré-Offsite | 6 | Identidade autorizada | Reutilizam cadeiras e verificação de e-mail |

Fontes existentes sem registros: iniciativas, ações/entregas do item 2, riscos/impedimentos da rotina, status reports, reuniões de projeto, membros de projetos, EAP, cronograma, business cases de melhoria, gestão de pendências, pares de diretoria de processos e espelhos de processos/melhorias. Ter zero registros não elimina a necessidade de adaptar os formulários.

### Campos textuais e diversidade

| Campo | Preenchidos | Textos distintos |
|---|---:|---:|
| Ações de atas · responsável de origem | 171 | 74 |
| Organograma · ocupante | 130 | 126 |
| Projetos · diretor | 128 | 18 |
| Decisões · responsável | 110 | 33 |
| Processos · diretor | 57 | 5 |
| Processos · dono | 71 | 39 |
| Riscos institucionais · responsáveis | 16 | 15 |
| Fichas · ocupante | 9 | 9 |
| Cadeiras · diretor | 8 | 8 |

Diretor e dono de um mesmo processo podem estar preenchidos simultaneamente: são 128 campos em 76 processos, não 128 processos. Os 134 vínculos indiretos de atas foram contados pela tabela de pares `gov_responsaveis_map_cadeiras`; a coluna singular antiga está vazia/depreciada e produziria diagnóstico incorreto.

## Variações observadas e ambiguidades

- Yuri: Yuri (26), Yuri Garcia (31), Yuri Garcia Ribeiro (10), Yuri Ribeiro (1), além de textos compostos. A equivalência Ribeiro/Garcia foi solicitada, mas as correspondências de cada origem devem continuar sugeridas até aprovação.
- Bruno: Bruno (19), Bruno Garcia (42), Bruno Gracia (1). “Gracia” é provável grafia divergente, não correção aplicada.
- Iuri: Iuri (10), Iuri Franco (6), Iuri Eloi Franco (18); não confundir com Yuri.
- Guilherme: Guilherme (5), Guilherme Vieira (27); há responsáveis compostos com Felipe e Bruno.
- Naira: Naira (13), Naira Yurie (25); há nomes compostos com Jurídico/TI/consultores.
- Ian: Ian (20), Ian Camilo (2); há composições com RH, Conselho e lideranças.
- Felipe: Felipe (4), Felipe Souza (2), Felipe Lemos (1). Nome curto não autoriza fundir pessoas.
- Cleto: Cleto (2), Rodrigo Cleto (1), Dr. Rodrigo Cleto (1).

Contagens acima cobrem cadeiras, fichas, ocupantes do organograma, diretores/gerentes de projetos, responsáveis de atas e diretores/donos de processos; não incluem conteúdo de respostas dos Sócios ou narrativas privadas.

Conflitos de cargos: cadeira atual CPTO versus cargo importado CRO; cadeira CPPO versus cargo importado CTO; Comercial versus CCO; CMO / BU Certificações versus CMO. O organograma importado conserva grafia e agrupamentos da planilha; não é confirmação de vínculo ou de chefia. CRO do Fit Finder continua sendo diretoria agregada, potencialmente ligada a várias cadeiras: não renomear nem fundir automaticamente.

## Pontos de aplicação

- `useMetasBase` alimenta os cadastros de BSC, Cesta, KRs, iniciativas e diversas visões da rotina; preservar contratos com IDs de cadeira.
- `MetasSemanal` mantém responsáveis tipados: próprio diretor, cadeira, cargo/liderança e externo. Os contatos externos ficam em armazenamento privado separado, fora do JSON compartilhado.
- `AcoesEntregaCheckout` ainda usa responsável textual, inclusive pré-preenchimento por projeto/iniciativa.
- Projetos têm caminhos diferentes em `useProjetosDB`, `useProjetosGestao`, `GestaoProjeto`, `ProjetoDashboard` e `Submissao`; há dados apenas locais que precisam de inspeção/migração própria, sem fingir que são linhas do banco.
- Status report semanal usa cadeira principal; o componente mensal legado ainda contém correspondência pelo primeiro nome do portfólio estático. Preservar histórico e separar os fluxos.
- Governança, Fit Finder e processos já possuem fluxos explícitos de correspondência e confirmação; a base única deve complementá-los, sem autoaprovar ou alterar fonte externa.
- Sócios: identidade vem da lista de participantes e links pessoais. “Quem lidera” é resposta narrativa confidencial, não cadastro de pessoa; não alimentar o diretório nem IA com esse conteúdo.

## Pendências iniciais

- 15 cargos sem ocupante; 145 cargos sem vínculo explícito à cadeira de metas.
- 3 fichas estratégicas sem cadeira de metas; 6 cadeiras sem usuário titular associado.
- 139 projetos sem cadeira principal confirmada; sugestões existentes não devem ser aprovadas pela migração.
- 19 nomes de origem da Governança sem pares de cadeira; 48 ações sem endereçamento reconhecido.
- Não existe cadastro geral de pessoas com aliases, cargo, gestor, vigência e vínculo opcional ao usuário.
- Nomes compostos/grupos (“People”, “Comitê”, “O grupo”, “Felipe/Guilherme”) exigem decisão de pessoa versus cadeira versus múltiplos responsáveis.
- Chefias inferidas no organograma precisam de revisão; não inferir e-mails nem usuários a partir de primeiros nomes.

## Segurança e conflitos a preservar

O novo diretório não confere acesso a módulos, não altera `mt_usuarios`, convites, participantes Sócios/Pré-Offsite nem confirma titulares. A pessoa e o usuário autenticado são identidades distintas. Cargo é posição, cadeira é responsabilidade e diretoria agregada da integração não é uma cadeira individual. Renomear a base muda a apresentação dos vínculos aprovados, nunca o texto original ou snapshots de ciclos já enviados. Dados financeiros, contatos externos e respostas privadas ficam fora da sugestão geral de nomes.