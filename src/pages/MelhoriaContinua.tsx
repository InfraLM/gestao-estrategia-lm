import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Workflow, Target as TargetIcon, ListChecks, Search, Upload, Download, AlertTriangle, Link2, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProcessosDB } from "@/hooks/useProcessosDB";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AREAS = [
  "Comercial","Geração de Demanda","CX","Áudio Visual","Infra & Tech",
  "Coordenação Acadêmica","Demandas Médicas","Governança e Jurídico","Financeiro",
  "BPMO","PMO Estratégico","Facilities","PFO em Hospitais","Produtos","Novos Produtos","Growth",
] as const;

type Area = typeof AREAS[number];
type Origem = "BPMO (Processos)" | "OKRs da Área";
type Status = "Backlog" | "Em Andamento" | "Concluído" | "Pausado" | "Cancelado" | "Aguardando Evidência";

const STATUSES: Status[] = ["Backlog","Em Andamento","Aguardando Evidência","Concluído","Pausado","Cancelado"];

interface StatusEvent { status: string; at: string; }
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
  processoId?: string;
  processoNome?: string;
  statusChangedAt?: string;
  statusHistory?: StatusEvent[];
}

export const NATUREZAS = ["Variação", "Ambiguidade", "Evento", "Emergente", "Condição de incerteza"] as const;
export const TIPOS = ["Financeiro", "Legal", "Reputacional", "Processo operacional", "Recursos (Pessoas/Materiais)", "Tecnologia/Sistemas"] as const;
export type Natureza = typeof NATUREZAS[number];
export type TipoRisco = typeof TIPOS[number];
export type Escala = 1 | 2 | 3 | 4 | 5;

