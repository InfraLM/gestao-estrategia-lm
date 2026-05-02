import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, GanttChart, ListChecks, ShieldAlert, GitBranch,
  DollarSign, Users, Clock, TrendingUp, AlertTriangle, CheckCircle2, Calendar,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart as RLineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { projetos, type Projeto } from "@/data/mockData";
import { SaudeBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

export default function GestaoProjeto() {
  const { id } = useParams<{ id: string }>();
  const projeto = useMemo(() => projetos.find(p => p.id === id), [id]);

  if (!projeto) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-warning-foreground mx-auto" />
        <div>
          <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
          <p className="text-sm text-muted-foreground mt-1">O ID "{id}" não corresponde a nenhum projeto do portfólio.</p>
        </div>
        <Link to="/gestao">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar para Gestão</Button>
        </Link>
      </div>
    );
  }

  const data = buildProjectData(projeto);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-4">
          <Link to="/gestao">
            <Button variant="outline" size="icon" className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
              <span>{projeto.id}</span>
              <span>·</span>
              <span>{projeto.wave}</span>
              <span>·</span>
              <span>{projeto.classificacao}</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mt-0.5">{projeto.nome}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <SaudeBadge saude={projeto.saude} />
              <Badge variant="outline" className="text-[10px]">BC: {projeto.statusBC}</Badge>
              <Badge variant="outline" className="text-[10px]">{projeto.status}</Badge>
              <Badge variant="outline" className="text-[10px]">Diretor: {projeto.diretor}</Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Período</div>
          <div className="text-sm font-medium mt-1 tabular-nums">{projeto.inicio} → {projeto.termino}</div>
        </div>
      </div>

      {/* Dashboard do projeto */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Custo: BC × Orçado × Realizado */}
        <Card className="p-5 shadow-card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Custo Projetado</h3>
              <p className="text-xs text-muted-foreground mt-0.5">BC × Orçado × Realizado por mês</p>
            </div>
            <div className="flex gap-4 text-xs">
              <Resumo label="BC" value={data.totais.bc} color="hsl(var(--neutral))" />
              <Resumo label="Orçado" value={data.totais.orcado} color="hsl(var(--info))" />
              <Resumo label="Realizado" value={data.totais.realizado} color="hsl(var(--primary))" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.custos} margin={{ top: 24, right: 16 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="bc" name="BC" fill="hsl(var(--neutral))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="realizado" position="top" style={{ fill: "hsl(var(--primary))", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => v > 0 ? `${(v / 1000).toFixed(0)}k` : ""} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Horas do time */}
        <Card className="p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-info" /> Horas do Time</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Dimensionadas por escopo e entregas</p>
          </div>
          <div className="space-y-3">
            {data.horasTime.map(h => {
              const pct = Math.min(100, (h.realizadas / h.dimensionadas) * 100);
              const over = h.realizadas > h.dimensionadas;
              return (
                <div key={h.papel}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{h.papel}</span>
                    <span className={cn("tabular-nums", over ? "text-destructive font-semibold" : "text-muted-foreground")}>
                      {h.realizadas}h / {h.dimensionadas}h
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full transition-all", over ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-info")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total dimensionado</span>
              <span className="tabular-nums font-semibold">{data.horasTime.reduce((s, h) => s + h.dimensionadas, 0)}h</span>
            </div>
          </div>
        </Card>

        {/* Cronograma: previsão × execução × extensão */}
        <Card className="p-5 shadow-card xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Cronograma</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Previsão · Execução · Extensão de prazo (em semanas)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Legenda label="Previsto" color="hsl(var(--neutral))" />
              <Legenda label="Executado" color="hsl(var(--success))" />
              <Legenda label="Extensão" color="hsl(var(--destructive))" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.cronograma} layout="vertical" margin={{ left: 16, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}sem`} />
              <YAxis dataKey="fase" type="category" tick={{ fontSize: 11 }} width={130} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v} sem`, n]} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
              <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--neutral))" stackId="x" />
              <Bar dataKey="executado" name="Executado" fill="hsl(var(--success))" stackId="y" />
              <Bar dataKey="extensao" name="Extensão" fill="hsl(var(--destructive))" stackId="y">
                <LabelList dataKey="extensao" position="right" style={{ fill: "hsl(var(--destructive))", fontSize: 10, fontWeight: 700 }} formatter={(v: number) => v > 0 ? `+${v}sem` : ""} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabs operacionais */}
      <Tabs defaultValue="cronograma">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          <TabsTrigger value="cronograma" className="gap-1.5"><GanttChart className="h-3.5 w-3.5" /> Cronograma</TabsTrigger>
          <TabsTrigger value="eap" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" /> EAP</TabsTrigger>
          <TabsTrigger value="riscos" className="gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Riscos</TabsTrigger>
          <TabsTrigger value="desvios" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Desvios</TabsTrigger>
          <TabsTrigger value="custos" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Custos</TabsTrigger>
          <TabsTrigger value="stakeholders" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Stakeholders</TabsTrigger>
        </TabsList>

        {/* CRONOGRAMA */}
        <TabsContent value="cronograma" className="mt-5">
          <Card className="p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Linha do tempo · Marcos e dependências</h3>
              <span className="text-xs text-muted-foreground">{data.cronograma.length} fases</span>
            </div>
            <div className="space-y-3">
              {data.cronograma.map((f, i) => {
                const total = f.previsto + f.extensao;
                const execPct = (f.executado / total) * 100;
                return (
                  <div key={f.fase}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium flex items-center gap-2">
                        <span className="text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        {f.fase}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {f.executado}/{f.previsto} sem {f.extensao > 0 && <span className="text-destructive font-semibold">+{f.extensao}</span>}
                      </span>
                    </div>
                    <div className="h-5 rounded-md bg-muted/40 relative overflow-hidden border border-border">
                      <div className="absolute inset-y-0 bg-neutral/60" style={{ width: `${(f.previsto / total) * 100}%` }} />
                      <div className="absolute inset-y-0 bg-success/80" style={{ width: `${execPct}%` }} />
                      {f.extensao > 0 && (
                        <div className="absolute inset-y-0 bg-destructive/70" style={{ left: `${(f.previsto / total) * 100}%`, width: `${(f.extensao / total) * 100}%` }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* EAP */}
        <TabsContent value="eap" className="mt-5">
          <Card className="p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Estrutura Analítica do Projeto (EAP)</h3>
              <span className="text-xs text-muted-foreground">Pacotes de trabalho · entregas</span>
            </div>
            <div className="space-y-2">
              {data.eap.map(pacote => (
                <div key={pacote.id} className="border border-border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between bg-surface-muted/40 px-3 py-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-xs tabular-nums font-mono text-muted-foreground">{pacote.id}</span>
                      <span className="font-semibold">{pacote.titulo}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground tabular-nums">{pacote.entregas.filter(e => e.feito).length}/{pacote.entregas.length} entregas</span>
                      <div className="w-24 h-1.5 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(pacote.entregas.filter(e => e.feito).length / pacote.entregas.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <ul className="divide-y divide-border">
                    {pacote.entregas.map(e => (
                      <li key={e.id} className="px-3 py-2 flex items-center gap-3 text-sm">
                        <CheckCircle2 className={cn("h-4 w-4 shrink-0", e.feito ? "text-success" : "text-muted-foreground/40")} />
                        <span className="text-xs tabular-nums font-mono text-muted-foreground w-16">{e.id}</span>
                        <span className={cn("flex-1", e.feito && "text-muted-foreground line-through")}>{e.titulo}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{e.horas}h</span>
                        <Badge variant="outline" className="text-[10px]">{e.responsavel}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* MATRIZ DE RISCOS */}
        <TabsContent value="riscos" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="p-5 shadow-card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Registro de Riscos</h3>
                <span className="text-xs text-muted-foreground">{data.riscos.length} riscos identificados</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="text-left px-2 py-2 font-semibold">Risco</th>
                      <th className="text-center px-2 py-2 font-semibold">Prob.</th>
                      <th className="text-center px-2 py-2 font-semibold">Impacto</th>
                      <th className="text-center px-2 py-2 font-semibold">Score</th>
                      <th className="text-left px-2 py-2 font-semibold">Mitigação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.riscos.map(r => {
                      const score = r.prob * r.impacto;
                      const tier = score >= 12 ? "alto" : score >= 6 ? "medio" : "baixo";
                      return (
                        <tr key={r.id} className="border-b border-border/50">
                          <td className="px-2 py-2.5">
                            <div className="font-medium">{r.titulo}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{r.categoria}</div>
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums">{r.prob}</td>
                          <td className="px-2 py-2 text-center tabular-nums">{r.impacto}</td>
                          <td className="px-2 py-2 text-center">
                            <Badge className={cn(
                              "tabular-nums font-semibold",
                              tier === "alto" && "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15",
                              tier === "medio" && "bg-warning/20 text-warning-foreground border-warning/40 hover:bg-warning/20",
                              tier === "baixo" && "bg-success-soft text-success border-success/30 hover:bg-success-soft",
                            )}>{score}</Badge>
                          </td>
                          <td className="px-2 py-2.5 text-xs text-muted-foreground">{r.mitigacao}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5 shadow-card">
              <h3 className="font-semibold mb-4">Matriz P × I</h3>
              <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1 text-[10px]">
                <div />
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="text-center text-muted-foreground font-semibold">{i}</div>)}
                {[5, 4, 3, 2, 1].map(p => (
                  <>
                    <div key={`p${p}`} className="text-right text-muted-foreground font-semibold pr-1 self-center">{p}</div>
                    {[1, 2, 3, 4, 5].map(i => {
                      const score = p * i;
                      const tier = score >= 12 ? "alto" : score >= 6 ? "medio" : "baixo";
                      const count = data.riscos.filter(r => r.prob === p && r.impacto === i).length;
                      return (
                        <div
                          key={`${p}-${i}`}
                          className={cn(
                            "aspect-square rounded grid place-items-center text-xs font-bold border",
                            tier === "alto" && "bg-destructive/20 border-destructive/30 text-destructive",
                            tier === "medio" && "bg-warning/20 border-warning/40 text-warning-foreground",
                            tier === "baixo" && "bg-success-soft border-success/30 text-success",
                          )}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
              <div className="mt-4 text-[10px] text-muted-foreground flex items-center gap-3">
                <span className="text-right pr-1">P</span>
                <div className="flex-1">I →</div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* DESVIOS CRÍTICOS */}
        <TabsContent value="desvios" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {data.desvios.map(d => (
              <Card key={d.dimensao} className="p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full",
                      d.farol === "verde" && "bg-success",
                      d.farol === "amarelo" && "bg-warning",
                      d.farol === "vermelho" && "bg-destructive",
                    )} />
                    {d.dimensao}
                  </h3>
                  <Badge variant="outline" className="tabular-nums">{d.deltaLabel}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{d.descricao}</p>
                <div className="space-y-2">
                  {d.solicitacoes.map((s, i) => (
                    <div key={i} className="border border-border rounded-md p-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{s.titulo}</span>
                        <Badge className={cn(
                          "text-[10px]",
                          s.status === "Aprovada" && "bg-success-soft text-success border-success/30",
                          s.status === "Em análise" && "bg-info/15 text-info border-info/30",
                          (s.status as string) === "Rejeitada" && "bg-destructive/15 text-destructive border-destructive/30",
                        )}>{s.status}</Badge>
                      </div>
                      <p className="text-muted-foreground">{s.justificativa}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* MATRIZ DE CUSTOS */}
        <TabsContent value="custos" className="mt-5">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card className="p-5 shadow-card xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Matriz de Custos por Categoria</h3>
                <span className="text-xs text-muted-foreground">BC × Orçado × Realizado</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="text-left px-2 py-2 font-semibold">Categoria</th>
                      <th className="text-right px-2 py-2 font-semibold">BC</th>
                      <th className="text-right px-2 py-2 font-semibold">Orçado</th>
                      <th className="text-right px-2 py-2 font-semibold">Realizado</th>
                      <th className="text-right px-2 py-2 font-semibold">Δ vs BC</th>
                      <th className="text-center px-2 py-2 font-semibold w-32">Execução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.matrizCustos.map(c => {
                      const delta = c.realizado - c.bc;
                      const exec = c.orcado > 0 ? (c.realizado / c.orcado) * 100 : 0;
                      return (
                        <tr key={c.categoria} className="border-b border-border/50">
                          <td className="px-2 py-2.5 font-medium">{c.categoria}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">R$ {c.bc.toLocaleString("pt-BR")}</td>
                          <td className="px-2 py-2 text-right tabular-nums">R$ {c.orcado.toLocaleString("pt-BR")}</td>
                          <td className="px-2 py-2 text-right tabular-nums font-semibold">R$ {c.realizado.toLocaleString("pt-BR")}</td>
                          <td className={cn("px-2 py-2 text-right tabular-nums font-semibold", delta > 0 ? "text-destructive" : "text-success")}>
                            {delta > 0 ? "+" : ""}{((delta / Math.max(1, c.bc)) * 100).toFixed(1)}%
                          </td>
                          <td className="px-2 py-2">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className={cn("h-full", exec > 100 ? "bg-destructive" : exec > 80 ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(100, exec)}%` }} />
                            </div>
                            <div className="text-[10px] text-muted-foreground tabular-nums text-center mt-0.5">{exec.toFixed(0)}%</div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-surface-muted/40">
                      <td className="px-2 py-2.5 font-bold">Total</td>
                      <td className="px-2 py-2 text-right tabular-nums font-bold">R$ {data.totais.bc.toLocaleString("pt-BR")}</td>
                      <td className="px-2 py-2 text-right tabular-nums font-bold">R$ {data.totais.orcado.toLocaleString("pt-BR")}</td>
                      <td className="px-2 py-2 text-right tabular-nums font-bold">R$ {data.totais.realizado.toLocaleString("pt-BR")}</td>
                      <td className="px-2 py-2 text-right" />
                      <td className="px-2 py-2 text-right" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5 shadow-card">
              <h3 className="font-semibold mb-4">Burn-rate acumulado</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RLineChart data={data.burnRate} margin={{ top: 16, right: 16 }}>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="planejado" name="Planejado" stroke="hsl(var(--neutral))" strokeDasharray="5 5" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="realizado" name="Realizado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 2 }} />
                </RLineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* MATRIZ DE STAKEHOLDERS */}
        <TabsContent value="stakeholders" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="p-5 shadow-card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Stakeholders · Influência × Interesse</h3>
                <span className="text-xs text-muted-foreground">{data.stakeholders.length} pessoas</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="text-left px-2 py-2 font-semibold">Stakeholder</th>
                      <th className="text-left px-2 py-2 font-semibold">Papel</th>
                      <th className="text-center px-2 py-2 font-semibold">Influência</th>
                      <th className="text-center px-2 py-2 font-semibold">Interesse</th>
                      <th className="text-left px-2 py-2 font-semibold">Estratégia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stakeholders.map(s => (
                      <tr key={s.nome} className="border-b border-border/50">
                        <td className="px-2 py-2.5 font-medium">{s.nome}</td>
                        <td className="px-2 py-2 text-muted-foreground text-xs">{s.papel}</td>
                        <td className="px-2 py-2 text-center"><Bolinhas n={s.influencia} /></td>
                        <td className="px-2 py-2 text-center"><Bolinhas n={s.interesse} /></td>
                        <td className="px-2 py-2 text-xs">
                          <Badge variant="outline" className="text-[10px]">{s.estrategia}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5 shadow-card">
              <h3 className="font-semibold mb-4">Quadrante</h3>
              <div className="relative aspect-square border border-border rounded-md bg-surface-muted/30">
                {/* Eixos */}
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-border" />
                {/* Labels quadrantes */}
                <div className="absolute top-1 left-1 text-[9px] text-muted-foreground font-semibold">Manter satisfeito</div>
                <div className="absolute top-1 right-1 text-[9px] text-primary font-semibold">Gerenciar de perto</div>
                <div className="absolute bottom-1 left-1 text-[9px] text-muted-foreground font-semibold">Monitorar</div>
                <div className="absolute bottom-1 right-1 text-[9px] text-muted-foreground font-semibold">Manter informado</div>
                {/* Pontos */}
                {data.stakeholders.map((s, i) => {
                  const x = (s.interesse / 5) * 100;
                  const y = 100 - (s.influencia / 5) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute h-6 w-6 rounded-full bg-primary/80 text-primary-foreground text-[9px] font-bold grid place-items-center -translate-x-1/2 -translate-y-1/2 border-2 border-background shadow-sm"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      title={`${s.nome} · Inf: ${s.influencia} · Int: ${s.interesse}`}
                    >
                      {s.nome.split(" ").map(p => p[0]).slice(0, 2).join("")}
                    </div>
                  );
                })}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">Interesse →</div>
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground origin-center">Influência →</div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Helpers visuais
// ============================================================
function Resumo({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">R$ {(value / 1000).toFixed(0)}k</span>
    </div>
  );
}

function Legenda({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function Bolinhas({ n }: { n: number }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i <= n ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  );
}

// ============================================================
// Mock data builder — gera dados consistentes por projeto
// ============================================================
function buildProjectData(p: Projeto) {
  const seed = p.id.charCodeAt(1) + p.id.charCodeAt(3);
  const rand = (n: number, salt = 0) => ((seed * 9301 + 49297 + salt * 233) % 233280) / 233280 * n;

  // Custos por categoria (BC, Orçado, Realizado)
  const baseBudget = p.budget > 0 ? p.budget : 120000;
  const matrizCustos = [
    { categoria: "Pessoal interno",     bc: baseBudget * 0.45, orcado: baseBudget * 0.45, realizado: p.realizado * 0.50 },
    { categoria: "Consultorias",        bc: baseBudget * 0.20, orcado: baseBudget * 0.22, realizado: p.realizado * 0.18 },
    { categoria: "Tecnologia / SaaS",   bc: baseBudget * 0.15, orcado: baseBudget * 0.16, realizado: p.realizado * 0.14 },
    { categoria: "Infraestrutura",      bc: baseBudget * 0.12, orcado: baseBudget * 0.10, realizado: p.realizado * 0.10 },
    { categoria: "Marketing / Eventos", bc: baseBudget * 0.08, orcado: baseBudget * 0.07, realizado: p.realizado * 0.08 },
  ].map(c => ({
    categoria: c.categoria,
    bc: Math.round(c.bc),
    orcado: Math.round(c.orcado),
    realizado: Math.round(c.realizado),
  }));

  const totais = {
    bc: matrizCustos.reduce((s, c) => s + c.bc, 0),
    orcado: matrizCustos.reduce((s, c) => s + c.orcado, 0),
    realizado: matrizCustos.reduce((s, c) => s + c.realizado, 0),
  };

  // Custos mensais
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const custos = meses.map((m, i) => {
    const fator = (i + 1) / 6;
    const fatorReal = i < 4 ? fator * (0.7 + rand(0.3, i)) : 0;
    return {
      mes: m,
      bc: Math.round(totais.bc / 6),
      orcado: Math.round((totais.orcado / 6) * (1 + (i % 2 === 0 ? 0.1 : -0.05))),
      realizado: Math.round(totais.realizado * fatorReal / 2.5),
    };
  });

  // Burn-rate acumulado
  let accP = 0, accR = 0;
  const burnRate = custos.map(c => {
    accP += c.orcado;
    accR += c.realizado;
    return { mes: c.mes, planejado: accP, realizado: accR };
  });

  // Horas do time — dimensionadas por escopo (pacotes EAP)
  const horasTime = [
    { papel: "Gerente do Projeto",     dimensionadas: 240, realizadas: Math.round(240 * (0.4 + rand(0.4, 1))) },
    { papel: "Tech Lead",              dimensionadas: 320, realizadas: Math.round(320 * (0.5 + rand(0.3, 2))) },
    { papel: "Desenvolvedor Sênior",   dimensionadas: 480, realizadas: Math.round(480 * (0.4 + rand(0.5, 3))) },
    { papel: "Especialista de Negócio", dimensionadas: 160, realizadas: Math.round(160 * (0.3 + rand(0.5, 4))) },
    { papel: "Designer / UX",          dimensionadas: 120, realizadas: Math.round(120 * (0.4 + rand(0.4, 5))) },
    { papel: "QA / Validação",         dimensionadas: 100, realizadas: Math.round(100 * (0.2 + rand(0.6, 6))) },
  ];

  // Cronograma — fases com previsão, execução, extensão
  const isOff = p.saude === "Off-Track";
  const isAlerta = p.saude === "Alerta";
  const cronograma = [
    { fase: "Discovery",         previsto: 4, executado: 4, extensao: 0 },
    { fase: "Planejamento",      previsto: 3, executado: 3, extensao: isAlerta ? 1 : 0 },
    { fase: "Execução · Sprint 1", previsto: 6, executado: isOff ? 6 : 5, extensao: isOff ? 3 : 0 },
    { fase: "Execução · Sprint 2", previsto: 6, executado: isOff ? 2 : 4, extensao: isOff ? 4 : isAlerta ? 1 : 0 },
    { fase: "Validação",         previsto: 3, executado: 0, extensao: 0 },
    { fase: "Encerramento",      previsto: 2, executado: 0, extensao: 0 },
  ];

  // EAP
  const eap = [
    {
      id: "1.0", titulo: "Iniciação e Discovery",
      entregas: [
        { id: "1.1", titulo: "Termo de abertura aprovado", responsavel: "PMO", horas: 16, feito: true },
        { id: "1.2", titulo: "Mapa de stakeholders",       responsavel: "GP",  horas: 24, feito: true },
        { id: "1.3", titulo: "Visão e objetivos validados", responsavel: "Diretoria", horas: 8, feito: true },
      ],
    },
    {
      id: "2.0", titulo: "Planejamento e Arquitetura",
      entregas: [
        { id: "2.1", titulo: "EAP detalhada",         responsavel: "GP",        horas: 32, feito: true },
        { id: "2.2", titulo: "Arquitetura técnica",   responsavel: "Tech Lead", horas: 56, feito: true },
        { id: "2.3", titulo: "Plano de comunicação",  responsavel: "PMO",       horas: 16, feito: !isOff },
      ],
    },
    {
      id: "3.0", titulo: "Execução",
      entregas: [
        { id: "3.1", titulo: "MVP funcional",            responsavel: "Dev",  horas: 160, feito: !isOff },
        { id: "3.2", titulo: "Integrações com sistemas", responsavel: "Dev",  horas: 120, feito: false },
        { id: "3.3", titulo: "Testes integrados",        responsavel: "QA",   horas: 80,  feito: false },
        { id: "3.4", titulo: "Documentação técnica",     responsavel: "Tech Lead", horas: 40, feito: false },
      ],
    },
    {
      id: "4.0", titulo: "Validação e Go-Live",
      entregas: [
        { id: "4.1", titulo: "UAT com áreas de negócio", responsavel: "Negócio", horas: 60, feito: false },
        { id: "4.2", titulo: "Treinamento dos usuários", responsavel: "GP",      horas: 40, feito: false },
        { id: "4.3", titulo: "Cutover e Go-Live",        responsavel: "Tech Lead", horas: 24, feito: false },
      ],
    },
  ];

  // Riscos
  const riscos = [
    { id: "R1", titulo: "Atraso de fornecedor crítico",       categoria: "Externo",     prob: isOff ? 5 : 3, impacto: 4, mitigacao: "Plano B com fornecedor alternativo já mapeado." },
    { id: "R2", titulo: "Resistência das áreas operacionais", categoria: "Pessoas",     prob: isAlerta ? 4 : 2, impacto: 3, mitigacao: "Workshops semanais + champions internos." },
    { id: "R3", titulo: "Mudança regulatória",                categoria: "Compliance",  prob: 2, impacto: 5, mitigacao: "Acompanhamento jurídico mensal." },
    { id: "R4", titulo: "Sobrecarga do squad técnico",        categoria: "Recursos",    prob: isOff ? 4 : 3, impacto: 3, mitigacao: "Capacity planning revisto a cada sprint." },
    { id: "R5", titulo: "Escopo crescente (scope creep)",     categoria: "Escopo",      prob: 3, impacto: isAlerta ? 4 : 3, mitigacao: "CCB com aprovação obrigatória de mudanças." },
    { id: "R6", titulo: "Indisponibilidade de stakeholder",   categoria: "Governança",  prob: 2, impacto: 2, mitigacao: "Backup de aprovador em cada decisão crítica." },
  ];

  // Desvios críticos
  const farolFor = (saude: string, alvo: number) => saude === "Off-Track" && alvo === 0 ? "vermelho" : saude === "Alerta" ? "amarelo" : "verde";
  const desvios = [
    {
      dimensao: "Escopo", farol: farolFor(p.saude, 2) as "verde" | "amarelo" | "vermelho",
      deltaLabel: isOff ? "+3 itens" : isAlerta ? "+1 item" : "Sem desvio",
      descricao: "Mudanças de escopo formalizadas via CCB.",
      solicitacoes: isOff ? [
        { titulo: "Inclusão de módulo de relatórios avançados", justificativa: "Demanda crítica da diretoria comercial.", status: "Em análise" as const },
        { titulo: "Integração com ERP legado",                  justificativa: "Necessária para dados de faturamento.", status: "Aprovada" as const },
      ] : isAlerta ? [
        { titulo: "Ajuste de jornada do usuário",              justificativa: "Feedback dos primeiros testes.", status: "Aprovada" as const },
      ] : [
        { titulo: "Sem solicitações no período",                justificativa: "Escopo estável.", status: "Aprovada" as const },
      ],
    },
    {
      dimensao: "Cronograma", farol: farolFor(p.saude, 0) as "verde" | "amarelo" | "vermelho",
      deltaLabel: isOff ? "+45 dias" : isAlerta ? "+15 dias" : "On-time",
      descricao: "Variação acumulada vs. baseline aprovado no kickoff.",
      solicitacoes: [
        { titulo: isOff ? "Replanejamento completo do cronograma" : isAlerta ? "Extensão de prazo do Sprint 2" : "Manter baseline atual",
          justificativa: isOff ? "Múltiplos atrasos em cadeia." : isAlerta ? "Aguardando insumo externo." : "Execução conforme planejado.",
          status: isOff ? "Em análise" as const : "Aprovada" as const },
      ],
    },
    {
      dimensao: "Custo", farol: farolFor(p.saude, 1) as "verde" | "amarelo" | "vermelho",
      deltaLabel: isOff ? "+18% vs BC" : isAlerta ? "+5% vs BC" : "Aderente",
      descricao: "Variação financeira em relação ao Business Case original.",
      solicitacoes: isOff ? [
        { titulo: "Aporte adicional de R$ 80k", justificativa: "Cobrir extensão de cronograma e novo escopo.", status: "Em análise" as const },
      ] : [
        { titulo: "Manter dotação atual", justificativa: "Execução dentro do envelope financeiro.", status: "Aprovada" as const },
      ],
    },
  ];

  // Stakeholders
  const stakeholders = [
    { nome: p.diretor,           papel: "Sponsor Executivo",     influencia: 5, interesse: 5, estrategia: "Gerenciar de perto" },
    { nome: p.gerente ?? "PMO",  papel: "Gerente do Projeto",    influencia: 4, interesse: 5, estrategia: "Gerenciar de perto" },
    { nome: "Diretoria Financeira", papel: "Gatekeeper de Budget", influencia: 5, interesse: 3, estrategia: "Manter satisfeito" },
    { nome: "Time de Tecnologia",   papel: "Executor",            influencia: 3, interesse: 5, estrategia: "Manter informado" },
    { nome: "Áreas de Negócio",     papel: "Usuário Final",       influencia: 2, interesse: 4, estrategia: "Manter informado" },
    { nome: "Compliance",           papel: "Validador",           influencia: 4, interesse: 2, estrategia: "Manter satisfeito" },
    { nome: "Auditoria Interna",    papel: "Observador",          influencia: 2, interesse: 2, estrategia: "Monitorar" },
  ];

  return { matrizCustos, totais, custos, burnRate, horasTime, cronograma, eap, riscos, desvios, stakeholders };
}
