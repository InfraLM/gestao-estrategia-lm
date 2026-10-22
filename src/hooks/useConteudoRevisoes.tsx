import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { DocumentoConteudo, Revisao, RevisaoItem, valoresRevisao } from '@/lib/conteudoRevisoes';

const db = supabase as any;
type Contexto = { documento: DocumentoConteudo; revisao: Revisao | null; valores: Record<string, any>; itens: RevisaoItem[]; leitura: boolean; indisponivel: boolean; loading: boolean; recarregar: () => Promise<void> };
const Context = createContext<Contexto | null>(null);
export const useRevisaoContexto = () => useContext(Context);
export function useRevisoes(documento?: DocumentoConteudo) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const permissoes = useQuery({ queryKey: ['revisao-permissoes', user?.id], enabled: !!user, queryFn: async () => {
    const { data, error } = await db.rpc('revisao_permissoes'); if (error) throw error;
    return data as { governanca: boolean; ceo: boolean };
  } });
  const query = useQuery({ queryKey: ['conteudo-revisoes', user?.id, documento ?? 'todos'], enabled: !!user, queryFn: async () => {
    let q = db.from('conteudo_revisoes').select('*').order('numero', { ascending: false });
    if (documento) q = q.eq('documento', documento);
    const { data, error } = await q; if (error) throw error; return data as Revisao[];
  } });
  const recarregar = async () => { await qc.invalidateQueries({ queryKey: ['conteudo-revisoes'] }); await qc.invalidateQueries({ queryKey: ['conteudo-revisao-itens'] }); };
  return { revisoes: query.data ?? [], governanca: permissoes.data?.governanca ?? false, ceo: permissoes.data?.ceo ?? false, loading: query.isPending || permissoes.isPending, error: query.error ?? permissoes.error, recarregar };
}
export function useRevisaoItens(id?: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['conteudo-revisao-itens', user?.id, id], enabled: !!id && !!user, queryFn: async () => {
    const { data, error } = await db.from('conteudo_revisao_itens').select('*').eq('revisao_id', id).order('secao');
    if (error) throw error; return data as RevisaoItem[];
  } });
}
export function ConteudoRevisaoProvider({ documento, children }: { documento: DocumentoConteudo; children: ReactNode }) {
  const [sp] = useSearchParams();
  const { revisoes, loading, recarregar } = useRevisoes(documento);
  const numero = sp.get('rev');
  const revisao = (numero ? revisoes.find(r => r.numero === Number(numero)) : revisoes.find(r => r.status === 'publicada')) ?? null;
  const query = useRevisaoItens(revisao?.id);
  const itens = query.data ?? [];
  const indisponivel = !!numero && !loading && !revisao;
  return <Context.Provider value={{ documento, revisao, valores: revisao ? valoresRevisao(revisao, itens) : {}, itens, leitura: indisponivel || loading || revisao?.status === 'substituida', indisponivel, loading: loading || (!!revisao && query.isPending), recarregar }}>{children}</Context.Provider>;
}