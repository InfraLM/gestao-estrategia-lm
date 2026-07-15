import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Compass, Trophy, Telescope, Rocket, Layers, Shield, TrendingUp, Users, Cog, GraduationCap, Heart, DollarSign, Building2, Sparkles, Lightbulb, Grid2x2 } from "lucide-react";
import EstrategiaToolInsights from "@/components/EstrategiaToolInsights";
import OkrsSemestrais from "@/components/OkrsSemestrais";

const FERRAMENTAS = {
  ICP: {
    descricao: "Perfil de Cliente Ideal (ICP) define quem é o cliente que mais se beneficia da oferta e gera maior LTV. Foca esforços de aquisição, produto e atendimento no segmento com melhor fit estratégico, evitando dispersão.",
    referencia: "Lincoln Murphy — Sales Acceleration Formula / Customer Success: How Innovative Companies Are Reducing Churn (2016).",
  },
  PlayToWin: {
    descricao: "Framework de cinco escolhas integradas: Aspiração vencedora, Onde Jogar, Como Vencer, Capacidades necessárias, Sistemas de gestão. Garante coerência entre escopo competitivo e diferenciação.",
    referencia: "A. G. Lafley & Roger L. Martin — Playing to Win: How Strategy Really Works (Harvard Business Review Press, 2013).",
  },
  Ansoff: {
    descricao: "Matriz que cruza produtos (existentes/novos) com mercados (existentes/novos), gerando 4 avenidas de crescimento: Penetração, Desenvolvimento de Mercado, Desenvolvimento de Produto e Diversificação. Permite balancear risco e ambição.",
    referencia: "H. Igor Ansoff — Strategies for Diversification, Harvard Business Review (1957); Corporate Strategy (McGraw-Hill, 1965).",
  },
  OceanoAzul: {
    descricao: "Matriz ERRC (Eliminar, Reduzir, Elevar, Criar) reconfigura a curva de valor do setor para tornar a concorrência irrelevante, criando demanda em espaço de mercado novo (oceano azul) em vez de competir em mercado saturado (oceano vermelho).",
    referencia: "W. Chan Kim & Renée Mauborgne — Blue Ocean Strategy (Harvard Business Review Press, 2005; ed. expandida 2015).",
  },
  VRIN: {
    descricao: "Visão Baseada em Recursos (RBV) avalia se um recurso é fonte de vantagem competitiva sustentável pelos critérios VRIN: Valioso, Raro, Inimitável e Não-substituível (também conhecido como VRIO).",
    referencia: "Jay B. Barney — Firm Resources and Sustained Competitive Advantage, Journal of Management (1991); Gaining and Sustaining Competitive Advantage (Pearson, 2014).",
  },
  BSC: {
    descricao: "Balanced Scorecard traduz a estratégia em objetivos e indicadores em 4 perspectivas equilibradas: Financeira, Cliente, Processos Internos e Aprendizado & Crescimento, conectados por relações de causa e efeito (mapa estratégico).",
    referencia: "Robert S. Kaplan & David P. Norton — The Balanced Scorecard: Translating Strategy into Action (Harvard Business School Press, 1996); Strategy Maps (2004).",
  },
  Pilares: {
    descricao: "Pilares estratégicos não-negociáveis: condições necessárias (must-haves) que sustentam a tese. Se qualquer um falhar, a vantagem competitiva colapsa. Análoga ao conceito de 'core competencies' e 'must-win battles'.",
    referencia: "Hamel & Prahalad — The Core Competence of the Corporation, HBR (1990); Killing & Malnight — Must-Win Battles (Wharton, 2005).",
  },
};


const ambicaoCards = [
  { icon: Compass, title: "Norte Estratégico", text: "Construir um ecossistema educacional médico que desenvolve competência clínica real, reduz risco assistencial e sustenta vínculo econômico recorrente, com ambição explícita de impacto social mensurável (1M de vidas salvas)." },
  { icon: Telescope, title: "BHAG · Visão 2034", text: "Salvar 1 milhão de vidas até 2034." },
  { icon: Trophy, title: "Posicionamento", text: "Principal ecossistema de formação prática para médicos que atuam no paciente grave no início da carreira — diferenciação por prática hospitalar real supervisionada e jornada estruturada de evolução profissional." },
];

const icp = {
  primario: ["Médicos em formação ou atuação com alta responsabilidade clínica", "Sentem insegurança em decisões críticas", "Sem residência", "Dependência ≥ 50% da renda de plantões", "Atua em PS, UPA, UTI ou alta complexidade", "Alta exposição clínica com baixa supervisão"],
  dorCentral: "Medo de errar e insegurança clínica diante do paciente grave.",
  doresSec: ["Falta de prática real", "Plantão sem suporte", "Insegurança diagnóstica"],
  desejos: ["Segurança clínica", "Empregabilidade", "Status entre pares", "Respeito da equipe", "Progressão de carreira"],
};

