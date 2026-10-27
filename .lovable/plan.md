# Base única da estrutura organizacional

## Diagnóstico concluído

Foram consultados os cadastros atuais, sem alterar dados ou acessos:

| Área | Resultado |
|---|---|
| Cadeiras | 8; somente 2 titulares vinculados a usuário |
| Fichas estratégicas | 11; 8 ligadas às cadeiras atuais |
| Organograma | 145 cargos; 130 ocupantes em texto; nenhum cargo ligado explicitamente à cadeira atual |
| Projetos | 152; 128 diretores em texto; 13 cadeiras principais confirmadas |
| Ações de atas | 182; 171 responsáveis em texto; 134 endereçadas por correspondência existente; 48 aguardando avaliação |
| Correspondências de atas | 74 nomes; 55 com pares de cadeira; 19 sem pares |
| Processos locais | 106; 76 com diretor/dono em texto |
| Decisões e riscos institucionais | 110 responsáveis textuais em decisões e 16 em riscos |
| Sócios | 5 participantes; identidade e acesso próprios, sem usar respostas no diretório |
| Fit Finder | 8 pares diretoria/cadeira; preservar agrupamento e confirmação próprios |

Iniciativas, ações/entregas do item 2, riscos da rotina, status reports e reuniões de projeto estão sem registros, mas os formulários já existem. Há também portfólio/dados locais do navegador, que não entram nas contagens do banco.

Variações observadas: **Yuri / Yuri Garcia / Yuri Garcia Ribeiro / Yuri Ribeiro; Bruno / Bruno Garcia / Bruno Gracia; Iuri / Iuri Franco / Iuri Eloi Franco; Guilherme / Guilherme Vieira; Naira / Naira Yurie; Ian / Ian Camilo; Felipe / Felipe Souza / Felipe Lemos; Cleto / Rodrigo Cleto / Dr. Rodrigo Cleto**. Há nomes compostos e grupos, que não podem ser vinculados automaticamente.

Conflitos de cargo: **CPTO × CRO, CPPO × CTO, Comercial × CCO** no organograma importado. CRO do Fit Finder é diretoria agregada e não será fundido com CPTO.

O inventário detalhado foi registrado em `docs/diagnostico-base-organizacional.md`.

## Incremento 1 — Base e manutenção

- Acrescentar **Base organizacional** em Estrutura, com listas pesquisáveis de cadeiras, cargos e pessoas, situação ativa e pendências de revisão.
- Reutilizar IDs atuais de cadeiras e cargos; acrescentar código/sigla/titular e os vínculos que faltam, sem substituir fichas estratégicas ou apagar o organograma.
- Pessoas: nome oficial, aliases, e-mail quando já conhecido, cargo, cadeira, gestor, ativo e usuário opcional. Não incluir remuneração, CPF ou avaliação individual.
- Popular com registros existentes. Importar nomes ainda não identificados como **a revisar**, sem inventar sobrenomes, e-mails, cargo ou cadeira e sem fundir homônimos.
- Registrar vigência de cargo/cadeira, autor, data e antes/depois. Governança/CEO editam; diretores consultam o diretório mínimo, sem receber acesso adicional às fichas ou ao Fit Finder.
- Testar manutenção, renomeação, hierarquia sem ciclos, revisão, vigência e autorização antes do próximo incremento.

## Incremento 2 — Correspondências de nomes

- Tela administrativa **Correspondências de nomes**, com origem/campo, texto original, candidato pessoa/cadeira, confiança, motivo e status.
- Sugestões determinísticas por nome oficial, alias e vínculo já existente. Correspondências ambíguas ficam sem candidato único ou em baixa confiança; IA não é necessária para afirmar equivalências sem evidência.
- Filtros, seleção, troca manual, aprovação/rejeição por linha e em massa, confirmação das quantidades e auditoria.
- Ninguém aprova durante a implementação. Textos antigos permanecem; antes da aprovação aparecem com **sem vínculo**.
- Preservar pares confirmados de Governança/Fit Finder/processos e responsáveis múltiplos. Uma sugestão organizacional nunca confirma uma integração por conta própria.
- Testar alias Yuri Ribeiro → Yuri Garcia, distinguir Iuri, homônimos, nomes compostos, rejeição persistente, aprovação explícita e proteção dos textos históricos.

