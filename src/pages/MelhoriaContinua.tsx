import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Workflow, Target as TargetIcon, ListChecks, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const AREAS = [
  "Comercial",
  "Geração de Demanda",
  "CX",
  "Áudio Visual",
  "Infra & Tech",
  "Coordenação Acadêmica",
  "Demandas Médicas",
  "Governança e Jurídico",
  "Financeiro",
  "BPMO",
  "PMO Estratégico",
  "Facilities",
  "PFO em Hospitais",
  "Produtos",
  "Novos Produtos",
  "Growth",
] as const;

type Area = typeof AREAS[number];
type Origem = "BPMO (Processos)" | "OKRs da Área";
type Status = "Backlog" | "Em Andamento" | "Concluído" | "Pausado";

interface Acao {
  id: string;
  area: Area;
  origem: Origem;
  oQueFazer: string;
  justificativa: string;
  responsavel: string;
  dataPrevista: string;
  dataConclusao?: string;
  status: Status;
}

const SEED: Acao[] = [
  { id: "MC-001", area: "Comercial", origem: "OKRs da Área", oQueFazer: "Revisar script de qualificação SDR", justificativa: "Conversão MQL→SQL abaixo da meta (KR Q2)", responsavel: "Líder Comercial", dataPrevista: "2026-06-15", status: "Em Andamento" },
  { id: "MC-002", area: "BPMO", origem: "BPMO (Processos)", oQueFazer: "Padronizar fluxo de onboarding de aluno", justificativa: "Variação entre polos identificada na matriz de processos", responsavel: "Analista BPMO", dataPrevista: "2026-05-30", status: "Backlog" },
  { id: "MC-003", area: "CX", origem: "OKRs da Área", oQueFazer: "Reduzir TMA de tickets nível 1", justificativa: "NPS impactado por tempo de resposta", responsavel: "Coord. CX", dataPrevista: "2026-05-20", dataConclusao: "2026-05-18", status: "Concluído" },
];

const STATUS_COLORS: Record<Status, string> = {
  "Backlog": "bg-muted text-muted-foreground border-border",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  "Concluído": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Pausado": "bg-amber-100 text-amber-800 border-amber-200",
};

