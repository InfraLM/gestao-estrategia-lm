import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { projetos, totaisPortfolio, okrs, waveColor, type Classificacao } from "@/data/mockData";
import { BarChart3, FolderOpen, TrendingUp, ShieldCheck, AlertTriangle, Calendar, Filter, X } from "lucide-react";
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
const statusByClassRaw: Record<Classificacao, { "Em Andamento": number; "A Iniciar": number; Backlog: number; Atrasado: number }> = {
  "Institucional": { "Em Andamento": 14, "A Iniciar": 5, Backlog: 8, Atrasado: 2 },
  "Melhoria Contínua": { "Em Andamento": 18, "A Iniciar": 6, Backlog: 22, Atrasado: 1 },
  "Melhoria Contínua com EPP": { "Em Andamento": 9, "A Iniciar": 4, Backlog: 14, Atrasado: 1 },
  "Novo Produto": { "Em Andamento": 4, "A Iniciar": 8, Backlog: 28, Atrasado: 0 },
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
  const [filterClasses, setFilterClasses] = useState<Classificacao[]>([]); // vazio = todas
  const isAll = filterClasses.length === 0;
  const activeClasses = isAll ? ALL_CLASSES : filterClasses;

  const toggleClass = (c: Classificacao) =>
    setFilterClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  // KPIs derivados do filtro
  const totalFiltered = useMemo(() => activeClasses.reduce((s, c) => s + portfolioByClass[c], 0), [activeClasses]);

  const ativosFiltered = useMemo(
    () => activeClasses.reduce((s, c) => s + statusByClassRaw[c]["Em Andamento"], 0),
    [activeClasses]
  );

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

  // Distribuição por wave/semestre — soma das classificações ativas
  const distSemestre = useMemo(() => {
    return ["2026/1", "2026/2", "2027/1", "2027/2"].map(sem => {
      const row = { sem, W1: 0, W2: 0, W3: 0 };
      activeClasses.forEach(c => {
        const r = distSemestreRaw[c].find(x => x.sem === sem)!;
        row.W1 += r.W1; row.W2 += r.W2; row.W3 += r.W3;
      });
      return row;
    });
  }, [activeClasses]);

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
          {!isAll && (
            <button onClick={() => setFilterClasses([])} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      </Card>

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
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Em Andamento</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-success">{ativosFiltered}</div>
            </div>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
        </Card>

        <Card className="p-5 shadow-card hover:shadow-elevated transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Budget Levantado</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">{fmtBRL(totaisPortfolio.budgetTotal)}</div>
            </div>
            <BarChart3 className="h-5 w-5 text-foreground" />
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
                <LabelList position="right" style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }}
                  formatter={(_v: any, _n: any, entry: any) => {
                    if (!entry?.payload) return "";
                    const p = entry.payload;
                    return p["Em Andamento"] + p["A Iniciar"] + p.Backlog + p.Atrasado;
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Distribuição por Wave e Semestre</h3>
            <span className="text-xs text-muted-foreground">Início previsto</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distSemestre} margin={{ top: 24 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="sem" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="W1" stackId="b" fill={waveColor.W1}>
                <LabelList dataKey="W1" position="center" style={{ fill: "white", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ""} />
              </Bar>
              <Bar dataKey="W2" stackId="b" fill={waveColor.W2}>
                <LabelList dataKey="W2" position="center" style={{ fill: "white", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ""} />
              </Bar>
              <Bar dataKey="W3" stackId="b" fill={waveColor.W3}>
                <LabelList position="top" style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }}
                  formatter={(_v: any, _n: any, entry: any) => {
                    if (!entry?.payload) return "";
                    const p = entry.payload;
                    return p.W1 + p.W2 + p.W3;
                  }}
                />
              </Bar>
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
      </div>

      {/* OKR coverage */}
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
                <div className="text-sm font-semibold">{okr.nome}</div>
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
                        <span className="font-medium">{kr.id} <span className="text-muted-foreground font-normal">— {kr.nome}</span></span>
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
