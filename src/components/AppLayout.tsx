import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus2, LayoutGrid, LineChart, FolderKanban, FolderArchive, Bell, Search, LogOut, ShieldCheck, Sparkles, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import ScrollNav from "./ScrollNav";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/diagnostico", label: "Diagnóstico Estratégico", icon: Compass },
  { to: "/submissao", label: "Submissão", icon: FilePlus2 },
  { to: "/portfolio", label: "Portfólio", icon: LayoutGrid },
  { to: "/status-report", label: "Status Report", icon: LineChart },
  { to: "/gestao", label: "Gestão de Projetos", icon: FolderKanban },
  { to: "/melhorias", label: "Gestão de Melhorias", icon: Sparkles },
  { to: "/repositorio", label: "Repositório", icon: FolderArchive },
];

const titles: Record<string, string> = {
  "/": "Dashboard Estratégico",
  "/diagnostico": "Diagnóstico Estratégico LM",
  "/submissao": "Submissão de Projetos",
  "/portfolio": "Portfólio Estratégico",
  "/status-report": "Status Report — Evolução",
  "/gestao": "Gestão de Projetos Institucionais",
  "/melhorias": "Gestão de Melhorias Contínuas",
  "/repositorio": "Repositório · BCs e Documentos",
};

export default function AppLayout() {
  const loc = useLocation();
  const title = titles[loc.pathname] ?? "PMO Estratégico";
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ display_name?: string | null; cargo?: string | null; email?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setProfile(null); setIsAdmin(false); return; }
    supabase.from("profiles").select("display_name,cargo,email").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data ?? { email: user.email }));
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const displayName = profile?.display_name || user?.email || "Convidado";
  const cargo = profile?.cargo || (isAdmin ? "Administrador" : (user ? "Usuário" : ""));
  const initials = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-sidebar-border">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center font-bold text-primary-foreground shadow-primary">
            LM
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">PMO Estratégico</div>
            <div className="text-xs text-sidebar-foreground/60">Liberdade Médica</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
          v1.0 · Wave 1 · 2026
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-6 py-4 gap-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Governança · Portfólio · Execução</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-md bg-surface-muted text-sm text-muted-foreground w-72">
                <Search className="h-4 w-4" />
                <input className="bg-transparent outline-none flex-1 placeholder:text-muted-foreground" placeholder="Buscar projeto, KR, diretor..." />
              </div>
              <button className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-surface-muted">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium flex items-center gap-1.5 justify-end">
                    {displayName}
                    {isAdmin && <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-label="Admin" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{cargo}</div>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                  {initials || "?"}
                </div>
                {user && (
                  <button onClick={() => signOut()} title="Sair" className="h-9 w-9 grid place-items-center rounded-md hover:bg-surface-muted text-muted-foreground">
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
      <ScrollNav />
    </div>
  );
}
