import { VISAO_MISSAO_DEF, PESTEL_DATA_DEF, PORTER_DATA_DEF, RBV_RECURSOS_DEF, SWOT_DATA_DEF, ANSOFF_DEF, ERRC_DEF, saidas_DEF } from "@/data/conteudoPadroes";
import { ConteudoRevisaoProvider, useRevisaoContexto } from "@/hooks/useConteudoRevisoes";
import RevisaoSeletor from "@/components/RevisaoSeletor";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, Plus, Compass, Target, Layers, Shield, Workflow, TrendingUp, Loader2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConteudo } from "@/hooks/useConteudo";
import { EditarConteudo } from "@/components/EditarConteudo";

type Framework = "PESTEL" | "Porter" | "RBV_VRIN" | "Oceano_Azul" | "SWOT" | "Ansoff" | "Geral";

const FRAMEWORK_META: Record<Framework, { label: string; icon: any; color: string; descr: string }> = {
  PESTEL:      { label: "PESTEL",       icon: Compass,  color: "text-info",        descr: "Macroambiente: Político, Econômico, Social, Tecnológico, Ecológico, Legal." },
  Porter:      { label: "5 Forças",     icon: Shield,   color: "text-destructive", descr: "Rivalidade, novos entrantes, substitutos, poder de clientes/fornecedores." },
  RBV_VRIN:    { label: "RBV / VRIN",   icon: Layers,   color: "text-primary",     descr: "Recursos internos e vantagem competitiva sustentável." },
  Oceano_Azul: { label: "Oceano Azul",  icon: Workflow, color: "text-success",     descr: "Matriz ERRC: Eliminar, Reduzir, Elevar, Criar." },
  SWOT:        { label: "SWOT",         icon: Target,   color: "text-warning",     descr: "Forças, Fraquezas, Oportunidades e Ameaças." },
  Ansoff:      { label: "Ansoff",       icon: TrendingUp, color: "text-accent-foreground", descr: "Penetração, desenvolvimento de mercado/produto, diversificação." },
  Geral:       { label: "Geral",        icon: Lightbulb, color: "text-muted-foreground", descr: "Insight transversal." },
};








type Insight = {
  id: string;
  framework: Framework;
  categoria: string | null;
  titulo: string;
  conteudo: string;
  evidencias: string | null;
  ai_resumo: string | null;
  ai_classificacao: any;
  ai_sugestoes: string | null;
  status: "pendente" | "aprovado" | "arquivado";
  autor_nome: string | null;
  created_at: string;
};

export default function Diagnostico() { return <ConteudoRevisaoProvider documento="diagnostico"><DiagnosticoConteudo /></ConteudoRevisaoProvider>; }

