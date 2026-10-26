import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PADRAO, type Config } from './config';
export const db=supabase as any;
export type Resposta={id:string;user_id:string;cadeira_id:string;nome:string;respostas:Record<string,any>;status:string;revisao:number;enviado_em:string|null;atualizado_em:string};
export function usePreOffsite(){
 const {user}=useAuth();return useQuery({queryKey:['pre-offsite',user?.id],enabled:!!user,queryFn:async()=>{
 const a=await db.rpc('offsite_acesso');if(a.error)throw a.error;if(!a.data?.permitido)throw new Error('Este formulário é exclusivo para diretores com cadeira vinculada, Naira e Ian.');
 const [c,r,m,refs,p]=await Promise.all([db.from('offsite_config').select('*').eq('id','2027').single(),db.from('offsite_respostas').select('*').order('nome'),db.from('offsite_materiais').select('*').order('titulo'),db.rpc('offsite_referencias'),db.from('offsite_participantes').select('nome,cadeira_id').eq('ativo',true).order('nome')]);
 for(const x of[c,r,m,refs,p])if(x.error)throw x.error;
 const respondentes=p.data.map((participante:{nome:string;cadeira_id:string})=>({...refs.data.cadeiras.find((ch:{id:string})=>ch.id===participante.cadeira_id),id:participante.cadeira_id,diretor_nome:participante.nome}));
 return{userId:user?.id,acesso:a.data as{admin:boolean;cadeira_id:string|null},config:{...PADRAO,...c.data.conteudo} as Config,prazo:c.data.prazo as string,respostas:r.data as Resposta[],materiais:m.data as any[],refs:{...refs.data,respondentes} as{cadeiras:any[];respondentes:any[];objetivos:any[];kpis:any[];processos:any[]}};
 }});
}
