export type KR = { id: string; titulo: string };
export type OKR = {
  id: string;
  responsavel: string;
  tema: string;
  objetivo: string;
  krs: KR[];
};
export type Semestre = { id: string; label: string; okrs: OKR[] };

export const OKRS: Semestre[] = [
  {
    id: "2026-1",
    label: "2026/1",
    okrs: [
      {
        id: "26.1.O1",
        responsavel: "Bruno",
        tema: "Blindagem Financeira",
        objetivo: "Blindar o caixa e a previsibilidade financeira da operação, garantindo condições para investir na máquina de receita.",
        krs: [
          { id: "26.1.O1.KR1", titulo: "KR1.1 · Previsibilidade: forecast DFC com desvio ≤ 5%." },
          { id: "26.1.O1.KR2", titulo: "KR1.2 · Gate Financeiro implantado para 100% dos projetos com CAPEX/OPEX relevante." },
          { id: "26.1.O1.KR3", titulo: "KR1.3 · DRE gerencial automatizado, publicado em D+5 do fechamento." },
          { id: "26.1.O1.KR4", titulo: "KR1.4 · Constituir reserva de caixa equivalente a 3 meses de custo fixo." },
          { id: "26.1.O1.KR5", titulo: "KR1.5 · Caixa operacional positivo por headcount, com baseline definido e monitorado." },
        ],
      },
      {
        id: "26.1.O2",
        responsavel: "Naira",
        tema: "Governança Institucional e Cultura de Dados",
        objetivo: "Estabelecer governança institucional viva e cultura de decisão baseada em dados.",
        krs: [
          { id: "26.1.O2.KR1", titulo: "KR2.1 · Dashboard institucional único com KPIs por diretoria, atualizado semanalmente." },
          { id: "26.1.O2.KR2", titulo: "KR2.2 · 100% das decisões estratégicas registradas formalmente (ata, dono, prazo)." },
          { id: "26.1.O2.KR3", titulo: "KR2.3 · Rituais de gestão (semanal, quinzenal, mensal) com aderência ≥ 90%." },
        ],
      },
      {
        id: "26.1.O3",
        responsavel: "Yuri",
        tema: "Jornada do Aluno e Retenção",
        objetivo: "Elevar a experiência da jornada do aluno e o valor de vida (LTV), reduzindo churn.",
        krs: [
          { id: "26.1.O3.KR1", titulo: "KR3.1 · SLA de onboarding do aluno cumprido em ≥ 95% dos casos." },
          { id: "26.1.O3.KR2", titulo: "KR3.2 · Reduzir churn semestral em pelo menos 20% vs. semestre anterior." },
          { id: "26.1.O3.KR3", titulo: "KR3.3 · Inteligência de LTV por coorte implantada e usada nas decisões de portfólio." },
        ],
      },
    ],
  },
  {
    id: "2026-2",
    label: "2026/2",
    okrs: [
      {
        id: "26.2.O1",
        responsavel: "Guilherme",
        tema: "Volume e Eficiência Comercial PPG",
        objetivo: "Aumentar o volume de vendas e a eficiência comercial da Pós-Graduação Presencial em relação ao semestre anterior.",
        krs: [
          { id: "26.2.O1.KR1", titulo: "KR1 · Taxa de conversão MQL → venda ≥ 6,5% em PPG." },
          { id: "26.2.O1.KR2", titulo: "KR2 · Ticket médio ≥ R$ 46 mil em PPG." },
          { id: "26.2.O1.KR3", titulo: "KR3 · Gerar R$ 28 milhões em VGV de Pós em Paciente Grave." },
          { id: "26.2.O1.KR4", titulo: "KR4 · Reduzir CPQML para < R$ 248 em PPG." },
          { id: "26.2.O1.KR5", titulo: "KR5 · ROAS > 10x nas campanhas de PPG." },
          { id: "26.2.O1.KR6", titulo: "KR6 · Converter ≥ 10% dos leads de eventos presenciais em oportunidades qualificadas no CRM." },
          { id: "26.2.O1.KR7", titulo: "KR7 · ≥ 2 turmas de ACLS por semana na filial SP até o fim do ano, mensurando contribuição em vendas e VGV." },
        ],
      },
      {
        id: "26.2.O2",
        responsavel: "Bruno",
        tema: "Caixa para Investir na Máquina de Receita",
        objetivo: "Garantir disponibilidade de caixa para financiar os investimentos na máquina de receita.",
        krs: [
          { id: "26.2.O2.KR1", titulo: "KR1 · Recuperar R$ 2,5 milhões em inadimplência no semestre." },
          { id: "26.2.O2.KR2", titulo: "KR2 · Antecipar R$ 1 milhão em recebíveis, preservando liquidez × custo financeiro." },
          { id: "26.2.O2.KR3", titulo: "KR3 · Aumentar em 25% o prazo médio de pagamento a fornecedores (ex-folha e ADS)." },
          { id: "26.2.O2.KR4", titulo: "KR4 · Definir baseline de entrada de caixa operacional por headcount e crescer X% no semestre." },
        ],
      },
      {
        id: "26.2.O3",
        responsavel: "Yuri",
        tema: "Presencialidade como Vantagem Competitiva",
        objetivo: "Transformar a presencialidade em uma vantagem competitiva mensurável da Liberdade Médica.",
        krs: [
          { id: "26.2.O3.KR1", titulo: "KR1 · Entregar ≥ 80% do TTFV previsto para alunos ativos de PPG." },
          { id: "26.2.O3.KR2", titulo: "KR2 · 12 vagas ativas de PFO em SP para PPG + 12 no pipeline (plug and play)." },
          { id: "26.2.O3.KR3", titulo: "KR3 · CSAT > 9,5 nas imersões PPG SP e CSAT > 9,0 no PFO PPG SP." },
          { id: "26.2.O3.KR4", titulo: "KR4 · Mapear, classificar e mitigar 100% dos riscos críticos da PPG (MEC, CFM, criminal, ruína e demais graves)." },
          { id: "26.2.O3.KR5", titulo: "KR5 · ≥ 30% dos leads de indicação da PPG a partir de eventos presenciais da LM." },
        ],
      },
    ],
  },
];
