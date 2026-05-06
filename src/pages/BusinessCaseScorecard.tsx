import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, FileUp, CheckCircle2, AlertTriangle, ShieldAlert, RefreshCw, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Sub = any;

const COR_BG: Record<string, string> = {
  verde: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
  amarelo: "bg-amber-500/15 text-amber-700 border-amber-500/40",
  vermelho: "bg-rose-500/15 text-rose-700 border-rose-500/40",
};

const GATE_META: Record<string, { label: string; cls: string; icon: any }> = {
  saudavel: { label: "Saudável — Seguir para PMO", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40", icon: CheckCircle2 },
  condicional: { label: "Condicional — Validação executiva", cls: "bg-amber-500/15 text-amber-700 border-amber-500/40", icon: AlertTriangle },
  bloqueado: { label: "Bloqueado — Reapresentar BC", cls: "bg-rose-500/15 text-rose-700 border-rose-500/40", icon: ShieldAlert },
};

export default function BusinessCaseScorecard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<Sub[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Sub | null>(null);

  const [form, setForm] = useState<any>({
    titulo: "", proponente: "", area: "", tipo_projeto: "eficiencia",
    problema: "", hipotese: "", publico_alvo: "",
    roi_pct: "", payback_meses: "",
    pct_base_demanda: "", qualidade_fonte: "tese_interna", evidencia_demanda: "",
    risco_juridico: "verde", risco_reputacional: "verde", risco_clinico: "verde",
    peso_tecnico: "verde", sequestro_capacidade_pct: "",
    conflito_fila: "verde",
    janela_exclusividade: 1, janela_urgencia: 1, janela_custo_inacao: 1,
  });
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await supabase.from("bc_scorecard_submissoes" as any)
      .select("*").order("created_at", { ascending: false });
    setList((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!user) { toast({ title: "Faça login", variant: "destructive" }); return; }
    if (!form.titulo.trim()) { toast({ title: "Informe o título do BC", variant: "destructive" }); return; }
    setBusy(true);
    try {
      let arquivo_path = null, arquivo_nome = null, arquivo_tipo = null, arquivo_tamanho = null;
      if (file) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
        const { error } = await supabase.storage.from("business-cases").upload(path, file, { contentType: file.type });
        if (error) throw error;
        arquivo_path = path; arquivo_nome = file.name; arquivo_tipo = file.type; arquivo_tamanho = file.size;
      }

      const payload = {
        ...form,
        roi_pct: form.roi_pct === "" ? null : Number(form.roi_pct),
        payback_meses: form.payback_meses === "" ? null : Number(form.payback_meses),
        pct_base_demanda: form.pct_base_demanda === "" ? null : Number(form.pct_base_demanda),
        sequestro_capacidade_pct: form.sequestro_capacidade_pct === "" ? null : Number(form.sequestro_capacidade_pct),
        janela_exclusividade: Number(form.janela_exclusividade),
        janela_urgencia: Number(form.janela_urgencia),
        janela_custo_inacao: Number(form.janela_custo_inacao),
        arquivo_path, arquivo_nome, arquivo_tipo, arquivo_tamanho,
        created_by: user.id, status: "pendente",
      };

      const { data: ins, error: insErr } = await supabase
        .from("bc_scorecard_submissoes" as any).insert(payload).select("id").single();
      if (insErr) throw insErr;

      toast({ title: "BC submetido", description: "A IA está analisando com o ScoreCard LM…" });
      await load();
      const sid = (ins as any).id;
      analisar(sid);
    } catch (e: any) {
      toast({ title: "Erro ao submeter", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const analisar = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("bc-scorecard-analisar", { body: { submissao_id: id } });
      if (error) throw error;
      toast({ title: "Análise concluída" });
      await load();
    } catch (e: any) {
      toast({ title: "Erro na análise", description: e.message, variant: "destructive" });
      await load();
    }
  };

  const quickUpload = async (f: File) => {
    if (!user) { toast({ title: "Faça login", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const ext = f.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("business-cases").upload(path, f, { contentType: f.type });
      if (upErr) throw upErr;
      const { data: ins, error: insErr } = await supabase.from("bc_scorecard_submissoes" as any)
        .insert({
          titulo: f.name.replace(/\.[^.]+$/, ""),
          tipo_projeto: "eficiencia",
          arquivo_path: path, arquivo_nome: f.name, arquivo_tipo: f.type, arquivo_tamanho: f.size,
          created_by: user.id, status: "pendente",
        }).select("id").single();
      if (insErr) throw insErr;
      toast({ title: "Arquivo enviado", description: "A IA está extraindo os dados do BC e aplicando o ScoreCard…" });
      await load();
      analisar((ins as any).id);
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      {/* Quick upload */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div>
            <div className="font-semibold text-sm flex items-center gap-2"><FileUp className="h-4 w-4 text-primary" /> Já tem o BC pronto?</div>
            <p className="text-xs text-muted-foreground">Carregue o arquivo (PDF, DOCX, PPTX) e a IA extrai os dados e aplica o ScoreCard LM automaticamente.</p>
          </div>
          <div>
            <input id="bc-quick-file" type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,.md"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) quickUpload(f); e.currentTarget.value = ""; }} />
            <Button asChild disabled={busy} size="sm" className="gap-2">
              <label htmlFor="bc-quick-file" className="cursor-pointer">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                Carregar BC pronto
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

    <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-6">
      {/* Form */}
      <Card>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-surface-muted transition rounded-t-lg group">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-4 w-4 text-primary" /> Submeter Business Case (formulário)
                  </CardTitle>
                  <CardDescription>Preencher manualmente — análise pelo framework <b>ScoreCard LM</b>.</CardDescription>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Nome do projeto/BC" />
            </div>
            <div><Label>Proponente</Label><Input value={form.proponente} onChange={(e)=>set("proponente", e.target.value)} /></div>
            <div><Label>Área</Label><Input value={form.area} onChange={(e)=>set("area", e.target.value)} /></div>
            <div className="col-span-2">
              <Label>Tipo de projeto</Label>
              <Select value={form.tipo_projeto} onValueChange={(v)=>set("tipo_projeto", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eficiencia">Eficiência / Automação</SelectItem>
                  <SelectItem value="produto">Produto / Recorrência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Problema</Label><Textarea rows={2} value={form.problema} onChange={(e)=>set("problema", e.target.value)} /></div>
            <div className="col-span-2"><Label>Hipótese de solução</Label><Textarea rows={2} value={form.hipotese} onChange={(e)=>set("hipotese", e.target.value)} /></div>
            <div className="col-span-2"><Label>Público-alvo</Label><Input value={form.publico_alvo} onChange={(e)=>set("publico_alvo", e.target.value)} /></div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2">1. Tese Financeira</div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>ROI 24m (%)</Label><Input type="number" value={form.roi_pct} onChange={(e)=>set("roi_pct", e.target.value)} /></div>
              <div><Label>Payback (meses)</Label><Input type="number" value={form.payback_meses} onChange={(e)=>set("payback_meses", e.target.value)} /></div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2">2. Risco Institucional</div>
            <div className="grid grid-cols-3 gap-2">
              {(["risco_juridico","risco_reputacional","risco_clinico"] as const).map((k)=>(
                <div key={k}>
                  <Label className="text-[11px]">{k === "risco_juridico" ? "Jurídico" : k === "risco_reputacional" ? "Reputacional" : "Clínico"}</Label>
                  <Select value={form[k]} onValueChange={(v)=>set(k, v)}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verde">Verde</SelectItem>
                      <SelectItem value="amarelo">Amarelo</SelectItem>
                      <SelectItem value="vermelho">Vermelho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2">3. Evidência de Demanda</div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>% base ativa</Label><Input type="number" value={form.pct_base_demanda} onChange={(e)=>set("pct_base_demanda", e.target.value)} /></div>
              <div>
                <Label>Qualidade da fonte</Label>
                <Select value={form.qualidade_fonte} onValueChange={(v)=>set("qualidade_fonte", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dado_concreto">Dado concreto (NPS, ticket, pesquisa)</SelectItem>
                    <SelectItem value="benchmarking">Benchmarking / qualitativo</SelectItem>
                    <SelectItem value="tese_interna">Tese interna sem validação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Evidência (descrição)</Label><Textarea rows={2} value={form.evidencia_demanda} onChange={(e)=>set("evidencia_demanda", e.target.value)} /></div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2">4. Capacidade Operacional</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Peso técnico</Label>
                <Select value={form.peso_tecnico} onValueChange={(v)=>set("peso_tecnico", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verde">Domínio total</SelectItem>
                    <SelectItem value="amarelo">Treinamento &lt;10%</SelectItem>
                    <SelectItem value="vermelho">Treinamento ≥10% / contratação sênior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Sequestro capacidade (%)</Label><Input type="number" value={form.sequestro_capacidade_pct} onChange={(e)=>set("sequestro_capacidade_pct", e.target.value)} /></div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2">5. Trade-offs</div>
            <Select value={form.conflito_fila} onValueChange={(v)=>set("conflito_fila", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="verde">Nenhum projeto afetado</SelectItem>
                <SelectItem value="amarelo">1 projeto secundário reprogramado</SelectItem>
                <SelectItem value="vermelho">+1 ou estratégico sacrificado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Janela Estratégica (1–3)</div>
            <div className="grid grid-cols-3 gap-2">
              {(["janela_exclusividade","janela_urgencia","janela_custo_inacao"] as const).map((k)=>(
                <div key={k}>
                  <Label className="text-[11px]">{k === "janela_exclusividade" ? "Exclusividade" : k === "janela_urgencia" ? "Urgência" : "Custo inação"}</Label>
                  <Select value={String(form[k])} onValueChange={(v)=>set(k, Number(v))}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <Label>Anexar BC (opcional)</Label>
            <Input type="file" accept=".pdf,.docx,.xlsx,.pptx" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
          </div>

          <Button onClick={submit} disabled={busy} className="w-full gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Submeter e analisar com IA
          </Button>
        </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Lista + análise */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Submissões</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum BC submetido ainda.</p>}
            {list.map((s) => {
              const meta = s.ai_gate ? GATE_META[s.ai_gate] : null;
              return (
                <button key={s.id} onClick={() => setSelected(s)}
                  className={`w-full text-left p-3 rounded-md border hover:bg-surface-muted transition ${selected?.id === s.id ? "border-primary" : "border-border"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{s.titulo}</div>
                      <div className="text-xs text-muted-foreground">{s.proponente || "—"} · {new Date(s.created_at).toLocaleString("pt-BR")}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.status === "analisando" && <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />analisando</Badge>}
                      {s.status === "erro" && <Badge variant="destructive">erro</Badge>}
                      {s.status === "pendente" && <Badge variant="outline">pendente</Badge>}
                      {meta && <Badge className={`border ${meta.cls}`} variant="outline">{meta.label}</Badge>}
                      <Button size="sm" variant="ghost" onClick={(e)=>{e.stopPropagation(); analisar(s.id);}}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {selected && (
          <AnaliseDetalhe sub={selected} />
        )}
      </div>
    </div>
    </div>
  );
}

function AnaliseDetalhe({ sub }: { sub: any }) {
  const r = sub.ai_resultado || {};
  const meta = sub.ai_gate ? GATE_META[sub.ai_gate] : null;
  const Icon = meta?.icon ?? Sparkles;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{sub.titulo}</CardTitle>
            <CardDescription>{sub.proponente || "—"} · {sub.area || "—"}</CardDescription>
          </div>
          {meta && (
            <div className={`px-3 py-2 rounded-md border flex items-center gap-2 ${meta.cls}`}>
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{meta.label}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!r.gate && <p className="text-sm text-muted-foreground">Aguardando análise da IA…</p>}

        {r.resumo_executivo && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">RESUMO EXECUTIVO</div>
            <p className="text-sm whitespace-pre-wrap">{r.resumo_executivo}</p>
          </div>
        )}

        {r.janela && (
          <div className="p-3 rounded-md bg-surface-muted border">
            <div className="text-xs font-semibold text-muted-foreground mb-1">JANELA ESTRATÉGICA</div>
            <div className="text-sm"><b>{r.janela.pontos}/9</b> · {r.janela.classificacao} {r.janela.concessao_aplicada ? "· Concessão aplicada" : ""}</div>
            {r.janela.justificativa && <p className="text-xs text-muted-foreground mt-1">{r.janela.justificativa}</p>}
          </div>
        )}

        {Array.isArray(r.dimensoes) && (
          <div className="space-y-3">
            {r.dimensoes.map((d: any, i: number) => (
              <div key={i} className={`border rounded-md p-3 ${COR_BG[d.cor] ?? ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm">{d.nome} <span className="text-[10px] uppercase ml-1 opacity-70">({d.tipo})</span></div>
                  <Badge variant="outline" className="capitalize">{d.cor}</Badge>
                </div>
                {d.analise && <p className="text-xs mb-2">{d.analise}</p>}
                {Array.isArray(d.criterios) && (
                  <ul className="text-xs space-y-1">
                    {d.criterios.map((c: any, j: number) => (
                      <li key={j} className="flex gap-2">
                        <span className={`mt-0.5 inline-block h-2 w-2 rounded-full ${c.cor === "verde" ? "bg-emerald-500" : c.cor === "amarelo" ? "bg-amber-500" : "bg-rose-500"}`} />
                        <span><b>{c.nome}:</b> {c.comentario}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {(Array.isArray(r.recomendacoes) && r.recomendacoes.length > 0) && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">RECOMENDAÇÕES</div>
            <ul className="text-sm list-disc pl-5 space-y-1">{r.recomendacoes.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          </div>
        )}

        {(Array.isArray(r.plano_mitigacao) && r.plano_mitigacao.length > 0) && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">PLANO DE MITIGAÇÃO</div>
            <ul className="text-sm list-disc pl-5 space-y-1">{r.plano_mitigacao.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          </div>
        )}

        {sub.ai_erro && (
          <div className="p-3 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-700 text-sm">
            <b>Erro na análise:</b> {sub.ai_erro}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
