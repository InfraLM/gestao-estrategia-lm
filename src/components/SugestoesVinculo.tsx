import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

const db = supabase;
type Alvo = { id: string; tipo: string; codigo: string; nome: string; perspectiva: string; origem: string };
type Fonte = { chave: string; origem_id: string; origem_tipo: string; codigo: string; titulo: string; comite: string; situacao: string };
type Resumo = { fontes: Fonte[]; candidatos: string[]; alvos: Alvo[]; limite: number; lote: number; semestre: string };
type Sugestao = { id: string; origem_tipo: string; origem_id: string; tipo: string; ref_id: string; status: string; justificativa: string; trecho: string; confianca: string; revisado_em: string | null; revisado_por: string | null; aprovado_tipo?: string | null; aprovado_ref_id?: string | null };
type Confirmacao = { acao: 'aprovar' | 'rejeitar' | 'gerar'; ids: string[]; novamente?: boolean };
const confiancas: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

export default function SugestoesVinculo() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [trocas, setTrocas] = useState<Record<string, string>>({});
  const [busca, setBusca] = useState('');
  const [confianca, setConfianca] = useState('todas');
  const [origem, setOrigem] = useState('todas');
  const [comite, setComite] = useState('todos');
  const [perspectiva, setPerspectiva] = useState('todas');
  const [status, setStatus] = useState('pendente');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [editor, setEditor] = useState<string | null>(null);
  const [buscaAlvo, setBuscaAlvo] = useState('');
  const [novamente, setNovamente] = useState(false);

  const invocar = async (body: unknown) => {
    const { data, error } = await db.functions.invoke('estrategia-sugerir', { body });
    if (error) {
      let msg = error.message;
      if (error.context instanceof Response) { try { msg = (await error.context.json()).error ?? msg; } catch { /* response without json */ } }
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };
  const carregar = async () => {
    setErro('');
    try {
      const [r, s] = await Promise.all([invocar({ modo: 'resumo', novamente }), db.from('estrategia_sugestoes').select('*').order('created_at', { ascending: false })]);
      if (s.error) throw s.error;
      setResumo(r); setSugestoes(s.data ?? []); setSelecionadas([]);
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível carregar a fila.'); }
  };
  useEffect(() => { void carregar(); }, [novamente]);
  const fonte = (s: Sugestao) => resumo?.fontes.find(f => f.origem_id === s.origem_id && f.origem_tipo === s.origem_tipo);
  const alvo = (s: Sugestao) => resumo?.alvos.find(a => `${a.tipo}:${a.id}` === (trocas[s.id] ?? `${s.aprovado_tipo ?? s.tipo}:${s.aprovado_ref_id ?? s.ref_id}`));
  const visiveis = useMemo(() => sugestoes.filter(s => {
    const f = fonte(s); const a = alvo(s);
    return (status === 'todos' || s.status === status) && (confianca === 'todas' || s.confianca === confianca) && (origem === 'todas' || s.origem_tipo === origem) && (comite === 'todos' || f?.comite === comite) && (perspectiva === 'todas' || a?.perspectiva === perspectiva) && `${f?.codigo} ${f?.titulo} ${a?.codigo} ${a?.nome}`.toLowerCase().includes(busca.toLowerCase());
  }), [sugestoes, resumo, trocas, status, confianca, origem, comite, perspectiva, busca]);
  const pendentes = visiveis.filter(s => s.status === 'pendente');
  const selecionadasVisiveis = selecionadas.filter(id => pendentes.some(s => s.id === id));
  const toggle = (id: string) => setSelecionadas(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  const executar = async () => {
    if (!confirmacao || ocupado) return;
    const c = confirmacao; setConfirmacao(null); setOcupado(true); setErro('');
    try {
      if (c.acao === 'gerar') {
        const r = await invocar({ modo: 'gerar', fontes: c.ids, novamente: c.novamente ?? false });
        toast.success(`${r.analisados} itens analisados · ${r.sugestoes} sugestões pendentes.`);
      } else {
        const itens = c.ids.map(id => { const s = sugestoes.find(s => s.id === id); const a = s && alvo(s); return { id, ...(a ? { tipo: a.tipo, ref_id: a.id } : {}) }; });
        const { data, error } = await db.rpc('estrategia_revisar_sugestoes', { _acao: c.acao, _itens: itens });
        if (error) throw error;
        toast.success(`${data} sugestões ${c.acao === 'aprovar' ? 'aprovadas' : 'rejeitadas'}.`);
        setTrocas({});
      }
      await carregar();
    } catch (e) { const m = e instanceof Error ? e.message : 'Não foi possível concluir.'; setErro(m); toast.error(m); }
    finally { setOcupado(false); }
  };
  const novos = resumo?.fontes.filter(f => f.situacao === 'sem_sugestao') ?? [];
  const candidatas = resumo?.candidatos.slice(0, resumo.limite) ?? [];
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Sugestões de vínculo</h2><p className="text-sm text-muted-foreground">Governança e CEO · Lovable AI · {resumo?.semestre ?? '—'}</p></div>
      <Button variant="outline" size="sm" onClick={() => void carregar()} disabled={ocupado}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
    </div>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    {!resumo && !erro && <p className="text-sm text-muted-foreground">Carregando fila…</p>}
    {resumo && <>
      <div className="flex flex-wrap items-center gap-3 border-y py-3">
        <Badge variant="outline">{novos.length} sem sugestão</Badge>
        <Badge variant="outline">{sugestoes.filter(s => s.status === 'pendente').length} pendentes</Badge>
        <span className="text-sm text-muted-foreground">Próxima geração: {candidatas.length} itens · limite {resumo.limite} · lotes de {resumo.lote}</span>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={novamente} onCheckedChange={v => setNovamente(v === true)} disabled={ocupado} />Gerar de novo (inclui rejeitadas)</label>
        <Button disabled={ocupado || !candidatas.length} onClick={() => setConfirmacao({ acao: 'gerar', ids: candidatas, novamente })}>{ocupado ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Gerar sugestões com IA</Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Input aria-label="Buscar sugestões" placeholder="Buscar código ou nome" value={busca} onChange={e => setBusca(e.target.value)} />
        <Filtro label="Confiança" value={confianca} onChange={setConfianca} opcoes={[['todas','Todas as confianças'],...Object.entries(confiancas)]} />
        <Filtro label="Origem" value={origem} onChange={setOrigem} opcoes={[["todas","Todas as origens"],["acao","Ata"],["decisao","Decisão"]]} />
        <Filtro label="Comitê" value={comite} onChange={setComite} opcoes={[["todos","Todos os comitês"],...[...new Set(resumo.fontes.map(f => f.comite).filter(Boolean))].map(c => [c,c])]} />
        <Filtro label="Perspectiva" value={perspectiva} onChange={setPerspectiva} opcoes={[["todas","Todas as perspectivas"],...[...new Set(resumo.alvos.map(a => a.perspectiva))].map(p => [p,p])]} />
        <Filtro label="Situação" value={status} onChange={setStatus} opcoes={[["pendente","Pendentes"],["aprovada","Aprovadas"],["rejeitada","Rejeitadas"],["todos","Todas as situações"]]} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><Checkbox aria-label="Selecionar todas" checked={pendentes.length > 0 && selecionadasVisiveis.length === pendentes.length} onCheckedChange={v => setSelecionadas(v === true ? pendentes.map(s => s.id) : [])} disabled={ocupado} />Selecionar todas ({pendentes.length})</label>
        <Button size="sm" disabled={ocupado || !selecionadasVisiveis.length} onClick={() => setConfirmacao({ acao: 'aprovar', ids: selecionadasVisiveis })}><Check className="mr-2 h-4 w-4" />Aprovar selecionadas ({selecionadasVisiveis.length})</Button>
        <span className="text-xs text-muted-foreground">{visiveis.length} sugestões</span>
      </div>
      {!visiveis.length && <p className="py-6 text-sm text-muted-foreground">Nenhuma sugestão nesta seleção.</p>}
      <div className="divide-y">{visiveis.map(s => {
        const f = fonte(s); const a = alvo(s);
        return <article key={s.id} className="flex items-start gap-3 py-4">
          {s.status === 'pendente' && <Checkbox className="mt-1" aria-label={`Selecionar ${f?.codigo ?? s.id} para ${a?.codigo ?? s.ref_id}`} checked={selecionadas.includes(s.id)} onCheckedChange={() => toggle(s.id)} disabled={ocupado} />}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{s.origem_tipo === 'acao' ? 'Ata' : 'Decisão'}</Badge><Badge variant="secondary">Confiança {confiancas[s.confianca]}</Badge><span className="text-xs text-muted-foreground">{f?.comite}</span><Badge variant="outline">{s.status}</Badge></div>
            <p className="break-words text-sm font-medium">{f ? `${f.codigo} · ${f.titulo}` : 'Fonte já vinculada'}</p>
            <p className="break-words text-sm text-primary">→ {a ? `${a.codigo} · ${a.nome}` : 'Item não vigente'} {a && <span className="text-muted-foreground">· {a.perspectiva}</span>}</p>
            <p className="text-sm">{s.justificativa}</p><blockquote className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">“{s.trecho}”</blockquote>
            {s.revisado_em && <p className="text-xs text-muted-foreground">Revisado em {new Date(s.revisado_em).toLocaleString('pt-BR')} · usuário {s.revisado_por}</p>}
            {s.status === 'pendente' && <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={ocupado} onClick={() => { setEditor(s.id); setBuscaAlvo(''); }}>Trocar item</Button>
              <Button size="sm" disabled={ocupado || !a} onClick={() => setConfirmacao({ acao: 'aprovar', ids: [s.id] })}><Check className="mr-1 h-4 w-4" />Aprovar</Button>
              <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => setConfirmacao({ acao: 'rejeitar', ids: [s.id] })}><X className="mr-1 h-4 w-4" />Rejeitar</Button>
            </div>}
          </div>
        </article>;
      })}</div>
      {novos.length > 0 && <details className="border-t pt-3"><summary className="cursor-pointer text-sm font-medium">Itens sem sugestão ({novos.length})</summary><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{novos.map(f => <li key={f.chave}>{f.codigo} · {f.titulo}</li>)}</ul></details>}
    </>}
    <Dialog open={!!editor} onOpenChange={v => !v && setEditor(null)}><DialogContent><DialogHeader><DialogTitle>Trocar item sugerido</DialogTitle></DialogHeader><Input placeholder="Buscar item vigente" aria-label="Buscar item vigente" value={buscaAlvo} onChange={e => setBuscaAlvo(e.target.value)} /><div className="max-h-80 overflow-y-auto space-y-1">{resumo?.alvos.filter(a => `${a.codigo} ${a.nome}`.toLowerCase().includes(buscaAlvo.toLowerCase())).map(a => <Button className="h-auto w-full justify-start whitespace-normal text-left" variant="ghost" key={`${a.tipo}:${a.id}`} onClick={() => { if (editor) setTrocas(t => ({ ...t, [editor]: `${a.tipo}:${a.id}` })); setEditor(null); }}>{a.codigo} · {a.nome}</Button>)}</div></DialogContent></Dialog>
    <Dialog open={!!confirmacao} onOpenChange={v => !v && setConfirmacao(null)}><DialogContent><DialogHeader><DialogTitle>{confirmacao?.acao === 'gerar' ? 'Confirmar geração com Lovable AI' : confirmacao?.acao === 'aprovar' ? 'Confirmar aprovação' : 'Confirmar rejeição'}</DialogTitle></DialogHeader>
      <p className="text-sm">{confirmacao?.acao === 'gerar' ? `${confirmacao.ids.length} itens serão analisados. Uso cobrado nos créditos Lovable AI. Nenhum vínculo será gravado.${confirmacao.novamente ? ' Rejeições anteriores poderão ser sugeridas novamente.' : ''}` : confirmacao?.acao === 'aprovar' ? `${confirmacao.ids.length} vínculos selecionados serão gravados. Os já existentes não serão duplicados. A aprovação terá seu usuário e horário registrados.` : `${confirmacao?.ids.length ?? 0} sugestões serão rejeitadas e não voltarão sem gerar de novo.`}</p>
      <DialogFooter><Button variant="outline" onClick={() => setConfirmacao(null)}>Cancelar</Button><Button onClick={() => void executar()}>Confirmar</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
function Filtro({ label, value, onChange, opcoes }: { label: string; value: string; onChange: (v: string) => void; opcoes: string[][] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{opcoes.map(([v,n]) => <SelectItem key={v} value={v}>{n}</SelectItem>)}</SelectContent></Select>;
}