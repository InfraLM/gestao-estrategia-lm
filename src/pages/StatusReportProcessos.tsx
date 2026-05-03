import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProcessosDB } from "@/hooks/useProcessosDB";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CircleDot, AlertCircle, ShieldAlert, Download, LineChart, ArrowRight, AlertTriangle, Workflow } from "lucide-react";
import { toast } from "sonner";

type Processo = {
  id: string; nome: string; nivel: string; revisao: number | null;
  diretor: string; dono: string; status: string;
  maturidade?: number; vinculo?: Record<string, number>;
};

const MATRIZ_KEY = "matriz-processos-edits-v1";
const GP_KEY = "gestao-processos-v1";

const STATUS_COLORS: Record<string, string> = {
  "BACKLOG": "bg-muted text-muted-foreground",
  "A INICIAR": "bg-blue-500/15 text-blue-700",
  "MAPEAMENTO AS-IS/TO-BE": "bg-amber-500/15 text-amber-700",
  "MELHORIAS/ ANÁLISE": "bg-purple-500/15 text-purple-700",
  "VALIDAÇÃO INTERNA": "bg-cyan-500/15 text-cyan-700",
  "APROVAÇÃO DIRETORIA": "bg-orange-500/15 text-orange-700",
  "REVISÃO CONCLUÍDA VIGENTE": "bg-emerald-500/15 text-emerald-700",
  "PARALISADO": "bg-red-500/15 text-red-700",
};

const periodos = ["Semanal", "Quinzenal", "Mensal"] as const;
type Periodo = typeof periodos[number];

function loadGestao(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem(GP_KEY) || "{}"); } catch { return {}; }
}

function farolProcesso(p: Processo, d: any): "verde" | "amarelo" | "vermelho" {
  if (p.status === "PARALISADO") return "vermelho";
  if (d?.riscos?.some((r: any) => (r.impacto || 0) * (r.ocorrencia || 0) >= 15)) return "vermelho";
  if (d?.riscos?.some((r: any) => (r.impacto || 0) * (r.ocorrencia || 0) >= 10)) return "amarelo";
  if ((p.maturidade ?? 0) <= 2 && p.status !== "REVISÃO CONCLUÍDA VIGENTE") return "amarelo";
  return "verde";
}

const FAROL_COLOR = { verde: "bg-emerald-500", amarelo: "bg-amber-500", vermelho: "bg-red-500" };
const FAROL_LABEL = { verde: "On-Track", amarelo: "Alerta", vermelho: "Off-Track" };

