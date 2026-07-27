/**
 * Knowledge base: definição institucional de Wave (Liberdade Médica)
 * Fonte: documento "O QUE É WAVE" (out/2026)
 *
 * Utilizado por:
 * - Edge function `bc-scorecard-analisar` (sugestão de wave para o BC)
 * - Página BusinessCaseScorecard.tsx (exibição da governança)
 * - Futuras validações de alinhamento entre wave cadastrada em `projetos.wave`
 *   e a wave adequada segundo estas regras.
 */

export const WAVE_CONCEITO = `
Wave é um agrupamento intencional e sequenciado de iniciativas organizado para
remover restrições críticas do sistema, instalar capacidades organizacionais e
habilitar o próximo nível de execução da estratégia, respeitando dependências
lógicas, risco e capacidade de absorção da organização.

Uma Wave organiza a execução estratégica em blocos coerentes que removem
gargalos estruturais antes de permitir escala ou diferenciação.
`.trim();

export const WAVE_DIFERENCIACAO: { conceito: string; diferenca: string }[] = [
  { conceito: "Fase de projeto", diferenca: "Fase é cronológica; Wave é lógica" },
  { conceito: "Roadmap",         diferenca: "Roadmap ordena entregas; Wave ordena capacidades" },
  { conceito: "Sprint",          diferenca: "Sprint é tático; Wave é estratégico" },
  { conceito: "Programa",        diferenca: "Programa agrupa projetos; Wave agrupa restrições" },
  { conceito: "OKR",             diferenca: "OKR mede resultado; Wave define ordem de construção" },
];

export const WAVE_REFERENCIAS = [
  { fonte: "The Goal — Eliyahu Goldratt (TOC)", ideia: "Wave = aplicação prática da Teoria das Restrições na execução estratégica." },
  { fonte: "Strategy-Focused Organization — Kaplan & Norton (BSC)", ideia: "Wave = mecanismo de sequenciamento da execução do BSC." },
  { fonte: "McKinsey — Transformation Waves / Horizons", ideia: "Wave = bloco de transformação coerente (fundação → escala → diferenciação)." },
  { fonte: "BCG — Capability-Based Transformation", ideia: "Wave = pacote de capacidades críticas antes de metas financeiras." },
  { fonte: "Good Strategy Bad Strategy — Richard Rumelt", ideia: "Wave = política orientadora aplicada no tempo." },
];

export type WaveId = "W1" | "W2" | "W3";

export interface WaveSpec {
  id: WaveId;
  nome: string;
  proposito: string;
  leitura: string;
  blocos: { titulo: string; itens: string[] }[];
  complementares?: { titulo: string; itens: string[] };
}

