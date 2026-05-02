// Mock data central — PMO Liberdade Médica

export type Wave = "W1" | "W2" | "W3";
export type Classificacao = "Institucional" | "Melhoria Contínua" | "Melhoria Contínua com EPP" | "Novo Produto";
export type StatusExecucao = "Backlog" | "A Iniciar" | "Em Andamento" | "Pausado" | "Atrasado" | "Concluído" | "Cancelado" | "Em Avaliação";
export type StatusBC = "Em Revisão" | "BC em Construção" | "Ativo EPP" | "Projeto Concluído" | "BC não aplicável" | "Sem BC" | "Adiado" | "Validado";
export type Saude = "On-Track" | "Alerta" | "Off-Track";

export interface Projeto {
  id: string;
  nome: string;
  wave: Wave;
  classificacao: Classificacao;
  objetivos: string[];
  krs: string[];
  diretor: string;
  gerente?: string;
  budget: number;
  realizado: number;
  statusBC: StatusBC;
  status: StatusExecucao;
  saude: Saude;
  inicio: string;
  termino: string;
  ice: number;
  descricao: string;
  avancos?: string;
  desvios?: { dimensao: "Escopo" | "Cronograma" | "Custo" | "Riscos"; status: "verde" | "amarelo" | "vermelho"; obs: string }[];
  causaRaiz?: string;
  planoAcao?: string;
}

export const objetivosBSC = [
  { id: "F.01", nome: "Maximizar LTV e NRR via Ecossistema", perspectiva: "Financeira" },
  { id: "F.02", nome: "Blindar Margem Premium e Eficiência Operacional", perspectiva: "Financeira" },
  { id: "C.01", nome: "Segurança Clínica e Redução de Risco", perspectiva: "Cliente" },
  { id: "C.02", nome: "Pertencimento, Identidade e Confiança na Marca", perspectiva: "Cliente" },
  { id: "C.03", nome: "Sucesso na Carreira e Empregabilidade", perspectiva: "Cliente" },
  { id: "P.01", nome: "Execução Impecável dos Processos Sagrados", perspectiva: "Processos" },
  { id: "P.02", nome: "Aquisição Disciplinada e Gestão de ICP", perspectiva: "Processos" },
  { id: "P.03", nome: "Expansão da Prática Hospitalar", perspectiva: "Processos" },
  { id: "AC.01", nome: "Execução do Método LIVRE", perspectiva: "Aprendizado" },
  { id: "AC.02", nome: "Maturidade de Talentos / Bar Raisers", perspectiva: "Aprendizado" },
  { id: "AC.03", nome: "Tecnologia Human-First, AI-Amplified", perspectiva: "Aprendizado" },
];

export const okrs = [
  {
    id: "OKR1", nome: "Blindagem Financeira", subtitulo: "Cofre de Vidro",
    krs: [
      { id: "KR 1.1", nome: "Previsibilidade", iniciativas: 8 },
      { id: "KR 1.2", nome: "Governança/Gate", iniciativas: 6 },
      { id: "KR 1.3", nome: "Visibilidade Granular", iniciativas: 7 },
      { id: "KR 1.4", nome: "Segurança", iniciativas: 2 },
      { id: "KR 1.5", nome: "Geração de Caixa", iniciativas: 9 },
    ],
  },
  {
    id: "OKR2", nome: "Governança Institucional", subtitulo: "Fim do Heroísmo",
    krs: [
      { id: "KR 2.1", nome: "Verdade Única", iniciativas: 11 },
      { id: "KR 2.2", nome: "Decisões Irreversíveis", iniciativas: 5 },
      { id: "KR 2.3", nome: "Disciplina de Rituais", iniciativas: 4 },
    ],
  },
  {
    id: "OKR3", nome: "Jornada do Aluno", subtitulo: "Balde Furado",
    krs: [
      { id: "KR 3.1", nome: "Ativação/TTFV", iniciativas: 10 },
      { id: "KR 3.2", nome: "Retenção Financeira", iniciativas: 7 },
      { id: "KR 3.3", nome: "Inteligência de LTV", iniciativas: 6 },
      { id: "KR 3.4", nome: "Segmentação", iniciativas: 3 },
    ],
  },
];