const playToWin = [
  { titulo: "Onde Jogar", cor: "border-l-primary bg-primary/5", itens: ["Ecossistema de formação prática e progressão de carreira para médicos expostos ao paciente grave no início da trajetória profissional"] },
  { titulo: "Onde NÃO Jogar", cor: "border-l-destructive bg-destructive/5", itens: ["Outras profissões assistenciais", "Plataforma generalista de conteúdo médico", "Substituto de residência", "Educação médica massificada de baixo ticket"] },
  { titulo: "Como Vencer", cor: "border-l-success bg-success/5", itens: ["Prática hospitalar real supervisionada no método LM", "Expandir geograficamente polos padronizados", "Comunidade e pertencimento", "Integrar portfólio para LTV e retenção", "Margem premium via diferenciação prática"] },
  { titulo: "O que NÃO Faremos", cor: "border-l-warning bg-warning/5", itens: ["Guerra de preço", "Conteúdo superficial para volume", "Promessas de titulação", "Escala sem controle de qualidade prática"] },
];

const ansoff = [
  { titulo: "1. Penetração de Mercado", peso: "40%", cor: "bg-primary/10 text-primary border-primary/30", desc: "Expansão do core — Pós em Paciente Grave via expansão geográfica, parcerias hospitalares e autoridade local." },
  { titulo: "2. Desenvolvimento de Produto", peso: "30%", cor: "bg-info/10 text-info border-info/30", desc: "Expansão de valor do core — certificações, mentorias high-ticket, trilhas com IA, Clube LM." },
  { titulo: "3. Desenvolvimento de Mercado", peso: "20%", cor: "bg-success/10 text-success border-success/30", desc: "Escala do modelo — novos polos padronizados, expansão geográfica disciplinada." },
  { titulo: "4. Diversificação · Ecossistema", peso: "10%", cor: "bg-warning/10 text-warning border-warning/30", desc: "Construção do ecossistema de carreira — produtos adjacentes, M&A, lock-in de carreira." },
];

const errc = [
  { tipo: "Eliminar", cor: "bg-destructive/10 border-destructive/30 text-destructive", itens: ["Conteúdo teórico desconectado da prática", "Promessa de titulação sem entrega clínica", "Massificação sem padrão"] },
  { tipo: "Reduzir", cor: "bg-warning/10 border-warning/30 text-warning", itens: ["Dependência de tráfego pago", "Tickets baixos sem margem", "Escala sem qualidade"] },
  { tipo: "Elevar", cor: "bg-info/10 border-info/30 text-info", itens: ["Prática hospitalar supervisionada", "Comunidade e mentoria", "Padronização do método LM"] },
  { tipo: "Criar", cor: "bg-success/10 border-success/30 text-success", itens: ["Métrica pública de segurança clínica", "Rede nacional padronizada LM", "Simulação clínica com IA", "Certificação dupla"] },
];

const bsc = [
  {
    perspectiva: "Financeira", icon: DollarSign, cor: "from-success/20 to-success/5 border-success/30",
    objetivos: [
      { codigo: "F.01", nome: "Previsibilidade de Caixa", meta: "FCOL ±5% até 2030", kpis: ["NRR > 115%", "Inadimplência >30d ≤ 6%", "Previsão DFC ±5%"] },
      { codigo: "F.02", nome: "Crescimento com Rentabilidade Sustentável", meta: "R$ 200mi · Margem >35% em 2030", kpis: ["OPEX ratio < 43%", "Margem contribuição > 65%", "Forecast DRE ±5%"] },
    ],
  },
  {
    perspectiva: "Cliente & Mercado", icon: Heart, cor: "from-primary/20 to-primary/5 border-primary/30",
    objetivos: [
      { codigo: "C.01", nome: "Experiência WOW", meta: "NPS contínuo > 80", kpis: ["CSAT aulas/imersões > 4,75", ">30% alunos em 3+ pilares", ">95% tickets em 1ª resposta (≤30min)"] },
      { codigo: "C.02", nome: "Penetração de Mercado", meta: "8.030 leads · 4.000 alunos", kpis: ["Autoridade institucional local", "Parcerias hospitalares regionais", "Lançamento por praça < 30 dias"] },
    ],
  },
  {
    perspectiva: "Processos", icon: Cog, cor: "from-info/20 to-info/5 border-info/30",
    objetivos: [
      { codigo: "P.01", nome: "Conversão Comercial High-Ticket", meta: "17% lead → matrícula", kpis: ["SQL → Matrícula > 35%", "MQL → SQL ≥ 20%", "No-show < 20%"] },
      { codigo: "P.02", nome: "Eficiência de Cobrança", meta: "Inadimplência >30d < 6%", kpis: ["Recuperação mensal > 50%", "Recorrência cartão > 90%"] },
      { codigo: "P.03", nome: "Automação de Processos Core", meta: "100% mapeados · 80% automatizados", kpis: ["Lead time -25%", "30% portfólio com IA nativa", "Ciclo BPM em 100% dos processos"] },
      { codigo: "P.04", nome: "AI First · Human First com AI", meta: "100% das áreas com IA integrada", kpis: ["Copilotos por área", "Produtos com IA integrada", "Trilhas personalizadas"] },
    ],
  },
  {
    perspectiva: "Aprendizagem & Crescimento", icon: GraduationCap, cor: "from-warning/20 to-warning/5 border-warning/30",
    objetivos: [
      { codigo: "AC.01", nome: "Cultura Viva & Alta Performance", meta: ">90% de adesão cultural", kpis: ["100% áreas com OKRs ativos", "85% aderência aos rituais", "100% áreas com gestão à vista"] },
    ],
  },
];