interface RiscoProcesso {
  id: string;
  processoId: string;
  processoNome: string;
  risco: string;
  causa: string;
  natureza?: Natureza;
  tipo?: TipoRisco;
  impacto: Escala;        // 1..5
  probabilidade: Escala;  // 1..5
  acaoMitigadora: string;
  responsavel: string;
  prazo: string;
  dataConclusao?: string;
  status: "Aberto" | "Em Mitigação" | "Mitigado" | "Aceito";
  statusChangedAt?: string;
  statusHistory?: StatusEvent[];
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const SEED: Acao[] = [
  { id: "MC-001", area: "Comercial", origem: "OKRs da Área", oQueFazer: "Revisar script de qualificação SDR", justificativa: "Conversão MQL→SQL abaixo da meta (KR Q2)", responsavel: "Líder Comercial", dataPrevista: "2026-06-15", status: "Em Andamento", statusChangedAt: "2026-04-10" },
  { id: "MC-002", area: "BPMO", origem: "BPMO (Processos)", oQueFazer: "Padronizar fluxo de onboarding de aluno", justificativa: "Variação entre polos identificada na matriz de processos", responsavel: "Analista BPMO", dataPrevista: "2026-05-30", status: "Backlog", statusChangedAt: "2026-03-20" },
  { id: "MC-003", area: "CX", origem: "OKRs da Área", oQueFazer: "Reduzir TMA de tickets nível 1", justificativa: "NPS impactado por tempo de resposta", responsavel: "Coord. CX", dataPrevista: "2026-05-20", dataConclusao: "2026-05-18", status: "Concluído", statusChangedAt: "2026-05-18" },
];

const SEED_RISCOS: RiscoProcesso[] = [];

const ACOES_KEY = "melhoria-acoes-v2";
const RISCOS_KEY = "melhoria-riscos-v2";

const STATUS_COLORS: Record<Status, string> = {
  "Backlog": "bg-muted text-muted-foreground border-border",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  "Aguardando Evidência": "bg-purple-100 text-purple-800 border-purple-200",
  "Concluído": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Pausado": "bg-amber-100 text-amber-800 border-amber-200",
  "Cancelado": "bg-rose-100 text-rose-800 border-rose-200",
};

const RISCO_STATUS_COLORS: Record<RiscoProcesso["status"], string> = {
  "Aberto": "bg-rose-100 text-rose-800 border-rose-200",
  "Em Mitigação": "bg-amber-100 text-amber-800 border-amber-200",
  "Mitigado": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Aceito": "bg-muted text-muted-foreground border-border",
};

// Classificação por score (Impacto × Probabilidade)
//   1-3 Baixo · 4-6 Moderado · 8-12 Alto · 15-25 Extremo
export type NivelRisco = "Baixo" | "Moderado" | "Alto" | "Extremo";
export function classifRisco(impacto?: number, probabilidade?: number): { score: number; nivel: NivelRisco; color: string; cell: string } {
  const score = (impacto || 0) * (probabilidade || 0);
  if (score >= 15) return { score, nivel: "Extremo", color: "bg-rose-100 text-rose-800 border-rose-200", cell: "bg-rose-500 text-white" };
  if (score >= 8)  return { score, nivel: "Alto",    color: "bg-orange-100 text-orange-800 border-orange-200", cell: "bg-orange-500 text-white" };
  if (score >= 4)  return { score, nivel: "Moderado", color: "bg-amber-100 text-amber-800 border-amber-200", cell: "bg-amber-400 text-amber-950" };
  return { score, nivel: "Baixo", color: "bg-emerald-100 text-emerald-800 border-emerald-200", cell: "bg-emerald-500 text-white" };
}

const IMPACTO_LABEL: Record<Escala, string> = { 1: "Insignificante", 2: "Baixo", 3: "Moderado", 4: "Alto", 5: "Crítico" };
const PROB_LABEL: Record<Escala, string> = { 1: "Raro (<5%)", 2: "Improvável (5–15%)", 3: "Possível (15–40%)", 4: "Provável (40–70%)", 5: "Quase certo (>70%)" };

// Migração: localStorage antigo gravava impacto/probabilidade como string
function migrateRiscos(arr: any[]): RiscoProcesso[] {
  const mapImp: Record<string, Escala> = { "Baixo": 2, "Médio": 3, "Alto": 4, "Crítico": 5 };
  const mapProb: Record<string, Escala> = { "Baixa": 2, "Média": 3, "Alta": 4 };
  return (arr || []).map((r: any) => ({
    ...r,
    impacto: typeof r.impacto === "number" ? r.impacto : (mapImp[r.impacto] ?? 3),
    probabilidade: typeof r.probabilidade === "number" ? r.probabilidade : (mapProb[r.probabilidade] ?? 3),
  }));
}

function diasEntre(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a); const d2 = new Date(b);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

function downloadTemplate() {
  const headers = ["area","origem","oQueFazer","justificativa","responsavel","dataPrevista","dataConclusao","status","processoNome"];
  const sample = [{
    area: "BPMO",
    origem: "BPMO (Processos)",
    oQueFazer: "Padronizar checklist de abertura de polo",
    justificativa: "Variação entre polos identificada na matriz",
    responsavel: "Analista BPMO",
    dataPrevista: "2026-06-30",
    dataConclusao: "",
    status: "Backlog",
    processoNome: "01.02.03 - Abertura de Polo",
  }];
  const ws = XLSX.utils.json_to_sheet(sample, { header: headers });
  ws["!cols"] = headers.map(h => ({ wch: Math.max(h.length + 2, 22) }));
  const instr = XLSX.utils.aoa_to_sheet([
    ["Campo","Obrigatório","Valores aceitos / Formato"],
    ["area","Sim", AREAS.join(" | ")],
    ["origem","Sim","BPMO (Processos) | OKRs da Área"],
    ["oQueFazer","Sim","Texto livre"],
    ["justificativa","Não","Texto livre"],
    ["responsavel","Não","Nome do responsável"],
    ["dataPrevista","Não","AAAA-MM-DD"],
    ["dataConclusao","Não","AAAA-MM-DD"],
    ["status","Não", STATUSES.join(" | ")],
    ["processoNome","Não","Nome (ou ID) do processo na Matriz de Processos para vincular"],
  ]);
  instr["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 80 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Acoes");
  XLSX.utils.book_append_sheet(wb, instr, "Instruções");
  XLSX.writeFile(wb, "template_melhoria_continua.xlsx");
}

function loadLS<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}

