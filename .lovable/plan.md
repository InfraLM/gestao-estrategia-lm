# Período do formulário semanal + KPIs do checkout

Cada ciclo junta o **checkout da semana que passou** e o **check-in da semana que começa**. A gravação continua por cadeira + semana + tipo, sem migrar nem reescrever registros (hoje não há nenhum registro semanal).

```text
Ciclo S = 26/10 (segunda)
  Aba "Check-in da semana"           -> registro (S,     checkin)   26/10 a 30/10
  Aba "Checkout da semana anterior"  -> registro (S - 7, checkout)  19/10 a 25/10
Cabeçalho: "Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26"
```

## Pré-requisito: diretores vinculados às cadeiras (não altero sem sua confirmação)
Hoje só **CEO (Ian)** e **Governança (Naira)** estão vinculados. Sem o vínculo, o diretor vê o formulário, mas não preenche o da própria cadeira.

| Cadeira | Diretor | Conta no app |
|---|---|---|
| COO | Yuri Garcia | existe (yuri.garcia@…) — falta vincular |
| Institucional | Cleto | existe (rodrigocleto@hotmail.com) — falta vincular |
| CFO | Bruno | sem conta — precisa de convite |
| CRO | Guilherme | sem conta — precisa de convite |
| CMO / BU Certificações | Iuri Franco | convite enviado, ainda não aceito |
| Comercial | Felipe | sem conta — precisa de convite |

Também existe uma segunda conta do Ian (iancamilocm@gmail.com). Ela não deve ser vinculada.

## 1. Abertura do ciclo, seletor e prazos (mantido)
- **Ciclo padrão** (horário de São Paulo): de segunda a quinta é a segunda atual; de **sexta 00h** a domingo é a **segunda seguinte**.
- **Seletor "Ciclo"**: mostra o próximo ciclo (a partir de sexta), o atual e os 5 anteriores. Cada opção traz o par, por exemplo "26/10 (checkout 19/10)".
- **Prazos**:
  - Check-in: segunda às 12h.
  - Checkout: sexta da semana retratada às 18h.
- **Selo "fora do prazo"**: compara o primeiro envio com o prazo (sem mudança).
- **Abas**: "Checkout da semana anterior" e "Check-in da semana".
- **Competência dos KPIs**: mês do domingo da semana retratada.
- **Painéis** (Visão semanal e Painel de Metas): mostram o mesmo par do formulário.
- **Também acompanham a semana certa**:
  - prioridades e herdadas;
  - envio sem duplicar;
  - riscos e pendências de comitês;
  - autosave.

## 2. Situação atual no cartão do KPI (nova regra)
Cada cartão do checkout mostra o subtítulo **"Última situação atual apontada: <valor> · <fonte> · <data>"**.

**De onde vem o valor** (vale o mais recente):
- (a) **Árvore de KPIs**: a "Situação atual" de cada KPI de BSC, já editável na tela do BSC. A data é a da última edição da árvore, ou "Rev.02" se nunca foi editada. A ligação com o indicador é pelo nome do KPI, que é igual nos dois lugares. KRs e cesta não têm situação na árvore, então para eles só vale (b).
- (b) **Último checkout enviado pela cadeira** que apontou situação para aquele KPI. Exemplo de fonte: "checkout de 12/10".

**Novo campo no cartão:** "Situação atual" (texto curto, opcional).
- Ao enviar, ele vira o último apontamento que aparece no checkout seguinte.
- Não altera a árvore de KPIs nem o lançamento mensal.
- O campo é gravado no registro semanal, por KPI. Não precisa de tabela nova.

**Meta do mês, realizado e atingimento:** continuam no cartão, ao vivo até o envio. No primeiro envio, é gravado o que o diretor viu, só para histórico. Isso substitui o congelamento na abertura e não conflita com a nova regra: são informações diferentes (números oficiais versus situação apontada pelo diretor). Ficam lado a lado.

**"Sem meta registrada":** aparece no lugar do atingimento quando não há meta da competência.

## 3. Conflito encontrado: BSC conta na nota mensal
O aviso atual do checkout diz que os KPIs de BSC não entram na nota. No cálculo do lançamento mensal, porém, os 43 KPIs de BSC estão com **peso 1 e entram na nota** (bloco "1. KPIs estratégicos do BSC"). O checkout não altera a nota, mas o aviso contradiz o cálculo oficial.

Para você decidir:
- (a) trocar o aviso para "Este formulário não altera sua nota";
- (b) tirar o BSC da nota mensal, o que mudaria as notas.

Até a decisão, proponho a opção (a), porque só corrige o texto.

