import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, FileCheck2, FolderArchive, BookOpen, ClipboardList,
  CheckCircle2, XCircle, Clock, AlertTriangle, Download, Trash2, Loader2, Upload,
} from "lucide-react";

type Doc = {
  id: string;
  repositorio: string;
  nome: string;
  versao: string;
  status: "rascunho" | "em_aprovacao" | "vigente" | "obsoleto" | "rejeitado";
  origem: string | null;
  observacoes: string | null;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  submitted_by: string;
  submitted_by_nome: string | null;
  aprovado_por: string | null;
  aprovado_por_nome: string | null;
  aprovado_em: string | null;
  proxima_revisao: string | null;
  motivo_rejeicao: string | null;
  created_at: string;
};

const REPOS = [
  { value: "frameworks", label: "Frameworks Vigentes", icon: BookOpen },
  { value: "processos-publicados", label: "Processos Publicados", icon: FileCheck2 },
  { value: "documentos-controlados", label: "Documentos Controlados", icon: FolderArchive },
  { value: "politicas-institucionais", label: "Políticas Institucionais", icon: ShieldCheck },
];

const STATUS_META: Record<Doc["status"], { label: string; cls: string; icon: any }> = {
  rascunho: { label: "Rascunho", cls: "bg-muted text-muted-foreground", icon: ClipboardList },
  em_aprovacao: { label: "Em aprovação", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Clock },
  vigente: { label: "Vigente", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: CheckCircle2 },
  obsoleto: { label: "Obsoleto", cls: "bg-slate-500/15 text-slate-700 border-slate-500/30", icon: FolderArchive },
  rejeitado: { label: "Rejeitado", cls: "bg-red-500/15 text-red-700 border-red-500/30", icon: XCircle },
};

const repoLabel = (v: string) => REPOS.find(r => r.value === v)?.label ?? v;

