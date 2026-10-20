# Fase 6 — Links diretos para fichas

- Centralizar links D-NNN e DS-NN em um helper que valida o código e gera a URL com `?codigo=`.
- Usar a URL como seleção da ficha em Contexto e decisões e Insights Sócios; abrir após a consulta atual terminar, somente se o registro estiver visível.
- Abrir, navegar e fechar atualizam a URL por substituição, sem acumular histórico; filtros existentes permanecem intactos.
- Código ausente, inválido ou não visível mostra aviso discreto e mantém a lista, sem consultas privilegiadas.
- Atualizar os renderizadores dos espaços novos e a coluna Decisão da Cesta; preservar a autorização atual dos links DS.
- Testar geração, leitura, código inexistente e atualização do parâmetro; conferir D-060 e DS-43 com login, links cruzados e celular.

## Limites
Sem alterações em dados, tabelas, RLS, acessos, menu, componentes de UI ou páginas fora dos espaços novos. Atualizar somente a documentação desta fase.