const vrin = [
  { ativo: "Rede hospitalar estruturada", risco: "Virar ativo físico caro sem diferenciação metodológica" },
  { ativo: "Método pedagógico aplicado ao ambiente real", risco: "Virar plataforma de conteúdo sem densidade real" },
  { ativo: "Marca no nicho", risco: "Sem consolidação, perde autoridade" },
  { ativo: "Integração longitudinal da jornada", risco: "Fragmentação destrói LTV" },
  { ativo: "Cultura e comunidade", risco: "Sem rituais, comunidade esvazia" },
  { ativo: "Parceria âncora (Hosp. Jacob Facuri)", risco: "Sem legitimidade externa, vira selo interno fraco" },
];

const FERRAMENTAS_SWOT = {
  descricao: "Síntese de Forças e Fraquezas (internas) e Oportunidades e Ameaças (externas). O cruzamento entre quadrantes (FO/FA/WO/WT) gera as hipóteses estratégicas que alimentam o BSC, OKRs e o backlog de iniciativas.",
  referencia: "Albert Humphrey — Stanford SRI (1960s); Andrews — The Concept of Corporate Strategy (1971); Weihrich — TOWS Matrix, Long Range Planning (1982).",
};

// SWOT consolidado (extraído de Construcao_Estratégia_LM)
const swot = {
  forcas: [
    "Propósito claro: formar médicos para salvar vidas",
    "Imersões clínicas supervisionadas + centro de simulação próprio",
    "Time médico fundador com vivência prática e credibilidade",
    "Foco em raciocínio clínico aplicado + simulação",
    "Abordagem híbrida (presencial + EAD) com potencial em IA médica",
    "Time ágil com alta adaptabilidade",
    "Alinhamento à exigência de pós lato sensu de 1.800h",
    "Marca forte no nicho e melhor avaliação Google da categoria",
    "Maior carga horária do mercado, plantão flexível, dupla certificação",
    "NPS alto, prova social forte e autoridade no mercado",
    "Equipe e cultura: time comercial engajado",
    "Margem alta do produto",
    "Flexibilidade e ambiente que incentiva autonomia",
  ],
  fraquezas: [
    "Processos internos não padronizados, dificultando escala",
    "Escassez de professores médicos disponíveis",
    "Falta de reconhecimento formal por MEC/CFM",
    "Baixa presença de indicadores de impacto clínico (KPIs)",
    "Custo elevado de simulação e tecnologia",
    "Dependência da infraestrutura do hospital parceiro em Goiânia",
    "Time de automação limitado frente à demanda; time júnior",
    "Inadimplência alta",
    "Falta de KPIs internos e gestão da informação; base não confiável",
    "Concentração de know-how em pessoas-chave (gestão do conhecimento frágil)",
    "Ausência de governança corporativa e de planejamento estratégico",
    "Falta de clareza de papéis e estrutura organizacional",
    "Churn alto e retenção do time fragilizada",
    "Falta de canal de comunicação confiável e gestão planejado x realizado",
    "Ausência de portfólio de produtos e de gestão de sistemas/acessos",
    "Time muito próximo (amigos) — risco de imaturidade decisória",
  ],
  oportunidades: [
    "Edtech ~17% a.a.; educação médica +18,4% a.a. (2025–2029)",
    "Demanda contínua por atualização clínico-tecnológica e IA em saúde",
    "Brasil: alta abertura de médicos a IA na prática clínica",
    "Preferência por formatos híbridos, modulares e flexíveis",
    "Capital robusto para healthtech (US$ 3 bi nos EUA no 1T25)",
    "Novas DCNs: ≥10% de carga horária tecnológica; PBL e prática SUS",
    "Expansão do Mais Médicos (15 mil vagas) reforça paciente grave",
    "Telemedicina institucionalizada (Lei 14.510/2022 + SUS Digital)",
    "ENAMED valoriza cursos robustos; 40 mil recém-formados/ano frágeis",
    "Sandbox ANS/ANVISA para simulação e VR",
    "Pressão ESG (COP-30) favorece polos regionais",
    "Demanda por emergencistas/intensivistas (envelhecimento)",
    "Geração Z médica espera formatos híbridos e acessíveis",
    "Fundos públicos/privados (FINEP, Start-Ed, Start-Up Brasil)",
    "Produtos financeiros para alunos e remuneração variável para o time",
    "Produtos de comunidade e parcerias B2B (ex.: POCUS)",
  ],
  ameacas: [
    "Pressão regulatória (ANVISA, LGPD, marco legal de IA)",
    "Concorrência capitalizada nacional/internacional (Sanar, Afya etc.)",
    "Escassez de formadores em IA, ética e simulação avançada",
    "Cibersegurança e vazamento de dados sensíveis",
    "Desigualdades regionais de infraestrutura limitam adesão",
    "Possível endurecimento de regras CFM/MEC para cursos livres",
    "Sensibilidade a preço de estudantes e jovens médicos",
    "Expectativa elevada de aplicabilidade clínica imediata",
    "Obsolescência tecnológica rápida sem atualização constante",
    "Alto custo de manter infra física, simuladores e parcerias",
    "Substituição por conteúdos gratuitos (YouTube, apps, grupos)",
    "Entrada constante de novos players em educação médica",
    "Poder de barganha alto dos médicos-clientes",
    "CFM 2.386/2024: transparência obrigatória em patrocínios",
    "Dependência excessiva de canais digitais para captação",
    "Comunidade médica deslegitimando modelos inovadores",
    "Risco ético no uso de IA em produtos com IA nativa",
  ],
};

