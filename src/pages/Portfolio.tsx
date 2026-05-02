import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, LayoutList, Columns3, Search, X, Edit, Eye, Archive } from "lucide-react";
import { projetos as initial, type Projeto, diretores } from "@/data/mockData";
import { BCBadge, ClassBadge, StatusBadge, WaveBadge } from "@/components/badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const waveOpts: Projeto["wave"][] = ["W1","W2","W3"];
const classOpts: Projeto["classificacao"][] = ["Institucional","Melhoria Contínua","Melhoria Contínua com EPP","Novo Produto"];
const statusOpts: Projeto["status"][] = ["Backlog","A Iniciar","Em Andamento","Pausado","Atrasado","Concluído","Cancelado","Em Avaliação"];
const bcOpts: Projeto["statusBC"][] = ["Em Revisão","BC em Construção","Ativo EPP","Projeto Concluído","BC não aplicável","Sem BC","Adiado","Validado"];
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusCols: Projeto["status"][] = ["Backlog", "A Iniciar", "Em Andamento", "Pausado", "Atrasado", "Concluído"];

export default function Portfolio() {
  const nav = useNavigate();
  const [view, setView] = useState<"tabela" | "kanban">("tabela");
  const [data, setData] = useState<Projeto[]>(initial);
  const [search, setSearch] = useState("");
  const [filterWave, setFilterWave] = useState<string[]>([]);
  const [filterClass, setFilterClass] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDir, setFilterDir] = useState<string[]>([]);
  const [filterPeriodo, setFilterPeriodo] = useState<string[]>([]);
  const [editing, setEditing] = useState<Projeto | null>(null);

  const updateProject = (id: string, patch: Partial<Projeto>) => {
    setData(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    toast.success(`${id} atualizado`);
  };


  // Build available year/semester options from project periods
  const periodoOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach(p => {
      const parse = (s: string) => {
        const [y, sem] = s.split("/");
        return { y: parseInt(y), s: parseInt(sem) };
      };
      const a = parse(p.inicio), b = parse(p.termino);
      for (let y = a.y; y <= b.y; y++) {
        const sStart = y === a.y ? a.s : 1;
        const sEnd = y === b.y ? b.s : 2;
        for (let s = sStart; s <= sEnd; s++) set.add(`${y}/${s}`);
      }
    });
    return Array.from(set).sort();
  }, [data]);

  const isInPeriodo = (p: Projeto, periodo: string) => {
    const [py, ps] = periodo.split("/").map(Number);
    const [iy, is] = p.inicio.split("/").map(Number);
    const [ty, ts] = p.termino.split("/").map(Number);
    const target = py * 2 + ps;
    return iy * 2 + is <= target && target <= ty * 2 + ts;
  };

  const filtered = useMemo(() => {
    const list = data.filter(p =>
      (!search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())) &&
      (!filterWave.length || filterWave.includes(p.wave)) &&
      (!filterClass.length || filterClass.includes(p.classificacao)) &&
      (!filterStatus.length || filterStatus.includes(p.status)) &&
      (!filterDir.length || filterDir.includes(p.diretor)) &&
      (!filterPeriodo.length || filterPeriodo.some(per => isInPeriodo(p, per)))
    );
    // Rank: when periodo filter is active, sort by ICE desc (priority within period)
    if (filterPeriodo.length) {
      return [...list].sort((a, b) => b.ice - a.ice);
    }
    return list;
  }, [data, search, filterWave, filterClass, filterStatus, filterDir, filterPeriodo]);

  const clearAll = () => { setSearch(""); setFilterWave([]); setFilterClass([]); setFilterStatus([]); setFilterDir([]); setFilterPeriodo([]); };

  const toggle = (arr: string[], v: string, set: (v: string[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mt-1">
            Exibindo <span className="font-semibold text-foreground">{filtered.length}</span> de <span className="font-semibold text-foreground">{data.length}</span> projetos
            {filterPeriodo.length > 0 && <span className="ml-2">· ranqueado por ICE em {filterPeriodo.join(", ")}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5 bg-background">
            <button onClick={() => setView("tabela")} className={cn("h-8 px-3 rounded text-sm flex items-center gap-1.5", view === "tabela" ? "bg-foreground text-background" : "text-muted-foreground")}><LayoutList className="h-4 w-4" /> Tabela</button>
            <button onClick={() => setView("kanban")} className={cn("h-8 px-3 rounded text-sm flex items-center gap-1.5", view === "kanban" ? "bg-foreground text-background" : "text-muted-foreground")}><Columns3 className="h-4 w-4" /> Kanban</button>
          </div>
          <Button onClick={() => nav("/submissao")} className="gap-2 shadow-primary"><Plus className="h-4 w-4" /> Novo Projeto</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou ID…" className="pl-9" />
          </div>
          <FilterChip label="Wave" options={["W1","W2","W3"]} selected={filterWave} onToggle={(v) => toggle(filterWave, v, setFilterWave)} />
          <FilterChip label="Classificação" options={["Institucional","Melhoria Contínua","Melhoria Contínua com EPP","Novo Produto"]} selected={filterClass} onToggle={(v) => toggle(filterClass, v, setFilterClass)} />
          <FilterChip label="Status" options={["Em Andamento","Atrasado","Pausado","Backlog","A Iniciar","Concluído","Em Avaliação"]} selected={filterStatus} onToggle={(v) => toggle(filterStatus, v, setFilterStatus)} />
          <FilterChip label="Diretor" options={diretores} selected={filterDir} onToggle={(v) => toggle(filterDir, v, setFilterDir)} />
          <FilterChip label="Ano/Semestre" options={periodoOptions} selected={filterPeriodo} onToggle={(v) => toggle(filterPeriodo, v, setFilterPeriodo)} />
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1"><X className="h-3.5 w-3.5" /> Limpar</Button>
        </div>
        {(filterWave.length + filterClass.length + filterStatus.length + filterDir.length + filterPeriodo.length) > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            {[...filterWave, ...filterClass, ...filterStatus, ...filterDir, ...filterPeriodo].map(f => (
              <span key={f} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/30">
                {f}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* View */}
      {view === "tabela" ? (
        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["ID","Projeto","Diretor","Classif.","Wave","Obj.","Status BC","Período","Budget","Status","ICE",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-t border-border hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{p.id}</td>
                    <td className="px-4 py-3"><Link to="#" className="font-semibold text-foreground hover:text-primary">{p.nome}</Link></td>
                    <td className="px-4 py-3">
                      <InlineSelect value={p.diretor} options={diretores} onChange={(v) => updateProject(p.id, { diretor: v })}>
                        <div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold">{p.diretor.split(" ").map(n => n[0]).slice(0,2).join("")}</div><span className="whitespace-nowrap">{p.diretor}</span></div>
                      </InlineSelect>
                    </td>
                    <td className="px-4 py-3">
                      <InlineSelect value={p.classificacao} options={classOpts} onChange={(v) => updateProject(p.id, { classificacao: v as Projeto["classificacao"] })}>
                        <ClassBadge value={p.classificacao} />
                      </InlineSelect>
                    </td>
                    <td className="px-4 py-3">
                      <InlineSelect value={p.wave} options={waveOpts} onChange={(v) => updateProject(p.id, { wave: v as Projeto["wave"] })}>
                        <WaveBadge wave={p.wave} />
                      </InlineSelect>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{p.objetivos.join(", ")}</td>
                    <td className="px-4 py-3">
                      <InlineSelect value={p.statusBC} options={bcOpts} onChange={(v) => updateProject(p.id, { statusBC: v as Projeto["statusBC"] })}>
                        <BCBadge status={p.statusBC} />
                      </InlineSelect>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{p.inicio} → {p.termino}</td>
                    <td className="px-4 py-3 text-xs font-medium tabular-nums whitespace-nowrap">R$ {p.budget.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <InlineSelect value={p.status} options={statusOpts} onChange={(v) => updateProject(p.id, { status: v as Projeto["status"] })}>
                        <StatusBadge status={p.status} />
                      </InlineSelect>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <span className="text-xs font-semibold tabular-nums w-7">{p.ice.toFixed(1)}</span>
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${p.ice * 10}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(p)} className="h-7 w-7 grid place-items-center rounded hover:bg-muted"><Edit className="h-3.5 w-3.5" /></button>
                        <button className="h-7 w-7 grid place-items-center rounded hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                        <button className="h-7 w-7 grid place-items-center rounded hover:bg-muted"><Archive className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          {statusCols.map(col => {
            const items = filtered.filter(p => p.status === col);
            return (
              <Card key={col} className="p-3 shadow-card bg-surface-muted/40 min-h-[300px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">{col}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background border border-border tabular-nums">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(p => (
                    <div key={p.id} draggable onDragEnd={() => toast.info("Drag-and-drop simulado")} className="bg-card rounded-md p-3 shadow-card border border-border cursor-grab hover:shadow-elevated transition-shadow">
                      <div className="text-[10px] text-muted-foreground tabular-nums mb-1">{p.id}</div>
                      <div className="font-semibold text-sm leading-snug mb-2">{p.nome}</div>
                      <div className="flex flex-wrap gap-1 mb-2"><ClassBadge value={p.classificacao} /><WaveBadge wave={p.wave} /></div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate">{p.diretor}</span>
                        <span className="font-semibold text-primary tabular-nums">{p.ice.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Drawer */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Editar Projeto · {editing?.id}</SheetTitle></SheetHeader>
          {editing && (
            <div className="space-y-4 mt-6">
              <div><Label>Nome</Label><Input defaultValue={editing.nome} className="mt-1" /></div>
              <div><Label>Descrição</Label><Textarea defaultValue={editing.descricao} className="mt-1" rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Diretor</Label><Input defaultValue={editing.diretor} className="mt-1" /></div>
                <div><Label>Gerente</Label><Input defaultValue={editing.gerente ?? ""} className="mt-1" /></div>
                <div><Label>Início</Label><Input defaultValue={editing.inicio} className="mt-1" /></div>
                <div><Label>Término</Label><Input defaultValue={editing.termino} className="mt-1" /></div>
                <div><Label>Budget (R$)</Label><Input type="number" defaultValue={editing.budget} className="mt-1" /></div>
                <div><Label>ICE</Label><Input type="number" step="0.1" defaultValue={editing.ice} className="mt-1" /></div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-border sticky bottom-0 bg-background">
                <Button onClick={() => { toast.success("Alterações salvas"); setEditing(null); }} className="flex-1">Salvar Alterações</Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterChip({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(o => !o)} className={cn("gap-1.5", selected.length > 0 && "border-primary text-primary")}>
        {label} {selected.length > 0 && <span className="ml-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">{selected.length}</span>}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1 left-0 bg-popover border border-border rounded-md shadow-elevated p-2 min-w-[200px] animate-fade-in">
            {options.map(o => (
              <label key={o} className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted cursor-pointer">
                <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} className="accent-primary" />
                {o}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InlineSelect({ value, options, onChange, children }: { value: string; options: readonly string[]; onChange: (v: string) => void; children?: React.ReactNode }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-auto min-h-8 border-transparent hover:border-border bg-transparent px-2 py-1 -mx-2 -my-1 focus:ring-1 focus:ring-ring/40 [&>span]:flex [&>span]:items-center">
        {children ? <span>{children}</span> : <SelectValue />}
      </SelectTrigger>
      <SelectContent className="z-50 bg-popover">
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

