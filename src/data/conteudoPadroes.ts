export const icp_DEF = {
  primario: ["Médicos em formação ou atuação com alta responsabilidade clínica", "Sentem insegurança em decisões críticas", "Sem residência", "Dependência ≥ 50% da renda de plantões", "Atua em PS, UPA, UTI ou alta complexidade", "Alta exposição clínica com baixa supervisão"],
  dorCentral: "Medo de errar e insegurança clínica diante do paciente grave.",
  doresSec: ["Falta de prática real", "Plantão sem suporte", "Insegurança diagnóstica"],
  desejos: ["Segurança clínica", "Empregabilidade", "Status entre pares", "Respeito da equipe", "Progressão de carreira"],
};

export const playToWin_DEF = [
  { titulo: "Onde Jogar", cor: "border-l-primary bg-primary/5", itens: ["Ecossistema de formação prática e progressão de carreira para médicos expostos ao paciente grave no início da trajetória profissional"] },
  { titulo: "Onde NÃO Jogar", cor: "border-l-destructive bg-destructive/5", itens: ["Outras profissões assistenciais", "Plataforma generalista de conteúdo médico", "Substituto de residência", "Educação médica massificada de baixo ticket"] },
  { titulo: "Como Vencer", cor: "border-l-success bg-success/5", itens: ["Prática hospitalar real supervisionada no método LM", "Expandir geograficamente polos padronizados", "Comunidade e pertencimento", "Integrar portfólio para LTV e retenção", "Margem premium via diferenciação prática"] },
  { titulo: "O que NÃO Faremos", cor: "border-l-warning bg-warning/5", itens: ["Guerra de preço", "Conteúdo superficial para volume", "Promessas de titulação", "Escala sem controle de qualidade prática"] },
];

export const ansoff_DEF = [
  { titulo: "1. Penetração de Mercado", peso: "40%", cor: "bg-primary/10 text-primary border-primary/30", desc: "Expansão do core — Pós em Paciente Grave via expansão geográfica, parcerias hospitalares e autoridade local." },
  { titulo: "2. Desenvolvimento de Produto", peso: "30%", cor: "bg-info/10 text-info border-info/30", desc: "Expansão de valor do core — certificações, mentorias high-ticket, trilhas com IA, Clube LM." },
  { titulo: "3. Desenvolvimento de Mercado", peso: "20%", cor: "bg-success/10 text-success border-success/30", desc: "Escala do modelo — novos polos padronizados, expansão geográfica disciplinada." },
  { titulo: "4. Diversificação · Ecossistema", peso: "10%", cor: "bg-warning/10 text-warning border-warning/30", desc: "Construção do ecossistema de carreira — produtos adjacentes, M&A, lock-in de carreira." },
];

export const errc_DEF = [
  { tipo: "Eliminar", cor: "bg-destructive/10 border-destructive/30 text-destructive", itens: ["Conteúdo teórico desconectado da prática", "Promessa de titulação sem entrega clínica", "Massificação sem padrão"] },
  { tipo: "Reduzir", cor: "bg-warning/10 border-warning/30 text-warning", itens: ["Dependência de tráfego pago", "Tickets baixos sem margem", "Escala sem qualidade"] },
  { tipo: "Elevar", cor: "bg-info/10 border-info/30 text-info", itens: ["Prática hospitalar supervisionada", "Comunidade e mentoria", "Padronização do método LM"] },
  { tipo: "Criar", cor: "bg-success/10 border-success/30 text-success", itens: ["Métrica pública de segurança clínica", "Rede nacional padronizada LM", "Simulação clínica com IA", "Certificação dupla"] },
];

export const vrin_DEF = [
  { ativo: "Rede hospitalar estruturada", risco: "Virar ativo físico caro sem diferenciação metodológica" },
  { ativo: "Método pedagógico aplicado ao ambiente real", risco: "Virar plataforma de conteúdo sem densidade real" },
  { ativo: "Marca no nicho", risco: "Sem consolidação, perde autoridade" },
  { ativo: "Integração longitudinal da jornada", risco: "Fragmentação destrói LTV" },
  { ativo: "Cultura e comunidade", risco: "Sem rituais, comunidade esvazia" },
  { ativo: "Parceria âncora (Hosp. Jacob Facuri)", risco: "Sem legitimidade externa, vira selo interno fraco" },
];

