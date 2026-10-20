import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { linkEstrategico } from "@/lib/linksEstrategicos";
import { Loader2, Pencil, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataDecisao } from "./contextoDecisoes";
import { ADERENCIAS, CORES_ADERENCIA, aderenciaValida, avaliacaoPayload, contarAderencias, filtrarCombinados, podeEditarCesta, type Aderencia, type CombinadoCesta } from "./cestaInsightsDados";

export default function CestaInsights() {
  const { user } = useAuth();
  const acesso = useModuleAccess();
  const podeEditar = !acesso.loading && !acesso.error && podeEditarCesta(!!user, acesso.grants, acesso.roles);
  const [cadeira, setCadeira] = useState("todos");
  const [aderencia, setAderencia] = useState("todos");
  const [decisao, setDecisao] = useState("todos");
  const [busca, setBusca] = useState("");
  const [edicao, setEdicao] = useState<CombinadoCesta | null>(null);
  const [valor, setValor] = useState<Aderencia>("nao_avaliado");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const query = useQuery({
    queryKey: ["cesta-insights", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: itens, error } = await supabase.from("cesta_insights").select("*").order("decisao_codigo").order("created_at");
      if (error) throw error;
      const ids = [...new Set(itens.map(i => i.mt_cadeira_id))];
      if (!ids.length) return { itens, cadeiras: [] };
      const { data: cadeiras, error: erro } = await supabase.from("mt_cadeiras").select("id,nome,diretor_nome").in("id", ids).order("nome");
      if (erro) throw erro;
      return { itens, cadeiras };
    },
  });
  const itens = query.data?.itens ?? [];
  const filtrados = filtrarCombinados(itens, cadeira, aderencia, decisao, busca);
  const cadeiras = query.data?.cadeiras ?? [];
  const grupos = [...new Set(filtrados.map(i => i.mt_cadeira_id))].map(id => ({ id, cadeira: cadeiras.find(c => c.id === id), itens: filtrados.filter(i => i.mt_cadeira_id === id) })).sort((a, b) => (a.cadeira?.nome ?? "").localeCompare(b.cadeira?.nome ?? "", "pt-BR"));
  const decisoes = [...new Set(itens.flatMap(i => i.decisao_codigo ? [i.decisao_codigo] : []))].sort();
  function abrir(item: CombinadoCesta) {
    if (!podeEditar) return;
    setEdicao(item); setValor(aderenciaValida(item.aderencia)); setObservacao(item.observacao ?? ""); setErro(""); setSucesso("");
  }
  async function salvar() {
    if (!user || !edicao || !podeEditar || salvando) return;
    setSalvando(true); setErro("");
    try {
      const { data, error } = await supabase.from("cesta_insights").update(avaliacaoPayload(valor, observacao, user.id)).eq("id", edicao.id).select("id,aderencia,observacao,avaliado_em,avaliado_por").single();
      if (error) throw error;
      if (!data) throw new Error("Avaliação não gravada");
      await query.refetch(); setEdicao(null); setSucesso("Avaliação salva.");
    } catch { setErro("Não foi possível salvar a avaliação. Verifique seu acesso e tente novamente."); }
    finally { setSalvando(false); }
  }
  const filtro = (titulo: string, value: string, mudar: (v: string) => void, opcoes: { id: string; nome: string }[]) => <div className="min-w-0 space-y-1.5"><Label>{titulo}</Label><Select value={value} onValueChange={mudar}><SelectTrigger aria-label={titulo} className="h-auto min-h-10 text-left [&>span]:whitespace-normal"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{opcoes.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent></Select></div>;
  return <div className="min-w-0 space-y-6">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">Insights da Cesta</h2><span role="status" className="text-sm text-muted-foreground">{filtrados.length} combinados</span></div>
    <div className="grid gap-4 md:grid-cols-3">{filtro("Cadeira", cadeira, setCadeira, cadeiras.map(c => ({ id: c.id, nome: `${c.nome} · ${c.diretor_nome || "Sem diretor"}` })))}{filtro("Aderência", aderencia, setAderencia, Object.entries(ADERENCIAS).map(([id, nome]) => ({ id, nome })))}{filtro("Decisão", decisao, setDecisao, decisoes.map(id => ({ id, nome: id })))}</div>
    <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar combinados" placeholder="Buscar combinados" className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} /></div>
    {sucesso && <p role="status" className="text-sm text-success">{sucesso}</p>}
    {query.isPending ? <p role="status" className="flex items-center gap-2 py-12"><Loader2 className="h-5 w-5 animate-spin" />Carregando combinados…</p> : query.isError ? <div role="alert"><p className="text-destructive">Não foi possível carregar os combinados.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div> : !grupos.length ? <p className="py-12 text-center text-muted-foreground">Nenhum combinado encontrado para os filtros</p> : grupos.map(g => {
      const contagem = contarAderencias(g.itens);
      return <section key={g.id} className="min-w-0 space-y-4 border-t pt-6"><header className="space-y-3"><h3 className="break-words font-semibold">{g.cadeira?.nome || "Cadeira não disponível"}<span className="ml-2 font-normal text-muted-foreground">{g.cadeira?.diretor_nome}</span></h3><div className="flex flex-wrap gap-2">{Object.entries(ADERENCIAS).map(([a, label]) => <Badge key={a} variant="outline" className={CORES_ADERENCIA[a as Aderencia]}>{label}: {contagem[a as Aderencia]}</Badge>)}</div></header><Table><TableHeader><TableRow>{["Decisão", "Combinado", "Indicador", "Aderência", "Observação", "Avaliado em", ...(podeEditar ? ["Avaliar"] : [])].map(t => <TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>{g.itens.map(i => <TableRow key={i.id}>
        <TableCell>{linkEstrategico(i.decisao_codigo) ? <Button asChild variant="link" className="h-auto p-0"><Link to={linkEstrategico(i.decisao_codigo) ?? ""}>{i.decisao_codigo}</Link></Button> : i.decisao_codigo || "—"}</TableCell><TableCell className="min-w-[260px] max-w-lg whitespace-pre-wrap">{i.combinado}</TableCell><TableCell className="min-w-[120px]">{i.indicador_ref || "—"}</TableCell><TableCell><Badge variant="outline" className={`whitespace-nowrap ${CORES_ADERENCIA[aderenciaValida(i.aderencia)]}`}>{ADERENCIAS[aderenciaValida(i.aderencia)]}</Badge></TableCell><TableCell className="min-w-[200px] max-w-sm whitespace-pre-wrap">{i.observacao || "—"}</TableCell><TableCell className="whitespace-nowrap">{dataDecisao(i.avaliado_em)}</TableCell>{podeEditar && <TableCell><Button variant="ghost" size="icon" title="Avaliar combinado" aria-label={`Avaliar combinado ${i.id}`} onClick={() => abrir(i)}><Pencil className="h-4 w-4" /></Button></TableCell>}
      </TableRow>)}</TableBody></Table></section>;
    })}
    <Dialog open={!!edicao && podeEditar} onOpenChange={open => { if (!open && !salvando) setEdicao(null); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto"><DialogHeader><DialogTitle>Avaliar combinado</DialogTitle><DialogDescription className="whitespace-pre-wrap break-words">{edicao?.combinado}</DialogDescription></DialogHeader>
      <div className="space-y-2"><Label>Aderência</Label><Select value={valor} onValueChange={v => setValor(aderenciaValida(v))} disabled={salvando}><SelectTrigger aria-label="Aderência da avaliação"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ADERENCIAS).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="observacao-avaliacao">Observação</Label><Textarea id="observacao-avaliacao" value={observacao} onChange={e => setObservacao(e.target.value)} disabled={salvando} rows={4} /></div>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}<DialogFooter><Button variant="outline" disabled={salvando} onClick={() => setEdicao(null)}>Cancelar</Button><Button disabled={salvando} onClick={salvar}>{salvando ? "Salvando…" : "Salvar avaliação"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}