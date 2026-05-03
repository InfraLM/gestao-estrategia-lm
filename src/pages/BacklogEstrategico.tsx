import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  ListChecks, ShieldAlert, Sword, Sparkles, Compass, Filter,
  Building2, Gavel, AlertTriangle, Target, Zap, TrendingUp,
  Link2, Pencil, Plus, X, Briefcase, Repeat, GitBranch, ExternalLink,
} from "lucide-react";
import { projetos } from "@/data/mockData";

// ===== Tipagem =====
type Tipo = "Reforço de Fraqueza" | "Defesa Identificada" | "Potencializar Força" | "Explorar Oportunidade";
type Origem =
  | "Planejamento Estratégico"
  | "ExCom"
  | "CEA"
  | "CES"
  | "CPM"
  | "COT"
  | "MBR"
  | "Matriz de Riscos"
  | "Governança"
  | "Diagnóstico Estratégico";
type Wave = "W1" | "W2" | "W3";
type Status = "Backlog" | "Priorizado" | "Em Execução" | "Concluído";
type Prioridade = "Crítica" | "Alta" | "Média" | "Baixa";

type FonteIniciativa = "Portfólio Estratégico" | "Melhorias Estratégicas" | "Melhoria Contínua";

interface VinculoIniciativa {
  fonte: FonteIniciativa;
  refId: string;     // ID da iniciativa associada (ex.: P012, MC-002)
  titulo: string;    // título legível
  href?: string;     // rota de detalhe, se houver
}

interface Iniciativa {
  id: string;
  titulo: string;
  tipo: Tipo;
  origem: Origem[];
  perspectiva: "Financeira" | "Cliente" | "Processos" | "Aprendizagem";
  wave: Wave;
  prioridade: Prioridade;
  status: Status;
  responsavel: string;
  ice: number;
  vinculo: string; // KR/objetivo ligado
  acao: string;
  resultadoEsperado: string;
  vinculos?: VinculoIniciativa[];
}

// ===== Tokens visuais =====
const tipoMeta: Record<Tipo, { icon: any; cor: string; chip: string }> = {
  "Reforço de Fraqueza": { icon: ShieldAlert, cor: "border-l-warning bg-warning/5", chip: "bg-warning/10 text-warning border-warning/30" },
  "Defesa Identificada": { icon: Sword, cor: "border-l-destructive bg-destructive/5", chip: "bg-destructive/10 text-destructive border-destructive/30" },
  "Potencializar Força": { icon: Zap, cor: "border-l-success bg-success/5", chip: "bg-success/10 text-success border-success/30" },
  "Explorar Oportunidade": { icon: TrendingUp, cor: "border-l-info bg-info/5", chip: "bg-info/10 text-info border-info/30" },
};

const origemMeta: Record<Origem, { icon: any; cor: string; desc: string }> = {
  "Planejamento Estratégico": { icon: Compass, cor: "bg-primary/10 text-primary border-primary/30", desc: "Originado da Estratégia LM (BSC, Ansoff, Play to Win)" },
  "ExCom": { icon: Gavel, cor: "bg-primary/10 text-primary border-primary/30", desc: "Comitê Executivo" },
  "CEA": { icon: Gavel, cor: "bg-info/10 text-info border-info/30", desc: "Comitê de Estratégia & Alocação" },
  "CES": { icon: Gavel, cor: "bg-info/10 text-info border-info/30", desc: "Comitê de Educação e Saúde" },
  "CPM": { icon: Gavel, cor: "bg-info/10 text-info border-info/30", desc: "Comitê de Pessoas & Marca" },
  "COT": { icon: Gavel, cor: "bg-info/10 text-info border-info/30", desc: "Comitê Operacional & Tecnologia" },
  "MBR": { icon: Gavel, cor: "bg-info/10 text-info border-info/30", desc: "Monthly Business Review" },
  "Matriz de Riscos": { icon: AlertTriangle, cor: "bg-destructive/10 text-destructive border-destructive/30", desc: "Riscos institucionais mapeados" },
  "Governança": { icon: Building2, cor: "bg-muted text-foreground border-border", desc: "Conselho / governança institucional" },
  "Diagnóstico Estratégico": { icon: Compass, cor: "bg-primary/10 text-primary border-primary/30", desc: "PESTEL · Porter · SWOT · VRIN" },
};

const prioridadeMeta: Record<Prioridade, string> = {
  "Crítica": "bg-destructive text-destructive-foreground",
  "Alta": "bg-warning text-warning-foreground",
  "Média": "bg-info text-info-foreground",
  "Baixa": "bg-muted text-foreground",
};

const statusMeta: Record<Status, string> = {
  "Backlog": "bg-muted text-foreground border-border",
  "Priorizado": "bg-info/10 text-info border-info/30",
  "Em Execução": "bg-primary/10 text-primary border-primary/30",
  "Concluído": "bg-success/10 text-success border-success/30",
};

