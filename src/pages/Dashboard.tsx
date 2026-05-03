import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BCBadge, ClassBadge, StatusBadge, WaveBadge } from "@/components/badges";
import { totaisPortfolio, okrs, waveColor, type Classificacao } from "@/data/mockData";
import { useProjetosDB } from "@/hooks/useProjetosDB";
import { BarChart3, FolderOpen, TrendingUp, ShieldCheck, AlertTriangle, Calendar, Filter, X, List, Info, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart as RLineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const fmtBRL = (n: number) => `R$ ${(n / 1_000_000).toFixed(2)}M`;

// Cores semânticas por classificação (alinhadas ao design system)
const CLASS_COLORS: Record<Classificacao, string> = {
  "Institucional": "hsl(var(--class-inst))",
  "Melhoria Contínua": "hsl(var(--class-mc))",
  "Melhoria Contínua com EPP": "hsl(var(--class-mcepp))",
  "Novo Produto": "hsl(var(--class-novo))",
};

const CLASS_SHORT: Record<Classificacao, string> = {
  "Institucional": "Institucional",
  "Melhoria Contínua": "Melhoria Contínua",
  "Melhoria Contínua com EPP": "MC com EPP",
  "Novo Produto": "Novo Produto",
};

const ALL_CLASSES: Classificacao[] = ["Institucional", "Melhoria Contínua", "Melhoria Contínua com EPP", "Novo Produto"];

// Breakdown total do portfólio (144) por classificação — proporcional realista
const portfolioByClass: Record<Classificacao, number> = {
  "Institucional": 29,
  "Melhoria Contínua": 47,
  "Melhoria Contínua com EPP": 28,
  "Novo Produto": 40,
};

// Visão 2026 — projetos por classificação previstos para o ano
const visao2026ByClass: Record<Classificacao, number> = {
  "Institucional": 12,
  "Melhoria Contínua": 18,
  "Melhoria Contínua com EPP": 9,
  "Novo Produto": 5,
};

// Status por classificação (para gráfico de barras empilhadas filtrável)
const statusByClassRaw: Record<Classificacao, { "Em Andamento": number; "A Iniciar": number; Backlog: number; Atrasado: number; Concluídos: number }> = {
  "Institucional": { "Em Andamento": 14, "A Iniciar": 5, Backlog: 4, Atrasado: 2, Concluídos: 4 },
  "Melhoria Contínua": { "Em Andamento": 18, "A Iniciar": 6, Backlog: 18, Atrasado: 1, Concluídos: 4 },
  "Melhoria Contínua com EPP": { "Em Andamento": 9, "A Iniciar": 4, Backlog: 11, Atrasado: 1, Concluídos: 3 },
  "Novo Produto": { "Em Andamento": 4, "A Iniciar": 8, Backlog: 26, Atrasado: 0, Concluídos: 2 },
};

// Budget por ano (R$)
const budgetByYear: { ano: string; valor: number }[] = [
  { ano: "2026", valor: 1_320_000 },
  { ano: "2027", valor: 1_080_000 },
  { ano: "2028", valor: 620_000 },
];

// ICE Quadrant — derive complexidade from budget bucket
const complexidadeFromBudget = (b: number) => {
  if (b >= 400_000) return 8.5;
  if (b >= 200_000) return 6.5;
  if (b >= 80_000) return 4.5;
  if (b > 0) return 3;
  return 2;
};

const distSemestreRaw: Record<Classificacao, { sem: string; W1: number; W2: number; W3: number }[]> = {
  "Institucional": [
    { sem: "2026/1", W1: 5, W2: 0, W3: 0 },
    { sem: "2026/2", W1: 6, W2: 1, W3: 0 },
    { sem: "2027/1", W1: 1, W2: 5, W3: 0 },
    { sem: "2027/2", W1: 0, W2: 8, W3: 3 },
  ],
  "Melhoria Contínua": [
    { sem: "2026/1", W1: 8, W2: 0, W3: 0 },
    { sem: "2026/2", W1: 10, W2: 1, W3: 0 },
    { sem: "2027/1", W1: 3, W2: 7, W3: 0 },
    { sem: "2027/2", W1: 1, W2: 9, W3: 1 },
  ],
  "Melhoria Contínua com EPP": [
    { sem: "2026/1", W1: 4, W2: 0, W3: 0 },
    { sem: "2026/2", W1: 5, W2: 1, W3: 0 },
    { sem: "2027/1", W1: 1, W2: 4, W3: 0 },
    { sem: "2027/2", W1: 1, W2: 5, W3: 1 },
  ],
  "Novo Produto": [
    { sem: "2026/1", W1: 1, W2: 0, W3: 0 },
    { sem: "2026/2", W1: 1, W2: 1, W3: 0 },
    { sem: "2027/1", W1: 1, W2: 2, W3: 1 },
    { sem: "2027/2", W1: 0, W2: 2, W3: 1 },
  ],
};

const bcByClass: Record<Classificacao, { name: string; value: number; color: string }[]> = {
  "Institucional":             [{ name: "Em Revisão", value: 14, color: "hsl(var(--warning))" }, { name: "BC em Construção", value: 12, color: "hsl(var(--info))" }, { name: "Ativo EPP", value: 28, color: "hsl(var(--success))" }, { name: "Concluído", value: 10, color: "hsl(var(--wave-2))" }, { name: "Sem BC", value: 6, color: "hsl(var(--neutral))" }, { name: "Sem Informação", value: 30, color: "hsl(var(--border))" }],
  "Melhoria Contínua":         [{ name: "Em Revisão", value: 22, color: "hsl(var(--warning))" }, { name: "BC em Construção", value: 8,  color: "hsl(var(--info))" }, { name: "Ativo EPP", value: 6,  color: "hsl(var(--success))" }, { name: "Concluído", value: 3, color: "hsl(var(--wave-2))" }, { name: "Sem BC", value: 5, color: "hsl(var(--neutral))" }, { name: "Sem Informação", value: 56, color: "hsl(var(--border))" }],
  "Melhoria Contínua com EPP": [{ name: "Em Revisão", value: 12, color: "hsl(var(--warning))" }, { name: "BC em Construção", value: 10, color: "hsl(var(--info))" }, { name: "Ativo EPP", value: 18, color: "hsl(var(--success))" }, { name: "Concluído", value: 4, color: "hsl(var(--wave-2))" }, { name: "Sem BC", value: 4, color: "hsl(var(--neutral))" }, { name: "Sem Informação", value: 52, color: "hsl(var(--border))" }],
  "Novo Produto":              [{ name: "Em Revisão", value: 18, color: "hsl(var(--warning))" }, { name: "BC em Construção", value: 6,  color: "hsl(var(--info))" }, { name: "Ativo EPP", value: 2,  color: "hsl(var(--success))" }, { name: "Concluído", value: 1, color: "hsl(var(--wave-2))" }, { name: "Sem BC", value: 3, color: "hsl(var(--neutral))" }, { name: "Sem Informação", value: 70, color: "hsl(var(--border))" }],
};

// Cruzamento Status BC × Andamento — heatmap/matriz
// Linhas = Status do BC; Colunas = Status de andamento
// Destaque: projetos JÁ INICIADOS (Em Andamento + Atrasado) sem BC finalizado (não Ativo EPP / Validado)
type AndamentoCol = "Em Andamento" | "Atrasado" | "A Iniciar" | "Backlog";
type BCRow = "Ativo EPP / Validado" | "BC em Construção" | "Em Revisão" | "Sem BC";

const bcVsAndamentoByClass: Record<Classificacao, Record<BCRow, Record<AndamentoCol, number>>> = {
  "Institucional": {
    "Ativo EPP / Validado":  { "Em Andamento": 11, "Atrasado": 1, "A Iniciar": 2, "Backlog": 1 },
    "BC em Construção":      { "Em Andamento": 2,  "Atrasado": 1, "A Iniciar": 3, "Backlog": 4 },
    "Em Revisão":            { "Em Andamento": 1,  "Atrasado": 0, "A Iniciar": 0, "Backlog": 2 },
    "Sem BC":                { "Em Andamento": 0,  "Atrasado": 0, "A Iniciar": 0, "Backlog": 1 },
  },
  "Melhoria Contínua": {
    "Ativo EPP / Validado":  { "Em Andamento": 5,  "Atrasado": 0, "A Iniciar": 1, "Backlog": 2 },
    "BC em Construção":      { "Em Andamento": 4,  "Atrasado": 0, "A Iniciar": 3, "Backlog": 8 },
    "Em Revisão":            { "Em Andamento": 8,  "Atrasado": 1, "A Iniciar": 1, "Backlog": 6 },
    "Sem BC":                { "Em Andamento": 1,  "Atrasado": 0, "A Iniciar": 1, "Backlog": 6 },
  },
  "Melhoria Contínua com EPP": {
    "Ativo EPP / Validado":  { "Em Andamento": 6,  "Atrasado": 0, "A Iniciar": 2, "Backlog": 3 },
    "BC em Construção":      { "Em Andamento": 1,  "Atrasado": 1, "A Iniciar": 1, "Backlog": 5 },
    "Em Revisão":            { "Em Andamento": 2,  "Atrasado": 0, "A Iniciar": 1, "Backlog": 4 },
    "Sem BC":                { "Em Andamento": 0,  "Atrasado": 0, "A Iniciar": 0, "Backlog": 2 },
  },
  "Novo Produto": {
    "Ativo EPP / Validado":  { "Em Andamento": 1,  "Atrasado": 0, "A Iniciar": 1, "Backlog": 2 },
    "BC em Construção":      { "Em Andamento": 1,  "Atrasado": 0, "A Iniciar": 4, "Backlog": 10 },
    "Em Revisão":            { "Em Andamento": 2,  "Atrasado": 0, "A Iniciar": 2, "Backlog": 12 },
    "Sem BC":                { "Em Andamento": 0,  "Atrasado": 0, "A Iniciar": 1, "Backlog": 4 },
  },
};
const BC_ROWS: BCRow[] = ["Ativo EPP / Validado", "BC em Construção", "Em Revisão", "Sem BC"];
const ANDAMENTO_COLS: AndamentoCol[] = ["Em Andamento", "Atrasado", "A Iniciar", "Backlog"];
// Linhas que indicam BC NÃO finalizado:
const BC_NAO_FINALIZADO: BCRow[] = ["BC em Construção", "Em Revisão", "Sem BC"];
// Colunas que indicam projeto JÁ iniciado:
const JA_INICIADO: AndamentoCol[] = ["Em Andamento", "Atrasado"];

const objCoberturaByClass: Record<Classificacao, { obj: string; n: number }[]> = {
  "Institucional":             [{ obj: "P.03", n: 22 }, { obj: "C.01", n: 18 }, { obj: "P.01", n: 16 }, { obj: "AC.03", n: 14 }, { obj: "F.01", n: 12 }, { obj: "C.02", n: 10 }, { obj: "F.02", n: 8 }, { obj: "C.03", n: 5 }],
  "Melhoria Contínua":         [{ obj: "F.01", n: 20 }, { obj: "F.02", n: 18 }, { obj: "AC.01", n: 16 }, { obj: "P.01", n: 14 }, { obj: "AC.03", n: 12 }, { obj: "P.02", n: 10 }, { obj: "C.02", n: 6 }, { obj: "C.03", n: 4 }],
  "Melhoria Contínua com EPP": [{ obj: "AC.03", n: 14 }, { obj: "F.01", n: 10 }, { obj: "AC.01", n: 9 }, { obj: "P.01", n: 8 }, { obj: "F.02", n: 6 }, { obj: "C.01", n: 5 }, { obj: "P.02", n: 4 }, { obj: "C.02", n: 2 }],
  "Novo Produto":              [{ obj: "AC.03", n: 12 }, { obj: "F.01", n: 8 }, { obj: "C.02", n: 7 }, { obj: "C.03", n: 6 }, { obj: "P.03", n: 5 }, { obj: "AC.01", n: 4 }, { obj: "P.01", n: 3 }, { obj: "F.02", n: 2 }],
};

const ROI_BASE = [
  { ano: "2026", W1: 14.6, W2: 0,  W3: 0 },
  { ano: "2027", W1: 24,   W2: 8,  W3: 0 },
  { ano: "2028", W1: 32,   W2: 28, W3: 0 },
  { ano: "2029", W1: 40,   W2: 52, W3: 18 },
  { ano: "2030", W1: 48,   W2: 80, W3: 72 },
];

// Tooltip estilizado reutilizável
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

export default function Dashboard() {
  const { data: projetos } = useProjetosDB();
  const [filterClasses, setFilterClasses] = useState<Classificacao[]>([]); // vazio = todas
  const [showList, setShowList] = useState(false);
  const isAll = filterClasses.length === 0;
  const activeClasses = isAll ? ALL_CLASSES : filterClasses;

  const toggleClass = (c: Classificacao) =>
    setFilterClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const projetosFiltrados = useMemo(
    () => projetos.filter(p => isAll || filterClasses.includes(p.classificacao)),
    [filterClasses, isAll]
  );

  // ===== Backend-powered list (search + sort + pagination) =====
  type SortKey = "codigo" | "nome" | "diretor" | "status" | "wave" | "ice" | "budget";
  const [bSearch, setBSearch] = useState("");
  const [bStatus, setBStatus] = useState<string>("all");
  const [bWave, setBWave] = useState<string>("all");
  const [bSort, setBSort] = useState<SortKey>("ice");
  const [bDir, setBDir] = useState<"asc" | "desc">("desc");
  const [bPage, setBPage] = useState(1);
  const [bPageSize, setBPageSize] = useState(20);
  const [bRows, setBRows] = useState<any[]>([]);
  const [bTotal, setBTotal] = useState(0);
  const [bLoading, setBLoading] = useState(false);

  useEffect(() => { setBPage(1); }, [bSearch, bStatus, bWave, bSort, bDir, bPageSize, filterClasses, showList]);

  useEffect(() => {
    if (!showList) return;
    let cancel = false;
    const run = async () => {
      setBLoading(true);
      let q = supabase.from("projetos").select("id,codigo,nome,diretor,classificacao,wave,status,status_bc,inicio,termino,budget,ice", { count: "exact" });
      if (!isAll) q = q.in("classificacao", filterClasses as any);
      if (bStatus !== "all") q = q.eq("status", bStatus as any);
      if (bWave !== "all") q = q.eq("wave", bWave as any);
      if (bSearch.trim()) {
        const s = bSearch.trim().replace(/[,()]/g, " ");
        q = q.or(`nome.ilike.%${s}%,codigo.ilike.%${s}%,diretor.ilike.%${s}%`);
      }
      q = q.order(bSort, { ascending: bDir === "asc" });
      const from = (bPage - 1) * bPageSize;
      q = q.range(from, from + bPageSize - 1);
      const { data, count, error } = await q;
      if (cancel) return;
      if (error) { setBRows([]); setBTotal(0); }
      else { setBRows(data ?? []); setBTotal(count ?? 0); }
      setBLoading(false);
    };
    run();
    return () => { cancel = true; };
  }, [showList, isAll, filterClasses, bStatus, bWave, bSearch, bSort, bDir, bPage, bPageSize]);

  const toggleSort = (k: SortKey) => {
    if (bSort === k) setBDir(d => d === "asc" ? "desc" : "asc");
    else { setBSort(k); setBDir("desc"); }
  };
  const totalPages = Math.max(1, Math.ceil(bTotal / bPageSize));

  // KPIs derivados do filtro
  const totalFiltered = useMemo(() => activeClasses.reduce((s, c) => s + portfolioByClass[c], 0), [activeClasses]);

  const ativosFiltered = useMemo(
    () => activeClasses.reduce((s, c) => s + statusByClassRaw[c]["Em Andamento"], 0),
    [activeClasses]
  );

  const aIniciarFiltered = useMemo(() => activeClasses.reduce((s, c) => s + statusByClassRaw[c]["A Iniciar"], 0), [activeClasses]);
  const backlogFiltered = useMemo(() => activeClasses.reduce((s, c) => s + statusByClassRaw[c].Backlog, 0), [activeClasses]);
  const concluidosFiltered = useMemo(() => activeClasses.reduce((s, c) => s + statusByClassRaw[c].Concluídos, 0), [activeClasses]);

  const offTrackFiltered = useMemo(
    () => activeClasses.reduce((s, c) => s + statusByClassRaw[c].Atrasado, 0),
    [activeClasses]
  );

  // Status por classificação
  const statusByClass = useMemo(
    () => activeClasses.map(c => ({ classe: CLASS_SHORT[c], ...statusByClassRaw[c] })),
    [activeClasses]
  );

  // Distribuição classificação (donut)
  const classDistData = useMemo(
    () => activeClasses.map(c => ({ name: CLASS_SHORT[c], full: c, value: portfolioByClass[c], color: CLASS_COLORS[c] })),
    [activeClasses]
  );

  // Filtro local do gráfico de waves por semestre
  const [waveChartClasses, setWaveChartClasses] = useState<Classificacao[]>([]);
  const waveChartActive = waveChartClasses.length === 0 ? activeClasses : waveChartClasses.filter(c => activeClasses.includes(c));
  const toggleWaveChartClass = (c: Classificacao) =>
    setWaveChartClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  // Distribuição real por wave/semestre a partir dos projetos do banco
  // Cada semestre tem uma barra empilhada (W1/W2/W3) para cada classificação ativa, lado a lado
  const SEMESTRES = ["2026/1", "2026/2", "2027/1", "2027/2"];
  const distSemestre = useMemo(() => {
    return SEMESTRES.map(sem => {
      const row: any = { sem };
      waveChartActive.forEach(c => {
        const inSemClass = projetos.filter(p => (p.inicio || "").trim() === sem && p.classificacao === c);
        (["W1", "W2", "W3"] as const).forEach(w => {
          const list = inSemClass.filter(p => p.wave === w);
          row[`${c}__${w}`] = list.length;
          row[`${c}__${w}_list`] = list.map(p => ({ id: p.id, nome: p.nome }));
        });
      });
      return row;
    });
  }, [projetos, waveChartActive]);

  // BC distribution — soma e converte em %
  const bcDist = useMemo(() => {
    const acc = new Map<string, { value: number; color: string }>();
    activeClasses.forEach(c => bcByClass[c].forEach(d => {
      const cur = acc.get(d.name);
      acc.set(d.name, { value: (cur?.value ?? 0) + d.value, color: d.color });
    }));
    const total = Array.from(acc.values()).reduce((s, x) => s + x.value, 0) || 1;
    return Array.from(acc.entries()).map(([name, x]) => ({ name, value: Math.round((x.value / total) * 100), color: x.color }));
  }, [activeClasses]);

  // Objetivos — agrega e Top 8
  const objCobertura = useMemo(() => {
    const acc = new Map<string, number>();
    activeClasses.forEach(c => objCoberturaByClass[c].forEach(d => acc.set(d.obj, (acc.get(d.obj) ?? 0) + d.n)));
    return Array.from(acc.entries()).map(([obj, n]) => ({ obj, n })).sort((a, b) => b.n - a.n).slice(0, 8);
  }, [activeClasses]);

  // Visão 2026
  const total2026 = useMemo(() => activeClasses.reduce((s, c) => s + visao2026ByClass[c], 0), [activeClasses]);
  const visao2026 = useMemo(() => activeClasses.map(c => ({
    classe: CLASS_SHORT[c], full: c, n: visao2026ByClass[c], color: CLASS_COLORS[c],
    pct: total2026 > 0 ? Math.round((visao2026ByClass[c] / total2026) * 100) : 0,
  })), [activeClasses, total2026]);

  const financeiro = useMemo(
    () => projetos
      .filter(p => p.budget > 0 && (isAll || filterClasses.includes(p.classificacao)))
      .slice(0, 8)
      .map(p => ({ nome: p.id, planejado: p.budget, realizado: p.realizado })),
    [filterClasses, isAll]
  );

  // Matriz BC × Andamento — soma das classificações ativas
  const bcAndamentoMatrix = useMemo(() => {
    const m: Record<BCRow, Record<AndamentoCol, number>> = {
      "Ativo EPP / Validado": { "Em Andamento": 0, "Atrasado": 0, "A Iniciar": 0, "Backlog": 0 },
      "BC em Construção":     { "Em Andamento": 0, "Atrasado": 0, "A Iniciar": 0, "Backlog": 0 },
      "Em Revisão":           { "Em Andamento": 0, "Atrasado": 0, "A Iniciar": 0, "Backlog": 0 },
      "Sem BC":               { "Em Andamento": 0, "Atrasado": 0, "A Iniciar": 0, "Backlog": 0 },
    };
    activeClasses.forEach(c => {
      BC_ROWS.forEach(r => ANDAMENTO_COLS.forEach(col => {
        m[r][col] += bcVsAndamentoByClass[c][r][col];
      }));
    });
    return m;
  }, [activeClasses]);

  const iniciadosSemBC = useMemo(() => {
    let total = 0;
    BC_NAO_FINALIZADO.forEach(r => JA_INICIADO.forEach(col => { total += bcAndamentoMatrix[r][col]; }));
    return total;
  }, [bcAndamentoMatrix]);

  const totalMatrix = useMemo(() => {
    let t = 0;
    BC_ROWS.forEach(r => ANDAMENTO_COLS.forEach(c => { t += bcAndamentoMatrix[r][c]; }));
    return t;
  }, [bcAndamentoMatrix]);

  // % BCs em aberto de projetos JÁ iniciados (sem BC finalizado / total iniciados)
  const bcAbertoPct = useMemo(() => {
    let iniciados = 0;
    BC_ROWS.forEach(r => JA_INICIADO.forEach(col => { iniciados += bcAndamentoMatrix[r][col]; }));
    if (iniciados === 0) return 0;
    return Math.round((iniciadosSemBC / iniciados) * 100);
  }, [bcAndamentoMatrix, iniciadosSemBC]);

  // ICE Quadrant — projetos plotados (Impacto = ICE × 1.1, Complexidade = derivada do budget)
  const iceProjects = useMemo(() => {
    return projetos
      .filter(p => isAll || filterClasses.includes(p.classificacao))
      .map(p => ({
        id: p.id,
        nome: p.nome,
        impacto: Math.min(10, p.ice),
        complexidade: complexidadeFromBudget(p.budget),
        classificacao: p.classificacao,
        color: CLASS_COLORS[p.classificacao],
      }));
  }, [filterClasses, isAll]);

  const iceQuadrants = useMemo(() => {
    const q = { quickWin: 0, bigBets: 0, fillIns: 0, evitar: 0 };
    iceProjects.forEach(p => {
      const altoImpacto = p.impacto >= 7;
      const altaComplex = p.complexidade >= 5;
      if (altoImpacto && !altaComplex) q.quickWin++;
      else if (altoImpacto && altaComplex) q.bigBets++;
      else if (!altoImpacto && !altaComplex) q.fillIns++;
      else q.evitar++;
    });
    return q;
  }, [iceProjects]);

  return (
    <div className="space-y-6">
      {/* Filtro por classificação */}
      <Card className="p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            <Filter className="h-3.5 w-3.5" /> Classificação
          </div>
          <button
            onClick={() => setFilterClasses([])}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
              isAll ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:border-foreground"
            )}
          >
            Todas
          </button>
          {ALL_CLASSES.map(c => {
            const active = filterClasses.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleClass(c)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-2",
                  active ? "text-background border-transparent shadow-sm" : "bg-background text-foreground border-border hover:border-foreground/40"
                )}
                style={active ? { background: CLASS_COLORS[c] } : { borderLeft: `3px solid ${CLASS_COLORS[c]}` }}
              >
                {CLASS_SHORT[c]}
                <span className={cn("tabular-nums text-[10px] px-1.5 py-0.5 rounded", active ? "bg-background/20" : "bg-muted")}>
                  {portfolioByClass[c]}
                </span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowList(true)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:border-foreground/40 flex items-center gap-1.5"
            >
              <List className="h-3.5 w-3.5" /> Ver lista ({projetosFiltrados.length})
            </button>
            {!isAll && (
              <button onClick={() => setFilterClasses([])} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Modal lista de projetos filtrados */}
      <Dialog open={showList} onOpenChange={setShowList}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              Projetos do portfólio
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {isAll ? "Todas as classificações" : filterClasses.join(", ")} · {bTotal} resultado(s){bLoading && " · carregando…"}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Toolbar: busca + filtros vindos do backend */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={bSearch} onChange={e => setBSearch(e.target.value)} placeholder="Buscar por nome, código ou diretor…" className="pl-9 h-9" />
            </div>
            <Select value={bStatus} onValueChange={setBStatus}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Todos os status</SelectItem>
                {["Backlog","A Iniciar","Em Andamento","Validação","Encerramento","Concluído","Pausado","Atrasado","Cancelado","Em Avaliação"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bWave} onValueChange={setBWave}>
              <SelectTrigger className="h-9 w-[120px]"><SelectValue placeholder="Wave" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Todas waves</SelectItem>
                {["W1","W2","W3"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={`${bSort}:${bDir}`} onValueChange={(v) => { const [k, d] = v.split(":"); setBSort(k as any); setBDir(d as any); }}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="ice:desc">ICE (maior)</SelectItem>
                <SelectItem value="ice:asc">ICE (menor)</SelectItem>
                <SelectItem value="budget:desc">Budget (maior)</SelectItem>
                <SelectItem value="budget:asc">Budget (menor)</SelectItem>
                <SelectItem value="nome:asc">Nome (A→Z)</SelectItem>
                <SelectItem value="nome:desc">Nome (Z→A)</SelectItem>
                <SelectItem value="codigo:asc">Código</SelectItem>
                <SelectItem value="diretor:asc">Diretor</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => { setBSearch(""); setBStatus("all"); setBWave("all"); setBSort("ice"); setBDir("desc"); }} className="gap-1">
              <X className="h-3.5 w-3.5" /> Limpar
            </Button>
          </div>

          <ScrollArea className="max-h-[55vh]">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
                <tr>
                  {([
                    ["codigo", "ID"],
                    ["nome", "Projeto"],
                    ["diretor", "Diretor"],
                    [null, "Classif."],
                    ["wave", "Wave"],
                    ["status", "Status"],
                    [null, "Status BC"],
                    [null, "Período"],
                    ["budget", "Budget"],
                    ["ice", "ICE"],
                  ] as Array<[SortKey | null, string]>).map(([k, h]) => (
                    <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap select-none">
                      {k ? (
                        <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
                          {h}
                          {bSort === k && (bDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </button>
                      ) : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bRows.map((p: any) => (
                  <tr key={p.id} className="border-t border-border hover:bg-surface-muted/50">
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{p.codigo}</td>
                    <td className="px-3 py-2 font-medium"><Link to={`/gestao/${p.codigo}`} className="hover:text-primary">{p.nome}</Link></td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{p.diretor}</td>
                    <td className="px-3 py-2"><ClassBadge value={p.classificacao} /></td>
                    <td className="px-3 py-2"><WaveBadge wave={p.wave} /></td>
                    <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-2"><BCBadge status={p.status_bc} /></td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">{p.inicio} → {p.termino}</td>
                    <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap">R$ {Number(p.budget).toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-2 text-xs font-semibold tabular-nums">{Number(p.ice).toFixed(1)}</td>
                  </tr>
                ))}
                {!bLoading && bRows.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-8 text-muted-foreground text-sm">Nenhum projeto encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </ScrollArea>

          {/* Paginação */}
          <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Itens por página:</span>
              <Select value={String(bPageSize)} onValueChange={(v) => setBPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {[10, 20, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span>Página {bPage} de {totalPages} · {bTotal} item(ns)</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={bPage <= 1} onClick={() => setBPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={bPage >= totalPages} onClick={() => setBPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total no Portfólio com breakdown */}
        <Card className="p-5 shadow-card hover:shadow-elevated transition-shadow lg:col-span-2">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Total no Portfólio {!isAll && <span className="text-primary normal-case">· filtrado</span>}
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{totalFiltered}</div>
              {!isAll && <div className="text-xs text-muted-foreground mt-0.5">de {totaisPortfolio.total} no portfólio</div>}
            </div>
            <FolderOpen className="h-5 w-5 text-foreground" />
          </div>
          {/* Breakdown por classificação */}
          <div className="space-y-1.5 pt-3 border-t border-border">
            {ALL_CLASSES.map(c => {
              const v = portfolioByClass[c];
              const pct = Math.round((v / totaisPortfolio.total) * 100);
              const dim = !isAll && !filterClasses.includes(c);
              return (
                <div key={c} className={cn("flex items-center gap-2 text-xs transition-opacity", dim && "opacity-30")}>
                  <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: CLASS_COLORS[c] }} />
                  <span className="text-muted-foreground flex-1 truncate">{CLASS_SHORT[c]}</span>
                  <span className="tabular-nums font-semibold">{v}</span>
                  <span className="tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Em Andamento</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-success">{ativosFiltered}</div>
            </div>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div className="space-y-1.5 pt-3 border-t border-border text-xs">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Backlog</span><span className="tabular-nums font-semibold">{backlogFiltered}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">A Iniciar</span><span className="tabular-nums font-semibold text-info">{aIniciarFiltered}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Em Andamento</span><span className="tabular-nums font-semibold text-success">{ativosFiltered}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Concluídos</span><span className="tabular-nums font-semibold">{concluidosFiltered}</span></div>
          </div>
        </Card>

        <Card className="p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Budget Levantado</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">{fmtBRL(totaisPortfolio.budgetTotal)}</div>
            </div>
            <BarChart3 className="h-5 w-5 text-foreground" />
          </div>
          <div className="space-y-1.5 pt-3 border-t border-border text-xs">
            {budgetByYear.map(b => {
              const pct = Math.round((b.valor / totaisPortfolio.budgetTotal) * 100);
              return (
                <div key={b.ano} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-10">{b.ano}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="tabular-nums font-semibold w-14 text-right">{fmtBRL(b.valor)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">BC Aprovado</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-info">{totaisPortfolio.bcAprovadoPct}%</div>
            </div>
            <ShieldCheck className="h-5 w-5 text-info" />
          </div>
          <div className="pt-3 mt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">BCs em aberto · iniciados</span>
              <span className={cn("tabular-nums font-semibold", bcAbertoPct > 30 ? "text-destructive" : bcAbertoPct > 15 ? "text-warning" : "text-success")}>{bcAbertoPct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full", bcAbertoPct > 30 ? "bg-destructive" : bcAbertoPct > 15 ? "bg-warning" : "bg-success")} style={{ width: `${bcAbertoPct}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">{iniciadosSemBC} projeto(s) iniciados sem BC finalizado</div>
          </div>
        </Card>
      </div>

      {/* Linha Visão 2026 */}
      <Card className="p-5 shadow-card bg-gradient-to-br from-background to-surface-muted/40 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 grid place-items-center text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Visão 2026</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-semibold tabular-nums">{total2026}</div>
                <div className="text-xs text-muted-foreground">projetos previstos</div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[280px]">
            {/* Barra empilhada horizontal */}
            <div className="flex h-3 rounded-full overflow-hidden border border-border">
              {visao2026.map(c => (
                <div key={c.full} className="h-full transition-all" style={{ width: `${c.pct}%`, background: c.color }} title={`${c.classe}: ${c.n}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
              {visao2026.map(c => (
                <div key={c.full} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.classe}</span>
                  <span className="font-semibold tabular-nums">{c.n}</span>
                  <span className="text-muted-foreground tabular-nums">({c.pct}%)</span>
                </div>
              ))}
            </div>
          </div>

          {offTrackFiltered > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs"><span className="font-semibold text-destructive tabular-nums">{offTrackFiltered}</span> <span className="text-muted-foreground">off-track no recorte</span></span>
            </div>
          )}
        </div>
      </Card>

      {/* Charts grid 2x2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Status por Classificação</h3>
            <span className="text-xs text-muted-foreground">Quantidade</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusByClass} layout="vertical" margin={{ left: 16, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="classe" type="category" tick={{ fontSize: 11 }} width={110} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Em Andamento" stackId="a" fill="hsl(var(--success))">
                <LabelList dataKey="Em Andamento" position="center" style={{ fill: "white", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 2 ? v : ""} />
              </Bar>
              <Bar dataKey="A Iniciar" stackId="a" fill="hsl(var(--info))">
                <LabelList dataKey="A Iniciar" position="center" style={{ fill: "white", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 2 ? v : ""} />
              </Bar>
              <Bar dataKey="Backlog" stackId="a" fill="hsl(var(--neutral))">
                <LabelList dataKey="Backlog" position="center" style={{ fill: "white", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 2 ? v : ""} />
              </Bar>
              <Bar dataKey="Atrasado" stackId="a" fill="hsl(var(--destructive))">
                <LabelList dataKey="Atrasado" position="center" style={{ fill: "white", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ""} />
              </Bar>
              <Bar dataKey="Concluídos" stackId="a" fill="hsl(var(--wave-2))">
                <LabelList position="right" style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }}
                  formatter={(_v: any, _n: any, entry: any) => {
                    if (!entry?.payload) return "";
                    const p = entry.payload;
                    return p["Em Andamento"] + p["A Iniciar"] + p.Backlog + p.Atrasado + p["Concluídos"];
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="font-semibold">Distribuição de Waves por Semestre</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  {waveChartClasses.length === 0 ? "Todas classificações" : `${waveChartClasses.length} selecionada(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2">
                <div className="text-xs font-medium px-2 py-1 text-muted-foreground">Filtrar por classificação</div>
                {ALL_CLASSES.map(c => (
                  <label key={c} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={waveChartClasses.includes(c)}
                      onChange={() => toggleWaveChartClass(c)}
                    />
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CLASS_COLORS[c] }} />
                    {CLASS_SHORT[c]}
                  </label>
                ))}
                {waveChartClasses.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full mt-1 h-7 text-xs" onClick={() => setWaveChartClasses([])}>
                    Limpar filtro
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distSemestre} margin={{ top: 24 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="sem" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                shared={false}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  const row = item?.payload;
                  const key = item?.dataKey as string | undefined;
                  if (!row || !key) return null;
                  const [classe, wave] = key.split("__") as [Classificacao, "W1" | "W2" | "W3"];
                  const list = (row[`${key}_list`] || []) as { id: string; nome: string }[];
                  if (!list.length) return null;
                  return (
                    <div className="rounded-md border bg-popover text-popover-foreground shadow-lg p-3 text-xs max-w-[360px]">
                      <div className="font-semibold mb-1">{label}</div>
                      <div className="flex items-center gap-1.5 mb-2 text-[11px]">
                        <span className="h-2 w-2 rounded-sm" style={{ background: CLASS_COLORS[classe] }} />
                        <span className="font-medium">{CLASS_SHORT[classe]}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="h-2 w-2 rounded-sm" style={{ background: waveColor[wave] }} />
                        <span className="font-medium">{wave}</span>
                        <span className="text-muted-foreground">· {list.length} projeto(s)</span>
                      </div>
                      <ul className="pl-3 list-disc text-muted-foreground max-h-56 overflow-auto space-y-0.5">
                        {list.map(p => (
                          <li key={p.id} className="leading-snug">
                            <span className="text-foreground/80">{p.id}</span> — {p.nome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                payload={(["W1", "W2", "W3"] as const).map(w => ({
                  value: w, type: "square", id: w, color: waveColor[w],
                }))}
              />
              {waveChartActive.flatMap(c => ([
                <Bar key={`${c}-W1`} dataKey={`${c}__W1`} stackId={c} fill={waveColor.W1} name={`${CLASS_SHORT[c]} · W1`}>
                  <LabelList dataKey={`${c}__W1`} position="center" style={{ fill: "white", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ""} />
                </Bar>,
                <Bar key={`${c}-W2`} dataKey={`${c}__W2`} stackId={c} fill={waveColor.W2} name={`${CLASS_SHORT[c]} · W2`}>
                  <LabelList dataKey={`${c}__W2`} position="center" style={{ fill: "white", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ""} />
                </Bar>,
                <Bar key={`${c}-W3`} dataKey={`${c}__W3`} stackId={c} fill={waveColor.W3} name={`${CLASS_SHORT[c]} · W3`} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey={`${c}__W3`} position="center" style={{ fill: "white", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ""} />
                  <LabelList
                    position="top"
                    content={(props: any) => {
                      const { x, y, width, index } = props;
                      const row = distSemestre[index];
                      if (!row) return null;
                      const total = (row[`${c}__W1`] || 0) + (row[`${c}__W2`] || 0) + (row[`${c}__W3`] || 0);
                      if (!total) return null;
                      const cx = x + width / 2;
                      const cy = y - 10;
                      const w = total >= 10 ? 24 : 18;
                      return (
                        <g>
                          <rect x={cx - w / 2} y={cy - 9} width={w} height={16} rx={8} fill={CLASS_COLORS[c]} opacity={0.95} />
                          <text x={cx} y={cy + 2} textAnchor="middle" fontSize={10} fontWeight={700} fill="white">{total}</text>
                        </g>
                      );
                    }}
                  />
                </Bar>,
              ]))}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* NOVO: Distribuição por Classificação (donut) */}
        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Distribuição por Classificação</h3>
            <span className="text-xs text-muted-foreground">Total: {totalFiltered}</span>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={240}>
              <PieChart>
                <Pie data={classDistData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}
                  label={({ value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    const RADIAN = Math.PI / 180;
                    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
                    const x = cx + r * Math.cos(-midAngle * RADIAN);
                    const y = cy + r * Math.sin(-midAngle * RADIAN);
                    return <text x={x} y={y} fill="white" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">{value}</text>;
                  }}
                  labelLine={false}
                >
                  {classDistData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _n: string, p: any) => [`${v} projetos (${Math.round((v / totalFiltered) * 100)}%)`, p.payload.full]} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 text-sm">
              {classDistData.map(d => {
                const pct = Math.round((d.value / totalFiltered) * 100);
                return (
                  <li key={d.full} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                      <span className="text-muted-foreground truncate">{d.name}</span>
                    </span>
                    <span className="flex items-center gap-2 tabular-nums">
                      <span className="font-semibold">{d.value}</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Maturidade de Business Case</h3>
            <span className="text-xs text-muted-foreground">% do recorte</span>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={bcDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}
                  label={({ value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    if (value < 6) return null;
                    const RADIAN = Math.PI / 180;
                    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
                    const x = cx + r * Math.cos(-midAngle * RADIAN);
                    const y = cy + r * Math.sin(-midAngle * RADIAN);
                    return <text x={x} y={y} fill="white" fontSize={10} fontWeight={700} textAnchor="middle" dominantBaseline="central">{value}%</text>;
                  }}
                  labelLine={false}
                >
                  {bcDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-1.5 text-sm">
              {bcDist.map(d => (
                <li key={d.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </span>
                  <span className="font-medium tabular-nums">{d.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-5 shadow-card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Cobertura dos Objetivos Estratégicos</h3>
            <span className="text-xs text-muted-foreground">Top 8 — iniciativas vinculadas</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={objCobertura} layout="vertical" margin={{ left: 8, right: 40 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="obj" type="category" tick={{ fontSize: 11 }} width={50} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
              <Bar dataKey="n" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="n" position="right" style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* NOVO: Status BC × Andamento — destaca projetos iniciados sem BC finalizado */}
        <Card className="p-5 shadow-card xl:col-span-2">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold">Status do BC × Andamento do Projeto</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Cruzamento de maturidade do Business Case com a execução. Destaque para projetos já iniciados sem BC finalizado.</p>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md border text-sm",
              iniciadosSemBC > 0 ? "bg-destructive/10 border-destructive/30" : "bg-success-soft border-success/30"
            )}>
              <AlertTriangle className={cn("h-4 w-4", iniciadosSemBC > 0 ? "text-destructive" : "text-success")} />
              <span className="text-xs">
                <span className={cn("font-bold tabular-nums text-base", iniciadosSemBC > 0 ? "text-destructive" : "text-success")}>{iniciadosSemBC}</span>
                <span className="text-muted-foreground ml-1.5">iniciados sem BC finalizado</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground p-2 border-b border-border w-[180px]">Status BC ↓ / Andamento →</th>
                  {ANDAMENTO_COLS.map(col => (
                    <th key={col} className={cn(
                      "text-center text-xs font-semibold uppercase tracking-wider p-2 border-b border-border",
                      JA_INICIADO.includes(col) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {col}
                      {JA_INICIADO.includes(col) && <div className="text-[9px] font-medium text-primary normal-case tracking-normal mt-0.5">já iniciado</div>}
                    </th>
                  ))}
                  <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground p-2 border-b border-border w-[60px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {BC_ROWS.map(row => {
                  const rowTotal = ANDAMENTO_COLS.reduce((s, c) => s + bcAndamentoMatrix[row][c], 0);
                  const isRowRisco = BC_NAO_FINALIZADO.includes(row);
                  return (
                    <tr key={row}>
                      <td className={cn(
                        "p-2 font-medium border-b border-border/50 text-sm",
                        isRowRisco ? "text-foreground" : "text-foreground"
                      )}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            row === "Ativo EPP / Validado" && "bg-success",
                            row === "BC em Construção" && "bg-info",
                            row === "Em Revisão" && "bg-warning",
                            row === "Sem BC" && "bg-neutral",
                          )} />
                          {row}
                        </div>
                      </td>
                      {ANDAMENTO_COLS.map(col => {
                        const v = bcAndamentoMatrix[row][col];
                        const risco = isRowRisco && JA_INICIADO.includes(col) && v > 0;
                        // Intensidade — heatmap baseado no max da célula
                        const max = 15;
                        const intensity = Math.min(1, v / max);
                        return (
                          <td key={col} className="p-1 border-b border-border/50">
                            <div
                              className={cn(
                                "h-12 rounded-md grid place-items-center text-sm font-semibold tabular-nums transition-all relative",
                                risco
                                  ? "bg-destructive/15 border border-destructive/40 text-destructive"
                                  : v === 0
                                  ? "bg-muted/40 text-muted-foreground"
                                  : "text-foreground"
                              )}
                              style={!risco && v > 0 ? {
                                background: `hsl(var(--primary) / ${0.08 + intensity * 0.32})`,
                                border: "1px solid hsl(var(--primary) / 0.2)",
                              } : undefined}
                              title={`${row} × ${col}: ${v} projeto(s)${risco ? " — RISCO: iniciado sem BC finalizado" : ""}`}
                            >
                              {v}
                              {risco && (
                                <span className="absolute top-0.5 right-0.5">
                                  <AlertTriangle className="h-3 w-3 text-destructive" />
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2 text-center font-bold tabular-nums border-b border-border/50">{rowTotal}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="p-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total</td>
                  {ANDAMENTO_COLS.map(col => {
                    const colTotal = BC_ROWS.reduce((s, r) => s + bcAndamentoMatrix[r][col], 0);
                    return <td key={col} className="p-2 text-center font-bold tabular-nums">{colTotal}</td>;
                  })}
                  <td className="p-2 text-center font-bold tabular-nums text-primary">{totalMatrix}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-destructive/20 border border-destructive/40" />
              Risco: já iniciado sem BC finalizado
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ background: "hsl(var(--primary) / 0.3)", border: "1px solid hsl(var(--primary) / 0.2)" }} />
              Volume normal — intensidade indica quantidade
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-muted/40" />
              Sem ocorrências
            </div>
          </div>
        </Card>

        {/* ICE Quadrant — Quick Wins */}
        <Card className="p-5 shadow-card xl:col-span-2">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold">Quadrante ICE — Impacto × Complexidade</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Projetos no quadrante <span className="font-semibold text-success">Quick Win</span> (alto impacto · baixa complexidade) devem ser priorizados.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-md bg-success/10 border border-success/30 text-success font-semibold tabular-nums">Quick Win: {iceQuadrants.quickWin}</span>
              <span className="px-2 py-1 rounded-md bg-info/10 border border-info/30 text-info font-semibold tabular-nums">Big Bets: {iceQuadrants.bigBets}</span>
              <span className="px-2 py-1 rounded-md bg-muted/60 border border-border text-muted-foreground font-semibold tabular-nums">Fill-Ins: {iceQuadrants.fillIns}</span>
              <span className="px-2 py-1 rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-semibold tabular-nums">Evitar: {iceQuadrants.evitar}</span>
            </div>
          </div>

          <div className="relative w-full" style={{ height: 380 }}>
            {/* Quadrants background */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px rounded-md overflow-hidden border border-border">
              <div className="bg-success/5 relative p-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-success">Quick Win</div>
                <div className="text-[10px] text-muted-foreground">Alto impacto · Baixa complexidade</div>
              </div>
              <div className="bg-info/5 relative p-2 text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-info">Big Bets</div>
                <div className="text-[10px] text-muted-foreground">Alto impacto · Alta complexidade</div>
              </div>
              <div className="bg-muted/30 relative p-2">
                <div className="absolute bottom-2 left-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fill-Ins</div>
                  <div className="text-[10px] text-muted-foreground">Baixo impacto · Baixa complexidade</div>
                </div>
              </div>
              <div className="bg-destructive/5 relative p-2 text-right">
                <div className="absolute bottom-2 right-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-destructive">Evitar</div>
                  <div className="text-[10px] text-muted-foreground">Baixo impacto · Alta complexidade</div>
                </div>
              </div>
            </div>

            {/* Axes labels */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Complexidade →</div>
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Impacto (ICE) →</div>

            {/* Plotted projects */}
            {iceProjects.map(p => {
              // x = complexidade (0..10), y = impacto (0..10)
              const xPct = Math.max(2, Math.min(98, (p.complexidade / 10) * 100));
              const yPct = Math.max(2, Math.min(98, 100 - (p.impacto / 10) * 100));
              const isQuickWin = p.impacto >= 7 && p.complexidade < 5;
              return (
                <div
                  key={p.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  title={`${p.id} · ${p.nome} — Impacto ${p.impacto.toFixed(1)} / Complexidade ${p.complexidade.toFixed(1)}`}
                >
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm transition-transform hover:scale-150 cursor-pointer",
                      isQuickWin && "ring-2 ring-success ring-offset-1 ring-offset-background"
                    )}
                    style={{ background: p.color }}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden group-hover:block z-10 px-2 py-1 rounded bg-foreground text-background text-[10px] whitespace-nowrap">
                    {p.id} · {p.nome}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-8 text-xs text-muted-foreground">
            {ALL_CLASSES.map(c => (
              <div key={c} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLASS_COLORS[c] }} />
                {CLASS_SHORT[c]}
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="h-3 w-3 rounded-full ring-2 ring-success ring-offset-1 ring-offset-background bg-muted" />
              Quick Win
            </div>
          </div>
        </Card>
      </div>
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Aderência aos OKRs 2026/1</h3>
          <span className="text-xs text-muted-foreground">Iniciativas vinculadas por KR</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {okrs.map(okr => (
            <div key={okr.id}>
              <div className="mb-3">
                <div className="text-xs font-semibold text-primary tracking-wide">{okr.id}</div>
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-semibold">{okr.nome}</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="h-5 w-5 grid place-items-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Saiba mais">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 text-xs leading-relaxed bg-popover">
                      <div className="font-semibold text-sm mb-1">{okr.id} · {okr.nome}</div>
                      <div className="text-muted-foreground mb-2">{okr.subtitulo}</div>
                      <p>{okr.descricao}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="text-xs text-muted-foreground">{okr.subtitulo}</div>
              </div>
              <ul className="space-y-2.5">
                {okr.krs.map(kr => {
                  const max = 12;
                  const w = Math.min(100, (kr.iniciativas / max) * 100);
                  const baixa = kr.iniciativas <= 2;
                  return (
                    <li key={kr.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium flex items-center gap-1">
                          {kr.id} <span className="text-muted-foreground font-normal">— {kr.nome}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="h-4 w-4 grid place-items-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Saiba mais">
                                <Info className="h-3 w-3" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 text-xs leading-relaxed bg-popover">
                              <div className="font-semibold text-sm mb-1">{kr.id} · {kr.nome}</div>
                              <p>{kr.descricao}</p>
                            </PopoverContent>
                          </Popover>
                        </span>
                        <span className={`tabular-nums font-semibold ${baixa ? "text-destructive" : "text-foreground"}`}>{kr.iniciativas}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${baixa ? "bg-destructive" : "bg-primary"}`} style={{ width: `${w}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Painel financeiro */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold">Custos Projetados vs. Realizados</h3>
          </div>
          <div className="flex gap-6 mb-4 text-xs">
            <div><span className="text-muted-foreground">Planejado</span> <span className="font-semibold text-foreground ml-1">R$ 1.666.005</span></div>
            <div><span className="text-muted-foreground">Realizado</span> <span className="font-semibold text-foreground ml-1">R$ 194.982</span></div>
            <div><span className="text-muted-foreground">Execução</span> <span className="font-semibold text-warning-foreground ml-1">11,7%</span></div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RLineChart data={financeiro} margin={{ top: 24, right: 16 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="planejado" stroke="hsl(var(--neutral))" strokeDasharray="5 5" dot={{ r: 3 }}>
                <LabelList dataKey="planejado" position="top" style={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} formatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              </Line>
              <Line type="monotone" dataKey="realizado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }}>
                <LabelList dataKey="realizado" position="bottom" style={{ fill: "hsl(var(--primary))", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => v > 0 ? `${(v / 1000).toFixed(0)}k` : ""} />
              </Line>
            </RLineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">ROI Projetado por Wave</h3>
            <span className="text-xs text-muted-foreground">R$ Milhões · 2026 → 2030</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ROI_BASE} margin={{ top: 24 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="ano" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}M`} />
              <Tooltip formatter={(v: number) => `R$ ${v}M`} contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="W1" stackId="r" fill={waveColor.W1}>
                <LabelList dataKey="W1" position="center" style={{ fill: "white", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ""} />
              </Bar>
              <Bar dataKey="W2" stackId="r" fill={waveColor.W2}>
                <LabelList dataKey="W2" position="center" style={{ fill: "white", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ""} />
              </Bar>
              <Bar dataKey="W3" stackId="r" fill={waveColor.W3} radius={[6, 6, 0, 0]}>
                <LabelList position="top" style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 700 }}
                  formatter={(_v: any, _n: any, entry: any) => {
                    if (!entry?.payload) return "";
                    const p = entry.payload;
                    return `${p.W1 + p.W2 + p.W3}M`;
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
