import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Download, Check, Pencil, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useRevisoes, useRevisaoItens } from '@/hooks/useConteudoRevisoes';
import { DocumentoConteudo, RevisaoItem, RevisaoItemStatus, diffJson, podePublicar } from '@/lib/conteudoRevisoes';
import { exportRevisionCsv } from '@/lib/exportCsv';
const db = supabase as any;
const fmt = (v: string | null) => v ? new Date(v).toLocaleString('pt-BR') : '—';
const statusNomes: Record<string,string> = { pendente:'Pendente', aprovado:'Aprovado', aprovado_ajuste:'Aprovado com ajuste', rejeitado:'Rejeitado',rascunho:'Rascunho',publicada:'Publicada',substituida:'Substituída' };
function Filtro({ label, value, onChange, options }: { label: string; value: string; onChange: (v:string)=>void; options: [string,string][] }) {
 return <div className="space-y-1 min-w-0"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="w-full"><SelectValue /></SelectTrigger><SelectContent>{options.map(([v,t])=><SelectItem key={v} value={v}>{t}</SelectItem>)}</SelectContent></Select></div>;
}
export default function ConteudoRevisoesHistorico({ documentoInicial }: { documentoInicial?: DocumentoConteudo }) {
 const [sp,setSp]=useSearchParams();
 const documento: DocumentoConteudo = sp.get('documento')==='diagnostico'?'diagnostico':sp.get('documento')==='estrategia'?'estrategia':documentoInicial??'estrategia';
 const {revisoes,governanca,loading,error,recarregar}=useRevisoes(documento);
 const revisao=(sp.get('rev')?revisoes.find(r=>r.numero===Number(sp.get('rev'))):revisoes.find(r=>r.status==='rascunho')??revisoes.find(r=>r.status==='publicada'))??null;
 const query=useRevisaoItens(revisao?.id); const itens=query.data??[];
 const [status,setStatus]=useState('todos'),[origem,setOrigem]=useState('todos'),[secao,setSecao]=useState('todos');
 const [ajuste,setAjuste]=useState<{item:RevisaoItem;acao:'aprovado_ajuste'|'rejeitado'}|null>(null);
 const [texto,setTexto]=useState(''),[ocupado,setOcupado]=useState(false),[confirmar,setConfirmar]=useState<'publicar'|'todos'|null>(null);
 const setParam=(key:string,value:string)=>{const n=new URLSearchParams(sp); n.set(key,value); if(key==='documento'){n.delete('rev');n.delete('item');}setSp(n);};
 const visiveis=itens.filter(i=>(status==='todos'||i.status===status)&&(origem==='todos'||i.origem===origem)&&(secao==='todos'||i.secao===secao));
 const editar=governanca&&revisao?.status==='rascunho';
 useEffect(()=>{setSecao('todos');},[documento,revisao?.id]);
 useEffect(()=>{const id=sp.get('item');if(id&&itens.some(i=>i.id===id)){document.getElementById(`revisao-item-${id}`)?.scrollIntoView({block:'center'});}},[sp,itens]);
 const executar=async(fn:()=>Promise<any>,msg:string)=>{setOcupado(true);try {await fn();await recarregar();toast.success(msg);setAjuste(null);setConfirmar(null);}catch(e:any){toast.error(e.message??'Não foi possível concluir');}finally{setOcupado(false);}};
 const decidir=async(item:RevisaoItem,acao:RevisaoItemStatus,final:any=null,motivo:string|null=null)=>{const {error}=await db.rpc('revisao_decidir_item',{_id:item.id,_status:acao,_valor_final:final,_motivo:motivo});if(error)throw error;};
 const salvarAjuste=()=>{if(!ajuste)return;let valor:any=null;if(ajuste.acao==='aprovado_ajuste'){try{valor=JSON.parse(texto);}catch{toast.error('JSON inválido; confira o conteúdo ajustado');return;}}else if(!texto.trim()){toast.error('Motivo da rejeição obrigatório');return;}executar(()=>decidir(ajuste.item,ajuste.acao,valor,ajuste.acao==='rejeitado'?texto:null),'Decisão registrada; publicação continua separada');};
 return <section className="space-y-4 border-t border-border pt-4">
  <h3 className="font-semibold">Revisões</h3>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
   <Filtro label="Documento" value={documento} onChange={v=>setParam('documento',v)} options={[["diagnostico","Diagnóstico"],["estrategia","Formulação da Estratégia"]]} />
   <Filtro label="Revisão" value={String(revisao?.numero??'nenhuma')} onChange={v=>setParam('rev',v)} options={revisoes.length?revisoes.map(r=>[String(r.numero),`Rev.${String(r.numero).padStart(2,'0')} · ${statusNomes[r.status]}`]):[['nenhuma','Nenhuma revisão']]} />
   <Filtro label="Status do item" value={status} onChange={setStatus} options={[['todos','Todos'],...['pendente','aprovado','aprovado_ajuste','rejeitado'].map(s=>[s,statusNomes[s]] as [string,string])]} />
   <Filtro label="Origem" value={origem} onChange={setOrigem} options={[['todos','Todas'],['documento_v2','Documento v2'],['alinhamento_derivado','Alinhamento derivado']]} />
   <Filtro label="Seção" value={secao} onChange={setSecao} options={[['todos','Todas'],...Array.from(new Set(itens.map(i=>i.secao))).map(s=>[s,s] as [string,string])]} />
  </div>
  {(error||query.error)&&<p role="alert" className="text-sm text-destructive">Não foi possível carregar as revisões.</p>}
  {loading?<p className="text-sm text-muted-foreground">Carregando revisões…</p>:<div className="divide-y divide-border">{revisoes.map(r=><div key={r.id} className="flex flex-wrap items-center gap-2 py-3"><Button variant={revisao?.id===r.id?'secondary':'ghost'} className="h-auto whitespace-normal text-left" onClick={()=>setParam('rev',String(r.numero))}>Rev.{String(r.numero).padStart(2,'0')} — {r.titulo}</Button><Badge variant="outline">{statusNomes[r.status]}</Badge><span className="text-xs text-muted-foreground">Criada {fmt(r.criado_em)} · Publicada {fmt(r.publicado_em)}{r.publicado_por_nome?` · ${r.publicado_por_nome}`:''}</span></div>)}</div>}
  {sp.get('rev')&&!revisao&&!loading&&<p role="alert" className="text-sm text-destructive">Revisão indisponível ou sem permissão.</p>}
  {revisao&&<>
   <div className="space-y-2 border-b pb-4"><h4 className="font-semibold">Rev.{String(revisao.numero).padStart(2,'0')} — {revisao.titulo}</h4>{revisao.fonte&&<p className="text-sm text-muted-foreground">Fonte: {revisao.fonte}</p>}{revisao.resumo_mudancas&&<p className="text-sm whitespace-pre-line">{revisao.resumo_mudancas}</p>}
    <div className="flex flex-wrap gap-2 items-center"><Link className="text-sm text-primary underline" to={`/${documento}?rev=${revisao.numero}`}>Abrir esta revisão na página</Link>
     <Button variant="outline" disabled={!itens.length} onClick={()=>exportRevisionCsv(`${documento}_rev${revisao.numero}`,itens.map(i=>({documento,revisao:revisao.numero,titulo:revisao.titulo,fonte:revisao.fonte,...i})))}><Download className="h-4 w-4 mr-2"/>Exportar revisão CSV</Button>
     {editar&&<><Button variant="outline" disabled={ocupado||!itens.some(i=>i.status==='pendente')} onClick={()=>setConfirmar('todos')}><Check className="h-4 w-4 mr-2"/>Aprovar todos os pendentes</Button><Button disabled={ocupado||!podePublicar(itens)} onClick={()=>setConfirmar('publicar')}><Upload className="h-4 w-4 mr-2"/>Publicar revisão</Button></>}
     <span className="text-xs text-muted-foreground">{itens.filter(i=>i.status==='pendente').length} pendentes · {itens.length} itens</span>
    </div>
   </div>
   {query.isPending?<p>Carregando itens…</p>:!itens.length?<p className="text-sm text-muted-foreground">Snapshot integral preservado; nenhuma alteração nesta revisão.</p>:!visiveis.length?<p className="text-sm text-muted-foreground">Nenhum item nos filtros selecionados.</p>:Array.from(new Set(visiveis.map(i=>i.secao))).map(s=><div key={s} className="space-y-3"><h4 className="font-semibold text-sm">{s}</h4>{visiveis.filter(i=>i.secao===s).map(i=>{const diff=diffJson(i.valor_anterior,i.valor_proposto);return <article id={`revisao-item-${i.id}`} key={i.id} className="border border-border rounded-md p-4 space-y-3 scroll-mt-24">
    <div className="flex gap-2 items-center flex-wrap"><code className="text-xs">{i.chave}</code><Badge variant={i.status==='rejeitado'?'destructive':'outline'}>{statusNomes[i.status]}</Badge><Badge variant="secondary">{i.origem==='documento_v2'?'Documento v2':'Alinhamento derivado'}</Badge></div>
    <div className="grid md:grid-cols-2 gap-3"><div className="min-w-0"><h5 className="text-xs font-semibold mb-2">Anterior</h5><pre className="text-xs whitespace-pre-wrap break-words max-h-96 overflow-auto border border-border p-3">{diff.anterior.map((l,n)=><div key={n} className={l.removido?'text-destructive bg-destructive/5':''}>{l.removido?'− ':''}{l.texto}</div>)}</pre></div><div className="min-w-0"><h5 className="text-xs font-semibold mb-2">Proposto</h5><pre className="text-xs whitespace-pre-wrap break-words max-h-96 overflow-auto border border-border p-3">{diff.proposto.map((l,n)=><div key={n} className={l.adicionado?'text-success bg-success/5':''}>{l.adicionado?'+ ':''}{l.texto}</div>)}</pre></div></div>
    {i.valor_final!==null&&<div><h5 className="text-xs font-semibold">Aprovado com ajuste</h5><pre className="text-xs whitespace-pre-wrap break-words max-h-80 overflow-auto">{JSON.stringify(i.valor_final,null,2)}</pre></div>}
    <div className="space-y-1 text-sm"><p><b>Justificativa:</b> {i.justificativa??'—'}</p><p><b>Referências:</b> {i.referencias??'—'}</p>{i.observacao&&<p className="text-warning"><b>Observação:</b> {i.observacao}</p>}{i.motivo_rejeicao&&<p className="text-destructive"><b>Motivo da rejeição:</b> {i.motivo_rejeicao}</p>}</div>
    {i.decidido_em&&<p className="text-xs text-muted-foreground">Decidido por {i.decidido_por_nome??'—'} em {fmt(i.decidido_em)}</p>}
    {editar&&<div className="flex gap-2 flex-wrap"><Button variant="outline" disabled={ocupado} onClick={()=>executar(()=>decidir(i,'aprovado'),'Item aprovado; publicação continua separada')}><Check className="h-4 w-4 mr-1"/>Aprovar</Button><Button variant="outline" disabled={ocupado} onClick={()=>{setTexto(JSON.stringify(i.valor_final??i.valor_proposto,null,2));setAjuste({item:i,acao:'aprovado_ajuste'});}}><Pencil className="h-4 w-4 mr-1"/>Aprovar com ajuste</Button><Button variant="outline" disabled={ocupado} onClick={()=>{setTexto(i.motivo_rejeicao??'');setAjuste({item:i,acao:'rejeitado'});}}><X className="h-4 w-4 mr-1"/>Rejeitar</Button></div>}
   </article>;})}</div>)}
  </>}
  <Dialog open={!!ajuste} onOpenChange={v=>{if(!v&&!ocupado)setAjuste(null);}}><DialogContent className="max-w-3xl max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>{ajuste?.acao==='rejeitado'?'Rejeitar item':'Aprovar com ajuste'} — {ajuste?.item.secao}</DialogTitle></DialogHeader><Label htmlFor="revisao-ajuste">{ajuste?.acao==='rejeitado'?'Motivo obrigatório':'Conteúdo final (JSON)'}</Label><Textarea id="revisao-ajuste" value={texto} onChange={e=>setTexto(e.target.value)} className={ajuste?.acao==='rejeitado'?'min-h-32':'min-h-96 font-mono text-xs'}/><DialogFooter><Button variant="outline" disabled={ocupado} onClick={()=>setAjuste(null)}>Cancelar</Button><Button disabled={ocupado||!texto.trim()} onClick={salvarAjuste}>Registrar decisão</Button></DialogFooter></DialogContent></Dialog>
  <AlertDialog open={!!confirmar} onOpenChange={v=>{if(!v&&!ocupado)setConfirmar(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmar==='publicar'?'Publicar revisão?':'Aprovar todos os pendentes?'}</AlertDialogTitle><AlertDialogDescription>{confirmar==='publicar'?'O conteúdo aprovado entra em vigor. Os itens rejeitados mantêm o valor anterior, e a revisão vigente passa ao histórico.':'Esta ação aprova todos os itens pendentes desta revisão, inclusive fora dos filtros. Nada entra em vigor antes da publicação.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={ocupado}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={ocupado} onClick={e=>{e.preventDefault();if(!revisao)return;executar(async()=>{const {error}=await db.rpc(confirmar==='publicar'?'revisao_publicar':'revisao_aprovar_pendentes',{_revisao_id:revisao.id});if(error)throw error;},confirmar==='publicar'?'Revisão publicada':'Pendentes aprovados; publicação continua separada');}}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </section>;
}
