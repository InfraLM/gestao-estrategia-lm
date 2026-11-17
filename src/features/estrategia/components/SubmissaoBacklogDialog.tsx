import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onSubmitted?: () => void;
}

export default function SubmissaoBacklogDialog({ onSubmitted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setTitulo(""); setDescricao(""); setFile(null); };

  const handleSubmit = async () => {
    if (!user) { toast({ title: "Faça login para enviar", variant: "destructive" }); return; }
    if (!file) { toast({ title: "Selecione um arquivo", variant: "destructive" }); return; }
    if (!titulo.trim()) { toast({ title: "Informe um título", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("backlog-submissoes")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: sub, error: insErr } = await supabase
        .from("backlog_submissoes")
        .insert({
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          arquivo_nome: file.name,
          arquivo_path: path,
          arquivo_tipo: file.type || null,
          arquivo_tamanho: file.size,
          submitted_by: user.id,
          submitted_by_nome: user.email ?? null,
          status: "pendente",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      toast({ title: "Arquivo enviado", description: "A IA está analisando o conteúdo…" });
      // dispara análise IA (não bloqueia se demorar)
      supabase.functions.invoke("backlog-analisar", { body: { submissao_id: sub!.id } })
        .then(({ error }) => {
          if (error) {
            toast({ title: "Falha na análise IA", description: error.message, variant: "destructive" });
          } else {
            toast({ title: "Análise concluída", description: "Veja as propostas pendentes." });
          }
          onSubmitted?.();
        });

      setOpen(false);
      reset();
      onSubmitted?.();
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" /> Submeter para análise IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Submeter documento ao Backlog Estratégico
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="t">Título</Label>
            <Input id="t" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Ata ExCom 03/05" />
          </div>
          <div>
            <Label htmlFor="d">Descrição / contexto (opcional)</Label>
            <Textarea id="d" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que esperamos que a IA extraia ou atualize…" rows={3} />
          </div>
          <div>
            <Label htmlFor="f">Arquivo</Label>
            <Input
              id="f"
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.pptx,.mp3,.wav,.m4a,.json"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Planilhas, PDFs, apresentações, atas, gravações… A IA propõe novas iniciativas, atualizações e vínculos para revisão do PMO.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Enviar e analisar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
