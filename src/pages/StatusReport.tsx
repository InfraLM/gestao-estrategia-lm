import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Download, CircleDot, AlertCircle, ShieldAlert, Sparkles } from "lucide-react";
import { projetos } from "@/data/mockData";
import { SaudeBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const periodos = ["Semanal", "Quinzenal", "Mensal"] as const;
type Periodo = typeof periodos[number];

const farolColor = { verde: "bg-success", amarelo: "bg-warning", vermelho: "bg-destructive" } as const;

export default function StatusReport() {
  const [periodo, setPeriodo] = useState<Periodo>("Quinzenal");
  const [expanded, setExpanded] = useState<string | null>(projetos.find(p => p.saude !== "On-Track")?.id ?? null);

  const ativos = projetos.filter(p => p.status === "Em Andamento" || p.status === "Em Avaliação");
  const onTrack = ativos.filter(p => p.saude === "On-Track").length;
  const alerta = ativos.filter(p => p.saude === "Alerta").length;
  const offTrack = ativos.filter(p => p.saude === "Off-Track").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mt-1">Última atualização: <span className="font-semibold text-foreground">30/04/2026</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5 bg-background">
            {periodos.map(p => (
              <button key={p} onClick={() => setPeriodo(p)} className={cn("h-8 px-3 text-sm rounded", periodo === p ? "bg-foreground text-background" : "text-muted-foreground")}>{p}</button>
            ))}
          </div>
          <Button variant="outline" className="gap-2" onClick={() => toast.success("Relatório PDF gerado")}><Download className="h-4 w-4" /> Gerar PDF</Button>
        </div>
      </div>

      {/* Semáforo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SemaforoCard icon={CircleDot} title="On-Track" subtitle="Projetos no prazo" value={onTrack} tone="success" />
        <SemaforoCard icon={AlertCircle} title="Alerta Médio" subtitle="Desvios gerenciáveis" value={alerta} tone="warning" />
        <SemaforoCard icon={ShieldAlert} title="Off-Track" subtitle="Desvios críticos" value={offTrack} tone="destructive" />
      </div>

      {/* Resumo de avanços */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Resumo de Avanços do Período</h3>
          <span className="text-xs text-muted-foreground">Editável pelo PMO</span>
        </div>
        <Textarea rows={4} className="text-sm" defaultValue="• Credenciamento MEC: Planta baixa aprovada internamente.&#10;• Imersão SP: Contratação de manequins concluída.&#10;• Squad de IA: Definição do líder técnico em curso.&#10;• Orçamento 2026 ZBB: 70% das áreas concluíram input." />
      </Card>

      {/* Projetos ativos */}
      <div>
        <h3 className="font-semibold mb-3 px-1">Projetos Ativos · Atualização do Período</h3>
        <div className="space-y-3">
          {ativos.map(p => {
            const isOpen = expanded === p.id;
            return (
              <Card key={p.id} className="shadow-card overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : p.id)} className="w-full flex items-center justify-between p-4 hover:bg-surface-muted/50 transition-colors">
                  <div className="flex items-center gap-3 text-left">
                    <div className="text-xs text-muted-foreground tabular-nums">{p.id}</div>
                    <div className="font-semibold">{p.nome}</div>
                    <SaudeBadge saude={p.saude} />
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 space-y-5 animate-fade-in border-t border-border">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Principais Avanços do Período</label>
                      <Textarea rows={2} className="mt-1.5" defaultValue={p.avancos ?? ""} />
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
                            ]).map(d => (
                              <tr key={d.dimensao} className="border-t border-border">
                                <td className="px-3 py-2 font-medium">{d.dimensao}</td>
                                <td className="px-3 py-2"><FarolPicker value={d.status} /></td>
                                <td className="px-3 py-2 text-muted-foreground">{d.obs}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {(p.causaRaiz || p.saude !== "On-Track") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Causa Raiz do Desvio</label>
                          <Textarea rows={3} className="mt-1.5" defaultValue={p.causaRaiz ?? ""} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano de Ação / Recuperação</label>
                          <Textarea rows={3} className="mt-1.5" defaultValue={p.planoAcao ?? ""} />
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold uppercase tracking-wider text-muted-foreground">Execução Financeira</span>
                        <span className="tabular-nums">R$ {p.realizado.toLocaleString("pt-BR")} / R$ {p.budget.toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.budget > 0 ? Math.min(100, (p.realizado / p.budget) * 100) : 0}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => toast.success("Atualização salva")} className="bg-success hover:bg-success/90 text-success-foreground">Salvar Atualização</Button>
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