// Hipóteses estratégicas — cruzamentos SWOT (4 cenários)
const hipoteses = [
  {
    cenario: "Cenário 1 · Alavancagem (F + O)",
    descricao: "Potencializar oportunidades com forças internas. Cenário favorável a investimento e expansão.",
    cor: "border-success/40 bg-success/5",
    badge: "bg-success/10 text-success border-success/30",
    itens: [
      { cruzamento: "Centro de simulação próprio + DCNs valorizam prática e tecnologia", hipotese: "Posicionar o centro como laboratório de referência e ofertar serviço B2B/B2G a IES, ET-SUS e prefeituras (Cuiabá, Inhumas)." },
      { cruzamento: "Propósito de salvar vidas + políticas públicas de digitalização", hipotese: "Parcerias com UNA-SUS e hospitais-escola, capturando verba direcionada à saúde." },
      { cruzamento: "Equipe médica fundadora + demanda por IA em saúde", hipotese: "Cursos de IA médica liderados por médicos reais, com selo de curadoria clínica." },
      { cruzamento: "Imersões clínicas + nova geração busca prática + tech", hipotese: "Trilha híbrida e gamificada (simulação + telemedicina + prática) e produto preparatório para Teste de Proficiência Médica." },
      { cruzamento: "Centro de simulação + sandbox ANS/ANVISA", hipotese: "Consolidar o centro como polo regulado de testes e educação médica digital." },
      { cruzamento: "Pós robusta (1.800h) + fiscalização sobre lato sensu fracos", hipotese: "Selo próprio de qualidade + buscar selos MEC/ICP/internacionais como benchmark do setor." },
      { cruzamento: "Demanda no sudeste + diferencial do produto", hipotese: "Abrir filial da LM em São Paulo." },
      { cruzamento: "Canais digitais com LTV/CAC > 30", hipotese: "Dobrar investimento nos 3 canais com maior ROAS (+40% lead qualificado, redução de CPL)." },
      { cruzamento: "Volume alto de alunos + NPS > 90", hipotese: "Programa de indicação gamificado pós-NPS: 20% das matrículas via referral, CAC -25%." },
      { cruzamento: "Prática 1.800h + DCN exige uso de tecnologia", hipotese: "Transformar horas práticas em módulo de IA no centro de simulação." },
      { cruzamento: "Mais Médicos 15k + autoridade em paciente grave", hipotese: "Módulo B2G “Critical Care Upskill” para prefeituras." },
      { cruzamento: "Expansão geográfica das imersões", hipotese: "Firmar hospital-convênio em SP e Recife (1 ciclo de imersão por hub)." },
      { cruzamento: "Marca forte + portfólio + time engajado", hipotese: "Lançar Clube da Liberdade — produto de comunidade." },
      { cruzamento: "Autoridade em emergência + Lei 14.510/22 + marco IA", hipotese: "1º certificado brasileiro integrando telemedicina, IA clínica e ética digital em decisões críticas." },
      { cruzamento: "CFM define o que é especialista + maior carga horária prática", hipotese: "Capturar mercado de prova de título e proficiência médica com a Pós LM." },
      { cruzamento: "Diferenciação prática + sustentabilidade", hipotese: "Levar dupla certificação a polos regionais, reduzindo custo logístico e impacto ambiental." },
      { cruzamento: "Foco no aluno + comunidade longitudinal", hipotese: "Ampliar LM Club como comunidade de alumni com monetização recorrente." },
      { cruzamento: "Governança e IA nativa", hipotese: "Contratar CTO para estruturar governança de IA e alavancar iniciativas com IA na empresa." },
    ],
  },
  {
    cenario: "Cenário 2 · Defesa (F + A)",
    descricao: "Mitigar ameaças usando forças. Estratégia de blindagem — proteger ativos até a ameaça passar.",
    cor: "border-info/40 bg-info/5",
    badge: "bg-info/10 text-info border-info/30",
    itens: [
      { cruzamento: "Centro de simulação + ameaça regulatória em prática hospitalar", hipotese: "Garantir prática via simulação própria e formalizar parcerias com hospitais universitários/IES como escudo regulatório." },
      { cruzamento: "Equipe médica experiente + risco de substituição por apps gratuitos", hipotese: "Diferenciação por professores reais e prática presencial de excelência (conteúdo + experiência insubstituível)." },
      { cruzamento: "Marca com propósito + obsolescência tecnológica", hipotese: "Célula de inovação contínua olhando portfólio para o ICP, com time tech/parcerias para produtos com IA nativa." },
      { cruzamento: "Imersão prática + concorrência com grandes players", hipotese: "Programa premium com selo de excelência clínica não replicável por players genéricos." },
      { cruzamento: "Simulação com IA + regulação de IA médica", hipotese: "Núcleo de governança algorítmica com documentação ética/técnica e parceria CEIA-UFG." },
      { cruzamento: "Marca ética + regulação CFM sobre patrocínios", hipotese: "Política de transparência de parceiros e patrocínios com compliance preventivo (CFM 2.386/2024)." },
      { cruzamento: "Autoridade clínica + endurecimento MEC para híbridos", hipotese: "Escudo regulatório: chancela via faculdade própria + selo de tecnologia confiável (segurança algorítmica)." },
      { cruzamento: "Sensibilidade a preço (S+T #2)", hipotese: "Camadas de produto acessíveis e premium — Preço Justo & Valor Clínico." },
      { cruzamento: "Obsolescência tecnológica (S+T #3)", hipotese: "Innovation Squad 90-Day: revisar 30% dos módulos críticos a cada 3 anos; ciclo 12→3 meses; NPS ≥ 80." },
      { cruzamento: "Dependência de key-people (S+T #5)", hipotese: "Backup de Conhecimento & Instrutor-Mentor: SOPs + shadow week → -50% dependência em 6 meses." },
      { cruzamento: "Posicionamento ESG (S+T #6)", hipotese: "ESG-Ready Hospital Partnership: contrato 3 anos com créditos de carbono → previsibilidade + selo ESG." },
    ],
  },
  {
    cenario: "Cenário 3 · Limitação (W + O)",
    descricao: "Fraquezas atrapalham aproveitar oportunidades. Reforçar capacidades para destravar avenidas.",
    cor: "border-warning/40 bg-warning/5",
    badge: "bg-warning/10 text-warning border-warning/30",
    itens: [
      { cruzamento: "Processos não padronizados + editais Start-Ed/FINEP (W+O #1)", hipotese: "ProcessOps Grant: mapear 10 processos-chave, SOPs ClickUp + automações n8n financiadas → -30% lead-time." },
      { cruzamento: "Escassez de docentes + trilhas de IA e digital", hipotese: "Usar IA para acelerar produção de conteúdo base com revisão médica posterior (projeto CEIA)." },
      { cruzamento: "Ausência de KPIs clínicos + ENAMED", hipotese: "Dashboards de desempenho do aluno por competências médicas reais, posicionando como suporte ao ENAMED." },
      { cruzamento: "Baixa escalabilidade prática + fundos públicos de inovação", hipotese: "Captar FINEP/Start-Ed para escalar plataforma com impacto social e validação clínica." },
      { cruzamento: "W+O #2 — Faculty Cloud", hipotese: "Marketplace de Professores remotos com micro-aulas → dobrar corpo docente, -20% custo/hora." },
      { cruzamento: "W+O #6 — Comms One-Stop", hipotese: "Centralizar comunicação em ClickUp Chat + Check-In 15’ semanal → -30% ruído e retrabalho." },
      { cruzamento: "Processos não padronizados + polos regionais", hipotese: "Padronizar protocolos de entrega para replicar polos com qualidade controlada." },
      { cruzamento: "Falta de reconhecimento formal + Estratégia SUS Digital", hipotese: "Convênios com hospitais públicos e universidades para validar módulos online práticos." },
    ],
  },
  {
    cenario: "Cenário 4 · Vulnerabilidade (W + A)",
    descricao: "Fraquezas potencializam ameaças. Repensar negócio/operação — sobrevivência e blindagem mínima.",
    cor: "border-destructive/40 bg-destructive/5",
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    itens: [
      { cruzamento: "Falta de reconhecimento formal + fiscalização crescente", hipotese: "Convênios com instituições reconhecidas como extensão oficial da formação médica (respaldo jurídico)." },
      { cruzamento: "Baixo controle LGPD + risco legal por dados sensíveis", hipotese: "Núcleo de compliance digital com políticas de proteção, consentimento e auditoria." },
      { cruzamento: "Dependência de poucos especialistas + pressão por escala", hipotese: "Rede de mentores clínicos replicável (capacitação interna + franquia de conteúdo supervisionado)." },
      { cruzamento: "Custo de simulação + concorrência por preço/substitutos gratuitos", hipotese: "Acesso modular e assinatura recorrente — formatos acessíveis sem perder valor clínico." },
      { cruzamento: "Críticas por deslocamento + pressão ambiental", hipotese: "Compensar carbono e lançar polos regionais, integrando ESG à narrativa institucional." },
      { cruzamento: "Falta de KPIs + regulação futura de IA", hipotese: "Sistema de medição de eficácia clínica nos simuladores com dados anonimizados para auditorias." },
      { cruzamento: "W+T #1 — Plano Anti-Inadimplência", hipotese: "Estruturar time financeiro + responsável por cobrança + avaliação de crédito do aluno." },
      { cruzamento: "W+T #2 — MEC Fast-Track", hipotese: "Consultoria regulatória + protocolar lato sensu até Q1/26 (continuidade + selo premium)." },
      { cruzamento: "W+T #6 — Faculty Retention Shield", hipotese: "Programa de experiência do mentor para reter docentes contra Sanar/Afya." },
      { cruzamento: "W+T #3 — Ops Automation Surge", hipotese: "Sprints RPA low-code com parceiro n8n certificado para cobrir backlog 2025 (Zeev)." },
      { cruzamento: "W+T #4 — Knowledge Vault", hipotese: "Repositório GitBook + vídeo SOP + Instrutor-Mentor → -50% dependência em 6 meses." },
    ],
  },
];