function DiagnosticoConteudo() {
  const revisaoCtx = useRevisaoContexto();
  const VISAO_MISSAO = useConteudo("diag.proposito", VISAO_MISSAO_DEF).data;
  const PESTEL_DATA = useConteudo("diag.pestel", PESTEL_DATA_DEF).data;
  const porterDados = useConteudo<any>("diag.porter", PORTER_DATA_DEF).data;
  const PORTER_DATA: any[] = Array.isArray(porterDados) ? porterDados : porterDados.forcas ?? [];
  const saidas = useConteudo("diag.saidas", saidas_DEF).data;
  const RBV_RECURSOS = useConteudo("diag.rbv", RBV_RECURSOS_DEF).data;
  const SWOT_DATA = useConteudo("diag.swot", SWOT_DATA_DEF).data;
  const ANSOFF = useConteudo<any[]>("diag.ansoff", ANSOFF_DEF).data;
  const ERRC = useConteudo("diag.errc", ERRC_DEF).data;
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFw, setFilterFw] = useState<"todos" | Framework>("todos");
  const [open, setOpen] = useState(false);

  // Form
  const [framework, setFramework] = useState<Framework>("SWOT");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [evidencias, setEvidencias] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("diagnostico_insights")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar insights");
    else setInsights((data ?? []) as Insight[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filterFw === "todos" ? insights : insights.filter(i => i.framework === filterFw),
    [insights, filterFw]
  );

  const runAI = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error("Preencha título e conteúdo antes de analisar.");
      return;
    }
    setAiLoading(true);
    setAiPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke("diagnostico-ai", {
        body: { framework, titulo, conteudo, evidencias },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiPreview(data);
      toast.success("Análise da IA gerada");
    } catch (e: any) {
      toast.error(e.message || "Falha ao chamar IA");
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async () => {
    if (!user) { toast.error("Faça login para submeter."); return; }
    if (!titulo.trim() || !conteudo.trim()) { toast.error("Preencha título e conteúdo."); return; }
    setSubmitting(true);
    const payload: any = {
      framework, titulo, conteudo, evidencias: evidencias || null,
      autor: user.id,
      autor_nome: user.user_metadata?.display_name || user.email,
      categoria: aiPreview?.categoria ?? null,
      ai_resumo: aiPreview?.resumo ?? null,
      ai_sugestoes: aiPreview?.sugestoes ?? null,
      ai_classificacao: aiPreview ? {
        relevancia: aiPreview.relevancia,
        confianca: aiPreview.confianca,
        impacto_frameworks: aiPreview.impacto_frameworks,
      } : {},
    };
    const { error } = await supabase.from("diagnostico_insights").insert(payload);
    setSubmitting(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Insight registrado!");
    setTitulo(""); setConteudo(""); setEvidencias(""); setAiPreview(null);
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <RevisaoSeletor />
      {revisaoCtx?.indisponivel ? null : <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Liberdade Médica</div>
          <h2 className="text-2xl font-semibold tracking-tight mt-0.5 flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" /> Diagnóstico Estratégico
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Registro consolidado das ferramentas de diagnóstico aplicadas (PESTEL, Porter, RBV/VRIN, Oceano Azul, SWOT, Ansoff)
            e canal aberto para novos insights — analisados com IA antes da incorporação.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Insight</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Submeter Insight ao Diagnóstico</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Framework</Label>
                  <Select value={framework} onValueChange={(v) => setFramework(v as Framework)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FRAMEWORK_META) as Framework[]).map(f => (
                        <SelectItem key={f} value={f}>{FRAMEWORK_META[f].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Resumo do insight" />
                </div>
              </div>
              <div>
                <Label>Conteúdo do insight</Label>
                <Textarea rows={5} value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Descreva sua observação, hipótese ou evidência estratégica..." />
              </div>
              <div>
                <Label>Evidências / dados de apoio (opcional)</Label>
                <Textarea rows={3} value={evidencias} onChange={(e) => setEvidencias(e.target.value)} placeholder="Links, números, fontes, depoimentos..." />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={runAI} disabled={aiLoading} className="gap-2">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiLoading ? "Analisando..." : "Analisar com IA"}
                </Button>
                <span className="text-xs text-muted-foreground">A IA classifica relevância, sugere ações e cruza com frameworks.</span>
              </div>

              {aiPreview && (
                <Card className="p-4 bg-primary/5 border-primary/30 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Análise da IA</div>
                  <p className="text-sm">{aiPreview.resumo}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">Categoria: {aiPreview.categoria}</Badge>
                    <Badge variant={aiPreview.relevancia === "alta" ? "default" : "outline"}>Relevância: {aiPreview.relevancia}</Badge>
                    <Badge variant="outline">Confiança: {aiPreview.confianca}%</Badge>
                    {aiPreview.impacto_frameworks?.map((f: string) => <Badge key={f} variant="outline">{f}</Badge>)}
                  </div>
                  <div className="text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground pt-2 border-t border-border">
                    {aiPreview.sugestoes}
                  </div>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Registrar Insight
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Propósito */}
      <Card className="p-5 shadow-card bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex justify-end -mt-2 -mr-2"><span className="ml-auto"><EditarConteudo chave="diag.proposito" padrao={VISAO_MISSAO_DEF} titulo="Propósito, BHAG e Valores" /></span></div>
        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Propósito</div>
            <p className="text-sm font-medium">{VISAO_MISSAO.proposito}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">BHAG</div>
            <p className="text-sm font-medium text-primary">{VISAO_MISSAO.bhag}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Valores</div>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {VISAO_MISSAO.valores.map(v => <li key={v}>• {v}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      {/* Principais Saídas do Diagnóstico */}
      <Card className="p-5 shadow-card border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Principais Saídas do Diagnóstico</h3><EditarConteudo chave="diag.saidas" padrao={saidas_DEF} titulo="Saídas e Síntese" />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Sínteses transversais que conectam PESTEL, Porter, RBV/VRIN, Oceano Azul, SWOT e Ansoff — base para a Formulação Estratégica.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {saidas.itens.map((s) => (
            <div key={s.titulo} className={cn("p-3 rounded-md border", s.cor)}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1">{s.titulo}</div>
              <p className="text-xs text-foreground/80 leading-relaxed">{s.texto}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-md bg-surface-muted/50 border border-border text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Síntese estratégica:</span> {saidas.sintese}
        </div>
      </Card>

      {/* Tabs por framework */}
      <Tabs defaultValue="pestel" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1.5 p-1.5 bg-primary/5 border border-primary/20 rounded-lg justify-start">
          <TabsTrigger value="pestel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium px-3.5 py-1.5 text-xs">1 · PESTEL</TabsTrigger>
          <TabsTrigger value="porter" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium px-3.5 py-1.5 text-xs">2 · Porter</TabsTrigger>
          <TabsTrigger value="swot" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium px-3.5 py-1.5 text-xs">3 · SWOT</TabsTrigger>
          <TabsTrigger value="rbv" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium px-3.5 py-1.5 text-xs">4 · RBV/VRIN</TabsTrigger>
          <TabsTrigger value="oceano" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium px-3.5 py-1.5 text-xs">5 · Oceano Azul</TabsTrigger>
          <TabsTrigger value="ansoff" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium px-3.5 py-1.5 text-xs">6 · Ansoff</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium px-3.5 py-1.5 text-xs ml-auto">Insights ({insights.length})</TabsTrigger>
        </TabsList>

        {/* PESTEL */}
        <TabsContent value="pestel" className="mt-5">
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-1 flex items-center gap-2"><Compass className="h-4 w-4 text-info" /> Análise PESTEL <span className="ml-auto"><EditarConteudo chave="diag.pestel" padrao={PESTEL_DATA_DEF} titulo="PESTEL" /></span></h3>
            <p className="text-xs text-muted-foreground mb-4">Macroambiente — fatores externos que afetam o negócio.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(PESTEL_DATA).map(([k, items]) => (
                <Card key={k} className="p-4 bg-surface-muted/40">
                  <div className="text-xs font-semibold text-info uppercase tracking-wider mb-2">{k}</div>
                  <ul className="text-sm space-y-1">
                    {items.map(i => <li key={i} className="flex gap-2"><span className="text-info">•</span><span>{i}</span></li>)}
                  </ul>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* PORTER */}
        <TabsContent value="porter" className="mt-5">
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-1 flex items-center gap-2"><Shield className="h-4 w-4 text-destructive" /> 5 Forças de Porter <span className="ml-auto"><EditarConteudo chave="diag.porter" padrao={PORTER_DATA_DEF} titulo="5 Forças de Porter" /></span></h3>
            <p className="text-xs text-muted-foreground mb-4">Análise da competição setorial.</p>
            <div className="space-y-2">
              {PORTER_DATA.map(p => (
                <div key={p.forca} className="flex items-start gap-3 p-3 rounded-md border border-border bg-card">
                  <Badge variant={p.intensidade === "Alta" ? "destructive" : "secondary"} className="shrink-0 mt-0.5">{p.intensidade}</Badge>
                  <div>
                    <div className="font-medium text-sm">{p.forca}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.acao}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/20">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">LM × Concorrentes</div>
              <p className="text-xs">{!Array.isArray(porterDados) ? porterDados.concorrentes : "Afya — perde se LM se especializar em nicho premium. Sanar — vence se LM mantiver execução de plantão e comunidade técnica."}</p>
            </div>
          </Card>
        </TabsContent>

        {/* RBV */}
        <TabsContent value="rbv" className="mt-5">
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-1 flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> RBV / VRIN <span className="ml-auto"><EditarConteudo chave="diag.rbv" padrao={RBV_RECURSOS_DEF} titulo="RBV / VRIN" /></span></h3>
            <p className="text-xs text-muted-foreground mb-4">Recursos internos · ✔ atende plenamente · ◐ parcial · ✖ não atende.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border"><th className="text-left p-2 text-xs uppercase tracking-wider text-muted-foreground">Tipo</th><th className="text-left p-2 text-xs uppercase tracking-wider text-muted-foreground">Recurso</th><th className="text-center p-2 text-xs uppercase tracking-wider text-muted-foreground w-20">VRIN</th></tr></thead>
                <tbody>
                  {RBV_RECURSOS.map(r => (
                    <tr key={r.item} className="border-b border-border/50">
                      <td className="p-2 text-xs text-muted-foreground">{r.tipo}</td>
                      <td className="p-2 font-medium">{r.item}</td>
                      <td className="p-2 text-center text-lg">{r.vrin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 rounded-md bg-success/5 border border-success/20">
              <div className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Onde investir</div>
              <p className="text-xs">Capacidades integradas (não tecnologia pura): comunidade, método didático e governança operacional.</p>
            </div>
          </Card>
        </TabsContent>

        {/* OCEANO AZUL */}
        <TabsContent value="oceano" className="mt-5">
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-1 flex items-center gap-2"><Workflow className="h-4 w-4 text-success" /> Oceano Azul — Matriz ERRC <span className="ml-auto"><EditarConteudo chave="diag.errc" padrao={ERRC_DEF} titulo="Oceano Azul ERRC" /></span></h3>
            <p className="text-xs text-muted-foreground mb-4">Eliminar · Reduzir · Elevar · Criar.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(ERRC).map(([k, items]) => {
                const colors: Record<string, string> = { Eliminar: "destructive", Reduzir: "warning", Elevar: "info", Criar: "success" };
                const c = colors[k];
                return (
                  <Card key={k} className={cn("p-4 border-2", `border-${c}/30 bg-${c}/5`)}>
                    <div className={cn("text-xs font-bold uppercase tracking-wider mb-2", `text-${c}`)}>{k}</div>
                    <ul className="text-sm space-y-1">{items.map(i => <li key={i}>• {i}</li>)}</ul>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* SWOT */}
        <TabsContent value="swot" className="mt-5">
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-1 flex items-center gap-2"><Target className="h-4 w-4 text-warning" /> Matriz SWOT <span className="ml-auto"><EditarConteudo chave="diag.swot" padrao={SWOT_DATA_DEF} titulo="SWOT" /></span></h3>
            <p className="text-xs text-muted-foreground mb-4">Síntese estratégica — base para hipóteses e BSC.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(SWOT_DATA).map(([k, items]) => {
                const colors: Record<string, string> = { Forças: "success", Fraquezas: "destructive", Oportunidades: "info", Ameaças: "warning" };
                const c = colors[k];
                return (
                  <Card key={k} className={cn("p-4 border-l-4", `border-l-${c} bg-${c}/5`)}>
                    <div className={cn("text-xs font-bold uppercase tracking-wider mb-2", `text-${c}`)}>{k}</div>
                    <ul className="text-sm space-y-1">{items.map(i => <li key={i}>• {i}</li>)}</ul>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* ANSOFF */}
        <TabsContent value="ansoff" className="mt-5">
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Matriz Ansoff <span className="ml-auto"><EditarConteudo chave="diag.ansoff" padrao={ANSOFF_DEF} titulo="Ansoff" /></span></h3>
            <p className="text-xs text-muted-foreground mb-4">Estratégias de crescimento.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {ANSOFF.map(a => (
                <Card key={a.quad} className="p-4 bg-surface-muted/40">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{a.quad}</div>
                  <p className="text-sm">{a.ex}</p>{a.portao && <p className="text-xs mt-2"><b>Portão:</b> {a.portao}</p>}{a.peso && <Badge variant="outline" className="mt-2">{a.peso}</Badge>}
                </Card>
              ))}
            </div>
            {ANSOFF.find(a => a.nota)?.nota && <p className="text-sm text-warning mt-3">{ANSOFF.find(a => a.nota)?.nota}</p>}
          </Card>
        </TabsContent>

        {/* INSIGHTS */}
        <TabsContent value="insights" className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Filtrar:</Label>
              <Select value={filterFw} onValueChange={(v) => setFilterFw(v as any)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os frameworks</SelectItem>
                  {(Object.keys(FRAMEWORK_META) as Framework[]).map(f => (
                    <SelectItem key={f} value={f}>{FRAMEWORK_META[f].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} insight(s)</span>
          </div>

          {loading ? (
            <Card className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Carregando...</Card>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              Nenhum insight registrado ainda. Clique em <b>Novo Insight</b> para contribuir.
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map(i => {
                const meta = FRAMEWORK_META[i.framework];
                const Icon = meta.icon;
                const ai = i.ai_classificacao || {};
                return (
                  <Card key={i.id} className="p-4 shadow-card">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={cn("h-9 w-9 rounded-md grid place-items-center bg-muted", meta.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                            {i.categoria && <Badge variant="secondary" className="text-[10px]">{i.categoria}</Badge>}
                            {ai.relevancia && <Badge variant={ai.relevancia === "alta" ? "default" : "outline"} className="text-[10px]">Relevância: {ai.relevancia}</Badge>}
                            {ai.confianca != null && <Badge variant="outline" className="text-[10px]">Confiança: {ai.confianca}%</Badge>}
                          </div>
                          <h4 className="font-semibold mt-1">{i.titulo}</h4>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{i.conteudo}</p>
                          {i.evidencias && (
                            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                              <b>Evidências:</b> {i.evidencias}
                            </div>
                          )}
                          {i.ai_resumo && (
                            <div className="mt-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                              <div className="text-[10px] font-semibold uppercase text-primary mb-0.5 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Análise IA</div>
                              <p className="text-xs">{i.ai_resumo}</p>
                              {i.ai_sugestoes && <div className="text-xs whitespace-pre-wrap mt-1.5 text-muted-foreground">{i.ai_sugestoes}</div>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <div>{i.autor_nome ?? "Anônimo"}</div>
                        <div className="tabular-nums">{new Date(i.created_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </>}
    </div>
  );
}
