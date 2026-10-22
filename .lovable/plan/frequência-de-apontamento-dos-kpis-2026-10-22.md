# Frequência de apontamento dos KPIs

## Resultado
Aplicar o calendário da Naira a partir do ciclo de **26/10/2026**, preservando histórico, responsáveis, prazo de segunda 23h59 e avaliação V/S/E.

## Entregas
1. **Classificação e conferência:** casar os 43 KPIs BSC por código/nome; carregar o calendário fornecido e listar não encontrados e divergências de responsável. Criar propostas de frequência para KRs 2026/2 e Cesta, com justificativa e alertas de carga acima de aproximadamente três por semana.
2. **Cadastro e calendário:** Governança/CEO edita e confirma frequência, mês/semana, velocidades e tratamento, com histórico. Mostrar propostas e calendário por diretor com contagem semanal nos cadastros existentes. Nesta etapa, alterações ficam somente com Governança/CEO, sem criar fluxo adicional de sugestões do diretor.
3. **Formulário:** selecionar apenas KPIs devidos no ciclo e mostrar o último período fechado correspondente; contar somente esses na completude e nos avisos de e-mail. Ciclos anteriores continuam usando seu retrato histórico.
4. **Desvio crítico:** adicionar KPI próprio fora do calendário com valor, causa, impacto e ação; mostrar na pauta da Governança. Cobrança mensal até duas leituras normais consecutivas, com retorno automático auditado.
5. **Avaliação e matriz:** manter a última leitura para frequências trimestral/semestral entre apontamentos, sem criar falsa pendência; sinalizar células sem previsão como “fora do calendário”.
6. **Verificação:** testes de semanas 1/3 e 5, períodos trimestrais/semestrais, autorização, completude e retorno após duas leituras normais; conferência autenticada do formulário sem gravar dados reais de teste.

## Premissas e conflitos a apresentar
- “Semana do mês” significa a posição da **segunda-feira**, não blocos de sete dias a partir do dia 1.
- O calendário enviado prevalece para BSC; não ajustar sua distribuição automaticamente para caber em três KPIs por semana.
- NPS continua com Guilherme/CPTO no app, apesar de Yuri na lista. Os dois indicadores C.02-a.04 serão distinguidos por nome.
- Frequência não muda o tipo V/S/E: S continua declaração e E continua status de entrega. Velocidades/tratamentos não fornecidos serão propostas identificadas, nunca dados atribuídos à planilha.
- Para desvio crítico, “leitura normal” será **On track pela regra única vigente**, em dois períodos de cobrança distintos; reenviar o mesmo período não conta duas vezes. Datas vencidas de entrega continuam avaliadas mesmo fora do calendário.
- Avisos por e-mail continuam desligados: envio real ainda depende do domínio e conexão pendentes.

## Detalhes técnicos
- Alterações aditivas em `mt_indicadores`, regras compartilhadas de calendário e período, configuração auditada por funções protegidas; carga inicial feita separadamente da criação do esquema.
- Guardar o calendário no retrato do checkout no primeiro envio, sem recalcular ciclos históricos com configurações novas.
- Registro protegido de desvios e leituras, com transição idempotente no envio do ciclo; nenhuma tarefa recorrente para detectar retorno.
- Reutilizar cadastros, avaliação única, matriz, painel e projeção de destinatários existentes; não ampliar acesso a conteúdo de outras cadeiras.
- Atualizar notas do projeto e testes junto às regras alteradas.