import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "super_admin" | "admin" | "pmo" | "viewer";
export type ModuloAdmin = "pmo" | "bpmo" | "estrategia" | "repositorios";

export interface UserPermissions {
  loading: boolean;
  roles: AppRole[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  modulos: ModuloAdmin[];
  departamento: { id: string; nome: string } | null;
  projetosLiberados: { projeto_id: string; papel: string; nome?: string }[];
  canEditModulo: (m: ModuloAdmin) => boolean;
  canEditProjeto: (id: string) => boolean;
}

export function useUserPermissions(): UserPermissions {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [modulos, setModulos] = useState<ModuloAdmin[]>([]);
  const [departamento, setDepartamento] = useState<{ id: string; nome: string } | null>(null);
  const [projetos, setProjetos] = useState<{ projeto_id: string; papel: string; nome?: string }[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false); setRoles([]); setModulos([]); setDepartamento(null); setProjetos([]);
      return;
    }
    setLoading(true);
    (async () => {
      const [rRoles, rMod, rProf, rProj] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        (supabase as any).from("admin_modulos").select("modulo").eq("user_id", user.id),
        (supabase as any).from("profiles").select("departamento_id, departamentos:departamento_id(id, nome)").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("projeto_membros").select("projeto_id, papel, projetos:projeto_id(nome)").eq("user_id", user.id),
      ]);
      setRoles(((rRoles.data as any[]) ?? []).map((r) => r.role));
      setModulos(((rMod.data as any[]) ?? []).map((m) => m.modulo));
      const dep = (rProf.data as any)?.departamentos;
      setDepartamento(dep ? { id: dep.id, nome: dep.nome } : null);
      setProjetos(((rProj.data as any[]) ?? []).map((p) => ({ projeto_id: p.projeto_id, papel: p.papel, nome: p.projetos?.nome })));
      setLoading(false);
    })();
  }, [user]);

  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = isSuperAdmin || roles.includes("admin");
  return {
    loading, roles, isSuperAdmin, isAdmin, modulos, departamento, projetosLiberados: projetos,
    canEditModulo: (m) => isSuperAdmin || modulos.includes(m),
    canEditProjeto: (id) => isSuperAdmin || roles.includes("admin") || roles.includes("pmo") || projetos.some((p) => p.projeto_id === id),
  };
}
