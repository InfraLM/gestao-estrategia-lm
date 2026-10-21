# Período do formulário semanal + lista de KPIs do checkout

Cada ciclo junta o **checkout da semana que passou** e o **check-in da semana que começa**. A gravação continua por cadeira + semana + tipo, sem migrar nem reescrever registros (hoje não há nenhum registro semanal).

```text
Ciclo S = 26/10 (segunda)
  Aba "Check-in da semana"           -> registro (S,     checkin)   26/10 a 30/10
  Aba "Checkout da semana anterior"  -> registro (S - 7, checkout)  19/10 a 25/10
Cabeçalho: "Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26"
```

## 1. Abertura do ciclo, seletor e prazos
- **Ciclo padrão** (horário de São Paulo):
  - de segunda a quinta: a segunda da semana atual;
  - de **sexta 00h** a domingo: a **segunda seguinte**.
  - Exemplo: na sexta 23/10 o padrão já é o ciclo 26/10.
- **Seletor "Ciclo"**: mostra o próximo ciclo (a partir de sexta), o atual e os 5 anteriores. Cada opção traz o par, por exemplo "26/10 (checkout 19/10)".
- **Prazos**:
  - Check-in da semana S: **segunda S às 12h** (sem mudança).
  - Checkout da semana S−7: **sexta da própria semana retratada às 18h** (sem mudança). No exemplo, o checkout de 19/10 vence na sexta 23/10 às 18h.
- **Selo "fora do prazo"**: compara o primeiro envio com o prazo do registro (sem mudança).
- **Abas**: passam a se chamar "Checkout da semana anterior" e "Check-in da semana".
- **Competência dos KPIs**: mês do **domingo** da semana retratada.

## 2. Ponto de atenção: retrato congelado com abertura na sexta
Hoje o retrato dos KPIs congela na primeira abertura do checkout. Com o ciclo abrindo na sexta, isso aconteceria antes de a semana retratada terminar (sábado e domingo ficam de fora) e, em geral, antes do lançamento mensal. O realizado tende a sair vazio.

Opções para você decidir:
- **(a) Congelar no primeiro envio** (recomendado). Até enviar, o cartão mostra os valores ao vivo com o selo "provisório". No primeiro envio, eles são gravados e não mudam mais, nem em reenvios. Assim os números ficam iguais aos que o diretor viu quando respondeu.
- (b) Manter o congelamento na primeira abertura, aceitando os números de sexta.
- (c) Congelar na primeira abertura a partir de segunda 00h. Até lá, os valores ficam ao vivo.

## 3. O que acompanha a semana certa
- **Prioridades**:
  - As entregas do checkout vêm do check-in da mesma semana retratada (check-in de 19/10 → checkout de 19/10).
  - As prioridades herdadas são as de semanas anteriores a ela.
- **Envio sem duplicar**: o código de envio pertence ao registro de checkout de S−7.
- **Riscos**: continuam sendo da cadeira e aparecem nas duas abas. A idade é contada até o ciclo S.
- **Pendências de comitês**: ficam na aba de check-in de S.
- **Autosave e cópia guardada no aparelho**: usam a semana real de cada registro.

## 4. Painéis
- **Visão semanal**: para o ciclo escolhido, mostra o check-in de S e o checkout de S−7, com o mesmo cabeçalho do formulário.
- **Painel de Metas**:
  - o quadro "Check-in / Checkout" passa a mostrar o par do ciclo atual (com a mesma abertura antecipada na sexta);
  - o texto dos prazos continua "check-in segunda 12h, checkout sexta 18h".

## 5. Lista de KPIs do checkout por cadeira — conferência com a planilha
**Regra:**
- BSC dos níveis Estratégico e Tático em que a cadeira é a responsável;
- KRs e NSM dos OKRs 2026/2 ligados à cadeira;
- toda a cesta 2026/2 da cadeira, inclusive peso 0.

O nível Operacional fica fora.

### Situação no banco
- O banco tem **43 KPIs de BSC**, exatamente os 11 Estratégicos e 32 Táticos da Rev.02. Nenhum Operacional está cadastrado, então o filtro por nível já é atendido hoje.
- O nível não é guardado em cada indicador. Proposta: guardar o nível (campo novo) para que um Operacional cadastrado no futuro não entre por engano.
- O corresponsável não existe no banco; cada KPI tem uma única cadeira.

