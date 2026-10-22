export const contratoOrcamento = `# Pedido ao responsável pelo app de Orçamento Financeiro

Disponibilizar exportação somente leitura para o app Gestão e Estratégia.

GET HTTPS em endpoint dedicado; autenticar pelo cabeçalho x-integracao-token.
Token compartilhado forte, salvo no app de origem e no destino como ORC_EXPORT_TOKEN.
Endereço absoluto do endpoint salvo no destino como ORC_EXPORT_URL. Não enviar o token em conversa ou na URL.

Parâmetro opcional desde: timestamp UTC ISO 8601. Retornar todos os centros/meses alterados desde esse instante, incluindo correções; sem desde, exportação completa.

Resposta HTTP 200 application/json:
{
  "registros": [
    { "centro_custo": "CC-PROJETO-001", "competencia": "2026-10", "realizado": 12500.50, "orcado": 15000.00 }
  ]
}

centro_custo: identificador estável, textual, único no orçamento, até 200 caracteres (preservar zeros à esquerda).
competencia: AAAA-MM, mês contábil.
realizado: número JSON finito em BRL; total líquido acumulado do mês, NÃO movimentos individuais e NÃO valor incremental. Correções e estornos podem produzir valores negativos.
orcado: número JSON finito em BRL ou null; opcional. Não será tratado como budget liberado do projeto.
Cada par centro_custo+competencia aparece uma vez; limite 10.000 registros por resposta. Valores substituem o total mensal do par, não somam importações repetidas.
Para zerar mês corrigido, enviar realizado: 0; ausência de uma linha não exclui histórico.
Não enviar dados de alunos, Sócios, remuneração, descrições de lançamentos ou dados pessoais.
HTTP 401/403 para token inválido; erros sem segredos. Não redirecionar para outra origem.
Resposta vazia: {"registros":[]}. Definir com o responsável política de fechamento, atraso e meses com zero confirmado.

No Gestão e Estratégia: integração inicia desligada. Governança/CEO configuram, testam e sincronizam manualmente; não há agendamento automático.
Governança confirma projeto ↔ centro de custo; um projeto aceita vários centros, cada centro confirmado só pertence a um projeto, até existir regra explícita de rateio.
Planilha alternativa: cabeçalhos centro_custo, competencia, realizado (ou valor_realizado), orcado opcional; competência AAAA-MM; valor decimal BRL. Governança revisa a prévia e confirma importação.
Realizado por projeto/objetivo é acumulado até o mês atual, somente centros confirmados. Sem correspondência/valores não é zero. Budget só no objetivo principal, propostos e validados separados.
`;