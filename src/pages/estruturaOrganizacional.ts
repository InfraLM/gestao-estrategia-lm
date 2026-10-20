import type { Database } from "@/integrations/supabase/types";
import { semAcentos } from "./contextoDecisoes";

export type Cadeira = Database["public"]["Tables"]["org_cadeiras"]["Row"];
export type NoCadeira = { cadeira: Cadeira; filhos: NoCadeira[] };
export const NIVEIS = {
  diretoria: "Diretoria", gerencia: "Gerência", coordenacao: "Coordenação",
  po: "PO", supervisao: "Supervisão", outro: "Dono de workflow",
};
export function rotuloNivel(nivel: string | null) {
  return nivel && nivel in NIVEIS ? NIVEIS[nivel as keyof typeof NIVEIS] : nivel || "—";
}
export function ordenarCadeiras(cadeiras: Cadeira[]) {
  return [...cadeiras].sort((a, b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity) || a.nome.localeCompare(b.nome, "pt-BR") || a.id.localeCompare(b.id));
}
export function montarArvore(cadeiras: Cadeira[]): NoCadeira[] {
  const ordenadas = ordenarCadeiras(cadeiras);
  const nos = new Map(ordenadas.map(cadeira => [cadeira.id, { cadeira, filhos: [] } as NoCadeira]));
  const raizes: NoCadeira[] = [];
  for (const cadeira of ordenadas) {
    const no = nos.get(cadeira.id);
    if (!no) continue;
    const pai = cadeira.cadeira_pai_id ? nos.get(cadeira.cadeira_pai_id) : undefined;
    const visitados = new Set([cadeira.id]);
    let ancestral = pai;
    let ciclo = false;
    while (ancestral) {
      if (visitados.has(ancestral.cadeira.id)) { ciclo = true; break; }
      visitados.add(ancestral.cadeira.id);
      ancestral = ancestral.cadeira.cadeira_pai_id ? nos.get(ancestral.cadeira.cadeira_pai_id) : undefined;
    }
    if (pai && !ciclo) pai.filhos.push(no);
    else raizes.push(no);
  }
  return raizes;
}
export function filtrarCadeiras(cadeiras: Cadeira[], busca: string, nivel: string) {
  const termo = semAcentos(busca.trim());
  return ordenarCadeiras(cadeiras).filter(c => (nivel === "todos" || c.nivel === nivel)
    && (!termo || [c.nome, c.ocupante_nome, c.missao, c.entregas, c.e_o_d_de, c.nao_e_o_d_de, c.indicadores_rotina, c.processos, c.notas, rotuloNivel(c.nivel)]
      .some(texto => semAcentos(texto ?? "").includes(termo))));
}