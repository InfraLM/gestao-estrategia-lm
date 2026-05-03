import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProcessosDB } from "@/hooks/useProcessosDB";
import { useProjetosDB } from "@/hooks/useProjetosDB";
import { useRiscosInstitucionaisDB } from "@/hooks/useRiscosInstitucionaisDB";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, AlertTriangle, ArrowRight, Building2, Workflow, FolderKanban } from "lucide-react";
import { UploadRiscosInstitucionais } from "@/components/UploadRiscosInstitucionais";

type RiscoNivel = "Extremo" | "Alto" | "Moderado" | "Baixo";
type Natureza = "Variação" | "Ambiguidade" | "Evento" | "Condição de incerteza";

interface RiscoInst {
  id: string;
  nome: string;
  natureza: Natureza;
  tipo: string;
  impacto: 1 | 2 | 3 | 4 | 5;
  ocorrencia: 1 | 2 | 3 | 4 | 5;
  status: string;
  impactoFinanceiro?: number;
  acoesMitigadoras: string;
  responsaveis: string;
  dueDate: string;
  contingencia?: string;
}

// Matriz de riscos institucionais agora vem do banco (hook useRiscosInstitucionaisDB)

const GP_KEY = "gestao-processos-v1";

function nivelDe(impacto: number, ocorrencia: number): { nivel: RiscoNivel; valor: number; color: string } {
  const v = impacto * ocorrencia;
  if (v >= 15) return { nivel: "Extremo", valor: v, color: "bg-red-500/15 text-red-700 border-red-500/30" };
  if (v >= 10) return { nivel: "Alto", valor: v, color: "bg-orange-500/15 text-orange-700 border-orange-500/30" };
  if (v >= 5)  return { nivel: "Moderado", valor: v, color: "bg-amber-500/15 text-amber-700 border-amber-500/30" };
  return { nivel: "Baixo", valor: v, color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
}

const NAT_ICON: Record<Natureza, string> = {
  "Variação": "🔺", "Ambiguidade": "📈", "Evento": "⛔", "Condição de incerteza": "❓",
};

function fmtBRL(v?: number) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function MatrizRiscosInstitucionais() {
  const [gestao, setGestao] = useState<Record<string, any>>({});
  const [filtroNivel, setFiltroNivel] = useState<string>("todos");
  const { data: riscosInst } = useRiscosInstitucionaisDB();
  const { data: processos } = useProcessosDB();
  const { data: projetos } = useProjetosDB();

  useEffect(() => {
    try { setGestao(JSON.parse(localStorage.getItem(GP_KEY) || "{}")); } catch { setGestao({}); }
  }, []);

  const riscosInstFiltrados = useMemo(() => {
    return riscosInst
      .map(r => ({ r, n: nivelDe(r.impacto, r.ocorrencia) }))
      .filter(x => filtroNivel === "todos" || x.n.nivel === filtroNivel)
      .sort((a, b) => b.n.valor - a.n.valor);
  }, [filtroNivel, riscosInst]);

  const stats = useMemo(() => {
    const totalInst = riscosInst.length;
    const extremos = riscosInst.filter(r => r.impacto * r.ocorrencia >= 15).length;
    const altos = riscosInst.filter(r => r.impacto * r.ocorrencia >= 10 && r.impacto * r.ocorrencia < 15).length;
    const expFin = riscosInst.reduce((a, r) => a + (r.impactoFinanceiro || 0), 0);
    return { totalInst, extremos, altos, expFin };
  }, [riscosInst]);

  // Riscos críticos vindos da matriz de riscos de PROCESSOS (apenas Alto/Extremo)
  const riscosProcessosCriticos = useMemo(() => {
    const procsMap = new Map(processos.map(p => [p.id, p]));
    const out: { processo: any; risco: any; n: ReturnType<typeof nivelDe> }[] = [];
    Object.entries(gestao).forEach(([pid, d]: any) => {
      (d?.riscos || []).forEach((r: any) => {
        const n = nivelDe(r.impacto || 0, r.ocorrencia || 0);
        if (n.nivel === "Extremo" || n.nivel === "Alto") {
          out.push({ processo: procsMap.get(pid) || { id: pid, nome: pid }, risco: r, n });
        }
      });
    });
    return out.sort((a, b) => b.n.valor - a.n.valor);
  }, [gestao, processos]);

  // Riscos críticos vindos do controle de PROJETOS (saúde Off-Track ou desvio Riscos vermelho)
  const projetosCriticos = useMemo(() => {
    return projetos
      .filter(p => p.saude === "Off-Track" || (p.desvios || []).some(d => d.dimensao === "Riscos" && d.status === "vermelho"))
      .map(p => ({ p, riscoDesvio: (p.desvios || []).find(d => d.dimensao === "Riscos") }));
  }, [projetos]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" /> Matriz de Riscos Institucionais
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Visão consolidada dos riscos institucionais, riscos críticos de processos e riscos críticos de projetos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Riscos institucionais</div><div className="text-2xl font-semibold mt-1">{stats.totalInst}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-red-700">Extremos</div><div className="text-2xl font-semibold mt-1 text-red-700">{stats.extremos}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-orange-700">Altos</div><div className="text-2xl font-semibold mt-1 text-orange-700">{stats.altos}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Riscos de processos críticos</div><div className="text-2xl font-semibold mt-1 text-amber-700">{riscosProcessosCriticos.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Projetos com risco crítico</div><div className="text-2xl font-semibold mt-1 text-amber-700">{projetosCriticos.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="institucionais">
        <TabsList>
          <TabsTrigger value="institucionais"><Building2 className="h-3.5 w-3.5 mr-1" /> Institucionais</TabsTrigger>
          <TabsTrigger value="processos"><Workflow className="h-3.5 w-3.5 mr-1" /> Processos críticos</TabsTrigger>
          <TabsTrigger value="projetos"><FolderKanban className="h-3.5 w-3.5 mr-1" /> Projetos críticos</TabsTrigger>
        </TabsList>

        {/* Institucionais */}
        <TabsContent value="institucionais" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="py-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Matriz de Riscos Institucionais</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Exposição financeira total estimada: <span className="font-medium text-foreground">{fmtBRL(stats.expFin)}</span></p>
              </div>
              <Select value={filtroNivel} onValueChange={setFiltroNivel}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os níveis</SelectItem>
                  <SelectItem value="Extremo">Extremo</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="min-w-[260px]">Risco</TableHead>
                    <TableHead className="w-[140px]">Natureza</TableHead>
                    <TableHead className="min-w-[200px]">Tipo</TableHead>
                    <TableHead className="w-[130px]">Impacto × Ocorrência</TableHead>
                    <TableHead className="w-[130px]">Classificação</TableHead>
                    <TableHead className="w-[140px]">Impacto financeiro</TableHead>
                    <TableHead className="w-[180px]">Responsáveis</TableHead>
                    <TableHead className="w-[110px]">Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riscosInstFiltrados.map(({ r, n }) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{r.nome}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{r.acoesMitigadoras}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{NAT_ICON[r.natureza]} {r.natureza}</Badge></TableCell>
                      <TableCell className="text-xs">{r.tipo}</TableCell>
                      <TableCell className="text-xs tabular-nums">{r.impacto} × {r.ocorrencia} = <strong>{n.valor}</strong></TableCell>
                      <TableCell><Badge variant="outline" className={n.color}>{n.nivel}</Badge></TableCell>
                      <TableCell className="text-xs tabular-nums">{fmtBRL(r.impactoFinanceiro)}</TableCell>
                      <TableCell className="text-xs">{r.responsaveis}</TableCell>
                      <TableCell className="text-xs tabular-nums">{r.dueDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processos críticos */}
        <TabsContent value="processos" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-600" /> Riscos críticos de processos</CardTitle>
              <p className="text-xs text-muted-foreground">Apenas riscos com classificação <strong>Alto</strong> ou <strong>Extremo</strong> (impacto × ocorrência ≥ 10) provenientes da matriz de riscos de cada processo. Demais riscos permanecem na própria matriz do processo.</p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {riscosProcessosCriticos.length === 0 ? (
                <div className="p-8 text-sm text-center text-muted-foreground">
                  Nenhum risco de processo classificado como crítico no momento.
                  <div className="mt-2"><Link to="/gestao-processos" className="text-primary text-xs hover:underline">Ir para Gestão de Processos →</Link></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px]">Processo</TableHead>
                      <TableHead className="min-w-[240px]">Risco</TableHead>
                      <TableHead className="w-[140px]">Natureza</TableHead>
                      <TableHead className="w-[120px]">I × O</TableHead>
                      <TableHead className="w-[110px]">Nível</TableHead>
                      <TableHead className="w-[140px]">Status</TableHead>
                      <TableHead className="w-[140px]">Prazo</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riscosProcessosCriticos.map(({ processo, risco, n }) => (
                      <TableRow key={`${processo.id}-${risco.id}`}>
                        <TableCell className="text-sm font-medium">{processo.nome}<div className="text-[11px] text-muted-foreground">{processo.diretor}</div></TableCell>
                        <TableCell className="text-sm">{risco.nome}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{NAT_ICON[risco.natureza as Natureza] || ""} {risco.natureza}</Badge></TableCell>
                        <TableCell className="text-xs tabular-nums">{risco.impacto} × {risco.ocorrencia} = <strong>{n.valor}</strong></TableCell>
                        <TableCell><Badge variant="outline" className={n.color}>{n.nivel}</Badge></TableCell>
                        <TableCell className="text-xs">{risco.status}</TableCell>
                        <TableCell className="text-xs tabular-nums">{risco.dueDate || "—"}</TableCell>
                        <TableCell><Link to="/gestao-processos"><Button size="icon" variant="ghost" className="h-7 w-7"><ArrowRight className="h-4 w-4" /></Button></Link></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projetos críticos */}
        <TabsContent value="projetos" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" /> Riscos críticos de projetos</CardTitle>
              <p className="text-xs text-muted-foreground">Projetos com saúde <strong>Off-Track</strong> ou desvio de Riscos sinalizado em vermelho. Os demais riscos permanecem no controle de cada projeto.</p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {projetosCriticos.length === 0 ? (
                <div className="p-8 text-sm text-center text-muted-foreground">
                  Nenhum projeto crítico no momento.
                  <div className="mt-2"><Link to="/gestao" className="text-primary text-xs hover:underline">Ir para Gestão de Projetos →</Link></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead className="min-w-[280px]">Projeto</TableHead>
                      <TableHead className="w-[160px]">Diretor</TableHead>
                      <TableHead className="w-[120px]">Saúde</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[260px]">Risco / Observação</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projetosCriticos.map(({ p, riscoDesvio }) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                        <TableCell className="text-sm font-medium">{p.nome}</TableCell>
                        <TableCell className="text-xs">{p.diretor}</TableCell>
                        <TableCell><Badge variant="outline" className={p.saude === "Off-Track" ? "bg-red-500/15 text-red-700 border-red-500/30" : "bg-amber-500/15 text-amber-700 border-amber-500/30"}>{p.saude}</Badge></TableCell>
                        <TableCell className="text-xs">{p.status}</TableCell>
                        <TableCell className="text-xs">{riscoDesvio?.obs || p.causaRaiz || "Sem detalhamento"}</TableCell>
                        <TableCell><Link to={`/gestao/${p.id}`}><Button size="icon" variant="ghost" className="h-7 w-7"><ArrowRight className="h-4 w-4" /></Button></Link></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
