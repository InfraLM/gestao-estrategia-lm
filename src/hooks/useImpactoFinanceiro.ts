import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
const db = supabase as any;
export function useImpactoFinanceiro() {
  const { user } = useAuth();
  const [d, setD] = useState<any>({ loading: true, pode: false, gestor: false, gov: false, projetos: [], vinculos: [], indicadores: [], budgets: [], centros: [], espelho: [], objetivos: [], error: '' });
  const load = async () => {
    if (!user) { setD((x: any) => ({ ...x, loading: false, pode: false })); return; }
    const [perm, gestor, gov] = await Promise.all([db.rpc('orc_pode_ler'), db.rpc('proj_gov_ou_ceo', { _uid: user.id }), db.rpc('mt_is_governanca', { _uid: user.id })]);
    const [p,v,i,b,c,e,o] = await Promise.all([
      db.from('projetos').select('id,codigo,nome,status,cadeira_id'), db.from('portfolio_vinculos').select('id,fonte_id,fonte_tipo,tipo,ref_id,impacto,status').eq('fonte_tipo','projeto').neq('status','removido'),
      db.from('mt_indicadores').select('*').eq('status','ativo').is('parent_id',null),
      perm.data ? db.from('orc_projeto_budget').select('*') : Promise.resolve({data:[]}), perm.data ? db.from('orc_projeto_centros').select('*').neq('status','removido') : Promise.resolve({data:[]}), perm.data ? db.from('orc_realizado_espelho').select('*') : Promise.resolve({data:[]}), db.from('mt_objetivos').select('id,codigo'),
    ]);
    setD({ loading: false, pode: !!perm.data, gestor: !!gestor.data, gov: !!gov.data, projetos: p.data ?? [], vinculos: v.data ?? [], indicadores: i.data ?? [], budgets: b.data ?? [], centros: c.data ?? [], espelho: e.data ?? [], objetivos: o.data ?? [], error: [perm,p,v,i,b,c,e,o].some(x=>x.error) ? 'Não foi possível carregar todos os dados.' : '' });
  };
  useEffect(() => { load(); const cb = () => load(); window.addEventListener('orc-atualizado',cb); window.addEventListener('portfolio-vinculos',cb); return () => { window.removeEventListener('orc-atualizado',cb); window.removeEventListener('portfolio-vinculos',cb); }; },[user?.id]);
  return {...d, reload: load};
}