export default function GestaoRepositorio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPmo, setIsPmo] = useState(false);
  const [filterRepo, setFilterRepo] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("repositorio_documentos")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const roles = (data || []).map((r: any) => r.role);
      setIsPmo(roles.includes("admin") || roles.includes("pmo"));
    });
  }, [user?.id]);

  const filtered = useMemo(() => docs.filter(d =>
    (filterRepo === "todos" || d.repositorio === filterRepo) &&
    (filterStatus === "todos" || d.status === filterStatus)
  ), [docs, filterRepo, filterStatus]);

  const stats = useMemo(() => {
    const total = docs.length;
    const vigentes = docs.filter(d => d.status === "vigente").length;
    const pendentes = docs.filter(d => d.status === "em_aprovacao").length;
    const obsoletos = docs.filter(d => d.status === "obsoleto").length;
    const rejeitados = docs.filter(d => d.status === "rejeitado").length;
    const today = new Date(); const in60 = new Date(); in60.setDate(today.getDate() + 60);
    const revRev = docs.filter(d => d.status === "vigente" && d.proxima_revisao &&
      new Date(d.proxima_revisao) <= in60).length;
    const porRepo = REPOS.map(r => ({
      ...r,
      total: docs.filter(d => d.repositorio === r.value).length,
      vigentes: docs.filter(d => d.repositorio === r.value && d.status === "vigente").length,
      pendentes: docs.filter(d => d.repositorio === r.value && d.status === "em_aprovacao").length,
    }));
    return { total, vigentes, pendentes, obsoletos, rejeitados, revRev, porRepo };
  }, [docs]);

  const aprovar = async (d: Doc) => {
    // marca os vigentes anteriores do mesmo nome como obsoletos
    await supabase.from("repositorio_documentos")
      .update({ status: "obsoleto" })
      .eq("repositorio", d.repositorio).eq("nome", d.nome).eq("status", "vigente");
    const next = new Date(); next.setFullYear(next.getFullYear() + 1);
    const { error } = await supabase.from("repositorio_documentos").update({
      status: "vigente",
      aprovado_por: user?.id ?? null,
      aprovado_por_nome: user?.email ?? null,
      aprovado_em: new Date().toISOString(),
      proxima_revisao: next.toISOString().slice(0, 10),
    }).eq("id", d.id);
    if (error) { toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Documento aprovado e publicado como vigente" });
    load();
  };

  const rejeitar = async (d: Doc) => {
    const motivo = window.prompt("Motivo da rejeição:") || "Sem motivo informado";
    const { error } = await supabase.from("repositorio_documentos").update({
      status: "rejeitado", motivo_rejeicao: motivo,
      aprovado_por: user?.id ?? null, aprovado_por_nome: user?.email ?? null,
      aprovado_em: new Date().toISOString(),
    }).eq("id", d.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Documento rejeitado" });
    load();
  };

  const arquivar = async (d: Doc) => {
    await supabase.from("repositorio_documentos").update({ status: "obsoleto" }).eq("id", d.id);
    toast({ title: "Documento marcado como obsoleto" });
    load();
  };

  const remover = async (d: Doc) => {
    if (!confirm(`Remover “${d.nome} ${d.versao}”?`)) return;
    if (d.arquivo_path) await supabase.storage.from("repositorio-docs").remove([d.arquivo_path]);
    await supabase.from("repositorio_documentos").delete().eq("id", d.id);
    toast({ title: "Documento removido" });
    load();
  };

  const baixar = async (d: Doc) => {
    if (!d.arquivo_path) return;
    const { data, error } = await supabase.storage.from("repositorio-docs")
      .createSignedUrl(d.arquivo_path, 60);
    if (error || !data) { toast({ title: "Erro ao baixar", variant: "destructive" }); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard consolidado</TabsTrigger>
            <TabsTrigger value="matriz">Matriz</TabsTrigger>
            <TabsTrigger value="fila">Fila de aprovação</TabsTrigger>
            <TabsTrigger value="documentos">Todos os documentos</TabsTrigger>
          </TabsList>
          <NovaSubmissaoDialog onCreated={load} />
        </div>


        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPI label="Total de docs" value={stats.total} icon={FolderArchive} />
            <KPI label="Vigentes" value={stats.vigentes} icon={CheckCircle2} cls="text-emerald-600" />
            <KPI label="Em aprovação" value={stats.pendentes} icon={Clock} cls="text-amber-600" />
            <KPI label="Rejeitados" value={stats.rejeitados} icon={XCircle} cls="text-red-600" />
            <KPI label="Obsoletos" value={stats.obsoletos} icon={FolderArchive} cls="text-slate-600" />
            <KPI label="Revisão ≤60d" value={stats.revRev} icon={AlertTriangle} cls="text-orange-600" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Por repositório</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.porRepo.map(r => {
                  const Icon = r.icon;
                  return (
                    <div key={r.value} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium leading-tight">{r.label}</div>
                      </div>
                      <div className="text-2xl font-semibold tabular-nums">{r.total}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="text-emerald-600">{r.vigentes} vigentes</span>
                        {" · "}
                        <span className="text-amber-600">{r.pendentes} pendentes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matriz" className="space-y-4 mt-4">
          <MatrizDocumentos docs={docs} loading={loading} />
        </TabsContent>

        <TabsContent value="fila" className="space-y-4 mt-4">

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" /> Solicitações pendentes de aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ListaTabela
                docs={docs.filter(d => d.status === "em_aprovacao")}
                isPmo={isPmo} loading={loading}
                onAprovar={aprovar} onRejeitar={rejeitar} onArquivar={arquivar}
                onRemover={remover} onBaixar={baixar}
                emptyText="Nenhum documento aguardando aprovação."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-3 items-end">
              <div className="min-w-[200px]">
                <Label className="text-xs">Repositório</Label>
                <Select value={filterRepo} onValueChange={setFilterRepo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os repositórios</SelectItem>
                    {REPOS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[180px]">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
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
              <ListaTabela
                docs={filtered}
                isPmo={isPmo} loading={loading}
                onAprovar={aprovar} onRejeitar={rejeitar} onArquivar={arquivar}
                onRemover={remover} onBaixar={baixar}
                emptyText="Nenhum documento encontrado."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MatrizDocumentos({ docs, loading }: { docs: Doc[]; loading: boolean }) {
  const [busca, setBusca] = useState("");

  const matriz = useMemo(() => {
    // agrupa por nome do documento; para cada repositório guarda o registro mais recente
    const map = new Map<string, Record<string, Doc | undefined>>();
    for (const d of docs) {
      const key = d.nome.trim();
      if (!map.has(key)) map.set(key, {});
      const row = map.get(key)!;
      const cur = row[d.repositorio];
      if (!cur || new Date(d.created_at) > new Date(cur.created_at)) {
        row[d.repositorio] = d;
      }
    }
    return Array.from(map.entries())
      .map(([nome, cols]) => ({ nome, cols }))
      .filter(r => !busca || r.nome.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [docs, busca]);

  const totalPorRepo = useMemo(() => {
    const t: Record<string, number> = {};
    for (const r of REPOS) t[r.value] = docs.filter(d => d.repositorio === r.value).length;
    return t;
  }, [docs]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Matriz de documentos × repositórios</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Consolidação em tempo real. Cada célula mostra a última versão submetida do documento naquele repositório.
            </p>
          </div>
          <Input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar documento…"
            className="max-w-[260px]"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : matriz.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhum documento submetido ainda. A matriz é preenchida automaticamente conforme as listas recebem novos arquivos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[240px]">Documento</TableHead>
                  {REPOS.map(r => (
                    <TableHead key={r.value} className="text-center min-w-[160px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <r.icon className="h-3.5 w-3.5 text-primary" />
                        <span>{r.label}</span>
                      </div>
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {totalPorRepo[r.value]} submissão(ões)
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriz.map(row => (
                  <TableRow key={row.nome}>
                    <TableCell className="font-medium text-sm">{row.nome}</TableCell>
                    {REPOS.map(r => {
                      const cell = row.cols[r.value];
                      if (!cell) {
                        return (
                          <TableCell key={r.value} className="text-center text-xs text-muted-foreground/50">—</TableCell>
                        );
                      }
                      const meta = STATUS_META[cell.status];
                      const Icon = meta.icon;
                      return (
                        <TableCell key={r.value} className="text-center align-top">
                          <div className="inline-flex flex-col items-center gap-1">
                            <Badge variant="outline" className="font-mono text-[10px]">{cell.versao}</Badge>
                            <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {meta.label}
                            </Badge>
                            <div className="text-[10px] text-muted-foreground tabular-nums">
                              {new Date(cell.created_at).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function KPI({ label, value, icon: Icon, cls = "" }: { label: string; value: number; icon: any; cls?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${cls || "text-muted-foreground"}`} />
        </div>
        <div className={`text-2xl font-semibold tabular-nums mt-1 ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ListaTabela({
  docs, isPmo, loading, onAprovar, onRejeitar, onArquivar, onRemover, onBaixar, emptyText,
}: {
  docs: Doc[]; isPmo: boolean; loading: boolean; emptyText: string;
  onAprovar: (d: Doc) => void; onRejeitar: (d: Doc) => void;
  onArquivar: (d: Doc) => void; onRemover: (d: Doc) => void; onBaixar: (d: Doc) => void;
}) {
  if (loading) return <div className="text-sm text-muted-foreground p-6 text-center">Carregando…</div>;
  if (!docs.length) return <div className="text-sm text-muted-foreground p-6 text-center">{emptyText}</div>;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Repositório</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Versão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Próx. revisão</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map(d => {
            const meta = STATUS_META[d.status];
            const Icon = meta.icon;
            return (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="font-medium text-sm">{d.nome}</div>
                  {d.observacoes && <div className="text-[11px] text-muted-foreground line-clamp-1">{d.observacoes}</div>}
                </TableCell>
                <TableCell className="text-xs">{repoLabel(d.repositorio)}</TableCell>
                <TableCell className="text-xs">{d.origem || "—"}</TableCell>
                <TableCell className="text-xs">
                  {d.submitted_by_nome || "—"}
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </TableCell>
                <TableCell className="text-xs tabular-nums">{d.versao}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>
                    <Icon className="h-3 w-3 mr-1" /> {meta.label}
                  </Badge>
                  {d.status === "rejeitado" && d.motivo_rejeicao && (
                    <div className="text-[10px] text-red-600 mt-0.5 line-clamp-1">{d.motivo_rejeicao}</div>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {d.proxima_revisao ? new Date(d.proxima_revisao).toLocaleDateString("pt-BR") : "—"}
                </TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  {d.arquivo_path && (
                    <Button size="sm" variant="ghost" onClick={() => onBaixar(d)} title="Baixar">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {isPmo && d.status === "em_aprovacao" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onAprovar(d)} className="h-7 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onRejeitar(d)} className="h-7 text-xs">
                        <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" /> Rejeitar
                      </Button>
                    </>
                  )}
                  {isPmo && d.status === "vigente" && (
                    <Button size="sm" variant="ghost" onClick={() => onArquivar(d)} className="h-7 text-xs">
                      Arquivar
                    </Button>
                  )}
                  {isPmo && (
                    <Button size="sm" variant="ghost" onClick={() => onRemover(d)} title="Remover">
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function NovaSubmissaoDialog({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    repositorio: "frameworks", nome: "", versao: "v1", origem: "", observacoes: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const submit = async () => {
    if (!user) { toast({ title: "Faça login", variant: "destructive" }); return; }
    if (!form.nome.trim()) { toast({ title: "Informe o nome do documento", variant: "destructive" }); return; }
    setBusy(true);
    try {
      let arquivo_path: string | null = null;
      let arquivo_nome: string | null = null;
      let arquivo_tamanho: number | null = null;
      let arquivo_tipo: string | null = null;
      if (file) {
        const path = `${form.repositorio}/${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("repositorio-docs").upload(path, file);
        if (upErr) throw upErr;
        arquivo_path = path; arquivo_nome = file.name;
        arquivo_tamanho = file.size; arquivo_tipo = file.type;
      }
      const { error } = await supabase.from("repositorio_documentos").insert({
        repositorio: form.repositorio, nome: form.nome.trim(), versao: form.versao.trim() || "v1",
        origem: form.origem.trim() || null, observacoes: form.observacoes.trim() || null,
        status: "em_aprovacao",
        submitted_by: user.id, submitted_by_nome: user.email,
        arquivo_path, arquivo_nome, arquivo_tamanho, arquivo_tipo,
      });
      if (error) throw error;
      toast({ title: "Submissão enviada para aprovação" });
      setOpen(false);
      setForm({ repositorio: "frameworks", nome: "", versao: "v1", origem: "", observacoes: "" });
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
        <DialogHeader>
          <DialogTitle>Submeter documento ao repositório</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Repositório de destino</Label>
            <Select value={form.repositorio} onValueChange={v => setForm({ ...form, repositorio: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPOS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
              placeholder="Ex.: BPMO · Gestão de Processos / Comitê de Ética" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Mudanças relevantes, justificativa, validade…" />
          </div>
          <div>
            <Label>Arquivo</Label>
            <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Após o envio, a submissão entrará na fila de aprovação do PMO/Admin (alçada Zeev).
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
