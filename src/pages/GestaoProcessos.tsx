import { useEffect, useMemo, useState } from "react";
import processosSeed from "@/data/processos.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, ArrowLeft, Plus, Trash2, FileText, AlertTriangle, GitBranch, Target, ClipboardList, Workflow, Link2, Bot, Download, Sparkles, Loader2 } from "lucide-react";
import { exportToCSV } from "@/lib/exportCsv";
import { NATUREZAS_BPMO, TIPOS_BPMO, STATUS_RISCO_BPMO, IMPACTO_LABEL, PROB_LABEL, classifRiscoBPMO, type NaturezaBPMO, type TipoBPMO, type StatusRiscoBPMO } from "@/lib/bpmoRisco";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DiretoresMultiSelect } from "@/components/DiretoresMultiSelect";
import PessoaSelect from '@/components/estrutura/PessoaSelect';


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
  vinculo?: Record<string, number>;
  maturidade?: number;
  kpiValor?: number;
};

const MATRIZ_EDITS_KEY = "matriz-processos-edits-v1";
const STORAGE_KEY = "gestao-processos-v1";
const MC_SHARED_KEY = "mc-shared-actions-v1";
const DIRETORES_BPMO = ["Yuri Garcia", "Iuri Franco", "Naira Yurie", "Ian Camilo", "Guilherme Vieira"];

interface EscopoMapeamento {
  objetivo?: string;
  escopoIncluso?: string;
  escopoExcluso?: string;
  patrocinador?: string;
  ownerProcesso?: string;
  ownerPessoaId?: string | null;
  equipeMapeamento?: string;
  prazoInicio?: string;
  prazoTermino?: string;
  premissas?: string;
  restricoes?: string;
  entregasEsperadas?: string;
}

interface Problema {
  id: string;
  descricao: string;
  causaRaiz?: string;
  impacto?: "Baixo" | "Médio" | "Alto" | "Crítico";
  oportunidade?: string;
}


interface Risco {
  responsavel_pessoa_id?: string | null;
  id: string;
  nome: string;
  natureza?: NaturezaBPMO;
  tipo?: TipoBPMO;
  causa?: string;
  acoesMitigadoras?: string;
  responsavel?: string;
  prazo?: string;
  dataConclusao?: string;
  impacto: 1 | 2 | 3 | 4 | 5;
  ocorrencia: 1 | 2 | 3 | 4 | 5;
  status: StatusRiscoBPMO;
  impactoFinanceiro?: number;
  dueDate?: string;
  statusChangedAt?: string;
  statusHistory?: { status: string; at: string }[];
}


interface MapaAtividade {
  id: string;
  codigo: string;
  atividade: string;
  responsavel?: string;
  sistema?: string;
  tempo?: string;
  agregaValor?: "Agrega" | "Não agrega mas necessária" | "Não agrega";
  observacao?: string;
}

interface PlanoAcao {
  id: string;
  oQueFazer: string;
  porQue?: string;
  responsavel?: string;
  prazo?: string;
  status: "Backlog" | "Em Andamento" | "Concluído" | "Pausado";
  vinculadoMC?: boolean;
}

interface AtividadeAnalise {
  id: string;
  taskId?: string;
  taskName: string;
  caminho?: string;
  area?: string;
  potencialAutomacao: "Não se Aplica" | "Baixo" | "Médio" | "Alto";
  potencialIA: "Não se Aplica" | "Baixo" | "Médio" | "Alto";
  tipo?: string;
  classificacao: "TAV" | "TNAV" | "TNAVN";
}

interface ProcessoData {
  escopo: EscopoMapeamento;
  problemas: Problema[];
  riscos: Risco[];
  asIs: MapaAtividade[];
  toBe: MapaAtividade[];
  plano: PlanoAcao[];
  atividades: AtividadeAnalise[];
}

const emptyData = (): ProcessoData => ({
  escopo: {},
  problemas: [],
  riscos: [],
  asIs: [],
  toBe: [],
  plano: [],
  atividades: [],
});

const NAT_COLORS: Record<NaturezaBPMO, string> = {
  "Variação": "bg-orange-500/15 text-orange-700 border-orange-500/30",
  "Ambiguidade": "bg-blue-500/15 text-blue-700 border-blue-500/30",
  "Evento": "bg-red-500/15 text-red-700 border-red-500/30",
  "Emergente": "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/30",
  "Condição de incerteza": "bg-purple-500/15 text-purple-700 border-purple-500/30",
};
const NAT_ICON: Record<NaturezaBPMO, string> = {
  "Variação": "🔺", "Ambiguidade": "📈", "Evento": "⛔", "Emergente": "🌱", "Condição de incerteza": "❓",
};
const RISCO_STATUS_COLORS: Record<StatusRiscoBPMO, string> = {
  "Identificado": "bg-rose-500/15 text-rose-700 border-rose-500/30",
  "Em mitigação": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "Mitigado": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "Aceito": "bg-muted text-muted-foreground border-border",
};
const todayISO = () => new Date().toISOString().slice(0, 10);
function diasEntre(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a); const d2 = new Date(b);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}


