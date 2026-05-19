import { useMemo, useState } from "react";
import { useProcessosDB } from "@/hooks/useProcessosDB";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search, ArrowLeft, FileCheck2, Workflow, Target, ListChecks,
  Play, Repeat, PackageCheck, Flag, Sparkles, Send, Loader2, ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "gestao-processos-v1";

type MapaAtividade = {
  id: string; codigo: string; atividade: string;
  responsavel?: string; sistema?: string; tempo?: string;
  agregaValor?: string; observacao?: string;
};

type ProcessoData = {
  escopo?: {
    objetivo?: string;
    escopoIncluso?: string;
    escopoExcluso?: string;
    patrocinador?: string;
    ownerProcesso?: string;
    entregasEsperadas?: string;
    premissas?: string;
    restricoes?: string;
  };
  asIs?: MapaAtividade[];
};

const statusColors: Record<string, string> = {
  "REVISÃO CONCLUÍDA VIGENTE": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "APROVAÇÃO DIRETORIA": "bg-orange-500/15 text-orange-700 border-orange-500/30",
  "VALIDAÇÃO INTERNA": "bg-cyan-500/15 text-cyan-700 border-cyan-500/30",
  "MAPEAMENTO": "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

function loadAllData(): Record<string, ProcessoData> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export default function ProcessosPublicados() {
  const { data: processos, loading } = useProcessosDB();
  const allData = useMemo(() => loadAllData(), []);
  const [search, setSearch] = useState("");
  const [filterNivel, setFilterNivel] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("vigentes");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return processos.filter(p => {
      if (filterStatus === "vigentes" && p.status !== "REVISÃO CONCLUÍDA VIGENTE") return false;
      if (filterNivel !== "todos" && p.nivel !== filterNivel) return false;
      if (q && !p.nome.toLowerCase().includes(q) && !(p.dono ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [processos, search, filterNivel, filterStatus]);

  const selected = processos.find(p => p.id === selectedId);
  const data: ProcessoData = (selectedId && allData[selectedId]) || {};

  if (selectedId && selected) {
    return <DetalheProcesso processo={selected} data={data} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar processo ou dono..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterNivel} onValueChange={setFilterNivel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os níveis</SelectItem>
              <SelectItem value="Finalístico">Finalístico</SelectItem>
              <SelectItem value="Gerencial">Gerencial</SelectItem>
              <SelectItem value="Suporte">Suporte</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vigentes">Apenas vigentes</SelectItem>
              <SelectItem value="todos">Todos os status</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground self-center">
            {loading ? "Carregando…" : `${filtered.length} processo(s) publicado(s)`}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className="text-left p-4 rounded-lg border border-border bg-card hover:bg-surface-muted hover:border-primary/50 transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-medium text-sm leading-snug group-hover:text-primary line-clamp-2">{p.nome}</div>
              <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {p.nivel && <Badge variant="outline" className="text-[10px]">{p.nivel}</Badge>}
              <Badge variant="outline" className={`text-[10px] ${statusColors[p.status] || ""}`}>{p.status}</Badge>
              {p.revisao != null && <Badge variant="secondary" className="text-[10px]">Rev. {p.revisao}</Badge>}
            </div>
            <div className="text-xs text-muted-foreground">Dono: {p.dono || "—"}</div>
          </button>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-12">
            Nenhum processo encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}

function DetalheProcesso({ processo, data, onBack }: { processo: any; data: ProcessoData; onBack: () => void }) {
  const asIs = data.asIs || [];
  const escopo = data.escopo || {};

  // Resumo do fluxo: início, iterações (miolo), entrega (penúltima), fim
  const inicio = asIs[0];
  const fim = asIs[asIs.length - 1];
  const entrega = asIs.length >= 3 ? asIs[asIs.length - 2] : undefined;
  const iteracoes = asIs.length > 2 ? asIs.slice(1, asIs.length - 2) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div>
            <div className="text-lg font-semibold leading-tight flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-600" />
              {processo.nome}
            </div>
            <div className="text-xs text-muted-foreground">
              {processo.nivel} · Diretor: {processo.diretor} · Dono: {processo.dono}
              {processo.revisao != null && <> · Última revisão: <span className="font-medium">v{processo.revisao}</span></>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[processo.status] || ""}>{processo.status}</Badge>
          <SolicitarMelhoriaDialog processoId={processo.id} processoNome={processo.nome} />
        </div>
      </div>

      {(processo.imagemFluxoUrl || processo.kpiNome) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {processo.imagemFluxoUrl && (
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Fluxo do processo</CardTitle></CardHeader>
              <CardContent>
                <img src={processo.imagemFluxoUrl} alt={`Fluxo ${processo.nome}`} className="w-full max-h-[320px] object-contain rounded border" />
              </CardContent>
            </Card>
          )}
          {processo.kpiNome && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Entrega de Valor</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-[11px] uppercase text-muted-foreground">Métrica / KPI</div><div className="font-medium">{processo.kpiNome}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground">Unidade</div><div>{processo.kpiUnidade || "—"}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground">Meta</div><div>{processo.kpiMeta ?? "—"}{processo.kpiMeta != null ? processo.kpiUnidade || "" : ""}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground">Valor atual</div><div className="font-semibold">{processo.kpiValor ?? "—"}{processo.kpiValor != null ? processo.kpiUnidade || "" : ""}</div></div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo"><Workflow className="h-3.5 w-3.5 mr-1" />Resumo do fluxo</TabsTrigger>
          <TabsTrigger value="escopo"><Target className="h-3.5 w-3.5 mr-1" />Objetivo &amp; Escopo</TabsTrigger>
          <TabsTrigger value="asis"><ListChecks className="h-3.5 w-3.5 mr-1" />AS-IS (v{processo.revisao ?? "—"})</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fluxo resumido — versão vigente</CardTitle>
            </CardHeader>
            <CardContent>
              {asIs.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Mapeamento AS-IS ainda não publicado para este processo.
                </div>
              ) : (
                <div className="space-y-3">
                  <FluxoBloco icon={Play} cor="bg-blue-500/10 text-blue-700 border-blue-500/30"
                    titulo="Início" item={inicio} />
                  <FluxoBloco icon={Repeat} cor="bg-purple-500/10 text-purple-700 border-purple-500/30"
                    titulo={`Iterações do processo (${iteracoes.length})`}
                    items={iteracoes} />
                  {entrega && <FluxoBloco icon={PackageCheck} cor="bg-amber-500/10 text-amber-700 border-amber-500/30"
                    titulo="Entrega" item={entrega} />}
                  {fim && fim !== inicio && <FluxoBloco icon={Flag} cor="bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                    titulo="Fim" item={fim} />}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escopo">
          <Card>
            <CardHeader><CardTitle className="text-base">Objetivo &amp; Escopo</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <CampoEscopo titulo="Objetivo" valor={escopo.objetivo} />
              <CampoEscopo titulo="Patrocinador" valor={escopo.patrocinador} />
              <CampoEscopo titulo="Escopo incluso" valor={escopo.escopoIncluso} />
              <CampoEscopo titulo="Escopo excluso" valor={escopo.escopoExcluso} />
              <CampoEscopo titulo="Entregas esperadas" valor={escopo.entregasEsperadas} />
              <CampoEscopo titulo="Owner do processo" valor={escopo.ownerProcesso} />
              <CampoEscopo titulo="Premissas" valor={escopo.premissas} />
              <CampoEscopo titulo="Restrições" valor={escopo.restricoes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asis">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Mapeamento AS-IS · última revisão {processo.revisao != null ? `(v${processo.revisao})` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {asIs.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Sem atividades AS-IS publicadas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b">
                      <tr className="text-left">
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">Atividade</th>
                        <th className="py-2 pr-3">Responsável</th>
                        <th className="py-2 pr-3">Sistema</th>
                        <th className="py-2 pr-3">Tempo</th>
                        <th className="py-2 pr-3">Agrega valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asIs.map((a, i) => (
                        <tr key={a.id} className="border-b last:border-0">
                          <td className="py-2 pr-3 text-muted-foreground tabular-nums">{a.codigo || i + 1}</td>
                          <td className="py-2 pr-3">{a.atividade}</td>
                          <td className="py-2 pr-3">{a.responsavel || "—"}</td>
                          <td className="py-2 pr-3">{a.sistema || "—"}</td>
                          <td className="py-2 pr-3">{a.tempo || "—"}</td>
                          <td className="py-2 pr-3">
                            {a.agregaValor
                              ? <Badge variant="outline" className="text-[10px]">{a.agregaValor}</Badge>
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CampoEscopo({ titulo, valor }: { titulo: string; valor?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</div>
      <div className="text-sm whitespace-pre-wrap min-h-[1.5rem]">
        {valor?.trim() ? valor : <span className="text-muted-foreground italic">Não informado</span>}
      </div>
    </div>
  );
}

function FluxoBloco({
  icon: Icon, cor, titulo, item, items,
}: { icon: any; cor: string; titulo: string; item?: MapaAtividade; items?: MapaAtividade[] }) {
  return (
    <div className={`rounded-md border p-3 ${cor}`}>
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
        <Icon className="h-4 w-4" /> {titulo}
      </div>
      {item && (
        <div className="text-sm">
          <span className="font-medium">{item.codigo ? `${item.codigo} · ` : ""}</span>{item.atividade}
          {item.responsavel && <span className="text-xs text-muted-foreground"> · {item.responsavel}</span>}
        </div>
      )}
      {items && items.length > 0 && (
        <ul className="text-sm space-y-1 pl-4 list-disc">
          {items.map(it => (
            <li key={it.id}>
              <span className="font-medium">{it.codigo ? `${it.codigo} · ` : ""}</span>{it.atividade}
              {it.responsavel && <span className="text-xs text-muted-foreground"> · {it.responsavel}</span>}
            </li>
          ))}
        </ul>
      )}
      {items && items.length === 0 && (
        <div className="text-xs text-muted-foreground italic">Sem etapas intermediárias mapeadas.</div>
      )}
    </div>
  );
}

function SolicitarMelhoriaDialog({ processoId, processoNome }: { processoId: string; processoNome: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    solicitante: "",
    area: "",
    tipo: "Melhoria",
    titulo: "",
    descricao: "",
    impacto: "Médio",
    evidencias: "",
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.titulo.trim() || !form.descricao.trim()) {
      toast({ title: "Preencha título e descrição", variant: "destructive" });
      return;
    }
    setBusy(true);
    // Placeholder: futura integração Zeev → fila BPMO
    setTimeout(() => {
      setBusy(false);
      setOpen(false);
      toast({
        title: "Solicitação registrada",
        description: `“${form.titulo}” foi enviada à fila do BPMO via Zeev (modo placeholder).`,
      });
      setForm({ solicitante: "", area: "", tipo: "Melhoria", titulo: "", descricao: "", impacto: "Médio", evidencias: "" });
    }, 700);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Sparkles className="h-4 w-4" /> Solicitar melhoria
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Solicitação de melhoria — {processoNome}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Solicitante</Label>
              <Input value={form.solicitante} onChange={e => update("solicitante", e.target.value)} placeholder="Nome" />
            </div>
            <div>
              <Label>Área</Label>
              <Input value={form.area} onChange={e => update("area", e.target.value)} placeholder="Ex.: Comercial" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => update("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Melhoria">Melhoria</SelectItem>
                  <SelectItem value="Correção">Correção / não-conformidade</SelectItem>
                  <SelectItem value="Automação">Automação</SelectItem>
                  <SelectItem value="Revisão de escopo">Revisão de escopo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Impacto percebido</Label>
              <Select value={form.impacto} onValueChange={v => update("impacto", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixo">Baixo</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Crítico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Título da solicitação</Label>
            <Input value={form.titulo} onChange={e => update("titulo", e.target.value)} placeholder="Ex.: Reduzir retrabalho na etapa de validação" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={4} value={form.descricao} onChange={e => update("descricao", e.target.value)} placeholder="O que está acontecendo, onde e por quê uma melhoria é necessária." />
          </div>
          <div>
            <Label>Evidências (opcional)</Label>
            <Textarea rows={2} value={form.evidencias} onChange={e => update("evidencias", e.target.value)} placeholder="KPIs, prints, ocorrências, links…" />
          </div>
          <div className="text-[11px] text-muted-foreground rounded-md border bg-muted/40 p-2 flex items-start gap-2">
            <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Esta solicitação será encaminhada via <strong>Zeev</strong> para análise do time <strong>BPMO</strong>,
              que avaliará viabilidade, priorização e abertura de iniciativa de Melhoria Contínua.
              Vínculo ao processo <code className="text-[10px]">{processoId}</code>.
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar ao Zeev
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
