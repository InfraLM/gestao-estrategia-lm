import { useEffect, useMemo, useState } from "react";
import { useProcessosDB } from "@/hooks/useProcessosDB";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CircleDot, AlertCircle, ShieldAlert, Download, LineChart, Clock, CheckCircle2, Map, Rocket, Timer, CalendarClock } from "lucide-react";
import { toast } from "sonner";

type Processo = {
  id: string; nome: string; nivel: string; revisao: number | null;
  diretor: string; dono: string; status: string;
  maturidade?: number; vinculo?: Record<string, number>;
};

const MATRIZ_KEY = "matriz-processos-edits-v1";
const GP_KEY = "gestao-processos-v1";
const MC_ACOES_KEY = "melhoria-acoes-v2";
const MC_RISCOS_KEY = "melhoria-riscos-v2";

function loadLS<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function diasEntre(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a); const d2 = new Date(b);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

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
  const [mcAcoes, setMcAcoes] = useState<any[]>([]);
  const [mcRiscos, setMcRiscos] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("Quinzenal");
  const [diretorFilter, setDiretorFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  useEffect(() => {
    setGestao(loadGestao());
    setMcAcoes(loadLS<any[]>(MC_ACOES_KEY, []));
    setMcRiscos(loadLS<any[]>(MC_RISCOS_KEY, []));
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

  // (lista de processos removida — disponível em Matriz de Processos)


  // Aguardando validação (etapas de validação/aprovação)
  const aguardandoValidacao = useMemo(
    () => linhas
      .map(l => l.p)
      .filter(p => p.status === "VALIDAÇÃO INTERNA" || p.status === "APROVAÇÃO DIRETORIA"),
    [linhas]
  );

  // Riscos críticos (score >= 15) extraídos do gestao por processo
  const riscosCriticos = useMemo(() => {
    const out: { processoId: string; processoNome: string; diretor: string; descricao: string; impacto: number; ocorrencia: number; score: number; responsavel: string }[] = [];
    linhas.forEach(({ p, d }) => {
      (d.riscos || []).forEach((r: any) => {
        const score = (r.impacto || 0) * (r.ocorrencia || 0);
        if (score >= 15) out.push({
          processoId: p.id, processoNome: p.nome, diretor: p.diretor || "—",
          descricao: r.descricao || r.nome || "—",
          impacto: r.impacto || 0, ocorrencia: r.ocorrencia || 0, score,
          responsavel: r.responsavel || "—",
        });
      });
    });
    return out.sort((a, b) => b.score - a.score);
  }, [linhas]);

  // Atividades em atraso (atividades + plano de ação com prazo passado e não concluído)
  const atividadesAtraso = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const out: { processoId: string; processoNome: string; descricao: string; responsavel: string; prazoLabel: string; diasAtraso: number; origem: "Atividade" | "Plano de Ação" }[] = [];
    const parse = (v?: string) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; };
    linhas.forEach(({ p, d }) => {
      (d.atividades || []).forEach((a: any) => {
        const prazo = parse(a.prazo);
        if (prazo && prazo < hoje && a.status !== "Concluído") {
          out.push({ processoId: p.id, processoNome: p.nome, descricao: a.descricao || a.titulo || "—", responsavel: a.responsavel || "—", prazoLabel: a.prazo, diasAtraso: Math.floor((hoje.getTime() - prazo.getTime()) / 86400000), origem: "Atividade" });
        }
      });
      (d.plano || []).forEach((a: any) => {
        const prazo = parse(a.prazo);
        if (prazo && prazo < hoje && a.status !== "Concluído") {
          out.push({ processoId: p.id, processoNome: p.nome, descricao: a.oQueFazer || "—", responsavel: a.responsavel || "—", prazoLabel: a.prazo, diasAtraso: Math.floor((hoje.getTime() - prazo.getTime()) / 86400000), origem: "Plano de Ação" });
        }
      });
    });
    return out.sort((a, b) => b.diasAtraso - a.diasAtraso);
  }, [linhas]);

  // Séries mensais (últimos 6 meses)
  const meses6 = useMemo(() => {
    const arr: { ym: string; mes: string }[] = [];
    const d = new Date(); d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      arr.push({ ym: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`, mes: x.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") });
    }
    return arr;
  }, []);

  const ymOf = (v?: string) => { if (!v) return null; const d = new Date(v); if (isNaN(d.getTime())) return null; return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

  const mapeamentoMes = useMemo(() => meses6.map(({ ym, mes }) => {
    let concluidas = 0, planejadas = 0;
    linhas.forEach(({ d }) => {
      [...(d.asIs || []), ...(d.toBe || []), ...(d.atividades || [])].forEach((a: any) => {
        const ymPrazo = ymOf(a.prazo); const ymConcl = ymOf(a.dataConclusao || a.concluidoEm);
        if (ymPrazo === ym) planejadas++;
        if (ymConcl === ym && a.status === "Concluído") concluidas++;
      });
    });
    return { mes, concluidas, planejadas };
  }), [linhas, meses6]);

  const melhoriasMes = useMemo(() => meses6.map(({ ym, mes }) => {
    let concluidas = 0, planejadas = 0;
    linhas.forEach(({ d }) => {
      (d.plano || []).forEach((a: any) => {
        const ymPrazo = ymOf(a.prazo); const ymConcl = ymOf(a.dataConclusao || a.concluidoEm);
        if (ymPrazo === ym) planejadas++;
        if (ymConcl === ym && a.status === "Concluído") concluidas++;
      });
    });
    return { mes, concluidas, planejadas };
  }), [linhas, meses6]);

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

      {/* === BPMO · Melhoria Contínua: indicadores de status e descolamento === */}
      <MelhoriaIndicadores acoes={mcAcoes} riscos={mcRiscos} />

      {/* === Riscos críticos === */}
      <Card className="border-red-200">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-4 w-4" /> Riscos Críticos
            <Badge variant="outline" className="ml-2 text-xs">{riscosCriticos.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {riscosCriticos.length === 0 ? (
            <div className="text-sm text-muted-foreground p-6 text-center">Nenhum risco crítico identificado no período.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Processo</TableHead>
                  <TableHead className="min-w-[260px]">Risco</TableHead>
                  <TableHead className="w-[80px]">Imp.</TableHead>
                  <TableHead className="w-[80px]">Ocorr.</TableHead>
                  <TableHead className="w-[80px]">Score</TableHead>
                  <TableHead className="w-[160px]">Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riscosCriticos.map((r, i) => (
                  <TableRow key={`${r.processoId}-${i}`}>
                    <TableCell className="text-sm font-medium">{r.processoNome}<div className="text-[11px] text-muted-foreground">{r.diretor}</div></TableCell>
                    <TableCell className="text-sm">{r.descricao || "—"}</TableCell>
                    <TableCell className="tabular-nums text-sm">{r.impacto}</TableCell>
                    <TableCell className="tabular-nums text-sm">{r.ocorrencia}</TableCell>
                    <TableCell><Badge className="bg-red-500/15 text-red-700 tabular-nums">{r.score}</Badge></TableCell>
                    <TableCell className="text-sm">{r.responsavel || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* === Atividades em Atraso === */}
      <Card className="border-amber-200">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2 text-amber-700">
            <Clock className="h-4 w-4" /> Atividades em Atraso
            <Badge variant="outline" className="ml-2 text-xs">{atividadesAtraso.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {atividadesAtraso.length === 0 ? (
            <div className="text-sm text-muted-foreground p-6 text-center">Nenhuma atividade em atraso.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Processo</TableHead>
                  <TableHead className="min-w-[280px]">Atividade / Ação</TableHead>
                  <TableHead className="w-[140px]">Responsável</TableHead>
                  <TableHead className="w-[120px]">Prazo</TableHead>
                  <TableHead className="w-[100px]">Atraso</TableHead>
                  <TableHead className="w-[120px]">Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atividadesAtraso.map((a, i) => (
                  <TableRow key={`${a.processoId}-${a.origem}-${i}`}>
                    <TableCell className="text-sm font-medium">{a.processoNome}</TableCell>
                    <TableCell className="text-sm">{a.descricao || "—"}</TableCell>
                    <TableCell className="text-sm">{a.responsavel || "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums">{a.prazoLabel}</TableCell>
                    <TableCell className="text-sm tabular-nums text-red-700 font-medium">{a.diasAtraso}d</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.origem}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* === Aguardando Validação === */}
      <Card className="border-cyan-200">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2 text-cyan-700">
            <CheckCircle2 className="h-4 w-4" /> Processos Aguardando Validação
            <Badge variant="outline" className="ml-2 text-xs">{aguardandoValidacao.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {aguardandoValidacao.length === 0 ? (
            <div className="text-sm text-muted-foreground p-6 text-center">Nenhum processo na fila de validação.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[280px]">Processo</TableHead>
                  <TableHead className="w-[180px]">Diretor</TableHead>
                  <TableHead className="w-[180px]">Dono</TableHead>
                  <TableHead className="w-[220px]">Etapa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aguardandoValidacao.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">{p.nome}<div className="text-[11px] text-muted-foreground">{p.nivel}</div></TableCell>
                    <TableCell className="text-sm">{p.diretor || "—"}</TableCell>
                    <TableCell className="text-sm">{p.dono || "—"}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[p.status] || "bg-muted"}>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* === Mapeamento mês a mês === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2"><Map className="h-4 w-4 text-primary" /> Mapeamento mês a mês</CardTitle>
            <p className="text-xs text-muted-foreground">Atividades de mapeamento concluídas por mês (últimos 6 meses).</p>
          </CardHeader>
          <CardContent>
            <MonthlyBars data={mapeamentoMes} accent="bg-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2"><Rocket className="h-4 w-4 text-emerald-600" /> Implantação de Melhorias mês a mês</CardTitle>
            <p className="text-xs text-muted-foreground">Ações do plano de melhoria concluídas por mês (últimos 6 meses).</p>
          </CardHeader>
          <CardContent>
            <MonthlyBars data={melhoriasMes} accent="bg-emerald-500" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ====== Helpers / sub-components ======

function MonthlyBars({ data, accent }: { data: { mes: string; concluidas: number; planejadas: number }[]; accent: string }) {
  const max = Math.max(1, ...data.map(d => Math.max(d.concluidas, d.planejadas)));
  const totalConcluidas = data.reduce((s, d) => s + d.concluidas, 0);
  const totalPlanejadas = data.reduce((s, d) => s + d.planejadas, 0);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3 h-40">
        {data.map(d => (
          <div key={d.mes} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end gap-1 h-32">
              <div className="flex-1 bg-muted rounded-t" style={{ height: `${(d.planejadas / max) * 100}%` }} title={`Planejadas: ${d.planejadas}`} />
              <div className={`flex-1 ${accent} rounded-t`} style={{ height: `${(d.concluidas / max) * 100}%` }} title={`Concluídas: ${d.concluidas}`} />
            </div>
            <div className="text-[10px] text-muted-foreground tabular-nums">{d.mes}</div>
            <div className="text-xs font-semibold tabular-nums">{d.concluidas}<span className="text-muted-foreground font-normal">/{d.planejadas}</span></div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-2 w-3 inline-block bg-muted rounded-sm" /> Planejadas</span>
          <span className="flex items-center gap-1"><span className={`h-2 w-3 inline-block ${accent} rounded-sm`} /> Concluídas</span>
        </div>
        <div className="tabular-nums font-medium text-foreground">Total: {totalConcluidas}/{totalPlanejadas} ({totalPlanejadas ? Math.round((totalConcluidas / totalPlanejadas) * 100) : 0}%)</div>
      </div>
    </div>
  );
}

function classifNivelBPMO(impacto?: number, probabilidade?: number): { score: number; nivel: "Baixo" | "Moderado" | "Alto" | "Extremo" | "—"; color: string } {
  if (!impacto || !probabilidade) return { score: 0, nivel: "—", color: "bg-muted text-muted-foreground" };
  const score = impacto * probabilidade;
  if (score >= 15) return { score, nivel: "Extremo", color: "bg-rose-500/15 text-rose-700 border-rose-200" };
  if (score >= 8)  return { score, nivel: "Alto",    color: "bg-orange-500/15 text-orange-700 border-orange-200" };
  if (score >= 4)  return { score, nivel: "Moderado", color: "bg-amber-500/15 text-amber-700 border-amber-200" };
  return { score, nivel: "Baixo", color: "bg-emerald-500/15 text-emerald-700 border-emerald-200" };
}

function MelhoriaIndicadores({ acoes, riscos }: { acoes: any[]; riscos: any[] }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const isAbertoAcao = (s: string) => s !== "Concluído" && s !== "Cancelado";
  const isAbertoRisco = (s: string) => s !== "Mitigado" && s !== "Aceito";

  const acoesIdx = acoes.map(a => {
    const aberto = isAbertoAcao(a.status);
    const refConc = a.dataConclusao ?? (aberto ? hoje : undefined);
    const descol = diasEntre(a.dataPrevista, refConc);
    const tempoStatus = diasEntre(a.statusChangedAt, hoje);
    return { ...a, descol, tempoStatus, aberto };
  });
  const riscosIdx = riscos.map(r => {
    const aberto = isAbertoRisco(r.status);
    const refConc = r.dataConclusao ?? (aberto ? hoje : undefined);
    const descol = diasEntre(r.prazo, refConc);
    const tempoStatus = diasEntre(r.statusChangedAt, hoje);
    const c = classifNivelBPMO(typeof r.impacto === "number" ? r.impacto : undefined, typeof r.probabilidade === "number" ? r.probabilidade : undefined);
    return { ...r, descol, tempoStatus, aberto, _nivel: c.nivel, _score: c.score, _color: c.color };
  });

  const atrasadasAcoes = acoesIdx.filter(a => a.descol != null && a.descol > 0 && a.aberto).sort((a, b) => b.descol - a.descol);
  const atrasadosRiscos = riscosIdx.filter(r => r.descol != null && r.descol > 0 && r.aberto).sort((a, b) => b.descol - a.descol);
  const paradasAcoes = acoesIdx.filter(a => a.aberto && a.tempoStatus != null && a.tempoStatus >= 30).sort((a, b) => b.tempoStatus - a.tempoStatus);
  const riscosCriticosBPMO = riscosIdx
    .filter(r => r.aberto && (r._nivel === "Alto" || r._nivel === "Extremo"))
    .sort((a, b) => b._score - a._score);
  const totalExtremos = riscosCriticosBPMO.filter(r => r._nivel === "Extremo").length;
  const totalAltos = riscosCriticosBPMO.filter(r => r._nivel === "Alto").length;

  const totalAbertas = acoesIdx.filter(a => a.aberto).length;
  const totalRiscosAbertos = riscosIdx.filter(r => r.aberto).length;
  const mediaDescolAcoes = atrasadasAcoes.length ? Math.round(atrasadasAcoes.reduce((s, a) => s + a.descol, 0) / atrasadasAcoes.length) : 0;


  return (
    <Card className="border-indigo-200">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2 text-indigo-700">
          <CalendarClock className="h-4 w-4" /> Melhoria Contínua · Status & Descolamento de Datas
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Indicadores do BPMO/Melhoria Contínua: tempo no status atual e descolamento entre data prevista e conclusão (positivo = atraso, negativo = adiantado).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Ações em aberto</div>
            <div className="text-2xl font-semibold tabular-nums">{totalAbertas}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Ações atrasadas</div>
            <div className="text-2xl font-semibold tabular-nums text-red-700">{atrasadasAcoes.length}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Descol. médio: <span className="tabular-nums">+{mediaDescolAcoes}d</span></div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Riscos em aberto</div>
            <div className="text-2xl font-semibold tabular-nums">{totalRiscosAbertos}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Atrasados: <span className="tabular-nums text-red-700">{atrasadosRiscos.length}</span></div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" /> Paradas ≥ 30d</div>
            <div className="text-2xl font-semibold tabular-nums text-amber-700">{paradasAcoes.length}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Sem mudança de status</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Clock className="h-3 w-3" /> Top ações atrasadas</div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[80px]">Δ dias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atrasadasAcoes.slice(0, 6).map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">
                        <div className="font-medium">{a.oQueFazer}</div>
                        <div className="text-[10px] text-muted-foreground">{a.area} · {a.responsavel || "—"} · prev. {a.dataPrevista}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{a.status}</Badge></TableCell>
                      <TableCell className="tabular-nums text-xs text-red-700 font-medium">+{a.descol}d</TableCell>
                    </TableRow>
                  ))}
                  {atrasadasAcoes.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-4">Sem atrasos.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Timer className="h-3 w-3" /> Ações paradas há mais tempo (sem mudar de status)</div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[90px]">Há</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paradasAcoes.slice(0, 6).map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">
                        <div className="font-medium">{a.oQueFazer}</div>
                        <div className="text-[10px] text-muted-foreground">{a.area} · desde {a.statusChangedAt}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{a.status}</Badge></TableCell>
                      <TableCell className="tabular-nums text-xs text-amber-700 font-medium">{a.tempoStatus}d</TableCell>
                    </TableRow>
                  ))}
                  {paradasAcoes.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-4">Nenhuma ação parada há 30 dias ou mais.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {atrasadosRiscos.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Riscos com prazo de mitigação estourado</div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processo · Risco</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[80px]">Δ dias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atrasadosRiscos.slice(0, 6).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        <div className="font-medium">{r.risco}</div>
                        <div className="text-[10px] text-muted-foreground">{r.processoNome} · prazo {r.prazo}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{r.status}</Badge></TableCell>
                      <TableCell className="tabular-nums text-xs text-red-700 font-medium">+{r.descol}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

