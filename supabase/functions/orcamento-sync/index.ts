import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { converterResumo, anoAtual, VISOES, type LinhaFpa } from './converter.ts';
// Desde 26/11/2026: lê a API do orçamento do FP&A (Gabriel) em ORC_EXPORT_URL (base .../api/integracao/v1),
// chave ORC_EXPORT_TOKEN no cabeçalho X-Api-Key, rota /resumo-centros-custo nas visões competência e caixa do ano atual.
// Grava em public.orc_fpa_linhas por orc_fpa_importar (só Governança/CEO). O espelho antigo (orc_importar) segue para planilhas.
Deno.serve(async(req)=>{
  const out=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...corsHeaders,'Content-Type':'application/json'}});
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return out({error:'Método inválido'},405);
  const auth=req.headers.get('Authorization');if(!auth?.startsWith('Bearer '))return out({error:'Faça login'},401);
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!key)return out({error:'Configuração ausente'},500);
  const sb=createClient(url,key,{global:{headers:{Authorization:auth}}});
  const {data:u,error}=await sb.auth.getUser();if(error||!u.user)return out({error:'Faça login'},401);
  const {data:gov}=await sb.rpc('proj_gov_ou_ceo',{_uid:u.user.id});if(!gov)return out({error:'Sem permissão'},403);
  let body:any;try{body=await req.json();}catch{return out({error:'Pedido inválido'},400);}
  if(!body||typeof body!=='object'||!['teste','sync'].includes(body.acao))return out({error:'Ação inválida'},400);
  const {data:cfg,error:ce}=await sb.from('orc_integracao_config').select('ativo,desde').eq('id',true).maybeSingle();if(ce)return out({error:'Sem acesso à configuração'},403);
  if(!cfg?.ativo)return out({ok:false,motivo:'desligada'});
  const alvo=Deno.env.get('ORC_EXPORT_URL'),token=Deno.env.get('ORC_EXPORT_TOKEN');if(!alvo||!token)return out({ok:false,motivo:'secret_ausente'});
  try{
    const base=new URL(alvo);if(base.protocol!=='https:')return out({error:'Exportação exige HTTPS'},400);
    const ano=anoAtual();const linhas:LinhaFpa[]=[];
    for(const visao of VISOES){
      const endpoint=new URL(base.href.replace(/\/+$/,'')+'/resumo-centros-custo');endpoint.searchParams.set('ano',String(ano));endpoint.searchParams.set('visao',visao);
      const r=await fetch(endpoint,{headers:{'X-Api-Key':token,'Accept':'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
      if(!r.ok){await r.body?.cancel();throw new Error(`HTTP ${r.status}`);}
      linhas.push(...converterResumo(await r.json(),visao));
    }
    if(body.acao==='teste')return out({ok:true,registros:linhas.length,ano});
    const {data:n,error:ie}=await sb.rpc('orc_fpa_importar',{_linhas:linhas});if(ie)throw new Error('Não foi possível gravar o espelho');
    const {error:ue}=await sb.from('orc_integracao_config').update({atualizado_em:new Date().toISOString(),atualizado_por:u.user.id}).eq('id',true);if(ue)throw new Error('Dados gravados; cursor não atualizado');
    return out({ok:true,registros:n,ano});
  }catch(e){const msg=e instanceof Error&&/^(HTTP \d{3}|Contrato inválido|Linha duplicada no resumo|Centro\/mês duplicado|Não foi possível gravar o espelho|Dados gravados; cursor não atualizado)$/.test(e.message)?e.message:'Falha de conexão ou contrato';await sb.rpc('orc_registrar_falha',{_modo:body.acao,_mensagem:msg,_arquivo:null});return out({ok:false,error:msg},400);}
});