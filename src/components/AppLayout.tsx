import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, LayoutGrid, LineChart, FolderKanban, FolderArchive, Bell, Search, LogOut, ShieldCheck, Sparkles, Compass, Target, ListChecks, Repeat, Network, Workflow, ShieldAlert, ChevronDown, Briefcase, GitBranch, History, BookOpen, FileCheck2, ScrollText, Library, Server, TrendingUp, Settings2, LogIn, KeyRound, UserCog, User as UserIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ScrollNav from "./ScrollNav";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type NavChild = { to: string; label: string; icon: any };
type NavGroup = { id: string; label: string; icon: any; children: NavChild[] };

const navGroups: NavGroup[] = [
  {
    id: "estrategia",
    label: "Estratégia",
    icon: Target,
    children: [
      { to: "/", label: "Dashboard Estratégico", icon: LayoutDashboard },
      { to: "/diagnostico", label: "Diagnóstico Estratégico", icon: Compass },
      { to: "/estrategia", label: "Estratégia LM", icon: Target },
      { to: "/matriz-riscos", label: "Matriz de Riscos Institucionais", icon: ShieldAlert },
      { to: "/backlog-estrategico", label: "Backlog Estratégico", icon: ListChecks },
      { to: "/impacto-estrategico", label: "Impacto Estratégico", icon: TrendingUp },
    ],
  },
  {
    id: "pmo",
    label: "PMO",
    icon: Briefcase,
    children: [
      { to: "/portfolio", label: "Portfólio Estratégico", icon: LayoutGrid },
      { to: "/pmo/business-case", label: "Business Case · ScoreCard LM", icon: FileCheck2 },
      { to: "/status-report", label: "Status Report de Projetos", icon: LineChart },
      { to: "/gestao", label: "Gestão de Projetos", icon: FolderKanban },
      { to: "/melhorias", label: "Melhorias Estratégicas", icon: Sparkles },
    ],
  },
  {
    id: "bpmo",
    label: "BPMO",
    icon: GitBranch,
    children: [
      { to: "/matriz-processos", label: "Matriz de Processos", icon: Network },
      { to: "/dashboard-processos", label: "Dashboard de Processos", icon: LayoutDashboard },
      { to: "/gestao-processos", label: "Gestão de Processos", icon: Workflow },
      { to: "/status-report-processos", label: "Status Report de Processos", icon: LineChart },
      { to: "/melhoria-continua", label: "Melhoria Contínua", icon: Repeat },
    ],
  },
  {
    id: "historico",
    label: "Histórico de Documentações",
    icon: History,
    children: [
      { to: "/historico/projetos", label: "Histórico de Projetos", icon: FolderKanban },
      { to: "/historico/processos", label: "Histórico de Processos", icon: Workflow },
      { to: "/historico/governanca", label: "Histórico de Governança", icon: ScrollText },
      { to: "/historico/infra-tech", label: "Histórico de Infra & Tech", icon: Server },
    ],
  },
  {
    id: "repositorios",
    label: "Repositórios",
    icon: Library,
    children: [
      { to: "/repositorios/frameworks", label: "Frameworks Vigentes", icon: BookOpen },
      { to: "/repositorios/processos-publicados", label: "Processos Publicados", icon: FileCheck2 },
      { to: "/repositorios/documentos-controlados", label: "Documentos Controlados", icon: FolderArchive },
      { to: "/repositorios/politicas-institucionais", label: "Políticas Institucionais", icon: ShieldCheck },
      { to: "/repositorios/gestao", label: "Gestão do Repositório", icon: Settings2 },
    ],
  },
  {
    id: "infra_tech",
    label: "Governança e Jurídico",
    icon: Server,
    children: [
      { to: "/infra-tech/sprints", label: "Sprints Semanais", icon: ListChecks },
      { to: "/governanca-juridico/documentos", label: "Documentos de Governança", icon: ScrollText },
      { to: "/governanca-juridico/riscos-estrategicos", label: "Riscos Estratégicos", icon: ShieldAlert },
    ],
  },
];

