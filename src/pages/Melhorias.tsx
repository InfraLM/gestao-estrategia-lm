import { useConteudo } from "@/hooks/useConteudo";
import { EditarConteudo } from "@/components/EditarConteudo";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { ArrowLeft, ArrowRight, Plus, Search, Sparkles, GitBranch, ClipboardList, Users, Calendar, Target, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { projetos } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { loadMelhorias, saveMelhorias, type MelhoriaEstrategicaStored } from "@/hooks/useMelhoriasEstrategicas";

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
  "RH",
] as const;

type Area = typeof AREAS[number] | "";
type Classif = "Melhoria Contínua" | "Melhoria Contínua com EPP";
type Status = "Backlog" | "A Iniciar" | "Em Andamento" | "Validação" | "Concluído" | "Pausado";
type Origem = "OKR" | "Área" | "BPMO";

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
  origem?: Origem;
  okr?: string;
  okrs?: string[];
  wave?: string;
  updatedAt?: string;
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

import okrIniciativas from "@/data/okrIniciativas.json";

const SEED_PROJ: MelhoriaEstrategica[] = projetos
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
    objetivos: p.objetivos ?? [],
    krs: p.krs ?? [],
    origem: "Área" as Origem,
  }));

const SEED_OKR: MelhoriaEstrategica[] = (okrIniciativas as any[]).map(x => ({
  ...x,
  // Mantém área vazia quando não houve mapeamento — item fica em "Não classificadas"
  area: (AREAS.includes(x.area) ? x.area : "") as Area,
})) as MelhoriaEstrategica[];

const SEED: MelhoriaEstrategica[] = [...SEED_PROJ, ...SEED_OKR];

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

const COLS = [
  { key: "origem", label: "Origem", w: 100 },
  { key: "classificacao", label: "Classificação", w: 130 },
  { key: "oQueFazer", label: "O que fazer?", w: 240 },
  { key: "justificativa", label: "Justificativa", w: 220 },
  { key: "resultadoEsperado", label: "Resultado esperado", w: 200 },
  { key: "okr", label: "OKR / KR vinculado", w: 260 },
  { key: "vinculo", label: "BSC (Obj/KR)", w: 180 },
  { key: "responsavel", label: "Responsável", w: 160 },
  { key: "dataPrevista", label: "Prevista", w: 120 },
  { key: "dataConclusao", label: "Conclusão", w: 120 },
  { key: "status", label: "Status", w: 140 },
  { key: "acoes", label: "", w: 60 },
] as const;

const ORIGEM_COLORS: Record<Origem, string> = {
  "OKR": "bg-primary/10 text-primary border-primary/30",
  "Área": "bg-slate-100 text-slate-700 border-slate-200",
  "BPMO": "bg-blue-100 text-blue-800 border-blue-200",
};

