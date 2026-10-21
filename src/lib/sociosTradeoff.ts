// Regras do módulo "Desejos dos Sócios 2027" — funções puras, sem acesso ao banco.

export type Opcao = { v: string; label: string; labelCurto?: string };
export type Pergunta = { code: string; num: number; etapa: number; titulo: string; enunciado?: string; help?: string; helps?: string[]; citacao?: string; opcoes: Opcao[] };

export const PRAZO_TEXTO = "06/11/26";
export const PRAZO_ISO = "2026-11-06T23:59:59-03:00";

export const PERGUNTAS: Pergunta[] = [
  { code: "motor", num: 1, etapa: 2, titulo: "Motor 1 × Motor 2",
    help: "Motor 1 = core atual (PPG, FPG e ACLS) com as melhorias em curso. Motor 2 = novas avenidas: Clube, centro de simulação, parcerias hospitalares, gestão em saúde e soluções financeiras.",
    opcoes: [
      { v: "A", label: "Só Motor 1 até os gatilhos (3 meses de caixa, dados confiáveis)" },
      { v: "B", label: "Motor 1 dominante + uma aposta pequena do Motor 2, isolada, com teto e dono" },
      { v: "C", label: "Os dois motores com peso relevante" },
      { v: "D", label: "Motor 2 como prioridade (core em manutenção)" },
    ] },
  { code: "principio", num: 2, etapa: 2, titulo: "Princípio de decisão",
    citacao: "Só fazemos o que deixa o médico mais seguro diante do paciente grave, e se paga.",
    help: "Este princípio serviria de filtro para qualquer nova iniciativa em 2027.",
    opcoes: [{ v: "A", label: "Concordo" }, { v: "B", label: "Concordo com ajustes" }, { v: "C", label: "Discordo" }] },
  { code: "ritmo", num: 3, etapa: 2, titulo: "Ritmo, caixa e financiamento",
    enunciado: "Quando crescer e gerar caixa entrarem em conflito em 2027, o que deve vencer? E vale financiar alguma aposta de crescimento?",
    help: "A janela de território vai até 2028 (fusão Afya–Yduqs). Crescer acima do caixa gerado exige dívida a ~2,45% a.m.",
    helps: [
      "Quando financiar faz sentido: só para algo com prazo para acontecer e que devolva mais do que o custo do dinheiro (~34% a.a.). No cenário atual, a candidata é a expansão da prática em SP dentro da janela da fusão Afya–Yduqs (conclusão prevista até mar/2028).",
      "O risco no LTV/CAC: a expansão pode derrubar o LTV/CAC da PPG (já projetado de 4,1x para 3,4x) se só deslocar alunos que já comprariam, se o CAC subir num mercado mais caro ou se o custo da prática em SP comer a margem.",
    ],
    opcoes: [
      { v: "A", label: "Crescer no máximo, mesmo com dívida" },
      { v: "B", label: "Crescer só o que o caixa gerado paga" },
      { v: "C", label: "Rentabilidade e distribuição primeiro" },
      { v: "D", label: "Caixa + financiamento só com retorno e prazo: crescer no ritmo do caixa, financiando apenas iniciativas com prazo estabelecido para devolver o investimento e que devolvam mais do que o custo do dinheiro." },
    ] },
  { code: "portfolio", num: 4, etapa: 2, titulo: "Portfólio de produtos",
    enunciado: "Qual postura de portfólio a LM deve ter em 2027? E o que fazer com cada produto?",
    helps: [
      "Core: PPG, FPG e ACLS.",
      "Resultados: receita bruta realizada jan–ago/26 de R$ 27,1 mi, com a PPG em 90%. Margem e CAC por produto ainda não estão validados (falta o P&L por produto); os LTV/CAC são projeções da modelagem v1 para 2030.",
      "Produtos que se pagam: POCUS e Paliativos têm LTV/CAC projetado de 4,4x e 4,0x para 2030 e se sustentariam sem depender da ascensão para a PPG. Hoje, porém, somam 0,9% da receita e estão com tráfego pago e vendas novas pausados (D-075). 'Se pagam' é projeção até o P&L por produto ser validado.",
      "Teste controlado: produto novo só entra com teto de investimento, prazo e critério de sucesso definidos antes de começar. Se não bater o critério, encerra.",
      "Orçamento fantasma: reserva prevista no orçamento, mas não comprometida: só é liberada quando um teste ou produto novo passa nos critérios. Se não for usada, volta para o caixa.",
    ],
    opcoes: [
      { v: "A", label: "Só o core: PPG, FPG e ACLS." },
      { v: "B", label: "Core + produtos do portfólio atual que se pagam pela projeção 2030 (ex.: POCUS 4,4x e Paliativos 4,0x), mantidos só se o P&L por produto confirmar a margem.", labelCurto: "Core + portfólio que se paga (proj. 2030)" },
      { v: "C", label: "Core + produtos mediante viabilidade: teto, prazo e critério de sucesso claros." },
      { v: "D", label: "Core + produtos do portfólio atual que se pagam + orçamento fantasma para testes e novos produtos." },
    ] },
  { code: "trafego", num: 5, etapa: 2, titulo: "Tráfego e mídia",
    help: "Ascensão = o aluno entra por FPG ou ACLS e depois compra a PPG. Hoje a ascensão ainda é premissa, não dado.",
    opcoes: [
      { v: "A", label: "Manter o foco da mídia na PPG" },
      { v: "B", label: "Testar parte em FPG/ACLS medindo a ascensão real" },
      { v: "C", label: "Migrar a maior parte para ascensão" },
    ] },
  { code: "novo", num: 6, etapa: 2, titulo: "Como nasce o novo",
    help: "Onde e com quem o Motor 2 seria construído.",
    opcoes: [
      { v: "A", label: "Dentro das diretorias atuais" },
      { v: "B", label: "Frente separada com executivos dedicados" },
      { v: "C", label: "Squad novo, com o time atual como consultoria" },
    ] },
  { code: "caixa_min", num: 8, etapa: 3, titulo: "Caixa mínimo",
    help: "Hoje o caixa mínimo é de ~1,3 a 1,4 mês, com venda parcelada em até 25x.",
    opcoes: [{ v: "1", label: "1 mês" }, { v: "2", label: "2 meses" }, { v: "3", label: "3 meses" }, { v: "6", label: "6 meses ou mais" }] },
  { code: "divida", num: 9, etapa: 3, titulo: "Dívida em 2027",
    help: "Custo atual da dívida: ~2,45% a.m. (~34% a.a.).",
    opcoes: [
      { v: "A", label: "Para crescer" }, { v: "B", label: "Para distribuir lucros" },
      { v: "C", label: "Para as duas coisas" }, { v: "D", label: "Nenhuma dívida em 2027" },
    ] },
  { code: "ddl", num: 10, etapa: 3, titulo: "Distribuição de lucros (DDL)",
    help: "Como a distribuição deve acontecer entre os sócios. Informação confidencial.",
    opcoes: [{ v: "A", label: "Proporcional e automática" }, { v: "B", label: "Cada sócio decide a sua" }, { v: "C", label: "Outra" }] },
  { code: "venda", num: 11, etapa: 3, titulo: "Venda e horizonte pessoal",
    help: "Sua intenção sobre uma eventual venda da empresa e seu horizonte na LM.",
    opcoes: [{ v: "A", label: "Tenho intenção de vender" }, { v: "B", label: "É uma opção se a proposta for boa" }, { v: "C", label: "Não quero vender" }] },
  { code: "sucessao", num: 12, etapa: 3, titulo: "Sucessão",
    help: "O que acontece com a participação se um sócio sair ou faltar.",
    opcoes: [{ v: "A", label: "A empresa recompra em parcelas" }, { v: "B", label: "A família vira sócia sem voto" }, { v: "C", label: "Outra" }] },
];