export const waves = [
  { id: "W1" as Wave, nome: "Estrutura Mínima", periodo: "2026" },
  { id: "W2" as Wave, nome: "Escala com Controle", periodo: "2027-2028" },
  { id: "W3" as Wave, nome: "Aceleração e Diferenciação", periodo: "2029-2030" },
];

export const diretores = ["Yuri Ribeiro", "Iuri Eloi Franco", "Bruno Garcia", "Guilherme", "Ian"];

export const projetos: Projeto[] = [
  { id: "P001", nome: "Credenciamento MEC", wave: "W1", classificacao: "Institucional", objetivos: ["P.03"], krs: ["KR 2.2"], diretor: "Yuri Ribeiro", gerente: "Ana Souza", budget: 384400, realizado: 92000, statusBC: "Ativo EPP", status: "Em Andamento", saude: "On-Track", inicio: "2026/1", termino: "2027/2", ice: 8.4, descricao: "Credenciamento institucional junto ao MEC para expansão da prática hospitalar.", avancos: "Planta baixa aprovada internamente. Início da contratação dos consultores especializados.", desvios: [{ dimensao: "Escopo", status: "verde", obs: "Sem alterações" }, { dimensao: "Cronograma", status: "verde", obs: "Dentro do plano" }, { dimensao: "Custo", status: "verde", obs: "Aderente" }, { dimensao: "Riscos", status: "amarelo", obs: "Dependência de validação MEC" }] },
  { id: "P002", nome: "Imersão São Paulo", wave: "W1", classificacao: "Institucional", objetivos: ["P.03", "C.01"], krs: ["KR 3.1"], diretor: "Yuri Ribeiro", gerente: "Carlos Lima", budget: 116938, realizado: 41000, statusBC: "Ativo EPP", status: "Em Andamento", saude: "On-Track", inicio: "2026/1", termino: "2026/2", ice: 7.8, descricao: "Imersão presencial premium em SP focada em segurança clínica.", avancos: "Contratação de manequins concluída. Local definido.", desvios: [{ dimensao: "Escopo", status: "verde", obs: "OK" }, { dimensao: "Cronograma", status: "verde", obs: "OK" }, { dimensao: "Custo", status: "verde", obs: "OK" }, { dimensao: "Riscos", status: "verde", obs: "Sem riscos" }] },
  { id: "P003", nome: "Clube da Liberdade", wave: "W1", classificacao: "Institucional", objetivos: ["C.02", "F.01"], krs: ["KR 3.2"], diretor: "Guilherme", gerente: "Maria Gomes", budget: 166770, realizado: 22000, statusBC: "Ativo EPP", status: "Atrasado", saude: "Off-Track", inicio: "2026/1", termino: "2026/2", ice: 6.5, descricao: "Programa de retenção e comunidade premium para alunos LM.", avancos: "Plataforma em homologação; lançamento postergado.", causaRaiz: "Atraso da equipe de tecnologia em entregas dependentes do squad de IA.", planoAcao: "Repriorizar squad técnico e contratar dev externo para 8 semanas.", desvios: [{ dimensao: "Escopo", status: "amarelo", obs: "Replanejado" }, { dimensao: "Cronograma", status: "vermelho", obs: "+45 dias" }, { dimensao: "Custo", status: "amarelo", obs: "Risco overrun" }, { dimensao: "Riscos", status: "vermelho", obs: "Churn early" }] },
  { id: "P004", nome: "Squad de IA", wave: "W1", classificacao: "Institucional", objetivos: ["AC.03"], krs: ["KR 1.3", "KR 2.1"], diretor: "Iuri Eloi Franco", budget: 480000, realizado: 0, statusBC: "BC em Construção", status: "A Iniciar", saude: "On-Track", inicio: "2026/2", termino: "2027/2", ice: 9.1, descricao: "Estruturação do squad de IA aplicada à educação médica." },
  { id: "P005", nome: "Planejamento Financeiro 36 meses", wave: "W1", classificacao: "Melhoria Contínua", objetivos: ["F.01", "F.02"], krs: ["KR 1.1", "KR 1.2"], diretor: "Bruno Garcia", budget: 0, realizado: 0, statusBC: "Em Revisão", status: "Em Andamento", saude: "On-Track", inicio: "2026/1", termino: "2026/2", ice: 8.0, descricao: "Modelo financeiro plurianual com cenários e gates.", avancos: "Modelo base concluído. Cenários em validação com diretoria.", desvios: [{ dimensao: "Escopo", status: "verde", obs: "OK" }, { dimensao: "Cronograma", status: "verde", obs: "OK" }, { dimensao: "Custo", status: "verde", obs: "OK" }, { dimensao: "Riscos", status: "verde", obs: "OK" }] },
  { id: "P006", nome: "Orçamento 2026 Zero-Based", wave: "W1", classificacao: "Melhoria Contínua", objetivos: ["F.02", "AC.01"], krs: ["KR 1.3", "KR 1.1"], diretor: "Bruno Garcia", budget: 0, realizado: 0, statusBC: "Em Revisão", status: "Em Andamento", saude: "Alerta", inicio: "2026/1", termino: "2026/1", ice: 7.6, descricao: "Implementar orçamento base-zero por área.", avancos: "Áreas mapeadas. Aguardando inputs de Marketing e Produto.", causaRaiz: "Atraso de input das áreas operacionais.", planoAcao: "Reuniões 1:1 semanais com líderes para destravamento.", desvios: [{ dimensao: "Escopo", status: "verde", obs: "OK" }, { dimensao: "Cronograma", status: "amarelo", obs: "+15 dias" }, { dimensao: "Custo", status: "verde", obs: "OK" }, { dimensao: "Riscos", status: "amarelo", obs: "Adoção" }] },
  { id: "P007", nome: "Dashboard Estratégico Integrado", wave: "W1", classificacao: "Melhoria Contínua com EPP", objetivos: ["AC.01", "AC.03"], krs: ["KR 2.1"], diretor: "Iuri Eloi Franco", budget: 0, realizado: 0, statusBC: "Em Revisão", status: "A Iniciar", saude: "On-Track", inicio: "2026/2", termino: "2027/1", ice: 8.2, descricao: "Painel único e integrado de métricas estratégicas." },
  { id: "P008", nome: "Lead Score Avançado", wave: "W1", classificacao: "Melhoria Contínua", objetivos: ["P.02"], krs: ["KR 1.5"], diretor: "Iuri Eloi Franco", budget: 0, realizado: 0, statusBC: "BC em Construção", status: "Backlog", saude: "On-Track", inicio: "2027/1", termino: "2027/2", ice: 7.0, descricao: "Score de leads para qualificação inteligente." },
  { id: "P009", nome: "Projeto Ativação 90D", wave: "W1", classificacao: "Melhoria Contínua com EPP", objetivos: ["F.01", "C.01"], krs: ["KR 3.1", "KR 3.2"], diretor: "Guilherme", gerente: "Ricardo Pinto", budget: 18000, realizado: 7800, statusBC: "Em Revisão", status: "Em Andamento", saude: "On-Track", inicio: "2026/1", termino: "2026/2", ice: 8.6, descricao: "Programa de ativação dos primeiros 90 dias do aluno.", avancos: "Jornada redesenhada. Squad piloto rodando.", desvios: [{ dimensao: "Escopo", status: "verde", obs: "OK" }, { dimensao: "Cronograma", status: "verde", obs: "OK" }, { dimensao: "Custo", status: "verde", obs: "OK" }, { dimensao: "Riscos", status: "verde", obs: "OK" }] },
  { id: "P010", nome: "Plataforma de Provas com IA", wave: "W2", classificacao: "Institucional", objetivos: ["C.01", "AC.03"], krs: ["KR 3.1"], diretor: "Iuri Eloi Franco", budget: 250000, realizado: 0, statusBC: "BC em Construção", status: "Backlog", saude: "On-Track", inicio: "2027/1", termino: "2027/2", ice: 8.8, descricao: "Plataforma própria de provas com avaliação por IA." },
  { id: "P011", nome: "Branding LM", wave: "W2", classificacao: "Melhoria Contínua", objetivos: ["C.02"], krs: ["KR 3.2"], diretor: "Yuri Ribeiro", budget: 0, realizado: 0, statusBC: "Em Revisão", status: "Backlog", saude: "On-Track", inicio: "2027/1", termino: "2027/2", ice: 6.8, descricao: "Renovação da identidade de marca LM." },
  { id: "P012", nome: "Centro de Simulação ITC + IA", wave: "W2", classificacao: "Institucional", objetivos: ["C.01", "P.03"], krs: ["KR 3.1", "KR 1.2"], diretor: "Yuri Ribeiro", budget: 628400, realizado: 0, statusBC: "BC em Construção", status: "Backlog", saude: "On-Track", inicio: "2027/2", termino: "2028/2", ice: 9.0, descricao: "Centro de simulação clínica de alta fidelidade integrado a IA." },
  { id: "P013", nome: "Escada de Valor (LTV)", wave: "W2", classificacao: "Melhoria Contínua", objetivos: ["F.01"], krs: ["KR 1.5", "KR 3.3"], diretor: "Bruno Garcia", budget: 0, realizado: 0, statusBC: "Sem BC", status: "Backlog", saude: "On-Track", inicio: "2027/1", termino: "2027/2", ice: 7.4, descricao: "Estruturação de escada de valor para maximizar LTV." },
  { id: "P014", nome: "Programa Alumni", wave: "W3", classificacao: "Novo Produto", objetivos: ["C.02", "C.03"], krs: ["KR 3.2"], diretor: "Guilherme", budget: 0, realizado: 0, statusBC: "Sem BC", status: "Backlog", saude: "On-Track", inicio: "2029/1", termino: "2029/2", ice: 6.5, descricao: "Programa para egressos LM, comunidade e empregabilidade." },
  { id: "P015", nome: "Expansão PFO (Plano Flexível)", wave: "W1", classificacao: "Melhoria Contínua com EPP", objetivos: ["P.03", "F.01"], krs: ["KR 1.5", "KR 3.1"], diretor: "Yuri Ribeiro", gerente: "Bruna Tavares", budget: 95000, realizado: 12000, statusBC: "Ativo EPP", status: "Em Avaliação", saude: "Alerta", inicio: "2026/1", termino: "2026/2", ice: 7.9, descricao: "Expansão do plano flexível PFO para novos públicos.", avancos: "Pesquisa com base ativa concluída. Modelo comercial em revisão.", causaRaiz: "Resistência de canais comerciais ao novo modelo de comissionamento.", planoAcao: "Workshop com BDRs e revisão do incentivo Q3.", desvios: [{ dimensao: "Escopo", status: "amarelo", obs: "Em avaliação" }, { dimensao: "Cronograma", status: "amarelo", obs: "+10 dias" }, { dimensao: "Custo", status: "verde", obs: "OK" }, { dimensao: "Riscos", status: "amarelo", obs: "Adoção comercial" }] },
];

export const totaisPortfolio = {
  total: 144,
  ativos: 12,
  budgetTotal: 3_020_000,
  bcAprovadoPct: 88,
  offTrack: 1,
};

// Wave colors helpers
export const waveColor: Record<Wave, string> = { W1: "hsl(var(--wave-1))", W2: "hsl(var(--wave-2))", W3: "hsl(var(--wave-3))" };
export const classColor: Record<Classificacao, string> = {
  "Institucional": "hsl(var(--class-inst))",
  "Melhoria Contínua": "hsl(var(--class-mc))",
  "Melhoria Contínua com EPP": "hsl(var(--class-mcepp))",
  "Novo Produto": "hsl(var(--class-novo))",
};
