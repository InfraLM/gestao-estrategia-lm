import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, Plus, Search, Sparkles, GitBranch, ClipboardList, Users, Calendar, Target, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { projetos } from "@/data/mockData";
import { cn } from "@/lib/utils";

// Objetivos Estratégicos (BSC) — fonte: Estrategia.tsx
export const OBJETIVOS_ESTRATEGICOS = [
  { codigo: "F.01", nome: "Previsibilidade de Caixa", perspectiva: "Financeira", krs: ["NRR > 115%", "Inadimplência >30d ≤ 6%", "Previsão DFC ±5%"] },
  { codigo: "F.02", nome: "Crescimento com Rentabilidade Sustentável", perspectiva: "Financeira", krs: ["OPEX ratio < 43%", "Margem contribuição > 65%", "Forecast DRE ±5%"] },
  { codigo: "C.01", nome: "Experiência WOW", perspectiva: "Cliente", krs: ["CSAT > 4,75", ">30% alunos em 3+ pilares", ">95% tickets ≤30min"] },
  { codigo: "C.02", nome: "Penetração de Mercado", perspectiva: "Cliente", krs: ["8.030 leads", "4.000 alunos", "Lançamento por praça <30 dias"] },
  { codigo: "P.01", nome: "Conversão Comercial High-Ticket", perspectiva: "Processos", krs: ["SQL→Matrícula >35%", "MQL→SQL ≥20%", "No-show <20%"] },
  { codigo: "P.02", nome: "Eficiência de Cobrança", perspectiva: "Processos", krs: ["Recuperação >50%", "Recorrência cartão >90%"] },
  { codigo: "P.03", nome: "Automação de Processos Core", perspectiva: "Processos", krs: ["Lead time -25%", "30% portfólio com IA", "100% BPM"] },
  { codigo: "P.04", nome: "AI First · Human First", perspectiva: "Processos", krs: ["Copilotos por área", "Produtos com IA", "Trilhas personalizadas"] },
  { codigo: "AC.01", nome: "Cultura Viva & Alta Performance", perspectiva: "Aprendizagem", krs: ["100% áreas com OKRs", "85% rituais", "100% gestão à vista"] },
] as const;

const PERSP_BADGE: Record<string, string> = {
  "Financeira": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Cliente": "bg-primary/10 text-primary border-primary/30",
  "Processos": "bg-blue-100 text-blue-800 border-blue-200",
  "Aprendizagem": "bg-amber-100 text-amber-800 border-amber-200",
};

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
] as const;

type Area = typeof AREAS[number];
type Classif = "Melhoria Contínua" | "Melhoria Contínua com EPP";
type Status = "Backlog" | "A Iniciar" | "Em Andamento" | "Validação" | "Concluído" | "Pausado";

interface MelhoriaEstrategica {
  id: string;
  area: Area;
  classificacao: Classif;
  oQueFazer: string;
  justificativa: string;
  resultadoEsperado: string;
  responsavel: string;
  dataPrevista: string;
  dataConclusao?: string;
  status: Status;
  projetoId?: string;
  objetivos?: string[]; // códigos de objetivos estratégicos vinculados
  krs?: string[]; // KRs específicos selecionados
}

// Mapeia diretor → área (aproximação para seed inicial)
const DIRETOR_AREA: Record<string, Area> = {
  "Bruno Garcia": "Financeiro",
  "Yuri Ribeiro": "Governança e Jurídico",
  "Iuri Eloi Franco": "Geração de Demanda",
  "Guilherme Vieira": "CX",
  "Naira Yurie": "BPMO",
  "Marcya Santos": "Coordenação Acadêmica",
  "Caio Barros": "Comercial",
  "Felipe Souza": "Infra & Tech",
  "Rodrigo Lima Dutra": "CX",
  "Ian": "Áudio Visual",
  "Não atribuído": "PMO Estratégico",
};

const SEED: MelhoriaEstrategica[] = projetos
  .filter(p => p.classificacao === "Melhoria Contínua" || p.classificacao === "Melhoria Contínua com EPP")
  .map(p => ({
    id: `ME-${p.id}`,
    area: DIRETOR_AREA[p.diretor] ?? "PMO Estratégico",
    classificacao: p.classificacao as Classif,
    oQueFazer: p.nome,
    justificativa: p.descricao ?? "",
    resultadoEsperado: "",
    responsavel: p.diretor,
    dataPrevista: p.termino ?? "",
    status: (p.status as Status) ?? "Backlog",
    projetoId: p.id,
  }));

const STATUS_COLORS: Record<Status, string> = {
  "Backlog": "bg-muted text-muted-foreground border-border",
  "A Iniciar": "bg-slate-100 text-slate-800 border-slate-200",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  "Validação": "bg-amber-100 text-amber-800 border-amber-200",
  "Concluído": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Pausado": "bg-orange-100 text-orange-800 border-orange-200",
};