export const PERGUNTA = Object.fromEntries(PERGUNTAS.map(p => [p.code, p])) as Record<string, Pergunta>;

export const INVEST_ITENS: Opcao[] = [
  { v: "sp", label: "Expansão em SP (hub and spoke)" },
  { v: "novos", label: "Novos produtos ou canais" },
  { v: "tech", label: "Tecnologia e dados" },
  { v: "pessoas", label: "Pessoas e liderança" },
  { v: "reserva", label: "Reserva de caixa" },
  { v: "distrib", label: "Distribuição aos sócios" },
];

export const FIN_APOSTAS: Opcao[] = [
  { v: "sp", label: "Expansão da prática em SP (hub and spoke)" },
  { v: "praca", label: "Outra praça" },
  { v: "motor2", label: "Aposta do Motor 2" },
  { v: "outra", label: "Outra" },
];

export type CriterioFin = { id: string; grupo: string; label: string; unidade?: string };
export const FIN_CRITERIOS: CriterioFin[] = [
  { id: "medido", grupo: "Antes de liberar", label: "CAC, ramp-up e qualidade da praça medidos (no dicionário de indicadores) antes da 1ª parcela" },
  { id: "parcelas", grupo: "Antes de liberar", label: "Liberação em parcelas, cada uma com gate e gatilho de reversão" },
  { id: "incremental", grupo: "Mercado e unit economics", label: "Incrementalidade: a maior parte do crescimento vem de alunos novos, não de quem já compraria" },
  { id: "cac", grupo: "Mercado e unit economics", label: "CAC da praça ≤ CAC médio da PPG" },
  { id: "ltv", grupo: "Mercado e unit economics", label: "LTV calculado sobre a margem, depois do custo da prática, ≥ LTV de GO e sem desconto de entrada" },
  { id: "ltv_cac", grupo: "Mercado e unit economics", label: "LTV/CAC da coorte de no mínimo __x", unidade: "x" },
  { id: "payback", grupo: "Mercado e unit economics", label: "Payback de cada parcela de no máximo __ meses", unidade: "meses" },
  { id: "ocupacao", grupo: "Qualidade e capacidade", label: "Ocupação ≥ 70% e CSAT ≥ 9,0 por 3 meses (régua da diretriz M2)" },
  { id: "vagas", grupo: "Qualidade e capacidade", label: "Vagas de prática contratadas antes da venda" },
  { id: "adimplencia", grupo: "Caixa e risco", label: "Adimplência da coorte ≥ média" },
  { id: "piso", grupo: "Caixa e risco", label: "Caixa nunca abaixo do piso no pior cenário simulado" },
  { id: "custo", grupo: "Caixa e risco", label: "Custo do financiamento de no máximo __% ao mês", unidade: "% a.m." },
];

