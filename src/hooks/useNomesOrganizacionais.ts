import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
type Fonte = { fonte: string; id: string; campo: string };
type Nome = Fonte & { nome: string; pessoa_id: string | null; cadeira_id: string | null };
export function useNomesOrganizacionais(fontes: Fonte[]) {
  const { user } = useAuth();
  const chave = JSON.stringify(fontes);
  const query = useQuery({ queryKey: ['nomes-organizacionais', user?.id, chave], enabled: !!user && fontes.length > 0, staleTime: 15000,
    queryFn: async () => { const respostas = await Promise.all(Array.from({ length: Math.ceil(fontes.length / 500) }, (_, i) => supabase.rpc('org_nomes_aprovados', { _fontes: fontes.slice(i * 500, (i + 1) * 500) }))); const erro = respostas.find(r => r.error)?.error; if (erro) throw erro; return respostas.flatMap(r => (r.data ?? []) as unknown as Nome[]); } });
  const mapa = useMemo(() => new Map((query.data ?? []).map(n => [`${n.fonte}:${n.id}:${n.campo}`, n])), [query.data]);
  return { ...query, resolver: (fonte: string, id: string, campo: string, texto?: string | null) => mapa.get(`${fonte}:${id}:${campo}`)?.nome ?? texto ?? '', vinculo: (fonte: string, id: string, campo: string) => mapa.get(`${fonte}:${id}:${campo}`) };
}