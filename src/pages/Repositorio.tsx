import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Search, Upload, Download, ChevronDown, ChevronRight, History,
  CheckCircle2, AlertCircle, XCircle, Clock, FileType, Filter, FilePlus2,
  Files, Folder, Calendar, User, FileSpreadsheet, Presentation, FileSignature,
  GitCommit, Sparkles, ArrowUpRight,
} from "lucide-react";
import {
  projetosBC, documentos, type ProjetoBC, type BCVersion, type DocumentoSubmetido, type DocTipo,
} from "@/data/repositoryMock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SCORE_STYLE: Record<string, string> = {
  "HEROIC GO":   "bg-success-soft text-success border-success/40",
  "GO":          "bg-info/15 text-info border-info/30",
  "CONDITIONAL": "bg-warning/20 text-warning-foreground border-warning/40",
  "NO GO":       "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_ICON = {
  "Aprovado":      CheckCircle2,
  "Em Revisão":    Clock,
  "Em Construção": GitCommit,
  "Rejeitado":     XCircle,
  "Adiado":        AlertCircle,
} as const;

const STATUS_COLOR: Record<string, string> = {
  "Aprovado":      "text-success",
  "Em Revisão":    "text-warning-foreground",
  "Em Construção": "text-info",
  "Rejeitado":     "text-destructive",
  "Adiado":        "text-muted-foreground",
};

const TIPO_ICON: Record<DocTipo, any> = {
  "Business Case":         FileText,
  "Ata de Reunião":        FileSignature,
  "Planilha Financeira":   FileSpreadsheet,
  "Apresentação":          Presentation,
  "Contrato":              FileSignature,
  "Termo de Abertura":     FileText,
  "Cronograma":            Calendar,
  "Mapa de Stakeholders":  Files,
  "Especificação Técnica": FileType,
  "Outros":                Files,
};

const TIPO_COLOR: Record<DocTipo, string> = {
  "Business Case":         "bg-primary/10 text-primary border-primary/20",
  "Ata de Reunião":        "bg-info/10 text-info border-info/20",
  "Planilha Financeira":   "bg-success-soft text-success border-success/30",
  "Apresentação":          "bg-warning/15 text-warning-foreground border-warning/30",
  "Contrato":              "bg-destructive/10 text-destructive border-destructive/20",
  "Termo de Abertura":     "bg-neutral/15 text-foreground border-neutral/30",
  "Cronograma":            "bg-info/10 text-info border-info/20",
  "Mapa de Stakeholders":  "bg-neutral/15 text-foreground border-neutral/30",
  "Especificação Técnica": "bg-neutral/15 text-foreground border-neutral/30",
  "Outros":                "bg-muted text-muted-foreground border-border",
};

const ALL_TIPOS: DocTipo[] = [
  "Business Case", "Ata de Reunião", "Planilha Financeira", "Apresentação",
  "Contrato", "Termo de Abertura", "Cronograma", "Mapa de Stakeholders",
  "Especificação Técnica", "Outros",
];