const CLASSIF_COLORS: Record<Classif, string> = {
  "Melhoria Contínua": "bg-blue-50 text-blue-800 border-blue-200",
  "Melhoria Contínua com EPP": "bg-purple-50 text-purple-800 border-purple-200",
};

export default function Melhorias() {
  const [itens, setItens] = useState<MelhoriaEstrategica[]>(SEED);
  const [areaSel, setAreaSel] = useState<Area | null>(null);
  const [q, setQ] = useState("");
  const [classifFilter, setClassifFilter] = useState<string>("Todas");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<MelhoriaEstrategica>>({ classificacao: "Melhoria Contínua", status: "Backlog" });

  const counts = useMemo(() => {
    const m = new Map<Area, number>();
    AREAS.forEach(a => m.set(a, 0));
    itens.forEach(i => m.set(i.area, (m.get(i.area) ?? 0) + 1));
    return m;
  }, [itens]);

  const lista = useMemo(() => itens.filter(i => {
    if (areaSel && i.area !== areaSel) return false;
    if (classifFilter !== "Todas" && i.classificacao !== classifFilter) return false;
    if (statusFilter !== "Todos" && i.status !== statusFilter) return false;
    if (q && !`${i.oQueFazer} ${i.justificativa} ${i.responsavel}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [itens, areaSel, classifFilter, statusFilter, q]);

  const total = itens.length;
  const local = itens.filter(i => i.classificacao === "Melhoria Contínua").length;
  const epp = itens.filter(i => i.classificacao === "Melhoria Contínua com EPP").length;
  const concluidas = itens.filter(i => i.status === "Concluído").length;

  function handleSave() {
    if (!draft.oQueFazer || !draft.area) return;
    const id = `ME-N${String(itens.length + 1).padStart(3, "0")}`;
    setItens(prev => [...prev, {
      id,
      area: draft.area as Area,
      classificacao: (draft.classificacao as Classif) ?? "Melhoria Contínua",
      oQueFazer: draft.oQueFazer ?? "",
      justificativa: draft.justificativa ?? "",
      resultadoEsperado: draft.resultadoEsperado ?? "",
      responsavel: draft.responsavel ?? "",
      dataPrevista: draft.dataPrevista ?? "",
      dataConclusao: draft.dataConclusao,
      status: (draft.status as Status) ?? "Backlog",
      objetivos: draft.objetivos ?? [],
      krs: draft.krs ?? [],
    }]);
    setDraft({ classificacao: "Melhoria Contínua", status: "Backlog", area: areaSel ?? undefined });
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Gestão de Melhorias Estratégicas
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plano de ação por área — iniciativas de <strong>Melhoria Contínua</strong> e <strong>Melhoria com Impacto em Processos (EPP)</strong>. Autonomia local com governança transversal.
        </p>
      </div>

      <Tabs defaultValue="plano" className="w-full">
        <TabsList>
          <TabsTrigger value="plano">Plano de Ação por Área</TabsTrigger>
          <TabsTrigger value="governanca">Governança</TabsTrigger>
          <TabsTrigger value="rituais">Rituais</TabsTrigger>
        </TabsList>

        <TabsContent value="plano" className="space-y-6 mt-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total de melhorias</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{total}</div>
            </Card>
            <Card className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Melhoria Contínua</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-blue-700">{local}</div>
            </Card>
            <Card className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Com Impacto (EPP)</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-purple-700">{epp}</div>
            </Card>
            <Card className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Concluídas</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-emerald-700">{concluidas}</div>
            </Card>
          </div>

          {!areaSel ? (
            <Card className="p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Selecione uma área</h3>
                  <p className="text-sm text-muted-foreground">Cada botão abre o plano de melhorias estratégicas da área.</p>
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
                        <Badge variant="outline" className="text-[10px]">{n} {n === 1 ? "melhoria" : "melhorias"}</Badge>
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
                  <h3 className="text-lg font-semibold">Plano de Melhorias · {areaSel}</h3>
                  <Badge variant="outline">{lista.length} {lista.length === 1 ? "item" : "itens"}</Badge>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5" onClick={() => setDraft(d => ({ ...d, area: areaSel }))}>
                      <Plus className="h-4 w-4" /> Nova melhoria estratégica
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Melhoria Estratégica · {areaSel}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Classificação</label>
                          <Select value={draft.classificacao} onValueChange={v => setDraft(d => ({ ...d, classificacao: v as Classif }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Melhoria Contínua">Melhoria Contínua (local)</SelectItem>
                              <SelectItem value="Melhoria Contínua com EPP">Com Impacto em Processos (EPP)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Status</label>
                          <Select value={draft.status} onValueChange={v => setDraft(d => ({ ...d, status: v as Status }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["Backlog","A Iniciar","Em Andamento","Validação","Concluído","Pausado"] as Status[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                        <Textarea value={draft.justificativa ?? ""} onChange={e => setDraft(d => ({ ...d, justificativa: e.target.value }))} placeholder="Por que esta melhoria? Qual problema/oportunidade?" rows={2} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Resultado esperado</label>
                        <Textarea value={draft.resultadoEsperado ?? ""} onChange={e => setDraft(d => ({ ...d, resultadoEsperado: e.target.value }))} placeholder="Impacto esperado (KR, indicador, ganho)" rows={2} />
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
                      <div className="border-t pt-3">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Vínculo Estratégico (Objetivos & KRs)</label>
                        <p className="text-[11px] text-muted-foreground mb-2">Selecione um ou mais objetivos do BSC e os KRs específicos que esta melhoria contribui.</p>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {OBJETIVOS_ESTRATEGICOS.map(o => {
                            const selected = (draft.objetivos ?? []).includes(o.codigo);
                            return (
                              <div key={o.codigo} className={cn("rounded-md border p-2", selected && "border-primary bg-primary/5")}>
                                <label className="flex items-start gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="mt-0.5"
                                    checked={selected}
                                    onChange={e => {
                                      const cur = new Set(draft.objetivos ?? []);
                                      if (e.target.checked) cur.add(o.codigo); else cur.delete(o.codigo);
                                      setDraft(d => ({ ...d, objetivos: Array.from(cur) }));
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className={cn("text-[10px]", PERSP_BADGE[o.perspectiva])}>{o.codigo}</Badge>
                                      <span className="text-sm font-medium">{o.nome}</span>
                                    </div>
                                    {selected && (
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {o.krs.map(kr => {
                                          const krKey = `${o.codigo}::${kr}`;
                                          const krSel = (draft.krs ?? []).includes(krKey);
                                          return (
                                            <button
                                              type="button"
                                              key={kr}
                                              onClick={() => {
                                                const cur = new Set(draft.krs ?? []);
                                                if (krSel) cur.delete(krKey); else cur.add(krKey);
                                                setDraft(d => ({ ...d, krs: Array.from(cur) }));
                                              }}
                                              className={cn(
                                                "text-[11px] px-2 py-0.5 rounded border transition-colors",
                                                krSel ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                                              )}
                                            >
                                              {krSel && <Check className="h-2.5 w-2.5 inline mr-1" />}{kr}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              </div>
                            );
                          })}
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
                  <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar melhoria, responsável…" className="pl-9" />
                </div>
                <Select value={classifFilter} onValueChange={setClassifFilter}>
                  <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas as classificações</SelectItem>
                    <SelectItem value="Melhoria Contínua">Melhoria Contínua</SelectItem>
                    <SelectItem value="Melhoria Contínua com EPP">Com Impacto (EPP)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os status</SelectItem>
                    {(["Backlog","A Iniciar","Em Andamento","Validação","Concluído","Pausado"] as Status[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Card>

              <Card className="shadow-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Classificação</TableHead>
                      <TableHead>O que fazer?</TableHead>
                      <TableHead>Justificativa</TableHead>
                      <TableHead>Resultado esperado</TableHead>
                      <TableHead className="w-[200px]">Vínculo OKR</TableHead>
                      <TableHead className="w-[160px]">Responsável</TableHead>
                      <TableHead className="w-[110px]">Prevista</TableHead>
                      <TableHead className="w-[110px]">Conclusão</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px] font-normal", CLASSIF_COLORS[i.classificacao])}>
                            {i.classificacao === "Melhoria Contínua com EPP" ? "Com EPP" : "Local"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{i.oQueFazer}</TableCell>
                        <TableCell className="text-sm text-muted-foreground line-clamp-2 max-w-[260px]">{i.justificativa || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground line-clamp-2 max-w-[220px]">{i.resultadoEsperado || "—"}</TableCell>
                        <TableCell className="text-sm">{i.responsavel || "—"}</TableCell>
                        <TableCell className="text-sm tabular-nums">{i.dataPrevista || "—"}</TableCell>
                        <TableCell className="text-sm tabular-nums">{i.dataConclusao || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[i.status])}>{i.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {i.projetoId && (
                            <Link to={`/melhorias/${i.projetoId}`}>
                              <Button size="sm" variant="ghost" className="gap-1 h-7 px-2 text-xs">
                                BC <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {lista.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                          Nenhuma melhoria estratégica para esta área. Clique em <strong>Nova melhoria estratégica</strong>.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Governança */}
        <TabsContent value="governanca" className="space-y-6 mt-6">
          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" /> Classificação das Iniciativas</h3>
            <p className="text-sm text-muted-foreground mb-5">Cada iniciativa é classificada em uma de três categorias, determinando o nível de governança.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-3 text-left font-medium border">Critério</th>
                    <th className="p-3 text-left font-medium border text-blue-700">Melhoria Contínua</th>
                    <th className="p-3 text-left font-medium border text-purple-700">Com Impacto em Processos</th>
                    <th className="p-3 text-left font-medium border text-emerald-700">Projeto Institucional</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Origem", "Operação local, problema pontual", "Sugestão local com reflexo em outras áreas", "Planejamento Estratégico / OKRs"],
                    ["Escopo", "Interno ao departamento", "Transversal (afeta múltiplos fluxos)", "Transformacional e complexo"],
                    ["Governança", "Gestor da área (autonomia total)", "Gestor + validação do Escritório de Processos", "Estrutura formal (PMO, Gates, Comitês)"],
                    ["Recursos", "Orçamento operacional (OPEX) local", "Recursos locais com apoio técnico do EPP", "Investimentos substanciais (CAPEX/OPEX)"],
                    ["Risco", "Gerenciável e local", "Risco de desalinhamento de processos", "Significativo (reputacional/legal)"],
                  ].map(row => (
                    <tr key={row[0]}>
                      <td className="p-3 border font-medium bg-muted/30">{row[0]}</td>
                      <td className="p-3 border">{row[1]}</td>
                      <td className="p-3 border">{row[2]}</td>
                      <td className="p-3 border">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Tabela de Amplitude</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Qualquer resposta <strong>SIM</strong> classifica automaticamente a iniciativa como <strong>Melhoria com Impacto em Processos (EPP)</strong>.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "Envolve outra área, altera entregas ou SLA entre departamentos?",
                "A melhoria altera processo corporativo mapeado?",
                "A melhoria exige mudança em sistema ou automação relevante?",
                "A melhoria pode gerar impacto financeiro relevante ou mudança operacional significativa?",
              ].map((q) => (
                <li key={q} className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border">
                  <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Papéis e Responsabilidades</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="font-semibold text-blue-900">Gestores de Área</div>
                <div className="text-sm text-blue-800/80 mt-1">Protagonistas. Identificam, conduzem e acompanham melhorias locais com autonomia.</div>
              </div>
              <div className="p-4 border rounded-lg bg-purple-50">
                <div className="font-semibold text-purple-900">Escritório de Processos (EPP)</div>
                <div className="text-sm text-purple-800/80 mt-1">Parceiro técnico. Apoia melhorias que afetam processos corporativos e mantém a matriz atualizada.</div>
              </div>
              <div className="p-4 border rounded-lg bg-emerald-50">
                <div className="font-semibold text-emerald-900">PMO</div>
                <div className="text-sm text-emerald-800/80 mt-1">Facilitador estratégico. Estrutura a metodologia e conecta melhorias à estratégia. Não executa.</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Rituais */}
        <TabsContent value="rituais" className="space-y-6 mt-6">
          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Quinzenal · Operacional</h3>
            <p className="text-xs text-muted-foreground mb-4">PMO + Escritório de Processos + Gestores</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 text-left font-medium">Ação</th>
                  <th className="p-2 text-center font-medium text-blue-700 w-32">Contínua</th>
                  <th className="p-2 text-center font-medium text-purple-700 w-32">EPP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Verificar rota, progresso e prazo", true, true],
                  ["Verificar mudanças de escopo", true, true],
                  ["Identificar e remover impedimentos operacionais", true, true],
                  ["Atualizar impacto das melhorias em indicadores", true, true],
                  ["Identificar novas melhorias de processos", true, true],
                  ["Atualizar backlog de melhorias", true, true],
                  ["Atualizar impacto em Objetivos e KRs", false, true],
                  ["Revisar mudanças e impactos em processos", false, true],
                  ["Discutir dependências interáreas", false, true],
                  ["Revisar e atualizar matriz de stakeholders", false, true],
                  ["Homologar alterações e atualizar matriz de processos", false, true],
                ].map(([acao, c, e]) => (
                  <tr key={String(acao)} className="border-t">
                    <td className="p-2">{acao as string}</td>
                    <td className="p-2 text-center">{c ? "✔" : "—"}</td>
                    <td className="p-2 text-center">{e ? "✔" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Mensal · Estratégico</h3>
            <p className="text-xs text-muted-foreground mb-4">Diretores + PMO + Escritório de Processos</p>
            <ul className="text-sm space-y-1.5">
              <li>✔ Consolidar impacto em objetivos, KRs e indicadores</li>
              <li>✔ Consolidar marcos entregues e pendências</li>
              <li>✔ Consolidar impacto em horas liberadas e financeiro</li>
              <li>✔ Coletar novas melhorias</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
