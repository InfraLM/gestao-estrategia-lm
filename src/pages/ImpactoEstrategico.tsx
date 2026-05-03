import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, DollarSign, Activity, Shield, Workflow, FolderKanban, Sparkles, AlertTriangle, Target, ArrowUpRight } from "lucide-react";
import { useProjetosDB } from "@/hooks/useProjetosDB";
import { useProcessosDB } from "@/hooks/useProcessosDB";
import { useRiscosInstitucionaisDB } from "@/hooks/useRiscosInstitucionaisDB";
import { objetivosBSC } from "@/data/mockData";

const PERSPECTIVA_COLOR: Record<string, string> = {
  Financeira: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  Cliente: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300",
  Processos: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
  Aprendizado: "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-300",
};

const STATUS_PESO: Record<string, number> = {
  "Concluído": 1, "Validação": 0.85, "Encerramento": 0.9,
  "Em Andamento": 0.5, "A Iniciar": 0.1, "Backlog": 0,
  "Pausado": 0.3, "Atrasado": 0.4, "Em Avaliação": 0.2, "Cancelado": 0,
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function ImpactoEstrategico() {
  const { data: projetos } = useProjetosDB();
  const { data: processos } = useProcessosDB();
  const { data: riscos } = useRiscosInstitucionaisDB();

  // Agregação por objetivo BSC
  const impactoPorObjetivo = useMemo(() => {
    return objetivosBSC.map((obj) => {
      const projsLigados = projetos.filter(p => p.objetivos?.includes(obj.id));
      const total = projsLigados.length;
      const concluidos = projsLigados.filter(p => p.status === "Concluído").length;
      const emAndamento = projsLigados.filter(p => p.status === "Em Andamento").length;
      const offTrack = projsLigados.filter(p => p.status === "Atrasado" || p.saude === "Off-Track").length;
      const budget = projsLigados.reduce((s, p) => s + (p.budget || 0), 0);
      const realizado = projsLigados.reduce((s, p) => s + (p.realizado || 0), 0);
      const avancoMedio = total
        ? Math.round((projsLigados.reduce((s, p) => s + (STATUS_PESO[p.status] ?? 0), 0) / total) * 100)
        : 0;

      const procsLigados = processos.filter(pr => (pr.vinculo?.[obj.id] ?? 0) > 0);
      const pesoProcessos = procsLigados.reduce((s, pr) => s + (pr.vinculo?.[obj.id] ?? 0), 0);
      const maturidadeMedia = procsLigados.length
        ? procsLigados.reduce((s, pr) => s + (pr.maturidade ?? 0), 0) / procsLigados.length
        : 0;

      const melhoriaContinua = projsLigados.filter(p => p.classificacao === "Melhoria Contínua" || p.classificacao === "Melhoria Contínua com EPP").length;
      const institucional = projsLigados.filter(p => p.classificacao === "Institucional").length;
      const novoProduto = projsLigados.filter(p => p.classificacao === "Novo Produto").length;

      // Risco aproximado: se objetivo é Financeiro/Cliente, soma risco financeiro relevante
      const riscoFinanceiro = riscos.reduce((s, r) => s + (r.impactoFinanceiro || 0), 0);

      return {
        ...obj,
        total, concluidos, emAndamento, offTrack,
        budget, realizado,
        avancoMedio,
        procsLigados, pesoProcessos, maturidadeMedia,
        melhoriaContinua, institucional, novoProduto,
        projsLigados,
        riscoFinanceiro,
      };
    });
  }, [projetos, processos, riscos]);

  const consolidado = useMemo(() => {
    const totalProjs = projetos.length;
    const concluidos = projetos.filter(p => p.status === "Concluído").length;
    const emAndamento = projetos.filter(p => p.status === "Em Andamento").length;
    const offTrack = projetos.filter(p => p.status === "Atrasado" || p.saude === "Off-Track").length;
    const budgetTotal = projetos.reduce((s, p) => s + (p.budget || 0), 0);
    const realizadoTotal = projetos.reduce((s, p) => s + (p.realizado || 0), 0);
    const avancoMedio = totalProjs
      ? Math.round((projetos.reduce((s, p) => s + (STATUS_PESO[p.status] ?? 0), 0) / totalProjs) * 100)
      : 0;
    const maturidadeMedia = processos.length
      ? processos.reduce((s, pr) => s + (pr.maturidade ?? 0), 0) / processos.length
      : 0;
    const riscosCriticos = riscos.filter(r => (r.impacto * r.ocorrencia) >= 12).length;
    const exposicaoFinanceira = riscos.reduce((s, r) => s + (r.impactoFinanceiro || 0), 0);

    return { totalProjs, concluidos, emAndamento, offTrack, budgetTotal, realizadoTotal, avancoMedio, maturidadeMedia, riscosCriticos, exposicaoFinanceira };
  }, [projetos, processos, riscos]);

  const perspectivas = ["Financeira", "Cliente", "Processos", "Aprendizado"];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Impacto Estratégico</h2>
          <p className="text-sm text-muted-foreground">
            Consolidação tangível (avanços, financeiro, maturidade de processos e exposição a riscos) por objetivo do BSC, alimentada em tempo real pelas bases de projetos, processos, melhorias, governança e riscos.
          </p>
        </div>

        <Tabs defaultValue="consolidado" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
            {objetivosBSC.map(o => (
              <TabsTrigger key={o.id} value={o.id} className="text-xs">
                {o.id}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* CONSOLIDADO */}
          <TabsContent value="consolidado" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard icon={FolderKanban} label="Iniciativas" value={consolidado.totalProjs} sub={`${consolidado.emAndamento} ativas · ${consolidado.concluidos} concluídas`} />
              <KpiCard icon={Activity} label="Avanço médio" value={`${consolidado.avancoMedio}%`} sub="ponderado por status" progress={consolidado.avancoMedio} />
              <KpiCard icon={DollarSign} label="Budget" value={brl(consolidado.budgetTotal)} sub={`Realizado ${brl(consolidado.realizadoTotal)}`} />
              <KpiCard icon={Workflow} label="Maturidade processos" value={consolidado.maturidadeMedia.toFixed(1)} sub={`${processos.length} processos mapeados`} />
              <KpiCard icon={AlertTriangle} label="Riscos críticos" value={consolidado.riscosCriticos} sub={brl(consolidado.exposicaoFinanceira)} tone="warning" />
            </div>

            {perspectivas.map(persp => {
              const grupo = impactoPorObjetivo.filter(o => o.perspectiva === persp);
              if (grupo.length === 0) return null;
              return (
                <Card key={persp}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Perspectiva {persp}
                      </CardTitle>
                      <Badge variant="outline" className={PERSPECTIVA_COLOR[persp]}>
                        {grupo.length} objetivos
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {grupo.map(o => (
                      <ObjetivoRow key={o.id} o={o} />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* DEEP DIVE POR OBJETIVO */}
          {impactoPorObjetivo.map(o => (
            <TabsContent key={o.id} value={o.id} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary text-primary-foreground">{o.id}</Badge>
                        <Badge variant="outline" className={PERSPECTIVA_COLOR[o.perspectiva]}>{o.perspectiva}</Badge>
                      </div>
                      <CardTitle className="text-base">{o.nome}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">{o.descricao}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard icon={FolderKanban} label="Iniciativas vinculadas" value={o.total} sub={`${o.emAndamento} em curso · ${o.concluidos} concluídas`} />
                  <KpiCard icon={Activity} label="Avanço médio" value={`${o.avancoMedio}%`} progress={o.avancoMedio} sub={o.offTrack ? `${o.offTrack} off-track` : "Sem desvios críticos"} tone={o.offTrack ? "warning" : undefined} />
                  <KpiCard icon={DollarSign} label="Investimento" value={brl(o.budget)} sub={`Realizado ${brl(o.realizado)}`} />
                  <KpiCard icon={Workflow} label="Processos suportando" value={o.procsLigados.length} sub={o.procsLigados.length ? `Maturidade média ${o.maturidadeMedia.toFixed(1)}` : "Sem processo vinculado"} />
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Mix por classificação</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <Row label="Institucional" value={o.institucional} />
                    <Row label="Melhoria Contínua / EPP" value={o.melhoriaContinua} />
                    <Row label="Novo Produto" value={o.novoProduto} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Saúde da execução</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <Row label="On-Track" value={o.projsLigados.filter(p => p.saude === "On-Track").length} tone="success" />
                    <Row label="Alerta" value={o.projsLigados.filter(p => p.saude === "Alerta").length} tone="warning" />
                    <Row label="Off-Track" value={o.projsLigados.filter(p => p.saude === "Off-Track").length} tone="destructive" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Distribuição por wave</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <Row label="W1 · Estrutura mínima" value={o.projsLigados.filter(p => p.wave === "W1").length} />
                    <Row label="W2 · Escala com controle" value={o.projsLigados.filter(p => p.wave === "W2").length} />
                    <Row label="W3 · Aceleração e diferenciação" value={o.projsLigados.filter(p => p.wave === "W3").length} />
                  </CardContent>
                </Card>
              </div>

              {o.procsLigados.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="h-4 w-4 text-primary" /> Processos que sustentam este objetivo</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-1.5">
                      {o.procsLigados
                        .sort((a, b) => (b.vinculo?.[o.id] ?? 0) - (a.vinculo?.[o.id] ?? 0))
                        .slice(0, 12)
                        .map(pr => (
                          <div key={pr.id} className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded border border-border/60 hover:bg-muted/50">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{pr.id}</span>
                              <span className="text-muted-foreground"> · {pr.nome}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {pr.maturidade != null && <span className="text-muted-foreground">M {pr.maturidade.toFixed(1)}</span>}
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">peso {pr.vinculo?.[o.id]}</Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FolderKanban className="h-4 w-4 text-primary" /> Iniciativas vinculadas ({o.total})</CardTitle></CardHeader>
                <CardContent>
                  {o.total === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma iniciativa vinculada a este objetivo ainda.</p>
                  ) : (
                    <div className="grid gap-1.5">
                      {o.projsLigados.slice(0, 30).map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded border border-border/60 hover:bg-muted/50">
                          <div className="flex-1 min-w-0 truncate">
                            <span className="font-medium">{p.id}</span>
                            <span className="text-muted-foreground"> · {p.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px]">{p.wave}</Badge>
                            <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                            {p.budget > 0 && <span className="text-muted-foreground">{brl(p.budget)}</span>}
                          </div>
                        </div>
                      ))}
                      {o.total > 30 && <p className="text-[11px] text-muted-foreground italic">… e mais {o.total - 30} iniciativas.</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function KpiCard({ icon: Icon, label, value, sub, progress, tone }: { icon: any; label: string; value: any; sub?: string; progress?: number; tone?: "warning" | "success" }) {
  const toneCls = tone === "warning" ? "text-warning-foreground" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className={`text-xl font-semibold ${toneCls}`}>{value}</div>
        {progress != null && <Progress value={progress} className="h-1" />}
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "destructive" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning-foreground" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${cls}`}>{value}</span>
    </div>
  );
}

function ObjetivoRow({ o }: { o: any }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-3 p-2 rounded border border-border/60 hover:bg-muted/40 cursor-help">
          <Badge className="bg-primary text-primary-foreground shrink-0 text-[10px]">{o.id}</Badge>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{o.nome}</div>
            <Progress value={o.avancoMedio} className="h-1 mt-1" />
          </div>
          <div className="text-right text-[11px] shrink-0 grid grid-cols-3 gap-3 items-center">
            <div>
              <div className="text-muted-foreground">Inic.</div>
              <div className="font-semibold">{o.total}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avanço</div>
              <div className="font-semibold">{o.avancoMedio}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Budget</div>
              <div className="font-semibold">{brl(o.budget)}</div>
            </div>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <p className="text-xs leading-relaxed">{o.descricao}</p>
      </TooltipContent>
    </Tooltip>
  );
}
