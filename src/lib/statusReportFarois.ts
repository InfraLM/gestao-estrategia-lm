export type CorFarol = "verde" | "amarelo" | "vermelho";
export type FarolDimensao = { dimensao: string; status: CorFarol; obs: string };

/** Historical NULL stays unknown; never manufacture saved green lights. */
export function lerFarois(valor: unknown): FarolDimensao[] | null {
  if (!Array.isArray(valor)) return null;
  return valor.filter((item): item is FarolDimensao =>
    !!item && typeof item.dimensao === "string" &&
    ["verde", "amarelo", "vermelho"].includes(item.status) && typeof item.obs === "string",
  );
}

export function faroisParaEdicao(salvos: unknown, base?: FarolDimensao[]): FarolDimensao[] {
  return (lerFarois(salvos) ?? base ?? [
    { dimensao: "Escopo", status: "verde", obs: "—" },
    { dimensao: "Cronograma", status: "verde", obs: "—" },
    { dimensao: "Custo", status: "verde", obs: "—" },
    { dimensao: "Riscos", status: "verde", obs: "—" },
  ]).map(item => ({ ...item }));
}