export default function Estrategia() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* HERO */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5" />
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">Estratégia LM · Formulação + Planejamento</Badge>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Infraestrutura de carreira do médico early-career que atua com paciente grave</h2>
          <p className="text-primary-foreground/90 max-w-4xl leading-relaxed">
            Construir e dominar a infraestrutura de carreira do médico early-career, usando a educação prática como porta de entrada
            para organizar sua vida profissional, reduzir risco clínico, jurídico e emocional, criar pertencimento e capturar valor ao longo de toda a trajetória médica
            por meio de um ecossistema premium, relacional e difícil de copiar.
          </p>
        </CardContent>
      </Card>

      {/* PILARES IMPRESCINDÍVEIS — sustentam a tese (compacto) */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-warning/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Pilares que Sustentam a Tese</CardTitle>
            <Badge variant="destructive" className="ml-auto text-[10px]">Não-negociáveis</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Condições necessárias para o moat e o BHAG de 1M de vidas. Passe o mouse para detalhes.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <TooltipProvider delayDuration={150}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { icon: Heart, titulo: "Prática hospitalar real", desc: "Núcleo do método LM — não substituível por conteúdo digital. Define o diferencial percebido pelo médico early-career." },
                { icon: Building2, titulo: "Rede padronizada", desc: "Polos com método LM replicável. Sem padronização, escala destrói qualidade e mata a marca técnica." },
                { icon: Users, titulo: "ICP respeitado", desc: "Médico early-career exposto ao paciente grave. Sair do ICP dilui posicionamento e abre flanco para Afya/Sanar." },
                { icon: Trophy, titulo: "Autoridade docente", desc: "Médicos ativos em plantão. Sem isso, vira plataforma de conteúdo genérica." },
                { icon: Sparkles, titulo: "Comunidade longitudinal", desc: "Pertencimento + integração de portfólio = LTV alto. Fragmentar a jornada destrói o lock-in de carreira." },
                { icon: DollarSign, titulo: "Disciplina premium", desc: "Margem >35% e ticket high. Descontar preço corrói o moat e atrai o público errado." },
              ].map((p) => (
                <Tooltip key={p.titulo}>
                  <TooltipTrigger asChild>
                    <div className="p-2 rounded-md bg-card border border-primary/20 hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-default flex flex-col items-center text-center gap-1">
                      <p.icon className="h-4 w-4 text-primary" />
                      <span className="text-[11px] font-medium leading-tight line-clamp-2">{p.titulo}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <div className="font-semibold mb-1">{p.titulo}</div>
                    <p className="text-muted-foreground">{p.desc}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
          <EstrategiaToolInsights ferramenta="Pilares Imprescindíveis" {...FERRAMENTAS.Pilares} />
        </CardContent>
      </Card>

      {/* AMBICAO CARDS */}
      <div className="grid md:grid-cols-3 gap-4">
        {ambicaoCards.map((c) => (
          <Card key={c.title} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <c.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{c.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">{c.text}</CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="formulacao" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="formulacao">Formulação Estratégica</TabsTrigger>
          <TabsTrigger value="planejamento">Planejamento (BSC)</TabsTrigger>
          <TabsTrigger value="okrs">OKRs Semestrais</TabsTrigger>
        </TabsList>

        {/* FORMULAÇÃO */}
        <TabsContent value="formulacao" className="space-y-6 mt-6">
          {/* ICP */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>ICP — Perfil de Cliente Ideal</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">ICP Primário (Core)</h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {icp.primario.map((i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{i}</li>)}
                </ul>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="text-xs font-semibold text-destructive uppercase mb-1">Dor Central (não negociável)</div>
                  <div className="text-sm">{icp.dorCentral}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-warning uppercase mb-2">Dores Secundárias</div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {icp.doresSec.map((d) => <li key={d}>· {d}</li>)}
                  </ul>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-success uppercase mb-2">Desejos Latentes</div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {icp.desejos.map((d) => <li key={d} className="flex gap-2"><span className="text-success">✓</span>{d}</li>)}
                </ul>
              </div>
              <div className="md:col-span-3">
                <EstrategiaToolInsights ferramenta="ICP" {...FERRAMENTAS.ICP} />
              </div>
            </CardContent>
          </Card>

          {/* PLAY TO WIN */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Play to Win</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {playToWin.map((p) => (
                <div key={p.titulo} className={`p-4 rounded-lg border-l-4 ${p.cor}`}>
                  <h4 className="font-semibold text-sm mb-2">{p.titulo}</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {p.itens.map((i) => <li key={i}>· {i}</li>)}
                  </ul>
                </div>
              ))}
              <div className="md:col-span-2">
                <EstrategiaToolInsights ferramenta="Play to Win" {...FERRAMENTAS.PlayToWin} />
              </div>
            </CardContent>
          </Card>

          {/* ANSOFF */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <CardTitle>Matriz Ansoff — Avenidas de Crescimento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ansoff.map((a) => (
                <div key={a.titulo} className={`p-4 rounded-lg border ${a.cor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{a.titulo}</h4>
                    <Badge variant="outline" className={a.cor}>{a.peso}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{a.desc}</p>
                </div>
              ))}
              <div className="md:col-span-2 lg:col-span-4">
                <EstrategiaToolInsights ferramenta="Ansoff" {...FERRAMENTAS.Ansoff} />
              </div>
            </CardContent>
          </Card>

          {/* OCEANO AZUL ERRC */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle>Oceano Azul — Matriz ERRC</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {errc.map((e) => (
                <div key={e.tipo} className={`p-4 rounded-lg border ${e.cor}`}>
                  <h4 className="font-bold text-sm mb-2 uppercase tracking-wide">{e.tipo}</h4>
                  <ul className="space-y-1 text-xs">
                    {e.itens.map((i) => <li key={i}>· {i}</li>)}
                  </ul>
                </div>
              ))}
              <div className="md:col-span-2 lg:col-span-4">
                <EstrategiaToolInsights ferramenta="Oceano Azul / ERRC" {...FERRAMENTAS.OceanoAzul} />
              </div>
            </CardContent>
          </Card>

          {/* VRIN */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>VRIN Projetado · Geração de Moat</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {vrin.map((v) => (
                  <div key={v.ativo} className="p-3 rounded-lg bg-surface-muted border border-border">
                    <div className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-primary" />{v.ativo}
                    </div>
                    <div className="text-xs text-muted-foreground"><span className="font-semibold text-warning">Risco:</span> {v.risco}</div>
                  </div>
                ))}
              </div>
              <EstrategiaToolInsights ferramenta="VRIN / RBV" {...FERRAMENTAS.VRIN} />
            </CardContent>
          </Card>

          {/* SWOT */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Grid2x2 className="h-5 w-5 text-primary" />
                <CardTitle>Matriz SWOT</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Diagnóstico interno (Forças/Fraquezas) e externo (Oportunidades/Ameaças) consolidado a partir de PESTEL, 5 Forças e RBV. Base para gerar as hipóteses estratégicas.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { titulo: "Forças", itens: swot.forcas, cor: "border-success/40 bg-success/5", chip: "bg-success/15 text-success" },
                  { titulo: "Fraquezas", itens: swot.fraquezas, cor: "border-destructive/40 bg-destructive/5", chip: "bg-destructive/15 text-destructive" },
                  { titulo: "Oportunidades", itens: swot.oportunidades, cor: "border-info/40 bg-info/5", chip: "bg-info/15 text-info" },
                  { titulo: "Ameaças", itens: swot.ameacas, cor: "border-warning/40 bg-warning/5", chip: "bg-warning/15 text-warning" },
                ].map((q) => (
                  <div key={q.titulo} className={`p-4 rounded-lg border ${q.cor}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wide">{q.titulo}</h4>
                      <Badge variant="outline" className={`text-[10px] ${q.chip} border-0`}>{q.itens.length}</Badge>
                    </div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                      {q.itens.map((i) => <li key={i} className="flex gap-2"><span className="text-foreground/60 mt-0.5">·</span><span>{i}</span></li>)}
                    </ul>
                  </div>
                ))}
              </div>
              <EstrategiaToolInsights ferramenta="Matriz SWOT" {...FERRAMENTAS_SWOT} />
            </CardContent>
          </Card>

          {/* HIPÓTESES ESTRATÉGICAS */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle>Hipóteses Estratégicas · Cruzamentos SWOT</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Combinação de variáveis SWOT em 4 cenários para gerar possibilidades de ação. As hipóteses validadas alimentam OKRs, business cases e o backlog estratégico.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {hipoteses.map((c) => (
                <div key={c.cenario} className={`rounded-lg border p-4 ${c.cor}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{c.cenario}</h4>
                    <Badge variant="outline" className={`text-[10px] ${c.badge}`}>{c.itens.length} hipóteses</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{c.descricao}</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {c.itens.map((h, idx) => (
                      <div key={idx} className="p-3 rounded-md bg-card border border-border">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cruzamento</div>
                        <p className="text-xs mb-2 leading-snug">{h.cruzamento}</p>
                        <div className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">Hipótese</div>
                        <p className="text-xs text-foreground/80 leading-snug">{h.hipotese}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANEJAMENTO */}
        <TabsContent value="planejamento" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Balanced Scorecard (BSC)</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">O que precisa acontecer para a estratégia virar realidade?</p>
            </CardHeader>
            <CardContent>
              <EstrategiaToolInsights ferramenta="Balanced Scorecard (BSC)" {...FERRAMENTAS.BSC} />
            </CardContent>
          </Card>

          {bsc.map((p) => (
            <Card key={p.perspectiva} className={`bg-gradient-to-br ${p.cor} border`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <p.icon className="h-5 w-5" />
                  <CardTitle className="text-lg">Perspectiva {p.perspectiva}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {p.objetivos.map((o) => (
                  <div key={o.codigo} className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">{o.codigo}</Badge>
                      <h4 className="font-semibold text-sm">{o.nome}</h4>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3 italic">Meta: {o.meta}</div>
                    <div className="space-y-1">
                      {o.kpis.map((k) => (
                        <div key={k} className="text-xs flex items-start gap-2">
                          <span className="text-primary mt-0.5">▸</span>
                          <span>{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* WAVES */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Waves de Priorização</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Wave</strong> é um agrupamento intencional e sequenciado de iniciativas que remove restrições críticas, instala capacidades organizacionais e habilita o próximo nível de execução da estratégia — respeitando dependências, risco e capacidade de absorção. <em>Wave ordena capacidades (lógica), não cronograma.</em>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
              {[
                { wave: "W1", ano: "Remove risco sistêmico", titulo: "Estrutura mínima", desc: "Remove restrições estruturais e protege EEA/C.01: governança, dados e financeiro (FP&A 36m, cohort P&L, CAPEX, dashboards, forecast por NRR), processos e qualidade (gestão à vista, gates de prontidão, alertas de engajamento) e pessoas e liderança (método, matriz performance, PDI, OTE/PLR, rituais 1:1). Sem isso, crescer quebra." },
                { wave: "W2", ano: "Crescer com previsibilidade", titulo: "Escala com controle", desc: "Comercial e aquisição (leadscore, funil, DRE de vendedor, squads, outbound/field), produto e jornada (escada de valor, BU Paciente Grave, app próprio), operação (ITC, simulação com IA) e alavancas (follow-up automatizado, scripts/pitch com IA, pricing & packaging 2.0 ancorado no cohort P&L)." },
                { wave: "W3", ano: "Vantagem competitiva", titulo: "Aceleração e diferenciação", desc: "IA avançada (chat IA LM, copilotos, biblioteca de algoritmos, Emy Education AI-native, portfólio de agentes), marca e ecossistema (ALUMNI, calendário editorial, Pílulas, Social Selling, LM Capital/FIDC) e expansão estrutural (multi-hub SP/Recife/Curitiba, Faculty Cloud, SVST, P04 Angola)." },
              ].map((w) => (
                <div key={w.wave} className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground">{w.wave}</Badge>
                    <span className="text-xs text-muted-foreground">{w.ano}</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{w.titulo}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{w.desc}</p>
                </div>
              ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </TabsContent>

        {/* OKRs SEMESTRAIS */}
        <TabsContent value="okrs" className="space-y-6 mt-6">
          <OkrsSemestrais />
        </TabsContent>
      </Tabs>
    </div>
  );
}
