export const ACCESS_MODULES = [
  { id: "estrategia", label: "Estratégia" },
  { id: "pmo", label: "PMO · Projetos e melhorias" },
  { id: "bpmo", label: "BPMO · Processos" },
  { id: "okrs", label: "OKRs" },
  { id: "cesta", label: "Cesta de Metas" },
  { id: "metas", label: "Metas · Cadastros e lançamento mensal" },
  { id: "rotina", label: "Rotina Semanal" },
  { id: "historico", label: "Histórico de Documentações" },
  { id: "decisoes", label: "Contexto e decisões" },
  { id: "estrutura", label: "Estrutura organizacional" },
  { id: "incentivos", label: "Sistemas de incentivo e insights da Cesta" },
] as const;

export type AccessModule = typeof ACCESS_MODULES[number]["id"] | "repositorios" | "socios";
export type AccessLevel = "nenhum" | "leitura" | "edicao";
export type ModuleGrant = { modulo: string; nivel: AccessLevel };

export const CLOSED_MODULES: readonly string[] = ["decisoes", "estrutura", "incentivos"];

export function moduleForPath(path: string): AccessModule | null {
  if (path === "/contexto-decisoes") return "decisoes";
  if (path === "/estrutura-organizacional") return "estrutura";
  if (path === "/incentivos" || path === "/cesta-metas/insights") return "incentivos";
  if (path.startsWith("/socios")) return "socios";
  if (path.startsWith("/historico")) return "historico";
  if (path === "/metas/semanal" || path.startsWith("/semanal")) return "rotina";
  if (path.startsWith("/metas") || path.startsWith("/lancamentos")) return "metas";
  if (path.startsWith("/planejamento")) return "diagnostico";
  if (path.startsWith("/cesta-metas")) return "cesta";
  if (path.startsWith("/okrs")) return "okrs";
  if (["/matriz-processos", "/gestao-processos", "/dashboard-processos", "/status-report-processos"].some(p => path.startsWith(p))) return "bpmo";
  if (["/portfolio", "/pmo", "/gestao", "/status-report", "/submissao", "/melhorias", "/melhoria-continua"].some(p => path.startsWith(p))) return "pmo";
  if (path === "/" || ["/diagnostico", "/estrategia", "/backlog-estrategico", "/impacto-estrategico"].some(p => path.startsWith(p))) return "estrategia";
  return null;
}

export function moduleForContent(key: string): AccessModule {
  if (key.startsWith("okrs.")) return "okrs";
  if (key.startsWith("cesta.")) return "cesta";
  if (key.startsWith("melh.")) return "pmo";
  return "estrategia";
}

export function canAccessModule(grants: ModuleGrant[], module: string, edit = false, superAdmin = false, admin = false): boolean {
  if (superAdmin) return true;
  if (CLOSED_MODULES.includes(module) && admin) return true;
  const grant = grants.find(g => g.modulo === module);
  if (!grant && CLOSED_MODULES.includes(module)) return false;
  if (!grant) return true; // Existing scoped permissions remain authoritative without an override.
  return edit ? grant.nivel === "edicao" : grant.nivel !== "nenhum";
}
export type SocioParticipante = { respondente: boolean; pode_ver_consolidado: boolean; ativo: boolean } | null;

/** Desejos dos Sócios: fechado por padrão — só participantes cadastrados; consolidado só com permissão explícita (nem super_admin entra sem ela). */
export function canAccessSocios(p: SocioParticipante, path = "/socios/formulario"): boolean {
  if (!p || !p.ativo) return false;
  if (path === "/socios/insights") return p.pode_ver_consolidado;
  if (path.startsWith("/socios/consolidado")) return p.pode_ver_consolidado;
  // Quem vê o consolidado pode abrir o formulário em modo prévia (nada é salvo).
  if (path.startsWith("/socios/formulario")) return p.respondente || p.pode_ver_consolidado;
  return p.respondente || p.pode_ver_consolidado;
}
