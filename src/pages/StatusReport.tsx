import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Download, CircleDot, AlertCircle, ShieldAlert, Sparkles, FilePlus2, History, ExternalLink, Loader2, TrendingUp } from "lucide-react";
import { useProjetosDB } from "@/hooks/useProjetosDB";
import { SaudeBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ParecerDialog } from "@/components/ParecerDialog";
import { supabase } from "@/integrations/supabase/client";
import { useMelhoriasEstrategicas } from "@/hooks/useMelhoriasEstrategicas";
import { FormField } from "@/components/FormField";
import { FaroisReportLeitura } from "@/components/FaroisReportLeitura";
import { faroisParaEdicao, type FarolDimensao, type CorFarol } from "@/lib/statusReportFarois";
import { exclusiveAction } from "@/lib/exclusiveAction";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";


const periodos = ["Semanal", "Quinzenal", "Mensal"] as const;
type Periodo = typeof periodos[number];

const farolColor = { verde: "bg-success", amarelo: "bg-warning", vermelho: "bg-destructive" } as const;

type DraftSR = { avancos: string; desvios: string; causa_raiz: string; plano_acao: string; farois_dimensoes: FarolDimensao[] };

type LatestSR = {
  id: string;
  projeto_id: string;
  periodo: string;
  avancos: string | null;
  desvios: string | null;
  saude: string | null;
  causa_raiz: string | null;
  plano_acao: string | null;
  created_at: string;
  farois_dimensoes: unknown;
};

