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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ListChecks, ShieldAlert, Sword, Sparkles, Compass, Filter,
  Building2, Gavel, AlertTriangle, Target, Zap, TrendingUp,
  Link2, Pencil, Plus, X, Briefcase, Repeat, GitBranch, ExternalLink, Download,
} from "lucide-react";
import { projetos } from "@/data/mockData";
import { useProjetosDB } from "@/hooks/useProjetosDB";
import SubmissaoBacklogDialog from "@/components/SubmissaoBacklogDialog";
import PropostasIABacklog from "@/components/PropostasIABacklog";
import { exportToCSV } from "@/lib/exportCsv";

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

// ===== Catálogo de iniciativas vinculáveis =====
// Portfólio Estratégico (projetos institucionais e novos produtos)
const portfolioOpts: VinculoIniciativa[] = projetos
  .filter(p => p.classificacao === "Institucional" || p.classificacao === "Novo Produto")
  .map(p => ({
    fonte: "Portfólio Estratégico" as const,
    refId: p.id,
    titulo: p.nome,
    href: `/gestao/${p.id}`,
  }));

// Melhorias Estratégicas (Melhoria Contínua com EPP)
const melhoriasEstrategicasOpts: VinculoIniciativa[] = projetos
  .filter(p => p.classificacao === "Melhoria Contínua com EPP")
  .map(p => ({
    fonte: "Melhorias Estratégicas" as const,
    refId: p.id,
    titulo: p.nome,
    href: `/melhorias/${p.id}`,
  }));

// Melhoria Contínua (operacional, gerida pelas áreas)
const melhoriaContinuaOpts: VinculoIniciativa[] = projetos
  .filter(p => p.classificacao === "Melhoria Contínua")
  .map(p => ({
    fonte: "Melhoria Contínua" as const,
    refId: p.id,
    titulo: p.nome,
    href: `/melhoria-continua`,
  }));

const catalogoVinculos: VinculoIniciativa[] = [
  ...portfolioOpts,
  ...melhoriasEstrategicasOpts,
  ...melhoriaContinuaOpts,
];

const fonteMeta: Record<FonteIniciativa, { icon: any; cor: string }> = {
  "Portfólio Estratégico": { icon: Briefcase, cor: "bg-primary/10 text-primary border-primary/30" },
  "Melhorias Estratégicas": { icon: GitBranch, cor: "bg-info/10 text-info border-info/30" },
  "Melhoria Contínua": { icon: Repeat, cor: "bg-success/10 text-success border-success/30" },
};


// ===== Resumo por tipo =====
const resumoTipos: { tipo: Tipo; descricao: string }[] = [
  { tipo: "Potencializar Força", descricao: "Aprofundar vantagens já existentes (método LM, comunidade, marca técnica)." },
  { tipo: "Reforço de Fraqueza", descricao: "Corrigir gaps internos (dados, finanças, gente, processos)." },
  { tipo: "Explorar Oportunidade", descricao: "Capturar avenidas mapeadas no diagnóstico (IA, B2B, expansão)." },
  { tipo: "Defesa Identificada", descricao: "Mitigar riscos e ameaças competitivas/regulatórias." },
];

