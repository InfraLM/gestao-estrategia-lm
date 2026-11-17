import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, Upload, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Props {
  titulo: string;
  descricao: string;
  bullets?: string[];
}

export default function PlaceholderDoc({ titulo, descricao, bullets }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [obs, setObs] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!file) { toast({ title: "Selecione um arquivo", variant: "destructive" }); return; }
    if (!nome.trim()) { toast({ title: "Informe o nome do documento", variant: "destructive" }); return; }
    setBusy(true);
    // Placeholder: backend de versionamento/alçada será implementado em entrega futura.
    setTimeout(() => {
      toast({
        title: "Submissão registrada (modo placeholder)",
        description: `“${nome}” entrará na fila de aprovação quando o controle de revisão for ativado.`,
      });
      setBusy(false);
      setOpen(false);
      setNome(""); setObs(""); setFile(null);
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-primary" />
              <CardTitle>{titulo}</CardTitle>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Upload className="h-4 w-4" /> Submeter arquivo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" /> Submeter para “{titulo}”
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="doc-nome">Nome do documento</Label>
                    <Input id="doc-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Política de Compras v3" />
                  </div>
                  <div>
                    <Label htmlFor="doc-obs">Observações / contexto</Label>
                    <Textarea id="doc-obs" value={obs} onChange={(e) => setObs(e.target.value)} rows={3} placeholder="Mudanças relevantes, área responsável, validade…" />
                  </div>
                  <div>
                    <Label htmlFor="doc-file">Arquivo</Label>
                    <Input id="doc-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Após o controle de revisão ser ativado, este envio entrará no fluxo de aprovação por alçada (PMO/Admin → Zeev).
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
                  <Button onClick={handleSubmit} disabled={busy} className="gap-1.5">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Enviar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{descricao}</p>
          {bullets && bullets.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-4">
              <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Funcionalidades previstas</p>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                {bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          )}
          <div className="text-xs text-muted-foreground italic">
            Página em construção · estrutura de controle de qualidade (revisões, obsoletos, alçadas Zeev e revisão anual) será implementada em entrega futura.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
