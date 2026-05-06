import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Upload, Loader2, FileText } from "lucide-react";

type Doc = {
  id: string;
  repositorio: string;
  nome: string;
  versao: string;
  status: string;
  origem: string | null;
  observacoes: string | null;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  submitted_by_nome: string | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-muted text-muted-foreground" },
  em_aprovacao: { label: "Em aprovação", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  vigente: { label: "Vigente", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  obsoleto: { label: "Obsoleto", cls: "bg-slate-500/15 text-slate-700 border-slate-500/30" },
  rejeitado: { label: "Rejeitado", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
};

export default function RepositorioLista({
  repositorio, titulo, descricao,
}: { repositorio: string; titulo: string; descricao: string }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [viewer, setViewer] = useState<{ open: boolean; url: string; doc: Doc | null }>({
    open: false, url: "", doc: null,
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("repositorio_documentos")
      .select("*")
      .eq("repositorio", repositorio)
      .order("created_at", { ascending: false });
    setDocs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [repositorio]);

  const filtered = useMemo(() => docs.filter(d =>
    (statusFilter === "todos" || d.status === statusFilter) &&
    (!busca || d.nome.toLowerCase().includes(busca.toLowerCase()))
  ), [docs, busca, statusFilter]);

  const baixar = async (d: Doc) => {
    if (!d.arquivo_path) return;
    const { data, error } = await supabase.storage.from("repositorio-docs")
      .createSignedUrl(d.arquivo_path, 60);
    if (error || !data) { toast({ title: "Erro ao baixar", variant: "destructive" }); return; }
    window.open(data.signedUrl, "_blank");
  };

  const visualizar = async (d: Doc) => {
    if (!d.arquivo_path) return;
    const { data, error } = await supabase.storage.from("repositorio-docs")
      .createSignedUrl(d.arquivo_path, 600);
    if (error || !data) { toast({ title: "Erro ao abrir", variant: "destructive" }); return; }
    setViewer({ open: true, url: data.signedUrl, doc: d });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{titulo}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{descricao}</p>
        </div>
        <NovaSubmissaoDialog repositorio={repositorio} onCreated={load} />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs">Buscar</Label>
            <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome do documento…" />
          </div>
          <div className="min-w-[180px]">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground self-center ml-auto">
            {filtered.length} documento(s)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-sm text-muted-foreground p-6 text-center">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground p-12 text-center">
              Nenhum documento neste repositório ainda. Use “Submeter documento” para enviar o primeiro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Submetido por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => {
                    const meta = STATUS_META[d.status] || STATUS_META.em_aprovacao;
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{d.nome}</div>
                              {d.observacoes && (
                                <div className="text-[11px] text-muted-foreground line-clamp-1">{d.observacoes}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">{d.versao}</TableCell>
                        <TableCell className="text-xs">{d.origem || "—"}</TableCell>
                        <TableCell className="text-xs">{d.submitted_by_nome || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(d.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          {d.arquivo_path && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => visualizar(d)} title="Visualizar">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => baixar(d)} title="Baixar">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewer.open} onOpenChange={(o) => setViewer(v => ({ ...v, open: o }))}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">{viewer.doc?.nome} · {viewer.doc?.versao}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded">
            {viewer.url && (
              <iframe
                src={viewer.url}
                title="Visualização do documento"
                className="w-full h-full rounded"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => viewer.doc && baixar(viewer.doc)}>
              <Download className="h-4 w-4 mr-1.5" /> Baixar
            </Button>
            <Button onClick={() => setViewer({ open: false, url: "", doc: null })}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NovaSubmissaoDialog({ repositorio, onCreated }: { repositorio: string; onCreated: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nome: "", versao: "v1", origem: "", observacoes: "" });
  const [file, setFile] = useState<File | null>(null);

  const submit = async () => {
    if (!user) { toast({ title: "Faça login", variant: "destructive" }); return; }
    if (!form.nome.trim()) { toast({ title: "Informe o nome do documento", variant: "destructive" }); return; }
    if (!file) { toast({ title: "Anexe um arquivo", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const safeName = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "_");
      const path = `${repositorio}/${user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("repositorio-docs").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("repositorio_documentos").insert({
        repositorio,
        nome: form.nome.trim(),
        versao: form.versao.trim() || "v1",
        origem: form.origem.trim() || null,
        observacoes: form.observacoes.trim() || null,
        status: "vigente",
        submitted_by: user.id,
        submitted_by_nome: user.email,
        arquivo_path: path,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
        arquivo_tipo: file.type,
      });
      if (error) throw error;
      toast({ title: "Documento adicionado ao repositório" });
      setOpen(false);
      setForm({ nome: "", versao: "v1", origem: "", observacoes: "" });
      setFile(null);
      onCreated();
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" /> Submeter documento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Submeter documento ao repositório</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Nome do documento</Label>
              <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Política de Compras" />
            </div>
            <div>
              <Label>Versão</Label>
              <Input value={form.versao} onChange={e => setForm({ ...form, versao: e.target.value })} placeholder="v1" />
            </div>
          </div>
          <div>
            <Label>Origem (página/processo)</Label>
            <Input value={form.origem} onChange={e => setForm({ ...form, origem: e.target.value })}
              placeholder="Ex.: Comitê de Ética / BPMO" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Resumo, justificativa, escopo…" />
          </div>
          <div>
            <Label>Arquivo</Label>
            <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-[11px] text-muted-foreground mt-1">
              PDFs e imagens podem ser visualizados inline. Outros tipos serão disponibilizados para download.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
