import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, LayoutGrid, LineChart, FolderKanban, FolderArchive, Bell, Search, LogOut, ShieldCheck, Sparkles, Compass, Target, ListChecks, Repeat, Network, Workflow, ShieldAlert, ChevronDown, Briefcase, GitBranch, History, BookOpen, FileCheck2, ScrollText, Library, Server, TrendingUp, Settings2, LogIn, KeyRound, UserCog, User as UserIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ScrollNav from "./ScrollNav";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { moduleForPath } from "@/lib/moduleAccess";

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
      { to: "/backlog-estrategico", label: "Backlog Estratégico", icon: ListChecks },
      { to: "/impacto-estrategico", label: "Impacto Estratégico", icon: TrendingUp },
      { to: "/contexto-decisoes", label: "Contexto e decisões", icon: ScrollText },
    ],
  },
  {
    id: "socios",
    label: "Desejos dos Sócios 2027",
    icon: Briefcase,
    children: [
      { to: "/socios/formulario", label: "Meu formulário", icon: ListChecks },
      { to: "/socios/consolidado", label: "Visão consolidada", icon: LayoutGrid },
      { to: "/socios/insights", label: "Insights sócios", icon: Sparkles },
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
    id: "okrs",
    label: "OKRs",
    icon: TrendingUp,
    children: [
      { to: "/okrs", label: "OKRs do Semestre", icon: Target },
      { to: "/cesta-metas", label: "Cesta de Metas", icon: UserCog },
      { to: "/cesta-metas/insights", label: "Insights da Cesta", icon: ListChecks },
      { to: "/metas/painel", label: "Metas 2S26 · Painel da Governança", icon: Settings2 },
      { to: "/metas/lancamento", label: "Metas 2S26 · Lançamento mensal", icon: Settings2 },
      { to: "/metas/cadastros", label: "Metas 2S26 · Cadastros", icon: Settings2 },
    ],
  },
  {
    id: "rotina",
    label: "Rotina Semanal",
    icon: Repeat,
    children: [
      { to: "/semanal/visao", label: "Visão semanal", icon: LayoutGrid },
      { to: "/metas/semanal", label: "Check-in e Checkout", icon: ListChecks },
    ],
  },
  {
    id: "historico",
    label: "Histórico de Documentações",
    icon: History,
    children: [
      { to: "/historico/projetos", label: "Histórico de Projetos", icon: FolderKanban },
      { to: "/historico/estrategia", label: "Histórico de Estratégia", icon: Compass },
      { to: "/historico/okrs", label: "Histórico de OKRs", icon: Target },
      { to: "/historico/cesta-metas", label: "Histórico de Cesta de Metas", icon: ListChecks },
    ],
  },
  {
    id: "estrutura-incentivos",
    label: "Estrutura e Incentivos",
    icon: Network,
    children: [
      { to: "/estrutura-organizacional", label: "Estrutura organizacional", icon: Network },
      { to: "/incentivos", label: "Sistemas de incentivo", icon: Target },
    ],
  },
];

// Visível só para admin/super_admin (filtrado no componente).
const integracoesGroup: NavGroup = { id: "integracoes", label: "Integrações", icon: Server, children: [{ to: "/governanca/integracao", label: "Integração Governança", icon: Server }] };

const titles: Record<string, string> = {
  "/governanca/integracao": "Integração Governança",
  "/contexto-decisoes": "Contexto e decisões",
  "/socios/insights": "Desejos dos Sócios 2027 · Insights sócios",
  "/estrutura-organizacional": "Estrutura organizacional",
  "/incentivos": "Sistemas de incentivo",
  "/cesta-metas/insights": "Insights da Cesta",
  "/": "Dashboard Estratégico",
  "/diagnostico": "Diagnóstico Estratégico LM",
  "/okrs": "OKRs · 2026/2",
  "/cesta-metas": "Cesta de Metas · 2026/2",
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
  "/metas/cadastros": "Sistema de Metas 2S26 · Cadastros",
  "/metas/painel": "Sistema de Metas 2S26 · Painel da Governança",
  "/metas/lancamento": "Sistema de Metas 2S26 · Lançamento mensal",
  "/metas/semanal": "Rotina Semanal · Check-in e Checkout",
  "/semanal/visao": "Rotina Semanal · Visão da semana",
  "/historico/estrategia": "Histórico de Estratégia",
  "/historico/okrs": "Histórico de OKRs",
  "/historico/cesta-metas": "Histórico de Cesta de Metas",
  "/historico/projetos": "Histórico de Projetos · Versões de Documentos",
  "/socios/formulario": "Desejos dos Sócios 2027 · Meu formulário",
  "/socios/consolidado": "Desejos dos Sócios 2027 · Visão consolidada",
  "/minhas-permissoes": "Minhas Permissões",
  "/gestao-usuarios": "Gestão de Usuários e Permissões",
  "/pmo/business-case": "PMO · Submissão de Business Case (ScoreCard LM)",
};

export default function AppLayout() {
  const loc = useLocation();
  const title = titles[loc.pathname] ?? "Gestão e Estratégia";
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ display_name?: string | null; cargo?: string | null; email?: string | null } | null>(null);
  const access = useModuleAccess();
  const isAdmin = access.isSuperAdmin || access.roles.includes("admin");
  const visibleGroups = [...navGroups, ...(isAdmin ? [integracoesGroup] : [])].map(group => ({ ...group, children: group.children.filter(child => {
    const module = moduleForPath(child.to);
    return !module || access.canAccessPath(module, child.to);
  }) })).filter(group => group.children.length > 0);
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
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("display_name,cargo,email").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data ?? { email: user.email }));
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
              <div className="font-semibold text-sm">Gestão e Estratégia</div>
              <div className="text-xs text-sidebar-foreground/60">Liberdade Médica</div>
            </div>
          )}
        </div>
        <TooltipProvider delayDuration={200}>
        <nav className={cn("flex-1 py-5 space-y-1 overflow-y-auto overflow-x-hidden", collapsed ? "px-2" : "px-3")}>
          {visibleGroups.map((group) => {
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
