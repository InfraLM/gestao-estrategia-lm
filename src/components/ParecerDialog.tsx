import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, Mic, Upload, Sparkles, Loader2, CheckCircle2, AlertTriangle,
  ListChecks, ArrowRight, X, FileAudio, FileType,
} from "lucide-react";
import { projetos, type Projeto } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ParecerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (updates: ExtractedInsight[]) => void;
}

export interface ExtractedInsight {
  projetoId: string;
  projetoNome: string;
  avancos: string[];
  novoStatusSugerido?: string;
  novoFarol?: { dimensao: string; status: "verde" | "amarelo" | "vermelho"; obs: string }[];
  sugestaoBacklog?: string;
  selected: boolean;
}

type Step = "input" | "processing" | "review";

export function ParecerDialog({ open, onOpenChange, onApply }: ParecerDialogProps) {
  const [step, setStep] = useState<Step>("input");
  const [tab, setTab] = useState<"texto" | "arquivo" | "audio">("texto");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [insights, setInsights] = useState<ExtractedInsight[]>([]);

  const reset = () => {
    setStep("input");
    setTitulo("");
    setConteudo("");
    setArquivos([]);
    setInsights([]);
    setTab("texto");
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setArquivos(prev => [...prev, ...Array.from(files)]);
  };

  const canProcess =
    (tab === "texto" && conteudo.trim().length > 20) ||
    (tab === "arquivo" && arquivos.length > 0) ||
    (tab === "audio" && arquivos.length > 0);

  const processarParecer = async () => {
    setStep("processing");
    // Simulação de processamento por IA (extração de avanços e sugestões)
    await new Promise(r => setTimeout(r, 1800));

    // Mock: identifica projetos ativos mencionados e gera insights
    const ativos = projetos.filter(p => p.status === "Em Andamento" || p.status === "Em Avaliação" || p.status === "Atrasado");
    const candidatos = ativos.slice(0, 4);

    const mock: ExtractedInsight[] = candidatos.map((p, i) => buildMockInsight(p, i));
    setInsights(mock);
    setStep("review");
    toast.success("Parecer analisado pela IA", { description: `${mock.length} projetos com avanços identificados` });
  };

  const aplicar = () => {
    const selecionados = insights.filter(i => i.selected);
    if (selecionados.length === 0) {
      toast.error("Selecione pelo menos uma atualização");
      return;
    }
    onApply?.(selecionados);
    toast.success(`${selecionados.length} status report(s) atualizados`, {
      description: "Sugestão de alteração do backlog estratégico submetida ao PMO",
    });
    handleClose(false);
  };

  const toggleInsight = (idx: number) =>
    setInsights(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Adicionar Parecer · Análise por IA
          </DialogTitle>
          <DialogDescription>
            Envie atas de reunião, gravações, textos ou arquivos. A IA extrai os avanços, sugere alterações no backlog estratégico e atualiza o status dos projetos já iniciados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          {step === "input" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Título do Parecer</Label>
                <Input id="titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Comitê Quinzenal · 30/04/2026" className="mt-1.5" />
              </div>

              <Tabs value={tab} onValueChange={v => setTab(v as any)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="texto" className="gap-2"><FileText className="h-4 w-4" /> Texto / Ata</TabsTrigger>
                  <TabsTrigger value="arquivo" className="gap-2"><FileType className="h-4 w-4" /> Documentos</TabsTrigger>
                  <TabsTrigger value="audio" className="gap-2"><Mic className="h-4 w-4" /> Gravações</TabsTrigger>
                </TabsList>

                <TabsContent value="texto" className="mt-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Conteúdo da reunião / observações</Label>
                  <Textarea
                    rows={10}
                    value={conteudo}
                    onChange={e => setConteudo(e.target.value)}
                    placeholder="Cole aqui a ata, transcrição ou anotações da reunião. A IA identificará automaticamente os projetos mencionados e extrairá os avanços do período…"
                    className="mt-1.5 text-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2">{conteudo.length} caracteres · mínimo 20 para análise</p>
                </TabsContent>

                <TabsContent value="arquivo" className="mt-4">
                  <FileDropzone
                    accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.csv"
                    icon={FileType}
                    label="Atas, planilhas, PDFs, documentos"
                    files={arquivos}
                    onFiles={handleFiles}
                    onRemove={(i) => setArquivos(prev => prev.filter((_, idx) => idx !== i))}
                  />
                </TabsContent>

                <TabsContent value="audio" className="mt-4">
                  <FileDropzone
                    accept="audio/*,video/*"
                    icon={FileAudio}
                    label="Gravações de reunião (MP3, MP4, WAV, M4A)"
                    files={arquivos}
                    onFiles={handleFiles}
                    onRemove={(i) => setArquivos(prev => prev.filter((_, idx) => idx !== i))}
                  />
                  <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    A IA fará a transcrição automática e extrairá os trechos relevantes por projeto.
                  </p>
                </TabsContent>
              </Tabs>

              <Card className="p-3 bg-info/5 border-info/20">
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">O que a IA fará:</p>
                    <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                      <li>Identificar os projetos ativos mencionados no parecer</li>
                      <li>Extrair os principais avanços do período por projeto</li>
                      <li>Sugerir alterações no backlog estratégico</li>
                      <li>Propor atualização de faróis (Escopo, Cronograma, Custo, Riscos)</li>
                      <li>Submeter atualização do status report dos projetos já iniciados</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === "processing" && (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold">Analisando parecer…</p>
                <p className="text-sm text-muted-foreground mt-1">Identificando projetos, extraindo avanços e gerando sugestões.</p>
              </div>
              <div className="w-full max-w-sm space-y-2 text-xs text-left">
                <ProcessStep label="Pré-processando conteúdo" done />
                <ProcessStep label="Identificando projetos ativos" done />
                <ProcessStep label="Extraindo avanços do período" loading />
                <ProcessStep label="Gerando sugestões para o backlog" />
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {insights.length} projetos identificados
                  </p>
                  <p className="text-xs text-muted-foreground">Revise as atualizações sugeridas e selecione quais aplicar ao Status Report.</p>
                </div>
                <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> IA</Badge>
              </div>

              <div className="space-y-3">
                {insights.map((it, idx) => (
                  <Card key={it.projetoId} className={cn("p-4 transition-all", it.selected ? "border-primary/40 bg-primary/[0.02]" : "")}>
                    <div className="flex items-start gap-3">
                      <Checkbox checked={it.selected} onCheckedChange={() => toggleInsight(idx)} className="mt-1" />
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground tabular-nums">{it.projetoId}</span>
                            <span className="font-semibold">{it.projetoNome}</span>
                          </div>
                          {it.novoStatusSugerido && (
                            <Badge className="bg-info/10 text-info border-info/30 hover:bg-info/10">
                              <ArrowRight className="h-3 w-3 mr-1" /> {it.novoStatusSugerido}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <ListChecks className="h-3 w-3" /> Avanços extraídos
                          </p>
                          <ul className="space-y-1 text-sm">
                            {it.avancos.map((a, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="h-1 w-1 rounded-full bg-success mt-2 shrink-0" />
                                <span>{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {it.novoFarol && it.novoFarol.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Atualização de faróis</p>
                            <div className="flex flex-wrap gap-1.5">
                              {it.novoFarol.map((f, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted">
                                  <span className={cn("h-2 w-2 rounded-full",
                                    f.status === "verde" && "bg-success",
                                    f.status === "amarelo" && "bg-warning",
                                    f.status === "vermelho" && "bg-destructive",
                                  )} />
                                  <span className="font-medium">{f.dimensao}</span>
                                  <span className="text-muted-foreground">· {f.obs}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {it.sugestaoBacklog && (
                          <div className="p-2.5 rounded-md bg-warning/5 border border-warning/20 text-xs flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-warning-foreground shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">Sugestão de backlog estratégico:</span>{" "}
                              <span className="text-muted-foreground">{it.sugestaoBacklog}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4 mt-2">
          {step === "input" && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button onClick={processarParecer} disabled={!canProcess} className="gap-2">
                <Sparkles className="h-4 w-4" /> Analisar com IA
              </Button>
            </>
          )}
          {step === "processing" && (
            <Button variant="outline" disabled className="ml-auto">Processando…</Button>
          )}
          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>Voltar</Button>
              <Button onClick={aplicar} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle2 className="h-4 w-4" /> Aplicar {insights.filter(i => i.selected).length} atualizações
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FileDropzone({
  accept, icon: Icon, label, files, onFiles, onRemove,
}: {
  accept: string; icon: any; label: string;
  files: File[]; onFiles: (f: FileList | null) => void; onRemove: (i: number) => void;
}) {
  return (
    <div>
      <label className="block">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 hover:bg-surface-muted/30 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Clique ou arraste arquivos</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          <input type="file" multiple accept={accept} className="hidden" onChange={e => onFiles(e.target.files)} />
        </div>
      </label>
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm bg-muted/40 rounded-md px-3 py-2">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProcessStep({ label, done, loading }: { label: string; done?: boolean; loading?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", !done && !loading && "opacity-40")}>
      {done ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        : loading ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
        : <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />}
      <span>{label}</span>
    </div>
  );
}

// ====================================================================
// Mock de geração de insights (simula análise por IA do parecer)
// ====================================================================
function buildMockInsight(p: Projeto, i: number): ExtractedInsight {
  const variants = [
    {
      avancos: [
        "Equipe definiu marco intermediário para validação técnica em 15/05.",
        "Validação positiva com 3 stakeholders chave durante a reunião.",
        "Risco mitigado com aprovação prévia da diretoria.",
      ],
      farol: [
        { dimensao: "Cronograma", status: "verde" as const, obs: "Recuperado" },
        { dimensao: "Riscos", status: "amarelo" as const, obs: "Dependência externa" },
      ],
      backlog: "Antecipar entrega da fase 2 para Q3/2026 dada disponibilidade de recursos.",
    },
    {
      avancos: [
        "Concluída homologação do fornecedor principal.",
        "Reduzido escopo da fase piloto em 20% para acelerar entrega.",
      ],
      farol: [
        { dimensao: "Escopo", status: "amarelo" as const, obs: "Replanejado" },
        { dimensao: "Custo", status: "verde" as const, obs: "Aderente" },
      ],
      backlog: "Adicionar iniciativa de capacitação ao backlog Wave 1.",
      novoStatus: "Em Andamento",
    },
    {
      avancos: [
        "Squad técnico reforçado com 2 desenvolvedores externos.",
        "Sprint review aprovou 80% das histórias do ciclo.",
      ],
      farol: [
        { dimensao: "Cronograma", status: "amarelo" as const, obs: "+10 dias" },
      ],
    },
    {
      avancos: [
        "Documentação de processo finalizada e validada.",
        "Treinamento da equipe operacional agendado para próximo ciclo.",
      ],
      farol: [
        { dimensao: "Escopo", status: "verde" as const, obs: "OK" },
        { dimensao: "Cronograma", status: "verde" as const, obs: "Dentro do plano" },
      ],
      backlog: "Considerar replicação do modelo para projetos similares no portfolio.",
    },
  ];
  const v = variants[i % variants.length];
  return {
    projetoId: p.id,
    projetoNome: p.nome,
    avancos: v.avancos,
    novoFarol: v.farol,
    sugestaoBacklog: v.backlog,
    novoStatusSugerido: (v as any).novoStatus,
    selected: true,
  };
}
