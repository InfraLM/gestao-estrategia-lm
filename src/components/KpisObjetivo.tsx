import { useState } from 'react';
import { useKpisObjetivo } from '@/hooks/useKpisObjetivo';
import { AVALIACAO_LBL } from '@/lib/avaliacaoBsc';
import { pctFinanceiro } from '@/components/FinanceiroObjetivo';
import { useImpactoFinanceiro } from '@/hooks/useImpactoFinanceiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export default function KpisObjetivo({codigo}:{codigo:string}){
  const k=useKpisObjetivo();const d=useImpactoFinanceiro();const itens=k.porObjetivo(codigo);
  const [editar,setEditar]=useState<string|null>(null);const [meta,setMeta]=useState('');const [busy,setBusy]=useState(false);
  const salvar=async()=>{if(!editar)return;setBusy(true);const {error}=await (supabase as any).rpc('orc_meta_salvar',{_id:editar,_meta:meta});setBusy(false);if(error)return toast.error(error.message);setEditar(null);window.dispatchEvent(new Event('orc-atualizado'));toast.success('Meta 2030 salva.');};
  return <section className="space-y-3"><h3 className="font-semibold text-sm">KPIs estratégicos e táticos</h3>{k.error&&<p className="text-destructive text-xs">{k.error}</p>}{k.loading?<p>Carregando…</p>:<div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr className="border-b"><th className="py-2 pr-3">KPI / nível</th><th className="pr-3">Meta vigente</th><th className="pr-3">Meta 2030</th><th className="pr-3">Atual / data</th><th className="pr-3">Atingimento vigente / 2030</th><th>Situação</th></tr></thead><tbody>{itens.map((i:any)=><tr key={i.id} className="border-b align-top"><td className="py-3 pr-3 min-w-44">{i.codigo} · {i.nome}<p className="text-muted-foreground">{i.nivel??'Tático'}</p></td><td className="py-3 pr-3">{i.meta??'Sem meta vigente'}</td><td className="py-3 pr-3">{editar===i.id?<div className="flex flex-wrap gap-2"><Input aria-label="Meta 2030" value={meta} onChange={e=>setMeta(e.target.value)}/><Button size="sm" disabled={busy} onClick={salvar}>Salvar</Button><Button variant="ghost" size="sm" onClick={()=>setEditar(null)}>Cancelar</Button></div>:<>{i.meta2030??'Sem meta 2030'}{d.gestor&&<Button variant="link" size="sm" onClick={()=>{setEditar(i.id);setMeta(i.meta2030??'');}}>Editar</Button>}</>}</td><td className="py-3 pr-3">{i.atual}<p className="text-muted-foreground">{i.comp??'Sem competência confirmada'}{i.data&&` · ${new Date(i.data).toLocaleDateString('pt-BR')}`}</p><p className="text-muted-foreground">{i.fonte}</p></td><td className="py-3 pr-3">{pctFinanceiro(i.atingimento)} / {pctFinanceiro(i.ating2030)}</td><td className="py-3"><Badge variant={i.aval==='off'?'destructive':i.aval==='on'?'default':'outline'}>{AVALIACAO_LBL[i.aval as keyof typeof AVALIACAO_LBL]}</Badge></td></tr>)}</tbody></table></div>}
    {itens.some((i:any)=>!i.meta2030)&&<details><summary className="text-sm cursor-pointer">KPIs sem meta 2030 ({itens.filter((i:any)=>!i.meta2030).length})</summary><ul className="text-xs space-y-1 pt-2">{itens.filter((i:any)=>!i.meta2030).map((i:any)=><li key={i.id}>{i.codigo} · {i.nome}</li>)}</ul></details>}
  </section>;
}