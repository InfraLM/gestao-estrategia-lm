import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { moduleForPath } from "@/lib/moduleAccess";

export default function ModuleAccessGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const access = useModuleAccess();
  const { pathname, search } = useLocation();
  if (loading || access.loading || (["/incentivos", "/cesta-metas/insights"].includes(pathname) && access.phase1OwnershipLoading)) return <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to={(["/pmo/atualizar-status", "/metas/semanal"].includes(pathname) || pathname.startsWith("/pre-offsite")) ? `/auth?retorno=${encodeURIComponent(pathname + search)}` : "/auth"} replace />;
  const module = moduleForPath(pathname);
  if (access.error || (module && !access.canAccessPath(module, pathname))) return <div className="py-16 text-center space-y-3"><ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="text-lg font-semibold">Acesso não autorizado</h2><p className="text-muted-foreground">Solicite a liberação desta área ao Admin Principal.</p></div>;
  return <>{children}</>;
}