export default function BacklogEstrategico() {
  const { data: projetosDB } = useProjetosDB();
  const projetoMap = useMemo(() => {
    const m = new Map<string, { status: string; saude: string; termino: string }>();
    projetosDB.forEach(p => m.set(p.id, { status: p.status, saude: p.saude, termino: p.termino || "" }));
    // Fallback para o mock (caso o vínculo aponte para id que ainda não está no banco)
    projetos.forEach(p => { if (!m.has(p.id)) m.set(p.id, { status: p.status, saude: p.saude, termino: p.termino || "" }); });
    return m;
  }, [projetosDB]);

  const statusTone: Record<string, string> = {
    "Em Andamento": "bg-success/10 text-success border-success/30",
    "A Iniciar": "bg-info/10 text-info border-info/30",
    "Backlog": "bg-muted text-foreground border-border",
    "Pausado": "bg-warning/10 text-warning border-warning/30",
    "Concluído": "bg-primary/10 text-primary border-primary/30",
    "Cancelado": "bg-destructive/10 text-destructive border-destructive/30",
  };
  const saudeTone: Record<string, string> = {
    "On-Track": "text-success",
    "Alerta": "text-warning",
    "Off-Track": "text-destructive",
  };

  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<Tipo | "Todos">("Todos");
  const [origemFiltro, setOrigemFiltro] = useState<Origem | "Todas">("Todas");
  const [lista, setLista] = useState<Iniciativa[]>(iniciativas);

  // Edição (ação · resultado esperado · vínculos)
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ acao: string; resultadoEsperado: string; vinculos: VinculoIniciativa[] }>({
    acao: "", resultadoEsperado: "", vinculos: [],
  });

  function openEdit(i: Iniciativa) {
    setEditId(i.id);
    setDraft({
      acao: i.acao,
      resultadoEsperado: i.resultadoEsperado,
      vinculos: i.vinculos ?? [],
    });
  }
  function saveEdit() {
    if (!editId) return;
    setLista(prev => prev.map(it => it.id === editId ? { ...it, ...draft } : it));
    setEditId(null);
  }
  function toggleVinculo(v: VinculoIniciativa) {
    setDraft(d => {
      const exists = d.vinculos.some(x => x.refId === v.refId && x.fonte === v.fonte);
      return {
        ...d,
        vinculos: exists
          ? d.vinculos.filter(x => !(x.refId === v.refId && x.fonte === v.fonte))
          : [...d.vinculos, v],
      };
    });
  }

  const filtradas = useMemo(() => {
    const waveOrder: Record<Wave, number> = { W1: 0, W2: 1, W3: 2 };
    return lista
      .filter((i) => {
        const t = tipoFiltro === "Todos" || i.tipo === tipoFiltro;
        const o = origemFiltro === "Todas" || i.origem.includes(origemFiltro);
        const q = busca.trim().toLowerCase();
        const matchQ = !q || [i.titulo, i.acao, i.responsavel, i.vinculo].some(s => s.toLowerCase().includes(q));
        return t && o && matchQ;
      })
      .sort((a, b) => (waveOrder[a.wave] - waveOrder[b.wave]) || (b.ice - a.ice));
  }, [busca, tipoFiltro, origemFiltro, lista]);

  const counts = useMemo(() => {
    const c: Record<Tipo, number> = {
      "Reforço de Fraqueza": 0, "Defesa Identificada": 0, "Potencializar Força": 0, "Explorar Oportunidade": 0,
    };
    lista.forEach(i => c[i.tipo]++);
    return c;
  }, [lista]);

  const editing = lista.find(i => i.id === editId) ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/5 via-info/5 to-success/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
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
            <SubmissaoBacklogDialog />
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

      {/* Propostas IA pendentes */}
      <PropostasIABacklog />

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
          {(["W1", "W2", "W3"] as Wave[]).map(w => {
            const grupo = filtradas.filter(i => i.wave === w);
            if (!grupo.length) return null;
            const waveTone: Record<Wave, string> = {
              W1: "bg-success/10 text-success border-success/30",
              W2: "bg-info/10 text-info border-info/30",
              W3: "bg-muted text-foreground border-border",
            };
            const waveLabel: Record<Wave, string> = {
              W1: "Wave 1 · Estrutura mínima (remove risco sistêmico)",
              W2: "Wave 2 · Escala com controle (previsibilidade e repetição)",
              W3: "Wave 3 · Aceleração e diferenciação (vantagem competitiva)",
            };
            return (
              <div key={w} className="space-y-3">
                <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-background/95 backdrop-blur flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs font-semibold ${waveTone[w]}`}>{w}</Badge>
                  <span className="text-sm font-semibold">{waveLabel[w]}</span>
                  <span className="text-xs text-muted-foreground">· {grupo.length} iniciativa(s)</span>
                  <div className="flex-1 h-px bg-border ml-2" />
                </div>
                {grupo.map((i) => {
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
                    <Button size="sm" variant="outline" className="h-8" onClick={() => openEdit(i)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
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

                  {/* Vínculos com iniciativas existentes */}
                  <div className="mt-3 rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                        <Link2 className="h-3.5 w-3.5" /> Iniciativas vinculadas
                        <span className="text-muted-foreground font-normal">
                          (Portfólio · Melhorias Estratégicas · Melhoria Contínua)
                        </span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => openEdit(i)}>
                        <Plus className="h-3 w-3 mr-1" /> Vincular
                      </Button>
                    </div>
                    {i.vinculos && i.vinculos.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {i.vinculos.map((v) => {
                          const FIcon = fonteMeta[v.fonte].icon;
                          const meta = projetoMap.get(v.refId);
                          const inner = (
                            <div className="flex flex-wrap items-center gap-2 rounded-md border border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2 py-1.5 text-[11px]" title={`${v.fonte} · ${v.refId}`}>
                              <FIcon className="h-3 w-3 shrink-0" />
                              <span className="font-mono">{v.refId}</span>
                              <span className="truncate max-w-[260px] font-medium">{v.titulo}</span>
                              {meta ? (
                                <>
                                  <Badge variant="outline" className={`text-[10px] ml-auto ${statusTone[meta.status] || "bg-muted text-foreground border-border"}`}>
                                    {meta.status}
                                  </Badge>
                                  <span className={`text-[10px] font-semibold ${saudeTone[meta.saude] || "text-muted-foreground"}`}>
                                    ● {meta.saude}
                                  </span>
                                  {meta.termino && (
                                    <span className="text-[10px] text-muted-foreground">
                                      Término: <strong className="text-foreground">{meta.termino}</strong>
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] text-muted-foreground ml-auto italic">sem dados de execução</span>
                              )}
                              {v.href && <ExternalLink className="h-3 w-3 opacity-60" />}
                            </div>
                          );
                          return v.href ? (
                            <Link key={`${v.fonte}-${v.refId}`} to={v.href} className="hover:opacity-90">{inner}</Link>
                          ) : (
                            <div key={`${v.fonte}-${v.refId}`}>{inner}</div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Nenhuma iniciativa vinculada. Use <strong>Vincular</strong> para conectar projetos do portfólio, melhorias estratégicas ou ações de melhoria contínua que sustentam ou executam esta iniciativa.
                      </p>
                    )}
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
              </div>
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
                    <TableHead>Vínculos</TableHead>
                    <TableHead className="text-right">ICE</TableHead>
                    <TableHead className="w-12"></TableHead>
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
                      <TableCell>
                        {i.vinculos && i.vinculos.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {i.vinculos.map(v => {
                              const FIcon = fonteMeta[v.fonte].icon;
                              return (
                                <Badge key={`${v.fonte}-${v.refId}`} variant="outline" className={`text-[10px] ${fonteMeta[v.fonte].cor}`} title={`${v.fonte} · ${v.titulo}`}>
                                  <FIcon className="h-3 w-3 mr-1" />{v.refId}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{i.ice.toFixed(1)}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(i)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
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

      {/* Dialog: editar ação, resultado esperado e vínculos */}
      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Editar iniciativa {editing && <span className="font-mono text-xs text-muted-foreground">· {editing.id}</span>}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-5 pt-2">
              <div className="rounded-md bg-muted/40 border border-border p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Iniciativa</div>
                <div className="font-semibold text-sm">{editing.titulo}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{editing.vinculo} · {editing.tipo}</div>
              </div>

              <div>
                <Label className="text-xs">Ação</Label>
                <Textarea
                  value={draft.acao}
                  onChange={(e) => setDraft(d => ({ ...d, acao: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Resultado esperado</Label>
                <Textarea
                  value={draft.resultadoEsperado}
                  onChange={(e) => setDraft(d => ({ ...d, resultadoEsperado: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Vínculos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    Iniciativas vinculadas
                  </Label>
                  <span className="text-[11px] text-muted-foreground">{draft.vinculos.length} selecionada(s)</span>
                </div>

                {/* Selecionadas */}
                {draft.vinculos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {draft.vinculos.map(v => {
                      const FIcon = fonteMeta[v.fonte].icon;
                      return (
                        <Badge key={`sel-${v.fonte}-${v.refId}`} variant="outline" className={`text-[10px] ${fonteMeta[v.fonte].cor}`}>
                          <FIcon className="h-3 w-3 mr-1" />
                          <span className="font-mono mr-1">{v.refId}</span>
                          <span className="truncate max-w-[200px]">{v.titulo}</span>
                          <button
                            type="button"
                            className="ml-1.5 hover:text-destructive"
                            onClick={() => toggleVinculo(v)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Seletor por fonte */}
                <Tabs defaultValue="Portfólio Estratégico" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="Portfólio Estratégico" className="text-xs">
                      <Briefcase className="h-3 w-3 mr-1" /> Portfólio ({portfolioOpts.length})
                    </TabsTrigger>
                    <TabsTrigger value="Melhorias Estratégicas" className="text-xs">
                      <GitBranch className="h-3 w-3 mr-1" /> Melh. Estratégicas ({melhoriasEstrategicasOpts.length})
                    </TabsTrigger>
                    <TabsTrigger value="Melhoria Contínua" className="text-xs">
                      <Repeat className="h-3 w-3 mr-1" /> Melh. Contínua ({melhoriaContinuaOpts.length})
                    </TabsTrigger>
                  </TabsList>

                  {(["Portfólio Estratégico", "Melhorias Estratégicas", "Melhoria Contínua"] as FonteIniciativa[]).map(fonte => {
                    const opts = fonte === "Portfólio Estratégico" ? portfolioOpts
                      : fonte === "Melhorias Estratégicas" ? melhoriasEstrategicasOpts
                      : melhoriaContinuaOpts;
                    return (
                      <TabsContent key={fonte} value={fonte} className="mt-3">
                        <SeletorVinculos
                          opts={opts}
                          selecionadas={draft.vinculos}
                          onToggle={toggleVinculo}
                        />
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Seletor de vínculos com busca =====
function SeletorVinculos({
  opts, selecionadas, onToggle,
}: {
  opts: VinculoIniciativa[];
  selecionadas: VinculoIniciativa[];
  onToggle: (v: VinculoIniciativa) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const arr = !s ? opts : opts.filter(o =>
      o.titulo.toLowerCase().includes(s) || o.refId.toLowerCase().includes(s)
    );
    return arr.slice(0, 80);
  }, [opts, q]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar por nome ou ID…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="max-h-64 overflow-y-auto rounded-md border border-border divide-y divide-border">
        {filtered.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-6">Nada encontrado</div>
        )}
        {filtered.map(v => {
          const checked = selecionadas.some(s => s.refId === v.refId && s.fonte === v.fonte);
          return (
            <button
              key={`${v.fonte}-${v.refId}`}
              type="button"
              onClick={() => onToggle(v)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-start gap-2 ${checked ? "bg-primary/5" : ""}`}
            >
              <input type="checkbox" readOnly checked={checked} className="mt-0.5" />
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-muted-foreground">{v.refId}</div>
                <div className="text-foreground line-clamp-2">{v.titulo}</div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Mostrando {filtered.length} de {opts.length} iniciativas.
      </p>
    </div>
  );
}