export const ACOES_PRODUTO: Opcao[] = [{ v: "crescer", label: "Crescer" }, { v: "manter", label: "Manter" }, { v: "reduzir", label: "Reduzir" }, { v: "encerrar", label: "Encerrar" }];
export type ProdutoInfo = { id: string; nome: string; resultados: string[] };
/** Padrão dos resultados por produto — editável pela Naira via useConteudo("socios.produtos2027"). */
export const PRODUTOS_2027: ProdutoInfo[] = [
  { id: "ppg", nome: "PPG", resultados: ["Realizado jan–ago/26: R$ 24,5 mi (90% da receita bruta) · 729 vendas", "Set/26 em Ads: CAC R$ 3,6 mil e ROAS 14x", "LTV/CAC 2030 (proj.): 4,1x → 3,4x"] },
  { id: "fpg_online", nome: "FPG Online", resultados: ["Realizado jan–ago/26: R$ 0,76 mi (2,8%)", "LTV/CAC 2030 (proj.): 1,7x sozinho, 2,8x com ascensão · ascensão ainda não medida (sinal: R$ 0,65 mi migraram de FPG para PPG em jan–ago)"] },
  { id: "fpg_presencial", nome: "FPG Presencial", resultados: ["Realizado jan–ago/26: R$ 0,64 mi (2,4%)", "LTV/CAC 2030 (proj.): 0,7x sozinho, 2,9x se 20% ascendem · ascensão ainda não medida"] },
  { id: "acls", nome: "ACLS", resultados: ["Realizado jan–ago/26: ACLS + ATLS R$ 0,59 mi (2,2%) · ACLS SP: 50 de 144 vendas na meta", "LTV/CAC 2030 (proj.): 1,2x sozinho, 5,6x com ascensão"] },
  { id: "pocus", nome: "POCUS", resultados: ["Realizado jan–ago/26: R$ 0,15 mi (0,6%) · set/26: 6 vendas da pós, ROAS 3,3x; Imersão e Online abaixo de 1x", "LTV/CAC 2030 (proj.): 4,4x · tráfego pago e novas vendas da pós pausados (D-075)"] },
  { id: "paliativos", nome: "Paliativos", resultados: ["Realizado jan–ago/26: R$ 0,08 mi (0,3%) · set/26: 2 vendas, ROAS 1,5x", "LTV/CAC 2030 (proj.): 4,0x · tráfego pago e novas vendas pausados (D-075)"] },
];

/** Versão atual das opções da pergunta 4. Respostas sem essa marca vieram do modelo antigo. */
export const PORTFOLIO_VERSAO = 2;

/** Compatibilidade: no modelo antigo, portfolio C = "portfólio aberto com testes", que hoje é a opção D. */
export function normalizar(r: Respostas | null | undefined): Respostas {
  const x: Respostas = { ...(r ?? {}) };
  if (x.portfolio && x.portfolio_v !== PORTFOLIO_VERSAO) {
    if (x.portfolio === "C") x.portfolio = "D";
    x.portfolio_v = PORTFOLIO_VERSAO;
  }
  return x;
}

export const financia = (r: Respostas) => r.ritmo === "A" || r.ritmo === "D";
export const criteriosMarcados = (r: Respostas) => FIN_CRITERIOS.filter(c => r.fin_criterios?.[c.id]?.on);
const fmtNum = (v: any) => String(v).replace(".", ",");
export function criterioTexto(c: CriterioFin, valor: any): string {
  if (!c.unidade) return c.label;
  const v = valor === undefined || valor === null || valor === "" ? "__" : fmtNum(valor);
  return c.label.replace("__", v);
}
export function criteriosResumo(r: Respostas): string {
  return criteriosMarcados(r).map(c => criterioTexto(c, r.fin_criterios?.[c.id]?.valor)).join("; ");
}
const brl = (v: any) => { const n = num(v); return n === null ? String(v ?? "") : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); };

export const PAPEIS: Opcao[] = [
  { v: "ceo", label: "CEO / liderança geral" },
  { v: "executivo", label: "Executivo / diretor com escopo de entrega" },
  { v: "motor2", label: "Líder do Motor 2" },
  { v: "institucional", label: "Institucional / embaixador" },
  { v: "conselheiro", label: "Conselheiro" },
  { v: "investidor", label: "Sócio investidor" },
];
export const TEMPOS: Opcao[] = [{ v: "100", label: "100%" }, { v: "75", label: "~75%" }, { v: "50", label: "~50%" }, { v: "25", label: "25% ou menos" }];
export const JANELAS_VENDA: Opcao[] = [{ v: "2028", label: "Até 2028" }, { v: "2030", label: "Em 2030" }, { v: "pos2030", label: "Depois de 2030" }, { v: "na", label: "Não se aplica" }];
export const HORIZONTES: Opcao[] = [{ v: "2", label: "Até 2 anos" }, { v: "4", label: "3 a 4 anos" }, { v: "9", label: "5 a 9 anos" }, { v: "10", label: "10 anos ou mais" }];
export const PAPEL_FIM: Opcao[] = [{ v: "executivo", label: "Dia a dia executivo" }, { v: "conselho", label: "Conselho e estratégia" }, { v: "investidor", label: "Só sócio investidor" }];
export const CADENCIAS: Opcao[] = [{ v: "mensal", label: "Mensal" }, { v: "trimestral", label: "Trimestral" }, { v: "semestral", label: "Semestral" }];
export const CONSEQUENCIAS: Opcao[] = [
  { v: "voto", label: "Voto contra e peço revisão" },
  { v: "temporario", label: "Aceito se for temporário, com prazo" },
  { v: "papel", label: "Reavalio meu papel ou participação" },
];

