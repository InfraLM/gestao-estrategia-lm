import { icp_DEF, playToWin_DEF, ansoff_DEF, errc_DEF, vrin_DEF, swot_DEF, hipoteses_DEF, tese_DEF, pilares_DEF, ambicao_DEF, waves_DEF } from "@/data/conteudoPadroes";
import { ConteudoRevisaoProvider, useRevisaoContexto } from "@/hooks/useConteudoRevisoes";
import RevisaoSeletor from "@/components/RevisaoSeletor";
import { useConteudo } from "@/hooks/useConteudo";
import { CadastroBsc } from "./Hubs";
import { EditarConteudo } from "@/components/EditarConteudo";
import BscArvoreKpis from "@/components/BscArvoreKpis";
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
    saidas: [
      "Definição do ICP primário (core) e anti-ICP",
      "Dor central não-negociável e dores secundárias mapeadas",
      "Desejos latentes que orientam mensagem e produto",
      "Critérios de qualificação para leadscore comercial",
    ],
  },
  PlayToWin: {
    descricao: "Framework de cinco escolhas integradas: Aspiração vencedora, Onde Jogar, Como Vencer, Capacidades necessárias, Sistemas de gestão. Garante coerência entre escopo competitivo e diferenciação.",
    referencia: "A. G. Lafley & Roger L. Martin — Playing to Win: How Strategy Really Works (Harvard Business Review Press, 2013).",
    saidas: [
      "Aspiração vencedora explícita",
      "Onde Jogar / Onde NÃO Jogar (escopo competitivo)",
      "Como Vencer (proposta de valor e vantagem)",
      "Capacidades críticas e sistemas de gestão exigidos",
    ],
  },
  Ansoff: {
    descricao: "Matriz que cruza produtos (existentes/novos) com mercados (existentes/novos), gerando 4 avenidas de crescimento: Penetração, Desenvolvimento de Mercado, Desenvolvimento de Produto e Diversificação. Permite balancear risco e ambição.",
    referencia: "H. Igor Ansoff — Strategies for Diversification, Harvard Business Review (1957); Corporate Strategy (McGraw-Hill, 1965).",
    saidas: [
      "Alocação % de esforço entre as 4 avenidas de crescimento",
      "Priorização de iniciativas por avenida (Penetração/Produto/Mercado/Diversificação)",
      "Perfil de risco-retorno do portfólio de crescimento",
      "Direcionadores de M&A e novos negócios",
    ],
  },
  OceanoAzul: {
    descricao: "Matriz ERRC (Eliminar, Reduzir, Elevar, Criar) reconfigura a curva de valor do setor para tornar a concorrência irrelevante, criando demanda em espaço de mercado novo (oceano azul) em vez de competir em mercado saturado (oceano vermelho).",
    referencia: "W. Chan Kim & Renée Mauborgne — Blue Ocean Strategy (Harvard Business Review Press, 2005; ed. expandida 2015).",
    saidas: [
      "Nova curva de valor (o que Eliminar, Reduzir, Elevar, Criar)",
      "Fatores de diferenciação insubstituíveis",
      "Espaço de mercado não-contestado (oceano azul)",
      "Racional para evitar guerra de preço",
    ],
  },
  VRIN: {
    descricao: "Visão Baseada em Recursos (RBV) avalia se um recurso é fonte de vantagem competitiva sustentável pelos critérios VRIN: Valioso, Raro, Inimitável e Não-substituível (também conhecido como VRIO).",
    referencia: "Jay B. Barney — Firm Resources and Sustained Competitive Advantage, Journal of Management (1991); Gaining and Sustaining Competitive Advantage (Pearson, 2014).",
    saidas: [
      "Inventário de ativos estratégicos (moat candidates)",
      "Classificação VRIN por ativo (Valioso/Raro/Inimitável/Não-substituível)",
      "Riscos de erosão de cada ativo",
      "Investimentos necessários para proteger o moat",
    ],
  },
  BSC: {
    descricao: "Balanced Scorecard traduz a estratégia em objetivos e indicadores em 4 perspectivas equilibradas: Financeira, Cliente, Processos Internos e Aprendizado & Crescimento, conectados por relações de causa e efeito (mapa estratégico).",
    referencia: "Robert S. Kaplan & David P. Norton — The Balanced Scorecard: Translating Strategy into Action (Harvard Business School Press, 1996); Strategy Maps (2004).",
    saidas: [
      "Mapa estratégico com objetivos causais nas 4 perspectivas",
      "KPIs e metas por objetivo (F/C/P/AC)",
      "Iniciativas estratégicas alinhadas aos objetivos",
      "Cascata da estratégia para OKRs e áreas",
    ],
  },
  Pilares: {
    descricao: "Pilares estratégicos não-negociáveis: condições necessárias (must-haves) que sustentam a tese. Se qualquer um falhar, a vantagem competitiva colapsa. Análoga ao conceito de 'core competencies' e 'must-win battles'.",
    referencia: "Hamel & Prahalad — The Core Competence of the Corporation, HBR (1990); Killing & Malnight — Must-Win Battles (Wharton, 2005).",
    saidas: [
      "Lista de pilares não-negociáveis da tese",
      "Consequência explícita da falha de cada pilar",
      "Guard-rails para decisões (o que nunca sacrificar)",
      "Sinais de alerta e métricas de saúde por pilar",
    ],
  },
};








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


