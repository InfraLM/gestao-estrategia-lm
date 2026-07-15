import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldAlert, TrendingDown, Building2, Cpu, Scale, Download, AlertTriangle, Info, CheckCircle2, Users } from "lucide-react";
import { classifRiscoBPMO } from "@/lib/bpmoRisco";
import { exportToXLSX } from "@/lib/exportCsv";

type Bloco = "Estrutural" | "Estratégico" | "Operacional";
type Risco = {
  id: string;
  numero: number;
  nome: string;
  bloco: Bloco;
  natureza: string;
  tipos: string[];
  impacto: number; // 1-5
  probabilidade: number; // 1-5
  status: string;
  responsaveis: string[];
  impactoFinanceiro?: number;
  acoesMitigadoras: string;
  contingencia: string;
  dueDate?: string;
};

// Seed extraído do Mapa de Riscos LM + Matriz de Riscos Institucionais (Governança & Jurídico)
const RISCOS_SEED: Risco[] = [
  { id: "R01", numero: 1, nome: "Prestadores PJ", bloco: "Estrutural", natureza: "Evento", tipos: ["Legal", "Financeiro"], impacto: 5, probabilidade: 3, status: "Mitigação em andamento", responsaveis: ["Jurídico", "RH"], impactoFinanceiro: 3000000, acoesMitigadoras: "Auditoria de prestadores; regularização contratual; modelo híbrido PJ/CLT; revisão de contratos e escopos.", contingencia: "Acordo trabalhista; provisionamento de passivo; migração escalonada para CLT quando pertinente." },
  { id: "R02", numero: 2, nome: "Passivo tributário", bloco: "Estrutural", natureza: "Evento", tipos: ["Financeiro", "Legal"], impacto: 5, probabilidade: 3, status: "Mitigação em andamento", responsaveis: ["Financeiro", "Contabilidade", "Jurídico"], impactoFinanceiro: 2000000, acoesMitigadoras: "Auditoria fiscal independente; revisão tributária; avaliação de enquadramento (ex.: OSCIP); atualização de obrigações acessórias.", contingencia: "Parcelamento; defesa administrativa/judicial; provisionamento." },
  { id: "R03", numero: 3, nome: "Consumerista — Alunos", bloco: "Estrutural", natureza: "Evento", tipos: ["Legal", "Reputacional"], impacto: 4, probabilidade: 3, status: "Identificado", responsaveis: ["Jurídico", "Atendimento"], acoesMitigadoras: "Revisão de contratos com alunos; política de reembolso; SLA de suporte; canal de ouvidoria.", contingencia: "Negociação direta; acordo em audiência; melhoria imediata do processo apontado." },
  { id: "R04", numero: 4, nome: "Propriedade intelectual (conteúdo + marca)", bloco: "Estrutural", natureza: "Condição de incerteza", tipos: ["Legal", "Reputacional"], impacto: 4, probabilidade: 3, status: "Mitigação em andamento", responsaveis: ["Jurídico", "Produto"], acoesMitigadoras: "Cláusulas de cessão de PI em contratos; catálogo de conteúdos autorais; monitoramento antipirataria.", contingencia: "Notificação extrajudicial; medidas cautelares; DMCA/take-down." },
  { id: "R05", numero: 5, nome: "Estrutura societária e governança", bloco: "Estrutural", natureza: "Ambiguidade", tipos: ["Legal", "Reputacional"], impacto: 4, probabilidade: 2, status: "Identificado", responsaveis: ["Diretoria", "Jurídico"], acoesMitigadoras: "Atualização de documentos fundacionais; acordo de sócios; regimento interno; comitês formais.", contingencia: "Mediação societária; revisão de acordo; assembleia extraordinária." },
  { id: "R06", numero: 6, nome: "Regulação educacional (MEC) e mudanças regulatórias", bloco: "Estrutural", natureza: "Emergente", tipos: ["Legal", "Reputacional"], impacto: 4, probabilidade: 3, status: "Identificado", responsaveis: ["Regulatório", "Diretoria"], acoesMitigadoras: "Monitoramento de mudanças; adequação de portfólio; parcerias regulatórias.", contingencia: "Plano de conformidade acelerada; comunicação a alunos; ajustes de oferta." },
  { id: "R07", numero: 7, nome: "Regulatório — Licenças Administrativas", bloco: "Estrutural", natureza: "Evento", tipos: ["Legal"], impacto: 3, probabilidade: 3, status: "Mitigação em andamento", responsaveis: ["Facilities", "Jurídico"], acoesMitigadoras: "Calendário de renovação de licenças; checklist de conformidade por unidade.", contingencia: "Regularização emergencial; solicitação de prazos; consultoria especializada." },
  { id: "R08", numero: 8, nome: "Sanitário — Lanchonete", bloco: "Estrutural", natureza: "Evento", tipos: ["Legal", "Reputacional"], impacto: 3, probabilidade: 2, status: "Identificado", responsaveis: ["Facilities", "Operações"], acoesMitigadoras: "Padrões sanitários; treinamento; auditorias periódicas; alvará vigente.", contingencia: "Suspensão do serviço; correção imediata; comunicação transparente." },
  { id: "R09", numero: 9, nome: "Proteção de Dados e Segurança da Informação (LGPD)", bloco: "Operacional", natureza: "Evento", tipos: ["Legal", "Tecnologia/Sistemas", "Reputacional"], impacto: 5, probabilidade: 3, status: "Mitigação em andamento", responsaveis: ["Marcya Santos", "Naira Yurie", "Renato Mesquita"], impactoFinanceiro: 2000000, dueDate: "2026-05-29", acoesMitigadoras: "Política LGPD; mapeamento e classificação de dados sensíveis; controle de acesso individualizado; gestão de permissões (ClickUp, SEI, Memberkit); treinamento; logs e rastreabilidade; auditoria periódica; governança de dados; revisão contratual com operadores.", contingencia: "Ativação do plano de resposta a incidentes; contenção imediata (bloqueio de acessos); comunicação interna; notificação à ANPD e titulares; investigação de causa raiz; medidas corretivas." },
  { id: "R10", numero: 10, nome: "Bonificações", bloco: "Operacional", natureza: "Ambiguidade", tipos: ["Financeiro", "Legal"], impacto: 3, probabilidade: 3, status: "Identificado", responsaveis: ["RH", "Financeiro"], acoesMitigadoras: "Política formal de bonificação; critérios objetivos; aprovação em alçadas.", contingencia: "Revisão dos pagamentos; comunicação aos envolvidos; ajustes retroativos formais." },
  { id: "R11", numero: 11, nome: "Parcerias Hospitalares", bloco: "Estrutural", natureza: "Evento", tipos: ["Legal", "Reputacional", "Processo operacional"], impacto: 5, probabilidade: 3, status: "Mitigação em andamento", responsaveis: ["Operações", "Jurídico", "Diretoria"], acoesMitigadoras: "Política de parcerias; due diligence hospitalar; protocolos assistenciais; contratos com prestadores e hospital; seguros de responsabilidade.", contingencia: "Substituição de parceiro; comunicação a alunos; realocação de turmas; acionamento de seguros." },
  { id: "R12", numero: 12, nome: "Continuidade operacional e dependência tecnológica", bloco: "Operacional", natureza: "Evento", tipos: ["Tecnologia/Sistemas", "Processo operacional", "Estratégico"], impacto: 4, probabilidade: 3, status: "Novo registro", responsaveis: ["Naira Yurie", "Renato Mesquita", "Yuri Ribeiro"], impactoFinanceiro: 500000, dueDate: "2026-05-29", acoesMitigadoras: "Mapeamento de sistemas críticos; SLA com fornecedores; monitoramento de disponibilidade; plano de contingência tecnológica; redundância quando aplicável.", contingencia: "Ativação do plano de continuidade; acionamento de fornecedores; uso de soluções alternativas; comunicação imediata às áreas impactadas." },
  { id: "R13", numero: 13, nome: "Conflitos de interesse e governança interna", bloco: "Estrutural", natureza: "Ambiguidade", tipos: ["Legal", "Reputacional"], impacto: 3, probabilidade: 4, status: "Novo registro", responsaveis: ["Marcya Santos", "Diretoria"], dueDate: "2026-05-29", acoesMitigadoras: "Política de conflitos de interesse; alçadas e governança decisória; fluxos de aprovação; registro e transparência de decisões críticas.", contingencia: "Revisão da decisão; escalonamento ao comitê; apuração interna; eventual responsabilização." },
  { id: "R14", numero: 14, nome: "Dependência de receita concentrada em um ou poucos produtos", bloco: "Estratégico", natureza: "Variação", tipos: ["Financeiro", "Estratégico"], impacto: 5, probabilidade: 3, status: "Novo registro", responsaveis: ["Iuri Franco", "Bruno Garcia", "Diretoria"], impactoFinanceiro: 5000000, dueDate: "2026-05-29", acoesMitigadoras: "Diversificação de portfólio; desenvolvimento de novas linhas; monitoramento de concentração de faturamento; planejamento estratégico comercial.", contingencia: "Ajuste da estratégia comercial; aceleração de novos produtos; redução de custos operacionais." },
  { id: "R15", numero: 15, nome: "Continuidade da informação e gestão do conhecimento", bloco: "Operacional", natureza: "Condição de incerteza", tipos: ["Tecnologia/Sistemas", "Estratégico"], impacto: 4, probabilidade: 4, status: "Novo registro", responsaveis: ["Marcya Santos", "Naira Yurie", "Renato Mesquita", "Yuri Ribeiro"], impactoFinanceiro: 500000, dueDate: "2026-05-29", acoesMitigadoras: "Política de gestão do conhecimento; backup institucional; centralização de documentos críticos; versionamento; padronização de repositórios (ClickUp, SharePoint).", contingencia: "Recuperação de backup; reconstrução documental; mobilização das áreas para recomposição de informações." },
  { id: "R16", numero: 16, nome: "Registro de marca", bloco: "Estratégico", natureza: "Condição de incerteza", tipos: ["Reputacional", "Legal", "Financeiro"], impacto: 5, probabilidade: 3, status: "Mitigação em andamento", responsaveis: ["Naira Yurie", "Marcya Santos", "Ian"], dueDate: "2027-11-25", acoesMitigadoras: "Registrar marca junto ao INPI; transferência de demanda para Renata Camozzi; acompanhamento do processo." },
];

