/**
 * Apoio ao visual mais didático do formulário semanal (check-in e checkout).
 * Só apresentação: usa as mesmas pendências de pendenciasCheckin/pendenciasCheckout, sem mudar regra de envio.
 */
export type PendenciaLike = { campo: string; texto: string };

/** Em qual seção da tela fica cada pendência (pelo prefixo do campo). */
export function secaoDaPendencia(campo: string): string {
  if (campo.startsWith("kpi-")) return "bloco-kpis";
  if (campo.startsWith("ent-")) return "bloco-entregas";
  if (campo.startsWith("impedimento-") || campo === "bloco-impedimentos") return "bloco-impedimentos";
  if (campo.startsWith("pri-")) return "bloco-prioridades";
  return "outros";
}

export function pendenciasPorSecao(pend: PendenciaLike[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const p of pend) { const s = secaoDaPendencia(p.campo); r[s] = (r[s] ?? 0) + 1; }
  return r;
}

/** Texto do contador de cada seção: o que falta responder, ou ✓ quando não falta nada. */
export function rotuloContador(pendentes: number, total: number | null): string {
  if (pendentes > 0) return `${pendentes} para responder`;
  if (total == null) return "";
  return total > 0 ? "✓" : "";
}

export const faltaTexto = (n: number) => (n === 0 ? "tudo certo" : n === 1 ? "falta 1 item" : `faltam ${n} itens`);

/** Visual novo só para super_admin (Naira e Arthur) até a validação; "?visual=atual" mostra o de hoje para comparar. */
export function usaVisualNovo(roles: string[], busca: string): boolean {
  if (new URLSearchParams(busca).get("visual") === "atual") return false;
  return roles.includes("super_admin");
}
