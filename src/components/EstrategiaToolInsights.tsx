import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, ChevronDown, ChevronUp, FileText, Image as ImageIcon, Mic, Paperclip, Plus, Presentation, Upload, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Insight = {
  id: string;
  ferramenta: string;
  titulo: string;
  conteudo: string | null;
  tipo_arquivo: string | null;
  arquivo_nome: string | null;
  arquivo_path: string | null;
  autor_nome: string | null;
  created_at: string;
};

interface Props {
  ferramenta: string;
  descricao: string;
  referencia: string;
  saidas?: string[];
}


function fileIcon(tipo?: string | null) {
  if (!tipo) return <Paperclip className="h-3.5 w-3.5" />;
  if (tipo.startsWith("image/")) return <ImageIcon className="h-3.5 w-3.5" />;
  if (tipo.startsWith("audio/")) return <Mic className="h-3.5 w-3.5" />;
  if (tipo.includes("pdf")) return <FileText className="h-3.5 w-3.5" />;
  if (tipo.includes("presentation") || tipo.includes("powerpoint")) return <Presentation className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

export default function EstrategiaToolInsights({ ferramenta, descricao, referencia, saidas }: Props) {
  const { user } = useAuth();
  const [openRef, setOpenRef] = useState(false);
  const [openList, setOpenList] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("estrategia_insights")
      .select("*")
      .eq("ferramenta", ferramenta)
      .order("created_at", { ascending: false });
    setInsights((data as Insight[]) ?? []);
  };

  useEffect(() => { load(); }, [ferramenta]);

  const submit = async () => {
    if (!user) { toast.error("Faça login para enviar insight."); return; }
    if (!titulo.trim()) { toast.error("Informe um título."); return; }
    setSubmitting(true);
    try {
      let arquivo_path: string | null = null;
      let arquivo_nome: string | null = null;
      let tipo_arquivo: string | null = null;
      let arquivo_tamanho: number | null = null;
      if (file) {
        const path = `${user.id}/${ferramenta.replace(/\s+/g, "_")}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("estrategia-insights").upload(path, file);
        if (upErr) throw upErr;
        arquivo_path = path;
        arquivo_nome = file.name;
        tipo_arquivo = file.type || null;
        arquivo_tamanho = file.size;
      }
      const { error } = await supabase.from("estrategia_insights").insert({
        ferramenta, titulo, conteudo: conteudo || null,
        arquivo_path, arquivo_nome, tipo_arquivo, arquivo_tamanho,
        autor: user.id,
        autor_nome: user.user_metadata?.display_name || user.email,
      });
      if (error) throw error;
      toast.success("Insight registrado!");
      setTitulo(""); setConteudo(""); setFile(null);
      setOpenDialog(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFile = async (path: string, nome: string) => {
    const { data, error } = await supabase.storage.from("estrategia-insights").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Não foi possível baixar"); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="mt-4 pt-3 border-t border-border space-y-2">
      {saidas && saidas.length > 0 && (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1.5">
            Principais saídas desta ferramenta
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground/90">
            {saidas.map((s) => (
              <li key={s} className="flex gap-1.5"><span className="text-primary shrink-0">→</span><span>{s}</span></li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Collapsible open={openRef} onOpenChange={setOpenRef}>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" /> Sobre a ferramenta
              {openRef ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        <Collapsible open={openList} onOpenChange={setOpenList}>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5" /> Insights
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{insights.length}</Badge>
              {openList ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs ml-auto">
              <Plus className="h-3.5 w-3.5" /> Adicionar insight
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Novo insight · {ferramenta}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Título *</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Resumo do insight" />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea rows={4} value={conteudo} onChange={e => setConteudo(e.target.value)} placeholder="Descreva sua observação, hipótese ou complemento à ferramenta..." />
              </div>
              <div>
                <Label>Anexo (PDF, imagem, áudio, apresentação, texto…)</Label>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,image/*,audio/*"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex items-center gap-2 mt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Selecionar arquivo
                  </Button>
                  {file && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {fileIcon(file.type)} {file.name} · {(file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={submitting} className="gap-1.5">
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar insight
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Collapsible open={openRef}>
        <CollapsibleContent>
          <div className="p-3 rounded-md bg-muted/40 border border-border text-xs leading-relaxed">
            <p className="text-foreground">{descricao}</p>
            <p className="mt-2 text-muted-foreground italic">📚 Referência: {referencia}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openList}>
        <CollapsibleContent>
          {insights.length === 0 ? (
            <div className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded-md border border-dashed">
              Nenhum insight registrado. Seja o primeiro a complementar esta ferramenta.
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map(i => (
                <div key={i.id} className="p-3 rounded-md bg-card border border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{i.titulo}</div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{new Date(i.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {i.conteudo && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{i.conteudo}</p>}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground">por {i.autor_nome ?? "—"}</span>
                    {i.arquivo_path && i.arquivo_nome && (
                      <button onClick={() => downloadFile(i.arquivo_path!, i.arquivo_nome!)} className="text-[10px] inline-flex items-center gap-1 text-primary hover:underline">
                        {fileIcon(i.tipo_arquivo)} {i.arquivo_nome} <Download className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