export type LinhaVermelha = { id: string; grupo: string; label: string; unidade?: string };
export const LINHAS_VERMELHAS: LinhaVermelha[] = [
  { id: "caixa_abaixo", grupo: "Caixa e dívida", label: "Caixa abaixo de __ meses", unidade: "meses" },
  { id: "divida_total", grupo: "Caixa e dívida", label: "Dívida total acima de R$ __", unidade: "R$" },
  { id: "divida_custo", grupo: "Caixa e dívida", label: "Dívida com custo acima de __% a.m.", unidade: "% a.m." },
  { id: "divida_distrib", grupo: "Caixa e dívida", label: "Dívida para distribuir lucros" },
  { id: "margem_abaixo", grupo: "Resultado e sociedade", label: "Margem líquida abaixo de __%", unidade: "%" },
  { id: "ddl_reduzir", grupo: "Resultado e sociedade", label: "Reduzir ou atrasar a DDL" },
  { id: "diluir", grupo: "Resultado e sociedade", label: "Diluir participação" },
  { id: "vender_antes", grupo: "Resultado e sociedade", label: "Vender antes de 2030" },
  { id: "motor2_antes", grupo: "Estratégia e produto", label: "Abrir o Motor 2 antes dos gatilhos" },
  { id: "prioridades", grupo: "Estratégia e produto", label: "Mais de __ prioridades no ano", unidade: "prioridades" },
  { id: "sem_pratica", grupo: "Estratégia e produto", label: "Produto ou parceria sem prática supervisionada" },
  { id: "qualidade", grupo: "Estratégia e produto", label: "Comprometer qualidade ou segurança da prática para crescer" },
  { id: "dedicacao", grupo: "Gestão e governança", label: "Sócio executivo sem dedicação mínima" },
  { id: "fora_rituais", grupo: "Gestão e governança", label: "Decisões fora dos rituais e da alçada (Método LIVRE)" },
];

export type Diretriz = { texto: string; objetivos: string[]; porque?: string };
export type Projeto = { nome: string; objetivos: string[]; kpis: string[]; kpi_outro?: string; problema?: string; esforco?: string; dono?: string };
export type Respostas = Record<string, any> & {
  invest?: string[]; invest_ok?: boolean; resultados?: string[];
  lv?: Record<string, { on?: boolean; valor?: number | string }>;
};
export type FormDados = { respostas: Respostas; diretrizes: Diretriz[]; projetos: Projeto[]; extras: Record<string, any> };

export const CUSTO_DIVIDA_AM = 2.45;

const num = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** Posição de um item no ranking de investimento convertida em 0–100 (1º = 100 … 6º = 0). */
export function pontoRanking(invest: string[] | undefined, item: string): number | null {
  if (!invest || invest.length !== INVEST_ITENS.length) return null;
  const i = invest.indexOf(item);
  if (i < 0) return null;
  return Math.round(100 - (i * 100) / (INVEST_ITENS.length - 1));
}

const media = (vals: (number | null | undefined)[]): number | null => {
  const v = vals.filter((x): x is number => typeof x === "number");
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};

export type Eixos = { core: number | null; caixa: number | null; retorno: number | null };

export function calcularEixos(r0: Respostas): Eixos {
  const r = normalizar(r0);
  const rk = r.invest_ok ? r.invest : undefined;
  const reserva = pontoRanking(rk, "reserva");
  return {
    core: media([
      ({ A: 0, B: 30, C: 70, D: 100 } as any)[r.motor],
      ({ A: 0, B: 35, C: 50, D: 70 } as any)[r.portfolio],
      ({ A: 0, B: 50, C: 100 } as any)[r.trafego],
      pontoRanking(rk, "novos"),
    ]),
    caixa: media([
      ({ A: 100, B: 50, C: 10, D: 70 } as any)[r.ritmo],
      ({ A: 100, C: 70, B: 30, D: 0 } as any)[r.divida],
      ({ "1": 100, "2": 65, "3": 35, "6": 0 } as any)[r.caixa_min],
      pontoRanking(rk, "sp"),
      reserva === null ? null : 100 - reserva,
    ]),
    retorno: media([
      ({ A: 0, B: 35, C: 100, D: 20 } as any)[r.ritmo],
      ({ B: 100, C: 70, A: 10, D: 30 } as any)[r.divida],
      pontoRanking(rk, "distrib"),
    ]),
  };
}

export function posicionamento(r: Respostas, e: Eixos = calcularEixos(r)): { titulo: string; frase?: string } | null {
  if (!r.motor || e.caixa === null) return null;
  const core = r.motor === "A" || r.motor === "B";
  const acelera = e.caixa >= 50;
  const titulo = core ? (acelera ? "Acelerar o core" : "Arrumar a casa") : (acelera ? "Aproveitar a janela em duas frentes" : "Abrir avenidas com prudência");
  let frase: string | undefined;
  if (e.retorno !== null && e.retorno >= 60) frase = "Com ênfase em retorno aos sócios.";
  else if (e.retorno !== null && e.retorno <= 30) frase = "Com ênfase em reinvestir o resultado no negócio.";
  return { titulo, frase };
}

