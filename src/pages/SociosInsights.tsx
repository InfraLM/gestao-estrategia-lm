import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { lerFichaEstrategica, parametrosFicha } from "@/lib/linksEstrategicos";
import { ArrowLeft, ArrowRight, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import InsightTexto from "@/components/socios/InsightTexto";
import { agruparStatus, filtrarInsights, ORIGENS_INSIGHTS, STATUS_INSIGHTS, type FiltrosInsights, type GrupoStatus, type InsightSocio } from "./sociosInsights";

const CORES_STATUS: Record<GrupoStatus, string> = {
  Passa: "bg-success-soft text-success border-success/30",
  Piloto: "bg-warning-soft text-warning-foreground border-warning/40",
  Máquina: "bg-primary/10 text-primary border-primary/30",
  "Gestão interna": "bg-secondary text-secondary-foreground border-border",
  Decidido: "bg-success-soft text-success border-success/30",
  Registrado: "bg-muted text-muted-foreground border-border",
  Arquivado: "bg-neutral-soft text-neutral border-border",
  Outros: "bg-muted text-muted-foreground border-border",
};
const BLOCOS: { titulo: string; campo: keyof InsightSocio }[] = [
  { titulo: "Desejo", campo: "desejo" },
  { titulo: "Origem", campo: "origem" },
  { titulo: "Dono proposto", campo: "dono_proposto" },
  { titulo: "Prazo / custo", campo: "prazo_custo" },
  { titulo: "Leitura do filtro", campo: "leitura_filtro" },
];
export default function SociosInsights() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["socios-insights", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("socios_insights").select("*").order("codigo", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  const insights = query.data ?? [];
  const [filtros, setFiltros] = useState<FiltrosInsights>({ busca: "", origem: "todos", status: "todos" });
  const [parametros, setParametros] = useSearchParams();
  const ficha = lerFichaEstrategica(parametros, "DS", new Set(insights.flatMap(i => i.codigo ? [i.codigo] : [])), query.isSuccess);
  const codigo = ficha.codigo;
  const setCodigo = (valor: string | null) => setParametros(p => parametrosFicha(p, valor), { replace: true });
  const filtrados = useMemo(() => filtrarInsights(insights, filtros), [insights, filtros]);
  // Counts respond to search/origin but not their own status filter.
  const resumo = useMemo(() => {
    const base = filtrarInsights(insights, { ...filtros, status: "todos" });
    return STATUS_INSIGHTS.map(status => ({ status, total: base.filter(i => agruparStatus(i.status) === status).length }));
  }, [insights, filtros]);
  const porCodigo = useMemo(() => new Map(insights.flatMap(i => i.codigo ? [[i.codigo, i] as const] : [])), [insights]);
  const codigos = useMemo(() => new Set(porCodigo.keys()), [porCodigo]);
  const atual = codigo ? porCodigo.get(codigo) : undefined;
  const indice = filtrados.findIndex(i => i.codigo === codigo);
  const mudar = (campo: keyof FiltrosInsights, valor: string) => setFiltros(f => ({ ...f, [campo]: valor }));
  return <div className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Insights Sócios</h2><span role="status" className="text-sm text-muted-foreground">{filtrados.length} desejos</span></div>
    {ficha.indisponivel && <p role="status" className="text-sm text-muted-foreground">Desejo não encontrado ou sem acesso</p>}
    <div className="space-y-4 border-b pb-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="insights-busca">Busca</Label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="insights-busca" aria-label="Buscar desejos" placeholder="Buscar desejos" className="pl-9" value={filtros.busca} onChange={e => mudar("busca", e.target.value)} /></div></div>
        <div className="min-w-0 space-y-1.5"><Label>Origem</Label><Select value={filtros.origem} onValueChange={valor => mudar("origem", valor)}><SelectTrigger aria-label="Origem"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todas as origens</SelectItem>{ORIGENS_INSIGHTS.map(origem => <SelectItem key={origem} value={origem}>{origem}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Filtrar por status">
        <Button variant={filtros.status === "todos" ? "default" : "outline"} size="sm" aria-pressed={filtros.status === "todos"} onClick={() => mudar("status", "todos")}>Todos</Button>
        {resumo.map(({ status, total }) => <Button key={status} variant="outline" size="sm" aria-pressed={filtros.status === status} aria-label={`Filtrar status ${status}`} onClick={() => mudar("status", filtros.status === status ? "todos" : status)} className={`${CORES_STATUS[status]} ${filtros.status === status ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}>{status}<span className="ml-2 tabular-nums">{total}</span></Button>)}
      </div>
    </div>
    {query.isPending ? <div className="flex items-center justify-center gap-2 py-16" role="status"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />Carregando desejos…</div>
      : query.isError ? <div className="space-y-3 py-12 text-center" role="alert"><p className="text-destructive">Não foi possível carregar os desejos.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div>
      : <Table><TableHeader><TableRow>{["Código", "Desejo", "Origem", "Dono proposto", "Prazo / custo", "Status"].map(coluna => <TableHead key={coluna} className="whitespace-nowrap">{coluna}</TableHead>)}</TableRow></TableHeader><TableBody>
        {!filtrados.length ? <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">Nenhum desejo encontrado para os filtros</TableCell></TableRow>
          : filtrados.map(insight => <TableRow key={insight.id} className="cursor-pointer" onClick={() => setCodigo(insight.codigo)}>
            <TableCell className="whitespace-nowrap"><Button variant="link" className="h-auto p-0 font-semibold" aria-label={`Abrir desejo ${insight.codigo}`} onClick={e => { e.stopPropagation(); setCodigo(insight.codigo); }}>{insight.codigo || "—"}</Button></TableCell>
            <TableCell className="min-w-[240px] max-w-sm"><p className="line-clamp-2 font-medium">{insight.desejo}</p></TableCell>
            <TableCell className="min-w-[180px] max-w-xs">{insight.origem || "—"}</TableCell>
            <TableCell className="min-w-[150px]">{insight.dono_proposto || "—"}</TableCell>
            <TableCell className="min-w-[180px] max-w-xs">{insight.prazo_custo || "—"}</TableCell>
            <TableCell className="min-w-[160px] max-w-xs"><Badge variant="outline" className={`whitespace-normal break-words ${CORES_STATUS[agruparStatus(insight.status)]}`}>{insight.status || "—"}</Badge></TableCell>
          </TableRow>)}
      </TableBody></Table>}
    <Sheet open={!!atual} onOpenChange={aberto => { if (!aberto) setCodigo(null); }}><SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl">
      {atual && <><div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-8"><SheetHeader className="space-y-3 border-b pb-6 pr-5 text-left"><SheetTitle>{atual.codigo}</SheetTitle><SheetDescription asChild><div><Badge variant="outline" className={`max-w-full whitespace-normal break-words ${CORES_STATUS[agruparStatus(atual.status)]}`}><InsightTexto texto={atual.status} codigos={codigos} abrir={setCodigo} /></Badge></div></SheetDescription></SheetHeader>
        <div className="divide-y">{BLOCOS.map(({ titulo, campo }) => <section key={campo} className={`py-5 ${campo === "desejo" ? "border-l-4 border-l-primary pl-4" : ""}`}><h3 className={`mb-2 text-sm font-semibold ${campo === "desejo" ? "text-primary" : "text-muted-foreground"}`}>{titulo}</h3><div className="whitespace-pre-wrap break-words text-sm leading-relaxed"><InsightTexto texto={atual[campo]} codigos={codigos} abrir={setCodigo} /></div></section>)}</div>
      </div><div className="flex shrink-0 items-center justify-between gap-3 border-t bg-background px-6 py-4"><Button variant="outline" size="icon" title="Desejo anterior" aria-label="Desejo anterior" disabled={indice <= 0} onClick={() => { const anterior = filtrados[indice - 1]; if (anterior) setCodigo(anterior.codigo); }}><ArrowLeft className="h-4 w-4" /></Button><span className="text-sm text-muted-foreground">{indice >= 0 ? `${indice + 1} de ${filtrados.length}` : "Fora dos filtros atuais"}</span><Button variant="outline" size="icon" title="Próximo desejo" aria-label="Próximo desejo" disabled={indice < 0 || indice >= filtrados.length - 1} onClick={() => { const proximo = filtrados[indice + 1]; if (proximo) setCodigo(proximo.codigo); }}><ArrowRight className="h-4 w-4" /></Button></div></>}
    </SheetContent></Sheet>
  </div>;
}