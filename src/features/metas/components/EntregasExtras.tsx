import { useEffect, useRef, useState } from 'react';
import { FormField } from '@/components/FormField';
import { exclusiveAction } from '@/lib/exclusiveAction';
import { supabase } from '@/integrations/supabase/client';
import { EntregaExtra, MotivoExtra, normalizarExtras, resumoExtras } from '@/lib/entregasExtras';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
const db = supabase as any;

export function ExtrasLeitura({ conteudo, historico = false }: { conteudo: any; historico?: boolean }) {
  return <div className="space-y-2 text-sm break-words">
    {normalizarExtras(conteudo?.extras_lista).map((e, i) => <p key={e.id || i}><b>{e.descricao}</b> · {e.motivo_nome}{e.detalhe && ` — ${e.detalhe}`}</p>)}
    {typeof conteudo?.extras === 'string' && conteudo.extras.trim() && <div><p className="text-xs text-muted-foreground">Registro anterior (texto livre)</p><p className="whitespace-pre-wrap">{conteudo.extras}</p></div>}
    {historico && conteudo?.aprendizados && <p><b>Aprendizados (histórico):</b> {conteudo.aprendizados}</p>}
    {historico && conteudo?.proxima && <p><b>Foco da próxima semana (histórico):</b> {conteudo.proxima}</p>}
  </div>;
}

export default function EntregasExtras({ lista, onChange, disabled, legado, governanca }: { lista: EntregaExtra[]; onChange: (x: EntregaExtra[]) => void; disabled: boolean; legado: any; governanca: boolean }) {
  const [motivos, setMotivos] = useState<MotivoExtra[]>([]);
  const [erro, setErro] = useState(''); const [ocupado, setOcupado] = useState(false);
  const [novo, setNovo] = useState('');
  const runOnce = useRef(exclusiveAction());
  const carregar = async () => { const { data, error } = await db.from('mt_extra_motivos').select('*').order('ordem'); setErro(error ? 'Não foi possível carregar os motivos.' : ''); if (!error) setMotivos(data ?? []); };
  useEffect(() => { carregar(); }, []);
  const salvar = (m: MotivoExtra) => runOnce.current(async () => { setOcupado(true); try { const { error } = await db.from('mt_extra_motivos').update({ nome: m.nome.trim(), ativo: m.ativo }).eq('id', m.id); if (error) throw error; toast.success('Motivo salvo.'); carregar(); } catch (e: any) { toast.error(e?.message ?? 'Não foi possível salvar'); } finally { setOcupado(false); } });
  const adicionar = () => runOnce.current(async () => { if (!novo.trim()) return; setOcupado(true); try { const { error } = await db.from('mt_extra_motivos').insert({ nome: novo.trim(), ordem: motivos.length + 1 }); if (error) throw error; setNovo(''); carregar(); } catch (e: any) { toast.error(e?.message ?? 'Não foi possível adicionar'); } finally { setOcupado(false); } });
  return <div className="space-y-3">
    <h2 className="font-semibold">Entregas fora do planejado</h2>
    {erro && <p className="text-destructive text-sm">{erro}<Button variant="link" onClick={carregar}>Tentar novamente</Button></p>}
    {lista.map((e, i) => {
      const atualizar = (x: Partial<EntregaExtra>) => onChange(lista.map((l, n) => n === i ? { ...l, ...x } : l));
      const opcoes = motivos.filter(m => m.ativo || m.id === e.motivo_id);
      return <div key={e.id} className="grid gap-2 border-b pb-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="space-y-1"><Label htmlFor={`extra-${i}-descricao`}>Descrição curta</Label><Input id={`extra-${i}-descricao`} maxLength={500} disabled={disabled} value={e.descricao} onChange={ev => atualizar({ descricao: ev.target.value })} /></div>
        <div className="space-y-1 min-w-0"><Label htmlFor={`extra-${i}-motivo`}>Motivo</Label><Select disabled={disabled} value={e.motivo_id || undefined} onValueChange={id => { const m = motivos.find(x => x.id === id); if (m) atualizar({ motivo_id: id, motivo_nome: m.nome, exige_detalhe: m.exige_detalhe, detalhe: '' }); }}><SelectTrigger id={`extra-${i}-motivo`} className="h-auto min-h-10 text-left [&>span]:whitespace-normal"><SelectValue placeholder="Selecione o motivo" /></SelectTrigger><SelectContent>{opcoes.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}{!m.ativo && ' (desativado)'}</SelectItem>)}{e.motivo_id && !opcoes.some(m => m.id === e.motivo_id) && <SelectItem value={e.motivo_id}>{e.motivo_nome}</SelectItem>}</SelectContent></Select></div>
        {!disabled && <Button className="self-end" variant="ghost" size="icon" aria-label={`Remover entrega ${i + 1}`} onClick={() => onChange(lista.filter((_, n) => n !== i))}><Trash2 className="h-4 w-4" /></Button>}
        {e.exige_detalhe && <FormField id={`extra-${i}-detalhe`} className="md:col-span-3" label="Especificar Outros" required><Input required disabled={disabled} value={e.detalhe} onChange={ev => atualizar({ detalhe: ev.target.value })} /></FormField>}
      </div>;
    })}
    {!disabled && <Button variant="outline" disabled={!motivos.length} onClick={() => onChange([...lista, { id: crypto.randomUUID(), descricao: '', motivo_id: '', motivo_nome: '', exige_detalhe: false, detalhe: '' }])}><Plus className="h-4 w-4 mr-2" />Adicionar entrega</Button>}
    <ExtrasLeitura conteudo={{ ...legado, extras_lista: [] }} historico />
    {governanca && <details><summary className="cursor-pointer text-sm font-medium">Cadastro de motivos</summary><div className="space-y-3 pt-3">
      {motivos.map(m => <div key={m.id} className="flex flex-wrap gap-2 items-center"><Input aria-label={`Nome do motivo ${m.ordem}`} className="flex-1 min-w-0" value={m.nome} onChange={e => setMotivos(motivos.map(x => x.id === m.id ? { ...x, nome: e.target.value } : x))} /><Label className="flex items-center gap-1"><Checkbox checked={m.ativo} onCheckedChange={v => setMotivos(motivos.map(x => x.id === m.id ? { ...x, ativo: !!v } : x))} />Ativo</Label><Button variant="outline" disabled={ocupado || !m.nome.trim()} onClick={() => salvar(m)}>Salvar</Button></div>)}
      <div className="flex gap-2"><Input placeholder="Novo motivo" aria-label="Novo motivo" value={novo} onChange={e => setNovo(e.target.value)} /><Button disabled={ocupado || !novo.trim()} onClick={adicionar}><Plus className="h-4 w-4 mr-1" />Motivo</Button></div>
    </div></details>}
  </div>;
}

