import { useEffect, useMemo, useState } from "react";
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

const periodos = ["Semanal", "Quinzenal", "Mensal"] as const;
type Periodo = typeof periodos[number];

const farolColor = { verde: "bg-success", amarelo: "bg-warning", vermelho: "bg-destructive" } as const;

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
};

export default function StatusReport() {
  const { data: projetos } = useProjetosDB();
  const [periodo, setPeriodo] = useState<Periodo>("Quinzenal");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [parecerOpen, setParecerOpen] = useState(false);

  // Mapa codigo → uuid do projeto no banco
  const [codigoToUuid, setCodigoToUuid] = useState<Record<string, string>>({});
  // Último status_report por projeto (chave: uuid)
  const [latestByUuid, setLatestByUuid] = useState<Record<string, LatestSR>>({});
  // Draft local por codigo
  const [drafts, setDrafts] = useState<Record<string, { avancos: string; desvios: string; causa_raiz: string; plano_acao: string }>>({});
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
        .select("id,projeto_id,periodo,avancos,desvios,saude,causa_raiz,plano_acao,created_at")
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

  // Default expanded: primeiro fora do On-Track
  useEffect(() => {
    if (expanded === null && ativos.length > 0) {
      setExpanded(ativos.find(p => p.saude !== "On-Track")?.id ?? ativos[0].id);
    }
  }, [ativos, expanded]);

  const onTrack = ativos.filter(p => p.saude === "On-Track").length;
  const alerta = ativos.filter(p => p.saude === "Alerta").length;
  const offTrack = ativos.filter(p => p.saude === "Off-Track").length;

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
    };
  };

  const setDraft = (codigo: string, patch: Partial<{ avancos: string; desvios: string; causa_raiz: string; plano_acao: string }>) => {
    const current = draftOf(codigo);
    setDrafts(prev => ({ ...prev, [codigo]: { ...current, ...patch } }));
  };

  const salvar = async (codigo: string) => {
    const uuid = codigoToUuid[codigo];
    if (!uuid) return toast.error("Projeto ainda não sincronizado no banco.");
    const proj = ativos.find(p => p.id === codigo);
    const d = draftOf(codigo);
    setSaving(codigo);
    const { data: { user } } = await supabase.auth.getUser();
    const periodoStr = `${periodo} · ${new Date().toLocaleDateString("pt-BR")}`;
    const { error } = await supabase.from("status_reports").insert({
      projeto_id: uuid,
      periodo: periodoStr,
      avancos: d.avancos || null,
      desvios: d.desvios || null,
      saude: proj?.saude ?? null,
      causa_raiz: d.causa_raiz || null,
      plano_acao: d.plano_acao || null,
      reportado_por: user?.id ?? null,
    });
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Atualização vinculada à Gestão do Projeto");
    setDrafts(prev => { const cp = { ...prev }; delete cp[codigo]; return cp; });
    loadStatusReports();
  };

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
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5 bg-background">
            {periodos.map(p => (
              <button key={p} onClick={() => setPeriodo(p)} className={cn("h-8 px-3 text-sm rounded", periodo === p ? "bg-foreground text-background" : "text-muted-foreground")}>{p}</button>
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
                <button onClick={() => setExpanded(isOpen ? null : p.id)} className="w-full flex items-center justify-between p-4 hover:bg-surface-muted/50 transition-colors">
                  <div className="flex items-center gap-3 text-left">
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
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 space-y-5 animate-fade-in border-t border-border">
                    <div className="flex items-center justify-between">
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

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Principais Avanços do Período</label>
                      <Textarea rows={2} className="mt-1.5" value={d.avancos} onChange={e => setDraft(p.id, { avancos: e.target.value })} />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desvios do Período</label>
                      <Textarea rows={2} className="mt-1.5" placeholder="Descreva os desvios observados no período…" value={d.desvios} onChange={e => setDraft(p.id, { desvios: e.target.value })} />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desvios Críticos · Faróis</label>
                      <div className="mt-2 rounded-md border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-surface-muted text-xs">
                            <tr><th className="text-left px-3 py-2 font-semibold">Dimensão</th><th className="text-left px-3 py-2 font-semibold w-24">Status</th><th className="text-left px-3 py-2 font-semibold">Observação</th></tr>
                          </thead>
                          <tbody>
                            {(p.desvios ?? [
                              { dimensao: "Escopo", status: "verde" as const, obs: "—" },
                              { dimensao: "Cronograma", status: "verde" as const, obs: "—" },
                              { dimensao: "Custo", status: "verde" as const, obs: "—" },
                              { dimensao: "Riscos", status: "verde" as const, obs: "—" },
                            ]).map(dd => (
                              <tr key={dd.dimensao} className="border-t border-border">
                                <td className="px-3 py-2 font-medium">{dd.dimensao}</td>
                                <td className="px-3 py-2"><FarolPicker value={dd.status} /></td>
                                <td className="px-3 py-2 text-muted-foreground">{dd.obs}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Causa Raiz do Desvio</label>
                        <Textarea rows={3} className="mt-1.5" value={d.causa_raiz} onChange={e => setDraft(p.id, { causa_raiz: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano de Ação / Recuperação</label>
                        <Textarea rows={3} className="mt-1.5" value={d.plano_acao} onChange={e => setDraft(p.id, { plano_acao: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold uppercase tracking-wider text-muted-foreground">Execução Financeira</span>
                        <span className="tabular-nums">R$ {p.realizado.toLocaleString("pt-BR")} / R$ {p.budget.toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.budget > 0 ? Math.min(100, (p.realizado / p.budget) * 100) : 0}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {dirty ? "Alterações não salvas" : sr ? `Sincronizado em ${new Date(sr.created_at).toLocaleString("pt-BR")}` : "Nenhuma atualização registrada ainda"}
                      </span>
                      <Button
                        onClick={() => salvar(p.id)}
                        disabled={saving === p.id || !codigoToUuid[p.id]}
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

function FarolPicker({ value }: { value: "verde" | "amarelo" | "vermelho" }) {
  const [v, setV] = useState(value);
  return (
    <div className="flex items-center gap-1">
      {(["verde","amarelo","vermelho"] as const).map(c => (
        <button key={c} onClick={() => setV(c)} className={cn("h-3.5 w-3.5 rounded-full border transition-all", farolColor[c], v === c ? "ring-2 ring-offset-1 ring-foreground/40 scale-110" : "opacity-30")} />
      ))}
    </div>
  );
}
