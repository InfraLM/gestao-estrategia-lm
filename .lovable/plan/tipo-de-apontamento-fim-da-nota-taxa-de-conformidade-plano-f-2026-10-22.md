# Tipo de apontamento + fim da nota + taxa de conformidade (plano final)

## Decisões já tomadas pela Naira
- Lista de tipos **confirmada como está**: 41 de valor mensal (V), 41 de meta semestral/anual (S) e 5 de entrega (E). As 5 entregas são cesta.cleto.01, cesta.naira.02, cesta.naira.03, cesta.naira.04 e OKR3-KR2.
- **Farol de Entrega (regra simples):**
  - Implantada → On track.
  - Cancelada → Encerrada.
  - Prazo vencido sem Implantada, ou status "Atrasada" → Off track.
  - Dentro do prazo → Em acompanhamento.
- **Tipo S:** o diretor declara On/Off no mês, com justificativa obrigatória quando Off. A comparação automática entre meta e resultado só acontece no fim do período.
- **Tipo E:** fica fora da avaliação até o prazo. No prazo, Implantada = On.
- **Onde declarar:** no checkout semanal e em Lançar mês. Vale o apontamento mais recente.
- **Correções:** a Governança pode corrigir declarações, e cada correção fica registrada na auditoria.
- **Metas mensais que criamos dividindo a meta do semestre:** nos indicadores S, passam a se chamar "meta de referência" e não geram farol automático.
- **Recálculo:** só nos meses abertos.
- **Coluna "Status de Implantação" da planilha:** vira um selo no Cadastro BSC.
- **Sem apontamento:** aparece "Pendente de apontamento".
- **Nota mensal ponderada e régua de faixas:** saem de todas as telas. Os dados gravados ficam no banco como histórico: as notas já enviadas e os pesos com vigência.

## O que dependia da nota (vai mudar)
- **Lançar mês:** a nota calculada, a faixa e o envio do mês com nota. O envio do mês continua, mas sem nota.
- **Painel da Governança:** a nota por cadeira, a régua de faixas e o aviso de mudança da nota depois do envio. Esse aviso passa a avisar quando um valor foi alterado depois do envio.
- **Formulário semanal:** a faixa de cada KPI no retrato, a lista "no alvo" (calculada pela faixa) e o aviso "não altera a nota". A lista "no alvo" passa a usar On track.
- **Cesta de Metas:** o cadastro de pesos com vigência sai da tela, e os pesos ficam guardados.
- **Restrição de leitura das notas mensais** (só Governança, CEO e a própria cadeira): continua no banco, sem uso na tela.
- **Relatório de IA:** troca a nota pela taxa de conformidade.
- **Testes:** os testes da nota (ciclo, nota e pesos do CEO) são substituídos pelos testes das novas regras.

## Taxa de conformidade do preenchimento (definição proposta)
A **cadeira devida** é a que tem diretor vinculado na semana do ciclo. O ciclo é o par Checkout + Check-in, com envio único.

- **Pontualidade** = ciclos enviados até segunda 23h59 (horário de São Paulo) ÷ ciclos devidos.
- **Completude** = itens obrigatórios preenchidos no envio ÷ itens obrigatórios do ciclo. Os itens obrigatórios são:
  - KPI V com valor, ou marcado "sem medição" com comentário;
  - KPI S com declaração, e justificativa quando Off;
  - KPI E com status;
  - pelo menos uma prioridade para a semana seguinte;
  - toda pendência de ata com status;
  - no último ciclo do mês, status report de cada projeto principal da cadeira.
- **Ciclo conforme** = enviado no prazo e com 100% de completude.
- **Taxa de conformidade** = ciclos conformes ÷ ciclos devidos. Ciclo não enviado conta como não conforme. Junto com a taxa aparecem a pontualidade, a completude média e a tendência (mês atual contra o mês anterior), por mês e no acumulado do semestre.
- **Reabertura:** um ciclo reenviado depois do prazo conta como atrasado.
- **Retrato:** a completude fica gravada no primeiro envio, como já acontece com o retrato dos KPIs.

**Onde aparece:**
- Lançamentos › Painel, por cadeira.
- Visão semanal da Governança.
- Cartão "Sua conformidade" no formulário do diretor.
- Relatório mensal de IA, no lugar da nota.

## Etapas
1. **Banco:**
   - tipo de apontamento e prazo de entrega em cada indicador, com edição só pela Governança e auditoria;
   - gravar a lista confirmada;
   - campos de declaração, justificativa, status de entrega, % de avanço e evidência no lançamento mensal;
   - selo de implantação da planilha no Cadastro BSC;
   - consulta da conformidade por cadeira.
2. **Regra única de avaliação** por tipo (V, S, E e "Pendente de apontamento"), usada no checkout, em Lançar mês, na matriz e nos painéis. Testes para cada regra acima.
3. **Telas de apontamento:**
   - cartão do KPI por tipo no checkout e em Lançar mês;
   - rótulos separados: "meta mensal" × "meta semestral/anual" × "meta de referência", e "valor apontado" × "declaração do diretor" × "status de entrega";
   - Governança corrige com registro na auditoria.
4. **Retirar nota e faixas** de todas as telas, sem apagar os dados.
5. **Taxa de conformidade:**
   - cálculo, gravação no envio e testes da pontualidade, da completude e do ciclo não enviado;
   - Painel, visão da Governança e cartão do diretor.
6. **Matriz e relatório de IA:**
   - selo "declarado" e células de entrega na matriz;
   - desvio crítico só onde há atingimento numérico (V, e S no fim do período);
   - alerta "2+ meses declarados Off" para S e "prazo vencido" para E;
   - taxa de conformidade no relatório de IA.

## Decisões que restam
1. **Quem vê a taxa das outras cadeiras:** só Governança e CEO, ou todos os diretores? Cada diretor sempre vê a própria.
2. **Completude parcial:** um ciclo com 90% conta como não conforme (regra proposta, rígida) ou existe uma tolerância (ex.: 90% ou mais = conforme)?
3. **Status report sem anexo:** hoje gera só pendência, não bloqueio. Ele deve contar contra a completude?
4. **Ciclos devidos desde quando:** desde o ciclo de 26/10/2026 (primeiro com as regras novas) ou desde julho/2026?

## Detalhes técnicos
- `mt_indicadores.tipo_apontamento` (`valor_mensal|valor_periodo|entrega`, default `valor_mensal`) e `prazo_entrega`. A edição passa por um trigger que só permite `mt_is_governanca` e grava em `mt_auditoria`.
- `mt_lancamentos`: colunas nullable `declaracao`, `justificativa`, `status_entrega`, `avanco_pct`, `evidencia`. O checkout guarda os mesmos campos em `kpis_resposta`, e `rotina_situacoes_kpi` passa a devolvê-los. A regra "mais recente vence" compara a data do envio do checkout com o `updated_at` do lançamento.
- `avaliarKpiBsc(tipo, …)` devolve `fonte: calculado|declarado|entrega`. Entra a nova situação `pendente`, e `marcarCriticos` ignora células sem atingimento.
- `notaMensal.ts`, `faixaDe` e o cadastro de pesos deixam de ser importados pelas telas. Os dados ficam no banco.
- Conformidade: função pura `conformidadeCiclo` com testes, mais uma RPC `rotina_conformidade(_de, _ate)` com a mesma visibilidade decidida no item 1. A completude fica gravada em `conteudo.completude` no primeiro envio.