const ESCOLHAS: Record<string, Record<string, [string, string]>> = {
  motor: {
    A: ["Foco total no core até os gatilhos", "Novas avenidas em 2027"],
    B: ["Core dominante com uma aposta controlada", "Velocidade nas novas avenidas"],
    C: ["Dois motores em paralelo", "Foco e simplicidade de gestão"],
    D: ["Construir o futuro já", "Crescimento do core no curto prazo"],
  },
  ritmo: {
    A: ["Velocidade para ocupar território", "Caixa e custo financeiro baixo"],
    B: ["Crescimento autofinanciado", "Parte da janela até 2028"],
    C: ["Rentabilidade e distribuição", "Ritmo de crescimento"],
    D: ["Caixa como regra, financiando só iniciativas com prazo para devolver e retorno acima do custo do dinheiro", "Velocidade: iniciativas sem retorno comprovado no prazo esperam o caixa"],
  },
  portfolio: {
    A: ["Simplicidade: só os três produtos do core", "Receita de POCUS e Paliativos, que se pagam sozinhos"],
    B: ["Core mais produtos que se pagam pela projeção 2030, condicionados ao P&L por produto", "Testar produtos novos em 2027"],
    C: ["Core protegido, com novos produtos só quando a viabilidade estiver comprovada (teto, prazo e critério de sucesso)", "Receita de POCUS e Paliativos fora do foco, e velocidade de lançamento"],
    D: ["Core, portfólio atual que se paga e um orçamento fantasma: reserva liberada só para testes e novos produtos que passarem nos critérios", "Parte do caixa fica reservada e indisponível para outros usos enquanto houver teste em avaliação"],
  },
  trafego: {
    A: ["Mídia onde o retorno é provado (PPG)", "Aprender sobre ascensão"],
    B: ["Testar ascensão com medição", "Parte da verba da PPG"],
    C: ["Aposta na ascensão", "Previsibilidade da PPG"],
  },
  caixa_min: {
    "1": ["Usar o caixa para crescer", "Proteção contra imprevistos"],
    "2": ["Folga moderada", "Parte da velocidade"],
    "3": ["Segurança de caixa", "Velocidade e parte da distribuição"],
    "6": ["Blindagem financeira", "Crescimento e distribuição no curto prazo"],
  },
  divida: {
    A: ["Alavancar o crescimento", "Custo financeiro (~34% a.a.)"],
    B: ["Distribuir mesmo sem caixa", "Custo financeiro sem retorno operacional"],
    C: ["Flexibilidade total", "Custo financeiro e caixa"],
    D: ["Zero custo financeiro novo", "Velocidade"],
  },
  venda: {
    A: ["Liquidez para os sócios", "Construção de longo prazo"],
    B: ["Opcionalidade", "Clareza de horizonte"],
    C: ["Construção de longo prazo", "Liquidez antecipada"],
  },
};

export function escolhas(r0: Respostas): { tema: string; escolhe: string; abre: string }[] {
  const r = normalizar(r0);
  const temas: Record<string, string> = { motor: "Motor", ritmo: "Ritmo", portfolio: "Portfólio", trafego: "Mídia", caixa_min: "Caixa", divida: "Dívida", venda: "Horizonte" };
  return Object.keys(temas).flatMap(k => {
    const t = ESCOLHAS[k]?.[r[k]];
    return t ? [{ tema: temas[k], escolhe: t[0], abre: t[1] }] : [];
  });
}