export default function MelhoriaContinua() {
  const [acoes, setAcoes] = useState<Acao[]>(() => loadLS(ACOES_KEY, SEED));
  const [riscos, setRiscos] = useState<RiscoProcesso[]>(() => migrateRiscos(loadLS<any[]>(RISCOS_KEY, SEED_RISCOS as any)));
  const [areaSel, setAreaSel] = useState<Area | null>(null);
  const [q, setQ] = useState("");
  const [origemFilter, setOrigemFilter] = useState<string>("Todas");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Acao>>({ origem: "OKRs da Área", status: "Backlog" });
  const [openRisco, setOpenRisco] = useState(false);
  const [riscoDraft, setRiscoDraft] = useState<Partial<RiscoProcesso>>({ impacto: 3, probabilidade: 3, status: "Aberto" });
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: processos } = useProcessosDB();

  useEffect(() => { localStorage.setItem(ACOES_KEY, JSON.stringify(acoes)); }, [acoes]);
  useEffect(() => { localStorage.setItem(RISCOS_KEY, JSON.stringify(riscos)); }, [riscos]);

  async function handleAIClassify() {
    if (!riscoDraft.risco) { toast.error("Descreva o risco antes de pedir análise por IA."); return; }
    setAiLoading(true);
    try {
      const proc = processos.find(p => p.id === riscoDraft.processoId);
      const { data, error } = await supabase.functions.invoke("risco-classificar-ai", {
        body: {
          risco: riscoDraft.risco,
          causa: riscoDraft.causa ?? "",
          processoNome: proc?.nome ?? "",
          impacto: riscoDraft.impacto,
          probabilidade: riscoDraft.probabilidade,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRiscoDraft(d => ({
        ...d,
        natureza: data.natureza,
        tipo: data.tipo,
        causa: d.causa && d.causa.trim() ? d.causa : data.causa_raiz,
      }));
      toast.success("IA classificou: " + data.natureza + " · " + data.tipo);
    } catch (e: any) {
      toast.error("Falha na análise: " + (e?.message ?? "erro"));
    } finally {
      setAiLoading(false);
    }
  }


  const counts = useMemo(() => {
    const m = new Map<Area, number>();
    AREAS.forEach(a => m.set(a, 0));
    acoes.forEach(a => m.set(a.area, (m.get(a.area) ?? 0) + 1));
    return m;
  }, [acoes]);

  const lista = useMemo(() => acoes.filter(a => {
    if (areaSel && a.area !== areaSel) return false;
    if (origemFilter !== "Todas" && a.origem !== origemFilter) return false;
    if (q && !`${a.oQueFazer} ${a.justificativa} ${a.responsavel} ${a.processoNome ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [acoes, areaSel, origemFilter, q]);

  function updateAcao(id: string, patch: Partial<Acao>) {
    setAcoes(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next: Acao = { ...a, ...patch };
      if (patch.status && patch.status !== a.status) {
        const at = todayISO();
        next.statusChangedAt = at;
        next.statusHistory = [...(a.statusHistory ?? []), { status: patch.status, at }];
        if (patch.status === "Concluído" && !next.dataConclusao) next.dataConclusao = at;
      }
      return next;
    }));
  }

  function updateRisco(id: string, patch: Partial<RiscoProcesso>) {
    setRiscos(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next: RiscoProcesso = { ...r, ...patch };
      if (patch.status && patch.status !== r.status) {
        const at = todayISO();
        next.statusChangedAt = at;
        next.statusHistory = [...(r.statusHistory ?? []), { status: patch.status, at }];
        if (patch.status === "Mitigado" && !next.dataConclusao) next.dataConclusao = at;
      }
      return next;
    }));
  }

  function handleSave() {
    if (!draft.oQueFazer || !draft.area) return;
    const id = `MC-${String(acoes.length + 1).padStart(3, "0")}`;
    const proc = processos.find(p => p.id === draft.processoId);
    const at = todayISO();
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
      processoId: draft.processoId,
      processoNome: proc?.nome,
      statusChangedAt: at,
      statusHistory: [{ status: (draft.status as Status) ?? "Backlog", at }],
    }]);
    setDraft({ origem: "OKRs da Área", status: "Backlog", area: areaSel ?? undefined });
    setOpen(false);
  }

  function handleSaveRisco() {
    if (!riscoDraft.risco || !riscoDraft.processoId) {
      toast.error("Informe o processo vinculado e a descrição do risco.");
      return;
    }
    const proc = processos.find(p => p.id === riscoDraft.processoId);
    const id = `RP-${String(riscos.length + 1).padStart(3, "0")}`;
    const at = todayISO();
    const status = (riscoDraft.status as RiscoProcesso["status"]) ?? "Aberto";
    setRiscos(prev => [...prev, {
      id,
      processoId: riscoDraft.processoId!,
      processoNome: proc?.nome ?? "—",
      risco: riscoDraft.risco ?? "",
      causa: riscoDraft.causa ?? "",
      natureza: riscoDraft.natureza,
      tipo: riscoDraft.tipo,
      impacto: (typeof riscoDraft.impacto === "number" ? riscoDraft.impacto : 3) as Escala,
      probabilidade: (typeof riscoDraft.probabilidade === "number" ? riscoDraft.probabilidade : 3) as Escala,
      acaoMitigadora: riscoDraft.acaoMitigadora ?? "",
      responsavel: riscoDraft.responsavel ?? "",
      prazo: riscoDraft.prazo ?? "",
      status,
      statusChangedAt: at,
      statusHistory: [{ status, at }],
    }]);
    setRiscoDraft({ impacto: 3, probabilidade: 3, status: "Aberto" });
    setOpenRisco(false);
  }


  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets["Acoes"] ?? wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      let imported = 0;
      const start = acoes.length + 1;
      const at = todayISO();
      const novas: Acao[] = rows.flatMap((r, idx) => {
        const area = String(r.area ?? "").trim();
        const oq = String(r.oQueFazer ?? "").trim();
        if (!oq || !AREAS.includes(area as Area)) return [];
        const procRef = String(r.processoNome ?? "").trim().toLowerCase();
        const proc = procRef ? processos.find(p => p.nome.toLowerCase().includes(procRef) || p.id.toLowerCase() === procRef) : undefined;
        imported++;
        const status = (STATUSES.includes(r.status) ? r.status : "Backlog") as Status;
        return [{
          id: `MC-${String(start + idx).padStart(3, "0")}`,
          area: area as Area,
          origem: (r.origem === "BPMO (Processos)" ? "BPMO (Processos)" : "OKRs da Área") as Origem,
          oQueFazer: oq,
          justificativa: String(r.justificativa ?? ""),
          responsavel: String(r.responsavel ?? ""),
          dataPrevista: String(r.dataPrevista ?? ""),
          dataConclusao: r.dataConclusao ? String(r.dataConclusao) : undefined,
          status,
          processoId: proc?.id,
          processoNome: proc?.nome,
          statusChangedAt: at,
          statusHistory: [{ status, at }],
        }];
      });
      setAcoes(prev => [...prev, ...novas]);
      toast.success(`${imported} ${imported === 1 ? "ação importada" : "ações importadas"} com sucesso.`);
    } catch (err: any) {
      toast.error("Falha ao importar planilha: " + (err?.message ?? "erro desconhecido"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const hoje = todayISO();

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

      <Tabs defaultValue="acoes">
        <TabsList>
          <TabsTrigger value="acoes" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" /> Ações de Melhoria</TabsTrigger>
          <TabsTrigger value="riscos" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Riscos & Mitigação por Processo</TabsTrigger>
        </TabsList>

        <TabsContent value="acoes" className="space-y-6 mt-4">
          {/* KPIs */}
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

          {/* Import / Template */}
          <Card className="p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium">Importação em lote</div>
              <div className="text-muted-foreground text-xs">Baixe o template Excel, preencha e suba para criar várias ações de uma vez.</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadTemplate}>
                <Download className="h-4 w-4" /> Baixar template
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Subir planilha
              </Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
            </div>
          </Card>

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
                              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Link2 className="h-3 w-3" /> Vincular a processo da matriz (opcional)</label>
                        <Select value={draft.processoId ?? "__none"} onValueChange={v => setDraft(d => ({ ...d, processoId: v === "__none" ? undefined : v }))}>
                          <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            <SelectItem value="__none">— Nenhum —</SelectItem>
                            {processos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
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
                  <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar ação, responsável, processo…" className="pl-9" />
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
                      <TableHead className="w-[130px]">Origem</TableHead>
                      <TableHead>O que fazer?</TableHead>
                      <TableHead>Processo vinculado</TableHead>
                      <TableHead className="w-[150px]">Responsável</TableHead>
                      <TableHead className="w-[150px]">Prevista</TableHead>
                      <TableHead className="w-[150px]">Conclusão</TableHead>
                      <TableHead className="w-[170px]">Status</TableHead>
                      <TableHead className="w-[120px]">Δ Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.map(a => {
                      const diasNoStatus = a.statusChangedAt ? diasEntre(a.statusChangedAt, hoje) : null;
                      const descol = diasEntre(a.dataPrevista, a.dataConclusao ?? (a.status !== "Concluído" ? hoje : undefined));
                      return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px] font-normal", a.origem === "BPMO (Processos)" ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-blue-50 text-blue-800 border-blue-200")}>
                            {a.origem}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{a.oQueFazer}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.processoNome ? (
                            <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> {a.processoNome}</span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{a.responsavel || "—"}</TableCell>
                        <TableCell>
                          <Input type="date" value={a.dataPrevista ?? ""} onChange={e => updateAcao(a.id, { dataPrevista: e.target.value })} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Input type="date" value={a.dataConclusao ?? ""} onChange={e => updateAcao(a.id, { dataConclusao: e.target.value })} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Select value={a.status} onValueChange={v => updateAcao(a.id, { status: v as Status })}>
                            <SelectTrigger className={cn("h-8 text-xs", STATUS_COLORS[a.status])}><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                          {a.statusChangedAt && (
                            <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">desde {a.statusChangedAt}{diasNoStatus != null ? ` · ${diasNoStatus}d` : ""}</div>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums text-xs">
                          {descol == null ? "—" : (
                            <span className={cn(descol > 0 ? "text-red-700 font-medium" : descol < 0 ? "text-emerald-700" : "text-muted-foreground")}>
                              {descol > 0 ? `+${descol}d` : `${descol}d`}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );})}
                    {lista.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                          Nenhuma ação cadastrada para esta área. Clique em <strong>Nova ação</strong>.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="riscos" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /> Riscos & Ações Mitigadoras por Processo</h3>
              <p className="text-sm text-muted-foreground">Cada risco é vinculado a um processo da Matriz de Processos.</p>
            </div>
            <Dialog open={openRisco} onOpenChange={setOpenRisco}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Novo risco</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Novo risco de processo</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Link2 className="h-3 w-3" /> Processo da matriz *</label>
                    <Select value={riscoDraft.processoId} onValueChange={v => setRiscoDraft(d => ({ ...d, processoId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione um processo" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {processos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Risco *</label>
                    <Input value={riscoDraft.risco ?? ""} onChange={e => setRiscoDraft(d => ({ ...d, risco: e.target.value }))} placeholder="Descrição do risco" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Causa raiz</label>
                    <Textarea rows={2} value={riscoDraft.causa ?? ""} onChange={e => setRiscoDraft(d => ({ ...d, causa: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Impacto</label>
                      <Select value={riscoDraft.impacto} onValueChange={v => setRiscoDraft(d => ({ ...d, impacto: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Baixo","Médio","Alto","Crítico"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Probabilidade</label>
                      <Select value={riscoDraft.probabilidade} onValueChange={v => setRiscoDraft(d => ({ ...d, probabilidade: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Baixa","Média","Alta"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <Select value={riscoDraft.status} onValueChange={v => setRiscoDraft(d => ({ ...d, status: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Aberto","Em Mitigação","Mitigado","Aceito"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Ação mitigadora</label>
                    <Textarea rows={2} value={riscoDraft.acaoMitigadora ?? ""} onChange={e => setRiscoDraft(d => ({ ...d, acaoMitigadora: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Responsável</label>
                      <Input value={riscoDraft.responsavel ?? ""} onChange={e => setRiscoDraft(d => ({ ...d, responsavel: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Prazo (data prevista)</label>
                      <Input type="date" value={riscoDraft.prazo ?? ""} onChange={e => setRiscoDraft(d => ({ ...d, prazo: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenRisco(false)}>Cancelar</Button>
                  <Button onClick={handleSaveRisco}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead className="w-[100px]">Impacto</TableHead>
                  <TableHead>Ação Mitigadora</TableHead>
                  <TableHead className="w-[140px]">Responsável</TableHead>
                  <TableHead className="w-[150px]">Prevista</TableHead>
                  <TableHead className="w-[150px]">Conclusão</TableHead>
                  <TableHead className="w-[160px]">Status</TableHead>
                  <TableHead className="w-[110px]">Δ Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riscos.map(r => {
                  const diasNoStatus = r.statusChangedAt ? diasEntre(r.statusChangedAt, hoje) : null;
                  const descol = diasEntre(r.prazo, r.dataConclusao ?? (r.status !== "Mitigado" && r.status !== "Aceito" ? hoje : undefined));
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs"><span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> {r.processoNome}</span></TableCell>
                    <TableCell className="font-medium text-sm">
                      {r.risco}
                      {r.causa && <div className="text-xs text-muted-foreground mt-0.5">Causa: {r.causa}</div>}
                      <div className="text-[10px] text-muted-foreground mt-0.5"><Badge variant="outline" className={cn("text-[10px]", IMPACTO_COLORS[r.impacto])}>{r.impacto}</Badge> · Prob. {r.probabilidade}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", IMPACTO_COLORS[r.impacto])}>{r.impacto}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.acaoMitigadora || "—"}</TableCell>
                    <TableCell className="text-sm">{r.responsavel || "—"}</TableCell>
                    <TableCell>
                      <Input type="date" value={r.prazo ?? ""} onChange={e => updateRisco(r.id, { prazo: e.target.value })} className="h-8 text-xs" />
                    </TableCell>
                    <TableCell>
                      <Input type="date" value={r.dataConclusao ?? ""} onChange={e => updateRisco(r.id, { dataConclusao: e.target.value })} className="h-8 text-xs" />
                    </TableCell>
                    <TableCell>
                      <Select value={r.status} onValueChange={v => updateRisco(r.id, { status: v as RiscoProcesso["status"] })}>
                        <SelectTrigger className={cn("h-8 text-xs", RISCO_STATUS_COLORS[r.status])}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Aberto","Em Mitigação","Mitigado","Aceito"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {r.statusChangedAt && (
                        <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">desde {r.statusChangedAt}{diasNoStatus != null ? ` · ${diasNoStatus}d` : ""}</div>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs">
                      {descol == null ? "—" : (
                        <span className={cn(descol > 0 ? "text-red-700 font-medium" : descol < 0 ? "text-emerald-700" : "text-muted-foreground")}>
                          {descol > 0 ? `+${descol}d` : `${descol}d`}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );})}
                {riscos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Nenhum risco cadastrado. Clique em <strong>Novo risco</strong> para vincular a um processo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
