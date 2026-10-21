# Período do formulário semanal no formato do sistema antigo

Cada ciclo passa a juntar duas semanas diferentes: o **checkout da semana que passou** e o **check-in da semana que começa**. Nada é migrado nem reescrito. A gravação continua por cadeira + semana + tipo; muda apenas qual semana cada aba edita.

```text
Semana selecionada S = 26/10 (segunda)
  Aba Check-in  -> registro (S,     checkin)   prioridades 26/10 a 30/10
  Aba Checkout  -> registro (S - 7, checkout)  retrospectiva 19/10 a 25/10
Cabeçalho: "Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26"
```

Proposta de segurança: o significado de cada registro não muda (o checkout da semana 19/10 continua sendo "o checkout de 19/10"). Por isso os registros já gravados continuam valendo sem conversão. Hoje não há nenhum registro na tabela.

## O que muda no formulário
- **Seletor de semana**: passa a se chamar "Ciclo" e lista as segundas do check-in (atual e 5 anteriores). Cada opção mostra o par, por exemplo "26/10 (checkout 19/10)". A semana padrão continua sendo a segunda atual.
- **Aba Checkout**: lê e grava o checkout da semana anterior. As entregas vêm do check-in dessa mesma semana anterior (o check-in de 19/10 é cobrado no checkout de 19/10), mais as prioridades herdadas de semanas ainda mais antigas.
- **Aba Check-in**: lê e grava o check-in da semana selecionada. As pendências de comitês continuam aqui.
- **Retrato dos KPIs**: congelado no checkout da semana anterior. A competência passa a ser o mês do **domingo** dessa semana. Exemplo: a semana 29/09 a 05/10 entra em outubro.
- **Envio sem duplicar**: o código de envio pertence ao registro de checkout, então segue certo para a semana retratada.
- **Riscos**: continuam da cadeira e não dependem de semana. Novos riscos registrados no check-in recebem a semana do check-in. A idade é contada a partir do check-in atual. Os riscos aparecem nas duas abas.
- **Autosave e cópia guardada no aparelho**: a chave passa a usar a semana real de cada registro, não a semana selecionada.

## Prazos e selo "fora do prazo"
- Check-in da semana S: **segunda S às 12h** (sem mudança).
- Checkout da semana S−7: hoje vence na sexta da própria semana às 18h. Pela nova lógica ele é preenchido na segunda seguinte. **Precisa de decisão (ver conflitos)**. A proposta é que vença na **segunda S às 12h**, junto com o check-in.
- O selo "fora do prazo" segue comparando o **primeiro envio** com o prazo do registro. Muda só o prazo do checkout.

## Painel de Governança
- **Visão semanal**: para a semana escolhida, mostra o check-in dela e o checkout da semana anterior lado a lado, com o mesmo cabeçalho do formulário. Isso é recomendado porque o diretor envia os dois no mesmo momento.
- **Painel de Metas** (quadro "Check-in / Checkout semana"): hoje mostra os dois da mesma semana e o texto "checkout sexta 18h". Proposta: mostrar o mesmo par do formulário e atualizar o texto do prazo. Ele usa o mesmo cálculo de prazo, então muda junto.

## Conflitos com regras atuais (para você decidir)
1. **Prazo do checkout**: a regra registrada é "checkout até sexta 18h". Se ela for mantida, todo checkout feito na segunda aparece como "fora do prazo". As opções são segunda 12h, segunda 18h ou manter sexta 18h.
2. **Rótulo das abas**: hoje elas dizem "Check-in (segunda)" e "Checkout (sexta)". A proposta é "Checkout da semana anterior" e "Check-in da semana".
3. **Competência dos KPIs**: a regra atual usa o mês da segunda-feira. Passar para o domingo muda a competência das semanas que cruzam a virada do mês. Sem registros hoje, isso não afeta nenhum dado.
4. **Painel de Metas**: ele mostra a "semana atual" dos dois envios. Se o painel for mantido por semana de registro, o par fica diferente do formulário. Recomendo alinhar.

## Testes
- O teste do cabeçalho muda de resultado: passa a esperar "Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26" para o ciclo 26/10.
- O teste de prioridades herdadas segue igual, porque usa a semana de registro.
- Testes novos:
  - semana do checkout = semana selecionada − 7;
  - competência pelo domingo (29/09 → 2026-10);
  - prazo do checkout conforme a decisão do conflito 1;
  - selo pelo primeiro envio.
- Os demais 179 testes não são afetados.

## Detalhes técnicos
- Em `src/lib/rotinaSemanal.ts`:
  - `semanaCheckout(S) = S − 7`;
  - `competenciaDaSemana(semana)` usa o domingo (semana + 6);
  - `periodoSemana(S)` passa a montar o par;
  - `prazoDe` vai para a biblioteca, com a regra escolhida, e é reexportado das páginas atuais para não quebrar as importações.
- Em `MetasSemanal`:
  - a busca carrega S e S−7 (mais o histórico);
  - as funções de gravação e o autosave usam a semana do tipo;
  - `prioridadesHerdadas` é chamada com S−7 para o checkout.
- `SemanalVisao` e `MetasPainel` passam a buscar o checkout da semana S−7.
- No `AGENTS.md`, a regra de check-in/checkout passa a dizer "um ciclo = check-in de S + checkout de S−7", substituindo a regra atual.