export default function MelhoriaContinua() {
  const [acoes, setAcoes] = useState<Acao[]>(SEED);
  const [areaSel, setAreaSel] = useState<Area | null>(null);
  const [q, setQ] = useState("");
  const [origemFilter, setOrigemFilter] = useState<string>("Todas");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Acao>>({ origem: "OKRs da Área", status: "Backlog" });

  const counts = useMemo(() => {
    const m = new Map<Area, number>();
    AREAS.forEach(a => m.set(a, 0));
    acoes.forEach(a => m.set(a.area, (m.get(a.area) ?? 0) + 1));
    return m;
  }, [acoes]);

  const lista = useMemo(() => acoes.filter(a => {
    if (areaSel && a.area !== areaSel) return false;
    if (origemFilter !== "Todas" && a.origem !== origemFilter) return false;
    if (q && !`${a.oQueFazer} ${a.justificativa} ${a.responsavel}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [acoes, areaSel, origemFilter, q]);

  function handleSave() {
    if (!draft.oQueFazer || !draft.area) return;
    const id = `MC-${String(acoes.length + 1).padStart(3, "0")}`;
    setAcoes(prev => [...prev, {
      id,
      area: draft.area as Area,
      origem: (draft.origem as Origem) ?? "OKRs da Área",
      oQueFazer: draft.oQueFazer ?? "",
      justificativa: draft.justificativa ?? "",
      responsavel: draft.responsavel ?? "",
      dataPrevista: draft.dataPrevista ?? "",
      dataConclusao: draft.dataConclusao,
      status: (draft.status as Status) ?? "Backlog",
    }]);
    setDraft({ origem: "OKRs da Área", status: "Backlog", area: areaSel ?? undefined });
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" /> Gestão de Melhoria Contínua
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plano de ação por área — origem em <strong>processos (BPMO)</strong> ou nos <strong>OKRs da própria área</strong>. Autonomia local com visibilidade transversal.
        </p>
      </div>

      {/* KPIs origem */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total de ações</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{acoes.length}</div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Workflow className="h-3.5 w-3.5" /> Origem BPMO</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-purple-700">{acoes.filter(a => a.origem === "BPMO (Processos)").length}</div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><TargetIcon className="h-3.5 w-3.5" /> Origem OKRs</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-blue-700">{acoes.filter(a => a.origem === "OKRs da Área").length}</div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Concluídas</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-emerald-700">{acoes.filter(a => a.status === "Concluído").length}</div>
        </Card>
      </div>

      {!areaSel ? (
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Selecione uma área</h3>
              <p className="text-sm text-muted-foreground">Cada botão abre o plano de ação da área.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {AREAS.map(area => {
              const n = counts.get(area) ?? 0;
              return (
                <button
                  key={area}
                  onClick={() => setAreaSel(area)}
                  className="group relative text-left p-4 rounded-lg border bg-card hover:border-primary hover:shadow-elevated transition-all"
                >
                  <div className="font-medium text-sm">{area}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{n} {n === 1 ? "ação" : "ações"}</Badge>
                    <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Abrir →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setAreaSel(null)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Áreas
              </Button>
              <h3 className="text-lg font-semibold">Plano de Ação · {areaSel}</h3>
              <Badge variant="outline">{lista.length} {lista.length === 1 ? "item" : "itens"}</Badge>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" onClick={() => setDraft(d => ({ ...d, area: areaSel }))}>
                  <Plus className="h-4 w-4" /> Nova ação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova ação · {areaSel}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Origem</label>
                      <Select value={draft.origem} onValueChange={v => setDraft(d => ({ ...d, origem: v as Origem }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BPMO (Processos)">BPMO (Processos)</SelectItem>
                          <SelectItem value="OKRs da Área">OKRs da Área</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <Select value={draft.status} onValueChange={v => setDraft(d => ({ ...d, status: v as Status }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["Backlog","Em Andamento","Concluído","Pausado"] as Status[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">O que fazer?</label>
                    <Input value={draft.oQueFazer ?? ""} onChange={e => setDraft(d => ({ ...d, oQueFazer: e.target.value }))} placeholder="Ação clara e objetiva" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Justificativa</label>
                    <Textarea value={draft.justificativa ?? ""} onChange={e => setDraft(d => ({ ...d, justificativa: e.target.value }))} placeholder="Por que esta ação? Qual problema/oportunidade?" rows={3} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Responsável</label>
                      <Input value={draft.responsavel ?? ""} onChange={e => setDraft(d => ({ ...d, responsavel: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Data prevista</label>
                      <Input type="date" value={draft.dataPrevista ?? ""} onChange={e => setDraft(d => ({ ...d, dataPrevista: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Data conclusão</label>
                      <Input type="date" value={draft.dataConclusao ?? ""} onChange={e => setDraft(d => ({ ...d, dataConclusao: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSave}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="p-4 shadow-card flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar ação, responsável…" className="pl-9" />
            </div>
            <Select value={origemFilter} onValueChange={setOrigemFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as origens</SelectItem>
                <SelectItem value="BPMO (Processos)">BPMO (Processos)</SelectItem>
                <SelectItem value="OKRs da Área">OKRs da Área</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          <Card className="shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Origem</TableHead>
                  <TableHead>O que fazer?</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead className="w-[160px]">Responsável</TableHead>
                  <TableHead className="w-[120px]">Prevista</TableHead>
                  <TableHead className="w-[120px]">Conclusão</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-normal", a.origem === "BPMO (Processos)" ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-blue-50 text-blue-800 border-blue-200")}>
                        {a.origem}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{a.oQueFazer}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.justificativa}</TableCell>
                    <TableCell className="text-sm">{a.responsavel || "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums">{a.dataPrevista || "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums">{a.dataConclusao || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[a.status])}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {lista.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Nenhuma ação cadastrada para esta área. Clique em <strong>Nova ação</strong>.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
