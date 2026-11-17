/** Validação das fontes citadas pela IA: cada afirmação traz [FONTE: CÓDIGO]; código que não existe na entrada vira [sem fonte]. */
export const TIPOS_REVISAO: Record<string, string> = {
  relatorio: "Relatório de planejamento estratégico (mensal)",
  diag_PESTEL: "Diagnóstico · PESTEL", diag_Porter: "Diagnóstico · 5 Forças de Porter", diag_RBV_VRIN: "Diagnóstico · RBV/VRIN",
  diag_Oceano_Azul: "Diagnóstico · Oceano Azul", diag_SWOT: "Diagnóstico · SWOT", diag_Ansoff: "Diagnóstico · Ansoff",
};
export const LIMITE_MENSAL = 3;

export function validarFontes(texto: string, validos: Set<string>): { texto: string; invalidas: string[] } {
  const invalidas: string[] = [];
  const out = texto.replace(/\[FONTE:\s*([^\]]+)\]/gi, (_m, lista: string) => {
    const cods = lista.split(/[,;]/).map((c) => c.trim()).filter(Boolean);
    const ok = cods.filter((c) => validos.has(c.toUpperCase()));
    cods.filter((c) => !validos.has(c.toUpperCase())).forEach((c) => invalidas.push(c));
    return ok.length ? `[FONTE: ${ok.join(", ")}]` : "[sem fonte]";
  });
  return { texto: out, invalidas };
}

export const temSemFonte = (t: string) => /\[sem fonte\]/i.test(t);

/** Diferença simples por linha entre a revisão anterior e a nova. */
export function diffLinhas(antes: string, depois: string): { tipo: "igual" | "removida" | "nova"; linha: string }[] {
  const a = antes.split("\n"), b = depois.split("\n");
  const sa = new Set(a), sb = new Set(b);
  const out: { tipo: "igual" | "removida" | "nova"; linha: string }[] = [];
  for (const l of a) if (!sb.has(l)) out.push({ tipo: "removida", linha: l });
  for (const l of b) out.push({ tipo: sa.has(l) ? "igual" : "nova", linha: l });
  return out.filter((x) => x.linha.trim());
}
