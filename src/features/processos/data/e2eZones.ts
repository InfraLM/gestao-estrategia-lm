// Fluxo E2E e Zonas de Valor da LM (Z1..Z7) — fonte: Fluxo_E2E_Zonas_Valor_LM.pdf
export interface E2EZone {
  id: string;          // "Z1"
  gate: string;        // "G1"
  gateNome: string;
  titulo: string;      // "Proposta e Atração"
  subtitulo: string;   // "Onde o valor nasce"
  descricao: string;
  objetivos: string[]; // códigos BSC responsáveis
  processosCodigos: string[]; // prefixos macro: "02.01", "02.08", "01.01"...
  riscos: string[];
  efeitos: string[];
  cor: string;         // tailwind classes
  corHex: string;      // for charts
}

export const E2E_ZONES: E2EZone[] = [
  {
    id: "Z1",
    gate: "G1",
    gateNome: "Aderência ao Perfil / ICP",
    titulo: "Proposta e Atração",
    subtitulo: "Onde o valor nasce",
    descricao: "Cria a expectativa correta e atrai o perfil ideal (ICP). Filtro contra desalinhamento.",
    objetivos: ["P.02"],
    processosCodigos: ["02.01", "02.08", "01.01", "01.02", "01.04", "03.03", "03.02"],
    riscos: ["Promessa maior que capacidade real (overpromising)", "ICP mal qualificado", "Expectativa errada criada pelo marketing"],
    efeitos: ["Churn precoce", "Judicialização", "Dano reputacional"],
    cor: "from-rose-500/15 to-rose-500/5 border-rose-500/30 text-rose-700",
    corHex: "#f43f5e",
  },
  {
    id: "Z2",
    gate: "G2",
    gateNome: "Qualidade da Venda e Onboarding",
    titulo: "Venda e Onboarding",
    subtitulo: "Onde o valor é ativado",
    descricao: "Time-to-Value nos primeiros 90 dias. Alinhamento de expectativas e acolhimento.",
    objetivos: ["P.02", "P.01"],
    processosCodigos: ["02.09", "02.10.06", "01.03", "01.04", "01.05", "03.02", "03.03", "03.05"],
    riscos: ["Venda bem-sucedida mas fora do ICP", "Onboarding confuso ou frio", "Falta de prontidão operacional"],
    efeitos: ["Perda de confiança", "Baixa ativação", "Desengajamento inicial"],
    cor: "from-orange-500/15 to-orange-500/5 border-orange-500/30 text-orange-700",
    corHex: "#f97316",
  },
  {
    id: "Z3",
    gate: "G3",
    gateNome: "Prontidão Clínica",
    titulo: "Desenvolvimento de Competência",
    subtitulo: "Onde o valor cresce",
    descricao: "Aquisição teórica e desenvolvimento de competências (CBME). Avanço por prontidão.",
    objetivos: ["P.01"],
    processosCodigos: ["02.02", "01.05", "01.01", "03.05", "03.03"],
    riscos: ["Conteúdo sem progressão clara", "Avaliação frouxa (falso positivo)", "Baixa qualidade docente ou didática"],
    efeitos: ["Médico inseguro", "Risco clínico futuro", "Queda de confiança no método"],
    cor: "from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-700",
    corHex: "#f59e0b",
  },
  {
    id: "Z4",
    gate: "G4",
    gateNome: "Segurança Clínica, Jurídica e Operacional",
    titulo: "Prática Assistencial Real",
    subtitulo: "Onde o valor se concretiza",
    descricao: "Impacto assistencial real. Simulação e prática supervisionada antes da autonomia.",
    objetivos: ["P.01", "P.03"],
    processosCodigos: ["02.03", "01.01", "01.05", "03.04", "03.02", "03.06"],
    riscos: ["Médico avançando sem prontidão real", "Supervisão insuficiente", "Campo de prática mal curado"],
    efeitos: ["Evento adverso", "Risco jurídico", "Dano estrutural à marca"],
    cor: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-700",
    corHex: "#10b981",
  },
  {
    id: "Z5",
    gate: "G5",
    gateNome: "Capacidade Operacional por Solução",
    titulo: "Entrega das Soluções do Ecossistema",
    subtitulo: "Onde o valor se sustenta",
    descricao: "Entrega contínua via pertencimento e identidade profissional. Infra suporta a promessa.",
    objetivos: ["P.01"],
    processosCodigos: ["02.10", "02.04", "01.03", "01.04", "03.02", "03.03", "03.06"],
    riscos: ["Falha operacional (imersão, plantão, plataforma)", "Experiência abaixo do prometido", "Inconsistência entre soluções"],
    efeitos: ["Reclamações", "Queda de NPS", "Desalinhamento da proposta"],
    cor: "from-cyan-500/15 to-cyan-500/5 border-cyan-500/30 text-cyan-700",
    corHex: "#06b6d4",
  },
  {
    id: "Z6",
    gate: "G6",
    gateNome: "Saúde da Experiência (NPS, CES, SLA, Churn)",
    titulo: "Experiência, Suporte e Sucesso",
    subtitulo: "Onde o valor é preservado",
    descricao: "Retenção e sucesso via suporte ágil e escuta ativa. Monitoramento contínuo.",
    objetivos: ["P.01"],
    processosCodigos: ["02.10.06", "01.02", "01.04", "03.01", "03.03", "03.07"],
    riscos: ["Suporte lento ou ineficiente", "Falta de escuta", "Problemas recorrentes não resolvidos"],
    efeitos: ["Churn tardio", "Boca a boca negativo", "Erosão de LTV"],
    cor: "from-blue-500/15 to-blue-500/5 border-blue-500/30 text-blue-700",
    corHex: "#3b82f6",
  },
  {
    id: "Z7",
    gate: "G7",
    gateNome: "Progressão de Valor / Retenção",
    titulo: "Jornada de Carreira e Retenção",
    subtitulo: "Onde o valor é protegido ou destruído",
    descricao: "Expansão de LTV e NRR via progressão na carreira médica.",
    objetivos: ["P.01"],
    processosCodigos: ["02.11", "01.04", "01.03", "03.02", "03.03"],
    riscos: ["Falta de clareza de próximos passos", "Ausência de oportunidades reais", "Estagnação percebida"],
    efeitos: ["Queda de NRR", "Perda de vínculo", "Redução do ecossistema a 'curso'"],
    cor: "from-violet-500/15 to-violet-500/5 border-violet-500/30 text-violet-700",
    corHex: "#8b5cf6",
  },
];

// Verifica se um processo (pelo nome ou id-código) pertence a uma zona
export function processoMatchesZone(nomeProcesso: string, zone: E2EZone): boolean {
  return zone.processosCodigos.some(code => nomeProcesso.startsWith(code));
}

export function zonesForProcesso(nomeProcesso: string): E2EZone[] {
  return E2E_ZONES.filter(z => processoMatchesZone(nomeProcesso, z));
}
