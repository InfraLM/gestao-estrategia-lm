import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Impedimento, RespostaImpedimento, STATUS_IMPEDIMENTO, StatusImpedimento, devidoImpedimento, respostaCompleta } from '@/lib/impedimentos';

function Linha({ item: r, cadeira, ciclo, editar, governanca, onReload }: { item: Impedimento; cadeira: string; ciclo: string; editar: boolean; governanca: boolean; onReload: () => void }) {
  const [resposta, setResposta] = useState<RespostaImpedimento>(r.resposta_ciclo ?? { plano: r.plano_acao, prazo: r.prazo_plano ?? '', status: r.resposta_status, justificativa: r.justificativa_resposta });
  const [motivo, setMotivo] = useState('');
  const [reabrindo, setReabrindo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [historico, setHistorico] = useState<any[] | null>(null);
  const destinatario = r.atribuido_cadeira_id === cadeira;
  const podeResponder = editar && destinatario && !!r.publicado_ciclo && r.publicado_ciclo < ciclo;
  const podeReabrir = editar && !!r.publicado_em && (r.cadeira_id === cadeira || governanca) && !!r.plano_acao;
  const executar = async (reabrir: boolean) => {
    setBusy(true);
    const { error } = reabrir
      ? await supabase.rpc('rotina_impedimento_reabrir', { _id: r.id, _motivo: motivo })
      : await supabase.rpc('rotina_impedimento_responder', { _id:r.id, _ciclo:ciclo, _plano:resposta.plano, _prazo:resposta.prazo, _status:resposta.status, _justificativa:resposta.justificativa });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(reabrir ? 'Impedimento reaberto' : 'Resposta registrada'); onReload();
  };
  const verHistorico = async () => {
    if (historico) return setHistorico(null);
    const { data, error } = await supabase.from('mt_impedimento_auditoria').select('id,acao,usuario_nome,criado_em').eq('risco_id',r.id).order('criado_em',{ascending:false});
    if (error) return toast.error('Não foi possível consultar o histórico');
    setHistorico(data ?? []);
  };
  return <article id={`impedimento-${r.id}`} className="border-b py-4 space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="font-medium break-words">{r.descricao}</h3><Badge variant="outline">{STATUS_IMPEDIMENTO[r.resposta_status]}</Badge></div>
    <p className="text-xs text-muted-foreground">Impedimento sinalizado por {r.sinalizado_por_nome || r.origem_nome} / {r.origem_nome} (ciclo {(r.publicado_ciclo ?? r.semana_criada).slice(8,10)}/{(r.publicado_ciclo ?? r.semana_criada).slice(5,7)})</p>
    <p className="text-sm">Responsável: <b>{r.destino_nome}</b>{r.prazo_desejado && ` · Prazo desejado: ${r.prazo_desejado.split('-').reverse().join('/')}`}</p>
    {r.impacto && <p className="text-sm">Impacto: {r.impacto}</p>}
    {!r.publicado_em && <Badge variant="secondary">Aguardando envio do ciclo</Badge>}
    {r.publicado_em && destinatario && <p role="status" className="text-sm text-warning">Impedimento recebido · resposta {r.resposta_ciclo ? 'registrada neste ciclo' : 'pendente neste ciclo'}</p>}
    {r.motivo_reabertura && <p className="text-sm">Reabertura: {r.motivo_reabertura}</p>}
    {podeResponder ? <>
      <div className="space-y-1"><Label htmlFor={`plano-${r.id}`}>Plano de ação / iniciativa / resposta *</Label><Textarea id={`plano-${r.id}`} value={resposta.plano} maxLength={4000} onChange={e=>setResposta({...resposta,plano:e.target.value})} /></div>
      <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor={`prazo-${r.id}`}>Prazo do plano *</Label><Input id={`prazo-${r.id}`} type="date" value={resposta.prazo} onChange={e=>setResposta({...resposta,prazo:e.target.value})} /></div>
        <div className="space-y-1"><Label>Status *</Label><Select value={resposta.status} onValueChange={v=>setResposta({...resposta,status:v as StatusImpedimento})}><SelectTrigger aria-label={`Status do impedimento: ${r.descricao}`}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_IMPEDIMENTO).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div></div>
      {resposta.status==='nao_procede' && <div className="space-y-1"><Label htmlFor={`just-${r.id}`}>Justificativa *</Label><Textarea id={`just-${r.id}`} value={resposta.justificativa} onChange={e=>setResposta({...resposta,justificativa:e.target.value})} maxLength={4000}/></div>}
      <Button variant="outline" disabled={busy || !respostaCompleta(resposta)} onClick={()=>executar(false)}>Salvar resposta</Button>
    </> : r.plano_acao && <div className="space-y-1 text-sm"><p>Plano: {r.plano_acao}</p><p>Prazo: {r.prazo_plano?.split('-').reverse().join('/') ?? '—'}</p>{r.justificativa_resposta && <p>Justificativa: {r.justificativa_resposta}</p>}</div>}
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={verHistorico}>Histórico</Button>{podeReabrir && <Button size="sm" variant="outline" onClick={()=>setReabrindo(!reabrindo)}>Reabrir com motivo</Button>}</div>
    {reabrindo && <div className="space-y-2"><Label htmlFor={`reabrir-${r.id}`}>Motivo da reabertura *</Label><Textarea id={`reabrir-${r.id}`} value={motivo} onChange={e=>setMotivo(e.target.value)} maxLength={4000}/><Button disabled={busy || !motivo.trim()} onClick={()=>executar(true)}>Confirmar reabertura</Button></div>}
    {historico && <ul className="text-xs text-muted-foreground space-y-1">{historico.map(h=><li key={h.id}>{h.acao} · {h.usuario_nome || 'Usuário'} · {new Date(h.criado_em).toLocaleString('pt-BR')}</li>)}</ul>}
  </article>;
}

export default function ImpedimentosRecebidos({ itens, cadeira, ciclo, editar, governanca, onReload }: { itens:Impedimento[]; cadeira:string; ciclo:string; editar:boolean; governanca:boolean; onReload:()=>void }) {
  const recebidos=itens.filter(r=>devidoImpedimento(r,cadeira,ciclo));
  const outros=itens.filter(r=>!recebidos.some(x=>x.id===r.id));
  return <section id="bloco-impedimentos" className="space-y-2">
    <h2 className="font-semibold">Impedimentos recebidos e sinalizados</h2>
    {!itens.length && <p className="text-sm text-muted-foreground">Nenhum impedimento atribuído.</p>}
    {recebidos.map(r=><Linha key={`${r.id}-${r.resposta_ciclo?.plano ?? ''}-${r.resposta_status}`} item={r} cadeira={cadeira} ciclo={ciclo} editar={editar} governanca={governanca} onReload={onReload}/>)}
    {outros.length>0 && <details open={outros.some(r=>r.cadeira_id===cadeira && !['resolvido','nao_procede'].includes(r.resposta_status))}><summary className="cursor-pointer text-sm">Sinalizados / encerrados ({outros.length})</summary>{outros.map(r=><Linha key={`${r.id}-${r.resposta_status}`} item={r} cadeira={cadeira} ciclo={ciclo} editar={editar} governanca={governanca} onReload={onReload}/>)}</details>}
  </section>;
}