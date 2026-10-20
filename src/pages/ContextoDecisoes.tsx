import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, Search, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calcularReferencias, dataDecisao, filtrarDecisoes, FORUNS, IMPACTOS, parseStatus, rotuloForum, TIPOS_FORUM, type Decisao, type FiltrosDecisoes } from "./contextoDecisoes";

const CORES_STATUS = {
  premissa: "bg-warning-soft text-warning-foreground border-warning/40",
  validado: "bg-success-soft text-success border-success/30",
  rejeitado: "bg-neutral-soft text-neutral border-border",
  inconsistencia: "bg-destructive/10 text-destructive border-destructive/30",
};
const BLOCOS: { titulo: string; campo: keyof Decisao }[] = [
  { titulo: "Decisão", campo: "decisao" },
  { titulo: "Opções descartadas", campo: "opcoes_descartadas" },
  { titulo: "Racional", campo: "racional" },
  { titulo: "Trade-off aceito", campo: "tradeoff" },
  { titulo: "Premissas", campo: "premissas" },
  { titulo: "Papéis (RAPID)", campo: "papeis_rapid" },
  { titulo: "Revisão", campo: "revisao" },
  { titulo: "Reunião de origem", campo: "reuniao_origem" },
  { titulo: "Tipo de fórum", campo: "tipo_forum" },
  { titulo: "Fóruns citados", campo: "foruns_citados" },
  { titulo: "Responsável", campo: "responsavel" },
  { titulo: "Impacto BSC", campo: "impacto_bsc" },
  { titulo: "Revisa", campo: "revisa_codigo" },
  { titulo: "Fonte", campo: "fonte" },
  { titulo: "Observações da carga", campo: "observacoes" },
];
function Reservada() {
  return <Badge variant="outline" className="gap-1 bg-warning-soft text-warning-foreground border-warning/40"><Shield className="h-3 w-3" />Reservada</Badge>;
}
function FiltroSelect({ nome, valor, mudar, opcoes }: { nome: string; valor: string; mudar: (valor: string) => void; opcoes: { valor: string; rotulo: string }[] }) {
  return <div className="min-w-0 space-y-1.5"><Label>{nome}</Label><Select value={valor} onValueChange={mudar}><SelectTrigger aria-label={nome}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{opcoes.map(o => <SelectItem key={o.valor} value={o.valor}>{o.rotulo}</SelectItem>)}</SelectContent></Select></div>;
}

