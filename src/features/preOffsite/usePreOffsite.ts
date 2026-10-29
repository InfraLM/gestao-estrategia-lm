import rev02 from '@/data/bscRev02.json';
import {converterRespostasV312, type KpiOffsite} from './bloco0';
import { prepararConfig, converterRespostas4A } from './editorConfig';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PADRAO, type Config } from './config';
export const db=supabase as any;
export type Resposta={id:string;user_id:string;cadeira_id:string;nome:string;respostas:Record<string,any>;status:string;revisao:number;enviado_em:string|null;atualizado_em:string};
export function usePreOffsite(){
 const {user}=useAuth();return useQuery({queryKey:['pre-offsite',user?.id,typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('previa')==='rascunho'],enabled:!!user,queryFn:async()=>{
 const a=await db.rpc('offsite_acesso');if(a.error)throw a.error;if(!a.data?.permitido)throw new Error('Este formulário é exclusivo para diretores com cadeira vinculada, Naira e Ian.');
 const [c,r,m,refs,p,k]=await Promise.all([db.from('offsite_config').select('*').eq('id','2027').single(),db.from('offsite_respostas').select('*').order('nome'),db.from('offsite_materiais').select('*').order('titulo'),db.rpc('offsite_referencias'),db.from('offsite_participantes').select('nome,cadeira_id').eq('ativo',true).order('nome'),db.rpc('offsite_indicadores')]);
 for(const x of[c,r,m,refs,p,k])if(x.error)throw x.error;
 const pedePrevia=a.data?.admin&&new URLSearchParams(window.location.search).get('previa')==='rascunho';const rasc=pedePrevia?await db.from('offsite_config_rascunhos').select('conteudo').eq('id','2027').maybeSingle():null;const previa=!!rasc?.data;const configBruta={...PADRAO,...c.data.conteudo} as Config;
 const respondentes=p.data.map((participante:{nome:string;cadeira_id:string})=>({...refs.data.cadeiras.find((ch:{id:string})=>ch.id===participante.cadeira_id),id:participante.cadeira_id,diretor_nome:participante.nome}));
 return{userId:user?.id,acesso:a.data as{admin:boolean;cadeira_id:string|null},config:prepararConfig(previa?{...PADRAO,...rasc.data.conteudo} as Config:configBruta),configBruta,configAtualizadaEm:c.data.atualizado_em as string,previa,prazo:c.data.prazo as string,respostas:(r.data as Resposta[]).map(x=>({...x,respostas:converterRespostas4A(converterRespostasV312(x.respostas??{}))})),materiais:m.data as any[],refs:{...refs.data,respondentes,indicadores:(k.data as KpiOffsite[]).map(k=>{const base=rev02.flatMap(o=>o.kpis).find(x=>[k.nome,(k as any).nome_anterior].some(n=>n&&x.kpi.trim()===String(n).trim()));return {...k,situacao_atual:k.situacao_atual??base?.situacaoAtual??null,meta_2026:k.meta_2026??base?.meta2026??null};})} as{cadeiras:any[];respondentes:any[];objetivos:any[];kpis:any[];kpis_arquivados?:any[];processos:any[];indicadores:KpiOffsite[]}};
 }});
}