const FERRAMENTAS_SWOT = {
  descricao: "Síntese de Forças e Fraquezas (internas) e Oportunidades e Ameaças (externas). O cruzamento entre quadrantes (FO/FA/WO/WT) gera as hipóteses estratégicas que alimentam o BSC, OKRs e o backlog de iniciativas.",
  referencia: "Albert Humphrey — Stanford SRI (1960s); Andrews — The Concept of Corporate Strategy (1971); Weihrich — TOWS Matrix, Long Range Planning (1982).",
  saidas: [
    "Quadrantes SWOT consolidados (Forças, Fraquezas, Oportunidades, Ameaças)",
    "Hipóteses estratégicas por cruzamento TOWS (FO · FA · WO · WT)",
    "Cenários: Alavancagem, Defesa, Limitação e Vulnerabilidade",
    "Insumo direto para iniciativas do Backlog Estratégico",
  ],
};


// SWOT consolidado (extraído de Construcao_Estratégia_LM)

// Hipóteses estratégicas — cruzamentos SWOT (4 cenários)

export default function Estrategia() { return <ConteudoRevisaoProvider documento="estrategia"><EstrategiaConteudo /></ConteudoRevisaoProvider>; }

function EstrategiaConteudo() {
  const revisaoCtx = useRevisaoContexto();
  const tese = useConteudo("estr.tese", tese_DEF).data;
  const pilares = useConteudo<any[]>("estr.pilares", pilares_DEF).data;
  const ambicao = useConteudo("estr.ambicao", ambicao_DEF).data;
  const waves = useConteudo("estr.waves", waves_DEF).data;
  const icp = useConteudo<any>("estr.icp", icp_DEF).data;
  const playToWin = useConteudo("estr.playtowin", playToWin_DEF).data;
  const ansoff = useConteudo<any[]>("estr.ansoff", ansoff_DEF).data;
  const errc = useConteudo("estr.errc", errc_DEF).data;
  const vrin = useConteudo<any[]>("estr.vrin", vrin_DEF).data;
  const swot = useConteudo("estr.swot", swot_DEF).data;
  const hipotesesDados = useConteudo<any>("estr.hipoteses", hipoteses_DEF).data;
  const hipoteses: any[] = Array.isArray(hipotesesDados) ? hipotesesDados : hipotesesDados.cenarios ?? [];
  const arquivadas: any[] = Array.isArray(hipotesesDados) ? [] : hipotesesDados.arquivadas ?? [];
  return (
    <div className="space-y-6 max-w-[1400px]">
      <RevisaoSeletor />
      {revisaoCtx?.indisponivel ? null : <>
      {/* HERO */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5" />
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">Estratégia LM · Formulação + Planejamento</Badge>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">{tese.titulo}</h2>
          <EditarConteudo chave="estr.tese" padrao={tese_DEF} titulo="Tese" />
          <p className="text-primary-foreground/90 max-w-4xl leading-relaxed">
            {tese.texto}
          </p>
        </CardContent>
      </Card>

      {/* PILARES IMPRESCINDÍVEIS — sustentam a tese (ultra-compacto) */}
      <Card className="border border-primary/30 bg-gradient-to-r from-primary/5 via-background to-warning/5">
        <CardContent className="py-2.5 px-3">
          <TooltipProvider delayDuration={150}>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">Pilares que sustentam a tese</span>
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">Não-negociáveis</Badge>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {pilares.map((p) => (
                  <Tooltip key={p.titulo}>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card border border-primary/20 hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-default">
                        <Shield className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-[10.5px] font-medium leading-none">{p.titulo}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <div className="font-semibold mb-1">{p.titulo}</div>
                      {p.desc && <p className="text-muted-foreground">{p.desc}</p>}
                      {p.seFalhar && <p><b>Se falhar:</b> {p.seFalhar}</p>}
                      {p.guardRail && <p><b>Guard-rail:</b> {p.guardRail}</p>}
                      {p.sinalAlerta && <p><b>Sinal de alerta:</b> {p.sinalAlerta}</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="ml-auto">
                <EditarConteudo chave="estr.pilares" padrao={pilares_DEF} titulo="Pilares" />
                <EstrategiaToolInsights ferramenta="Pilares Imprescindíveis" {...FERRAMENTAS.Pilares} />
              </div>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>


      {/* AMBICAO CARDS */}
      <div className="flex justify-end"><EditarConteudo chave="estr.ambicao" padrao={ambicao_DEF} titulo="Ambição" /></div>
      <div className="grid md:grid-cols-3 gap-4">
        {ambicao.map((c, idx) => (
          <Card key={c.title} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{c.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">{c.text}</CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={new URLSearchParams(window.location.search).get("aba") === "cadastro-bsc" ? "cadastro-bsc" : "formulacao"} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto w-full max-w-3xl">
          <TabsTrigger value="formulacao">Formulação Estratégica</TabsTrigger>
          <TabsTrigger value="planejamento">Planejamento (BSC)</TabsTrigger>
          <TabsTrigger value="okrs">OKRs Semestrais</TabsTrigger>
          <TabsTrigger value="cadastro-bsc">Cadastro BSC</TabsTrigger>
        </TabsList>

        {/* FORMULAÇÃO */}
        <TabsContent value="cadastro-bsc" className="mt-6"><CadastroBsc /></TabsContent>
        <TabsContent value="formulacao" className="space-y-6 mt-6">
          {/* ICP */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>ICP — Perfil de Cliente Ideal</CardTitle><span className="ml-auto"><EditarConteudo chave="estr.icp" padrao={icp_DEF} titulo="ICP" /></span>
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
              {icp.anti_icp?.length > 0 && <div><h4 className="font-semibold text-sm">Anti-ICP</h4><ul className="text-sm text-muted-foreground">{icp.anti_icp.map((i:string) => <li key={i}>· {i}</li>)}</ul></div>}
              {icp.qualificacao_leadscore?.length > 0 && <div><h4 className="font-semibold text-sm">Qualificação leadscore</h4><ul className="text-sm text-muted-foreground">{icp.qualificacao_leadscore.map((i:string) => <li key={i}>· {i}</li>)}</ul></div>}
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
                <CardTitle>Play to Win</CardTitle><span className="ml-auto"><EditarConteudo chave="estr.playtowin" padrao={playToWin_DEF} titulo="Play to Win" /></span>
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
                <CardTitle>Matriz Ansoff — Avenidas de Crescimento</CardTitle><span className="ml-auto"><EditarConteudo chave="estr.ansoff" padrao={ansoff_DEF} titulo="Ansoff" /></span>
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
                  {a.portao && <p className="text-xs mt-2"><b>Portão:</b> {a.portao}</p>}
                </div>
              ))}
              <div className="md:col-span-2 lg:col-span-4">
                {ansoff.find(a => a.nota)?.nota && <p className="text-sm text-warning mb-2">{ansoff.find(a => a.nota)?.nota}</p>}
                <EstrategiaToolInsights ferramenta="Ansoff" {...FERRAMENTAS.Ansoff} />
              </div>
            </CardContent>
          </Card>

          {/* OCEANO AZUL ERRC */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle>Oceano Azul — Matriz ERRC</CardTitle><span className="ml-auto"><EditarConteudo chave="estr.errc" padrao={errc_DEF} titulo="Oceano Azul ERRC" /></span>
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
                <CardTitle>VRIN Projetado · Geração de Moat</CardTitle><span className="ml-auto"><EditarConteudo chave="estr.vrin" padrao={vrin_DEF} titulo="VRIN" /></span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b">{['Ativo','V','R','I','N','Hoje','Risco','Investimento'].map(t => <th key={t} className="p-2 text-left">{t}</th>)}</tr></thead><tbody>{vrin.map(v => <tr key={v.ativo} className="border-b border-border"><td className="p-2 font-medium">{v.ativo}</td>{['V','R','I','N','hoje','risco','investimento'].map(k => <td key={k} className="p-2">{v[k] ?? '—'}</td>)}</tr>)}</tbody></table></div>
              <EstrategiaToolInsights ferramenta="VRIN / RBV" {...FERRAMENTAS.VRIN} />
            </CardContent>
          </Card>

          {/* SWOT */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Grid2x2 className="h-5 w-5 text-primary" />
                <CardTitle>Matriz SWOT</CardTitle><span className="ml-auto"><EditarConteudo chave="estr.swot" padrao={swot_DEF} titulo="SWOT" /></span>
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

              {/* Hipóteses Estratégicas — integradas dentro da SWOT */}
              <div className="pt-4 mt-2 border-t border-border space-y-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-base">Hipóteses Estratégicas · Cruzamentos TOWS <span className="ml-auto"><EditarConteudo chave="estr.hipoteses" padrao={hipoteses_DEF} titulo="Hipóteses TOWS" /></span></h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Combinação das variáveis da SWOT em 4 cenários (FO · FA · WO · WT). As hipóteses validadas alimentam OKRs, business cases e o backlog estratégico.
                    </p>
                  </div>
                </div>
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
                          {h.referencia && <p className="text-xs text-muted-foreground mt-2">Referência: {h.referencia}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {arquivadas.length > 0 && <details className="border-t pt-3"><summary className="cursor-pointer font-semibold text-sm">Hipóteses arquivadas ({arquivadas.length})</summary><div className="space-y-3 mt-3">{arquivadas.map(h => <div key={h.hipotese}><p className="text-sm font-medium">{h.hipotese}</p><p className="text-xs text-muted-foreground">{h.motivo}</p></div>)}</div></details>}
              </div>
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

          <BscArvoreKpis rev01={bsc} />


          {/* WAVES */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Waves de Priorização</CardTitle><EditarConteudo chave="estr.waves" padrao={waves_DEF} titulo="Waves de Priorização" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Wave</strong> é um agrupamento intencional e sequenciado de iniciativas que remove restrições críticas, instala capacidades organizacionais e habilita o próximo nível de execução da estratégia — respeitando dependências, risco e capacidade de absorção. <em>Wave ordena capacidades (lógica), não cronograma.</em>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
              {waves.map((w) => (
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

        {/* OKRs SEMESTRAIS */}
        <TabsContent value="okrs" className="space-y-6 mt-6">
          <OkrsSemestrais />
        </TabsContent>
      </Tabs>
      </>}
    </div>
  );
}