export const swot_DEF = {
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

export const hipoteses_DEF = [
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

export const VISAO_MISSAO_DEF = {
  proposito: "Capacitar médicos e médicas para salvarem vidas.",
  bhag: "1 milhão de vidas salvas até 2026",
  valores: [
    "Evoluímos sempre",
    "Somos mais fortes juntos",
    "Trabalhamos muito e nos divertimos",
    "O que importa é o sucesso do aluno",
    "Pensamos e agimos com inteligência",
    "Protagonistas do nosso sucesso",
    "Encantamos além do esperado",
  ],
};

export const PESTEL_DATA_DEF: Record<string, string[]> = {
  "Político":   ["Fomento via FINEP, Start-Ed", "Relações entre países", "Risco regulatório/corrupção"],
  "Econômico":  ["Inflação e juros (custo de capital)", "Câmbio internacional", "Poder de compra do médico"],
  "Social":     ["Mudança no perfil do médico (digital)", "Demanda por especialização prática", "Problemas éticos"],
  "Tecnológico":["IA generativa para conteúdo técnico", "Plataformas EAD escaláveis", "Simulação realística"],
  "Ecológico":  ["Pressão por sustentabilidade", "Pegada de eventos presenciais"],
  "Legal":      ["Normas do CFM/MEC", "LGPD", "Normas específicas de saúde"],
};

export const PORTER_DATA_DEF = [
  { forca: "Novos entrantes",  intensidade: "Alta",  acao: "Desenvolver barreiras (marca forte, parcerias exclusivas, conteúdo proprietário)." },
  { forca: "Poder de clientes", intensidade: "Alta", acao: "Programas de fidelização e comunidade para reduzir churn." },
  { forca: "Poder de fornecedores", intensidade: "Média", acao: "IA para gerar drafts técnicos — professores supervisionam." },
  { forca: "Substitutos",       intensidade: "Alta",  acao: "Investir em simulação prática, casos reais e uso didático de IA." },
  { forca: "Rivalidade",        intensidade: "Alta",  acao: "Posicionamento de nicho premium com autoridade técnica." },
];

export const RBV_RECURSOS_DEF = [
  { tipo: "Físicos",        item: "Hospitais parceiros, infraestrutura de simulação", vrin: "◐" },
  { tipo: "Humanos",        item: "Corpo docente médico ativo em plantão",            vrin: "✔" },
  { tipo: "Organizacionais",item: "Método didático integrado prática-teoria",          vrin: "✔" },
  { tipo: "Tecnológicos",   item: "Plataforma EAD + IA didática",                      vrin: "◐" },
  { tipo: "Reputacionais",  item: "Marca técnica, comunidade de ex-alunos",            vrin: "✔" },
];

export const SWOT_DATA_DEF = {
  Forças:        ["Conexão forte com plantão", "Time unido com autonomia", "Autoridade técnica de docentes", "Ecossistema integrado"],
  Fraquezas:     ["Capital limitado", "Dependência operacional hospitalar", "Escala restrita", "Processos ainda manuais"],
  Oportunidades: ["IA para escala de conteúdo", "Internacionalização (LatAm)", "Parcerias com hospitais/universidades", "Novos produtos digitais"],
  Ameaças:       ["Afya com investimento pesado em nicho", "Sanar competindo digital em escala", "Mudança regulatória", "Substitutos gratuitos com IA"],
};

export const ANSOFF_DEF = [
  { quad: "Penetração de Mercado",      ex: "Ampliar share nas residências atuais com upsell e fidelização." },
  { quad: "Desenvolvimento de Mercado", ex: "Expandir para novas regiões/países com mesmo portfólio." },
  { quad: "Desenvolvimento de Produto", ex: "Lançar trilhas/IA tutor/simulação para clientes existentes." },
  { quad: "Diversificação",             ex: "Novo modelo (B2B hospitais, fellowships, EdTech vertical)." },
];

export const ERRC_DEF = {
  Eliminar: ["Conteúdo genérico que não ensina prática", "Burocracia que afasta o médico ocupado"],
  Reduzir:  ["Tempo de produção de conteúdo (com IA)", "Dependência de presença física"],
  Elevar:   ["Experiência de simulação prática", "Comunidade e mentoria entre pares"],
  Criar:    ["IA tutor personalizado", "Trilhas com casos reais de plantão"],
};

export const ambicao_DEF = [
  { title: "Norte Estratégico", text: "Construir um ecossistema educacional médico que desenvolve competência clínica real, reduz risco assistencial e sustenta vínculo econômico recorrente, com ambição explícita de impacto social mensurável (1M de vidas salvas)." },
  { title: "BHAG · Visão 2034", text: "Salvar 1 milhão de vidas até 2034." },
  { title: "Posicionamento", text: "Principal ecossistema de formação prática para médicos que atuam no paciente grave no início da carreira — diferenciação por prática hospitalar real supervisionada e jornada estruturada de evolução profissional." },
];

export const pilares_DEF = [
                  { titulo: "Prática hospitalar real", desc: "Núcleo do método LM — não substituível por conteúdo digital. Define o diferencial percebido pelo médico early-career." },
                  { titulo: "Rede padronizada", desc: "Polos com método LM replicável. Sem padronização, escala destrói qualidade e mata a marca técnica." },
                  { titulo: "ICP respeitado", desc: "Médico early-career exposto ao paciente grave. Sair do ICP dilui posicionamento e abre flanco para Afya/Sanar." },
                  { titulo: "Autoridade docente", desc: "Médicos ativos em plantão. Sem isso, vira plataforma de conteúdo genérica." },
                  { titulo: "Comunidade longitudinal", desc: "Pertencimento + integração de portfólio = LTV alto. Fragmentar a jornada destrói o lock-in de carreira." },
                  { titulo: "Disciplina premium", desc: "Margem >35% e ticket high. Descontar preço corrói o moat e atrai o público errado." },
                ];

export const waves_DEF = [
                { wave: "W1", ano: "Remove risco sistêmico", titulo: "Estrutura mínima", desc: "Remove restrições estruturais e protege EEA/C.01: governança, dados e financeiro (FP&A 36m, cohort P&L, CAPEX, dashboards, forecast por NRR), processos e qualidade (gestão à vista, gates de prontidão, alertas de engajamento) e pessoas e liderança (método, matriz performance, PDI, OTE/PLR, rituais 1:1). Sem isso, crescer quebra." },
                { wave: "W2", ano: "Crescer com previsibilidade", titulo: "Escala com controle", desc: "Comercial e aquisição (leadscore, funil, DRE de vendedor, squads, outbound/field), produto e jornada (escada de valor, BU Paciente Grave, app próprio), operação (ITC, simulação com IA) e alavancas (follow-up automatizado, scripts/pitch com IA, pricing & packaging 2.0 ancorado no cohort P&L)." },
                { wave: "W3", ano: "Vantagem competitiva", titulo: "Aceleração e diferenciação", desc: "IA avançada (chat IA LM, copilotos, biblioteca de algoritmos, Emy Education AI-native, portfólio de agentes), marca e ecossistema (ALUMNI, calendário editorial, Pílulas, Social Selling, LM Capital/FIDC) e expansão estrutural (multi-hub SP/Recife/Curitiba, Faculty Cloud, SVST, P04 Angola)." },
              ];

export const saidas_DEF = { itens: [
            {
              titulo: "Onde jogar",
              cor: "border-primary/30 bg-primary/5 text-primary",
              texto: "Nicho premium de formação prática para o médico early-career exposto ao paciente grave — não competir em volume com Afya/Sanar.",
            },
            {
              titulo: "Como vencer",
              cor: "border-success/30 bg-success/5 text-success",
              texto: "Prática hospitalar real supervisionada (método LM) + comunidade + jornada longitudinal — barreira difícil de copiar.",
            },
            {
              titulo: "Moat a construir (VRIN)",
              cor: "border-info/30 bg-info/5 text-info",
              texto: "Rede hospitalar padronizada, marca técnica, integração longitudinal da carreira e parcerias âncora (ex.: Hosp. Jacob Facuri).",
            },
            {
              titulo: "Riscos prioritários",
              cor: "border-destructive/30 bg-destructive/5 text-destructive",
              texto: "Substitutos gratuitos com IA, escala de Afya/Sanar, dependência operacional hospitalar e capital limitado.",
            },
            {
              titulo: "Oportunidades a capturar",
              cor: "border-warning/30 bg-warning/5 text-warning",
              texto: "IA didática nativa, expansão geográfica via polos padronizados, internacionalização (LatAm) e novos produtos B2B com hospitais.",
            },
            {
              titulo: "Avenidas de crescimento (Ansoff)",
              cor: "border-accent/40 bg-accent/10 text-accent-foreground",
              texto: "40% Penetração · 30% Desenvolvimento de Produto · 20% Desenvolvimento de Mercado · 10% Diversificação/Ecossistema.",
            },
          ], sintese: "consolidar o método LM como infraestrutura de carreira do médico early-career, transformando educação prática em vínculo longitudinal de alta margem — desdobrado na página Estratégia LM." };

export const tese_DEF = { titulo: "Infraestrutura de carreira do médico early-career que atua com paciente grave", texto: "Construir e dominar a infraestrutura de carreira do médico early-career, usando a educação prática como porta de entrada para organizar sua vida profissional, reduzir risco clínico, jurídico e emocional, criar pertencimento e capturar valor ao longo de toda a trajetória médica por meio de um ecossistema premium, relacional e difícil de copiar." };

export const CONTEUDO_PADROES: Record<string, any> = {
  "diag.proposito": VISAO_MISSAO_DEF,
  "diag.pestel": PESTEL_DATA_DEF,
  "diag.porter": PORTER_DATA_DEF,
  "diag.rbv": RBV_RECURSOS_DEF,
  "diag.swot": SWOT_DATA_DEF,
  "diag.ansoff": ANSOFF_DEF,
  "diag.errc": ERRC_DEF,
  "diag.saidas": saidas_DEF,
  "estr.icp": icp_DEF,
  "estr.playtowin": playToWin_DEF,
  "estr.ansoff": ansoff_DEF,
  "estr.errc": errc_DEF,
  "estr.vrin": vrin_DEF,
  "estr.swot": swot_DEF,
  "estr.hipoteses": hipoteses_DEF,
  "estr.tese": tese_DEF,
  "estr.pilares": pilares_DEF,
  "estr.ambicao": ambicao_DEF,
  "estr.waves": waves_DEF
};
