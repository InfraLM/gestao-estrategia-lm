import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Compass, Trophy, Telescope, Rocket, Layers, Shield, TrendingUp, Users, Cog, GraduationCap, Heart, DollarSign, Building2, Sparkles } from "lucide-react";
import EstrategiaToolInsights from "@/components/EstrategiaToolInsights";

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
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="formulacao">Formulação Estratégica</TabsTrigger>
          <TabsTrigger value="planejamento">Planejamento (BSC)</TabsTrigger>
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
            <CardContent className="grid md:grid-cols-3 gap-4">
              {[
                { wave: "W1", ano: "2026", titulo: "Fundamentos & Quick Wins", desc: "Consolidação de método, padronização e quick wins financeiros." },
                { wave: "W2", ano: "2027-2028", titulo: "Escala & Expansão", desc: "Polos padronizados, ecossistema integrado, expansão geográfica." },
                { wave: "W3", ano: "2029-2030", titulo: "Ecossistema & Moat", desc: "Lock-in de carreira, M&A, plataforma flywheel." },
              ].map((w) => (
                <div key={w.wave} className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground">{w.wave}</Badge>
                    <span className="text-xs text-muted-foreground">{w.ano}</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{w.titulo}</h4>
                  <p className="text-xs text-muted-foreground">{w.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
