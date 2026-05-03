import { useEffect, useMemo, useState } from "react";
import processosSeed from "@/data/processos.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileText, Users, ArrowRight, ArrowLeft, RotateCcw, Target, Workflow, ShieldAlert, AlertTriangle } from "lucide-react";
import { E2E_ZONES, zonesForProcesso, type E2EZone } from "@/data/e2eZones";

type Processo = {
  id: string;
  nome: string;
  nivel: string;
  revisao: number | null;
  diretor: string;
  dono: string;
  status: string;
  fornecedores: string[];
  clientes: string[];
  documentos: any[];
  maturidade?: number;
  kpiValor?: number;
  vinculo?: Record<string, number>;
};

const STORAGE_KEY = "matriz-processos-edits-v1";

// Objetivos estratégicos (BSC LM)
const OBJETIVOS = [
  { codigo: "F.01", nome: "Previsibilidade de Caixa", perspectiva: "Financeira" },
  { codigo: "F.02", nome: "Crescimento Rentável", perspectiva: "Financeira" },
  { codigo: "C.01", nome: "Experiência WOW", perspectiva: "Cliente" },
  { codigo: "C.02", nome: "Penetração de Mercado", perspectiva: "Cliente" },
  { codigo: "C.03", nome: "Marca & Autoridade", perspectiva: "Cliente" },
  { codigo: "P.01", nome: "Conversão Comercial", perspectiva: "Processos" },
  { codigo: "P.02", nome: "Eficiência de Cobrança", perspectiva: "Processos" },
  { codigo: "P.03", nome: "Automação de Processos Core", perspectiva: "Processos" },
  { codigo: "AC.01", nome: "Cultura & Performance", perspectiva: "Aprendizagem" },
  { codigo: "AC.02", nome: "Capacitação & Talentos", perspectiva: "Aprendizagem" },
  { codigo: "AC.03", nome: "AI First · Human First", perspectiva: "Aprendizagem" },
] as const;

const PERSP_COLORS: Record<string, string> = {
  "Financeira": "bg-emerald-500/15 text-emerald-700",
  "Cliente": "bg-primary/15 text-primary",
  "Processos": "bg-blue-500/15 text-blue-700",
  "Aprendizagem": "bg-amber-500/15 text-amber-700",
};

