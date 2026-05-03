import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, GanttChart, ListChecks, ShieldAlert, GitBranch,
  DollarSign, Users, Clock, AlertTriangle, CheckCircle2,
  Plus, Trash2, History, Paperclip, FileSpreadsheet, FileText, FileAudio, File as FileIcon,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart as RLineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { projetos, type Projeto } from "@/data/mockData";
import { SaudeBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import { useProjectEditableData, type CronogramaItem, type EntregaItem, type SubmissaoDocumento } from "@/hooks/useProjectEditableData";
import { SubmeterEntregaDialog } from "@/components/SubmeterEntregaDialog";
import { useColumnWidths, ResizeHandle } from "@/hooks/useColumnWidths";
import { PredecessoraDialog, PredecessorBadge, isEntregaBloqueada } from "@/components/PredecessoraDialog";

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
  const editable = useProjectEditableData(projeto.id, projeto.inicio, projeto.saude);
  const cronogramaChart = editable.cronogramaChart;

  // Datas reais a partir do cronograma editável
  const datasReais = useMemo(() => {
    const cron = editable.state.cronograma;
    if (!cron.length) return { inicioReal: null as string | null, terminoPrevisto: null as string | null };
    const concluidas = cron.map(c => c.dataConclusao).filter(Boolean) as string[];
    const inicioReal = concluidas.length
      ? concluidas.sort()[0]
      : cron.map(c => c.dataPrevista).filter(Boolean).sort()[0] ?? null;
    const terminoPrevisto = cron.map(c => c.dataPrevista).filter(Boolean).sort().slice(-1)[0] ?? null;
    return { inicioReal, terminoPrevisto };
  }, [editable.state.cronograma]);

  // Execução do escopo (EAP) — cumulativo planejado x realizado por mês
  const escopoExecucao = useMemo(() => {
    const entregas = editable.state.eap.flatMap(p => p.entregas);
    if (!entregas.length) return [] as { mes: string; planejado: number; realizado: number }[];
    const ymKey = (iso: string) => iso.slice(0, 7); // yyyy-mm
    const mesesSet = new Set<string>();
    entregas.forEach(e => {
      if (e.dataPrevista) mesesSet.add(ymKey(e.dataPrevista));
      if (e.dataConclusao) mesesSet.add(ymKey(e.dataConclusao));
    });
    const meses = Array.from(mesesSet).sort();
    const total = entregas.length;
    const hoje = new Date().toISOString().slice(0, 7);
    return meses.map(m => {
      const planejadasAteAqui = entregas.filter(e => e.dataPrevista && ymKey(e.dataPrevista) <= m).length;
      const realizadasAteAqui = entregas.filter(e => e.dataConclusao && ymKey(e.dataConclusao) <= m).length;
      const isFuturo = m > hoje;
      const mesLabel = (() => {
        const [y, mo] = m.split("-");
        return `${mo}/${y.slice(2)}`;
      })();
      return {
        mes: mesLabel,
        planejado: Math.round((planejadasAteAqui / total) * 100),
        // Não mostra realizado em meses futuros (linha "para")
        realizado: isFuturo ? null as any : Math.round((realizadasAteAqui / total) * 100),
      };
    });
  }, [editable.state.eap]);

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };


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
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div className="rounded-md border border-border bg-muted/30 px-2 py-1 text-left">
              <div className="uppercase tracking-wider font-semibold">Início real</div>
              <div className="text-foreground font-medium tabular-nums mt-0.5">{fmtDate(datasReais.inicioReal)}</div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 px-2 py-1 text-left">
              <div className="uppercase tracking-wider font-semibold">Término previsto</div>
              <div className="text-foreground font-medium tabular-nums mt-0.5">{fmtDate(datasReais.terminoPrevisto)}</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Conforme cronograma</div>
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
              <Bar dataKey="bc" name="BC" fill="hsl(var(--neutral))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="bc" position="top" style={{ fill: "hsl(var(--neutral))", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => v > 0 ? `${(v / 1000).toFixed(0)}k` : ""} />
              </Bar>
              <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--info))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="orcado" position="top" style={{ fill: "hsl(var(--info))", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => v > 0 ? `${(v / 1000).toFixed(0)}k` : ""} />
              </Bar>
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
            <BarChart data={cronogramaChart} layout="vertical" margin={{ left: 16, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}sem`} />
              <YAxis dataKey="fase" type="category" tick={{ fontSize: 11 }} width={130} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v} sem`, n]} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
              <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--neutral))" stackId="x">
                <LabelList dataKey="previsto" position="right" style={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v > 0 ? `${v}sem` : ""} />
              </Bar>
              <Bar dataKey="executado" name="Executado" fill="hsl(var(--success))" stackId="y">
                <LabelList dataKey="executado" position="insideRight" style={{ fill: "white", fontSize: 10, fontWeight: 700 }} formatter={(v: number) => v > 0 ? `${v}sem` : ""} />
              </Bar>
              <Bar dataKey="extensao" name="Extensão" fill="hsl(var(--destructive))" stackId="y">
                <LabelList dataKey="extensao" position="right" style={{ fill: "hsl(var(--destructive))", fontSize: 10, fontWeight: 700 }} formatter={(v: number) => v > 0 ? `+${v}sem` : ""} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabs operacionais */}
      <Tabs defaultValue="cronograma">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
          <TabsTrigger value="cronograma" className="gap-1.5"><GanttChart className="h-3.5 w-3.5" /> Cronograma</TabsTrigger>
          <TabsTrigger value="eap" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" /> EAP</TabsTrigger>
          <TabsTrigger value="riscos" className="gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Riscos</TabsTrigger>
          <TabsTrigger value="desvios" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Desvios</TabsTrigger>
          <TabsTrigger value="custos" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Custos</TabsTrigger>
          <TabsTrigger value="stakeholders" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Stakeholders</TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5"><History className="h-3.5 w-3.5" /> Histórico</TabsTrigger>
        </TabsList>

        {/* CRONOGRAMA — editável */}
        <TabsContent value="cronograma" className="mt-5">
          <CronogramaEditavel editable={editable} projetoId={projeto.id} />
        </TabsContent>

        {/* EAP — editável + submissão por entregável */}
        <TabsContent value="eap" className="mt-5">
          <EapEditavel editable={editable} projetoId={projeto.id} />
        </TabsContent>

        {/* MATRIZ DE RISCOS */}
        <TabsContent value="riscos" className="mt-5">
          <RiscosEditavel riscos={data.riscos} projetoId={projeto.id} />
          <Card className="p-5 shadow-card mt-5 hidden">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>placeholder</th>
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
              <div className="mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Execução Financeira
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Burn-rate acumulado · Planejado vs Realizado (R$)</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <RLineChart data={data.burnRate} margin={{ top: 16, right: 16 }}>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="planejado" name="Planejado" stroke="hsl(var(--neutral))" strokeDasharray="5 5" dot={{ r: 2 }}>
                    <LabelList dataKey="planejado" position="top" style={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} formatter={(v: number) => v > 0 ? `${(v / 1000).toFixed(0)}k` : ""} />
                  </Line>
                  <Line type="monotone" dataKey="realizado" name="Realizado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 2 }}>
                    <LabelList dataKey="realizado" position="bottom" style={{ fill: "hsl(var(--primary))", fontSize: 9, fontWeight: 600 }} formatter={(v: number) => v > 0 ? `${(v / 1000).toFixed(0)}k` : ""} />
                  </Line>
                </RLineChart>
              </ResponsiveContainer>
            </Card>

            {/* Execução do Escopo (EAP) — espelha a financeira */}
            <Card className="p-5 shadow-card xl:col-span-3">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-info" /> Execução do Escopo (EAP)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    % cumulativo de entregas · Planejado vs Realizado (com base nas datas previstas e de conclusão da EAP)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {(() => {
                    const entregas = editable.state.eap.flatMap(p => p.entregas);
                    const total = entregas.length || 1;
                    const concluidas = entregas.filter(e => e.dataConclusao).length;
                    const hoje = new Date().toISOString().slice(0, 10);
                    const planAteHoje = entregas.filter(e => e.dataPrevista && e.dataPrevista <= hoje).length;
                    return (
                      <>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Concluído</div>
                          <div className="text-lg font-bold tabular-nums" style={{ color: "hsl(var(--info))" }}>{Math.round((concluidas / total) * 100)}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Planejado até hoje</div>
                          <div className="text-lg font-bold tabular-nums text-muted-foreground">{Math.round((planAteHoje / total) * 100)}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Entregas</div>
                          <div className="text-lg font-bold tabular-nums">{concluidas}/{total}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              {escopoExecucao.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RLineChart data={escopoExecucao} margin={{ top: 16, right: 24 }}>
                    <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v == null ? "—" : `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="planejado" name="Planejado" stroke="hsl(var(--neutral))" strokeDasharray="5 5" dot={{ r: 2 }}>
                      <LabelList dataKey="planejado" position="top" style={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} formatter={(v: number) => v != null ? `${v}%` : ""} />
                    </Line>
                    <Line type="monotone" dataKey="realizado" name="Realizado" stroke="hsl(var(--info))" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false}>
                      <LabelList dataKey="realizado" position="bottom" style={{ fill: "hsl(var(--info))", fontSize: 10, fontWeight: 600 }} formatter={(v: number) => v != null ? `${v}%` : ""} />
                    </Line>
                  </RLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-10">
                  Sem entregas cadastradas na EAP para calcular execução do escopo.
                </div>
              )}
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

        {/* HISTÓRICO */}
        <TabsContent value="historico" className="mt-5">
          <HistoricoTab editable={editable} />
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
// Componentes editáveis — Cronograma, EAP e Histórico
// ============================================================
type Editable = ReturnType<typeof useProjectEditableData>;

const STATUS_CRON: CronogramaItem["status"][] = ["A iniciar", "Em andamento", "Concluído", "Atrasado"];
const STATUS_ENTREGA: EntregaItem["status"][] = ["A iniciar", "Em andamento", "Concluído", "Bloqueado"];

function statusColor(status: string) {
  switch (status) {
    case "Concluído": return "bg-success-soft text-success border-success/30";
    case "Em andamento": return "bg-info/15 text-info border-info/30";
    case "Atrasado":
    case "Bloqueado": return "bg-destructive/15 text-destructive border-destructive/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function CronogramaEditavel({ editable }: { editable: Editable }) {
  const { state, updateCronograma, addCronograma, removeCronograma } = editable;
  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Cronograma editável</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Edite responsável, datas, semanas e status. Toda alteração é registrada no histórico.</p>
        </div>
        <Button size="sm" variant="outline" onClick={addCronograma} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova fase
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left px-2 py-2 font-semibold">Fase</th>
              <th className="text-left px-2 py-2 font-semibold w-[160px]">Responsável</th>
              <th className="text-left px-2 py-2 font-semibold w-[140px]">Data prevista</th>
              <th className="text-left px-2 py-2 font-semibold w-[140px]">Data conclusão</th>
              <th className="text-center px-2 py-2 font-semibold w-[70px]">Prev.</th>
              <th className="text-center px-2 py-2 font-semibold w-[70px]">Exec.</th>
              <th className="text-center px-2 py-2 font-semibold w-[70px]">Ext.</th>
              <th className="text-left px-2 py-2 font-semibold w-[140px]">Status</th>
              <th className="px-2 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {state.cronograma.map(c => (
              <tr key={c.id} className="border-b border-border/50">
                <td className="px-2 py-1.5">
                  <Input value={c.fase} onChange={e => updateCronograma(c.id, { fase: e.target.value })} className="h-8 text-sm" />
                </td>
                <td className="px-2 py-1.5">
                  <Input value={c.responsavel} onChange={e => updateCronograma(c.id, { responsavel: e.target.value })} className="h-8 text-sm" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="date" value={c.dataPrevista} onChange={e => updateCronograma(c.id, { dataPrevista: e.target.value })} className="h-8 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="date" value={c.dataConclusao ?? ""} onChange={e => updateCronograma(c.id, { dataConclusao: e.target.value || null })} className="h-8 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" min={0} value={c.previsto} onChange={e => updateCronograma(c.id, { previsto: Number(e.target.value) || 0 })} className="h-8 text-xs text-center tabular-nums" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" min={0} value={c.executado} onChange={e => updateCronograma(c.id, { executado: Number(e.target.value) || 0 })} className="h-8 text-xs text-center tabular-nums" />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" min={0} value={c.extensao} onChange={e => updateCronograma(c.id, { extensao: Number(e.target.value) || 0 })} className="h-8 text-xs text-center tabular-nums" />
                </td>
                <td className="px-2 py-1.5">
                  <Select value={c.status} onValueChange={(v) => updateCronograma(c.id, { status: v as CronogramaItem["status"] })}>
                    <SelectTrigger className={cn("h-8 text-xs", statusColor(c.status))}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_CRON.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeCronograma(c.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const TIPO_ICON_MAP: Record<SubmissaoDocumento["tipo"], typeof FileIcon> = {
  planilha: FileSpreadsheet,
  pdf: FileText,
  texto: FileText,
  gravacao: FileAudio,
  outro: FileIcon,
};

const EAP_COL_DEFAULTS: Record<string, number> = {
  id: 56, entrega: 280, responsavel: 160, dataPrev: 140, dataConcl: 140,
  horas: 70, status: 140, predecessoras: 200, submissoes: 140, acoes: 40,
};

const EAP_COLS: { key: keyof typeof EAP_COL_DEFAULTS; label: string; align?: "left" | "center" }[] = [
  { key: "id", label: "ID" },
  { key: "entrega", label: "Entrega" },
  { key: "responsavel", label: "Responsável" },
  { key: "dataPrev", label: "Data prevista" },
  { key: "dataConcl", label: "Data conclusão" },
  { key: "horas", label: "Horas", align: "center" },
  { key: "status", label: "Status" },
  { key: "predecessoras", label: "Predecessoras" },
  { key: "submissoes", label: "Submissões", align: "center" },
  { key: "acoes", label: "" },
];

function EapEditavel({ editable, projetoId }: { editable: Editable; projetoId: string }) {
  const { state, updateEntrega, addEntrega, removeEntrega, submitDocumento } = editable;
  const { widths, startResize, reset } = useColumnWidths(`${projetoId}-eap`, EAP_COL_DEFAULTS);

  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="font-semibold">Estrutura Analítica do Projeto (EAP) — editável</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Colunas redimensionáveis (arraste a borda direita do cabeçalho). Vincule <strong>predecessoras</strong> de outras entregas, projetos ou melhorias — atividades com pendentes ficam <strong>bloqueadas</strong> automaticamente (caminho crítico).
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={reset} className="text-xs h-7 shrink-0">Resetar larguras</Button>
      </div>
      <div className="space-y-4">
        {state.eap.map(pacote => {
          const concl = pacote.entregas.filter(e => e.feito).length;
          return (
            <div key={pacote.id} className="border border-border rounded-md overflow-hidden">
              <div className="flex items-center justify-between bg-surface-muted/40 px-3 py-2 gap-3">
                <div className="flex items-center gap-3 text-sm min-w-0">
                  <span className="text-xs tabular-nums font-mono text-muted-foreground shrink-0">{pacote.id}</span>
                  <span className="font-semibold truncate">{pacote.titulo}</span>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-muted-foreground tabular-nums">{concl}/{pacote.entregas.length}</span>
                  <div className="w-24 h-1.5 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pacote.entregas.length ? (concl / pacote.entregas.length) * 100 : 0}%` }} />
                  </div>
                  <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => addEntrega(pacote.id)}>
                    <Plus className="h-3 w-3" /> Entrega
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="text-sm" style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
                  <colgroup>
                    {EAP_COLS.map(c => (
                      <col key={c.key} style={{ width: `${widths[c.key]}px` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                      {EAP_COLS.map(c => (
                        <th
                          key={c.key}
                          className={cn("px-2 py-2 font-semibold relative", c.align === "center" ? "text-center" : "text-left")}
                        >
                          <span className="block truncate pr-1.5">{c.label}</span>
                          {c.key !== "acoes" && <ResizeHandle onMouseDown={(e) => startResize(c.key as string, e)} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pacote.entregas.map(e => {
                      const bloqueado = isEntregaBloqueada(e, state.eap);
                      const statusEfetivo: EntregaItem["status"] = bloqueado && e.status !== "Concluído" ? "Bloqueado" : e.status;
                      return (
                        <tr key={e.id} className={cn("border-b border-border/50", bloqueado && e.status !== "Concluído" && "bg-destructive/5")}>
                          <td className="px-2 py-1.5 text-xs font-mono text-muted-foreground tabular-nums truncate">{e.id}</td>
                          <td className="px-2 py-1.5">
                            <Input value={e.titulo} onChange={ev => updateEntrega(pacote.id, e.id, { titulo: ev.target.value })} className="h-8 text-sm" />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input value={e.responsavel} onChange={ev => updateEntrega(pacote.id, e.id, { responsavel: ev.target.value })} className="h-8 text-sm" />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input type="date" value={e.dataPrevista} onChange={ev => updateEntrega(pacote.id, e.id, { dataPrevista: ev.target.value })} className="h-8 text-xs" />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input type="date" value={e.dataConclusao ?? ""} onChange={ev => updateEntrega(pacote.id, e.id, { dataConclusao: ev.target.value || null, feito: !!ev.target.value })} className="h-8 text-xs" />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input type="number" min={0} value={e.horas} onChange={ev => updateEntrega(pacote.id, e.id, { horas: Number(ev.target.value) || 0 })} className="h-8 text-xs text-center tabular-nums" />
                          </td>
                          <td className="px-2 py-1.5">
                            <Select
                              value={statusEfetivo}
                              disabled={bloqueado && e.status !== "Concluído"}
                              onValueChange={(v) => {
                                const novo = v as EntregaItem["status"];
                                updateEntrega(pacote.id, e.id, { status: novo, feito: novo === "Concluído", dataConclusao: novo === "Concluído" ? (e.dataConclusao ?? new Date().toISOString().slice(0, 10)) : null });
                              }}
                            >
                              <SelectTrigger className={cn("h-8 text-xs", statusColor(statusEfetivo))}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_ENTREGA.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              {e.predecessoras?.slice(0, 2).map(p => (
                                <PredecessorBadge key={`${p.origem}-${p.refId}`} p={p} />
                              ))}
                              {e.predecessoras && e.predecessoras.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{e.predecessoras.length - 2}</span>
                              )}
                              <PredecessoraDialog
                                entregaTitulo={e.titulo}
                                entregaIdLocal={e.id}
                                predecessoras={e.predecessoras ?? []}
                                currentProjectId={projetoId}
                                eap={state.eap}
                                onChange={(preds) => updateEntrega(pacote.id, e.id, { predecessoras: preds })}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <SubmeterEntregaDialog
                              entregaId={e.id}
                              entregaTitulo={e.titulo}
                              documentos={e.documentos}
                              onSubmit={(doc) => submitDocumento(pacote.id, e.id, doc)}
                            />
                            {e.documentos.length > 0 && (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                {e.documentos.slice(0, 3).map(d => {
                                  const Icon = TIPO_ICON_MAP[d.tipo];
                                  return <Icon key={d.id} className="h-3 w-3 text-muted-foreground" />;
                                })}
                                {e.documentos.length > 3 && <span className="text-[9px] text-muted-foreground">+{e.documentos.length - 3}</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeEntrega(pacote.id, e.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function HistoricoTab({ editable }: { editable: Editable }) {
  const { state, reset } = editable;
  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Histórico de alterações</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{state.historico.length} evento(s) registrado(s) — alterações de cronograma, EAP e submissões.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { if (confirm("Restaurar dados padrão e limpar histórico?")) reset(); }}>
          Restaurar padrão
        </Button>
      </div>
      {state.historico.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nenhuma alteração registrada ainda. Edite uma fase ou entrega para começar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left px-2 py-2 font-semibold w-[140px]">Data/hora</th>
                <th className="text-left px-2 py-2 font-semibold w-[100px]">Autor</th>
                <th className="text-left px-2 py-2 font-semibold w-[100px]">Alvo</th>
                <th className="text-left px-2 py-2 font-semibold">Item</th>
                <th className="text-left px-2 py-2 font-semibold w-[140px]">Campo</th>
                <th className="text-left px-2 py-2 font-semibold">De → Para</th>
              </tr>
            </thead>
            <tbody>
              {state.historico.map(h => (
                <tr key={h.id} className="border-b border-border/50 align-top">
                  <td className="px-2 py-2 text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                    {new Date(h.data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-2 py-2 text-xs">{h.autor}</td>
                  <td className="px-2 py-2"><Badge variant="outline" className="text-[10px] capitalize">{h.alvoTipo}</Badge></td>
                  <td className="px-2 py-2 text-xs">
                    <div className="font-medium">{h.alvoTitulo}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{h.alvoId}</div>
                  </td>
                  <td className="px-2 py-2 text-xs"><Badge className="bg-muted text-foreground border-border text-[10px] capitalize">{h.campo}</Badge></td>
                  <td className="px-2 py-2 text-xs">
                    <span className="text-muted-foreground line-through mr-1.5">{h.valorAnterior}</span>
                    <span className="text-foreground font-medium">→ {h.valorNovo}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}


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