export function tensoes(r0: Respostas): string[] {
  const r = normalizar(r0);
  const out: string[] = [];
  const lv = r.lv ?? {};
  const on = (id: string) => !!lv[id]?.on;
  const val = (id: string) => num(lv[id]?.valor);
  const motor2 = r.motor === "C" || r.motor === "D";
  const tempo = num(r.tempo);
  const horiz = num(r.horizonte);
  const executivo = ["ceo", "executivo", "motor2"].includes(r.papel_tipo);

  if (financia(r) && r.divida === "D") out.push(r.ritmo === "A" ? "Quer crescer no máximo, mas não aceita dívida: o crescimento ficará limitado ao caixa gerado." : "Aceita financiar iniciativas com retorno e prazo, mas não aceita nenhuma dívida em 2027.");
  const crit = criteriosMarcados(r);
  const cv = (id: string) => num(r.fin_criterios?.[id]?.on ? r.fin_criterios?.[id]?.valor : null);
  if (r.ritmo === "D" && !crit.length) out.push("Escolheu financiar só com retorno e prazo, mas não marcou nenhum critério para liberar o financiamento.");
  if (r.ritmo === "A" && crit.length < 3) out.push("Quer crescer no máximo com dívida, mas exige menos de 3 critérios para liberar o financiamento.");
  if (financia(r) && !r.fin_criterios?.incremental?.on) out.push("Aceita financiar crescimento sem exigir incrementalidade: a expansão pode só deslocar alunos que já comprariam e derrubar o LTV/CAC.");
  const ltvCac = cv("ltv_cac"), custoFin = cv("custo"), custoDivida = num(r.divida_custo);
  if (financia(r) && ltvCac !== null && ltvCac < 3.5) out.push(`LTV/CAC mínimo de ${fmtNum(ltvCac)}x está abaixo do critério do conselheiro (3,5x) e perto da PPG 2030 (3,4x).`);
  if (financia(r) && custoFin !== null && custoDivida !== null && custoFin > custoDivida) out.push(`O custo máximo do financiamento (${fmtNum(custoFin)}% a.m.) é maior que o custo máximo de dívida da pergunta 9 (${fmtNum(custoDivida)}% a.m.).`);
  const pr = (r.produtos ?? {}) as Record<string, string>;
  if ((r.portfolio === "B" || r.portfolio === "D") && ["pocus", "paliativos"].some(p => pr[p] === "crescer")) out.push("Crescer POCUS ou Paliativos se apoia na projeção 2030: hoje eles somam 0,9% da receita e estão com vendas novas pausadas (D-075). Crescer exige retomar as vendas e validar a margem no P&L por produto.");
  if ((r.portfolio === "A" || r.portfolio === "C") && ["pocus", "paliativos"].some(p => pr[p] === "manter" || pr[p] === "crescer")) out.push("A postura de portfólio deixa POCUS e Paliativos fora do foco, mas você marcou Manter/Crescer para eles.");
  if (pr.fpg_presencial === "crescer" && r.trafego === "A") out.push("Quer crescer a FPG Presencial com a mídia focada na PPG: sozinha ela tem LTV/CAC projetado de 0,7x, e a ascensão não seria medida.");
  if (pr.ppg === "reduzir" || pr.ppg === "encerrar") out.push("Reduzir ou encerrar a PPG afeta ~79% da receita projetada.");
  if ((r.portfolio === "C" || r.portfolio === "D") && !String(r.produto_novo ?? "").trim()) out.push("Escolheu abrir espaço para produtos novos, mas não indicou qual testaria primeiro, com teto, prazo e critério de sucesso.");
  const caixaMin = num(r.caixa_min), caixaLinha = val("caixa_abaixo");
  if (r.ritmo === "A" && caixaMin !== null && caixaMin >= 3) out.push("Quer acelerar e também manter 3 meses ou mais de caixa: hoje o caixa é de ~1,3 mês.");
  if (r.divida === "B" || r.divida === "C") out.push("Dívida para distribuir lucros custa ~34% a.a. sem gerar retorno operacional.");
  if (motor2 && r.ritmo === "C") out.push("Motor 2 relevante exige investimento, o que conflita com priorizar rentabilidade e distribuição.");
  if (motor2 && r.novo === "A") out.push("Motor 2 relevante dentro das diretorias atuais tende a disputar atenção com o core.");
  if (r.motor === "A" && (r.portfolio === "D" || r.trafego === "C")) out.push("Escolheu só Motor 1, mas abriu portfólio ou mídia para além do core.");
  const prioridades = val("prioridades");
  if (on("prioridades") && prioridades !== null && prioridades >= 3 && prioridades <= 5 && motor2 && r.portfolio === "D") out.push("Limita o ano a 3 a 5 prioridades, mas escolheu dois motores e portfólio aberto: as frentes disputam o mesmo foco.");
  if (r.invest_ok && r.invest?.[0] === "distrib" && r.ritmo === "A") out.push("Distribuição em 1º no ranking não combina com crescimento máximo.");
  if (r.caixa_min === "1" && (r.divida === "A" || r.divida === "C")) out.push("Caixa mínimo de 1 mês com dívida para crescer deixa pouca margem de segurança.");
  if (r.venda === "A" && horiz !== null && horiz >= 9) out.push("Tem intenção de vender, mas prevê 5 anos ou mais ativo na LM.");
  if (r.venda === "C" && horiz !== null && horiz <= 4) out.push("Não quer vender, mas prevê até 4 anos ativo: defina o plano de sucessão do seu papel.");
  if (r.venda_janela && ["2028", "2030"].includes(r.venda_janela) && motor2) out.push("Venda até 2030 com Motor 2 relevante: o comprador pode não pagar por apostas ainda imaturas.");
  if (executivo && tempo !== null && tempo <= 50) out.push("Função executiva com 50% ou menos do tempo dedicado.");
  if (r.papel_tipo === "motor2" && r.motor === "A") out.push("Quer liderar o Motor 2, mas escolheu só Motor 1 em 2027.");
  if (on("divida_distrib") && (r.divida === "B" || r.divida === "C")) out.push("Marcou dívida para distribuir como linha vermelha, mas aceitou dívida para isso.");
  if (caixaLinha !== null && caixaMin !== null && caixaLinha > caixaMin) out.push("Sua linha vermelha de caixa é maior que o caixa mínimo que você escolheu.");
  const teto = num(r.divida_custo) ?? (on("divida_custo") ? val("divida_custo") : null);
  if (teto !== null && teto < CUSTO_DIVIDA_AM && r.divida !== "D") out.push(`Seu teto de custo (${teto}% a.m.) está abaixo do custo atual da dívida (${CUSTO_DIVIDA_AM.toString().replace(".", ",")}% a.m.).`);
  if (on("motor2_antes") && motor2) out.push("Marcou abrir Motor 2 antes dos gatilhos como linha vermelha, mas escolheu Motor 2 relevante.");
  if (on("vender_antes") && r.venda_janela === "2028") out.push("Marcou vender antes de 2030 como linha vermelha, mas indicou venda até 2028.");
  if (on("ddl_reduzir") && r.ritmo === "A") out.push("Não aceita reduzir a DDL, mas quer crescimento máximo.");
  return out;
}

/** Objetivos do BSC sugeridos (top 4) a partir das escolhas. */
export function objetivosSugeridos(r0: Respostas): string[] {
  const r = normalizar(r0);
  const pts: Record<string, number> = {};
  const add = (cods: string[], p = 1) => cods.forEach(c => (pts[c] = (pts[c] ?? 0) + p));
  if (r.motor === "A" || r.motor === "B") add(["P.01", "F.02"], 2);
  if (r.motor === "C" || r.motor === "D") add(["F.01", "AC.03"], 2);
  if (r.ritmo === "A") add(["P.02", "P.03"]);
  if (r.ritmo === "B" || r.ritmo === "C") add(["F.02"]);
  if (r.ritmo === "D") { add(["P.03"], 2); add(["F.02"]); }
  if (["B", "C", "D"].includes(r.portfolio)) add(["F.01"]);
  if (r.trafego === "B" || r.trafego === "C") add(["F.01"]);
  if (r.invest_ok && r.invest) {
    const map: Record<string, string[]> = { sp: ["P.03", "P.02"], tech: ["AC.03"], pessoas: ["AC.02"], reserva: ["F.02"], distrib: ["F.02"], novos: ["F.01"] };
    r.invest.slice(0, 3).forEach((it, i) => add(map[it] ?? [], 3 - i));
  }
  return Object.entries(pts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4).map(([c]) => c);
}

