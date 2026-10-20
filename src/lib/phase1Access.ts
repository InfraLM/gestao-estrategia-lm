import { canAccessModule, ModuleGrant } from "./moduleAccess";

export function canAccessPhase1Path(path: string, grants: ModuleGrant[], superAdmin: boolean, admin: boolean, own: { ocupante: boolean; diretor: boolean }): boolean {
  if (path === "/contexto-decisoes") return canAccessModule(grants, "decisoes", false, superAdmin, admin);
  if (path === "/estrutura-organizacional") return canAccessModule(grants, "estrutura", false, superAdmin, admin);
  if (path === "/incentivos") return canAccessModule(grants, "incentivos", false, superAdmin, admin) || own.ocupante;
  if (path === "/cesta-metas/insights") return canAccessModule(grants, "incentivos", false, superAdmin, admin) || own.diretor;
  return false;
}