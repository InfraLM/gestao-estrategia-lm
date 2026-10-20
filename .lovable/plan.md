# Fase 5 — Incentivos e Insights da Cesta

- Conectar somente as duas páginas ao cliente atual, respeitando os registros visíveis e os acessos existentes.
- Incentivos: seletor de cadeira, regras e gatilhos, três blocos de metas; sistemas Metas 2S26 consultam indicadores ativos ao vivo, demais sistemas consultam suas metas próprias.
- Insights da Cesta: grupos por cadeira, contadores, busca e filtros; diálogo de edição apenas para usuários autorizados, gravando exclusivamente aderência, observação, data e autor da avaliação.
- Preservar tabelas, RLS, acesso, outras páginas, indicadores e todos os registros; sem IA, criação, exclusão ou exportação.
- Validar agrupamentos, metas, contadores e autorização por testes; conferir as duas telas com login e em celular.

## Dados encontrados
A consulta inicial encontrou **11 sistemas**, não os 14 descritos, além de 7 metas e 40 combinados. A tela mostrará os sistemas realmente existentes e visíveis, sem criar os faltantes.

## Detalhes técnicos
Criar páginas e helpers próprios, reutilizando os componentes atuais e as funções de texto sem modificá-los. Em Phase1Spaces, substituir apenas os dois espaços vazios por reexports. Atualizar a documentação da fase e executar todos os testes existentes.