import { useEffect, useMemo, useState } from "react";
import { useProcessosDB, type Processo } from "@/hooks/useProcessosDB";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Pencil, Power, Trash2, ShieldAlert, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NIVEIS = ["Gerencial", "Finalístico", "Suporte", "Outros"];
const STATUSES = ["MAPEAMENTO", "VALIDAÇÃO INTERNA", "APROVAÇÃO DIRETORIA", "REVISÃO CONCLUÍDA VIGENTE"];
import { DiretoresMultiSelect } from "@/components/DiretoresMultiSelect";

const nivelColors: Record<string, string> = {
  "Gerencial": "bg-violet-500/15 text-violet-700 border-violet-500/30",
  "Finalístico": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "Suporte": "bg-sky-500/15 text-sky-700 border-sky-500/30",
  "Outros": "bg-slate-500/15 text-slate-700 border-slate-500/30",
};

export default function GerenciarCadeia() {
  const { data: processos, loading, reload } = useProcessosDB();
  const { user } = useAuth();
  const { toast } = useToast();
  const [canManage, setCanManage] = useState(false);
  const [search, setSearch] = useState("");
  const [filterNivel, setFilterNivel] = useState("todos");
  const [showInativos, setShowInativos] = useState(false);
  const [editing, setEditing] = useState<Processo | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) { setCanManage(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id)
      .in("role", ["admin", "pmo", "super_admin"])
      .then(({ data }) => setCanManage(!!(data && data.length)));
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return processos.filter(p => {
      if (!showInativos && p.ativo === false) return false;
      if (filterNivel !== "todos" && p.nivel !== filterNivel) return false;
      if (q && !p.id.toLowerCase().includes(q) && !p.nome.toLowerCase().includes(q) && !(p.area || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [processos, search, filterNivel, showInativos]);

  const toggleAtivo = async (p: Processo) => {
    const novo = !(p.ativo !== false);
    const { error } = await supabase.from("processos").update({ ativo: novo }).eq("id", p.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: novo ? "Processo ativado" : "Processo inativado" });
    reload();
  };

  const excluir = async (p: Processo) => {
    const { error } = await supabase.from("processos").delete().eq("id", p.id);
    if (error) return toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    toast({ title: "Processo excluído" });
    reload();
  };

  if (!canManage) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-2">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
          <div className="font-medium">Acesso restrito</div>
          <div className="text-sm text-muted-foreground">
            Esta área é exclusiva para EPP / Admin / PMO. Solicite acesso ao seu administrador.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por código, nome ou área…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterNivel} onValueChange={setFilterNivel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os níveis</SelectItem>
              {NIVEIS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={showInativos} onCheckedChange={setShowInativos} id="showInativos" />
            <Label htmlFor="showInativos" className="cursor-pointer">Mostrar inativos</Label>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo processo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead className="min-w-[260px]">Nome</TableHead>
                <TableHead className="w-[140px]">Nível</TableHead>
                <TableHead className="min-w-[140px]">Área</TableHead>
                <TableHead className="w-[200px]">Status</TableHead>
                <TableHead className="w-[160px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">Nenhum processo encontrado.</TableCell></TableRow>
              )}
              {filtered.map(p => {
                const inativo = p.ativo === false;
                return (
                  <TableRow key={p.id} className={inativo ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">
                      {p.nome}
                      {inativo && <Badge variant="outline" className="ml-2 text-[10px] bg-muted">Inativo</Badge>}
                    </TableCell>
                    <TableCell>
                      {p.nivel ? <Badge variant="outline" className={nivelColors[p.nivel] || ""}>{p.nivel}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">{p.area || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-xs">{p.status || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(p)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => toggleAtivo(p)} title={inativo ? "Ativar" : "Inativar"}>
                          <Power className={`h-4 w-4 ${inativo ? "text-muted-foreground" : "text-emerald-600"}`} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="Excluir">
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-rose-600" /> Excluir processo definitivamente
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação é irreversível. O processo <span className="font-medium">{p.id} · {p.nome}</span> e seus dados serão removidos.
                                Considere inativá-lo para preservar o histórico.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => excluir(p)} className="bg-rose-600 hover:bg-rose-700">
                                Excluir definitivamente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProcessoDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        processo={editing}
        onSaved={() => { setCreating(false); setEditing(null); reload(); }}
      />
    </div>
  );
}

function ProcessoDialog({
  open, onOpenChange, processo, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; processo: Processo | null; onSaved: () => void }) {
  const { toast } = useToast();
  const isEdit = !!processo;
  const [form, setForm] = useState({
    id: "", nome: "", nivel: "", area: "", status: "MAPEAMENTO", diretor: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        id: processo?.id || "",
        nome: processo?.nome || "",
        nivel: processo?.nivel || "",
        area: processo?.area || "",
        status: processo?.status || "MAPEAMENTO",
        diretor: processo?.diretor || "",
      });
    }
  }, [open, processo]);

  const save = async () => {
    if (!form.id.trim() || !form.nome.trim()) {
      toast({ title: "Código e nome são obrigatórios", variant: "destructive" });
      return;
    }
    setBusy(true);
    if (isEdit) {
      const { error } = await supabase.from("processos").update({
        nome: form.nome, nivel: form.nivel || null, area: form.area || null, status: form.status, diretor: form.diretor || null,
      }).eq("id", processo!.id);
      setBusy(false);
      if (error) return toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      toast({ title: "Processo atualizado" });
    } else {
      const { error } = await supabase.from("processos").insert({
        id: form.id.trim(), nome: form.nome.trim(),
        nivel: form.nivel || null, area: form.area || null, status: form.status,
        diretor: form.diretor || null,
        ativo: true,
      });
      setBusy(false);
      if (error) return toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      toast({ title: "Processo criado" });
    }
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar processo" : "Novo processo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Código</Label>
            <Input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="Ex.: 3.2.1" disabled={isEdit} />
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome do processo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nível</Label>
              <Select value={form.nivel} onValueChange={v => setForm({ ...form, nivel: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{NIVEIS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Área</Label>
              <Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Ex.: Comercial" />
            </div>
            <div>
              <Label>Diretor</Label>
              <Select value={form.diretor} onValueChange={v => setForm({ ...form, diretor: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{DIRETORES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>{isEdit ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
