import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useImpactoFinanceiro } from '@/hooks/useImpactoFinanceiro';
import { dinheiro, financeiroObjetivo, principalProjeto, realizadoProjeto, valorEscalar } from '@/lib/impactoFinanceiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
const db = supabase as any;
export const pctFinanceiro = (n: number | null) => n == null ? '—' : `${n.toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;
export function ResumoFinanceiroObjetivo({ codigo, dados }: { codigo: string; dados: ReturnType<typeof useImpactoFinanceiro> }) {
  const d = dados; if (!d.pode) return null;
  if (d.loading) return <p className="text-xs text-muted-foreground">Carregando financeiro…</p>;
  if (d.error) return <p className="text-destructive text-xs">{d.error}</p>;
  const obj = d.objetivos.find((o:any)=>o.codigo===codigo);
  const r = financeiroObjetivo(obj?.id ?? '',d.projetos,d.vinculos,d.indicadores,d.budgets,d.centros,d.espelho,new Date().toISOString().slice(0,7));
  return <div className="grid gap-2 sm:grid-cols-3 text-xs mt-2">
    <div><p className="text-muted-foreground">Budget liberado</p><b>{dinheiro(r.budget)}</b>{r.budget != null && <p>Validado {dinheiro(r.validado)} · a validar {dinheiro(r.proposto)}</p>}{r.semBudget>0 && <p className="text-muted-foreground">{r.semBudget} sem budget informado</p>}</div>
    <div><p className="text-muted-foreground">Realizado acumulado até {new Date().toISOString().slice(0,7)}</p><b>{r.realizado == null ? 'Sem realizado informado' : dinheiro(r.realizado)}</b>{r.semRealizado>0 && <p className="text-muted-foreground">{r.semRealizado} sem realizado</p>}</div>
    <div><p className="text-muted-foreground">Execução do budget</p><b>{pctFinanceiro(r.pct)}</b>{(r.semBudget>0 || r.semRealizado>0) && r.pct != null && <p className="text-warning">Parcial · há dados ausentes</p>}</div>
  </div>;
}
export default function FinanceiroObjetivo({ codigo }: { codigo: string }) {
  const d = useImpactoFinanceiro(); if (!d.pode) return null;
  const obj = d.objetivos.find((o:any)=>o.codigo===codigo);
  const refs = new Set([obj?.id,...d.indicadores.filter((i:any)=>i.objetivo_id===obj?.id).map((i:any)=>i.id)]);
  const pids = new Set(d.vinculos.filter((v:any)=>refs.has(v.ref_id)).map((v:any)=>v.fonte_id));
  return <section className="space-y-3"><h3 className="font-semibold text-sm">Financeiro dos projetos e melhorias</h3><ResumoFinanceiroObjetivo codigo={codigo} dados={d} />
    <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr className="border-b"><th className="py-2 pr-3">Projeto</th><th className="pr-3">Budget liberado</th><th className="pr-3">Realizado / execução</th><th className="pr-3">Centro de custo</th><th>Status</th></tr></thead><tbody>
      {d.projetos.filter((p:any)=>pids.has(p.id)).map((p:any)=>{
        const b = d.budgets.find((b:any)=>b.projeto_id===p.id); const r = realizadoProjeto(p.id,d.centros,d.espelho,new Date().toISOString().slice(0,7)); const principal = principalProjeto(p.id,d.vinculos,d.indicadores);
        return <tr key={p.id} className="border-b align-top"><td className="py-3 pr-3 min-w-48"><Link className="text-primary underline" to={`/gestao/${p.codigo}`}>{p.codigo} · {p.nome}</Link><p className="text-muted-foreground mt-1">{principal.objetivo===obj?.id ? `Principal · ${principal.validado?'validado':'a validar'}` : 'Secundário · valores não somam neste objetivo'}</p></td><td className="py-3 pr-3">{dinheiro(b?.budget_liberado==null?null:Number(b.budget_liberado))}{b?.fonte && <p className="text-muted-foreground">{b.fonte}</p>}</td><td className="py-3 pr-3">{r.valor==null?'Sem realizado informado':dinheiro(r.valor)}<p>{pctFinanceiro(b?.budget_liberado>0&&r.valor!=null?r.valor/Number(b.budget_liberado)*100:null)}</p>{r.ultima && <p className="text-muted-foreground">Até {r.ultima}</p>}{r.faltantes>0&&<p className="text-warning">{r.faltantes} centro(s) sem realizado</p>}</td><td className="py-3 pr-3">{d.centros.filter((c:any)=>c.projeto_id===p.id).map((c:any)=><p key={c.id}>{c.centro_custo} · {c.status==='confirmado'?'confirmado':'a confirmar'}</p>)}{!d.centros.some((c:any)=>c.projeto_id===p.id)&&'Sem centro informado'}</td><td className="py-3">{p.status}<CentrosProjetosDados codigo={p.codigo} compacto dados={d} /></td></tr>;
      })}
    </tbody></table></div>
  </section>;
}
export function CentrosProjeto({ codigo, compacto=false }: { codigo: string; compacto?: boolean }) {
  const d = useImpactoFinanceiro();
  return <CentrosProjetosDados codigo={codigo} compacto={compacto} dados={d}/>;
}
function CentrosProjetosDados({ codigo, compacto=false, dados: d }: { codigo: string; compacto?: boolean; dados: ReturnType<typeof useImpactoFinanceiro> }) {
  const p = d.projetos.find((p:any)=>p.codigo===codigo);
  const [edita,setEdita]=useState(false); const [aberto,setAberto]=useState(!compacto); const [centro,setCentro]=useState(''); const [valor,setValor]=useState(''); const [fonte,setFonte]=useState(''); const [busy,setBusy]=useState(false);
  const b = d.budgets.find((x:any)=>x.projeto_id===p?.id);
  useEffect(()=>{if(!p)return; db.rpc('portfolio_pode_editar',{_tipo:'projeto',_id:p.id}).then(({data}:any)=>setEdita(!!data));},[p?.id]);
  useEffect(()=>{setValor(b?.budget_liberado==null?'':String(b.budget_liberado));setFonte(b?.fonte??'');},[b?.budget_liberado,b?.fonte]);
  if (!d.pode || !p) return null;
  const salvar = async (cc:string,acao:string) => {setBusy(true);const {error}=await db.rpc('orc_centro_salvar',{_projeto:p.id,_centro:cc,_acao:acao});setBusy(false);if(error)return toast.error(error.message.includes('orc_centro_unico')?'Este centro já está confirmado para outro projeto.':error.message);setCentro('');window.dispatchEvent(new Event('orc-atualizado'));toast.success('Correspondência salva.');};
  const budget=async()=>{setBusy(true);const {error}=await db.rpc('orc_budget_salvar',{_projeto:p.id,_valor:valor===''?null:valorEscalar(valor),_fonte:fonte});setBusy(false);if(error)return toast.error(error.message);window.dispatchEvent(new Event('orc-atualizado'));toast.success('Budget registrado.');};
  return <div className="space-y-2 mt-2">{compacto&&edita&&<Button variant="outline" size="sm" onClick={()=>setAberto(!aberto)}>Centros / budget</Button>}{aberto&&<div className="space-y-3 text-sm">
    {!compacto&&<h3 className="font-semibold">Budget liberado e centros de custo</h3>}
    {d.centros.filter((c:any)=>c.projeto_id===p.id).map((c:any)=><div key={c.id} className="flex flex-wrap gap-2 items-center"><span>{c.centro_custo}</span><Badge variant={c.status==='confirmado'?'default':'outline'}>{c.status==='confirmado'?'Confirmado':'A confirmar'}</Badge>{d.gov&&c.status!=='confirmado'&&<Button disabled={busy} size="sm" variant="outline" onClick={()=>salvar(c.centro_custo,'confirmar')}>Confirmar</Button>}{edita&&<Button disabled={busy} variant="ghost" size="icon" aria-label={`Remover centro ${c.centro_custo}`} onClick={()=>salvar(c.centro_custo,'remover')}><Trash2 className="h-4 w-4"/></Button>}</div>)}
    {edita&&<div className="flex flex-wrap gap-2"><Input className="flex-1 min-w-40" aria-label="Centro de custo" placeholder="Centro de custo" value={centro} onChange={e=>setCentro(e.target.value)}/><Button size="sm" disabled={busy||!centro.trim()} onClick={()=>salvar(centro,'propor')}><Plus className="h-4 w-4 mr-1"/>Adicionar centro</Button></div>}
    {d.gestor&&<div className="grid gap-2"><Label htmlFor={`budget-${p.id}`}>Budget liberado/aprovado (R$)</Label><Input id={`budget-${p.id}`} inputMode="decimal" placeholder="0,00" value={valor} onChange={e=>setValor(e.target.value)} onBlur={()=>{const n=valorEscalar(valor);if(n!=null)setValor(n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));}}/><Label htmlFor={`budget-fonte-${p.id}`}>Fonte da aprovação (BC / decisão SR / documento)</Label><Input id={`budget-fonte-${p.id}`} value={fonte} onChange={e=>setFonte(e.target.value)}/><Button disabled={busy||valor!==''&&(valorEscalar(valor)==null||(valorEscalar(valor)??0)<0||!fonte.trim())} size="sm" variant="outline" onClick={budget}>Salvar budget liberado</Button></div>}
  </div>}</div>;
}