### Conferência por diretor (o que bate e o que diverge)
| Cadeira | BSC | Cesta | KRs/NSM ligados hoje |
|---|---|---|---|
| CEO (Ian) | AC01 bate | **Pesos 33% / 33% no banco; planilha diz 50% / 50%** | nenhum |
| Institucional (Cleto) | nenhum, bate | 34 / 33 / 33 bate | nenhum |
| COO (Yuri) | 16 da planilha batem; **banco tem também C01-a NPS contínuo da marca** | 50 / 50 bate | OKR3-KR2, OKR3-KR4 |
| CFO (Bruno) | 7 batem | 34 / 33 / 33 bate | NSM-1, OKR2-KR1 a KR4 |
| CRO (Guilherme) | 8 batem; **falta C01-a NPS contínuo da marca** (está com o COO) | 4 × 25% bate | OKR1-KR1, KR2, KR4, OKR3-KR1 |
| Governança (Naira) | 4 batem | 4 × 25% bate | OKR3-KR3 |
| CMO (Iuri Franco) | 4 batem | 34 / 33 / 33 bate | OKR1-KR3 |
| Comercial (Felipe) | P02.03 já cadastrado, bate | 50 / 50 bate; VGV outros produtos sem meta | nenhum |

### Pontos para você decidir
1. **C01-a NPS contínuo da marca**: a Rev.02 (base do banco) dá o COO como responsável; a planilha de 17/09 dá o CRO. Qual vale?
2. **Pesos da cesta do CEO**: corrigir para 50% / 50%? Isso altera a nota mensal do CEO. Peço confirmação antes de mexer.
3. **BHAG "Salvar vidas"**: não tem nível nem está cadastrado. Entra como KPI do CEO?
4. **Código C.02-a.04 duplicado**: está repetido no banco (Faturamento do aluno e Percepção de carreira). Proposta: diferenciar como C.02-a.04a e C.02-a.04b na exibição, sem mudar o código interno.
5. **Dono dos OKRs**: o banco liga cada KR a uma cadeira, seguindo o responsável do arquivo de OKRs 2026/2. A planilha não diz o dono. Os vínculos estão na tabela acima. Confirme se valem.
6. **Yuri Ribeiro**: não existe no banco nem na Rev.02 (só "Yuri", o COO). Como ele só aparece em Operacionais, que ficam fora, não há impacto. Confirme se é outra pessoa.
7. **Vendas ACLS em SP**: hoje são **três indicadores separados**, um por cadeira (COO, CRO e CMO), cada um com meta 192 e lançamento próprio. Cada diretor vê e responde o seu. Isso não é um indicador compartilhado com responsável único. Mantemos assim?
8. **Corresponsável como "acompanhamento"**: proposta opcional de mostrar, abaixo da lista, os KPIs em que a cadeira é corresponsável segundo a Rev.02, sem pergunta. Exigiria guardar os corresponsáveis. Fica para você decidir.

### "Sem meta registrada"
Quando não há meta mensal da competência, o cartão mostra "Sem meta registrada" em vez de atingimento, e o atalho "no alvo" ignora esse KPI. No banco, estão sem meta do semestre:
- **os que você citou**: P02.01, P02.03, P03-a/b, P03.03 e C.01-b;
- **outros**: P01, AC02, AC02.04, F02.02, P01.01, C.02-a.04 (percepção), VGV outros produtos e OKR1-KR4.

O aviso "KPIs de BSC não entram na sua nota" continua.

### Acesso dos diretores
Só o CEO e a Governança estão ligados a uma cadeira como diretor. Os demais diretores conseguem ver o formulário, mas não preencher o da própria cadeira até serem vinculados no cadastro.

## Testes
- **Muda de resultado**: o teste do cabeçalho passa a esperar "Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26".
- **Seguem iguais**: os demais testes, incluindo o de prioridades herdadas.
- **Novos**:
  - ciclo padrão na quinta 22/10 → 19/10;
  - ciclo padrão na sexta 23/10 00h (horário de São Paulo) → 26/10;
  - checkout = ciclo − 7;
  - competência pelo domingo (29/09 → 2026-10);
  - prazo do checkout = sexta da semana retratada às 18h;
  - retrato conforme a opção escolhida no item 2;
  - "Sem meta registrada";
  - nível Operacional fora da lista.

## Detalhes técnicos
- Em `src/lib/rotinaSemanal.ts` entram as funções:
  - `cicloPadrao(agora)` (em America/Sao_Paulo);
  - `semanaCheckout(S)`;
  - `competenciaDaSemana(semana)` (pelo domingo);
  - `periodoCiclo(S)`;
  - `prazoDe`, reexportada das páginas atuais.
- `MetasSemanal`:
  - carrega S e S−7;
  - gravação e autosave usam a semana do tipo;
  - herdadas são calculadas a partir de S−7.
- `SemanalVisao` e `MetasPainel` passam a ler o par do ciclo.
- Se o item 2 ficar na opção (a), `rotina_retrato` é chamado ao vivo até o envio, e `kpis_retrato` é gravado no primeiro envio.
- Nível do KPI: coluna opcional `nivel` em `mt_indicadores`, preenchida a partir da Rev.02. O retrato filtra Estratégico/Tático para `origem = 'bsc'`.
- Correções de dados (C01-a, pesos do CEO, BHAG) só depois da sua decisão, sem mexer em lançamentos já feitos.
- No `AGENTS.md`, a regra de check-in/checkout passa a dizer "ciclo = check-in de S + checkout de S−7; abre na sexta".
