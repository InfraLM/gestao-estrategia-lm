import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { canAccessModule, canAccessSocios, ModuleGrant, SocioParticipante } from "@/lib/moduleAccess";

export function useModuleAccess() {
  const { user, loading: authLoading } = useAuth();
  const query = useQuery({
    queryKey: ["module-access", user?.id],
    enabled: !!user,
    queryFn: async () => {
      await (supabase as any).rpc("socios_vincular");
      const [grants, roles, socio] = await Promise.all([
        supabase.from("usuario_acessos").select("modulo,nivel").eq("user_id", user?.id ?? ""),
        supabase.from("user_roles").select("role").eq("user_id", user?.id ?? ""),
        (supabase as any).from("socios_participantes").select("respondente,pode_ver_consolidado,ativo").eq("user_id", user?.id ?? "").maybeSingle(),
      ]);
      if (grants.error) throw grants.error;
      if (roles.error) throw roles.error;
      return { grants: grants.data as ModuleGrant[], superAdmin: roles.data.some(r => r.role === "super_admin"), roles: roles.data.map(r => r.role), socio: (socio.data ?? null) as SocioParticipante };
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });
  const allowed = (module: string, edit = false) => !!user && !!query.data && (module === "socios" ? canAccessSocios(query.data.socio) : canAccessModule(query.data.grants, module, edit, query.data.superAdmin));
  return {
    loading: authLoading || (!!user && query.isPending), error: query.isError,
    grants: query.data?.grants ?? [], roles: query.data?.roles ?? [],
    isSuperAdmin: query.data?.superAdmin ?? false,
    socio: query.data?.socio ?? null,
    canAccessPath: (module: string, path: string) => module === "socios" ? !!user && !!query.data && canAccessSocios(query.data.socio, path) : allowed(module),
    canRead: (module: string) => allowed(module),
    canWrite: (module: string) => allowed(module, true),
    explicitEditor: (module: string) => allowed(module, true) && (query.data?.superAdmin || query.data?.grants.some(g => g.modulo === module && g.nivel === "edicao")) === true,
  };
}