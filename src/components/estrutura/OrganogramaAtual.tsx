import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Upload, Plus, Pencil, Search, Loader2, Network, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buscarCargos, lerOrganograma, type Cargo, type CargoImportado } from "@/lib/organograma";
import EditarCargo, { type CargoEdicao } from "./EditarCargo";

function Ramo({ cargo, cargos, abrir, profundidade = 0 }: { cargo: Cargo; cargos: Cargo[]; abrir: (c: Cargo) => void; profundidade?: number }) {
  const [expandido, setExpandido] = useState(profundidade < 2);
  const filhos = cargos.filter(c => c.parent_id === cargo.id);
  return <li className="min-w-0"><div className="flex min-w-0 items-stretch gap-2">
    <Button variant="outline" aria-label={`${expandido ? "Recolher" : "Expandir"} ${cargo.nome} ${cargo.ocupante_nome ?? ""}`} disabled={!filhos.length} onClick={() => setExpandido(!expandido)} className="h-auto w-9 shrink-0 rounded-md px-0">{expandido ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button>
    <Button variant="outline" onClick={() => abrir(cargo)} aria-label={`Abrir cargo ${cargo.ocupante_nome ?? cargo.nome}`} className={`h-auto min-h-20 min-w-0 flex-1 flex-col items-start gap-1 whitespace-normal rounded-lg border-l-4 p-3 text-left ${profundidade === 0 ? "border-l-primary bg-primary-soft" : "border-l-border bg-card"}`}>
      <span className="break-words font-semibold">{cargo.nome}</span><span className="break-words text-sm font-normal text-muted-foreground">{cargo.ocupante_nome ?? "—"}</span>
      <span className="flex flex-wrap gap-2 text-xs font-normal text-muted-foreground">{filhos.length > 0 && <span>{filhos.length} cargos</span>}{!cargo.ativo && <Badge variant="outline">Inativo</Badge>}</span>
    </Button></div>
    {expandido && filhos.length > 0 && <ul className="ml-4 mt-3 space-y-3 border-l pl-3 sm:ml-6 sm:pl-5">{filhos.map(c => <Ramo key={c.id} cargo={c} cargos={cargos} abrir={abrir} profundidade={profundidade + 1} />)}</ul>}
  </li>;
}
export default function OrganogramaAtual({ canEdit }: { canEdit: boolean }) {
  const { user } = useAuth(); const cache = useQueryClient(); const arquivo = useRef<HTMLInputElement>(null);
  const key = ["organograma-atual", user?.id];
  const query = useQuery({ queryKey: key, enabled: !!user, queryFn: async () => {
    const { data, error } = await supabase.from("org_organograma_cargos").select("*").order("ordem");
    if (error) throw error; return data;
  }});
  const cargos = query.data ?? [];
  const [busca, setBusca] = useState(""); const [lista, setLista] = useState(false);
  const [selecionado, setSelecionado] = useState<Cargo | null>(null); const [editando, setEditando] = useState<CargoEdicao | null>(null);
  const [importados, setImportados] = useState<CargoImportado[] | null>(null); const [erro, setErro] = useState(""); const [busy, setBusy] = useState(false);
  const salvar = async (v: CargoEdicao) => {
    if (!canEdit) throw new Error("Sem permissão");
    const payload = { nome: v.nome, ocupante_nome: v.ocupante_nome, nivel: v.nivel ?? "outro", parent_id: v.parent_id, ordem: v.ordem ?? 0, ativo: v.ativo === true, observacoes: v.observacoes };
    const result = v.id ? await supabase.from("org_organograma_cargos").update(payload).eq("id", v.id).select().single() : await supabase.from("org_organograma_cargos").insert(payload).select().single();
    if (result.error) throw result.error;
    await cache.invalidateQueries({ queryKey: key }); setSelecionado(null);
  };
  const importar = async () => {
    if (!canEdit || !importados) return;
    setBusy(true); setErro("");
    try {
      const existentes = new Map(cargos.filter(c => c.fonte_celula).map(c => [c.fonte_celula, c.id]));
      const ids = new Map(importados.map(c => [c.id, existentes.get(c.fonte_celula) ?? c.id]));
      const novos = importados.map(c => ({ ...c, id: ids.get(c.id) ?? c.id, parent_id: c.parent_id ? ids.get(c.parent_id) ?? null : null }));
      const { error } = await supabase.from("org_organograma_cargos").upsert(novos, { onConflict: "id" }).select("id");
      if (error) throw error;
      await cache.invalidateQueries({ queryKey: key }); setImportados(null);
    } catch { setErro("Não foi possível importar. Verifique sua permissão e tente novamente."); }
    finally { setBusy(false); }
  };
  const filtrados = buscarCargos(cargos, busca);
  const raizes = cargos.filter(c => !c.parent_id || !cargos.some(p => p.id === c.parent_id));
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Organograma LM</h3><p className="text-sm text-muted-foreground">{cargos.length} cargos · {cargos.filter(c => c.ativo).length} ativos</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="icon" title={lista ? "Organograma" : "Lista de cargos"} aria-label={lista ? "Organograma" : "Lista de cargos"} onClick={() => setLista(!lista)}>{lista ? <Network className="h-4 w-4" /> : <List className="h-4 w-4" />}</Button>{canEdit && <><Button variant="outline" onClick={() => arquivo.current?.click()}><Upload className="mr-2 h-4 w-4" />Importar planilha</Button><Button onClick={() => setEditando({ nome: "", ocupante_nome: null, parent_id: null, nivel: "outro", ordem: cargos.length, ativo: true })}><Plus className="mr-2 h-4 w-4" />Novo cargo</Button></>}</div>
    </div>
    <input ref={arquivo} type="file" accept=".xlsx,.xls" className="hidden" aria-label="Planilha do organograma" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { setErro(""); setImportados(lerOrganograma(await f.arrayBuffer())); } catch (e) { setErro(e instanceof Error ? e.message : "Planilha inválida."); } e.target.value = ""; }} />
    <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar cargos do organograma" placeholder="Buscar cargo ou ocupante" className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} /></div>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    {query.isPending ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : query.isError ? <div role="alert"><p>Não foi possível carregar o organograma.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div> : !cargos.length ? <p className="py-12 text-center text-muted-foreground">Nenhum cargo cadastrado.</p> : (lista || busca) ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtrados.map(c => <Button key={c.id} variant="outline" onClick={() => setSelecionado(c)} className="h-auto min-h-24 flex-col items-start whitespace-normal rounded-lg p-4 text-left"><span className="font-semibold">{c.nome}</span><span className="text-sm font-normal text-muted-foreground">{c.ocupante_nome ?? "—"}</span><span className="mt-2 text-xs font-normal text-muted-foreground">Superior: {cargos.find(p => p.id === c.parent_id)?.nome ?? "—"}</span></Button>)}{!filtrados.length && <p className="text-muted-foreground">Nenhum cargo encontrado.</p>}</div> : <ul aria-label="Organograma atualizado" className="max-w-5xl space-y-4">{raizes.map(c => <Ramo key={c.id} cargo={c} cargos={cargos} abrir={setSelecionado} />)}</ul>}
    <Dialog open={!!selecionado} onOpenChange={v => { if (!v) setSelecionado(null); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto"><DialogHeader><DialogTitle>{selecionado?.nome}</DialogTitle></DialogHeader>{selecionado && <div className="space-y-4"><p className="text-lg font-medium">{selecionado.ocupante_nome ?? "—"}</p><p className="text-sm">Superior: {cargos.find(c => c.id === selecionado.parent_id)?.nome ?? "—"}</p><Badge variant="secondary">{selecionado.ativo ? "Ativo" : "Inativo"}</Badge><p className="whitespace-pre-wrap text-sm text-muted-foreground">{selecionado.observacoes}</p><div className="border-t pt-4"><p className="text-xs text-muted-foreground">Texto original · {selecionado.fonte_celula ?? "Cadastro manual"}</p><p className="whitespace-pre-wrap text-sm">{selecionado.texto_original ?? "—"}</p></div>{canEdit && <Button onClick={() => { setEditando(selecionado); setSelecionado(null); }}><Pencil className="mr-2 h-4 w-4" />Editar cargo</Button>}</div>}</DialogContent></Dialog>
    {editando && <EditarCargo cargo={editando} cargos={cargos} salvar={salvar} fechar={() => setEditando(null)} />}
    <Dialog open={!!importados} onOpenChange={v => { if (!v && !busy) setImportados(null); }}><DialogContent className="w-[calc(100%-2rem)]"><DialogHeader><DialogTitle>Importar organograma</DialogTitle></DialogHeader><p>{importados?.length} cargos identificados na aba atual.</p><p className="text-sm text-muted-foreground">As fichas estratégicas são preservadas. As relações são agrupamentos visuais da planilha, com chefia a confirmar. Cargos já importados são atualizados pela célula de origem.</p>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}<Button disabled={busy} onClick={() => void importar()}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar importação</Button></DialogContent></Dialog>
  </div>;
}