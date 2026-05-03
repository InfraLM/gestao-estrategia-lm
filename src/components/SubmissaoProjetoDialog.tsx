import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, FileSpreadsheet, FileAudio, File as FileIcon, Package } from "lucide-react";
import { useProjectEditableData, type SubmissaoDocumento } from "@/hooks/useProjectEditableData";
import { cn } from "@/lib/utils";

interface Props {
  projetoId: string;
  projetoNome: string;
  inicio: string;
  saude: "On-Track" | "Alerta" | "Off-Track";
  trigger?: React.ReactNode;
  /** Pré-seleciona uma entrega (id no formato pacoteId/entregaId). */
  defaultTarget?: string;
}

const tipoFromMime = (mime: string, name: string): SubmissaoDocumento["tipo"] => {
  if (mime.startsWith("audio/") || mime.startsWith("video/")) return "gravacao";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("sheet") || mime.includes("excel") || name.match(/\.(xlsx?|csv|ods)$/i)) return "planilha";
  if (mime.startsWith("text/") || name.match(/\.(txt|md|docx?)$/i)) return "texto";
  return "outro";
};

const TIPO_LABEL: Record<SubmissaoDocumento["tipo"], string> = {
  planilha: "Planilha", pdf: "PDF", texto: "Texto", gravacao: "Gravação", outro: "Outro",
};
const TIPO_ICON: Record<SubmissaoDocumento["tipo"], typeof FileIcon> = {
  planilha: FileSpreadsheet, pdf: FileText, texto: FileText, gravacao: FileAudio, outro: FileIcon,
};

export function SubmissaoProjetoDialog({ projetoId, projetoNome, inicio, saude, trigger, defaultTarget }: Props) {
  const [open, setOpen] = useState(false);
  const editable = useProjectEditableData(projetoId, inicio, saude);
  const { state, submitDocumento } = editable;

  const opcoes = useMemo(
    () => state.eap.flatMap(p => p.entregas.map(e => ({
      key: `${p.id}/${e.id}`,
      pacoteId: p.id,
      entregaId: e.id,
      label: `${p.id} · ${p.titulo} → ${e.id} ${e.titulo}`,
    }))),
    [state.eap],
  );

  const [target, setTarget] = useState<string>(defaultTarget ?? opcoes[0]?.key ?? "");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<SubmissaoDocumento["tipo"]>("texto");
  const [tamanho, setTamanho] = useState(0);
  const [resumo, setResumo] = useState("");

  const handleFile = (f: File | null) => {
    if (!f) return;
    setNome(f.name);
    setTamanho(f.size);
    setTipo(tipoFromMime(f.type, f.name));
  };

  const todosDocs = useMemo(
    () => state.eap.flatMap(p => p.entregas.flatMap(e => e.documentos.map(d => ({ ...d, pacoteId: p.id, entregaId: e.id, entregaTitulo: e.titulo }))))
      .sort((a, b) => b.data.localeCompare(a.data)),
    [state.eap],
  );

  const submit = () => {
    if (!nome.trim() || !target) return;
    const [pacoteId, entregaId] = target.split("/");
    submitDocumento(pacoteId, entregaId, { nome: nome.trim(), tipo, tamanho, resumo: resumo.trim() || undefined });
    setNome(""); setTamanho(0); setResumo(""); setTipo("texto");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Submeter documento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Submeter atualização — {projetoNome}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha o entregável da EAP que será atualizado e anexe a evidência (planilha, PDF, texto, gravação).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Entregável (EAP)</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um entregável" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {opcoes.map(o => (
                  <SelectItem key={o.key} value={o.key} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Arquivo</Label>
            <Input type="file" accept=".pdf,.xlsx,.xls,.csv,.txt,.md,.docx,.doc,.mp3,.mp4,.wav,.m4a,audio/*,video/*"
              onChange={e => handleFile(e.target.files?.[0] ?? null)} className="mt-1" />
            <p className="text-[10px] text-muted-foreground mt-1">O arquivo é registrado como referência. O conteúdo binário não é armazenado nesta versão.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome do documento</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Ata reunião 02/05" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as SubmissaoDocumento["tipo"])}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_LABEL) as SubmissaoDocumento["tipo"][]).map(t => (
                    <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Resumo / observações</Label>
            <Textarea value={resumo} onChange={e => setResumo(e.target.value)} placeholder="Avanços, decisões, próximos passos..." rows={3} className="mt-1" />
          </div>

          {todosDocs.length > 0 && (
            <div>
              <Label className="text-xs">Submissões recentes do projeto ({todosDocs.length})</Label>
              <ul className="mt-1 max-h-44 overflow-y-auto border border-border rounded-md divide-y divide-border">
                {todosDocs.slice(0, 20).map(d => {
                  const Icon = TIPO_ICON[d.tipo];
                  return (
                    <li key={d.id} className="px-2.5 py-1.5 text-xs flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate"><span className="font-medium">{d.nome}</span> <span className="text-muted-foreground">· {d.entregaId} {d.entregaTitulo}</span></span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{new Date(d.data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!nome.trim() || !target} className={cn((!nome.trim() || !target) && "opacity-50")}>
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Registrar submissão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