const statusColors: Record<string, string> = {
  "BACKLOG": "bg-muted text-muted-foreground",
  "A INICIAR": "bg-blue-500/15 text-blue-700",
  "MAPEAMENTO AS-IS/TO-BE": "bg-amber-500/15 text-amber-700",
  "MELHORIAS/ ANÁLISE": "bg-purple-500/15 text-purple-700",
  "VALIDAÇÃO INTERNA": "bg-cyan-500/15 text-cyan-700",
  "APROVAÇÃO DIRETORIA": "bg-orange-500/15 text-orange-700",
  "REVISÃO CONCLUÍDA VIGENTE": "bg-emerald-500/15 text-emerald-700",
  "PARALISADO": "bg-red-500/15 text-red-700",
};

function loadProcessos(): Processo[] {
  try {
    const raw = localStorage.getItem(MATRIZ_EDITS_KEY);
    const edits: Record<string, Partial<Processo>> = raw ? JSON.parse(raw) : {};
    return (processosSeed as Processo[]).map(p => ({ ...p, ...edits[p.id] }));
  } catch { return processosSeed as Processo[]; }
}

function loadAllData(): Record<string, ProcessoData> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveAllData(d: Record<string, ProcessoData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

const uid = () => Math.random().toString(36).slice(2, 9);

function riscoClassif(impacto: number, ocorrencia: number) {
  const v = impacto * ocorrencia;
  if (v >= 15) return { label: `${v} - Extremo`, color: "bg-red-500/20 text-red-700" };
  if (v >= 10) return { label: `${v} - Alto`, color: "bg-orange-500/20 text-orange-700" };
  if (v >= 5)  return { label: `${v} - Moderado`, color: "bg-amber-500/20 text-amber-700" };
  return { label: `${v} - Baixo`, color: "bg-emerald-500/20 text-emerald-700" };
}

export default function GestaoProcessos() {
  const [processos] = useState<Processo[]>(() => loadProcessos());
  const [allData, setAllData] = useState<Record<string, ProcessoData>>(() => loadAllData());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterNivel, setFilterNivel] = useState<string>("todos");

  useEffect(() => { saveAllData(allData); }, [allData]);

  const data: ProcessoData = selectedId ? (allData[selectedId] ?? emptyData()) : emptyData();
  const selected = processos.find(p => p.id === selectedId);

  const updateData = (patch: Partial<ProcessoData>) => {
    if (!selectedId) return;
    setAllData(prev => ({ ...prev, [selectedId]: { ...emptyData(), ...prev[selectedId], ...patch } }));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return processos.filter(p => {
      if (filterNivel !== "todos" && p.nivel !== filterNivel) return false;
      if (q && !p.nome.toLowerCase().includes(q) && !(p.dono ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [processos, search, filterNivel]);

  const completude = (pid: string) => {
    const d = allData[pid];
    if (!d) return 0;
    let c = 0;
    if (Object.values(d.escopo || {}).some(v => v && String(v).trim())) c++;
    if (d.problemas?.length) c++;
    if (d.atividades?.length) c++;
    if (d.riscos?.length) c++;
    if (d.asIs?.length) c++;
    if (d.toBe?.length) c++;
    if (d.plano?.length) c++;
    return Math.round((c / 7) * 100);
  };

  const enviarParaMC = (acao: PlanoAcao) => {
    if (!selected) return;
    const list: any[] = (() => { try { return JSON.parse(localStorage.getItem(MC_SHARED_KEY) || "[]"); } catch { return []; } })();
    const exists = list.find((x: any) => x.id === acao.id);
    const item = {
      id: acao.id,
      origem: "BPMO (Processos)",
      processoId: selected.id,
      processoNome: selected.nome,
      oQueFazer: acao.oQueFazer,
      justificativa: acao.porQue || `Ação derivada do mapeamento de ${selected.nome}`,
      responsavel: acao.responsavel || "—",
      dataPrevista: acao.prazo || "",
      status: acao.status,
    };
    const next = exists ? list.map((x: any) => x.id === acao.id ? item : x) : [...list, item];
    localStorage.setItem(MC_SHARED_KEY, JSON.stringify(next));
    updateData({ plano: data.plano.map(a => a.id === acao.id ? { ...a, vinculadoMC: true } : a) });
  };

  // --- Lista de processos ---
  if (!selectedId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar processo ou dono..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os níveis</SelectItem>
                <SelectItem value="Finalístico">Finalístico</SelectItem>
                <SelectItem value="Gerencial">Gerencial</SelectItem>
                <SelectItem value="Suporte">Suporte</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground self-center">
              {filtered.length} processo(s) · cada botão abre o espaço de gestão completo
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => {
            const c = completude(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="text-left p-4 rounded-lg border border-border bg-card hover:bg-surface-muted hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-medium text-sm leading-snug group-hover:text-primary line-clamp-2">{p.nome}</div>
                  <Workflow className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.nivel && <Badge variant="outline" className="text-[10px]">{p.nivel}</Badge>}
                  <Badge className={`text-[10px] ${statusColors[p.status] || "bg-muted"}`}>{p.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Dono: {p.dono || "—"}</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{c}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Workspace de processo ---
  const e = data.escopo;
  const setEscopo = (patch: Partial<EscopoMapeamento>) => updateData({ escopo: { ...e, ...patch } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div>
            <div className="text-lg font-semibold leading-tight">{selected?.nome}</div>
            <div className="text-xs text-muted-foreground">
              {selected?.nivel} · Diretor: {selected?.diretor} · Dono: {selected?.dono}
            </div>
          </div>
        </div>
        <Badge className={statusColors[selected?.status || ""] || "bg-muted"}>{selected?.status}</Badge>
      </div>

      <Tabs defaultValue="escopo">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="escopo"><FileText className="h-3.5 w-3.5 mr-1" />Escopo do mapeamento</TabsTrigger>
          <TabsTrigger value="analise"><ClipboardList className="h-3.5 w-3.5 mr-1" />Análise do processo</TabsTrigger>
          <TabsTrigger value="atividades"><Bot className="h-3.5 w-3.5 mr-1" />Análise de atividades</TabsTrigger>
          <TabsTrigger value="riscos"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Matriz de riscos</TabsTrigger>
          <TabsTrigger value="asis"><GitBranch className="h-3.5 w-3.5 mr-1" />Mapeamento AS-IS</TabsTrigger>
          <TabsTrigger value="tobe"><Target className="h-3.5 w-3.5 mr-1" />Mapeamento TO-BE</TabsTrigger>
          <TabsTrigger value="plano"><Link2 className="h-3.5 w-3.5 mr-1" />Plano de ação</TabsTrigger>
        </TabsList>

        {/* ESCOPO */}
        <TabsContent value="escopo">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base">Escopo do Mapeamento</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Objetivo do processo">
                <Textarea rows={3} value={e.objetivo || ""} onChange={ev => setEscopo({ objetivo: ev.target.value })} />
              </Field>
              <Field label="Entregas esperadas">
                <Textarea rows={3} value={e.entregasEsperadas || ""} onChange={ev => setEscopo({ entregasEsperadas: ev.target.value })} />
              </Field>
              <Field label="O que está incluso">
                <Textarea rows={3} value={e.escopoIncluso || ""} onChange={ev => setEscopo({ escopoIncluso: ev.target.value })} />
              </Field>
              <Field label="O que NÃO está incluso">
                <Textarea rows={3} value={e.escopoExcluso || ""} onChange={ev => setEscopo({ escopoExcluso: ev.target.value })} />
              </Field>
              <Field label="Patrocinador / Diretor(es)">
                <DiretoresMultiSelect
                  value={e.patrocinador || selected?.diretor || ""}
                  onChange={v => setEscopo({ patrocinador: v })}
                  options={DIRETORES_BPMO}
                />
              </Field>
              <Field label="Owner do processo"><PessoaSelect value={e.ownerPessoaId} texto={e.ownerProcesso || selected?.dono} onChange={p => setEscopo({ ownerPessoaId: p?.id ?? null })} /></Field>
              <Field label="Equipe de mapeamento"><Input value={e.equipeMapeamento || ""} onChange={ev => setEscopo({ equipeMapeamento: ev.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Início"><Input type="date" value={e.prazoInicio || ""} onChange={ev => setEscopo({ prazoInicio: ev.target.value })} /></Field>
                <Field label="Término"><Input type="date" value={e.prazoTermino || ""} onChange={ev => setEscopo({ prazoTermino: ev.target.value })} /></Field>
              </div>
              <Field label="Premissas"><Textarea rows={2} value={e.premissas || ""} onChange={ev => setEscopo({ premissas: ev.target.value })} /></Field>
              <Field label="Restrições"><Textarea rows={2} value={e.restricoes || ""} onChange={ev => setEscopo({ restricoes: ev.target.value })} /></Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANÁLISE */}
        <TabsContent value="analise">
          <Card>
            <CardHeader className="py-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Problemas e Oportunidades de Melhoria</CardTitle>
              <Button size="sm" onClick={() => updateData({ problemas: [...data.problemas, { id: uid(), descricao: "", impacto: "Médio" }] })}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[260px]">Problema identificado</TableHead>
                    <TableHead className="min-w-[220px]">Causa raiz</TableHead>
                    <TableHead className="w-[120px]">Impacto</TableHead>
                    <TableHead className="min-w-[260px]">Oportunidade de melhoria</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.problemas.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell><Textarea rows={2} value={p.descricao} onChange={ev => updateData({ problemas: data.problemas.map(x => x.id === p.id ? { ...x, descricao: ev.target.value } : x) })} /></TableCell>
                      <TableCell><Textarea rows={2} value={p.causaRaiz || ""} onChange={ev => updateData({ problemas: data.problemas.map(x => x.id === p.id ? { ...x, causaRaiz: ev.target.value } : x) })} /></TableCell>
                      <TableCell>
                        <Select value={p.impacto || "Médio"} onValueChange={v => updateData({ problemas: data.problemas.map(x => x.id === p.id ? { ...x, impacto: v as any } : x) })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{["Baixo", "Médio", "Alto", "Crítico"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Textarea rows={2} value={p.oportunidade || ""} onChange={ev => updateData({ problemas: data.problemas.map(x => x.id === p.id ? { ...x, oportunidade: ev.target.value } : x) })} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => updateData({ problemas: data.problemas.filter(x => x.id !== p.id) })}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {!data.problemas.length && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Nenhum problema registrado</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANÁLISE DE ATIVIDADES */}
        <TabsContent value="atividades">
          <AtividadesTab
            items={data.atividades}
            onChange={items => updateData({ atividades: items })}
          />
        </TabsContent>

        {/* RISCOS */}
        <TabsContent value="riscos">
          <RiscosTab
            processoNome={selected?.nome || ""}
            items={data.riscos}
            onChange={items => updateData({ riscos: items })}
          />
        </TabsContent>


        {/* AS-IS */}
        <TabsContent value="asis"><MapaTab title="Mapeamento AS-IS (situação atual)" items={data.asIs} onChange={items => updateData({ asIs: items })} /></TabsContent>
        {/* TO-BE */}
        <TabsContent value="tobe"><MapaTab title="Mapeamento TO-BE (situação futura)" items={data.toBe} onChange={items => updateData({ toBe: items })} copyFromAsIs={() => updateData({ toBe: data.asIs.map(a => ({ ...a, id: uid() })) })} /></TabsContent>

        {/* PLANO */}
        <TabsContent value="plano">
          <Card>
            <CardHeader className="py-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Plano de Ação</CardTitle>
                <div className="text-xs text-muted-foreground mt-1">Ações vinculadas à Melhoria Contínua aparecerão no backlog da área (origem: BPMO Processos).</div>
              </div>
              <Button size="sm" onClick={() => updateData({ plano: [...data.plano, { id: uid(), oQueFazer: "", status: "Backlog" }] })}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar ação
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[260px]">O que fazer</TableHead>
                    <TableHead className="min-w-[220px]">Por quê</TableHead>
                    <TableHead className="w-[160px]">Responsável</TableHead>
                    <TableHead className="w-[140px]">Prazo</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[180px]">Melhoria Contínua</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.plano.map(a => (
                    <TableRow key={a.id}>
                      <TableCell><Textarea rows={2} value={a.oQueFazer} onChange={ev => updateData({ plano: data.plano.map(x => x.id === a.id ? { ...x, oQueFazer: ev.target.value } : x) })} /></TableCell>
                      <TableCell><Textarea rows={2} value={a.porQue || ""} onChange={ev => updateData({ plano: data.plano.map(x => x.id === a.id ? { ...x, porQue: ev.target.value } : x) })} /></TableCell>
                      <TableCell><PessoaSelect texto={a.responsavel} onChange={p => updateData({ plano: data.plano.map(x => x.id === a.id ? { ...x, responsavel: p?.nome ?? '' } : x) })} /></TableCell>
                      <TableCell><Input type="date" value={a.prazo || ""} onChange={ev => updateData({ plano: data.plano.map(x => x.id === a.id ? { ...x, prazo: ev.target.value } : x) })} /></TableCell>
                      <TableCell>
                        <Select value={a.status} onValueChange={v => updateData({ plano: data.plano.map(x => x.id === a.id ? { ...x, status: v as any } : x) })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{["Backlog", "Em Andamento", "Concluído", "Pausado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {a.vinculadoMC ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 text-xs gap-1"><Link2 className="h-3 w-3" /> Vinculada</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => enviarParaMC(a)} disabled={!a.oQueFazer.trim()}>
                            <Link2 className="h-3 w-3 mr-1" /> Enviar p/ MC
                          </Button>
                        )}
                      </TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => updateData({ plano: data.plano.filter(x => x.id !== a.id) })}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {!data.plano.length && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Nenhuma ação registrada</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function MapaTab({ title, items, onChange, copyFromAsIs }: { title: string; items: MapaAtividade[]; onChange: (items: MapaAtividade[]) => void; copyFromAsIs?: () => void }) {
  const add = () => onChange([...items, { id: uid(), codigo: `T${String(items.length + 1).padStart(2, "0")}`, atividade: "" }]);
  const upd = (id: string, patch: Partial<MapaAtividade>) => onChange(items.map(x => x.id === id ? { ...x, ...patch } : x));
  const del = (id: string) => onChange(items.filter(x => x.id !== id));
  return (
    <Card>
      <CardHeader className="py-3 flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex gap-2">
          {copyFromAsIs && <Button variant="outline" size="sm" onClick={copyFromAsIs}>Copiar AS-IS</Button>}
          <Button size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" /> Adicionar atividade</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Código</TableHead>
              <TableHead className="min-w-[260px]">Atividade</TableHead>
              <TableHead className="w-[150px]">Responsável</TableHead>
              <TableHead className="w-[130px]">Sistema</TableHead>
              <TableHead className="w-[100px]">Tempo</TableHead>
              <TableHead className="w-[200px]">Agrega valor</TableHead>
              <TableHead className="min-w-[180px]">Observação</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(a => (
              <TableRow key={a.id}>
                <TableCell><Input value={a.codigo} onChange={ev => upd(a.id, { codigo: ev.target.value })} className="h-8 text-xs" /></TableCell>
                <TableCell><Textarea rows={1} value={a.atividade} onChange={ev => upd(a.id, { atividade: ev.target.value })} /></TableCell>
                <TableCell><PessoaSelect texto={a.responsavel} onChange={p => upd(a.id, { responsavel: p?.nome ?? '' })} /></TableCell>
                <TableCell><Input value={a.sistema || ""} onChange={ev => upd(a.id, { sistema: ev.target.value })} className="h-8 text-xs" /></TableCell>
                <TableCell><Input value={a.tempo || ""} placeholder="hh:mm" onChange={ev => upd(a.id, { tempo: ev.target.value })} className="h-8 text-xs" /></TableCell>
                <TableCell>
                  <Select value={a.agregaValor || ""} onValueChange={v => upd(a.id, { agregaValor: v as any })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{["Agrega", "Não agrega mas necessária", "Não agrega"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input value={a.observacao || ""} onChange={ev => upd(a.id, { observacao: ev.target.value })} className="h-8 text-xs" /></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => del(a.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
              </TableRow>
            ))}
            {!items.length && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhuma atividade mapeada</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const POT_COLORS: Record<string, string> = {
  "Alto": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "Médio": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "Baixo": "bg-blue-500/15 text-blue-700 border-blue-500/30",
  "Não se Aplica": "bg-muted text-muted-foreground border-border",
};

const CLASSIF_INFO: Record<"TAV" | "TNAV" | "TNAVN", { label: string; color: string; full: string }> = {
  TAV: { label: "TAV", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", full: "Agrega Valor" },
  TNAVN: { label: "TNAVN", color: "bg-amber-500/15 text-amber-700 border-amber-500/30", full: "Não Agrega mas é Necessária" },
  TNAV: { label: "TNAV", color: "bg-red-500/15 text-red-700 border-red-500/30", full: "Não Agrega Valor" },
};

function AtividadesTab({ items, onChange }: { items: AtividadeAnalise[]; onChange: (i: AtividadeAnalise[]) => void }) {
  const upd = (id: string, patch: Partial<AtividadeAnalise>) => onChange(items.map(x => x.id === id ? { ...x, ...patch } : x));
  const del = (id: string) => onChange(items.filter(x => x.id !== id));
  const add = (classificacao: "TAV" | "TNAV" | "TNAVN" = "TAV") => onChange([...items, {
    id: uid(), taskName: "", classificacao, potencialAutomacao: "Não se Aplica", potencialIA: "Não se Aplica",
  }]);

  const stats = useMemo(() => {
    const total = items.length || 1;
    const byClass = { TAV: 0, TNAV: 0, TNAVN: 0 } as Record<string, number>;
    const autoAlto = items.filter(i => i.potencialAutomacao === "Alto").length;
    const iaAlto = items.filter(i => i.potencialIA === "Alto").length;
    items.forEach(i => { byClass[i.classificacao] = (byClass[i.classificacao] || 0) + 1; });
    return { total: items.length, byClass, autoAlto, iaAlto, pctTAV: Math.round((byClass.TAV / total) * 100) };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3"><div className="text-[11px] text-muted-foreground uppercase tracking-wide">Atividades</div><div className="text-2xl font-semibold tabular-nums">{stats.total}</div></Card>
        <Card className="p-3"><div className="text-[11px] text-emerald-700 uppercase tracking-wide">TAV</div><div className="text-2xl font-semibold tabular-nums text-emerald-700">{stats.byClass.TAV || 0}</div></Card>
        <Card className="p-3"><div className="text-[11px] text-amber-700 uppercase tracking-wide">TNAVN</div><div className="text-2xl font-semibold tabular-nums text-amber-700">{stats.byClass.TNAVN || 0}</div></Card>
        <Card className="p-3"><div className="text-[11px] text-red-700 uppercase tracking-wide">TNAV</div><div className="text-2xl font-semibold tabular-nums text-red-700">{stats.byClass.TNAV || 0}</div></Card>
        <Card className="p-3"><div className="text-[11px] text-muted-foreground uppercase tracking-wide">Alto Automação / IA</div><div className="text-2xl font-semibold tabular-nums">{stats.autoAlto}<span className="text-sm text-muted-foreground"> / {stats.iaAlto}</span></div></Card>
      </div>

      <Card>
        <CardHeader className="py-3 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4" /> Análise de Atividades · Potencial de Automação & IA</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Classifique cada atividade quanto a agregação de valor (TAV / TNAVN / TNAV) e potencial de automação e IA.</p>
          </div>
          <Button size="sm" onClick={() => add("TAV")}><Plus className="h-3.5 w-3.5 mr-1" /> Adicionar atividade</Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Task ID</TableHead>
                <TableHead className="min-w-[220px]">Atividade</TableHead>
                <TableHead className="min-w-[180px]">Caminho</TableHead>
                <TableHead className="w-[140px]">Área Responsável</TableHead>
                <TableHead className="w-[140px]">Pot. Automação</TableHead>
                <TableHead className="w-[140px]">Pot. IA</TableHead>
                <TableHead className="w-[150px]">Tipo</TableHead>
                <TableHead className="w-[120px]">Classificação</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(a => (
                <TableRow key={a.id}>
                  <TableCell><Input value={a.taskId || ""} onChange={ev => upd(a.id, { taskId: ev.target.value })} className="h-8 text-xs font-mono" /></TableCell>
                  <TableCell><Textarea rows={2} value={a.taskName} onChange={ev => upd(a.id, { taskName: ev.target.value })} className="text-xs" /></TableCell>
                  <TableCell><Input value={a.caminho || ""} onChange={ev => upd(a.id, { caminho: ev.target.value })} className="h-8 text-xs" /></TableCell>
                  <TableCell><Input value={a.area || ""} onChange={ev => upd(a.id, { area: ev.target.value })} className="h-8 text-xs" /></TableCell>
                  <TableCell>
                    <Select value={a.potencialAutomacao} onValueChange={v => upd(a.id, { potencialAutomacao: v as any })}>
                      <SelectTrigger className={`h-8 text-xs ${POT_COLORS[a.potencialAutomacao]}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{["Não se Aplica", "Baixo", "Médio", "Alto"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={a.potencialIA} onValueChange={v => upd(a.id, { potencialIA: v as any })}>
                      <SelectTrigger className={`h-8 text-xs ${POT_COLORS[a.potencialIA]}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{["Não se Aplica", "Baixo", "Médio", "Alto"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={a.tipo || ""} onValueChange={v => upd(a.id, { tipo: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{["Cognitiva Repetitiva", "Cognitiva Analítica", "Cognitiva Criativa", "Manual Repetitiva", "Manual Não Repetitiva"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={a.classificacao} onValueChange={v => upd(a.id, { classificacao: v as any })}>
                      <SelectTrigger className={`h-8 text-xs ${CLASSIF_INFO[a.classificacao].color}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TAV">TAV — Agrega Valor</SelectItem>
                        <SelectItem value="TNAVN">TNAVN — Não Agrega mas é Necessária</SelectItem>
                        <SelectItem value="TNAV">TNAV — Não Agrega Valor</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => del(a.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                </TableRow>
              ))}
              {!items.length && <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">Nenhuma atividade analisada. Clique em <strong>Adicionar atividade</strong>.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="p-4">
        <div className="text-xs text-muted-foreground mb-2">Legenda</div>
        <div className="flex flex-wrap gap-3 text-xs">
          {(["TAV","TNAVN","TNAV"] as const).map(k => (
            <Badge key={k} variant="outline" className={CLASSIF_INFO[k].color}>{CLASSIF_INFO[k].label} · {CLASSIF_INFO[k].full}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============== RiscosTab (BPMO) ==============
function RiscosTab({ processoNome, items, onChange }: { processoNome: string; items: Risco[]; onChange: (items: Risco[]) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Risco>>({ impacto: 3, ocorrencia: 3, status: "Identificado" });
  const [aiLoading, setAiLoading] = useState(false);

  const upd = (id: string, patch: Partial<Risco>) => {
    onChange(items.map(r => {
      if (r.id !== id) return r;
      const next: Risco = { ...r, ...patch };
      if (patch.status && patch.status !== r.status) {
        const at = todayISO();
        next.statusChangedAt = at;
        next.statusHistory = [...(r.statusHistory ?? []), { status: patch.status, at }];
        if (patch.status === "Mitigado" && !next.dataConclusao) next.dataConclusao = at;
      }
      return next;
    }));
  };
  const del = (id: string) => onChange(items.filter(x => x.id !== id));

  async function aiClassify() {
    if (!draft.nome) { toast.error("Descreva o risco antes de pedir análise por IA."); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("risco-classificar-ai", {
        body: { risco: draft.nome, causa: draft.causa ?? "", processoNome, impacto: draft.impacto, probabilidade: draft.ocorrencia },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDraft(d => ({ ...d, natureza: data.natureza, tipo: data.tipo, causa: d.causa && d.causa.trim() ? d.causa : data.causa_raiz }));
      toast.success(`IA: ${data.natureza} · ${data.tipo}`);
    } catch (e: any) {
      toast.error("Falha na análise: " + (e?.message ?? "erro"));
    } finally { setAiLoading(false); }
  }

  function save() {
    if (!draft.nome) { toast.error("Informe a descrição do risco."); return; }
    const at = todayISO();
    const status = (draft.status as StatusRiscoBPMO) ?? "Identificado";
    onChange([...items, {
      id: uid(),
      nome: draft.nome,
      causa: draft.causa,
      natureza: draft.natureza,
      tipo: draft.tipo,
      acoesMitigadoras: draft.acoesMitigadoras,
      responsavel: draft.responsavel,
      prazo: draft.prazo,
      dataConclusao: draft.dataConclusao,
      impacto: (draft.impacto ?? 3) as Risco["impacto"],
      ocorrencia: (draft.ocorrencia ?? 3) as Risco["ocorrencia"],
      status,
      statusChangedAt: at,
      statusHistory: [{ status, at }],
    }]);
    setDraft({ impacto: 3, ocorrencia: 3, status: "Identificado" });
    setOpen(false);
  }

  function doExport() {
    exportToCSV("riscos_bpmo_" + (processoNome || "processo").replace(/\s+/g, "_"), items.map(r => {
      const c = classifRiscoBPMO(r.impacto, r.ocorrencia);
      return {
        Processo: processoNome, Risco: r.nome, Causa: r.causa || "", Natureza: r.natureza || "",
        Tipo: r.tipo || "", Impacto: r.impacto, Ocorrencia: r.ocorrencia, Score: c.score, Classificacao: c.nivel,
        AcoesMitigadoras: r.acoesMitigadoras || "", Responsavel: r.responsavel || "",
        Prazo: r.prazo || "", DataConclusao: r.dataConclusao || "", Status: r.status, StatusDesde: r.statusChangedAt || "",
      };
    }));
  }

  const hoje = todayISO();

  return (
    <Card>
      <CardHeader className="py-3 flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Matriz de Riscos do Processo</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Escala numérica 1-5 (Impacto × Ocorrência). Classificação: 1-3 Baixo · 4-6 Moderado · 8-12 Alto · 15-25 Extremo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={doExport}>
            <Download className="h-3.5 w-3.5" /> Exportar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo risco</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo risco · {processoNome}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Risco *</label>
                  <Input value={draft.nome ?? ""} onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))} placeholder="Descrição do risco" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">A IA pode sugerir <strong>natureza</strong>, <strong>tipo</strong> e <strong>causa raiz</strong>.</p>
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={aiClassify} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Analisar com IA
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Natureza</label>
                    <Select value={draft.natureza} onValueChange={v => setDraft(d => ({ ...d, natureza: v as NaturezaBPMO }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{NATUREZAS_BPMO.map(n => <SelectItem key={n} value={n}>{NAT_ICON[n]} {n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <Select value={draft.tipo} onValueChange={v => setDraft(d => ({ ...d, tipo: v as TipoBPMO }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{TIPOS_BPMO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Causa raiz</label>
                  <Textarea rows={2} value={draft.causa ?? ""} onChange={e => setDraft(d => ({ ...d, causa: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Impacto (1-5)</label>
                    <Select value={String(draft.impacto ?? 3)} onValueChange={v => setDraft(d => ({ ...d, impacto: Number(v) as Risco["impacto"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} · {IMPACTO_LABEL[n]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Ocorrência (1-5)</label>
                    <Select value={String(draft.ocorrencia ?? 3)} onValueChange={v => setDraft(d => ({ ...d, ocorrencia: Number(v) as Risco["ocorrencia"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} · {PROB_LABEL[n]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={draft.status} onValueChange={v => setDraft(d => ({ ...d, status: v as StatusRiscoBPMO }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_RISCO_BPMO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {(() => {
                  const c = classifRiscoBPMO(draft.impacto, draft.ocorrencia);
                  return (
                    <div className="rounded-md border p-2 text-xs flex items-center justify-between bg-muted/40">
                      <span className="text-muted-foreground">Score: <strong className="tabular-nums">{c.score}</strong> ({draft.impacto ?? 0} × {draft.ocorrencia ?? 0})</span>
                      <Badge variant="outline" className={c.color}>{c.nivel}</Badge>
                    </div>
                  );
                })()}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Ação mitigadora</label>
                  <Textarea rows={2} value={draft.acoesMitigadoras ?? ""} onChange={e => setDraft(d => ({ ...d, acoesMitigadoras: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Responsável</label>
                    <PessoaSelect value={draft.responsavel_pessoa_id} texto={draft.responsavel} onChange={p => setDraft(d => ({ ...d, responsavel_pessoa_id: p?.id ?? null }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Prazo</label>
                    <Input type="date" value={draft.prazo ?? ""} onChange={e => setDraft(d => ({ ...d, prazo: e.target.value }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Risco</TableHead>
              <TableHead className="w-[130px]">Natureza</TableHead>
              <TableHead className="w-[150px]">Tipo</TableHead>
              <TableHead className="min-w-[220px]">Ações mitigadoras</TableHead>
              <TableHead className="w-[80px]">Imp.</TableHead>
              <TableHead className="w-[80px]">Ocorr.</TableHead>
              <TableHead className="w-[140px]">Classificação</TableHead>
              <TableHead className="w-[140px]">Responsável</TableHead>
              <TableHead className="w-[140px]">Prazo</TableHead>
              <TableHead className="w-[140px]">Conclusão</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="w-[90px]">Δ dias</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(r => {
              const c = classifRiscoBPMO(r.impacto, r.ocorrencia);
              const aberto = r.status !== "Mitigado" && r.status !== "Aceito";
              const descol = diasEntre(r.prazo, r.dataConclusao ?? (aberto ? hoje : undefined));
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Textarea rows={2} value={r.nome} onChange={e => upd(r.id, { nome: e.target.value })} />
                    {r.causa && <div className="text-[10px] text-muted-foreground mt-1">Causa: {r.causa}</div>}
                  </TableCell>
                  <TableCell>
                    <Select value={r.natureza} onValueChange={v => upd(r.id, { natureza: v as NaturezaBPMO })}>
                      <SelectTrigger className={`h-8 text-xs ${r.natureza ? NAT_COLORS[r.natureza] : ""}`}><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{NATUREZAS_BPMO.map(n => <SelectItem key={n} value={n}>{NAT_ICON[n]} {n}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={r.tipo} onValueChange={v => upd(r.id, { tipo: v as TipoBPMO })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{TIPOS_BPMO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Textarea rows={2} value={r.acoesMitigadoras || ""} onChange={e => upd(r.id, { acoesMitigadoras: e.target.value })} /></TableCell>
                  <TableCell>
                    <Select value={String(r.impacto)} onValueChange={v => upd(r.id, { impacto: Number(v) as Risco["impacto"] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={String(r.ocorrencia)} onValueChange={v => upd(r.id, { ocorrencia: Number(v) as Risco["ocorrencia"] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${c.color}`}>
                      {c.nivel} <span className="ml-1 tabular-nums opacity-70">({r.impacto}×{r.ocorrencia}={c.score})</span>
                    </Badge>
                  </TableCell>
                  <TableCell><PessoaSelect value={r.responsavel_pessoa_id} texto={r.responsavel} onChange={p => upd(r.id, { responsavel_pessoa_id: p?.id ?? null })} /></TableCell>
                  <TableCell><Input type="date" className="h-8 text-xs" value={r.prazo || ""} onChange={e => upd(r.id, { prazo: e.target.value })} /></TableCell>
                  <TableCell><Input type="date" className="h-8 text-xs" value={r.dataConclusao || ""} onChange={e => upd(r.id, { dataConclusao: e.target.value })} /></TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={v => upd(r.id, { status: v as StatusRiscoBPMO })}>
                      <SelectTrigger className={`h-8 text-xs ${RISCO_STATUS_COLORS[r.status]}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_RISCO_BPMO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    {r.statusChangedAt && <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">desde {r.statusChangedAt}</div>}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {descol == null ? "—" : (
                      <span className={descol > 0 ? "text-red-700 font-medium" : descol < 0 ? "text-emerald-700" : "text-muted-foreground"}>
                        {descol > 0 ? `+${descol}d` : `${descol}d`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                </TableRow>
              );
            })}
            {!items.length && <TableRow><TableCell colSpan={13} className="text-center text-sm text-muted-foreground py-8">Nenhum risco registrado. Clique em <strong>Novo risco</strong>.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

