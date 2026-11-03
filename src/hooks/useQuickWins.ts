import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type QwPerfil = { lider_id: string | null; lider_restrito: boolean; diretor: boolean; governanca: boolean; gov_ceo: boolean };

/** Perfil do usuário no Quick Wins, calculado no servidor (também vincula o líder pelo e-mail verificado). */
export function useQwPerfil() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["qw-perfil", user?.id], enabled: !!user, refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("qw_meu_perfil");
      if (error) throw error;
      return data as QwPerfil;
    },
  });
}