// ===== Dataset (síntese a partir do Diagnóstico + Estratégia) =====
const iniciativas: Iniciativa[] = [
  // FORÇAS
  {
    id: "BL-001", titulo: "Padronização do Método LM em todos os polos hospitalares",
    tipo: "Potencializar Força", origem: ["Planejamento Estratégico", "CES"], perspectiva: "Processos",
    wave: "W1", prioridade: "Crítica", status: "Em Execução", responsavel: "Dir. Acadêmica", ice: 9.2,
    vinculo: "P.02 · Excelência Operacional",
    acao: "Implantar playbook de prática supervisionada, métricas de qualidade clínica e auditoria periódica em 100% dos polos.",
    resultadoEsperado: "Consistência da entrega prática · NPS Hospital > 75 · Padrão auditável.",
  },
  {
    id: "BL-002", titulo: "Comunidade Longitudinal LM (Clube LM)",
    tipo: "Potencializar Força", origem: ["Planejamento Estratégico", "ExCom"], perspectiva: "Cliente",
    wave: "W2", prioridade: "Alta", status: "Priorizado", responsavel: "Dir. Comunidade", ice: 8.4,
    vinculo: "C.03 · LTV e Retenção",
    acao: "Estruturar trilha de carreira pós-curso, mentorias, eventos presenciais e plataforma de pertencimento.",
    resultadoEsperado: "NRR > 115% · Recompra ≥ 35% em 24 meses.",
  },
  // FRAQUEZAS
  {
    id: "BL-003", titulo: "Maturidade de Dados & BI institucional",
    tipo: "Reforço de Fraqueza", origem: ["Diagnóstico Estratégico", "COT", "MBR"], perspectiva: "Aprendizagem",
    wave: "W1", prioridade: "Crítica", status: "Em Execução", responsavel: "CTO", ice: 9.0,
    vinculo: "A.02 · Decisão Orientada por Dados",
    acao: "Implantar Data Lake, governança de KPIs, cockpit executivo e single source of truth para BSC.",
    resultadoEsperado: "Forecast DRE ±5% · 100% MBRs com dados auditados.",
  },
  {
    id: "BL-004", titulo: "Previsibilidade financeira e disciplina de OPEX",
    tipo: "Reforço de Fraqueza", origem: ["CEA", "MBR"], perspectiva: "Financeira",
    wave: "W1", prioridade: "Alta", status: "Priorizado", responsavel: "CFO", ice: 8.6,
    vinculo: "F.01 · Previsibilidade de Caixa",
    acao: "Rolling forecast trimestral, zero-based budgeting nas áreas de apoio e gates de aprovação por ICE.",
    resultadoEsperado: "OPEX ratio < 43% · DFC ±5% · Inadimplência ≤ 6%.",
  },
  {
    id: "BL-005", titulo: "Estrutura de Pessoas & Cultura para escala",
    tipo: "Reforço de Fraqueza", origem: ["CPM", "Governança"], perspectiva: "Aprendizagem",
    wave: "W2", prioridade: "Alta", status: "Backlog", responsavel: "Dir. Gente", ice: 7.8,
    vinculo: "A.01 · Cultura de Alta Performance",
    acao: "Modelo de competências, plano de sucessão para C-level e trilha de liderança para gerentes de polo.",
    resultadoEsperado: "eNPS > 70 · Turnover regretted < 8% · 100% sucessão crítica mapeada.",
  },
  // OPORTUNIDADES
  {
    id: "BL-006", titulo: "IA didática nativa para simulação clínica",
    tipo: "Explorar Oportunidade", origem: ["Diagnóstico Estratégico", "ExCom", "COT"], perspectiva: "Cliente",
    wave: "W2", prioridade: "Crítica", status: "Em Execução", responsavel: "CTO + Dir. Acadêmica", ice: 9.4,
    vinculo: "C.02 · Diferenciação por Produto",
    acao: "Construir motor de simulação clínica com IA generativa, integrado à trilha LM, com feedback estruturado.",
    resultadoEsperado: "Diferenciação defensável · Lift de conversão +20% · Marca técnica reforçada.",
  },
  {
    id: "BL-007", titulo: "Linha B2B Hospitalar (treinamento institucional)",
    tipo: "Explorar Oportunidade", origem: ["CEA", "Planejamento Estratégico"], perspectiva: "Financeira",
    wave: "W2", prioridade: "Alta", status: "Priorizado", responsavel: "Dir. Novos Negócios", ice: 8.2,
    vinculo: "F.02 · Crescimento com Rentabilidade",
    acao: "Empacotar oferta para hospitais (treinamento de equipes, certificações), com SLA e governança contratual.",
    resultadoEsperado: "Nova receita recorrente · 8 contratos âncora em 18 meses.",
  },
  {
    id: "BL-008", titulo: "Expansão geográfica disciplinada de polos",
    tipo: "Explorar Oportunidade", origem: ["Planejamento Estratégico", "ExCom"], perspectiva: "Cliente",
    wave: "W3", prioridade: "Média", status: "Backlog", responsavel: "Dir. Operações", ice: 7.5,
    vinculo: "C.04 · Cobertura Nacional",
    acao: "Modelo replicável de polo, due diligence hospitalar, ramp-up padronizado e governança regional.",
    resultadoEsperado: "+12 polos até 2028 com qualidade equivalente ao polo-mãe.",
  },
  // AMEAÇAS / DEFESAS
  {
    id: "BL-009", titulo: "Defesa contra substitutos com IA generalista",
    tipo: "Defesa Identificada", origem: ["Matriz de Riscos", "Diagnóstico Estratégico"], perspectiva: "Cliente",
    wave: "W1", prioridade: "Crítica", status: "Em Execução", responsavel: "CMO + Dir. Acadêmica", ice: 8.9,
    vinculo: "C.01 · Posicionamento Premium",
    acao: "Reforçar narrativa de prática hospitalar real e construir métricas públicas de segurança clínica como prova.",
    resultadoEsperado: "Brand lift +15% · Share of voice em 'prática real' · Resiliência a substitutos.",
  },
  {
    id: "BL-010", titulo: "Defesa contra grandes players de escala",
    tipo: "Defesa Identificada", origem: ["Matriz de Riscos", "ExCom", "CEA"], perspectiva: "Cliente",
    wave: "W1", prioridade: "Alta", status: "Priorizado", responsavel: "CEO", ice: 8.3,
    vinculo: "C.05 · Moat Hospitalar",
    acao: "Contratos de exclusividade hospitalar, lock-in de faculty referência e bloqueio de praças estratégicas.",
    resultadoEsperado: "≥ 60% das praças-alvo com contrato preferencial · Faculty top retido.",
  },
  {
    id: "BL-011", titulo: "Conformidade regulatória e LGPD em saúde",
    tipo: "Defesa Identificada", origem: ["Matriz de Riscos", "Governança", "COT"], perspectiva: "Processos",
    wave: "W1", prioridade: "Alta", status: "Em Execução", responsavel: "Jurídico + DPO", ice: 8.0,
    vinculo: "P.04 · Risco e Compliance",
    acao: "Programa de compliance integrado (LGPD, regulação CFM/MEC, contratos hospitalares) com auditoria anual.",
    resultadoEsperado: "Zero não-conformidades materiais · Risco regulatório classificado como baixo.",
  },
  {
    id: "BL-012", titulo: "Continuidade operacional dos polos críticos",
    tipo: "Defesa Identificada", origem: ["Matriz de Riscos", "COT"], perspectiva: "Processos",
    wave: "W2", prioridade: "Média", status: "Backlog", responsavel: "Dir. Operações", ice: 7.2,
    vinculo: "P.05 · Continuidade de Negócio",
    acao: "Plano de contingência por polo, faculty backup mapeado, hospital alternativo pré-acordado.",
    resultadoEsperado: "RTO < 7 dias por polo · Zero interrupção > 1 turma.",
  },
];

