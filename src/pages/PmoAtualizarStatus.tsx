import { useEffect, useRef, useState } from "react";
import { exclusiveAction } from "@/lib/exclusiveAction";
import { FormField } from "@/components/FormField";
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Link, useSearchParams } from "react-router-dom";
import { Copy, Save, ExternalLink, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { filtrarAtualizacao, STATUS_DIRETOS } from "@/lib/atualizacaoStatus";
import { useBaseOrganizacional } from '@/hooks/useBaseOrganizacional';
import { nomeVinculado } from '@/lib/baseOrganizacional';

type Item = { id: string; codigo: string; nome: string; status: string; cadeira: string; diretor: string | null; diretor_pessoa_id?: string | null; tipo: string; origem: string; termino: string | null; avanco_pct: number | null; updated_at: string; comentario?: string; espelho?: boolean };
type Draft = { status: string; termino: string; avanco_pct: number | null; comentario: string };
export default function PmoAtualizarStatus() {
  const org = useBaseOrganizacional();
  const [sp, setSp] = useSearchParams(); const [items, setItems] = useState<Item[]>([]);
  const [cadeiras, setCadeiras] = useState<string[]>([]); const [edit, setEdit] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({}); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); const [mirrorError, setMirrorError] = useState(false); const [busy, setBusy] = useState(false); const [audit, setAudit] = useState<any[] | null>(null);
  const runOnce = useRef(exclusiveAction());
  const [errosCampos, setErrosCampos] = useState<string[]>([]);
  useUnsavedChanges(Object.keys(drafts).length>0);
  const carregar = async () => {
    setLoading(true); setError(false);
    const [p, c, m, perm] = await Promise.all([
      supabase.from("projetos").select("id,codigo,nome,status,classificacao,cadeira_id,diretor,diretor_pessoa_id,termino,avanco_pct,updated_at,atualizacao_comentario").order("codigo"),
      supabase.from("mt_cadeiras").select("id,nome").eq("ativo", true),
      supabase.from("proc_espelho_melhorias").select("*").eq("ativo", true),
      supabase.rpc("pmo_pode_atualizar"),
    ]);
    if (p.error || perm.error) { setError(true); setLoading(false); return; }
    setMirrorError(!!m.error);
    const nomes = new Map((c.data ?? []).map(x => [x.id, x.nome])); setCadeiras([...nomes.values()]);
    setItems([...(p.data ?? []).map(x => ({ ...x, cadeira: nomes.get(x.cadeira_id ?? "") ?? "Sem cadeira", tipo: x.classificacao.startsWith("Melhoria") ? "melhoria" : "projeto", origem: "Portfólio", comentario: x.atualizacao_comentario ?? "" })),
      ...(m.data ?? []).map(x => ({ id: x.origem_id, codigo: x.processo_codigo ?? "—", nome: x.titulo, status: x.status ?? "", cadeira: "", diretor: x.responsavel, tipo: "melhoria", origem: "Gestão Processos · somente leitura", termino: x.previsao, avanco_pct: null, updated_at: x.sincronizado_em, espelho: true }))]);
    setEdit(perm.data === true); setLoading(false);
  };
  useEffect(() => { void carregar(); }, []);
  const filtro = (key: string, value: string) => { const n = new URLSearchParams(sp); if (value === "todos") n.delete(key); else n.set(key, value); if (!n.has("status")) n.set("status", "aberto"); setSp(n, { replace: true }); };
  const mudar = (item: Item, patch: Partial<Draft>) => setDrafts(d => ({ ...d, [item.id]: { ...(d[item.id] ?? { status: item.status, termino: item.termino ?? "", avanco_pct: item.avanco_pct, comentario: "" }), ...patch } }));
  const salvar = (ids: string[]) => runOnce.current(async () => {
    const alterados = ids.map(id => ({ ...drafts[id], id, updated_at: items.find(i => i.id === id)?.updated_at }));
    const invalidos = alterados.filter(i => !i.comentario?.trim()).map(i => i.id);
    setErrosCampos(invalidos);
    if (invalidos.length) return toast.error("Informe o comentário de cada atualização.");
    setBusy(true);
    try {
    const { error: err, data } = await supabase.rpc("pmo_atualizar_status", { _itens: alterados });
    setBusy(false); if (err) return toast.error(err.message);
    setDrafts(d => Object.fromEntries(Object.entries(d).filter(([id]) => !ids.includes(id))));
    toast.success(`${data} atualização(ões) salva(s).`); await carregar();
    } catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setBusy(false); }
  });
  const historico = async (id: string) => { const { data, error: err } = await supabase.from("pmo_atualizacoes_auditoria").select("*").eq("projeto_id", id).order("created_at", { ascending: false }); if (err) toast.error("Não foi possível abrir o histórico."); else setAudit(data ?? []); };
  const lista = filtrarAtualizacao(items.map(i => ({ ...i, diretor: nomeVinculado(i.diretor_pessoa_id, i.diretor, org.diretorio.pessoas) || null })), sp);
  if (loading) return <p>Carregando atualizações…</p>;
  if (error) return <div className="space-y-3"><p role="alert">Não foi possível carregar o portfólio.</p><Button onClick={carregar}>Tentar novamente</Button></div>;
  return <div className="space-y-6">
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-semibold">Atualizar status</h1><p className="text-sm text-muted-foreground">Portfólio · {edit ? "Edição autorizada" : "Somente leitura"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/pmo/atualizar-status?${sp.has("status") ? sp : new URLSearchParams({ ...Object.fromEntries(sp), status: "aberto" })}`); toast.success("Link copiado."); } catch { toast.error("Não foi possível copiar o link."); } }}><Copy className="h-4 w-4 mr-2" />Copiar link</Button>{edit && <Button disabled={busy || !Object.keys(drafts).length} onClick={() => salvar(Object.keys(drafts))}><Save className="h-4 w-4 mr-2" />Salvar alterações ({Object.keys(drafts).length})</Button>}</div></header>
    <p className="text-sm text-muted-foreground">Encerrar ou cancelar projetos exige <Link className="text-primary underline" to="/pmo/farol">decisão registrada no Status Report</Link>.</p>
    <div className="flex flex-wrap gap-3">
      <Select value={sp.get("status") ?? "aberto"} onValueChange={v => filtro("status", v)}><SelectTrigger className="w-full sm:w-48" aria-label="Status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aberto">Em aberto</SelectItem>{STATUS_DIRETOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      <Select value={sp.get("cadeira") ?? "todos"} onValueChange={v => filtro("cadeira", v)}><SelectTrigger className="w-full sm:w-60" aria-label="Cadeira"><SelectValue placeholder="Cadeira" /></SelectTrigger><SelectContent><SelectItem value="todos">Todas as cadeiras</SelectItem>{cadeiras.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      <Select value={sp.get("tipo") ?? "todos"} onValueChange={v => filtro("tipo", v)}><SelectTrigger className="w-full sm:w-48" aria-label="Tipo"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Projetos e melhorias</SelectItem><SelectItem value="projeto">Projetos</SelectItem><SelectItem value="melhoria">Melhorias</SelectItem></SelectContent></Select>
      <Input aria-label="Diretor" placeholder="Diretor / responsável" className="w-full sm:w-60" value={sp.get("diretor") ?? ""} onChange={e => filtro("diretor", e.target.value || "todos")} />
    </div>
    {mErroAviso()}
    {mirrorError && <p className="text-sm text-muted-foreground">Melhorias do app de processos indisponíveis para este acesso.</p>}
    {["projeto", "melhoria"].filter(t => !sp.get("tipo") || sp.get("tipo") === "todos" || sp.get("tipo") === t).map(tipo => <section key={tipo} className="space-y-3"><h2 className="text-lg font-semibold">{tipo === "projeto" ? "Projetos estratégicos" : "Melhorias estratégicas"} ({lista.filter(i => i.tipo === tipo).length})</h2>
      {!lista.some(i => i.tipo === tipo) && <p className="text-sm text-muted-foreground">Nenhum item nos filtros selecionados.</p>}
      {lista.filter(i => i.tipo === tipo).map(i => { const d = drafts[i.id]; const pode = edit && !i.espelho && STATUS_DIRETOS.includes(i.status); return <article key={`${i.origem}:${i.id}`} className="border rounded-md p-4 space-y-3 bg-card">
        <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-medium">{i.codigo} · {i.nome}</h3><p className="text-xs text-muted-foreground">{i.cadeira || "Sem cadeira confirmada"} · {i.diretor || "Sem responsável"} · {i.origem}</p></div><div className="flex gap-2 items-start"><Badge variant={i.status === "Atrasado" ? "destructive" : "outline"}>{i.status}</Badge>{!i.espelho && <Button size="icon" variant="ghost" title="Histórico de atualizações" aria-label={`Histórico ${i.codigo}`} onClick={() => historico(i.id)}><History className="h-4 w-4" /></Button>}</div></div>
        {pode ? <><div className="grid gap-3 sm:grid-cols-3"><div><label className="text-xs">Status</label><Select value={d?.status ?? i.status} onValueChange={v => mudar(i, { status: v })}><SelectTrigger aria-label={`Status ${i.codigo}`}><SelectValue /></SelectTrigger><SelectContent>{STATUS_DIRETOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div><label className="text-xs">Avanço (%)</label><Input aria-label={`Avanço ${i.codigo}`} type="number" min={0} max={100} value={(d ? d.avanco_pct : i.avanco_pct) ?? ""} onChange={e => mudar(i, { avanco_pct: e.target.value === "" ? null : Number(e.target.value) })} /></div><div><label className="text-xs">Previsão / prazo</label><Input aria-label={`Prazo ${i.codigo}`} type="date" value={d?.termino ?? (/^\d{4}-\d{2}-\d{2}$/.test(i.termino ?? "") ? i.termino ?? "" : "")} onChange={e => mudar(i, { termino: e.target.value })} />{i.termino && !/^\d{4}-\d{2}-\d{2}$/.test(i.termino) && <p className="text-xs text-muted-foreground">Prazo atual: {i.termino}</p>}</div></div><FormField id={`atualizacao-${i.id}-comentario`} label="Comentário da atualização" required error={errosCampos.includes(i.id) && !d?.comentario.trim() ? "Informe o comentário antes de salvar." : undefined}><Textarea disabled={busy} value={d?.comentario ?? ""} onChange={e => mudar(i, { comentario: e.target.value })} /></FormField><div className="flex justify-end"><Button size="sm" disabled={busy || !d} onClick={() => salvar([i.id])}><Save className="h-4 w-4 mr-2" />{busy ? "Salvando…" : "Salvar"}</Button></div></> : <div className="text-sm"><p>Prazo: {i.termino || "—"} · Avanço: {i.avanco_pct == null ? "—" : `${i.avanco_pct}%`}</p>{i.comentario && <p className="whitespace-pre-wrap">{i.comentario}</p>}{i.espelho && <a className="text-primary inline-flex items-center gap-1" href="https://processoslm.lovable.app" target="_blank" rel="noopener noreferrer">Abrir no Gestão Processos <ExternalLink className="h-3 w-3" /></a>}</div>}
      </article>; })}</section>)}
    {audit && <Dialog open onOpenChange={o => !o && setAudit(null)}><DialogContent className="max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Histórico de atualizações diretas</DialogTitle></DialogHeader>{!audit.length && <p>Sem atualizações diretas.</p>}{audit.map(a => <div key={a.id} className="border-t pt-3 text-sm space-y-2"><p>{new Date(a.created_at).toLocaleString("pt-BR")} · {a.usuario_nome ?? "Usuário"}</p>{["status", "avanco_pct", "termino", "comentario"].map(k => <p key={k}><strong>{k === "avanco_pct" ? "Avanço" : k === "termino" ? "Prazo" : k === "comentario" ? "Comentário" : "Status"}:</strong> {String(a.anterior?.[k] ?? "—")} → {String(a.novo?.[k] ?? "—")}</p>)}</div>)}</DialogContent></Dialog>}
  </div>;
}
function mErroAviso() { return <p className="text-xs text-muted-foreground">Melhorias do portfólio são atualizadas aqui. Melhorias espelhadas permanecem somente leitura; a lista antiga salva apenas neste navegador fica em <Link to="/melhorias" className="text-primary underline">Melhorias</Link>.</p>; }