/** Pontos de partida: diretrizes sugeridas a partir das respostas. */
export function diretrizesSugeridas(r0: Respostas): Diretriz[] {
  const r = normalizar(r0);
  const out: Diretriz[] = [];
  const m: Record<string, Diretriz> = {
    A: { texto: "Concentrar 2027 no Motor 1 (PPG, FPG e ACLS) até atingir 3 meses de caixa e dados confiáveis.", objetivos: ["P.01", "F.02"] },
    B: { texto: "Manter o Motor 1 dominante e abrir uma única aposta do Motor 2, isolada, com teto de investimento e dono.", objetivos: ["P.01", "F.01"] },
    C: { texto: "Operar os dois motores com metas e orçamento próprios para cada um.", objetivos: ["F.01", "AC.03"] },
    D: { texto: "Priorizar o Motor 2 e manter o core em regime de manutenção.", objetivos: ["F.01", "AC.03"] },
  };
  if (m[r.motor]) out.push(m[r.motor]);
  const cm = num(r.cresc_min), mm = num(r.margem_min);
  const metas = [cm !== null ? `crescimento mínimo de receita de ${cm}%` : "", mm !== null ? `margem líquida mínima de ${mm}%` : ""].filter(Boolean).join(" e ");
  if (r.ritmo === "A") out.push({ texto: `Crescer no máximo da janela até 2028${metas ? `, com ${metas}` : ""}.`, objetivos: ["P.02", "P.03"] });
  if (r.ritmo === "B") out.push({ texto: `Crescer apenas o que o caixa gerado paga${metas ? `, com ${metas}` : ""}.`, objetivos: ["F.02"] });
  if (r.ritmo === "C") out.push({ texto: `Priorizar rentabilidade e distribuição${metas ? `, com ${metas}` : ""}.`, objetivos: ["F.02"] });
  if (r.ritmo === "D") {
    const aposta = FIN_APOSTAS.find(o => o.v === r.fin_aposta)?.label ?? "a definir";
    const teto = num(r.fin_teto) !== null ? brl(r.fin_teto) : "a definir";
    const crits = criteriosMarcados(r).slice(0, 3).map(c => criterioTexto(c, r.fin_criterios?.[c.id]?.valor).replace(/^./, s => s.toLowerCase()));
    out.push({ texto: `Crescer no ritmo do caixa, financiando apenas iniciativas com prazo estabelecido para devolver o investimento e retorno acima do custo do dinheiro, tendo como primeira candidata: ${aposta}, com teto total de ${teto}, em parcelas liberadas só com ${crits.length ? crits.join("; ") : "critérios a definir"}.`, objetivos: ["P.03", "F.02"] });
  }
  if (r.portfolio === "C") out.push({ texto: "Manter o core e só lançar novos produtos mediante viabilidade comprovada: teto de investimento, prazo e critério de sucesso claros antes de começar.", objetivos: ["F.01", "P.01"] });
  if (r.portfolio === "D") out.push({ texto: "Manter o core e os produtos do portfólio atual que se pagam, com um orçamento fantasma para testes e novos produtos: reserva liberada só para iniciativas com teto, prazo e critério de sucesso aprovados; o que não for usado volta ao caixa.", objetivos: ["F.01", "P.01"] });
  if (r.caixa_min) out.push({ texto: `Manter caixa mínimo de ${r.caixa_min === "6" ? "6 meses ou mais" : `${r.caixa_min} ${r.caixa_min === "1" ? "mês" : "meses"}`}.`, objetivos: ["F.02"] });
  if (r.principio === "A" || r.principio === "B") out.push({ texto: "Toda nova iniciativa precisa deixar o médico mais seguro diante do paciente grave e se pagar.", objetivos: ["P.01"] });
  if (r.trafego === "B") out.push({ texto: "Testar parte da mídia em FPG/ACLS medindo a ascensão real para a PPG antes de ampliar.", objetivos: ["F.01"] });
  if (r.divida === "D") out.push({ texto: "Não contratar dívida nova em 2027.", objetivos: ["F.02"] });
  return out;
}

export type Pendencia = { etapa: number; campo: string; msg: string };

export function validarEnvio(d: FormDados): Pendencia[] {
  const r = d.respostas ?? {};
  const out: Pendencia[] = [];
  for (const p of PERGUNTAS) {
    if (p.code === "novo" && r.motor === "A") continue;
    if (!r[p.code]) out.push({ etapa: p.etapa, campo: p.code, msg: `${p.num}. ${p.titulo}: escolha uma opção` });
  }
  if (!r.invest_ok || !r.invest || r.invest.length !== INVEST_ITENS.length) out.push({ etapa: 2, campo: "invest", msg: "7. Onde investir R$ 1 mi: confirme a ordem" });
  out.sort((a, b) => a.etapa - b.etapa);
  const diretrizes = (d.diretrizes ?? []).filter(x => x.texto?.trim());
  if (!diretrizes.length) out.push({ etapa: 6, campo: "diretrizes", msg: "Inclua pelo menos 1 diretriz" });
  return out;
}