export const WAVES: Record<WaveId, WaveSpec> = {
  W1: {
    id: "W1",
    nome: "Estrutura mínima",
    proposito:
      "Remove restrições estruturais, protege EEA/C.01, cria governança, dados e método. Remove risco sistêmico.",
    leitura: "Tudo aqui remove risco sistêmico. Sem isso, crescer quebra.",
    blocos: [
      {
        titulo: "Governança, dados e financeiro",
        itens: [
          "Teto de despesas variáveis por driver",
          "Planejamento e Análise Financeira de 36 meses considerando expansão",
          "Catálogo should cost",
          "Cohort P&L (lucro x prejuízo por turma)",
          "CAPEX roadmap",
          "Orçamento",
          "Dashboard estratégico e tático (gestão e decisão)",
          "Dashboards operacionais",
          "IA para Forecast de Receita com base no NRR",
          "Documentos de governança: políticas, regimentos internos",
          "Rituais de decisão (comitês, excom)",
        ],
      },
      {
        titulo: "Processos, método e qualidade",
        itens: [
          "Gestão à vista (MVP de mudança)",
          "Alinhamento 1:1 por todas as lideranças",
          "Checklist de Qualidade para Aulas Gravadas com IA",
          "Critérios claros de gates de prontidão / classificação do aluno",
          "Automação: check-in e check-out por cargo e nível",
          "Sistema de Alerta para Alunos Inativos ou com Baixo Engajamento",
        ],
      },
      {
        titulo: "Pessoas e liderança",
        itens: [
          "Treinamento da liderança para executar o método",
          "Matriz de performance (resultado x cultura)",
          "PDI por cadeira e nível",
          "Remuneração variável (OTE / PLR)",
          "Ritual de comunicação 1:1, feedback",
        ],
      },
    ],
    complementares: {
      titulo: "Complementar — permitido na Wave 1 (proteção institucional)",
      itens: ["Selo de Governança de IA (guardrail reputacional e jurídico)"],
    },
  },
  W2: {
    id: "W2",
    nome: "Escala com controle",
    proposito: "Permite crescer com previsibilidade, eficiência e repetição.",
    leitura: "Só entra em W2 o que depende das capacidades instaladas em W1.",
    blocos: [
      {
        titulo: "Comercial e aquisição",
        itens: [
          "Leadscore avançado",
          "Otimização do funil de vendas",
          "DRE dos vendedores",
          "Squads de vendas de alta performance",
          "Times de aquisição, expansão, field sales e outbound",
        ],
      },
      {
        titulo: "Produto, jornada e expansão",
        itens: [
          "Criação de escada de valor",
          "BU Formação em Paciente Grave",
          "Projeto online UX (app) próprio",
          "Sistema de Alerta para Engajamento & CX (integrado à jornada)",
        ],
      },
      {
        titulo: "Operação e capacidade",
        itens: [
          "ITC — Simulação de protocolos com cadáveres",
          "Centro de Simulação com IA",
        ],
      },
    ],
    complementares: {
      titulo: "Complementar — estratégica (ecossistema, conversão, jornada)",
      itens: [
        "Robô de Follow-Up Comercial Automatizado (WhatsApp)",
        "Central de Scripts Comerciais com IA",
        "Pitch com IA (padronização comercial)",
        "Agente IA pré-pitch / durante / pós-reunião",
        "Insights diários por IA para time de geração de demanda",
        "Insights diários de trabalho por área/função",
        "Automação de check-in/check-out por cargo e nível",
        "Produção de conteúdo para LinkedIn (conectado ao funil)",
        "Pricing & Packaging 2.0 (ancorado no cohort P&L)",
        "Definição de mix de produtos e projeções de venda",
      ],
    },
  },
  W3: {
    id: "W3",
    nome: "Aceleração e diferenciação",
    proposito: "Vantagem competitiva, novos modelos e inovação.",
    leitura: "Diferenciação só entra depois que a máquina de escala está estável.",
    blocos: [
      {
        titulo: "IA avançada e diferenciação",
        itens: [
          "Chat IA especializado em produtos LM",
          "Copilotos internos (AI Assistants)",
          "Biblioteca de Algoritmos Educacionais para Tomada de Decisão",
          "IA para Conversão de Slides em Scripts de Aulas",
          "IA para Construção de Scorecard de Professores",
          "IA para Análise de Concorrência em Tempo Real",
          "Emy Education (plataforma AI-native)",
          "Portfólio de agentes",
        ],
      },
      {
        titulo: "Marca, comunidade e ecossistema",
        itens: [
          "Aluno ALUMNI (ex-alunos heróis da marca)",
          "Calendário editorial anual (Instagram, YouTube, Podcast)",
          "Projeto Pílulas (mini-cursos gratuitos via WhatsApp)",
          "Estratégia de Social Selling",
          "Branding LM",
          "Plataforma de Geração de Provas e Simulados com IA",
          "Seguro de vida LM Capital",
          "Empréstimos LM Capital",
          "LM Capital (genérico)",
          "FIDC LM Capital",
        ],
      },
      {
        titulo: "Expansão estrutural",
        itens: [
          "Multi-hub hospital-escola (SP, Recife, Curitiba)",
          "Filial LM SP",
          "Faculty Cloud (marketplace de professores médicos)",
          "SVST (multidisciplinar — enfermagem, fisioterapia)",
          "P04 — Angola — Pós Online",
        ],
      },
    ],
  },
};

/**
 * Framework em texto puro para injetar em prompts de IA (edge functions).
 * Contém as regras de decisão para classificar uma iniciativa em W1/W2/W3.
 */
export const WAVE_FRAMEWORK_PROMPT = `
# Framework Wave — Liberdade Médica

## Conceito
${WAVE_CONCEITO}

## Waves (execução sequenciada)

### WAVE 1 — Estrutura mínima
Propósito: ${WAVES.W1.proposito}
Regra: Tudo que remove risco sistêmico (governança, dados, financeiro, processos,
método, pessoas e liderança). Sem isso, crescer quebra.
Exemplos: ${WAVES.W1.blocos.flatMap(b => b.itens).slice(0, 12).join("; ")}.

### WAVE 2 — Escala com controle
Propósito: ${WAVES.W2.proposito}
Regra: Só entra em W2 o que DEPENDE das capacidades já instaladas em W1
(comercial, produto/jornada, operação/capacidade). Escala previsível e repetível.
Exemplos: ${WAVES.W2.blocos.flatMap(b => b.itens).slice(0, 10).join("; ")}.

### WAVE 3 — Aceleração e diferenciação
Propósito: ${WAVES.W3.proposito}
Regra: Diferenciação, novos modelos, expansão estrutural e IA avançada. Só entra
depois que a máquina de escala (W2) está estável.
Exemplos: ${WAVES.W3.blocos.flatMap(b => b.itens).slice(0, 10).join("; ")}.

## Como classificar uma iniciativa
1. A iniciativa remove um gargalo estrutural / risco sistêmico? → W1.
2. Depende de capacidades W1 já instaladas e permite crescer com previsibilidade
   e repetição? → W2.
3. É diferenciação competitiva, novo modelo de negócio ou expansão estrutural
   que só faz sentido com W1+W2 estáveis? → W3.

## Diferenciação de conceitos (Wave NÃO é)
${WAVE_DIFERENCIACAO.map(d => `- ${d.conceito}: ${d.diferenca}`).join("\n")}
`.trim();