function impactoFromTotal(total: number) {
  if (total >= 12) return { label: "Forte", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/40" };
  if (total >= 8)  return { label: "Moderado", color: "bg-blue-500/20 text-blue-700 border-blue-500/40" };
  if (total >= 5)  return { label: "Fraco", color: "bg-amber-500/20 text-amber-700 border-amber-500/40" };
  if (total > 0)   return { label: "Muito fraco", color: "bg-red-500/20 text-red-700 border-red-500/40" };
  return { label: "Sem vínculo", color: "bg-muted text-muted-foreground border-border" };
}

function totalVinculo(p: Processo) {
  return Object.values(p.vinculo || {}).reduce((a, b) => a + (Number(b) || 0), 0);
}

const VINC_CELL: Record<number, string> = {
  0: "bg-muted/30 text-muted-foreground",
  1: "bg-amber-500/15 text-amber-700",
  2: "bg-blue-500/20 text-blue-700",
  3: "bg-emerald-500/25 text-emerald-700 font-semibold",
};


const statusColors: Record<string, string> = {
  "BACKLOG": "bg-muted text-muted-foreground",
  "A INICIAR": "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "MAPEAMENTO AS-IS/TO-BE": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "MELHORIAS/ ANÁLISE": "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  "VALIDAÇÃO INTERNA": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  "APROVAÇÃO DIRETORIA": "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "REVISÃO CONCLUÍDA VIGENTE": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "PARALISADO": "bg-red-500/15 text-red-700 dark:text-red-300",
};

const nivelColors: Record<string, string> = {
  "Finalístico": "bg-primary/15 text-primary border-primary/30",
  "Gerencial": "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "Suporte": "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

const NIVEIS = ["Finalístico", "Gerencial", "Suporte"];
const DIRETORES = ["Iuri", "Naira", "Ian", "Yuri", "Bruno"];
const STATUSES = [
  "BACKLOG", "A INICIAR", "MAPEAMENTO AS-IS/TO-BE", "MELHORIAS/ ANÁLISE",
  "VALIDAÇÃO INTERNA", "APROVAÇÃO DIRETORIA", "REVISÃO CONCLUÍDA VIGENTE", "PARALISADO",
];
const MATURIDADES = [
  { v: 1, label: "1 · Inicial", color: "bg-red-500/15 text-red-700 dark:text-red-300" },
  { v: 2, label: "2 · Repetível", color: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  { v: 3, label: "3 · Definido", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { v: 4, label: "4 · Gerenciado", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { v: 5, label: "5 · Otimizado", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
];

function getMacro(nome: string) {
  const m = nome.match(/^(\d{2})\.(\d{2})/);
  if (!m) return { macro: "—", sub: "—" };
  return { macro: m[1], sub: `${m[1]}.${m[2]}` };
}

function kpiColor(v?: number) {
  if (v == null) return "text-muted-foreground";
  if (v >= 80) return "text-emerald-600";
  if (v >= 50) return "text-amber-600";
  return "text-red-600";
}

export default function MatrizProcessos() {
  const [search, setSearch] = useState("");
  const [nivel, setNivel] = useState<string>("todos");
  const [diretor, setDiretor] = useState<string>("todos");
  const [status, setStatus] = useState<string>("todos");
  const [zonaE2E, setZonaE2E] = useState<string>("todos");
  const [selected, setSelected] = useState<Processo | null>(null);
  const [data, setData] = useState<Processo[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const edits: Record<string, Partial<Processo>> = raw ? JSON.parse(raw) : {};
      return (processosSeed as Processo[]).map(p => ({ ...p, ...edits[p.id] }));
    } catch {
      return processosSeed as Processo[];
    }
  });

  useEffect(() => {
    const edits: Record<string, Partial<Processo>> = {};
    data.forEach(p => {
      const seed = (processosSeed as Processo[]).find(s => s.id === p.id)!;
      const diff: Partial<Processo> = {};
      (["nivel", "diretor", "status", "maturidade", "kpiValor", "vinculo"] as const).forEach(k => {
        if ((p as any)[k] !== (seed as any)[k]) (diff as any)[k] = (p as any)[k];
      });
      if (Object.keys(diff).length) edits[p.id] = diff;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
  }, [data]);

  const updateField = (id: string, field: keyof Processo, value: any) => {
    setData(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const resetAll = () => {
    if (!confirm("Resetar todas as edições da matriz?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setData(processosSeed as Processo[]);
  };

  const diretores = DIRETORES;
  const niveis = NIVEIS;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter(p => {
      if (nivel !== "todos" && p.nivel !== nivel) return false;
      if (diretor !== "todos" && p.diretor !== diretor) return false;
      if (status !== "todos" && p.status !== status) return false;
      if (zonaE2E !== "todos") {
        const zs = zonesForProcesso(p.nome).map(z => z.id);
        if (!zs.includes(zonaE2E)) return false;
      }
      if (q && !p.nome.toLowerCase().includes(q) && !p.dono.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, nivel, diretor, status, zonaE2E, data]);

  const stats = useMemo(() => {
    const total = data.length;
    const byNivel = niveis.map(n => ({ n, c: data.filter(p => p.nivel === n).length }));
    const vigentes = data.filter(p => p.status === "REVISÃO CONCLUÍDA VIGENTE").length;
    const matAvg = (() => {
      const vals = data.map(p => p.maturidade).filter((v): v is number => !!v);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
    })();
    const kpiAvg = (() => {
      const vals = data.map(p => p.kpiValor).filter((v): v is number => v != null);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) + "%" : "—";
    })();
    return { total, byNivel, vigentes, matAvg, kpiAvg };
  }, [data]);

  const macroGroups = useMemo(() => {
    const groups: Record<string, { nivel: string; subs: Record<string, Processo[]> }> = {};
    data.forEach(p => {
      const { macro, sub } = getMacro(p.nome);
      if (!groups[macro]) groups[macro] = { nivel: p.nivel, subs: {} };
      if (!groups[macro].subs[sub]) groups[macro].subs[sub] = [];
      groups[macro].subs[sub].push(p);
    });
    return groups;
  }, [data]);


  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-2xl font-semibold mt-1">{stats.total}</div>
        </CardContent></Card>
        {stats.byNivel.map(b => (
          <Card key={b.n}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{b.n}</div>
            <div className="text-2xl font-semibold mt-1">{b.c}</div>
          </CardContent></Card>
        ))}
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Vigentes</div>
          <div className="text-2xl font-semibold mt-1 text-emerald-600">{stats.vigentes}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Maturidade média</div>
          <div className="text-2xl font-semibold mt-1">{stats.matAvg}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">KPI valor médio</div>
          <div className="text-2xl font-semibold mt-1">{stats.kpiAvg}</div>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-7 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar processo ou dono..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={nivel} onValueChange={setNivel}>
            <SelectTrigger><SelectValue placeholder="Nível" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os níveis</SelectItem>
              {niveis.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={diretor} onValueChange={setDiretor}>
            <SelectTrigger><SelectValue placeholder="Diretor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os diretores</SelectItem>
              {diretores.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={zonaE2E} onValueChange={setZonaE2E}>
            <SelectTrigger><SelectValue placeholder="Zona E2E" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as zonas E2E</SelectItem>
              {E2E_ZONES.map(z => <SelectItem key={z.id} value={z.id}>{z.id} · {z.titulo}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={resetAll} className="flex items-center justify-center gap-2 text-xs px-3 rounded-md border border-border hover:bg-surface-muted transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Resetar edições
          </button>
        </CardContent>
      </Card>

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="cadeia">Cadeia de Valor</TabsTrigger>
          <TabsTrigger value="vinculo"><Target className="h-3.5 w-3.5 mr-1" />Vínculo Estratégico</TabsTrigger>
          <TabsTrigger value="e2e"><Workflow className="h-3.5 w-3.5 mr-1" />Matriz E2E</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Matriz de Processos · {filtered.length} processo(s) · edição inline</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[280px]">Processo</TableHead>
                    <TableHead className="w-[140px]">Nível</TableHead>
                    <TableHead className="w-[120px]">Diretor</TableHead>
                    <TableHead className="min-w-[160px]">Dono</TableHead>
                    <TableHead className="w-[200px]">Status</TableHead>
                    <TableHead className="w-[160px]">Maturidade</TableHead>
                    <TableHead className="w-[140px]">KPI valor (%)</TableHead>
                    <TableHead className="text-center w-[60px]">Rev.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <button onClick={() => setSelected(p)} className="text-left hover:underline">{p.nome}</button>
                      </TableCell>
                      <TableCell>
                        <Select value={p.nivel || ""} onValueChange={v => updateField(p.id, "nivel", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {NIVEIS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={p.diretor || ""} onValueChange={v => updateField(p.id, "diretor", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {DIRETORES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.dono}</TableCell>
                      <TableCell>
                        <Select value={p.status || ""} onValueChange={v => updateField(p.id, "status", v)}>
                          <SelectTrigger className={`h-8 text-xs ${statusColors[p.status] || ""}`}><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={p.maturidade ? String(p.maturidade) : ""} onValueChange={v => updateField(p.id, "maturidade", Number(v))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {MATURIDADES.map(m => <SelectItem key={m.v} value={String(m.v)}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={p.kpiValor ?? ""}
                            onChange={e => {
                              const v = e.target.value === "" ? undefined : Math.max(0, Math.min(100, Number(e.target.value)));
                              updateField(p.id, "kpiValor", v);
                            }}
                            className="h-8 text-xs w-16"
                          />
                          <span className={`text-xs font-medium ${kpiColor(p.kpiValor)}`}>
                            {p.kpiValor != null ? `${p.kpiValor}%` : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs">{p.revisao ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cadeia" className="space-y-6">
          {niveis.map(nv => {
            const macros = Object.entries(macroGroups).filter(([, g]) => g.nivel === nv).sort();
            if (!macros.length) return null;
            return (
              <Card key={nv}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant="outline" className={nivelColors[nv]}>{nv}</Badge>
                    <span className="text-muted-foreground text-sm font-normal">{macros.reduce((a, [, g]) => a + Object.values(g.subs).flat().length, 0)} processos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {macros.map(([macro, g]) => (
                    <div key={macro} className="border border-border rounded-lg p-3 bg-surface-muted/40">
                      <div className="font-semibold text-sm mb-2">Macroprocesso {macro}</div>
                      <div className="space-y-1.5">
                        {Object.entries(g.subs).sort().map(([sub, items]) => (
                          <div key={sub}>
                            <div className="text-xs font-medium text-muted-foreground mb-1">{sub}</div>
                            {items.map(p => (
                              <button
                                key={p.id}
                                onClick={() => setSelected(p)}
                                className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-background border border-transparent hover:border-border transition-colors"
                              >
                                {p.nome.replace(/^[\d.]+\s*[-–]\s*/, "")}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="vinculo">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Vínculo Estratégico · Processos × Objetivos BSC
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Pontue 0 (sem vínculo), 1 (fraco), 2 (moderado) ou 3 (forte) o quanto cada processo contribui para cada objetivo. O impacto estratégico é calculado pela soma.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="Financeira" className="w-full">
                <div className="px-4 pt-2">
                  <TabsList className="flex-wrap h-auto">
                    {Array.from(new Set(OBJETIVOS.map(o => o.perspectiva))).map(p => (
                      <TabsTrigger key={p} value={p} className="text-xs">
                        <Badge variant="outline" className={`${PERSP_COLORS[p]} mr-1.5 px-1.5 py-0 text-[10px] border-0`}>
                          {OBJETIVOS.filter(o => o.perspectiva === p).length}
                        </Badge>
                        {p}
                      </TabsTrigger>
                    ))}
                    <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
                  </TabsList>
                </div>

                {Array.from(new Set(OBJETIVOS.map(o => o.perspectiva))).map(persp => {
                  const objs = OBJETIVOS.filter(o => o.perspectiva === persp);
                  return (
                    <TabsContent key={persp} value={persp} className="mt-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[280px] sticky left-0 bg-background z-10">Processo</TableHead>
                              {objs.map(o => (
                                <TableHead key={o.codigo} className="text-center w-[110px]">
                                  <div className="font-semibold">{o.codigo}</div>
                                  <div className="text-[10px] font-normal text-muted-foreground leading-tight mt-0.5">{o.nome}</div>
                                </TableHead>
                              ))}
                              <TableHead className="text-center w-[100px]">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map(p => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium text-xs sticky left-0 bg-background z-10">
                                  <button onClick={() => setSelected(p)} className="text-left hover:underline">{p.nome}</button>
                                </TableCell>
                                {objs.map(o => {
                                  const v = p.vinculo?.[o.codigo] ?? 0;
                                  return (
                                    <TableCell key={o.codigo} className="p-1">
                                      <Select
                                        value={String(v)}
                                        onValueChange={val => updateField(p.id, "vinculo", { ...(p.vinculo || {}), [o.codigo]: Number(val) })}
                                      >
                                        <SelectTrigger className={`h-8 text-xs justify-center ${VINC_CELL[v]}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="0">0 · Sem vínculo</SelectItem>
                                          <SelectItem value="1">1 · Fraco</SelectItem>
                                          <SelectItem value="2">2 · Moderado</SelectItem>
                                          <SelectItem value="3">3 · Forte</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center text-xs font-semibold tabular-nums">
                                  {objs.reduce((a, o) => a + (p.vinculo?.[o.codigo] ?? 0), 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  );
                })}

                <TabsContent value="resumo" className="mt-0 p-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[280px]">Processo</TableHead>
                          <TableHead className="w-[120px]">Diretor</TableHead>
                          <TableHead className="text-center w-[100px]">Total</TableHead>
                          <TableHead className="w-[160px]">Impacto Estratégico</TableHead>
                          <TableHead className="text-left">Distribuição por perspectiva</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...filtered].sort((a, b) => totalVinculo(b) - totalVinculo(a)).map(p => {
                          const total = totalVinculo(p);
                          const imp = impactoFromTotal(total);
                          const byPersp = Array.from(new Set(OBJETIVOS.map(o => o.perspectiva))).map(persp => ({
                            persp,
                            v: OBJETIVOS.filter(o => o.perspectiva === persp).reduce((a, o) => a + (p.vinculo?.[o.codigo] ?? 0), 0),
                          }));
                          const max = Math.max(1, ...byPersp.map(b => b.v));
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium text-xs">
                                <button onClick={() => setSelected(p)} className="text-left hover:underline">{p.nome}</button>
                              </TableCell>
                              <TableCell className="text-xs">{p.diretor || "—"}</TableCell>
                              <TableCell className="text-center font-semibold tabular-nums">{total}</TableCell>
                              <TableCell><Badge variant="outline" className={`text-xs ${imp.color}`}>{imp.label}</Badge></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {byPersp.map(b => (
                                    <div key={b.persp} className="flex-1 min-w-[60px]">
                                      <div className="text-[10px] text-muted-foreground mb-0.5 flex justify-between">
                                        <span>{b.persp.slice(0,4)}</span><span className="tabular-nums">{b.v}</span>
                                      </div>
                                      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${PERSP_COLORS[b.persp]?.split(" ")[0] || "bg-primary"}`} style={{ width: `${(b.v / (max || 1)) * 100}%` }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="e2e">
          <E2EDashboard processos={data} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base pr-8">{selected.nome}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selected.nivel && <Badge variant="outline" className={nivelColors[selected.nivel]}>{selected.nivel}</Badge>}
                  <Badge className={statusColors[selected.status] || "bg-muted"}>{selected.status}</Badge>
                  {selected.revisao && <Badge variant="outline">Revisão {selected.revisao}</Badge>}
                  {(() => { const imp = impactoFromTotal(totalVinculo(selected)); return <Badge variant="outline" className={imp.color}><Target className="h-3 w-3 mr-1" />{imp.label} · {totalVinculo(selected)}</Badge>; })()}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Diretor responsável</div>
                    <div className="font-medium">{selected.diretor || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Dono do processo</div>
                    <div className="font-medium">{selected.dono || "—"}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4 text-blue-500" /> Processos fornecedores (input)</div>
                  {selected.fornecedores.length ? (
                    <ul className="space-y-1 text-sm pl-2">
                      {selected.fornecedores.map((f, i) => <li key={i} className="text-muted-foreground">• {f}</li>)}
                    </ul>
                  ) : <div className="text-xs text-muted-foreground italic">Nenhum</div>}
                </div>

                <div>
                  <div className="text-sm font-semibold flex items-center gap-2 mb-2"><ArrowRight className="h-4 w-4 text-emerald-500" /> Processos clientes (output)</div>
                  {selected.clientes.length ? (
                    <ul className="space-y-1 text-sm pl-2">
                      {selected.clientes.map((f, i) => <li key={i} className="text-muted-foreground">• {f}</li>)}
                    </ul>
                  ) : <div className="text-xs text-muted-foreground italic">Nenhum</div>}
                </div>

                <div>
                  <div className="text-sm font-semibold flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-amber-500" /> Documentos controlados</div>
                  {selected.documentos.length ? (
                    <ul className="space-y-1 text-sm pl-2">
                      {selected.documentos.map((f, i) => <li key={i} className="text-muted-foreground">• {f}</li>)}
                    </ul>
                  ) : <div className="text-xs text-muted-foreground italic">Nenhum</div>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
