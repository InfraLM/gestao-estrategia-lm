# Ciclo semanal, KPIs do checkout e BSC fora da nota (plano final)

## 1. Ciclo semanal
```text
Ciclo S = 26/10 (segunda)
  Aba "Check-in da semana"           -> registro (S,     checkin)   26/10 a 30/10
  Aba "Checkout da semana anterior"  -> registro (S - 7, checkout)  19/10 a 25/10
Cabeçalho: "Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26"
```
- A gravação continua por cadeira + semana + tipo, sem migrar registros.
- **Ciclo padrão** (horário de São Paulo): de segunda a quinta é a segunda atual; de sexta 00h a domingo é a segunda seguinte.
- **Seletor "Ciclo"**: o próximo ciclo (a partir de sexta), o atual e os 5 anteriores, cada um com o par de semanas.
- **Prazos**: check-in segunda 12h; checkout sexta 18h da semana retratada. O selo "fora do prazo" usa o primeiro envio.
- **Competência dos KPIs**: mês do domingo da semana retratada.
- **Seguem a semana certa**: prioridades e herdadas, envio sem duplicar, riscos, pendências de comitês e autosave.
- **Painéis**: a Visão semanal e o Painel de Metas mostram o mesmo par do formulário.

## 2. Cartão do KPI no checkout
- **Subtítulo**: "Última situação atual apontada: <valor> · <fonte> · <data>". Vale o mais recente entre a situação atual da árvore de KPIs (só BSC) e o último checkout enviado pela cadeira.
- **Novo campo "Situação atual"** (texto curto, opcional): ao enviar, vira o último apontamento. Não altera a árvore nem o lançamento mensal.
- **Meta do mês, realizado e atingimento**: ao vivo até o envio. No primeiro envio, ficam gravados como histórico.
- **Avaliação do BSC**: os KPIs de BSC mostram a avaliação do item 3, sem atingimento como nota.
- **Novo aviso**: "KPIs de BSC não entram na nota; são avaliados como on track / off track ao fim do mês ou do período da meta."
- **Lista**:
  - BSC Estratégico e Tático em que a cadeira é a responsável (o nível passa a ser guardado em cada KPI e o Operacional fica fora);
  - KRs e NSM da cadeira;
  - toda a cesta, inclusive peso 0.
- **"Sem meta registrada"**: aparece quando não há meta.

## 3. BSC sai da nota mensal e ganha avaliação
- **Nota mensal**: passa a contar só KRs e cesta. Os 43 KPIs de BSC continuam sendo lançados no formulário mensal, mas num bloco "Avaliação BSC (não entra na nota)".
- **Avaliação de cada KPI de BSC**, calculada na hora de ler e nunca guardada (mesmo princípio de "atrasada"):
  - **Com meta mensal**: compara o último apontamento com a meta do mês. Vale primeiro o realizado lançado; se não houver, a situação atual numérica do checkout ou da árvore.
    - Durante o mês: "Em acompanhamento".
    - Depois do último dia do mês: "On track" ou "Off track", em definitivo.
  - **Só com meta do semestre ou do ano**: "Em acompanhamento" até o fim do período (dezembro/2026), quando é avaliado meta × resultado.
  - **Sem meta, ou com meta que não dá para ler**: "Sem meta registrada".
- **"Menor é melhor"** (Turnover, Despesas de vendas, Churn etc.): On track quando o resultado ≤ meta. "Maior é melhor": On track quando o resultado ≥ meta. Não há faixa intermediária.
- **Metas em texto**:
  - "> 70", "≥ 70", "< 1,5%" e "≤ 1,5%" são lidas como número, e o sinal define o sentido;
  - "70 a 80" vira faixa (On track dentro dela);
  - textos sem número (como "verificar com Ian") contam como "Sem meta registrada".
  - Uma situação atual em texto livre não avalia; o cartão mostra o texto, e a avaliação fica "Em acompanhamento".
- **Onde aparece**:
  - **Painel de Metas**: nova coluna "BSC" por cadeira, com X on track, Y off track e Z em acompanhamento. A nota e a faixa passam a valer só para KRs e cesta.
  - **Visão da Governança (semanal)**: os mesmos contadores por cadeira, mais a lista dos Off track.
  - **Checkout**: selo no cartão de cada KPI de BSC.

