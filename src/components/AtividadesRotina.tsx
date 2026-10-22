import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_IMPEDIMENTO } from '@/lib/impedimentos';
type Atividade={id:string;origem:string;titulo:string;origem_label:string;responsavel:string;quem_sinalizou:string;plano:string;prazo:string|null;status:string;atrasado:boolean;cadeira_id:string;sinalizador_cadeira_id?:string};
export default function AtividadesRotina({ciclo,cadeira}:{ciclo:string;cadeira:string}) {
  const [itens,setItens]=useState<Atividade[]>([]), [status,setStatus]=useState('abertos'), [origem,setOrigem]=useState('todas'), [erro,setErro]=useState('');
  useEffect(()=>{supabase.rpc('rotina_atividades_abertas',{_ciclo:ciclo}).then(({data,error})=>{setErro(error?'Não foi possível carregar as atividades':'');setItens((data??[]) as unknown as Atividade[]);});},[ciclo]);
  const filtrados=itens.filter(r=>(cadeira==='todas'||r.cadeira_id===cadeira||r.sinalizador_cadeira_id===cadeira) && (origem==='todas'||r.origem===origem) && (status==='todos' || (status==='abertos' ? !['resolvido','nao_procede'].includes(r.status) : status==='atrasados' ? r.atrasado : r.status===status))).sort((a,b)=>Number(b.atrasado)-Number(a.atrasado));
  return <section className="space-y-3" aria-label="Atividades e impedimentos abertos"><h2 className="text-lg font-semibold">Atividades e impedimentos abertos</h2>
    <div className="flex flex-wrap gap-2"><Select value={origem} onValueChange={setOrigem}><SelectTrigger className="w-56" aria-label="Origem da atividade"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="todas">Todas as origens</SelectItem><SelectItem value="ata">Ata</SelectItem><SelectItem value="prioridade">Prioridade estratégica</SelectItem><SelectItem value="impedimento">Impedimento</SelectItem></SelectContent></Select>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-56" aria-label="Status da atividade"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="abertos">Em aberto</SelectItem><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="atrasados">Atrasados</SelectItem>{Object.entries(STATUS_IMPEDIMENTO).map(([k,l])=><SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    {!erro&&!filtrados.length&&<p className="text-sm text-muted-foreground">Nenhuma atividade neste filtro.</p>}
    <div className="grid gap-3 md:grid-cols-2">{filtrados.map(r=><article key={`${r.origem}-${r.id}-${r.cadeira_id}`} className={`rounded border p-4 space-y-2 ${r.atrasado?'border-destructive':''}`}><div className="flex flex-wrap gap-2 justify-between"><h3 className="font-medium break-words">{r.titulo}</h3><Badge variant={r.atrasado?'destructive':'outline'}>{r.atrasado?'Atrasado':STATUS_IMPEDIMENTO[r.status as keyof typeof STATUS_IMPEDIMENTO]??r.status}</Badge></div>
      <p className="text-xs text-muted-foreground">{r.origem_label}</p><p className="text-sm">Responsável: {r.responsavel} · Sinalizado por: {r.quem_sinalizou||'—'}</p><p className="text-sm">Plano: {r.plano||'Pendente'} · Prazo: {r.prazo?.split('-').reverse().join('/')||'—'}</p>
      <Button asChild variant="outline" size="sm"><Link to={`/metas/semanal?semana=${ciclo}${r.origem==='impedimento'?`&impedimento=${r.id}`:''}`}>Abrir formulário</Link></Button>
    </article>)}</div>
  </section>;
}