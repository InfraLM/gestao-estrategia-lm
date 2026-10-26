import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DIRETORIAS_FITFINDER } from "../../supabase/functions/fitfinder-sync/mapear";

export function useFitFinderAccess() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["fitfinder-acesso", user?.id], enabled: !!user,
    queryFn: async () => {
      if (!user) return { gov: false, podeLer: false };
      const gov = await supabase.rpc("proj_gov_ou_ceo", { _uid: user.id });
      if (gov.error) throw gov.error;
      if (gov.data) return { gov: true, podeLer: true };
      const leituras = await Promise.all(DIRETORIAS_FITFINDER.map(_diretoria => supabase.rpc("fitfinder_pode_ler", { _diretoria })));
      return { gov: false, podeLer: leituras.some(r => !r.error && r.data === true) };
    },
  });
  return { gov: query.data?.gov === true, podeLer: query.data?.podeLer === true, carregando: !!user && query.isPending };
}