export default function ContextoDecisoes() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["contexto-decisoes", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("decisoes_estrategicas").select("*").order("codigo", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const decisoes = query.data ?? [];
  const [filtros, setFiltros] = useState<FiltrosDecisoes>({ busca: "", tipo: "todos", forum: "todos", impacto: "todos", de: "", ate: "", confirmar: false });
  const [codigo, setCodigo] = useState<string | null>(null);
  const filtradas = useMemo(() => filtrarDecisoes(decisoes, filtros), [decisoes, filtros]);
  const porCodigo = useMemo(() => new Map(decisoes.map(d => [d.codigo, d])), [decisoes]);
  const referencias = useMemo(() => calcularReferencias(decisoes), [decisoes]);
  const atual = codigo ? porCodigo.get(codigo) : undefined;
  const indice = filtradas.findIndex(d => d.codigo === codigo);
  const mudar = <K extends keyof FiltrosDecisoes>(chave: K, valor: FiltrosDecisoes[K]) => setFiltros(f => ({ ...f, [chave]: valor }));
  function textoComLinks(texto: string) {
    return texto.split(/(\bD-\d{3}\b)/g).map((parte, i) => porCodigo.has(parte)
      ? <Button key={i} variant="link" className="inline h-auto whitespace-normal p-0 align-baseline font-semibold" onClick={() => setCodigo(parte)} aria-label={`Abrir decisão ${parte}`}>{parte}</Button>
      : <Fragment key={i}>{parte}</Fragment>);
  }
  function textoFormatado(texto: string) {
    return parseStatus(texto).map((trecho, i) => trecho.status
      ? <Badge key={i} variant="outline" className={`mx-0.5 inline max-w-full whitespace-normal break-words ${CORES_STATUS[trecho.status]}`}>{textoComLinks(trecho.texto)}</Badge>
      : <Fragment key={i}>{textoComLinks(trecho.texto)}</Fragment>);
  }
  return <div className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Contexto e decisões</h2><span className="text-sm text-muted-foreground" role="status">{filtradas.length} decisões</span></div>
    <div className="space-y-4 border-b pb-6">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar decisões" placeholder="Buscar decisões" className="pl-9" value={filtros.busca} onChange={e => mudar("busca", e.target.value)} /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <FiltroSelect nome="Tipo de fórum" valor={filtros.tipo} mudar={v => mudar("tipo", v)} opcoes={Object.entries(TIPOS_FORUM).map(([valor, rotulo]) => ({ valor, rotulo }))} />
        <FiltroSelect nome="Fóruns citados" valor={filtros.forum} mudar={v => mudar("forum", v)} opcoes={FORUNS.map(valor => ({ valor, rotulo: valor }))} />
        <FiltroSelect nome="Impacto BSC" valor={filtros.impacto} mudar={v => mudar("impacto", v)} opcoes={IMPACTOS.map(valor => ({ valor, rotulo: valor }))} />
        <div className="min-w-0 space-y-1.5"><Label htmlFor="decisoes-de">Data de</Label><Input id="decisoes-de" type="date" value={filtros.de} onChange={e => mudar("de", e.target.value)} /></div>
        <div className="min-w-0 space-y-1.5"><Label htmlFor="decisoes-ate">Data até</Label><Input id="decisoes-ate" type="date" value={filtros.ate} onChange={e => mudar("ate", e.target.value)} /></div>
      </div>
      <div className="flex items-center gap-2"><Checkbox id="decisoes-confirmar" checked={filtros.confirmar} onCheckedChange={v => mudar("confirmar", v === true)} /><Label htmlFor="decisoes-confirmar">Somente Responsável a confirmar</Label></div>
    </div>
    {query.isPending ? <div className="flex items-center justify-center gap-2 py-16" role="status"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />Carregando decisões…</div>
      : query.isError ? <div className="space-y-3 py-12 text-center" role="alert"><p className="text-destructive">Não foi possível carregar as decisões.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div>
      : <Table><TableHeader><TableRow>{["Código", "Título", "Reunião de origem", "Tipo de fórum", "Data", "Responsável", "Impacto", "Trade-off"].map(c => <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>)}</TableRow></TableHeader><TableBody>
        {!filtradas.length ? <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">Nenhuma decisão encontrada para os filtros</TableCell></TableRow>
          : filtradas.map(d => <TableRow key={d.id} onClick={() => setCodigo(d.codigo)} className="cursor-pointer">
            <TableCell className="whitespace-nowrap"><Button variant="link" className="h-auto p-0 font-semibold" aria-label={`Abrir decisão ${d.codigo}`} onClick={e => { e.stopPropagation(); setCodigo(d.codigo); }}>{d.codigo}</Button></TableCell>
            <TableCell className="min-w-[220px] max-w-sm"><div className="space-y-1"><p className="font-medium">{d.titulo}</p>{d.acesso_reservado && <Reservada />}</div></TableCell>
            <TableCell className="min-w-[160px]">{d.reuniao_origem || "—"}</TableCell><TableCell>{rotuloForum(d.tipo_forum)}</TableCell><TableCell className="whitespace-nowrap">{dataDecisao(d.data_decisao)}</TableCell><TableCell className="min-w-[150px]">{d.responsavel || "—"}</TableCell><TableCell className="min-w-[140px]">{d.impacto_bsc || "—"}</TableCell><TableCell className="min-w-[240px] max-w-sm"><p className="line-clamp-2">{d.tradeoff || "—"}</p></TableCell>
          </TableRow>)}
      </TableBody></Table>}
    <Sheet open={!!atual} onOpenChange={aberto => { if (!aberto) setCodigo(null); }}><SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl">
      {atual && <><div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-8"><SheetHeader className="space-y-3 border-b pb-6 pr-5 text-left"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{atual.codigo}</Badge><span className="text-sm text-muted-foreground">{dataDecisao(atual.data_decisao)}</span>{atual.acesso_reservado && <Reservada />}</div><SheetDescription className="whitespace-pre-wrap break-words">{textoFormatado(atual.pergunta || "—")}</SheetDescription><SheetTitle className="break-words">{textoFormatado(atual.titulo)}</SheetTitle><div className="text-sm"><span className="text-muted-foreground">Decisor: </span>{textoFormatado(atual.decisor || "—")}</div></SheetHeader>
        <div className="divide-y">{BLOCOS.map(({ titulo, campo }) => {
          const bruto = atual[campo];
          const texto = campo === "tipo_forum" ? rotuloForum(atual.tipo_forum) : Array.isArray(bruto) ? bruto.join(", ") : typeof bruto === "string" ? bruto : "";
          return <section key={campo} className={`py-5 ${campo === "decisao" ? "border-l-4 border-l-primary pl-4" : ""}`}><h3 className={`mb-2 text-sm font-semibold ${campo === "decisao" ? "text-primary" : "text-muted-foreground"}`}>{titulo}</h3><div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{textoFormatado(texto || "—")}</div>{campo === "revisao" && atual.proxima_revisao && <p className="mt-2 text-sm text-muted-foreground">Próxima revisão: {dataDecisao(atual.proxima_revisao)}</p>}</section>;
        })}{(["cita", "citadaPor"] as const).map(tipo => <section key={tipo} className="py-5"><h3 className="mb-2 text-sm font-semibold text-muted-foreground">{tipo === "cita" ? "Cita" : "Citada por"}</h3><div className="flex flex-wrap gap-x-4 gap-y-2">{referencias.get(atual.codigo)?.[tipo].length ? referencias.get(atual.codigo)?.[tipo].map(ref => <Button key={ref} variant="link" className="h-auto p-0" onClick={() => setCodigo(ref)} aria-label={`Abrir decisão ${ref}`}>{ref}</Button>) : <span className="text-sm text-muted-foreground">—</span>}</div></section>)}</div>
      </div><div className="flex shrink-0 items-center justify-between gap-3 border-t bg-background px-6 py-4"><Button variant="outline" size="icon" title="Decisão anterior" aria-label="Decisão anterior" disabled={indice <= 0} onClick={() => { const d = filtradas[indice - 1]; if (d) setCodigo(d.codigo); }}><ArrowLeft className="h-4 w-4" /></Button><span className="text-sm text-muted-foreground">{indice >= 0 ? `${indice + 1} de ${filtradas.length}` : "Fora dos filtros atuais"}</span><Button variant="outline" size="icon" title="Próxima decisão" aria-label="Próxima decisão" disabled={indice < 0 || indice >= filtradas.length - 1} onClick={() => { const d = filtradas[indice + 1]; if (d) setCodigo(d.codigo); }}><ArrowRight className="h-4 w-4" /></Button></div></>}
    </SheetContent></Sheet>
  </div>;
}