import { Card } from "@/components/ui/card";
import { projetos, totaisPortfolio, okrs, objetivosBSC, waveColor } from "@/data/mockData";
import { BarChart3, FolderOpen, TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart as RLineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const fmtBRL = (n: number) => `R$ ${(n / 1_000_000).toFixed(2)}M`;

const kpis = [
  { label: "Total no Portfólio", value: totaisPortfolio.total, icon: FolderOpen, accent: "text-foreground" },
  { label: "Em Andamento", value: totaisPortfolio.ativos, icon: TrendingUp, accent: "text-success" },
  { label: "Budget Levantado", value: fmtBRL(totaisPortfolio.budgetTotal), icon: BarChart3, accent: "text-foreground" },
  { label: "BC Aprovado", value: `${totaisPortfolio.bcAprovadoPct}%`, icon: ShieldCheck, accent: "text-info" },
  { label: "Off-Track", value: totaisPortfolio.offTrack, icon: AlertTriangle, accent: "text-destructive" },
];

const statusByClass = [
  { classe: "Institucional", "Em Andamento": 14, Atrasado: 2, Backlog: 8, "A Iniciar": 5 },
  { classe: "Melhoria Contínua", "Em Andamento": 18, Atrasado: 1, Backlog: 22, "A Iniciar": 6 },
  { classe: "MC com EPP", "Em Andamento": 9, Atrasado: 1, Backlog: 14, "A Iniciar": 4 },
  { classe: "Novo Produto", "Em Andamento": 4, Atrasado: 0, Backlog: 28, "A Iniciar": 8 },
];

const distSemestre = [
  { sem: "2026/1", W1: 18, W2: 0, W3: 0 },
  { sem: "2026/2", W1: 22, W2: 4, W3: 0 },
  { sem: "2027/1", W1: 6, W2: 18, W3: 1 },
  { sem: "2027/2", W1: 2, W2: 24, W3: 6 },
];

const bcDist = [
  { name: "Em Revisão", value: 17, color: "hsl(var(--warning))" },
  { name: "BC em Construção", value: 9, color: "hsl(var(--info))" },
  { name: "Ativo EPP", value: 10, color: "hsl(var(--success))" },
  { name: "Concluído", value: 4, color: "hsl(var(--wave-2))" },
  { name: "Sem BC", value: 4, color: "hsl(var(--neutral))" },
  { name: "Sem Informação", value: 47, color: "hsl(var(--border))" },
];

const objCobertura = [
  { obj: "F.01", n: 46 }, { obj: "AC.03", n: 40 }, { obj: "P.01", n: 38 },
  { obj: "AC.01", n: 32 }, { obj: "F.02", n: 32 }, { obj: "C.01", n: 20 },
  { obj: "C.02", n: 15 }, { obj: "C.03", n: 15 },
];

const financeiro = projetos.filter(p => p.budget > 0).slice(0, 8).map(p => ({
  nome: p.id, planejado: p.budget, realizado: p.realizado,
}));

const roiByWave = [
  { ano: "2026", W1: 14.6, W2: 0, W3: 0 },
  { ano: "2027", W1: 24, W2: 8, W3: 0 },
  { ano: "2028", W1: 32, W2: 28, W3: 0 },
  { ano: "2029", W1: 40, W2: 52, W3: 18 },
  { ano: "2030", W1: 48, W2: 80, W3: 72 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 shadow-card hover:shadow-elevated transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{k.label}</div>
                <div className={`mt-2 text-3xl font-semibold tracking-tight ${k.accent}`}>{k.value}</div>
              </div>
              <k.icon className={`h-5 w-5 ${k.accent}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts grid 2x2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Status por Classificação</h3>
            <span className="text-xs text-muted-foreground">Quantidade</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusByClass} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="classe" type="category" tick={{ fontSize: 11 }} width={110} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Em Andamento" stackId="a" fill="hsl(var(--success))" />
              <Bar dataKey="A Iniciar" stackId="a" fill="hsl(var(--info))" />
              <Bar dataKey="Backlog" stackId="a" fill="hsl(var(--neutral))" />
              <Bar dataKey="Atrasado" stackId="a" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Distribuição por Wave e Semestre</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distSemestre}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="sem" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="W1" stackId="b" fill={waveColor.W1} />
              <Bar dataKey="W2" stackId="b" fill={waveColor.W2} />
              <Bar dataKey="W3" stackId="b" fill={waveColor.W3} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Maturidade de Business Case</h3>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={bcDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {bcDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
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

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Cobertura dos Objetivos Estratégicos</h3>
            <span className="text-xs text-muted-foreground">Top 8</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={objCobertura} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="obj" type="category" tick={{ fontSize: 11 }} width={50} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="n" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
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
            <div><span className="text-muted-foreground">Planejado</span> <span className="font-semibold text-foreground">R$ 1.666.005</span></div>
            <div><span className="text-muted-foreground">Realizado</span> <span className="font-semibold text-foreground">R$ 194.982</span></div>
            <div><span className="text-muted-foreground">Execução</span> <span className="font-semibold text-warning-foreground">11,7%</span></div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RLineChart data={financeiro}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="planejado" stroke="hsl(var(--neutral))" strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="realizado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
            </RLineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">ROI Projetado por Wave</h3>
            <span className="text-xs text-muted-foreground">R$ Milhões · 2026 → 2030</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roiByWave}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="ano" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}M`} />
              <Tooltip formatter={(v: number) => `R$ ${v}M`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="W1" stackId="r" fill={waveColor.W1} />
              <Bar dataKey="W2" stackId="r" fill={waveColor.W2} />
              <Bar dataKey="W3" stackId="r" fill={waveColor.W3} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
