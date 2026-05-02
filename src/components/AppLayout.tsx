import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus2, LayoutGrid, LineChart, FolderKanban, FolderArchive, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/submissao", label: "Submissão", icon: FilePlus2 },
  { to: "/portfolio", label: "Portfólio", icon: LayoutGrid },
  { to: "/status-report", label: "Status Report", icon: LineChart },
  { to: "/gestao", label: "Gestão de Projetos", icon: FolderKanban },
  { to: "/repositorio", label: "Repositório", icon: FolderArchive },
];

const titles: Record<string, string> = {
  "/": "Dashboard Estratégico",
  "/submissao": "Submissão de Projetos",
  "/portfolio": "Portfólio Estratégico",
  "/status-report": "Status Report — Evolução",
  "/gestao": "Gestão de Projetos",
  "/repositorio": "Repositório · BCs e Documentos",
};

export default function AppLayout() {
  const loc = useLocation();
  const title = titles[loc.pathname] ?? "PMO Estratégico";

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
                  <div className="text-sm font-medium">Bruno Garcia</div>
                  <div className="text-xs text-muted-foreground">Diretor PMO</div>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                  BG
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