### Nova composição da nota por cadeira (sem BSC; ainda não há lançamentos)
| Cadeira | Entra na nota |
|---|---|
| CEO | Cesta: EBITDA 50% + NPS 50% (com a vigência do item 4). Só a cesta. |
| Institucional | Cesta: 34 / 33 / 33 |
| COO | Cesta 50 / 50 + OKR3-KR2 e OKR3-KR4 (0,25 cada) |
| CFO | Cesta 34 / 33 / 33 + OKR2-KR1 a KR4 (0,25 cada); NSM-1 tem peso 0 e não conta |
| CRO | Cesta 4 × 25% + OKR1-KR1, KR2, KR4 e OKR3-KR1 (0,25 cada) |
| Governança | Cesta 4 × 25% + OKR3-KR3 (0,25) |
| CMO | Cesta 34 / 33 / 33 + OKR1-KR3 (0,25) |
| Comercial | Cesta 50 / 50. "VGV outros produtos" não tem meta e fica fora até ter. |

Ponto de atenção: a nota é a média ponderada dos itens com valor. Como a cesta soma 1,0 e cada KR pesa 0,25, uma cadeira com 4 KRs fica com cesta e KRs pesando 50/50 entre si (CFO e CRO), e uma com 1 KR fica com 80/20 (Governança e CMO). É o cálculo que já existe; só fica mais visível sem o BSC.

## 4. Pesos com vigência (CEO 50/50 a partir de julho/2026)
- **Novo registro de peso com vigência**: indicador, competência inicial, peso, quem alterou e quando, com auditoria. Só a Governança altera.
- A nota de cada mês usa o peso vigente naquela competência. Meses fechados nunca são recalculados (hoje nenhum está fechado).
- **Carga inicial**: EBITDA 0,50 e NPS 0,50 do CEO a partir de 2026-07. Os demais indicadores seguem com o peso atual.
- **Prévia**: a nota do CEO = 0,5 × EBITDA + 0,5 × NPS, só a cesta.

## 5. Ajustes de dados aprovados
- C01-a NPS contínuo da marca passa da cadeira COO para a CRO, com auditoria. Não há lançamentos dele, e as metas mensais acompanham o indicador.
- O nível (Estratégico/Tático) de cada KPI de BSC é preenchido a partir da Rev.02.

## Pendências (não implementadas)
- **Vínculo dos diretores**: nada será alterado e nenhum convite será enviado.
  - Falta vincular: COO (Yuri Garcia), Institucional (Cleto) e CMO (Iuri Franco, convite pendente).
  - Sem conta no app: CFO (Bruno), CRO (Guilherme) e Comercial (Felipe).
- **Outras**:
  - BHAG "Salvar vidas";
  - exibição a/b do C.02-a.04;
  - Vendas ACLS em SP (fica como está);
  - corresponsável como acompanhamento (não será feito).

## Testes
- **Muda de resultado**: o teste do cabeçalho passa a esperar "Checkout 19/10 a 25/10 · Check-in 26/10 a 30/10/26".
- **Novos**:
  - ciclo: quinta 22/10 → 19/10; sexta 23/10 00h (São Paulo) → 26/10;
  - checkout = ciclo − 7;
  - competência pelo domingo;
  - prazo do checkout = sexta 18h;
  - última situação: o mais recente entre árvore e checkout enviado;
  - números gravados no primeiro envio;
  - Operacional fora da lista;
  - C01-a na lista do CRO e não na do COO;
  - nota sem BSC (exemplo do CEO = só a cesta 50/50);
  - peso vigente por competência;
  - avaliação BSC:
    - durante o mês = "Em acompanhamento";
    - mês encerrado: On track / Off track;
    - "menor é melhor";
    - "> 70" e "< 1,5%";
    - texto sem número = "Sem meta registrada";
    - meta do semestre só avaliada após dezembro.

## Detalhes técnicos
- **`src/lib/rotinaSemanal.ts`**: `cicloPadrao`, `semanaCheckout`, `competenciaDaSemana`, `periodoCiclo`, `prazoDe` (reexportado) e `ultimaSituacao`.
- **`src/lib/avaliacaoBsc.ts`** (novo): `lerMeta(texto|numero)` e `avaliarBsc(indicador, metaMes, metaPeriodo, apontamento, hoje)`.
- **`src/lib/notaMensal.ts`** (novo): extrai o cálculo da nota hoje duplicado em `MetasLancamento` e `MetasPainel`; exclui `origem='bsc'` e aplica `pesoVigente(indicador, competencia)`.
- **Banco**:
  - coluna opcional `nivel` em `mt_indicadores`;
  - tabela `mt_pesos_vigencia` (permissões; leitura para quem lê Metas; escrita só pela Governança; trigger de auditoria em `mt_auditoria`);
  - `rotina_retrato` passa a devolver o nível, a situação atual da árvore e a meta do semestre.
- **Registro semanal**: `kpis_resposta[]` ganha `situacao_atual`; `kpis_retrato` é gravado no primeiro envio.
- **AGENTS.md**: substituir a regra "KPIs, KRs e Cesta… scoring treat them equally" por "BSC fica fora da nota, avaliado on/off track ao ler; nota = KRs + cesta com peso vigente por competência"; atualizar a regra do ciclo semanal.
