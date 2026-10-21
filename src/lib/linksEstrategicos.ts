export type TipoCodigoEstrategico = "D" | "DS";

export function codigoEstrategicoValido(codigo: string | null, tipo?: TipoCodigoEstrategico): codigo is string {
  if (!codigo) return false;
  return tipo === "D" ? /^(D-\d{3}|GOV-[A-Za-z]+-\d{8}-\d{2})$/.test(codigo) : tipo === "DS" ? /^DS-\d{2}$/.test(codigo) : /^(D-\d{3}|DS-\d{2}|GOV-[A-Za-z]+-\d{8}-\d{2})$/.test(codigo);
}

export function linkEstrategico(codigo: string | null): string | null {
  if (!codigoEstrategicoValido(codigo)) return null;
  const pagina = codigo.startsWith("DS-") ? "/socios/insights" : "/contexto-decisoes";
  return `${pagina}?codigo=${encodeURIComponent(codigo)}`;
}

export function parametrosFicha(parametros: URLSearchParams, codigo: string | null) {
  const novos = new URLSearchParams(parametros);
  if (codigoEstrategicoValido(codigo)) novos.set("codigo", codigo);
  else novos.delete("codigo");
  return novos;
}

/** Resolves only against the RLS-filtered records already loaded by the page. */
export function lerFichaEstrategica(parametros: URLSearchParams, tipo: TipoCodigoEstrategico, visiveis: ReadonlySet<string>, carregado: boolean) {
  const solicitado = parametros.get("codigo");
  if (!carregado || solicitado === null) return { codigo: null, indisponivel: false };
  const encontrado = codigoEstrategicoValido(solicitado, tipo) && visiveis.has(solicitado);
  return { codigo: encontrado ? solicitado : null, indisponivel: !encontrado };
}