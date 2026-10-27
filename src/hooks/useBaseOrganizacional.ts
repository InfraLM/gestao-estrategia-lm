import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DIRETORIO_VAZIO, type DiretorioOrg } from '@/lib/baseOrganizacional';

export function useBaseOrganizacional() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['base-organizacional', user?.id], enabled: !!user, staleTime: 15000,
    queryFn: async () => { const { data, error } = await supabase.rpc('org_diretorio'); if (error) throw error; return data as unknown as DiretorioOrg; } });
  return { ...query, diretorio: query.data ?? DIRETORIO_VAZIO, recarregar: async () => {
    await cache.invalidateQueries({ queryKey: ['base-organizacional'] });
    await cache.invalidateQueries({ queryKey: ['nomes-organizacionais'] });
    window.dispatchEvent(new Event('base-organizacional'));
  } };
}