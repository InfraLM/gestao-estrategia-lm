# Fase 4 · Estrutura Organizacional

## Entrega
- Substituir somente a página vazia de Estrutura Organizacional por leitura dos 11 registros existentes.
- Exibir árvore ordenada por `ordem`, com CEO e demais raízes no topo, filhas abaixo e lista indentada no celular.
- Exibir tabela com busca sem acento e filtro por nível.
- Abrir ficha lateral pelos cartões ou linhas, com todos os blocos solicitados, selos de status e referências. Links DS-NN respeitam o acesso atual a Insights Sócios.
- Incluir estados de carregamento, erro e vazio.

## Limites
- Nenhuma gravação, alteração de RLS, regras de acesso, componentes compartilhados ou outras páginas.
- Consultar `org_cadeiras` e os nomes vinculados de `mt_cadeiras` apenas pelo cliente atual, respeitando RLS.
- Sem IA ou exportações gerais.

## Detalhes técnicos e verificação
- Criar página, árvore/renderizador e funções puras em arquivos próprios; trocar apenas o reexport de EstruturaOrganizacional em Phase1Spaces.
- Reutilizar `semAcentos` e `parseStatus` sem modificá-los.
- Testar pais, filhos, órfãos, ordem e filtros; executar todos os testes existentes e conferir a tela autenticada em computador e celular.
- Comparar assinatura dos registros antes/depois; documentar a decisão em AGENTS.md e a conclusão no roadmap.