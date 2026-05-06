import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ListChecks, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type InfraTask = {
  id: string;
  task_custom_id: string | null;
  nome: string;
  assignee: string | null;
  status: string;
  due_date: string | null;
  classificacao: string | null;
  categoria: string | null;
  time_logged: string | null;
  time_estimate: string | null;
  sprint_semana: string | null;
};

const STATUSES = ["BACKLOG", "PRÓXIMA SPRINT", "SPRINT", "EM ANDAMENTO", "EM PROGRESSO", "PARALISADO", "PENDENTE", "PRONTO PRA REVISAR", "REVIEW", "CONCLUÍDO"];
const CATEGORIAS_GRUPOS: { grupo: string; itens: string[] }[] = [
  { grupo: "Dev. de Apps", itens: ["Software Proprietário", "Módulos de Sistema"] },
  { grupo: "TI Ops / Infra", itens: ["Setup de Hardware", "Gestão de Acessos", "Inventários/Ativos", "Outros (Infra)"] },
  { grupo: "Automação / IA", itens: ["Automações de Processo", "Workflows de Mensagem", "Formulários Inteligentes"] },
  { grupo: "Landing Pages", itens: ["Landing Pages Novas", "Otimizações de Funil", "Páginas de Apoio"] },
  { grupo: "Dados / Dash", itens: ["Mapeamentos de KPI", "Dashboards", "Outros (Dados)"] },
];
const CATEGORIAS = CATEGORIAS_GRUPOS.flatMap(g => g.itens);
const CLASSIFICACOES = ["Planejadas", "Não Planejadas", "Incidentes", "Internas"];