/** Status exibido: Pendente (sem resposta), Rascunho ou Enviado. */
export function statusExibido(row: { status?: string } | null | undefined): "Pendente" | "Rascunho" | "Enviado" {
  if (!row) return "Pendente";
  return row.status === "enviado" ? "Enviado" : "Rascunho";
}

export function prazoAberto(agora: Date, reabertoAte?: string | null): boolean {
  if (agora.getTime() <= new Date(PRAZO_ISO).getTime()) return true;
  return !!reabertoAte && agora.getTime() <= new Date(reabertoAte).getTime();
}

/** Ranking de projetos: 1º = 5 pts … 5º = 1. */
export function pontosProjeto(posicao: number): number {
  return posicao >= 0 && posicao < 5 ? 5 - posicao : 0;
}

/** Linhas da comparação entre sócios; `diverge` quando há respostas diferentes. */
export type CampoComparacao = { key: string; label: string; fmt?: (v: any) => string; get?: (r: Respostas) => any };
const acaoLabel = (v: any) => ACOES_PRODUTO.find(o => o.v === v)?.label ?? "";
export const CAMPOS_COMPARACAO: CampoComparacao[] = [
  ...PERGUNTAS.map(p => ({ key: p.code, label: `${p.num}. ${p.titulo}`, fmt: (v: any) => { const opcao = p.opcoes.find(o => o.v === v); return opcao?.labelCurto ?? opcao?.label ?? ""; } })),
  { key: "fin_aposta", label: "Primeira candidata a financiamento", fmt: v => FIN_APOSTAS.find(o => o.v === v)?.label ?? "" },
  { key: "fin_teto", label: "Teto do financiamento", fmt: v => brl(v) },
  { key: "fin_criterios", label: "Critérios para liberar o financiamento", get: r => criteriosResumo(r) },
  ...PRODUTOS_2027.map(p => ({ key: `produto.${p.id}`, label: `Produto · ${p.nome}`, fmt: acaoLabel, get: (r: Respostas) => r.produtos?.[p.id] })),
  { key: "cresc_min", label: "Crescimento mínimo de receita (%)" },
  { key: "margem_min", label: "Margem líquida mínima (%)" },
  { key: "divida_custo", label: "Custo máximo da dívida (% a.m.)" },
  { key: "ddl_valor", label: "DDL mensal desejada (R$)" },
  { key: "ddl_cadencia", label: "Cadência da DDL", fmt: v => CADENCIAS.find(o => o.v === v)?.label ?? "" },
  { key: "venda_janela", label: "Janela de venda", fmt: v => JANELAS_VENDA.find(o => o.v === v)?.label ?? "" },
  { key: "horizonte", label: "Horizonte ativo na LM", fmt: v => HORIZONTES.find(o => o.v === v)?.label ?? "" },
  { key: "papel_fim", label: "Papel no fim do horizonte", fmt: v => PAPEL_FIM.find(o => o.v === v)?.label ?? "" },
  { key: "papel_tipo", label: "14. Papel em 2027", fmt: v => PAPEIS.find(o => o.v === v)?.label ?? "" },
  { key: "tempo", label: "Tempo dedicado", fmt: v => TEMPOS.find(o => o.v === v)?.label ?? "" },
  { key: "lv_consequencia", label: "Se uma linha vermelha for cruzada", fmt: v => CONSEQUENCIAS.find(o => o.v === v)?.label ?? "" },
];

export function valorBruto(c: CampoComparacao, r: Respostas | null | undefined): any {
  const x = normalizar(r);
  return c.get ? c.get(x) : x[c.key];
}
/** Valor formatado de um campo de comparação ("" quando vazio). */
export function valorCampo(c: CampoComparacao, r: Respostas | null | undefined): string {
  const v = valorBruto(c, r);
  if (v === undefined || v === null || v === "") return "";
  return c.fmt ? c.fmt(v) || String(v) : String(v);
}

export function compararSocios(lista: Respostas[]) {
  return CAMPOS_COMPARACAO.map(c => {
    const preenchidos = lista.map(r => valorBruto(c, r)).filter(v => v !== undefined && v !== null && v !== "").map(String);
    return { ...c, valores: lista.map(r => valorCampo(c, r) || "—"), diverge: new Set(preenchidos).size > 1 };
  });
}

export const RESPOSTAS_ABERTAS: [string, string][] = [
  ["motor_porque", "Motor · por quê"], ["principio_obs", "Princípio · observações"],
  ["portfolio_obs", "Portfólio · comentário"], ["produto_novo", "Produto novo a testar/lançar"],
  ["trafego_obs", "Mídia · observações"], ["novo_aposta", "Primeira aposta Motor 2"],
  ["novo_lider", "Liderança do novo"], ["ddl_obs", "DDL · observações"],
  ["venda_cond", "Condições de venda"], ["sucessao_val", "Valuation"],
  ["papel_escopo", "Escopo do papel"], ["lv_inegociavel", "Linha mais inegociável"],
  ["lv_preocupacao", "Preocupações"],
];

/** Shared open-answer rows for the consolidated view, full submission and CSV. */
export function respostasAbertas(r: Respostas): [string, string][] {
  return RESPOSTAS_ABERTAS.map(([key, label]): [string, string] => [label, String(r[key] ?? "")])
    .concat([["Resultados não financeiros", (r.resultados ?? []).filter(Boolean).join(" · ")]]);
}