const BLOCO_META: Record<Bloco, { icon: any; cor: string; descricao: string }> = {
  Estrutural: {
    icon: Building2,
    cor: "bg-orange-500/10 text-orange-700 border-orange-500/30",
    descricao: "Questões fundamentais da operação: trabalhistas, fiscais, regulatórias e parcerias hospitalares.",
  },
  Estratégico: {
    icon: TrendingDown,
    cor: "bg-rose-500/10 text-rose-700 border-rose-500/30",
    descricao: "Dependência de receita, concentração de portfólio e ativos estratégicos (marca).",
  },
  Operacional: {
    icon: Cpu,
    cor: "bg-sky-500/10 text-sky-700 border-sky-500/30",
    descricao: "Proteção de dados (LGPD), continuidade operacional, segurança da informação e conhecimento.",
  },
};

const BRL = (n?: number) => (n ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—");

export default function RiscosEstrategicos() {
  const [filtroBloco, setFiltroBloco] = useState<"Todos" | Bloco>("Todos");
  const [filtroNivel, setFiltroNivel] = useState<"Todos" | "Extremo" | "Alto" | "Moderado" | "Baixo">("Todos");
  const [busca, setBusca] = useState("");

  const riscos = useMemo(() => {
    return RISCOS_SEED.filter((r) => {
      if (filtroBloco !== "Todos" && r.bloco !== filtroBloco) return false;
      const nivel = classifRiscoBPMO(r.impacto, r.probabilidade).nivel;
      if (filtroNivel !== "Todos" && nivel !== filtroNivel) return false;
      if (busca && !`${r.nome} ${r.tipos.join(" ")} ${r.responsaveis.join(" ")}`.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [filtroBloco, filtroNivel, busca]);

  const kpis = useMemo(() => {
    const total = RISCOS_SEED.length;
    const extremo = RISCOS_SEED.filter((r) => classifRiscoBPMO(r.impacto, r.probabilidade).nivel === "Extremo").length;
    const alto = RISCOS_SEED.filter((r) => classifRiscoBPMO(r.impacto, r.probabilidade).nivel === "Alto").length;
    const exposicao = RISCOS_SEED.reduce((s, r) => s + (r.impactoFinanceiro || 0), 0);
    const emMit = RISCOS_SEED.filter((r) => r.status.toLowerCase().includes("mitigação")).length;
    return { total, extremo, alto, exposicao, emMit };
  }, []);

  // matriz 5x5
  const matriz: Risco[][][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => [] as Risco[]));
  RISCOS_SEED.forEach((r) => {
    if (r.impacto >= 1 && r.impacto <= 5 && r.probabilidade >= 1 && r.probabilidade <= 5) {
      matriz[5 - r.impacto][r.probabilidade - 1].push(r);
    }
  });

  const exportar = () => {
    const rows = RISCOS_SEED.map((r) => {
      const c = classifRiscoBPMO(r.impacto, r.probabilidade);
      return {
        "#": r.numero,
        Risco: r.nome,
        Bloco: r.bloco,
        Natureza: r.natureza,
        Tipos: r.tipos.join(", "),
        Impacto: r.impacto,
        Probabilidade: r.probabilidade,
        Score: c.score,
        Classificação: c.nivel,
        Status: r.status,
        "Impacto Financeiro (R$)": r.impactoFinanceiro || "",
        Responsáveis: r.responsaveis.join(", "),
        "Ações Mitigadoras": r.acoesMitigadoras,
        Contingência: r.contingencia,
        "Data Prevista": r.dueDate || "",
      };
    });
    exportToXLSX(rows, "riscos-estrategicos-LM");
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 text-white border-0">
        <CardContent className="p-6 flex items-start gap-4">
          <ShieldAlert className="h-10 w-10 shrink-0" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider opacity-90">Governança & Jurídico</div>
            <h2 className="text-2xl font-bold leading-tight">Mapa de Riscos Estratégicos da Liberdade Médica</h2>
            <p className="text-sm opacity-95 mt-1 max-w-4xl">
              16 riscos mapeados em três blocos — <b>Estruturais, Estratégicos e Operacionais</b> — combinados representam exposição relevante que impacta caixa, operação e sustentabilidade. A gestão proativa desses riscos é essencial para sustentar o crescimento acelerado da LM.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={exportar} className="shrink-0">
            <Download className="h-4 w-4 mr-1.5" /> Exportar XLSX
          </Button>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Riscos mapeados" value={kpis.total} icon={ShieldAlert} tone="primary" />
        <KpiCard label="Extremos" value={kpis.extremo} icon={AlertTriangle} tone="rose" />
        <KpiCard label="Altos" value={kpis.alto} icon={AlertTriangle} tone="orange" />
        <KpiCard label="Em mitigação" value={kpis.emMit} icon={CheckCircle2} tone="emerald" />
        <KpiCard label="Exposição estimada" value={BRL(kpis.exposicao)} icon={Scale} tone="amber" small />
      </div>

      {/* Blocos */}
      <div className="grid md:grid-cols-3 gap-3">
        {(["Estrutural", "Estratégico", "Operacional"] as Bloco[]).map((b) => {
          const meta = BLOCO_META[b];
          const Icon = meta.icon;
          const lista = RISCOS_SEED.filter((r) => r.bloco === b);
          return (
            <Card key={b} className={`border ${meta.cor.split(" ").filter((x) => x.startsWith("border")).join(" ")}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <CardTitle className="text-base">Riscos {b}s</CardTitle>
                  <Badge variant="outline" className="ml-auto">{lista.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{meta.descricao}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {lista.map((r) => {
                    const c = classifRiscoBPMO(r.impacto, r.probabilidade);
                    return (
                      <li key={r.id} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground">{String(r.numero).padStart(2, "0")}</span>
                        <span className="flex-1 truncate">{r.nome}</span>
                        <Badge variant="outline" className={`text-[10px] ${c.color}`}>{c.nivel}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="matriz" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1.5 p-1.5 bg-primary/5 border border-primary/20 rounded-lg justify-start">
          <TabsTrigger value="matriz" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium px-3.5 py-1.5 text-xs">Matriz Impacto × Probabilidade</TabsTrigger>
          <TabsTrigger value="lista" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium px-3.5 py-1.5 text-xs">Lista Detalhada</TabsTrigger>
          <TabsTrigger value="planos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium px-3.5 py-1.5 text-xs">Planos de Mitigação</TabsTrigger>
          <TabsTrigger value="governanca" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium px-3.5 py-1.5 text-xs">Governança & Regras</TabsTrigger>
        </TabsList>

        {/* MATRIZ */}
        <TabsContent value="matriz" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Matriz 5×5 — Impacto × Probabilidade</CardTitle>
              <p className="text-xs text-muted-foreground">Escala: 1–3 Baixo · 4–6 Moderado · 8–12 Alto · 15–25 Extremo.</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="text-xs border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="w-32"></th>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <th key={p} className="text-center font-medium px-2 py-1 text-muted-foreground min-w-[110px]">P{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[5, 4, 3, 2, 1].map((imp, i) => (
                      <tr key={imp}>
                        <td className="text-right pr-2 font-medium text-muted-foreground">I{imp}</td>
                        {[1, 2, 3, 4, 5].map((prob, j) => {
                          const c = classifRiscoBPMO(imp, prob);
                          const items = matriz[i][j];
                          return (
                            <td key={j} className={`align-top p-1.5 rounded min-h-[70px] ${c.cell} bg-opacity-25`} style={{ minWidth: 110, minHeight: 70 }}>
                              <div className="text-[9px] font-bold opacity-70 mb-0.5">{c.score}</div>
                              <div className="flex flex-wrap gap-0.5">
                                {items.map((r) => (
                                  <span key={r.id} title={r.nome} className="bg-white/90 text-[10px] font-mono text-foreground px-1 rounded shadow-sm">
                                    R{r.numero}
                                  </span>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-3 text-[11px] flex-wrap">
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/40">Baixo (1-3)</Badge>
                <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/40">Moderado (4-6)</Badge>
                <Badge variant="outline" className="bg-orange-500/15 text-orange-700 border-orange-500/40">Alto (8-12)</Badge>
                <Badge variant="outline" className="bg-rose-500/15 text-rose-700 border-rose-500/40">Extremo (15-25)</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LISTA */}
        <TabsContent value="lista" className="mt-4 space-y-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Input placeholder="Buscar risco, tipo ou responsável…" value={busca} onChange={(e) => setBusca(e.target.value)} className="max-w-xs h-9" />
                <Select value={filtroBloco} onValueChange={(v) => setFiltroBloco(v as any)}>
                  <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Bloco" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os blocos</SelectItem>
                    <SelectItem value="Estrutural">Estrutural</SelectItem>
                    <SelectItem value="Estratégico">Estratégico</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroNivel} onValueChange={(v) => setFiltroNivel(v as any)}>
                  <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Nível" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os níveis</SelectItem>
                    <SelectItem value="Extremo">Extremo</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                  </SelectContent>
                </Select>
                <div className="ml-auto text-xs text-muted-foreground">{riscos.length} risco(s)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Bloco</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Tipos</TableHead>
                    <TableHead className="text-center">I</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Exposição</TableHead>
                    <TableHead>Responsáveis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riscos.map((r) => {
                    const c = classifRiscoBPMO(r.impacto, r.probabilidade);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                        <TableCell className="font-medium text-sm">{r.nome}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{r.bloco}</Badge></TableCell>
                        <TableCell className="text-xs">{r.natureza}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {r.tipos.map((t) => <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0">{t}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">{r.impacto}</TableCell>
                        <TableCell className="text-center font-mono text-xs">{r.probabilidade}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] ${c.color}`}>{c.score} · {c.nivel}</Badge></TableCell>
                        <TableCell className="text-xs">{r.status}</TableCell>
                        <TableCell className="text-xs font-mono">{BRL(r.impactoFinanceiro)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.responsaveis.join(", ")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* PLANOS */}
        <TabsContent value="planos" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Planos de Mitigação e Contingência</CardTitle>
              <p className="text-xs text-muted-foreground">Ações preventivas (mitigação) e o que fazer se o risco ocorrer (contingência). Priorize riscos Extremos e Altos.</p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {RISCOS_SEED.sort((a, b) => classifRiscoBPMO(b.impacto, b.probabilidade).score - classifRiscoBPMO(a.impacto, a.probabilidade).score).map((r) => {
                  const c = classifRiscoBPMO(r.impacto, r.probabilidade);
                  return (
                    <AccordionItem value={r.id} key={r.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 flex-1 text-left">
                          <span className="font-mono text-xs text-muted-foreground w-6">{r.numero}</span>
                          <Badge variant="outline" className={`text-[10px] ${c.color}`}>{c.nivel}</Badge>
                          <span className="font-medium text-sm">{r.nome}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto mr-3">{r.bloco}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 text-sm">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded">
                            <div className="text-[11px] font-semibold text-emerald-700 uppercase mb-1">Ações mitigadoras (prevenção)</div>
                            <p className="text-xs whitespace-pre-line text-foreground">{r.acoesMitigadoras}</p>
                          </div>
                          <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded">
                            <div className="text-[11px] font-semibold text-rose-700 uppercase mb-1">Plano de contingência</div>
                            <p className="text-xs whitespace-pre-line text-foreground">{r.contingencia || "A detalhar com dono do risco."}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                          <div><span className="text-muted-foreground">Responsáveis:</span> <span className="font-medium">{r.responsaveis.join(", ")}</span></div>
                          <div><span className="text-muted-foreground">Exposição:</span> <span className="font-mono font-medium">{BRL(r.impactoFinanceiro)}</span></div>
                          <div><span className="text-muted-foreground">Data prevista:</span> <span className="font-medium">{r.dueDate || "—"}</span></div>
                          <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{r.status}</span></div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOVERNANÇA */}
        <TabsContent value="governanca" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Regras de Classificação</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><b>Score = Impacto (1-5) × Probabilidade (1-5)</b>. A partir do score define-se o nível:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30"><b>Baixo · 1–3</b><br/>Aceitar / monitorar</div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30"><b>Moderado · 4–6</b><br/>Mitigar quando eficiente</div>
                <div className="p-2 rounded bg-orange-500/10 border border-orange-500/30"><b>Alto · 8–12</b><br/>Mitigação obrigatória</div>
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30"><b>Extremo · 15–25</b><br/>Ação imediata da diretoria</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Próximos passos (governança contínua)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ol className="list-decimal ml-5 space-y-1.5">
                <li><b>Donos de risco:</b> designação clara de responsáveis por cada um dos 16 riscos.</li>
                <li><b>Planos de mitigação:</b> detalhar ações preventivas e de contingência (colunas ao lado).</li>
                <li><b>Acompanhamento:</b> revisão trimestral das estimativas de exposição e status.</li>
                <li><b>Reporte executivo:</b> riscos Extremos e Altos entram no Status Report mensal.</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3">O mapa de riscos é um instrumento de gestão, não um diagnóstico jurídico. Ele orienta priorização e alocação de recursos para blindar o crescimento acelerado da LM.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone, small }: { label: string; value: any; icon: any; tone: "primary" | "rose" | "orange" | "emerald" | "amber"; small?: boolean }) {
  const tones: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    rose: "text-rose-700 bg-rose-500/10 border-rose-500/30",
    orange: "text-orange-700 bg-orange-500/10 border-orange-500/30",
    emerald: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30",
    amber: "text-amber-700 bg-amber-500/10 border-amber-500/30",
  };
  return (
    <Card className={`border ${tones[tone].split(" ").filter((x) => x.startsWith("border")).join(" ")}`}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={`font-bold ${small ? "text-sm" : "text-xl"} truncate`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