function statusColor(s: string) {
  if (s === "CONCLUÍDO") return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (s === "PRONTO PRA REVISAR" || s === "REVIEW") return "bg-blue-500/15 text-blue-700 border-blue-500/30";
  if (s === "EM ANDAMENTO" || s === "EM PROGRESSO" || s === "SPRINT") return "bg-violet-500/15 text-violet-700 border-violet-500/30";
  if (s === "PARALISADO") return "bg-rose-500/15 text-rose-700 border-rose-500/30";
  if (s === "PENDENTE" || s === "PRÓXIMA SPRINT") return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function isoMondayOf(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}

function fmtSemana(iso: string | null) {
  if (!iso) return "Sem sprint";
  const d = new Date(iso + "T00:00:00");
  const end = new Date(d); end.setDate(end.getDate() + 6);
  const f = (x: Date) => x.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${f(d)} → ${f(end)}`;
}

export default function InfraTechSprints() {
  const [tasks, setTasks] = useState<InfraTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroSprint, setFiltroSprint] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroAssignee, setFiltroAssignee] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [novo, setNovo] = useState<Partial<InfraTask>>({ status: "SPRINT", sprint_semana: isoMondayOf(new Date()) });

  const reload = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("infra_tasks").select("*").order("sprint_semana", { ascending: false }).order("status");
    if (error) toast.error(error.message);
    setTasks((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const sprints = useMemo(() => Array.from(new Set(tasks.map(t => t.sprint_semana).filter(Boolean))).sort().reverse() as string[], [tasks]);
  const assignees = useMemo(() => Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean))).sort() as string[], [tasks]);

  const filtradas = tasks.filter(t =>
    (filtroSprint === "todas" || t.sprint_semana === filtroSprint) &&
    (filtroStatus === "todos" || t.status === filtroStatus) &&
    (filtroAssignee === "todos" || t.assignee === filtroAssignee) &&
    (!busca || t.nome.toLowerCase().includes(busca.toLowerCase()) || (t.task_custom_id ?? "").toLowerCase().includes(busca.toLowerCase()))
  );

  const sprintAtiva = filtroSprint === "todas" ? isoMondayOf(new Date()) : filtroSprint;
  const tasksSprint = tasks.filter(t => t.sprint_semana === sprintAtiva);
  const kpis = {
    total: tasksSprint.length,
    concluidas: tasksSprint.filter(t => t.status === "CONCLUÍDO").length,
    andamento: tasksSprint.filter(t => ["EM ANDAMENTO", "EM PROGRESSO", "SPRINT"].includes(t.status)).length,
    paralisadas: tasksSprint.filter(t => t.status === "PARALISADO").length,
  };

  const updateField = async (id: string, patch: Partial<InfraTask>) => {
    const { error } = await supabase.from("infra_tasks").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  const remover = async (id: string) => {
    if (!confirm("Remover esta tarefa?")) return;
    const { error } = await supabase.from("infra_tasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removida"); reload();
  };

  const criar = async () => {
    if (!novo.nome) return toast.error("Informe o nome da tarefa");
    const { error } = await supabase.from("infra_tasks").insert({
      nome: novo.nome,
      assignee: novo.assignee || null,
      status: novo.status || "SPRINT",
      due_date: novo.due_date || null,
      classificacao: novo.classificacao || null,
      categoria: novo.categoria || null,
      time_estimate: novo.time_estimate || null,
      sprint_semana: novo.sprint_semana || isoMondayOf(new Date()),
      task_custom_id: novo.task_custom_id || null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Tarefa criada");
    setOpen(false);
    setNovo({ status: "SPRINT", sprint_semana: isoMondayOf(new Date()) });
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> Tarefas na sprint</div><div className="text-2xl font-bold mt-1">{kpis.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Concluídas</div><div className="text-2xl font-bold mt-1 text-emerald-600">{kpis.concluidas}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Em andamento</div><div className="text-2xl font-bold mt-1 text-violet-600">{kpis.andamento}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Paralisadas</div><div className="text-2xl font-bold mt-1 text-rose-600">{kpis.paralisadas}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Backlog & Sprints — Infra & Tech</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Sprints semanais (segunda a domingo). Edite status e responsável diretamente na tabela.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova tarefa</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova tarefa de sprint</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Nome</Label><Input value={novo.nome ?? ""} onChange={e => setNovo({ ...novo, nome: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>ID (ex: INF-2400)</Label><Input value={novo.task_custom_id ?? ""} onChange={e => setNovo({ ...novo, task_custom_id: e.target.value })} /></div>
                  <div><Label>Responsável</Label><Input value={novo.assignee ?? ""} onChange={e => setNovo({ ...novo, assignee: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Sprint (semana iniciando)</Label><Input type="date" value={novo.sprint_semana ?? ""} onChange={e => setNovo({ ...novo, sprint_semana: isoMondayOf(new Date(e.target.value)) })} /></div>
                  <div><Label>Due date</Label><Input type="date" value={novo.due_date ?? ""} onChange={e => setNovo({ ...novo, due_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Status</Label>
                    <Select value={novo.status} onValueChange={v => setNovo({ ...novo, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Categoria</Label>
                    <Select value={novo.categoria ?? ""} onValueChange={v => setNovo({ ...novo, categoria: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent className="max-h-[300px]">{CATEGORIAS_GRUPOS.map(g => (<div key={g.grupo}><div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{g.grupo}</div>{g.itens.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</div>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Classificação</Label>
                    <Select value={novo.classificacao ?? ""} onValueChange={v => setNovo({ ...novo, classificacao: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{CLASSIFICACOES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Estimativa (ex: 2h, 30m)</Label><Input value={novo.time_estimate ?? ""} onChange={e => setNovo({ ...novo, time_estimate: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={criar}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            <Input placeholder="Buscar por nome ou ID..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs" />
            <Select value={filtroSprint} onValueChange={setFiltroSprint}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as sprints</SelectItem>
                {sprints.map(s => <SelectItem key={s} value={s}>{fmtSemana(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroAssignee} onValueChange={setFiltroAssignee}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os responsáveis</SelectItem>
                {assignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sprint</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estim.</TableHead>
                  <TableHead>Logado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-6">Carregando...</TableCell></TableRow>}
                {!loading && filtradas.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-6">Nenhuma tarefa.</TableCell></TableRow>}
                {filtradas.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Input className="h-8 text-xs font-mono w-[110px]" defaultValue={t.task_custom_id ?? ""} onBlur={e => e.target.value !== (t.task_custom_id ?? "") && updateField(t.id, { task_custom_id: e.target.value || null })} />
                    </TableCell>
                    <TableCell className="max-w-[340px]">
                      <Input className="h-8 text-sm font-medium" defaultValue={t.nome} onBlur={e => e.target.value !== t.nome && e.target.value && updateField(t.id, { nome: e.target.value })} />
                      <Select value={t.classificacao ?? ""} onValueChange={v => updateField(t.id, { classificacao: v || null })}>
                        <SelectTrigger className="h-6 text-[10px] mt-1 border-none px-1 text-muted-foreground"><SelectValue placeholder="classificação" /></SelectTrigger>
                        <SelectContent>{CLASSIFICACOES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input className="h-8 text-xs w-[140px]" defaultValue={t.assignee ?? ""} onBlur={e => e.target.value !== (t.assignee ?? "") && updateField(t.id, { assignee: e.target.value || null })} /></TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={v => updateField(t.id, { status: v })}>
                        <SelectTrigger className="h-8 w-[170px]"><Badge variant="outline" className={statusColor(t.status)}>{t.status}</Badge></SelectTrigger>
                        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="date" className="h-8 text-xs w-[140px]" defaultValue={t.sprint_semana ?? ""} onBlur={e => {
                        const v = e.target.value ? isoMondayOf(new Date(e.target.value)) : null;
                        if (v !== t.sprint_semana) updateField(t.id, { sprint_semana: v });
                      }} />
                    </TableCell>
                    <TableCell>
                      <Input type="date" className="h-8 text-xs w-[140px]" defaultValue={t.due_date ?? ""} onBlur={e => e.target.value !== (t.due_date ?? "") && updateField(t.id, { due_date: e.target.value || null })} />
                    </TableCell>
                    <TableCell>
                      <Select value={t.categoria ?? ""} onValueChange={v => updateField(t.id, { categoria: v || null })}>
                        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent className="max-h-[300px]">{CATEGORIAS_GRUPOS.map(g => (<div key={g.grupo}><div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{g.grupo}</div>{g.itens.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</div>))}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input className="h-8 text-xs w-[80px]" defaultValue={t.time_estimate ?? ""} onBlur={e => e.target.value !== (t.time_estimate ?? "") && updateField(t.id, { time_estimate: e.target.value || null })} /></TableCell>
                    <TableCell><Input className="h-8 text-xs w-[80px]" defaultValue={t.time_logged ?? ""} onBlur={e => e.target.value !== (t.time_logged ?? "") && updateField(t.id, { time_logged: e.target.value || null })} /></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => remover(t.id)}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