## Incremento 3 — Aplicação aos formulários

- Listas pesquisáveis em prioridades, entregas, iniciativas, riscos/impedimentos, pendências e fila sem dono; projetos, gerentes, EAP/cronograma, atas e responsáveis de reuniões; BSC/Cesta/KRs e seletores de integração, vínculos e status.
- Preservar a distinção entre pessoa, cadeira, cargo, próprio diretor e contato externo. Ao escolher uma pessoa, sugerir/preencher sua cadeira **apenas no campo permitido**, sem reatribuir a cadeira principal de um projeto fora da aprovação atual.
- Vínculos aprovados exibem o nome atual da base. Campos antigos e ciclos enviados mantêm seus textos/snapshots originais e contratos de envio.
- Adaptar ambos os caminhos de projetos e o status report legado, sem unificar os dois fluxos de status report.
- Pessoas sem usuário podem ser responsáveis organizacionais, mas não ganham acesso ao aplicativo. Contatos externos continuam privados; não são importados automaticamente no diretório.
- Identidade de Sócios/Pré-Offsite permanece governada pelos participantes existentes. Respostas narrativas/confidenciais não viram nomes do diretório nem entrada de IA.

## Incremento 4 — Validação e entrega

- Testes isolados após cada incremento: permissões, preservação de texto, aprovação/auditoria, renomeação refletida nos vínculos, cadeira automática, histórico/vigência, responsáveis múltiplos e ciclos enviados intactos.
- Conferir computador/celular, pesquisa, teclado, confirmação em massa, estados de salvar/erro e salvamento seguido de releitura usando dados fictícios interceptados.
- Consultar a base real somente para confirmar a população inicial e as pendências. Não gravar respostas, ciclos, status reports ou correspondências aprovadas de teste.
- Entregar diagnóstico final e contagem de cargos sem pessoa, pessoas sem cadeira/cargo/usuário e sugestões pendentes. Lembrar de **Publicar**; não publicar automaticamente.

## Detalhes técnicos

- Alterações aditivas; `mt_cadeiras.id` segue sendo a identidade da cadeira usada pelos contratos existentes. `org_organograma_cargos` continua representando posições; `org_cadeiras` conserva os mandatos.
- Novas pessoas, vigências, correspondências e auditoria usam RLS e concessões explícitas. Escritas e aprovações passam por funções protegidas e auditadas; criar/editar pessoa não modifica roles, convites ou `mt_usuarios`.
- Diretório mínimo de opções separado dos dados administrativos de revisão/auditoria. Correspondências administrativas não expõem registros privados nem conteúdo de outras cadeiras.
- Vínculos opcionais/associativos guardam IDs junto ao texto legado. Projeções de apresentação resolvem somente vínculos aprovados e fontes já acessíveis ao solicitante.
- Integrações continuam desligadas onde já estão desligadas e jamais escrevem de volta na Governança ou no app de processos.

## Conflitos e decisões de segurança

- **Uma pessoa não é uma cadeira, cargo ou usuário.** Não alterar atribuições ou acessos por equivalência de nome.
- **“Todos os campos” não inclui narrativa privada:** textos de Sócios, observações e contatos externos permanecem privados; os campos formais de responsabilidade usam a base.
- **Renomear uma vez** atualiza nomes de vínculos aprovados; não reescreve snapshots enviados ou texto original.
- **Diretores leem o diretório mínimo**, mas isso não abre automaticamente o módulo Estrutura completo nem dados do Fit Finder.
- **População inicial não é aprovação:** vínculos preexistentes permanecem; correspondências novas continuam sugeridas para a Naira.