## 4. C01-a NPS contínuo da marca passa para o CRO
- Efeito no checkout: sai da lista do COO (Yuri) e entra na do CRO (Guilherme).
- **Mexe na nota:** sim. Como tem peso 1, a nota do COO perde esse KPI e a do CRO ganha.
- **Mexe em lançamentos:** hoje não. Esse KPI não tem nenhum valor lançado, e nenhum mês foi fechado ou enviado. As 6 metas mensais acompanham o indicador.
- **Mexe na cesta:** não. Ele é do BSC, não da cesta.
- **Como fazer:** pelo cadastro normal (troca de cadeira), com registro na auditoria.

## 5. Pesos da cesta do CEO: 50% EBITDA / 50% NPS (com vigência)
- **Situação hoje:** o peso é um valor único por indicador, sem vigência. A nota do mês é recalculada com o peso atual, e a nota enviada fica guardada no envio. Nenhum mês está fechado e não há envios, então nada seria reescrito agora.
- **Caminho proposto:**
  - criar o registro de **peso com vigência** (indicador, competência inicial, peso, quem alterou, quando);
  - o cálculo da nota passa a usar o peso vigente em cada competência;
  - meses fechados nunca são recalculados;
  - a alteração entra na auditoria.
- **Prévia do efeito:** a nota do CEO hoje é (1 × AC01 + 0,33 × EBITDA + 0,33 × NPS) ÷ 1,66. Com 50/50 fica (1 × AC01 + 0,5 × EBITDA + 0,5 × NPS) ÷ 2.
  - O peso do AC01 cai de cerca de 60% para 50%, e EBITDA e NPS sobem de cerca de 20% para 25% cada.
  - Como ainda não há valores lançados, a prévia em números será exibida na própria tela antes de confirmar.
- **Pergunta:** a partir de qual competência passa a valer (julho/2026, início do semestre, ou outra)?

## 6. Lista de KPIs do checkout (mantido)
- **Entram:** BSC Estratégico e Tático em que a cadeira é a responsável, os KRs e a NSM ligados à cadeira, e toda a cesta (inclusive peso 0). O Operacional fica fora.
- **Nível:** passa a ser guardado em cada KPI, preenchido pela Rev.02, para que um Operacional cadastrado no futuro não entre por engano.

## Pendências não implementadas
- BHAG "Salvar vidas".
- Exibição "a/b" do C.02-a.04 duplicado.
- Vendas ACLS em SP: fica como está, três indicadores separados.
- Corresponsável como acompanhamento: não será feito.
- Aviso do BSC na nota (item 3).
- Competência de início dos pesos do CEO (item 5).

## Testes
- **Muda de resultado:** o teste do cabeçalho passa a esperar "Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26".
- **Novos:**
  - ciclo padrão: quinta 22/10 → 19/10; sexta 23/10 00h → 26/10;
  - checkout = ciclo − 7;
  - competência pelo domingo;
  - prazo do checkout = sexta 18h;
  - última situação: o mais recente entre árvore e checkout, com fonte e data;
  - o checkout sem envio não vira "último apontamento";
  - números gravados só no primeiro envio;
  - "Sem meta registrada";
  - nível Operacional fora;
  - peso vigente por competência: julho usa o antigo e a competência da vigência usa o novo, sem tocar mês fechado;
  - C01-a na lista do CRO e não na do COO.

## Detalhes técnicos
- Em `src/lib/rotinaSemanal.ts`:
  - `cicloPadrao` (America/Sao_Paulo), `semanaCheckout`, `competenciaDaSemana`, `periodoCiclo`;
  - `prazoDe`, reexportado pelas páginas atuais;
  - `ultimaSituacao(arvore, checkoutsEnviados, indicador)`.
- `kpis_resposta[]` ganha o campo `situacao_atual`. `kpis_retrato` passa a ser gravado no primeiro envio.
- `rotina_retrato` também devolve o nível e a "situação atual" da árvore. A árvore vem da edição salva do BSC, com fallback na Rev.02.
- **Banco:**
  - coluna opcional `nivel` em `mt_indicadores`;
  - tabela nova `mt_pesos_vigencia` (com permissões e regras de acesso só para a Governança gravar e leitura para quem já lê Metas);
  - o cálculo da nota em `MetasLancamento` e `MetasPainel` usa o peso vigente na competência.
- **Alterações de dados**, só depois da confirmação:
  - cadeira do C01-a → CRO;
  - pesos do CEO via vigência;
  - vínculos dos diretores.
- **AGENTS.md:** atualizar a regra do ciclo (check-in de S + checkout de S−7, abre na sexta) e registrar a regra do peso com vigência.