const titles: Record<string, string> = {
  "/": "Dashboard Estratégico",
  "/diagnostico": "Diagnóstico Estratégico LM",
  "/estrategia": "Estratégia LM · Formulação + Planejamento",
  "/backlog-estrategico": "Backlog Estratégico · Plano de Ação Institucional",
  "/impacto-estrategico": "Impacto Estratégico · Consolidação por Objetivo BSC",
  "/submissao": "Submissão de Projetos",
  "/portfolio": "Portfólio Estratégico",
  "/status-report": "Status Report de Projetos — Evolução",
  "/status-report-processos": "Status Report de Processos — Mapeamento, Riscos e Melhorias",
  "/gestao": "Gestão de Projetos Institucionais",
  "/melhorias": "Gestão de Melhorias Estratégicas",
  "/melhoria-continua": "Gestão de Melhoria Contínua · Por Área",
  "/dashboard-processos": "Dashboard de Processos · Visão Consolidada",
  "/matriz-processos": "Matriz de Processos · Cadeia de Valor LM",
  "/gestao-processos": "Gestão de Processos · Mapeamento e Análise",
  "/matriz-riscos": "Matriz de Riscos Institucionais",
  "/historico/projetos": "Histórico de Projetos · Versões de Documentos",
  "/historico/processos": "Histórico de Processos · Versões de Documentos",
  "/historico/governanca": "Histórico de Governança · Atas e Deliberações",
  "/historico/infra-tech": "Histórico de Infra & Tech · Arquiteturas e Runbooks",
  "/repositorios/frameworks": "Frameworks Vigentes · Repositório Controlado",
  "/repositorios/processos-publicados": "Processos Publicados · Repositório Controlado",
  "/repositorios/documentos-controlados": "Documentos Controlados · Controle de Qualidade",
  "/repositorios/politicas-institucionais": "Políticas Institucionais · Repositório Controlado",
  "/repositorios/gestao": "Gestão do Repositório · Controle de Revisão e Aprovações",
  "/minhas-permissoes": "Minhas Permissões",
  "/gestao-usuarios": "Gestão de Usuários e Permissões",
  "/infra-tech/sprints": "Infra & Tech · Gestão de Sprints Semanais",
  "/governanca-juridico/documentos": "Documentos de Governança · Controle GRC",
  "/governanca-juridico/riscos-estrategicos": "Riscos Estratégicos · Mapa de Riscos LM",
  "/pmo/business-case": "PMO · Submissão de Business Case (ScoreCard LM)",
};

export default function AppLayout() {
  const loc = useLocation();
  const title = titles[loc.pathname] ?? "NextLevel LM";
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ display_name?: string | null; cargo?: string | null; email?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "1";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

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
      <aside className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen transition-[width] duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn("py-6 flex items-center gap-3 border-b border-sidebar-border", collapsed ? "px-3 justify-center" : "px-6")}>
          <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center font-bold text-primary-foreground shadow-primary shrink-0">
            LM
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold text-sm">NextLevel LM</div>
              <div className="text-xs text-sidebar-foreground/60">Liberdade Médica</div>
            </div>
          )}
        </div>
        <TooltipProvider delayDuration={200}>
        <nav className={cn("flex-1 py-5 space-y-1 overflow-y-auto overflow-x-hidden", collapsed ? "px-2" : "px-3")}>
          {navGroups.map((group) => {
            const isGroupActive = group.children.some((c) =>
              c.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(c.to)
            );
            const isOpen = openGroups[group.id] ?? isGroupActive;
            const GroupIcon = group.icon;
            if (collapsed) {
              return (
                <div key={group.id} className="space-y-0.5">
                  {group.children.map(({ to, label, icon: Icon }) => {
                    const active = to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);
                    return (
                      <Tooltip key={to}>
                        <TooltipTrigger asChild>
                          <NavLink
                            to={to}
                            end={to === "/"}
                            className={cn(
                              "flex items-center justify-center h-10 w-10 mx-auto rounded-md transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">{label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                  <div className="my-2 h-px bg-sidebar-border/40" />
                </div>
              );
            }
            return (
              <div key={group.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setOpenGroups((s) => ({ ...s, [group.id]: !isOpen }))}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors",
                    isGroupActive
                      ? "text-sidebar-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  )}
                >
                  <GroupIcon className="h-4 w-4" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-0" : "-rotate-90")} />
                </button>
                {isOpen && (
                  <div className="ml-3 pl-3 border-l border-sidebar-border/60 space-y-0.5">
                    {group.children.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === "/"}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
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
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        </TooltipProvider>
        <div className={cn("py-3 border-t border-sidebar-border flex", collapsed ? "px-2 justify-center" : "px-4 items-center justify-between")}>
          {!collapsed && <span className="text-xs text-sidebar-foreground/50">v1.0 · Wave 1 · 2026</span>}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="h-8 w-8 grid place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="text-sm font-medium">{displayName}</div>
                      <div className="text-xs text-muted-foreground font-normal">{user?.email ?? "Não autenticado"}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/minhas-permissoes"><KeyRound className="h-4 w-4 mr-2" />Minhas permissões</Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link to="/gestao-usuarios"><UserCog className="h-4 w-4 mr-2" />Gerenciar usuários</Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut()}><LogOut className="h-4 w-4 mr-2" />Sair</DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link to="/auth"><LogIn className="h-4 w-4 mr-2" />Realizar login</Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