export default function Repositorio() {
  const [tab, setTab] = useState<"bc" | "docs">("bc");
  const [busca, setBusca] = useState("");
  const [filtroProjeto, setFiltroProjeto] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // KPIs
  const totalBC = projetosBC.length;
  const totalRevisoes = projetosBC.reduce((s, p) => s + p.versoes.length, 0);
  const emRevisao = projetosBC.filter(p => p.statusAtual === "Em Revisão" || p.statusAtual === "Em Construção").length;
  const aprovados = projetosBC.filter(p => p.statusAtual === "Aprovado").length;
  const totalDocs = documentos.length;

  // Filtros BC
  const projetosFiltrados = useMemo(() => {
    return projetosBC.filter(p => {
      if (filtroProjeto !== "todos" && p.projetoId !== filtroProjeto) return false;
      if (filtroStatus !== "todos" && p.statusAtual !== filtroStatus) return false;
      if (busca && !p.projetoNome.toLowerCase().includes(busca.toLowerCase()) && !p.projetoId.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [busca, filtroProjeto, filtroStatus]);

  // Filtros Docs
  const docsFiltrados = useMemo(() => {
    return documentos
      .filter(d => {
        if (filtroProjeto !== "todos" && d.projetoId !== filtroProjeto) return false;
        if (filtroTipo !== "todos" && d.tipo !== filtroTipo) return false;
        if (busca && !d.nome.toLowerCase().includes(busca.toLowerCase()) && !d.projetoNome.toLowerCase().includes(busca.toLowerCase()) && !d.usuario.toLowerCase().includes(busca.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => parseDate(b.dataSubmissao).getTime() - parseDate(a.dataSubmissao).getTime());
  }, [busca, filtroProjeto, filtroTipo]);

  const projetosOptions = useMemo(
    () => [{ id: "todos", nome: "Todos os projetos" }, ...projetosBC.map(p => ({ id: p.projetoId, nome: p.projetoNome }))],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Repositório</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Business Cases versionados e documentos submetidos por projeto. Histórico completo, autoria e controle de revisão.
          </p>
        </div>
        <UploadDialog />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPI label="Business Cases" value={totalBC} icon={FileText} tone="primary" />
        <KPI label="Revisões totais" value={totalRevisoes} icon={History} tone="neutral" />
        <KPI label="Em revisão" value={emRevisao} icon={Clock} tone="warning" />
        <KPI label="Aprovados" value={aprovados} icon={CheckCircle2} tone="success" />
        <KPI label="Documentos" value={totalDocs} icon={Folder} tone="info" />
      </div>

      {/* Tabs + Filtros */}
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="bc" className="gap-2"><FileText className="h-4 w-4" /> Business Cases</TabsTrigger>
          <TabsTrigger value="docs" className="gap-2"><Folder className="h-4 w-4" /> Documentos</TabsTrigger>
        </TabsList>

        {/* Barra de filtros */}
        <Card className="p-4 mt-4 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder={tab === "bc" ? "Buscar projeto…" : "Buscar documento, projeto ou usuário…"}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <Filter className="h-3.5 w-3.5" /> Filtros
            </div>

            <Select value={filtroProjeto} onValueChange={setFiltroProjeto}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Projeto" /></SelectTrigger>
              <SelectContent>
                {projetosOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>

            {tab === "bc" && (
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                  <SelectItem value="Em Construção">Em Construção</SelectItem>
                  <SelectItem value="Adiado">Adiado</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            )}

            {tab === "docs" && (
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {ALL_TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </Card>

        {/* CONTEÚDO BC */}
        <TabsContent value="bc" className="mt-4 space-y-3">
          {projetosFiltrados.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground shadow-card">Nenhum BC encontrado.</Card>
          )}
          {projetosFiltrados.map(p => <BCCard key={p.projetoId} projeto={p} />)}
        </TabsContent>

        {/* CONTEÚDO DOCS */}
        <TabsContent value="docs" className="mt-4">
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left px-4 py-3 font-semibold">Documento</th>
                    <th className="text-left px-4 py-3 font-semibold">Projeto</th>
                    <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold">Submetido por</th>
                    <th className="text-left px-4 py-3 font-semibold">Data / Hora</th>
                    <th className="text-right px-4 py-3 font-semibold">Tamanho</th>
                    <th className="text-right px-4 py-3 font-semibold w-20">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {docsFiltrados.map(d => <DocRow key={d.id} doc={d} />)}
                  {docsFiltrados.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum documento encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>{docsFiltrados.length} documento(s) listado(s)</span>
              <span>Ordenado por data (mais recente primeiro)</span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// CARD de BC com timeline de revisões
// ============================================================
function BCCard({ projeto }: { projeto: ProjetoBC }) {
  const [open, setOpen] = useState(false);
  const StatusIcon = STATUS_ICON[projeto.statusAtual] ?? Clock;
  const versaoMaisRecente = projeto.versoes[0];

  return (
    <Card className="shadow-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 p-5 hover:bg-surface-muted/30 transition-colors text-left"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-md bg-primary/10 grid place-items-center text-primary shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
              <span>{projeto.projetoId}</span>
              <span>·</span>
              <span>{projeto.wave}</span>
              <span>·</span>
              <span>{projeto.classificacao}</span>
            </div>
            <div className="font-semibold mt-0.5 truncate">{projeto.projetoNome}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-[10px]">{projeto.versaoAtual}</Badge>
              <Badge className={cn("border text-[10px] font-semibold", SCORE_STYLE[projeto.scoreAtual])}>
                {projeto.scoreAtual}
              </Badge>
              <span className={cn("inline-flex items-center gap-1 text-xs font-medium", STATUS_COLOR[projeto.statusAtual])}>
                <StatusIcon className="h-3.5 w-3.5" /> {projeto.statusAtual}
              </span>
              <span className="text-xs text-muted-foreground">· {projeto.versoes.length} revisão(ões)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right text-xs text-muted-foreground hidden sm:block">
            <div>Última atualização</div>
            <div className="font-medium text-foreground tabular-nums">{projeto.ultimaAtualizacao}</div>
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-surface-muted/20 animate-fade-in">
          {/* Resumo da versão atual */}
          <div className="p-5 border-b border-border bg-background">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Versão atual · {versaoMaisRecente.versao}</div>
                <div className="text-sm mt-1.5">{versaoMaisRecente.resumoMudancas}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success(`Download iniciado: ${versaoMaisRecente.arquivo}`)}>
                  <Download className="h-3.5 w-3.5" /> Baixar
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => toast.info("Nova revisão — fluxo de submissão")}>
                  <FilePlus2 className="h-3.5 w-3.5" /> Nova revisão
                </Button>
              </div>
            </div>
            {(versaoMaisRecente.capex !== undefined || versaoMaisRecente.opex !== undefined || versaoMaisRecente.payback) && (
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/60 text-xs">
                {versaoMaisRecente.capex !== undefined && (
                  <div>
                    <div className="text-muted-foreground">CAPEX</div>
                    <div className="font-semibold tabular-nums mt-0.5">R$ {versaoMaisRecente.capex.toLocaleString("pt-BR")}</div>
                  </div>
                )}
                {versaoMaisRecente.opex !== undefined && (
                  <div>
                    <div className="text-muted-foreground">OPEX</div>
                    <div className="font-semibold tabular-nums mt-0.5">R$ {versaoMaisRecente.opex.toLocaleString("pt-BR")}</div>
                  </div>
                )}
                {versaoMaisRecente.payback && (
                  <div>
                    <div className="text-muted-foreground">Payback</div>
                    <div className="font-semibold mt-0.5">{versaoMaisRecente.payback}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline de revisões */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Histórico de Revisões
              </h4>
              <span className="text-xs text-muted-foreground">{projeto.versoes.length} versão(ões)</span>
            </div>
            <ol className="relative ml-2 border-l-2 border-border space-y-4">
              {projeto.versoes.map((v, i) => <RevisionItem key={v.versao} versao={v} latest={i === 0} />)}
            </ol>
          </div>
        </div>
      )}
    </Card>
  );
}

function RevisionItem({ versao, latest }: { versao: BCVersion; latest: boolean }) {
  const StatusIcon = STATUS_ICON[versao.status] ?? Clock;
  return (
    <li className="ml-5 relative">
      <span className={cn(
        "absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-background",
        latest ? "bg-primary ring-2 ring-primary/20" : "bg-muted-foreground/40"
      )} />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-[10px]">{versao.versao}</Badge>
            <Badge className={cn("border text-[10px]", SCORE_STYLE[versao.score])}>{versao.score}</Badge>
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium", STATUS_COLOR[versao.status])}>
              <StatusIcon className="h-3 w-3" /> {versao.status}
            </span>
            {latest && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Atual</Badge>}
          </div>
          <p className="text-sm mt-1.5">{versao.resumoMudancas}</p>
          <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {versao.autor} <span className="opacity-60">· {versao.cargo}</span></span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {versao.data}</span>
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {versao.arquivo} <span className="opacity-60">({versao.tamanho})</span></span>
            {versao.aprovadoPor && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3 w-3" /> Aprovado por {versao.aprovadoPor} em {versao.dataAprovacao}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 shrink-0 h-8"
          onClick={() => toast.success(`Download iniciado: ${versao.arquivo}`)}
        >
          <Download className="h-3.5 w-3.5" /> Baixar
        </Button>
      </div>
    </li>
  );
}

// ============================================================
// LINHA da tabela de documentos
// ============================================================
function DocRow({ doc }: { doc: DocumentoSubmetido }) {
  const Icon = TIPO_ICON[doc.tipo];
  const initials = doc.usuario.split(" ").map(p => p[0]).slice(0, 2).join("");

  return (
    <tr className="border-t border-border hover:bg-surface-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted grid place-items-center text-muted-foreground shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate flex items-center gap-2">
              {doc.nome}
              {doc.versao && <Badge variant="outline" className="font-mono text-[10px]">{doc.versao}</Badge>}
            </div>
            {doc.descricao && <div className="text-xs text-muted-foreground truncate max-w-md">{doc.descricao}</div>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-xs">
          <div className="text-muted-foreground tabular-nums">{doc.projetoId}</div>
          <div className="font-medium truncate max-w-[200px]">{doc.projetoNome}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn("border text-[10px] font-medium", TIPO_COLOR[doc.tipo])}>{doc.tipo}</Badge>
        {doc.vinculoBC && (
          <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-2.5 w-2.5" /> vinculado ao BC {doc.vinculoBC}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-[10px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="text-xs">
            <div className="font-medium">{doc.usuario}</div>
            <div className="text-muted-foreground">{doc.cargo}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-xs tabular-nums">
          <div className="font-medium">{doc.dataSubmissao}</div>
          <div className="text-muted-foreground">{doc.hora}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-right text-xs tabular-nums text-muted-foreground">{doc.tamanho}</td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toast.success(`Download iniciado: ${doc.nome}`)}
        >
          <Download className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

// ============================================================
// DIALOG de upload (BC ou documento)
// ============================================================
function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<DocTipo>("Business Case");
  const [projetoId, setProjetoId] = useState<string>("");

  const submeter = () => {
    if (!file || !projetoId) {
      toast.error("Selecione projeto e arquivo");
      return;
    }
    toast.success("Documento submetido", {
      description: `${file.name} adicionado ao repositório com revisão controlada.`,
    });
    setOpen(false);
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Upload className="h-4 w-4" /> Submeter documento</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Submeter documento</DialogTitle>
          <DialogDescription>
            O envio é registrado com autor, data, hora e versão. BCs entram automaticamente no controle de revisão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Projeto</Label>
            <Select value={projetoId} onValueChange={setProjetoId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione um projeto…" /></SelectTrigger>
              <SelectContent>
                {projetosBC.map(p => <SelectItem key={p.projetoId} value={p.projetoId}>{p.projetoId} · {p.projetoNome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tipo de documento</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as DocTipo)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Resumo / Mudanças</Label>
            <Textarea
              rows={3}
              placeholder={tipo === "Business Case" ? "Descreva as principais mudanças desta revisão…" : "Breve descrição do conteúdo…"}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Arquivo</Label>
            <label className="block mt-1.5">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 hover:bg-surface-muted/30 transition-colors cursor-pointer">
                <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-sm font-medium">{file ? file.name : "Clique ou arraste para enviar"}</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, PPTX · até 50 MB</p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.zip"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </label>
          </div>

          {tipo === "Business Case" && (
            <Card className="p-3 bg-info/5 border-info/20 flex items-start gap-2 text-xs">
              <Sparkles className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Controle de revisão automático</p>
                <p className="text-muted-foreground mt-0.5">
                  Esta submissão criará uma nova versão (ex: v2.1 → v2.2) preservando o histórico, autoria e data.
                </p>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submeter} className="gap-2"><Upload className="h-4 w-4" /> Submeter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Helpers
// ============================================================
function KPI({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "primary" | "neutral" | "warning" | "success" | "info" }) {
  const map: Record<string, string> = {
    primary: "text-primary",
    neutral: "text-foreground",
    warning: "text-warning-foreground",
    success: "text-success",
    info:    "text-info",
  };
  return (
    <Card className="p-5 shadow-card hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className={cn("mt-2 text-3xl font-semibold tracking-tight tabular-nums", map[tone])}>{value}</div>
        </div>
        <Icon className={cn("h-5 w-5", map[tone])} />
      </div>
    </Card>
  );
}

function parseDate(d: string): Date {
  // dd/mm/yyyy
  const [dd, mm, yyyy] = d.split("/").map(Number);
  return new Date(yyyy, (mm ?? 1) - 1, dd ?? 1);
}
