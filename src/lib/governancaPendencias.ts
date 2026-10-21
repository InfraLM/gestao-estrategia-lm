export type GovAcao = {
  id: string; origem_id: string; titulo: string; descricao: string | null;
  responsavel_origem: string | null; prazo: string | null; status: string | null;
  prioridade: string | null; precisa_escalar: boolean | null; comite_codigo: string | null;
  reuniao_titulo: string | null; reuniao_data: string | null; outros_responsaveis: string[];
};
export type PrioridadeSemanal = { titulo: string; iniciativa_id: string; resultado: string; gov_acao_id?: string; gov_comite_codigo?: string };
export function hojeLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function seloPrazo(prazo: string | null, hoje = hojeLocal()) {
  return !prazo ? "Sem prazo" : prazo < hoje ? "Vencida" : "data";
}
export function ordenarPendencias(acoes: GovAcao[], hoje = hojeLocal()) {
  return [...acoes].sort((a, b) => {
    const grupo = (x: GovAcao) => !x.prazo ? 2 : x.prazo < hoje ? 0 : 1;
    return grupo(a) - grupo(b) || (a.prazo ?? "").localeCompare(b.prazo ?? "") || a.titulo.localeCompare(b.titulo);
  });
}
export function contarPendencias(acoes: GovAcao[], hoje = hojeLocal()) {
  return { total: acoes.length, vencidas: acoes.filter(a => seloPrazo(a.prazo, hoje) === "Vencida").length, semPrazo: acoes.filter(a => !a.prazo).length };
}
export function puxarAcao(prioridades: PrioridadeSemanal[], acao: GovAcao) {
  if (prioridades.some(p => p.gov_acao_id === acao.id)) return { prioridades, erro: "duplicada" as const };
  if (prioridades.length >= 5) return { prioridades, erro: "cheio" as const };
  return { prioridades: [...prioridades, { titulo: acao.titulo, iniciativa_id: "", resultado: "", gov_acao_id: acao.id, gov_comite_codigo: acao.comite_codigo ?? "" }], erro: null };
}
export function entregasDoCheckin(prioridades: PrioridadeSemanal[]) {
  return prioridades.filter(p => p.titulo).map(p => ({ titulo: p.titulo, status: "" as const, motivo: "", iniciativa_id: p.iniciativa_id,
    ...(p.gov_acao_id ? { gov_acao_id: p.gov_acao_id, gov_comite_codigo: p.gov_comite_codigo } : {}) }));
}