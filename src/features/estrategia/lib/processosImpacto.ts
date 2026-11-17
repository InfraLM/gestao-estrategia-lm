/** Processos no Impacto Estratégico: lista local agora, espelho do app de processos quando chegar. */
export type ProcImpacto = {
  chave: string; codigo: string | null; nome: string; dono: string | null; cadeira: string | null;
  maturidade: string | null; nota: number | null; vinculo: string | null; grau: string | null; confianca: number | null; fonte: "local" | "zeev";
};

/** Código de processo no início do nome (ex.: "02.10.06 – Operar…"). */
export const codigoDoNome = (nome: string | null | undefined) => (nome ?? "").match(/^\s*(\d{2}(?:\.\d{2}){1,2})/)?.[1] ?? null;

/** Maturidade principal = nível 1–5 / gate; a nota da avaliação fica só no detalhe. */
export function rotuloMaturidade(nivel: number | null | undefined, gate?: string | null): string | null {
  if (nivel == null && !gate) return null;
  return [nivel != null ? `Nível ${Number(nivel).toFixed(nivel % 1 ? 1 : 0)}` : null, gate || null].filter(Boolean).join(" · ");
}

/** Grau de impacto: Direto/Indireto + grau hoje→alvo. */
export function rotuloGrau(hoje: number | null | undefined, alvo: number | null | undefined) {
  if (hoje == null && alvo == null) return null;
  return `${hoje ?? "—"} → ${alvo ?? "—"}`;
}

/** Melhorias entram só em andamento ou implantadas. */
export const melhoriaRelevante = (status: string | null | undefined) => /andamento|implant/i.test(status ?? "");

/** Divergências entre a lista local e o espelho: código, nome e maturidade. */
export function divergencias(local: { id: string; nome: string; maturidade: number | null }[], espelho: { codigo: string | null; nome: string | null; maturidade_nivel: number | null }[]) {
  const loc = new Map(local.map((l) => [codigoDoNome(l.nome) ?? l.id, l]));
  const esp = new Map(espelho.filter((e) => e.codigo).map((e) => [e.codigo!, e]));
  const out: { codigo: string; tipo: "so_local" | "so_zeev" | "nome" | "maturidade"; local?: string; zeev?: string }[] = [];
  for (const [c, l] of loc) {
    const e = esp.get(c);
    if (!e) { out.push({ codigo: c, tipo: "so_local", local: l.nome }); continue; }
    const nomeLocal = l.nome.replace(/^\s*[\d.]+\s*[–-]\s*/, "").trim();
    if ((e.nome ?? "").trim().toLowerCase() !== nomeLocal.toLowerCase()) out.push({ codigo: c, tipo: "nome", local: nomeLocal, zeev: e.nome ?? "" });
    if (l.maturidade != null && e.maturidade_nivel != null && Number(l.maturidade) !== Number(e.maturidade_nivel)) out.push({ codigo: c, tipo: "maturidade", local: String(l.maturidade), zeev: String(e.maturidade_nivel) });
  }
  for (const [c, e] of esp) if (!loc.has(c)) out.push({ codigo: c, tipo: "so_zeev", zeev: e.nome ?? "" });
  return out;
}
