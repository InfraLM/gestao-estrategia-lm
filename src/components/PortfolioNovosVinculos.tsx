import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { atualizarVinculos, erroFuncao } from '@/hooks/usePortfolioVinculos';
import { toast } from 'sonner';
/** Trigger-created jobs capture all cadastro/RPC/import creation paths without reading private source content in the browser. */
export default function PortfolioNovosVinculos() {
 const {user}=useAuth();
 useEffect(()=>{
  if(!user)return;let stopped=false,running=false;const tentados=new Set<string>();
  const run=async()=>{if(running||stopped)return;running=true;
   try {const {data}=await supabase.from('portfolio_vinculacao_jobs').select('id,fonte_tipo,fonte_id').eq('criado_por',user.id).eq('status','pendente').order('created_at').limit(20);
    for(const j of data??[]){if(stopped||tentados.has(j.id))continue;tentados.add(j.id);const {data:r,error}=await supabase.functions.invoke('portfolio-vincular',{body:{modo:'novo',item:{fonte_tipo:j.fonte_tipo,id:j.fonte_id}}});
     if(error||r?.error){toast.error(r?.error??await erroFuncao(error));break;}atualizarVinculos();}
   }finally{running=false;}
  };
  // Fila de vínculos: confere a cada 30 s só com a aba visível (antes: a cada 10 s, sempre), e logo ao voltar à aba.
  const tick=()=>{if(document.visibilityState==='visible')run();};
  const aoVoltar=()=>{if(document.visibilityState==='visible')run();};
  run();const timer=window.setInterval(tick,30000);document.addEventListener('visibilitychange',aoVoltar);
  return()=>{stopped=true;window.clearInterval(timer);document.removeEventListener('visibilitychange',aoVoltar);};
 },[user]);return null;
}
