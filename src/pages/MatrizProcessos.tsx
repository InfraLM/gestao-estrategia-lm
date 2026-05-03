import { useMemo, useState } from "react";
import processos from "@/data/processos.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Network, FileText, Users, ArrowRight, ArrowLeft } from "lucide-react";

type Processo = (typeof processos)[number];

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

function getMacro(nome: string) {
  const m = nome.match(/^(\d{2})\.(\d{2})/);
  if (!m) return { macro: "—", sub: "—" };
  return { macro: m[1], sub: `${m[1]}.${m[2]}` };
}

export default function MatrizProcessos() {
  const [search, setSearch] = useState("");
  const [nivel, setNivel] = useState<string>("todos");
  const [diretor, setDiretor] = useState<string>("todos");
  const [status, setStatus] = useState<string>("todos");
  const [selected, setSelected] = useState<Processo | null>(null);

  const diretores = useMemo(() => Array.from(new Set(processos.map(p => p.diretor).filter(Boolean))).sort(), []);
  const niveis = ["Finalístico", "Gerencial", "Suporte"];
  const statuses = useMemo(() => Array.from(new Set(processos.map(p => p.status).filter(Boolean))).sort(), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (processos as Processo[]).filter(p => {
      if (nivel !== "todos" && p.nivel !== nivel) return false;
      if (diretor !== "todos" && p.diretor !== diretor) return false;
      if (status !== "todos" && p.status !== status) return false;
      if (q && !p.nome.toLowerCase().includes(q) && !p.dono.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, nivel, diretor, status]);

  const stats = useMemo(() => {
    const total = processos.length;
    const byNivel = niveis.map(n => ({ n, c: processos.filter(p => p.nivel === n).length }));
    const vigentes = processos.filter(p => p.status === "REVISÃO CONCLUÍDA VIGENTE").length;
    return { total, byNivel, vigentes };
  }, []);

  // Cadeia de valor: agrupar por macro
  const macroGroups = useMemo(() => {
    const groups: Record<string, { nivel: string; subs: Record<string, Processo[]> }> = {};
    (processos as Processo[]).forEach(p => {
      const { macro, sub } = getMacro(p.nome);
      if (!groups[macro]) groups[macro] = { nivel: p.nivel, subs: {} };
      if (!groups[macro].subs[sub]) groups[macro].subs[sub] = [];
      groups[macro].subs[sub].push(p);
    });
    return groups;
  }, []);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total de Processos</div>
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
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
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
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="cadeia">Cadeia de Valor</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Matriz de Processos · {filtered.length} processo(s)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processo</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Diretor</TableHead>
                    <TableHead>Dono</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Rev.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                      <TableCell className="font-medium max-w-md">{p.nome}</TableCell>
                      <TableCell>
                        {p.nivel && <Badge variant="outline" className={nivelColors[p.nivel]}>{p.nivel}</Badge>}
                      </TableCell>
                      <TableCell>{p.diretor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.dono}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[p.status] || "bg-muted"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{p.revisao ?? "—"}</TableCell>
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