export default function StatusReportProcessos() {
  const { data: processos } = useProcessosDB();
  const [gestao, setGestao] = useState<Record<string, any>>({});
  const [periodo, setPeriodo] = useState<Periodo>("Quinzenal");
  const [diretorFilter, setDiretorFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  useEffect(() => {
    setGestao(loadGestao());
  }, []);


  const diretores = useMemo(() => Array.from(new Set(processos.map(p => p.diretor).filter(Boolean))).sort(), [processos]);

  const linhas = useMemo(() => {
    return processos
      .filter(p => diretorFilter === "todos" || p.diretor === diretorFilter)
      .filter(p => statusFilter === "todos" || p.status === statusFilter)
      .map(p => {
        const d = gestao[p.id] || {};
        const farol = farolProcesso(p, d);
        const completude = (() => {
          let c = 0;
          if (Object.values(d.escopo || {}).some((v: any) => v && String(v).trim())) c++;
          if (d.problemas?.length) c++;
          if (d.atividades?.length) c++;
          if (d.riscos?.length) c++;
          if (d.asIs?.length) c++;
          if (d.toBe?.length) c++;
          if (d.plano?.length) c++;
          return Math.round((c / 7) * 100);
        })();
        const riscosAltos = (d.riscos || []).filter((r: any) => (r.impacto || 0) * (r.ocorrencia || 0) >= 10).length;
        const planosAndamento = (d.plano || []).filter((x: any) => x.status === "Em Andamento").length;
        const planosConcluidos = (d.plano || []).filter((x: any) => x.status === "Concluído").length;
        return { p, d, farol, completude, riscosAltos, planosAndamento, planosConcluidos };
      });
  }, [processos, gestao, diretorFilter, statusFilter]);

  const counts = useMemo(() => ({
    verde: linhas.filter(l => l.farol === "verde").length,
    amarelo: linhas.filter(l => l.farol === "amarelo").length,
    vermelho: linhas.filter(l => l.farol === "vermelho").length,
  }), [linhas]);

  const desviosCriticos = linhas.filter(l => l.farol === "vermelho");
  const alertas = linhas.filter(l => l.farol === "amarelo");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" /> Status Report de Processos
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Acompanhamento periódico do mapeamento, riscos e melhorias. Última atualização: <span className="font-medium text-foreground">{new Date().toLocaleDateString("pt-BR")}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5 bg-background">
            {periodos.map(p => (
              <button key={p} onClick={() => setPeriodo(p)} className={`h-8 px-3 text-sm rounded ${periodo === p ? "bg-foreground text-background" : "text-muted-foreground"}`}>{p}</button>
            ))}
          </div>
          <Button variant="outline" className="gap-2" onClick={() => toast.success("Relatório PDF gerado")}><Download className="h-4 w-4" /> Gerar PDF</Button>
        </div>
      </div>

      {/* Semáforo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500"><CardContent className="p-5 flex items-center justify-between">
          <div><div className="flex items-center gap-2 text-emerald-700"><CircleDot className="h-4 w-4" /><span className="font-semibold">On-Track</span></div><p className="text-xs text-muted-foreground mt-1">Mapeamento sem desvios</p></div>
          <div className="text-3xl font-semibold tabular-nums text-emerald-700">{counts.verde}</div>
        </CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="p-5 flex items-center justify-between">
          <div><div className="flex items-center gap-2 text-amber-700"><AlertCircle className="h-4 w-4" /><span className="font-semibold">Alerta</span></div><p className="text-xs text-muted-foreground mt-1">Riscos altos ou maturidade baixa</p></div>
          <div className="text-3xl font-semibold tabular-nums text-amber-700">{counts.amarelo}</div>
        </CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-5 flex items-center justify-between">
          <div><div className="flex items-center gap-2 text-red-700"><ShieldAlert className="h-4 w-4" /><span className="font-semibold">Off-Track</span></div><p className="text-xs text-muted-foreground mt-1">Paralisados ou riscos extremos</p></div>
          <div className="text-3xl font-semibold tabular-nums text-red-700">{counts.vermelho}</div>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <Card><CardContent className="p-4 flex flex-wrap gap-3">
        <Select value={diretorFilter} onValueChange={setDiretorFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Diretor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os diretores</SelectItem>
            {diretores.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent></Card>

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo por Processo</TabsTrigger>
          <TabsTrigger value="desvios">Desvios & Alertas</TabsTrigger>
          <TabsTrigger value="acoes">Plano de Ação</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base">Status consolidado · {linhas.length} processo(s)</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Farol</TableHead>
                    <TableHead className="min-w-[260px]">Processo</TableHead>
                    <TableHead className="w-[160px]">Diretor</TableHead>
                    <TableHead className="w-[200px]">Status</TableHead>
                    <TableHead className="w-[100px]">Maturidade</TableHead>
                    <TableHead className="w-[160px]">Completude</TableHead>
                    <TableHead className="w-[100px]">Riscos altos+</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map(({ p, farol, completude, riscosAltos, planosAndamento, planosConcluidos }) => (
                    <TableRow key={p.id}>
                      <TableCell><span className={`inline-block h-3 w-3 rounded-full ${FAROL_COLOR[farol]}`} title={FAROL_LABEL[farol]} /></TableCell>
                      <TableCell className="font-medium">{p.nome}<div className="text-[11px] text-muted-foreground">{p.nivel}</div></TableCell>
                      <TableCell className="text-sm">{p.diretor || "—"}</TableCell>
                      <TableCell><Badge className={STATUS_COLORS[p.status] || "bg-muted"}>{p.status}</Badge></TableCell>
                      <TableCell className="tabular-nums">{p.maturidade ?? "—"}<span className="text-xs text-muted-foreground">/5</span></TableCell>
                      <TableCell><div className="flex items-center gap-2"><Progress value={completude} className="h-1.5 flex-1" /><span className="text-xs tabular-nums w-9 text-right">{completude}%</span></div></TableCell>
                      <TableCell className="tabular-nums">{riscosAltos > 0 ? <span className="text-red-700 font-medium">{riscosAltos}</span> : "—"}</TableCell>
                      <TableCell className="text-xs">{planosConcluidos}<span className="text-muted-foreground">/</span>{planosAndamento + planosConcluidos}</TableCell>
                      <TableCell><Link to="/gestao-processos"><Button size="icon" variant="ghost" className="h-7 w-7"><ArrowRight className="h-4 w-4" /></Button></Link></TableCell>
                    </TableRow>
                  ))}
                  {!linhas.length && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum processo encontrado</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="desvios" className="mt-4 space-y-4">
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2 text-red-700"><ShieldAlert className="h-4 w-4" /> Desvios Críticos · {desviosCriticos.length}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {desviosCriticos.length === 0 && <div className="text-sm text-muted-foreground">Nenhum desvio crítico identificado.</div>}
              {desviosCriticos.map(({ p, riscosAltos }) => (
                <div key={p.id} className="flex items-center justify-between border-b last:border-0 pb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.diretor} · {riscosAltos} risco(s) extremo(s)</div>
                  </div>
                  <Badge className={STATUS_COLORS[p.status] || "bg-muted"}>{p.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2 text-amber-700"><AlertTriangle className="h-4 w-4" /> Alertas · {alertas.length}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {alertas.length === 0 && <div className="text-sm text-muted-foreground">Sem alertas no período.</div>}
              {alertas.map(({ p, riscosAltos }) => (
                <div key={p.id} className="flex items-center justify-between border-b last:border-0 pb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.diretor} · {riscosAltos > 0 ? `${riscosAltos} risco(s) altos` : `Maturidade ${p.maturidade ?? "?"} /5`}</div>
                  </div>
                  <Badge className={STATUS_COLORS[p.status] || "bg-muted"}>{p.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acoes" className="mt-4">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><Workflow className="h-4 w-4" /> Plano de Ação Consolidado</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[260px]">Processo</TableHead>
                    <TableHead className="min-w-[280px]">O que fazer</TableHead>
                    <TableHead className="w-[160px]">Responsável</TableHead>
                    <TableHead className="w-[120px]">Prazo</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.flatMap(({ p, d }) => (d.plano || []).map((acao: any) => (
                    <TableRow key={`${p.id}-${acao.id}`}>
                      <TableCell className="text-sm">{p.nome}</TableCell>
                      <TableCell className="text-sm">{acao.oQueFazer || "—"}</TableCell>
                      <TableCell className="text-sm">{acao.responsavel || "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums">{acao.prazo || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{acao.status}</Badge></TableCell>
                    </TableRow>
                  )))}
                  {linhas.every(l => !(l.d.plano || []).length) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum plano de ação cadastrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