export default function StatusReport() {
  const { data: projetos } = useProjetosDB();
  const melhorias = useMelhoriasEstrategicas();
  const [periodo, setPeriodo] = useState<Periodo>("Quinzenal");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [parecerOpen, setParecerOpen] = useState(false);

  // Mapa codigo → uuid do projeto no banco
  const [codigoToUuid, setCodigoToUuid] = useState<Record<string, string>>({});
  // Último status_report por projeto (chave: uuid)
  const [latestByUuid, setLatestByUuid] = useState<Record<string, LatestSR>>({});
  // Draft local por codigo
  const [drafts, setDrafts] = useState<Record<string, DraftSR>>({});
  const saveGuard = useRef(exclusiveAction());
  const [saveError, setSaveError] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loadingSR, setLoadingSR] = useState(true);

  const ativos = useMemo(
    () => projetos.filter(p => p.status === "Em Andamento" || p.status === "Em Avaliação"),
    [projetos],
  );

  const loadStatusReports = async () => {
    setLoadingSR(true);
    const { data: proj } = await supabase.from("projetos").select("id,codigo");
    const map: Record<string, string> = {};
    (proj ?? []).forEach((p: any) => { map[p.codigo] = p.id; });
    setCodigoToUuid(map);

    const uuids = Object.values(map);
    if (uuids.length > 0) {
      const { data: srs } = await supabase
        .from("status_reports")
        .select("id,projeto_id,periodo,avancos,desvios,saude,causa_raiz,plano_acao,created_at,farois_dimensoes")
        .in("projeto_id", uuids)
        .order("created_at", { ascending: false });
      const latest: Record<string, LatestSR> = {};
      (srs ?? []).forEach((r: any) => {
        if (!latest[r.projeto_id]) latest[r.projeto_id] = r;
      });
      setLatestByUuid(latest);
    }
    setLoadingSR(false);
  };

  useEffect(() => { loadStatusReports(); }, []);
  useRefetchOnFocus(() => { loadStatusReports(); });


  // Default expanded: primeiro fora do On-Track
  useEffect(() => {
    if (expanded === null && ativos.length > 0) {
      setExpanded(ativos.find(p => p.saude !== "On-Track")?.id ?? ativos[0].id);
    }
  }, [ativos, expanded]);

  const onTrack = ativos.filter(p => p.saude === "On-Track").length;
  const alerta = ativos.filter(p => p.saude === "Alerta").length;
  const offTrack = ativos.filter(p => p.saude === "Off-Track").length;

  // Índice de Melhorias Estratégicas por projeto (usa projetoId salvo em Melhorias)
  const melhoriasByProjeto = useMemo(() => {
    const map: Record<string, typeof melhorias> = {};
    melhorias.forEach(m => {
      if (!m.projetoId) return;
      (map[m.projetoId] ||= []).push(m);
    });
    return map;
  }, [melhorias]);

  const melhoriasStats = useMemo(() => {
    const hoje = new Date();
    const emAndamento = melhorias.filter(m => m.status === "Em Andamento").length;
    const concluidas = melhorias.filter(m => m.status === "Concluído").length;
    const atrasadas = melhorias.filter(m => {
      if (m.status === "Concluído" || m.status === "Pausado") return false;
      if (!m.dataPrevista) return false;
      return new Date(m.dataPrevista) < hoje;
    }).length;
    const validacao = melhorias.filter(m => m.status === "Validação").length;
    return { total: melhorias.length, emAndamento, concluidas, atrasadas, validacao };
  }, [melhorias]);

  const draftOf = (codigo: string) => {
    const d = drafts[codigo];
    if (d) return d;
    const uuid = codigoToUuid[codigo];
    const sr = uuid ? latestByUuid[uuid] : undefined;
    const proj = ativos.find(p => p.id === codigo);
    return {
      avancos: sr?.avancos ?? proj?.avancos ?? "",
      desvios: sr?.desvios ?? "",
      causa_raiz: sr?.causa_raiz ?? proj?.causaRaiz ?? "",
      plano_acao: sr?.plano_acao ?? proj?.planoAcao ?? "",
      farois_dimensoes: faroisParaEdicao(sr?.farois_dimensoes, proj?.desvios),
    };
  };

  const setDraft = (codigo: string, patch: Partial<DraftSR>) => {
    const current = draftOf(codigo);
    setSaveError(prev => ({ ...prev, [codigo]: "" }));
    setDrafts(prev => ({ ...prev, [codigo]: { ...current, ...patch } }));
  };

  const salvar = (codigo: string) => saveGuard.current(async () => {
    const uuid = codigoToUuid[codigo];
    if (!uuid) return toast.error("Projeto ainda não sincronizado no banco.");
    const proj = ativos.find(p => p.id === codigo);
    const d = draftOf(codigo);
    setSaving(codigo);
    setSaveError(prev => ({ ...prev, [codigo]: "" }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const periodoStr = `${periodo} · ${new Date().toLocaleDateString("pt-BR")}`;
      const { error } = await supabase.from("status_reports").insert({
        projeto_id: uuid, periodo: periodoStr,
        avancos: d.avancos || null, desvios: d.desvios || null,
        saude: proj?.saude ?? null, causa_raiz: d.causa_raiz || null,
        plano_acao: d.plano_acao || null, farois_dimensoes: d.farois_dimensoes,
        reportado_por: user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Atualização e faróis salvos no histórico do projeto");
      setDrafts(prev => { const cp = { ...prev }; delete cp[codigo]; return cp; });
      await loadStatusReports();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Não foi possível salvar a atualização.";
      setSaveError(prev => ({ ...prev, [codigo]: mensagem }));
      toast.error(mensagem);
    } finally { setSaving(null); }
  });

  const ultimaAtualizacaoGlobal = useMemo(() => {
    const datas = Object.values(latestByUuid).map(r => r.created_at).filter(Boolean);
    if (datas.length === 0) return null;
    return new Date(datas.sort().reverse()[0]);
  }, [latestByUuid]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização:{" "}
            <span className="font-semibold text-foreground">
              {ultimaAtualizacaoGlobal ? ultimaAtualizacaoGlobal.toLocaleString("pt-BR") : "—"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5 bg-background">
            {periodos.map(p => (
              <Button key={p} size="sm" variant={periodo === p ? "default" : "ghost"} aria-pressed={periodo === p} onClick={() => setPeriodo(p)}>{p}</Button>
            ))}
          </div>
          <Button onClick={() => setParecerOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <FilePlus2 className="h-4 w-4" /> Adicionar Parecer
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => toast.success("Relatório PDF gerado")}><Download className="h-4 w-4" /> Gerar PDF</Button>
        </div>
      </div>

      <ParecerDialog open={parecerOpen} onOpenChange={setParecerOpen} />

      {/* Semáforo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SemaforoCard icon={CircleDot} title="On-Track" subtitle="Projetos no prazo" value={onTrack} tone="success" />
        <SemaforoCard icon={AlertCircle} title="Alerta Médio" subtitle="Desvios gerenciáveis" value={alerta} tone="warning" />
        <SemaforoCard icon={ShieldAlert} title="Off-Track" subtitle="Desvios críticos" value={offTrack} tone="destructive" />
      </div>

      {/* Melhorias Estratégicas · sincronizado com página Melhorias */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Melhorias Estratégicas · Situação Atual</h3>
          </div>
          <Link to="/melhorias" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            Abrir Gestão de Melhorias <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-md border border-border p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
            <div className="text-2xl font-semibold tabular-nums">{melhoriasStats.total}</div>
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-blue-700">Em Andamento</div>
            <div className="text-2xl font-semibold tabular-nums text-blue-800">{melhoriasStats.emAndamento}</div>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-amber-700">Em Validação</div>
            <div className="text-2xl font-semibold tabular-nums text-amber-800">{melhoriasStats.validacao}</div>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-emerald-700">Concluídas</div>
            <div className="text-2xl font-semibold tabular-nums text-emerald-800">{melhoriasStats.concluidas}</div>
          </div>
          <div className={cn("rounded-md border p-3", melhoriasStats.atrasadas > 0 ? "border-destructive/30 bg-destructive/10" : "border-border")}>
            <div className={cn("text-[10px] uppercase tracking-wider", melhoriasStats.atrasadas > 0 ? "text-destructive" : "text-muted-foreground")}>Atrasadas</div>
            <div className={cn("text-2xl font-semibold tabular-nums", melhoriasStats.atrasadas > 0 && "text-destructive")}>{melhoriasStats.atrasadas}</div>
          </div>
        </div>
      </Card>


      {/* Resumo de avanços por projeto */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Resumo de Avanços do Período · por Projeto</h3>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {loadingSR && <Loader2 className="h-3 w-3 animate-spin" />}
            Sincronizado com Gestão de Projetos
          </span>
        </div>
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {ativos.map(p => {
            const uuid = codigoToUuid[p.id];
            const sr = uuid ? latestByUuid[uuid] : undefined;
            const d = draftOf(p.id);
            return (
              <div key={p.id} className="border border-border rounded-md p-3 bg-surface-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground tabular-nums">{p.id}</span>
                  <span className="font-medium text-sm flex-1 truncate">{p.nome}</span>
                  <SaudeBadge saude={p.saude} />
                  {sr && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      · atualizado {new Date(sr.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <Textarea
                  aria-label={`Principais avanços · ${p.id}`}
                  rows={2}
                  className="text-sm"
                  placeholder="Principais avanços do período…"
                  value={d.avancos}
                  onChange={e => setDraft(p.id, { avancos: e.target.value })}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Projetos ativos */}
      <div>
        <h3 className="font-semibold mb-3 px-1">Projetos Ativos · Atualização do Período</h3>
        <div className="space-y-3">
          {ativos.map(p => {
            const isOpen = expanded === p.id;
            const uuid = codigoToUuid[p.id];
            const sr = uuid ? latestByUuid[uuid] : undefined;
            const d = draftOf(p.id);
            const dirty = !!drafts[p.id];
            return (
              <Card key={p.id} className="shadow-card overflow-hidden">
                <Button variant="ghost" aria-expanded={isOpen} aria-controls={`report-${p.id}`} onClick={() => setExpanded(isOpen ? null : p.id)} className="w-full h-auto whitespace-normal flex items-center justify-between p-4 hover:bg-surface-muted/50 transition-colors">
                  <div className="flex min-w-0 flex-wrap items-center gap-3 text-left">
                    <div className="text-xs text-muted-foreground tabular-nums">{p.id}</div>
                    <div className="font-semibold">{p.nome}</div>
                    <SaudeBadge saude={p.saude} />
                    {sr ? (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <History className="h-3 w-3" />
                        Última atualização: {new Date(sr.created_at).toLocaleDateString("pt-BR")} · {sr.periodo}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Sem atualização registrada</span>
                    )}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </Button>
                {isOpen && (
                  <div id={`report-${p.id}`} className="px-5 pb-5 pt-1 space-y-5 animate-fade-in border-t border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        Cada salvamento gera um registro histórico visível em <strong>Gestão do Projeto → Status Reports</strong>.
                      </span>
                      <Link
                        to={`/gestao/${p.id}`}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Abrir Gestão do Projeto <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    <FormField id={`sr-${p.id}-avancos`} label="Principais avanços do período">
                      <Textarea rows={2} value={d.avancos} disabled={saving === p.id} onChange={e => setDraft(p.id, { avancos: e.target.value })} />
                    </FormField>
                    <FormField id={`sr-${p.id}-desvios`} label="Desvios do período">
                      <Textarea rows={2} placeholder="Descreva os desvios observados no período…" value={d.desvios} disabled={saving === p.id} onChange={e => setDraft(p.id, { desvios: e.target.value })} />
                    </FormField>
                    <fieldset className="min-w-0 space-y-2" disabled={saving === p.id}>
                      <legend className="text-xs font-semibold uppercase text-muted-foreground">Desvios críticos · Faróis</legend>
                      <div className="divide-y divide-border rounded-md border border-border">
                        {d.farois_dimensoes.map((dd, index) => <div key={dd.dimensao} className="grid gap-2 p-3 sm:grid-cols-[8rem_10rem_1fr] sm:items-center">
                          <span className="text-sm font-medium">{dd.dimensao}</span>
                          <FarolPicker dimensao={dd.dimensao} value={dd.status} disabled={saving === p.id} onChange={status => setDraft(p.id, { farois_dimensoes: d.farois_dimensoes.map((f, i) => i === index ? { ...f, status } : f) })} />
                          <span className="break-words text-xs text-muted-foreground">{dd.obs}</span>
                        </div>)}
                      </div>
                    </fieldset>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField id={`sr-${p.id}-causa`} label="Causa raiz do desvio"><Textarea rows={3} value={d.causa_raiz} disabled={saving === p.id} onChange={e => setDraft(p.id, { causa_raiz: e.target.value })} /></FormField>
                      <FormField id={`sr-${p.id}-plano`} label="Plano de ação / recuperação"><Textarea rows={3} value={d.plano_acao} disabled={saving === p.id} onChange={e => setDraft(p.id, { plano_acao: e.target.value })} /></FormField>
                    </div>
                    {sr && <details className="text-xs"><summary className="cursor-pointer font-medium">Faróis do último report salvo</summary><div className="mt-2"><FaroisReportLeitura valor={sr.farois_dimensoes} /></div></details>}

                    {/* Melhorias Estratégicas vinculadas ao projeto */}
                    {(() => {
                      const melhoriasProj = melhoriasByProjeto[p.id] ?? [];
                      if (melhoriasProj.length === 0) return null;
                      const hoje = new Date();
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5" /> Melhorias Estratégicas Vinculadas
                              <span className="text-[10px] font-normal text-muted-foreground">({melhoriasProj.length})</span>
                            </label>
                            <Link to="/melhorias" className="text-[11px] text-primary hover:underline">Editar em Melhorias →</Link>
                          </div>
                          <div className="rounded-md border border-border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-surface-muted">
                                <tr>
                                  <th className="text-left px-2 py-1.5 font-semibold">O que fazer</th>
                                  <th className="text-left px-2 py-1.5 font-semibold w-28">Responsável</th>
                                  <th className="text-left px-2 py-1.5 font-semibold w-24">Prevista</th>
                                  <th className="text-left px-2 py-1.5 font-semibold w-32">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {melhoriasProj.map(m => {
                                  const atrasada = m.dataPrevista && m.status !== "Concluído" && m.status !== "Pausado" && new Date(m.dataPrevista) < hoje;
                                  return (
                                    <tr key={m.id} className="border-t border-border">
                                      <td className="px-2 py-1.5">
                                        <div className="font-medium">{m.oQueFazer}</div>
                                        <div className="text-[10px] text-muted-foreground">{m.classificacao}</div>
                                      </td>
                                      <td className="px-2 py-1.5">{m.responsavel || "—"}</td>
                                      <td className={cn("px-2 py-1.5 tabular-nums", atrasada && "text-destructive font-semibold")}>
                                        {m.dataPrevista ? new Date(m.dataPrevista).toLocaleDateString("pt-BR") : "—"}
                                        {atrasada && <div className="text-[10px]">atrasada</div>}
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}



                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold uppercase tracking-wider text-muted-foreground">Execução Financeira</span>
                        <span className="tabular-nums">R$ {p.realizado.toLocaleString("pt-BR")} / R$ {p.budget.toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.budget > 0 ? Math.min(100, (p.realizado / p.budget) * 100) : 0}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span role={saveError[p.id] ? "alert" : "status"} className="text-[11px] text-muted-foreground">
                        {saveError[p.id] ? `${saveError[p.id]} Alterações mantidas nesta tela.` : saving === p.id ? "Salvando atualização e faróis…" : dirty ? "Alterações não salvas" : sr ? `Sincronizado em ${new Date(sr.created_at).toLocaleString("pt-BR")}` : "Nenhuma atualização registrada ainda"}
                      </span>
                      <Button
                        onClick={() => salvar(p.id)}
                        disabled={saving !== null || !codigoToUuid[p.id]}
                        className="bg-success hover:bg-success/90 text-success-foreground gap-2"
                      >
                        {saving === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        Salvar Atualização
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Forecast */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Forecast do Próximo Ciclo</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Novos projetos previstos</div>
            <ul className="space-y-1.5">
              {["Plataforma de Provas com IA","Centro de Simulação ITC + IA","Lead Score Avançado","Branding LM"].map(n => (
                <li key={n} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {n}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Evoluções esperadas</div>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Credenciamento MEC: aprovação parcial MEC esperada</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Squad de IA: kickoff do esquadrão</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> Clube da Liberdade: replan completo</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SemaforoCard({ icon: Icon, title, subtitle, value, tone }: any) {
  const map: Record<string, string> = {
    success: "bg-success-soft border-success/30 text-success",
    warning: "bg-warning-soft border-warning/40 text-warning-foreground",
    destructive: "bg-destructive/10 border-destructive/30 text-destructive",
  };
  return (
    <Card className={cn("p-5 border-2 shadow-card", map[tone])}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold opacity-80">{title}</div>
          <div className="text-4xl font-bold tabular-nums mt-1">{value}</div>
          <div className="text-xs opacity-70 mt-1">{subtitle}</div>
        </div>
        <Icon className="h-7 w-7 opacity-70" />
      </div>
    </Card>
  );
}

function FarolPicker({ value, dimensao, onChange, disabled }: { value: CorFarol; dimensao: string; onChange: (cor: CorFarol) => void; disabled: boolean }) {
  return <div className="space-y-1" role="group" aria-label={`Farol de ${dimensao}`}>
    <div className="flex gap-1">
      {(["verde", "amarelo", "vermelho"] as const).map(c => <Button key={c} type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`${dimensao}: ${c}`} aria-pressed={value === c} onClick={() => onChange(c)} className="h-9 w-9">
        <span aria-hidden="true" className={cn("h-4 w-4 rounded-full border", farolColor[c], value === c ? "ring-2 ring-offset-2 ring-foreground/40" : "opacity-40")} />
      </Button>)}
    </div>
    <span className="text-xs text-muted-foreground">{value}</span>
  </div>;
}
