import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { canAccessModule, canAccessSocios, ModuleGrant, SocioParticipante } from "@/lib/moduleAccess";
import { canAccessPhase1Path } from "@/lib/phase1Access";

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
  const ownership = useQuery({
    queryKey: ["phase1-ownership", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fase1_acessos_cadeira");
      if (error) throw error;
      const own = data as { ocupante?: boolean; diretor?: boolean } | null;
      return { ocupante: own?.ocupante === true, diretor: own?.diretor === true };
    }, refetchOnWindowFocus: true, refetchInterval: 30000,
  });
  const offsite = useQuery({queryKey: ['offsite-access', user?.id], enabled: !!user, queryFn: async () => { const {data,error} = await (supabase as any).rpc('offsite_acesso'); if(error) throw error; return data as {admin:boolean;permitido:boolean}; }, refetchOnWindowFocus:true});
  const allowed = (module: string, edit = false) => !!user && !!query.data && (module === "pre_offsite" ? offsite.data?.permitido === true : module === "socios" ? canAccessSocios(query.data.socio) : canAccessModule(query.data.grants, module, edit, query.data.superAdmin, query.data.roles.includes("admin")));
  return {
    loading: authLoading || (!!user && (query.isPending || offsite.isPending)), error: query.isError,
    grants: query.data?.grants ?? [], roles: query.data?.roles ?? [],
    isSuperAdmin: query.data?.superAdmin ?? false,
    socio: query.data?.socio ?? null,
    canAccessPath: (module: string, path: string) => {
      if (module === "pre_offsite") return !!user && !!offsite.data?.permitido && (path === "/pre-offsite" || offsite.data.admin);
      if (module === "socios") return !!user && !!query.data && canAccessSocios(query.data.socio, path);
      if (["decisoes", "estrutura", "incentivos"].includes(module)) return !!user && !!query.data && canAccessPhase1Path(path, query.data.grants, query.data.superAdmin, query.data.roles.includes("admin"), ownership.data ?? { ocupante: false, diretor: false });
      return allowed(module);
    },
    phase1OwnershipLoading: !!user && ownership.isPending,
    canRead: (module: string) => allowed(module),
    canWrite: (module: string) => allowed(module, true),
    explicitEditor: (module: string) => allowed(module, true) && (query.data?.superAdmin || query.data?.grants.some(g => g.modulo === module && g.nivel === "edicao")) === true,
  };
}