export function ResumoExtras({ mes, cadeiras }: { mes: string; cadeiras: { id: string; nome: string }[] }) {
  const [rows, setRows] = useState<any[]>([]); const [erro, setErro] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { let ativo = true; setLoading(true); const inicio = new Date(`${mes}-01T12:00:00Z`); inicio.setUTCDate(inicio.getUTCDate() - 6); const fim = new Date(`${mes}-01T12:00:00Z`); fim.setUTCMonth(fim.getUTCMonth() + 1);
    db.from('mt_checkins').select('cadeira_id,semana,tipo,status,conteudo').eq('tipo','checkout').eq('status','enviado').gte('semana',inicio.toISOString().slice(0,10)).lt('semana',fim.toISOString().slice(0,10)).then(({ data, error }: any) => { if (ativo) { setRows(data ?? []); setErro(error ? 'Não foi possível carregar o resumo.' : ''); setLoading(false); } }); return () => { ativo = false; };
  }, [mes]);
  const resumo = resumoExtras(rows, mes);
  return <section className="space-y-3"><h2 className="font-semibold">Entregas fora do planejado · {mes.slice(5)}/{mes.slice(0,4)}</h2>{loading ? <p>Carregando…</p> : erro ? <p className="text-destructive">{erro}</p> : resumo.length ? <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="py-2">Cadeira</th><th>Motivo</th><th>Entregas</th></tr></thead><tbody>{resumo.map((r,i) => <tr key={i} className="border-b"><td className="py-2 pr-3">{cadeiras.find(c => c.id === r.cadeira)?.nome ?? '—'}</td><td className="pr-3">{r.motivo}</td><td>{r.quantidade}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">Nenhuma entrega estruturada enviada no mês.</p>}</section>;
}