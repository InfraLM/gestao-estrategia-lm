import { useQuery } from '@tanstack/react-query';
import { db } from './usePreOffsite';
import { Valor } from './Formulario';
import { moeda } from './domain';
export default function BacklogPreOffsite(){const q=useQuery({queryKey:['offsite-backlog'],queryFn:async()=>{const x=await db.from('offsite_backlog').select('*').order('criado_em',{ascending:false});if(x.error)throw x.error;return x.data as any[];}});if(!q.data?.length)return null;return <section className="space-y-4"><h2 className="text-xl font-semibold">Propostas pré-offsite</h2>{q.data.map(p=><details key={p.id} className="rounded-md border p-4"><summary className="font-medium">{p.proposta.Nome} · {moeda(p.proposta['Custo total'])} · {p.status}</summary><div className="mt-4"><Valor value={p.proposta}/></div></details>)}</section>;}