export default function Melhorias() {
  const [itens, setItens] = useState<MelhoriaEstrategica[]>(() => {
    const stored = loadMelhorias();
    if (stored.length === 0) return SEED;
    const okrIds = new Set(SEED_OKR.map(s => s.id));
    const seedById = new Map(SEED_OKR.map(s => [s.id, s]));
    const existingOkrIds = new Set(stored.filter(s => s.id.startsWith("ME-OKR-")).map(s => s.id));
    const missing = SEED_OKR.filter(s => !existingOkrIds.has(s.id));
    // Re-sincroniza área das iniciativas OKR com o seed atual (permite marcar como "Não classificada")
    const migrated = (stored as MelhoriaEstrategica[]).map(it => {
      if (!okrIds.has(it.id)) return it;
      const seed = seedById.get(it.id);
      const patch: Partial<MelhoriaEstrategica> = { origem: "OKR" as Origem };
      // Sobrescreve área quando o item ainda está no fallback antigo "PMO Estratégico"
      // e o seed atual aponta para outra área (inclusive "" = Não classificada)
      if (seed && it.area === "PMO Estratégico" && seed.area !== "PMO Estratégico") {
        patch.area = seed.area;
      }
      return { ...it, ...patch };
    });
    return missing.length > 0 ? [...migrated, ...missing] : migrated;
  });
  const [areaSel, setAreaSel] = useState<Area | null>(null);
  const [q, setQ] = useState("");
  const [classifFilter, setClassifFilter] = useState<string>("Todas");
  const [origemFilter, setOrigemFilter] = useState<string>("Todas");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<MelhoriaEstrategica>>({ classificacao: "Melhoria Contínua", status: "Backlog" });
  const [colWidths, setColWidths] = useState<number[]>(COLS.map(c => c.w));
  const [vinculoFor, setVinculoFor] = useState<string | null>(null);

  // Persist to localStorage on every change so o Status Report reflete atualizações em tempo real.
  useEffect(() => {
    saveMelhorias(itens as MelhoriaEstrategicaStored[]);
  }, [itens]);

  function startResize(idx: number, e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = colWidths[idx];
    const onMove = (ev: MouseEvent) => {
      const w = Math.max(70, startW + (ev.clientX - startX));
      setColWidths(prev => prev.map((v, i) => i === idx ? w : v));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function updateItem(id: string, patch: Partial<MelhoriaEstrategica>) {
    setItens(prev => prev.map(i => i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } as MelhoriaEstrategica : i));
  }

  const counts = useMemo(() => {
    const m = new Map<Area, number>();
    AREAS.forEach(a => m.set(a, 0));
    itens.forEach(i => m.set(i.area, (m.get(i.area) ?? 0) + 1));
    return m;
  }, [itens]);

  const lista = useMemo(() => itens.filter(i => {
    if (areaSel && i.area !== areaSel) return false;
    if (classifFilter !== "Todas" && i.classificacao !== classifFilter) return false;
    if (origemFilter !== "Todas" && (i.origem ?? "Área") !== origemFilter) return false;
    if (statusFilter !== "Todos" && i.status !== statusFilter) return false;
    if (q && !`${i.oQueFazer} ${i.justificativa} ${i.responsavel} ${i.okr ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [itens, areaSel, classifFilter, origemFilter, statusFilter, q]);

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
            {([
              ["Total de melhorias", total, "", () => { setClassifFilter("Todas"); setStatusFilter("Todos"); }, classifFilter === "Todas" && statusFilter === "Todos"],
              ["Melhoria Contínua", local, "text-blue-700", () => { setClassifFilter("Melhoria Contínua"); setStatusFilter("Todos"); }, classifFilter === "Melhoria Contínua"],
              ["Com Impacto (EPP)", epp, "text-purple-700", () => { setClassifFilter("Melhoria Contínua com EPP"); setStatusFilter("Todos"); }, classifFilter === "Melhoria Contínua com EPP"],
              ["Concluídas", concluidas, "text-emerald-700", () => { setClassifFilter("Todas"); setStatusFilter("Concluído"); }, statusFilter === "Concluído"],
            ] as [string, number, string, () => void, boolean][]).map(([l, v, c, fn, on]) => (
              <Card key={l} role="button" tabIndex={0} onClick={fn} onKeyDown={(e) => e.key === "Enter" && fn()} className={`p-5 shadow-card cursor-pointer hover:shadow-elevated transition-shadow ${on ? "ring-2 ring-primary" : ""}`}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
                <div className={`mt-2 text-3xl font-semibold tabular-nums ${c}`}>{v}</div>
              </Card>
            ))}
          </div>

          {!areaSel ? (
            <>
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

            {/* Iniciativas sem área — classificação manual */}
            {(() => {
              const semArea = itens.filter(i => !i.area);
              if (semArea.length === 0) return null;
              return (
                <Card className="p-6 shadow-card border-amber-300 bg-amber-50/40">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-amber-700" />
                        Iniciativas sem área definida
                        <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-900">{semArea.length}</Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Estas iniciativas foram importadas dos OKRs sem departamento mapeado. Atribua uma área para movê-las para o plano correspondente.
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                          <th className="py-2 pr-3">Iniciativa</th>
                          <th className="py-2 pr-3">OKR / KR</th>
                          <th className="py-2 pr-3">Responsável</th>
                          <th className="py-2 pr-3">Depto original</th>
                          <th className="py-2 pr-3 w-56">Atribuir área</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semArea.map(it => (
                          <tr key={it.id} className="border-b last:border-b-0 align-top">
                            <td className="py-2 pr-3 max-w-[380px]">{it.oQueFazer}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[260px]">{it.okr ?? ""}</td>
                            <td className="py-2 pr-3 text-xs">{it.responsavel ?? "—"}</td>
                            <td className="py-2 pr-3 text-xs italic text-muted-foreground">{(it as any).deptOriginal || "—"}</td>
                            <td className="py-2 pr-3">
                              <Select value="" onValueChange={v => updateItem(it.id, { area: v as Area })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar área…" /></SelectTrigger>
                                <SelectContent>
                                  {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })()}
            </>
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
                <Select value={origemFilter} onValueChange={setOrigemFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas as origens</SelectItem>
                    <SelectItem value="OKR">OKR</SelectItem>
                    <SelectItem value="Área">Área</SelectItem>
                    <SelectItem value="BPMO">BPMO</SelectItem>
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

              <Card className="shadow-card overflow-x-auto">
                <table className="text-sm border-collapse" style={{ width: colWidths.reduce((a,b)=>a+b,0) }}>
                  <colgroup>
                    {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                  </colgroup>
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      {COLS.map((c, i) => (
                        <th key={c.key} className="relative text-left text-xs font-medium text-muted-foreground px-3 py-2 select-none">
                          {c.label}
                          {i < COLS.length - 1 && (
                            <span
                              onMouseDown={(e) => startResize(i, e)}
                              className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40"
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map(i => {
                      const krsLegacy = (i.krs ?? []).filter(k => !k.includes("::"));
                      return (
                      <tr key={i.id} className="border-b hover:bg-muted/20 align-top">
                        <td className="px-2 py-2">
                          <Select value={i.origem ?? "Área"} onValueChange={v => updateItem(i.id, { origem: v as Origem })}>
                            <SelectTrigger className={cn("h-7 text-[11px]", ORIGEM_COLORS[(i.origem ?? "Área") as Origem])}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OKR">OKR</SelectItem>
                              <SelectItem value="Área">Área</SelectItem>
                              <SelectItem value="BPMO">BPMO</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Select value={i.classificacao} onValueChange={v => updateItem(i.id, { classificacao: v as Classif })}>
                            <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Melhoria Contínua">Local</SelectItem>
                              <SelectItem value="Melhoria Contínua com EPP">Com EPP</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1">
                          <Textarea value={i.oQueFazer} rows={2} onChange={e => updateItem(i.id, { oQueFazer: e.target.value })} className="text-sm font-medium min-h-[36px] resize-none" />
                        </td>
                        <td className="px-2 py-1">
                          <Textarea value={i.justificativa} rows={2} onChange={e => updateItem(i.id, { justificativa: e.target.value })} className="text-xs min-h-[36px] resize-none" />
                        </td>
                        <td className="px-2 py-1">
                          <Textarea value={i.resultadoEsperado} rows={2} onChange={e => updateItem(i.id, { resultadoEsperado: e.target.value })} className="text-xs min-h-[36px] resize-none" />
                        </td>
                        <td className="px-2 py-1">
                          <Textarea
                            value={i.okr ?? ""}
                            rows={2}
                            onChange={e => updateItem(i.id, { okr: e.target.value })}
                            placeholder={i.origem === "OKR" ? "KR vinculado" : "—"}
                            className="text-[11px] min-h-[36px] resize-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {(i.objetivos && i.objetivos.length > 0) || krsLegacy.length > 0 ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex flex-wrap gap-1 hover:opacity-80 text-left">
                                  {(i.objetivos ?? []).slice(0, 3).map(cod => {
                                    const o = OBJETIVOS_ESTRATEGICOS.find(x => x.codigo === cod);
                                    return (
                                      <Badge key={cod} variant="outline" className={cn("text-[10px]", o && PERSP_BADGE[o.perspectiva])}>{cod}</Badge>
                                    );
                                  })}
                                  {(i.objetivos?.length ?? 0) > 3 && <Badge variant="outline" className="text-[10px]">+{(i.objetivos!.length - 3)}</Badge>}
                                  {krsLegacy.slice(0, 3).map(k => (
                                    <Badge key={k} variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-800">{k}</Badge>
                                  ))}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-3 space-y-2">
                                {(i.objetivos ?? []).map(cod => {
                                  const o = OBJETIVOS_ESTRATEGICOS.find(x => x.codigo === cod);
                                  if (!o) return null;
                                  const krs = (i.krs ?? []).filter(k => k.startsWith(`${cod}::`)).map(k => k.split("::")[1]);
                                  return (
                                    <div key={cod} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("text-[10px]", PERSP_BADGE[o.perspectiva])}>{cod}</Badge>
                                        <span className="font-medium">{o.nome}</span>
                                      </div>
                                      {krs.length > 0 && (
                                        <ul className="mt-1 ml-2 list-disc list-inside text-muted-foreground">
                                          {krs.map(kr => <li key={kr}>{kr}</li>)}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                })}
                                {krsLegacy.length > 0 && (
                                  <div className="text-xs pt-1 border-t">
                                    <div className="font-medium mb-1">KRs vinculados</div>
                                    <div className="flex flex-wrap gap-1">
                                      {krsLegacy.map(k => <Badge key={k} variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-800">{k}</Badge>)}
                                    </div>
                                  </div>
                                )}
                                <button onClick={() => { setDraft({ ...i }); setVinculoFor(i.id); }} className="text-[11px] text-primary hover:underline">Editar vínculo…</button>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <button onClick={() => { setDraft({ ...i }); setVinculoFor(i.id); }} className="text-xs text-primary hover:underline">+ vincular</button>
                          )}
                        </td>
                        <td className="px-2 py-1">
                          <Input value={i.responsavel} onChange={e => updateItem(i.id, { responsavel: e.target.value })} className="h-7 text-xs" />
                        </td>
                        <td className="px-2 py-1">
                          <Input type="date" value={i.dataPrevista} onChange={e => updateItem(i.id, { dataPrevista: e.target.value })} className="h-7 text-xs" />
                        </td>
                        <td className="px-2 py-1">
                          <Input type="date" value={i.dataConclusao ?? ""} onChange={e => updateItem(i.id, { dataConclusao: e.target.value })} className="h-7 text-xs" />
                        </td>
                        <td className="px-3 py-2">
                          <Select value={i.status} onValueChange={v => updateItem(i.id, { status: v as Status })}>
                            <SelectTrigger className={cn("h-7 text-[11px]", STATUS_COLORS[i.status])}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["Backlog","A Iniciar","Em Andamento","Validação","Concluído","Pausado"] as Status[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          {i.projetoId && (
                            <Link to={`/melhorias/${i.projetoId}`}>
                              <Button size="sm" variant="ghost" className="gap-1 h-7 px-2 text-xs">
                                BC <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                    {lista.length === 0 && (
                      <tr>
                        <td colSpan={COLS.length} className="text-center text-muted-foreground py-10">
                          Nenhuma melhoria estratégica para esta área. Clique em <strong>Nova melhoria estratégica</strong>.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>

              {/* Dialog edição de vínculo OKR/KR */}
              <Dialog open={vinculoFor !== null} onOpenChange={(v) => { if (!v) setVinculoFor(null); }}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Editar Vínculo Estratégico</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {OBJETIVOS_ESTRATEGICOS.map(o => {
                      const selected = (draft.objetivos ?? []).includes(o.codigo);
                      return (
                        <div key={o.codigo} className={cn("rounded-md border p-2", selected && "border-primary bg-primary/5")}>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input type="checkbox" className="mt-0.5" checked={selected} onChange={e => {
                              const cur = new Set(draft.objetivos ?? []);
                              if (e.target.checked) cur.add(o.codigo); else cur.delete(o.codigo);
                              setDraft(d => ({ ...d, objetivos: Array.from(cur) }));
                            }} />
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
                                      <button type="button" key={kr} onClick={() => {
                                        const cur = new Set(draft.krs ?? []);
                                        if (krSel) cur.delete(krKey); else cur.add(krKey);
                                        setDraft(d => ({ ...d, krs: Array.from(cur) }));
                                      }} className={cn("text-[11px] px-2 py-0.5 rounded border", krSel ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted")}>
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
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setVinculoFor(null)}>Cancelar</Button>
                    <Button onClick={() => {
                      if (vinculoFor) updateItem(vinculoFor, { objetivos: draft.objetivos ?? [], krs: draft.krs ?? [] });
                      setVinculoFor(null);
                    }}>Salvar vínculo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </TabsContent>

        {/* Governança */}
        <TabsContent value="governanca" className="space-y-6 mt-6">
          <MatrizClassificacao />
          <MatrizAmplitude />

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

const CLASSIF_DEF = {
  colunas: ["Melhoria Contínua", "Com Impacto em Processos", "Projeto Institucional"],
  linhas: [
    { criterio: "Origem", valores: ["Operação local, problema pontual", "Sugestão local com reflexo em outras áreas", "Planejamento Estratégico / OKRs"] },
    { criterio: "Escopo", valores: ["Interno ao departamento", "Transversal (afeta múltiplos fluxos)", "Transformacional e complexo"] },
    { criterio: "Governança", valores: ["Gestor da área (autonomia total)", "Gestor + validação do Escritório de Processos", "Estrutura formal (PMO, Gates, Comitês)"] },
    { criterio: "Recursos", valores: ["Orçamento operacional (OPEX) local", "Recursos locais com apoio técnico do EPP", "Investimentos substanciais (CAPEX/OPEX)"] },
    { criterio: "Risco", valores: ["Gerenciável e local", "Risco de desalinhamento de processos", "Significativo (reputacional/legal)"] },
  ],
};
const AMPLITUDE_DEF = [
  "Envolve outra área, altera entregas ou SLA entre departamentos?",
  "A melhoria altera processo corporativo mapeado?",
  "A melhoria exige mudança em sistema ou automação relevante?",
  "A melhoria pode gerar impacto financeiro relevante ou mudança operacional significativa?",
];

function MatrizClassificacao() {
  const { data } = useConteudo("melh.classificacao", CLASSIF_DEF);
  return (
    <Card className="p-6 shadow-card">
      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" /> Classificação das Iniciativas <span className="ml-auto"><EditarConteudo chave="melh.classificacao" padrao={CLASSIF_DEF} titulo="Classificação das Iniciativas" /></span></h3>
      <p className="text-sm text-muted-foreground mb-5">Cada iniciativa é classificada em uma de três categorias, determinando o nível de governança.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-3 text-left font-medium border">Critério</th>
              {data.colunas.map((c) => <th key={c} className="p-3 text-left font-medium border">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.linhas.map((row, i) => (
              <tr key={i}>
                <td className="p-3 border font-medium bg-muted/30">{row.criterio}</td>
                {row.valores.map((v, j) => <td key={j} className="p-3 border">{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MatrizAmplitude() {
  const { data } = useConteudo("melh.amplitude", AMPLITUDE_DEF);
  return (
    <Card className="p-6 shadow-card">
      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Tabela de Amplitude <span className="ml-auto"><EditarConteudo chave="melh.amplitude" padrao={AMPLITUDE_DEF} titulo="Tabela de Amplitude" /></span></h3>
      <p className="text-sm text-muted-foreground mb-4">
        Qualquer resposta <strong>SIM</strong> classifica automaticamente a iniciativa como <strong>Melhoria com Impacto em Processos (EPP)</strong>.
      </p>
      <ul className="space-y-2 text-sm">
        {data.map((q, i) => (
          <li key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border">
            <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
