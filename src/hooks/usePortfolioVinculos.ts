import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VinculoPortfolio } from '@/lib/portfolioVinculos';
import { useAuth } from '@/hooks/useAuth';
export function usePortfolioVinculos() {
 const {user}=useAuth(); const [vinculos,setVinculos]=useState<VinculoPortfolio[]>([]);const [fontes,setFontes]=useState<any[]>([]);const [alvos,setAlvos]=useState<any[]>([]);const [cadeiras,setCadeiras]=useState<any[]>([]);const [podeGerar,setPodeGerar]=useState(false);const [loading,setLoading]=useState(true);const [erro,setErro]=useState('');
 const reload=useCallback(async()=>{
  if(!user){setLoading(false);return;}
  const results=await Promise.all([supabase.from('portfolio_vinculos').select('*'),supabase.from('projetos').select('id,codigo,nome,cadeira_id'),supabase.from('mt_iniciativas').select('id,titulo,cadeira_id'),supabase.from('mt_objetivos').select('id,codigo,descricao'),supabase.from('mt_indicadores').select('id,codigo,nome,origem,okr_id,objetivo_id').eq('status','ativo'),supabase.from('mt_okrs').select('id,semestre'),supabase.from('mt_cadeiras').select('id,nome'),supabase.rpc('proj_gov_ou_ceo',{_uid:user.id})]);
  const fail=results.find(r=>r.error)?.error;setErro(fail?.message??'');
  const [v,p,i,o,ind,okr,c,g]=results;setVinculos((v.data??[]) as VinculoPortfolio[]);
  const fs=[...(p.data??[]).map(x=>({...x,fonte_tipo:'projeto'})),...(i.data??[]).map(x=>({...x,nome:x.titulo,fonte_tipo:'iniciativa'}))];
  const permissions=await Promise.all(fs.map(async f=>{const {data}=await supabase.rpc('portfolio_pode_editar',{_tipo:f.fonte_tipo,_id:f.id});return {...f,podeEditar:data===true};}));setFontes(permissions);
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).formatToParts(new Date());const sem=`${parts.find(p=>p.type==='year')?.value}/${Number(parts.find(p=>p.type==='month')?.value)<=6?1:2}`;
  const vig=new Set((okr.data??[]).filter(o=>o.semestre===sem).map(o=>o.id));
  setAlvos([...(o.data??[]).map(o=>({...o,nome:o.descricao,tipo:'objetivo'})),...(ind.data??[]).filter(i=>i.origem!=='okr'||vig.has(i.okr_id??'')).map(i=>({...i,tipo:'indicador'}))]);setCadeiras(c.data??[]);setPodeGerar(g.data===true);setLoading(false);
 },[user]);
 useEffect(()=>{reload();const fn=()=>reload();window.addEventListener('portfolio-vinculos',fn);return()=>window.removeEventListener('portfolio-vinculos',fn);},[reload]);
 return {vinculos,fontes,alvos,cadeiras,podeGerar,loading,erro,reload};
}
export function atualizarVinculos(){window.dispatchEvent(new Event('portfolio-vinculos'));}
export async function erroFuncao(error:any) {if(error?.context instanceof Response){try{const b=await error.context.json();return b.error??error.message;}catch{}}return error?.message??'Não foi possível concluir.';}