// ===== Resumo por tipo =====
const resumoTipos: { tipo: Tipo; descricao: string }[] = [
  { tipo: "Potencializar Força", descricao: "Aprofundar vantagens já existentes (método LM, comunidade, marca técnica)." },
  { tipo: "Reforço de Fraqueza", descricao: "Corrigir gaps internos (dados, finanças, gente, processos)." },
  { tipo: "Explorar Oportunidade", descricao: "Capturar avenidas mapeadas no diagnóstico (IA, B2B, expansão)." },
  { tipo: "Defesa Identificada", descricao: "Mitigar riscos e ameaças competitivas/regulatórias." },
];

export default function BacklogEstrategico() {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<Tipo | "Todos">("Todos");
  const [origemFiltro, setOrigemFiltro] = useState<Origem | "Todas">("Todas");

  const filtradas = useMemo(() => {
    return iniciativas.filter((i) => {
      const t = tipoFiltro === "Todos" || i.tipo === tipoFiltro;
      const o = origemFiltro === "Todas" || i.origem.includes(origemFiltro);
      const q = busca.trim().toLowerCase();
      const matchQ = !q || [i.titulo, i.acao, i.responsavel, i.vinculo].some(s => s.toLowerCase().includes(q));
      return t && o && matchQ;
    });
  }, [busca, tipoFiltro, origemFiltro]);

  const counts = useMemo(() => {
    const c: Record<Tipo, number> = {
      "Reforço de Fraqueza": 0, "Defesa Identificada": 0, "Potencializar Força": 0, "Explorar Oportunidade": 0,
    };
    iniciativas.forEach(i => c[i.tipo]++);
    return c;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/5 via-info/5 to-success/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Backlog Estratégico · Plano de Ação Institucional</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Iniciativas derivadas do <strong>Diagnóstico</strong> e da <strong>Estratégia LM</strong>, classificadas por movimento estratégico e rastreadas pela origem decisória.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {resumoTipos.map(({ tipo, descricao }) => {
              const Icon = tipoMeta[tipo].icon;
              return (
                <div key={tipo} className={`rounded-lg border-l-4 p-4 ${tipoMeta[tipo].cor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{tipo}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{counts[tipo]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{descricao}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Origens · legenda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Origem das Iniciativas · Rastreabilidade Decisória
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {(Object.keys(origemMeta) as Origem[]).map((o) => {
              const Icon = origemMeta[o].icon;
              return (
                <div key={o} className={`rounded-md border px-3 py-2 ${origemMeta[o].cor}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Icon className="h-3.5 w-3.5" /> {o}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{origemMeta[o].desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" /> Filtros
            </div>
            <Input
              placeholder="Buscar iniciativa, KR, responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="Todos">Todos os tipos</option>
              {(Object.keys(tipoMeta) as Tipo[]).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={origemFiltro}
              onChange={(e) => setOrigemFiltro(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="Todas">Todas as origens</option>
              {(Object.keys(origemMeta) as Origem[]).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <Badge variant="outline" className="ml-auto">{filtradas.length} iniciativas</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs · visões */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList>
          <TabsTrigger value="cards">Visão Cards</TabsTrigger>
          <TabsTrigger value="tabela">Visão Tabela</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-3 mt-4">
          {filtradas.map((i) => {
            const Icon = tipoMeta[i.tipo].icon;
            return (
              <Card key={i.id} className={`border-l-4 ${tipoMeta[i.tipo].cor}`}>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{i.id}</span>
                          <Badge variant="outline" className={`text-[10px] ${tipoMeta[i.tipo].chip}`}>{i.tipo}</Badge>
                          <Badge className={`text-[10px] ${prioridadeMeta[i.prioridade]}`}>{i.prioridade}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${statusMeta[i.status]}`}>{i.status}</Badge>
                          <Badge variant="outline" className="text-[10px]" title={`Wave ${i.wave}`}>{i.wave}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm mt-1.5">{i.titulo}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <Target className="h-3 w-3 inline mr-1" />
                          {i.vinculo} · Resp.: <strong>{i.responsavel}</strong> · ICE {i.ice.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-md bg-background/60 border border-border p-3">
                      <div className="font-semibold text-muted-foreground mb-1">Ação</div>
                      <p>{i.acao}</p>
                    </div>
                    <div className="rounded-md bg-background/60 border border-border p-3">
                      <div className="font-semibold text-muted-foreground mb-1">Resultado Esperado</div>
                      <p>{i.resultadoEsperado}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="text-[11px] text-muted-foreground mr-1">Origem:</span>
                    {i.origem.map((o) => {
                      const OIcon = origemMeta[o].icon;
                      return (
                        <Badge key={o} variant="outline" className={`text-[10px] ${origemMeta[o].cor}`} title={origemMeta[o].desc}>
                          <OIcon className="h-3 w-3 mr-1" /> {o}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtradas.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma iniciativa para os filtros selecionados.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="tabela" className="mt-4">
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Iniciativa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Wave</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">ICE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.id}</TableCell>
                      <TableCell className="max-w-sm">
                        <div className="font-medium text-sm">{i.titulo}</div>
                        <div className="text-xs text-muted-foreground">{i.vinculo}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${tipoMeta[i.tipo].chip}`}>{i.tipo}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {i.origem.map((o) => (
                            <Badge key={o} variant="outline" className={`text-[10px] ${origemMeta[o].cor}`} title={origemMeta[o].desc}>{o}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{i.wave}</Badge></TableCell>
                      <TableCell><Badge className={`text-[10px] ${prioridadeMeta[i.prioridade]}`}>{i.prioridade}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${statusMeta[i.status]}`}>{i.status}</Badge></TableCell>
                      <TableCell className="text-xs">{i.responsavel}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{i.ice.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Síntese */}
      <Card className="bg-gradient-to-br from-muted/40 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <strong className="text-foreground">Síntese:</strong>{" "}
              <span className="text-muted-foreground">
                O backlog estratégico converte os achados do <strong>Diagnóstico</strong> e os compromissos da <strong>Estratégia LM</strong> em iniciativas rastreáveis,
                conectando cada ação à sua <strong>origem decisória</strong> (planejamento, comitês ExCom/CEA/CES/CPM/COT/MBR, matriz de riscos e governança)
                e ao <strong>movimento estratégico</strong> que sustenta — força, fraqueza, oportunidade ou ameaça.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
