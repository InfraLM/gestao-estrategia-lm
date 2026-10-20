// Regras do módulo "Desejos dos Sócios 2027" — funções puras, sem acesso ao banco.

export type Opcao = { v: string; label: string };
export type Pergunta = { code: string; num: number; etapa: number; titulo: string; help?: string; citacao?: string; opcoes: Opcao[] };

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
  { code: "ritmo", num: 3, etapa: 2, titulo: "Ritmo: crescimento contra caixa",
    help: "A janela de território vai até 2028 (fusão Afya–Yduqs). Crescer acima do caixa gerado exige dívida a ~2,45% a.m.",
    opcoes: [
      { v: "A", label: "Crescer no máximo, mesmo com dívida" },
      { v: "B", label: "Crescer só o que o caixa gerado paga" },
      { v: "C", label: "Rentabilidade e distribuição primeiro" },
    ] },
  { code: "portfolio", num: 4, etapa: 2, titulo: "Portfólio",
    help: "Quantos produtos sustentamos em 2027.",
    opcoes: [
      { v: "A", label: "Só PPG, FPG e ACLS" },
      { v: "B", label: "Core + POCUS e Paliativos" },
      { v: "C", label: "Portfólio aberto, com testes de novos produtos" },
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

export function calcularEixos(r: Respostas): Eixos {
  const rk = r.invest_ok ? r.invest : undefined;
  const reserva = pontoRanking(rk, "reserva");
  return {
    core: media([
      ({ A: 0, B: 30, C: 70, D: 100 } as any)[r.motor],
      ({ A: 0, B: 40, C: 100 } as any)[r.portfolio],
      ({ A: 0, B: 50, C: 100 } as any)[r.trafego],
      pontoRanking(rk, "novos"),
    ]),
    caixa: media([
      ({ A: 100, B: 50, C: 10 } as any)[r.ritmo],
      ({ A: 100, C: 70, B: 30, D: 0 } as any)[r.divida],
      ({ "1": 100, "2": 65, "3": 35, "6": 0 } as any)[r.caixa_min],
      pontoRanking(rk, "sp"),
      reserva === null ? null : 100 - reserva,
    ]),
    retorno: media([
      ({ A: 0, B: 35, C: 100 } as any)[r.ritmo],
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
  },
  portfolio: {
    A: ["Portfólio enxuto", "Receitas de produtos menores"],
    B: ["Core + produtos com LTV/CAC alto", "Simplicidade máxima"],
    C: ["Experimentação de produtos", "Foco e margem"],
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

export function escolhas(r: Respostas): { tema: string; escolhe: string; abre: string }[] {
  const temas: Record<string, string> = { motor: "Motor", ritmo: "Ritmo", portfolio: "Portfólio", trafego: "Mídia", caixa_min: "Caixa", divida: "Dívida", venda: "Horizonte" };
  return Object.keys(temas).flatMap(k => {
    const t = ESCOLHAS[k]?.[r[k]];
    return t ? [{ tema: temas[k], escolhe: t[0], abre: t[1] }] : [];
  });
}

export function tensoes(r: Respostas): string[] {
  const out: string[] = [];
  const lv = r.lv ?? {};
  const on = (id: string) => !!lv[id]?.on;
  const val = (id: string) => num(lv[id]?.valor);
  const motor2 = r.motor === "C" || r.motor === "D";
  const tempo = num(r.tempo);
  const horiz = num(r.horizonte);
  const executivo = ["ceo", "executivo", "motor2"].includes(r.papel_tipo);

  if (r.ritmo === "A" && r.divida === "D") out.push("Quer crescer no máximo, mas não aceita dívida: o crescimento ficará limitado ao caixa gerado.");
  if (r.ritmo === "A" && num(r.caixa_min) !== null && num(r.caixa_min)! >= 3) out.push("Quer acelerar e também manter 3 meses ou mais de caixa: hoje o caixa é de ~1,3 mês.");
  if (r.divida === "B" || r.divida === "C") out.push("Dívida para distribuir lucros custa ~34% a.a. sem gerar retorno operacional.");
  if (motor2 && r.ritmo === "C") out.push("Motor 2 relevante exige investimento, o que conflita com priorizar rentabilidade e distribuição.");
  if (motor2 && r.novo === "A") out.push("Motor 2 relevante dentro das diretorias atuais tende a disputar atenção com o core.");
  if (r.motor === "A" && (r.portfolio === "C" || r.trafego === "C")) out.push("Escolheu só Motor 1, mas abriu portfólio ou mídia para além do core.");
  if (r.invest_ok && r.invest?.[0] === "distrib" && r.ritmo === "A") out.push("Distribuição em 1º no ranking não combina com crescimento máximo.");
  if (r.caixa_min === "1" && (r.divida === "A" || r.divida === "C")) out.push("Caixa mínimo de 1 mês com dívida para crescer deixa pouca margem de segurança.");
  if (r.venda === "A" && horiz !== null && horiz >= 9) out.push("Tem intenção de vender, mas prevê 5 anos ou mais ativo na LM.");
  if (r.venda === "C" && horiz !== null && horiz <= 4) out.push("Não quer vender, mas prevê até 4 anos ativo: defina o plano de sucessão do seu papel.");
  if (r.venda_janela && ["2028", "2030"].includes(r.venda_janela) && motor2) out.push("Venda até 2030 com Motor 2 relevante: o comprador pode não pagar por apostas ainda imaturas.");
  if (executivo && tempo !== null && tempo <= 50) out.push("Função executiva com 50% ou menos do tempo dedicado.");
  if (r.papel_tipo === "motor2" && r.motor === "A") out.push("Quer liderar o Motor 2, mas escolheu só Motor 1 em 2027.");
  if (on("divida_distrib") && (r.divida === "B" || r.divida === "C")) out.push("Marcou dívida para distribuir como linha vermelha, mas aceitou dívida para isso.");
  if (val("caixa_abaixo") !== null && num(r.caixa_min) !== null && val("caixa_abaixo")! > num(r.caixa_min)!) out.push("Sua linha vermelha de caixa é maior que o caixa mínimo que você escolheu.");
  const teto = num(r.divida_custo) ?? (on("divida_custo") ? val("divida_custo") : null);
  if (teto !== null && teto < CUSTO_DIVIDA_AM && r.divida !== "D") out.push(`Seu teto de custo (${teto}% a.m.) está abaixo do custo atual da dívida (${CUSTO_DIVIDA_AM.toString().replace(".", ",")}% a.m.).`);
  if (on("motor2_antes") && motor2) out.push("Marcou abrir Motor 2 antes dos gatilhos como linha vermelha, mas escolheu Motor 2 relevante.");
  if (on("vender_antes") && r.venda_janela === "2028") out.push("Marcou vender antes de 2030 como linha vermelha, mas indicou venda até 2028.");
  if (on("ddl_reduzir") && r.ritmo === "A") out.push("Não aceita reduzir a DDL, mas quer crescimento máximo.");
  return out;
}

/** Objetivos do BSC sugeridos (top 4) a partir das escolhas. */
export function objetivosSugeridos(r: Respostas): string[] {
  const pts: Record<string, number> = {};
  const add = (cods: string[], p = 1) => cods.forEach(c => (pts[c] = (pts[c] ?? 0) + p));
  if (r.motor === "A" || r.motor === "B") add(["P.01", "F.02"], 2);
  if (r.motor === "C" || r.motor === "D") add(["F.01", "AC.03"], 2);
  if (r.ritmo === "A") add(["P.02", "P.03"]);
  if (r.ritmo === "B" || r.ritmo === "C") add(["F.02"]);
  if (r.trafego === "B" || r.trafego === "C") add(["F.01"]);
  if (r.invest_ok && r.invest) {
    const map: Record<string, string[]> = { sp: ["P.03", "P.02"], tech: ["AC.03"], pessoas: ["AC.02"], reserva: ["F.02"], distrib: ["F.02"], novos: ["F.01"] };
    r.invest.slice(0, 3).forEach((it, i) => add(map[it] ?? [], 3 - i));
  }
  return Object.entries(pts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4).map(([c]) => c);
}

/** Pontos de partida: diretrizes sugeridas a partir das respostas. */
export function diretrizesSugeridas(r: Respostas): Diretriz[] {
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
export const CAMPOS_COMPARACAO: { key: string; label: string; fmt?: (v: any) => string }[] = [
  ...PERGUNTAS.map(p => ({ key: p.code, label: `${p.num}. ${p.titulo}`, fmt: (v: any) => p.opcoes.find(o => o.v === v)?.label ?? "" })),
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

export function compararSocios(lista: Respostas[]) {
  return CAMPOS_COMPARACAO.map(c => {
    const vals = lista.map(r => (r?.[c.key] === undefined || r?.[c.key] === null ? "" : String(r[c.key])));
    const preenchidos = vals.filter(Boolean);
    return { ...c, valores: lista.map(r => (r?.[c.key] ? (c.fmt ? c.fmt(r[c.key]) || String(r[c.key]) : String(r[c.key])) : "—")), diverge: new Set(preenchidos).size > 1 };
  });
}
