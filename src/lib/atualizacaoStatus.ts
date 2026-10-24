import { STATUS_EM_ABERTO } from "./projetosGestao";

export const STATUS_DIRETOS = STATUS_EM_ABERTO;
export const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function retornoStatus(value: string | null): string {
  if (!value) return "/";
  try {
    const url = new URL(value, "https://local.invalid");
    return url.origin === "https://local.invalid" && (["/pmo/atualizar-status", "/metas/semanal"].includes(url.pathname) || /^\/pre-offsite(?:\/(?:consolidado|configuracao|anexo))?$/.test(url.pathname)) ? url.pathname + url.search : "/";
  } catch { return "/"; }
}
export function filtrarAtualizacao<T extends { status: string; cadeira?: string; diretor?: string | null; tipo: string }>(itens: T[], filtros: URLSearchParams): T[] {
  const status = filtros.get("status") ?? "aberto";
  const cadeira = filtros.get("cadeira"); const diretor = filtros.get("diretor"); const tipo = filtros.get("tipo");
  return itens.filter(i => (status === "todos" || (status === "aberto" ? STATUS_DIRETOS.includes(i.status) : i.status === status))
    && (!cadeira || normalizar(i.cadeira ?? "") === normalizar(cadeira))
    && (!diretor || normalizar(i.diretor ?? "").includes(normalizar(diretor)))
    && (!tipo || tipo === "todos" || i.tipo === tipo));
}