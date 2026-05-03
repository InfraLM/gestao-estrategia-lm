import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import processosSeed from "@/data/processos.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { E2E_ZONES, zonesForProcesso } from "@/data/e2eZones";
import { ArrowRight, Network, Workflow, AlertTriangle, ShieldCheck, Bot, Activity, Users, Layers, Target } from "lucide-react";

type Processo = {
  id: string; nome: string; nivel: string; revisao: number | null;
  diretor: string; dono: string; status: string;
  maturidade?: number; kpiValor?: number; vinculo?: Record<string, number>;
};

const MATRIZ_EDITS_KEY = "matriz-processos-edits-v1";
const GP_KEY = "gestao-processos-v1";

function loadProcessos(): Processo[] {
  try {
    const raw = localStorage.getItem(MATRIZ_EDITS_KEY);
    const edits: Record<string, Partial<Processo>> = raw ? JSON.parse(raw) : {};
    return (processosSeed as Processo[]).map(p => ({ ...p, ...edits[p.id] }));
  } catch { return processosSeed as Processo[]; }
}

function loadGestao(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem(GP_KEY) || "{}"); } catch { return {}; }
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

export default function DashboardProcessos() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [gestao, setGestao] = useState<Record<string, any>>({});

  useEffect(() => {
    setProcessos(loadProcessos());
    setGestao(loadGestao());
  }, []);

  const stats = useMemo(() => {
    const total = processos.length;
    const vigentes = processos.filter(p => p.status === "REVISÃO CONCLUÍDA VIGENTE").length;
    const emMapeamento = processos.filter(p => ["MAPEAMENTO AS-IS/TO-BE", "MELHORIAS/ ANÁLISE", "VALIDAÇÃO INTERNA", "APROVAÇÃO DIRETORIA"].includes(p.status)).length;
    const backlog = processos.filter(p => ["BACKLOG", "A INICIAR"].includes(p.status)).length;
    const paralisados = processos.filter(p => p.status === "PARALISADO").length;
    const matVals = processos.map(p => p.maturidade).filter((v): v is number => !!v);
    const matAvg = matVals.length ? (matVals.reduce((a, b) => a + b, 0) / matVals.length) : 0;
    const cobertura = total ? Math.round((vigentes / total) * 100) : 0;

    const byNivel: Record<string, number> = {};
    processos.forEach(p => { byNivel[p.nivel] = (byNivel[p.nivel] || 0) + 1; });

    const byDiretor: Record<string, { total: number; vigentes: number; mat: number[] }> = {};
    processos.forEach(p => {
      const d = p.diretor || "—";
      if (!byDiretor[d]) byDiretor[d] = { total: 0, vigentes: 0, mat: [] };
      byDiretor[d].total++;
      if (p.status === "REVISÃO CONCLUÍDA VIGENTE") byDiretor[d].vigentes++;
      if (p.maturidade) byDiretor[d].mat.push(p.maturidade);
    });

    return { total, vigentes, emMapeamento, backlog, paralisados, matAvg, cobertura, byNivel, byDiretor };
  }, [processos]);

  const gestaoStats = useMemo(() => {
    let processosComDados = 0, problemas = 0, riscos = 0, atividades = 0, planos = 0;
    let asIs = 0, toBe = 0;
    let tav = 0, tnav = 0, tnavn = 0, autoAlto = 0, iaAlto = 0;
    let riscosExtremos = 0, riscosAltos = 0;
    Object.values(gestao).forEach((d: any) => {
      if (!d) return;
      const tem = (d.problemas?.length || d.riscos?.length || d.asIs?.length || d.toBe?.length || d.plano?.length || d.atividades?.length);
      if (tem) processosComDados++;
      problemas += d.problemas?.length || 0;
      riscos += d.riscos?.length || 0;
      atividades += d.atividades?.length || 0;
      planos += d.plano?.length || 0;
      asIs += d.asIs?.length || 0;
      toBe += d.toBe?.length || 0;
      (d.atividades || []).forEach((a: any) => {
        if (a.classificacao === "TAV") tav++;
        else if (a.classificacao === "TNAV") tnav++;
        else if (a.classificacao === "TNAVN") tnavn++;
        if (a.potencialAutomacao === "Alto") autoAlto++;
        if (a.potencialIA === "Alto") iaAlto++;
      });
      (d.riscos || []).forEach((r: any) => {
        const v = (r.impacto || 0) * (r.ocorrencia || 0);
        if (v >= 15) riscosExtremos++;
        else if (v >= 10) riscosAltos++;
      });
    });
    return { processosComDados, problemas, riscos, atividades, planos, asIs, toBe, tav, tnav, tnavn, autoAlto, iaAlto, riscosExtremos, riscosAltos };
  }, [gestao]);

  const e2eCobertura = useMemo(() => {
    return E2E_ZONES.map(z => {
      const procs = processos.filter(p => zonesForProcesso(p.nome).some(x => x.id === z.id));
      const vigentes = procs.filter(p => p.status === "REVISÃO CONCLUÍDA VIGENTE").length;
      const matVals = procs.map(p => p.maturidade).filter((v): v is number => !!v);
      const matAvg = matVals.length ? (matVals.reduce((a, b) => a + b, 0) / matVals.length) : 0;
      return { zona: z, total: procs.length, vigentes, matAvg, cobertura: procs.length ? Math.round((vigentes / procs.length) * 100) : 0 };
    });
  }, [processos]);

  const topVinculo = useMemo(() => {
    return [...processos]
      .map(p => ({ p, soma: Object.values(p.vinculo || {}).reduce((a, b) => a + (b || 0), 0) }))
      .filter(x => x.soma > 0)
      .sort((a, b) => b.soma - a.soma)
      .slice(0, 8);
  }, [processos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Dashboard de Processos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada da Matriz de Processos + Gestão de Processos · Maturidade, riscos, atividades e cobertura E2E.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/matriz-processos"><Button variant="outline" size="sm" className="gap-1.5"><Network className="h-4 w-4" /> Matriz</Button></Link>
          <Link to="/gestao-processos"><Button size="sm" className="gap-1.5"><Workflow className="h-4 w-4" /> Gestão <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total de processos</div><div className="text-2xl font-semibold mt-1">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-emerald-700">Vigentes</div><div className="text-2xl font-semibold mt-1 text-emerald-700">{stats.vigentes}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-amber-700">Em mapeamento</div><div className="text-2xl font-semibold mt-1 text-amber-700">{stats.emMapeamento}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-blue-700">Backlog</div><div className="text-2xl font-semibold mt-1 text-blue-700">{stats.backlog}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Maturidade média</div><div className="text-2xl font-semibold mt-1">{stats.matAvg.toFixed(1)}<span className="text-sm text-muted-foreground">/5</span></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Cobertura vigente</div><div className="text-2xl font-semibold mt-1">{stats.cobertura}%</div><Progress value={stats.cobertura} className="h-1.5 mt-2" /></CardContent></Card>
      </div>

      {/* Gestão consolidada */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" /> Gestão de Processos · Consolidado</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-md border bg-muted/30"><div className="text-[11px] text-muted-foreground uppercase">Em gestão</div><div className="text-xl font-semibold tabular-nums">{gestaoStats.processosComDados}</div></div>
          <div className="p-3 rounded-md border"><div className="text-[11px] text-muted-foreground uppercase">Problemas</div><div className="text-xl font-semibold tabular-nums text-orange-700">{gestaoStats.problemas}</div></div>
          <div className="p-3 rounded-md border"><div className="text-[11px] text-muted-foreground uppercase">Riscos</div><div className="text-xl font-semibold tabular-nums text-red-700">{gestaoStats.riscos}</div></div>
          <div className="p-3 rounded-md border"><div className="text-[11px] text-muted-foreground uppercase">Atividades</div><div className="text-xl font-semibold tabular-nums">{gestaoStats.atividades}</div></div>
          <div className="p-3 rounded-md border"><div className="text-[11px] text-muted-foreground uppercase">AS-IS / TO-BE</div><div className="text-xl font-semibold tabular-nums">{gestaoStats.asIs}<span className="text-sm text-muted-foreground"> / {gestaoStats.toBe}</span></div></div>
          <div className="p-3 rounded-md border"><div className="text-[11px] text-muted-foreground uppercase">Planos de ação</div><div className="text-xl font-semibold tabular-nums text-primary">{gestaoStats.planos}</div></div>
          <div className="p-3 rounded-md border bg-red-50/40"><div className="text-[11px] text-red-700 uppercase">Riscos altos+extremos</div><div className="text-xl font-semibold tabular-nums text-red-700">{gestaoStats.riscosExtremos + gestaoStats.riscosAltos}</div></div>
        </CardContent>
      </Card>

      {/* Atividades · TAV / TNAV / TNAVN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4" /> Atividades · Agregação de Valor</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const total = (gestaoStats.tav + gestaoStats.tnav + gestaoStats.tnavn) || 1;
              const items = [
                { key: "TAV", label: "Agrega Valor", count: gestaoStats.tav, color: "bg-emerald-500", text: "text-emerald-700" },
                { key: "TNAVN", label: "Não Agrega mas é Necessária", count: gestaoStats.tnavn, color: "bg-amber-500", text: "text-amber-700" },
                { key: "TNAV", label: "Não Agrega Valor", count: gestaoStats.tnav, color: "bg-red-500", text: "text-red-700" },
              ];
              return items.map(it => {
                const pct = Math.round((it.count / total) * 100);
                return (
                  <div key={it.key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span><Badge variant="outline" className={`mr-2 ${it.text}`}>{it.key}</Badge>{it.label}</span>
                      <span className="font-medium tabular-nums">{it.count} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${it.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4" /> Potencial de Automação & IA</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-emerald-50/40">
              <div className="text-xs uppercase text-emerald-700">Atividades com Alto Potencial de Automação</div>
              <div className="text-3xl font-semibold tabular-nums text-emerald-700 mt-2">{gestaoStats.autoAlto}</div>
              <div className="text-xs text-muted-foreground mt-1">de {gestaoStats.atividades} atividades mapeadas</div>
            </div>
            <div className="p-4 rounded-lg border bg-primary/5">
              <div className="text-xs uppercase text-primary">Atividades com Alto Potencial de IA</div>
              <div className="text-3xl font-semibold tabular-nums text-primary mt-2">{gestaoStats.iaAlto}</div>
              <div className="text-xs text-muted-foreground mt-1">de {gestaoStats.atividades} atividades mapeadas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cobertura E2E */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Cobertura por Zona E2E</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {e2eCobertura.map(z => (
            <div key={z.zona.id} className="p-3 rounded-md border">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px]">{z.zona.id}</Badge>
                <span className="text-[10px] text-muted-foreground">{z.total} proc.</span>
              </div>
              <div className="text-sm font-medium mt-1 leading-tight">{z.zona.titulo}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Vigentes</span>
                <span className="font-medium text-emerald-700">{z.vigentes}/{z.total}</span>
              </div>
              <Progress value={z.cobertura} className="h-1.5 mt-1" />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Maturidade</span>
                <span className="font-medium">{z.matAvg ? z.matAvg.toFixed(1) : "—"}/5</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Por diretor + Top vínculo estratégico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Maturidade por Diretor</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byDiretor)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 10)
              .map(([d, info]) => {
                const matAvg = info.mat.length ? (info.mat.reduce((a, b) => a + b, 0) / info.mat.length) : 0;
                const cob = info.total ? Math.round((info.vigentes / info.total) * 100) : 0;
                return (
                  <div key={d} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{d}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={cob} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{info.vigentes}/{info.total}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="tabular-nums">{matAvg.toFixed(1)}/5</Badge>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Top Processos por Vínculo Estratégico</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topVinculo.length === 0 && <div className="text-sm text-muted-foreground">Nenhum vínculo estratégico cadastrado.</div>}
            {topVinculo.map(({ p, soma }) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm border-b pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.nome}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.diretor}</div>
                </div>
                <Badge className={STATUS_COLORS[p.status] || "bg-muted"}>{p.status}</Badge>
                <Badge variant="outline" className="tabular-nums">⊕ {soma}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(stats.paralisados > 0 || gestaoStats.riscosExtremos > 0) && (
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2 text-red-700"><AlertTriangle className="h-4 w-4" /> Atenção</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {stats.paralisados > 0 && <div>• <strong>{stats.paralisados}</strong> processo(s) paralisado(s) — revisar prioridade.</div>}
            {gestaoStats.riscosExtremos > 0 && <div>• <strong>{gestaoStats.riscosExtremos}</strong> risco(s) classificado(s) como Extremo (impacto × ocorrência ≥ 15).</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
