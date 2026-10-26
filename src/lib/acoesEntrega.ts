// Regras puras da janela de 3 meses, da fila "aguardando avaliação" e das entregas por ação (item 2 do checkout).
// Espelham as funções do banco (rotina_dentro_janela, rotina_ata_da_cadeira, rotina_acao_guard) para a tela e os testes.

export const JANELA_MESES = 3;
export type Gestao = { tipo: "ata" | "prioridade" | "impedimento"; item_ref: string; cadeira_id: string | null; reativada_ciclo: string | null; baixada_em: string | null };

export function inicioJanela(ciclo: string) {
  const d = new Date(`${ciclo}T12:00:00Z`); const dia = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - JANELA_MESES);
  const fim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, fim));
  return d.toISOString().slice(0, 10);
}

/** Dentro da janela: origem (ou reativação) nos últimos 3 meses e não baixada pela Governança. */
export function dentroJanela(tipo: Gestao["tipo"], ref: string, origem: string | null | undefined, ciclo: string, gestao: Gestao[]) {
  const g = gestao.find((x) => x.tipo === tipo && x.item_ref === ref);
  if (g?.baixada_em) return false;
  if (tipo === "impedimento") return true; // impedimentos atribuídos empilham até resolver/encerrar, sem janela
  const efetiva = [origem?.slice(0, 10), g?.reativada_ciclo ?? undefined].filter(Boolean).sort().pop();
  return !!efetiva && efetiva >= inicioJanela(ciclo);
}

export const refPrioridade = (semana: string, e: { prioridade_id?: string; titulo: string }) => `${semana}|${e.prioridade_id || e.titulo}`;

/** Filtra prioridades herdadas pela janela (as antigas vão para a lista da Governança). */
export function filtrarHerdadasJanela<T extends { herdada_de?: string; prioridade_id?: string; titulo: string }>(herdadas: T[], ciclo: string, gestao: Gestao[]) {
  return herdadas.filter((h) => !h.herdada_de || dentroJanela("prioridade", refPrioridade(h.herdada_de, h), h.herdada_de, ciclo, gestao));
}

// ---------- Atas: endereçada × sem dono ----------
export type AtaLite = { id: string; responsavel_origem?: string | null; responsavel_email?: string | null; responsavel_normalizado?: string | null };
export type MapaResp = { email: Record<string, string>; nome: Record<string, string[]> }; // email do diretor → cadeira; nome normalizado → cadeiras
export function cadeirasDaAta(a: AtaLite, mapa: MapaResp, gestao: Gestao[]): string[] {
  const g = gestao.find((x) => x.tipo === "ata" && x.item_ref === a.id);
  if (g?.cadeira_id) return [g.cadeira_id];
  const email = a.responsavel_email?.trim().toLowerCase();
  if (email) return mapa.email[email] ? [mapa.email[email]] : [];
  return a.responsavel_normalizado ? mapa.nome[a.responsavel_normalizado] ?? [] : [];
}
export function classificarAta(a: AtaLite, mapa: MapaResp, gestao: Gestao[]): "enderecada" | "aguardando" | "baixada" {
  if (gestao.some((x) => x.tipo === "ata" && x.item_ref === a.id && x.baixada_em)) return "baixada";
  return cadeirasDaAta(a, mapa, gestao).length ? "enderecada" : "aguardando";
}

// ---------- Entregas por ação ----------
export type Vinculo = { tipo: "objetivo" | "indicador"; ref_id: string; principal: boolean };
export type AcaoEntrega = {
  id?: string; cadeira_id?: string; ciclo_origem?: string; ciclo_atualizacao?: string;
  projeto_id: string | null; iniciativa_id: string | null; responsavel: string; descricao: string; vinculos: Vinculo[];
  status: "em_andamento" | "concluida" | "cancelada"; data_conclusao: string | null; data_prevista: string | null; motivo_cancelamento: string;
  updated_at?: string;
};
export const STATUS_ACAO_LBL: Record<AcaoEntrega["status"], string> = { em_andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" };
export const novaAcao = (): AcaoEntrega => ({ projeto_id: null, iniciativa_id: null, responsavel: "", descricao: "", vinculos: [], status: "em_andamento", data_conclusao: null, data_prevista: null, motivo_cancelamento: "" });

export function errosAcao(a: AcaoEntrega): Record<string, string> {
  const e: Record<string, string> = {};
  if (!a.descricao.trim()) e.descricao = "Descreva a entrega.";
  if (a.status === "concluida" && !a.data_conclusao) e.data_conclusao = "Informe a data de conclusão.";
  if (a.status === "em_andamento" && !a.data_prevista) e.data_prevista = "Informe a data prevista de conclusão.";
  if (a.status === "cancelada" && !a.motivo_cancelamento.trim()) e.motivo_cancelamento = "Informe o motivo do cancelamento.";
  return e;
}
export const acaoAtrasada = (a: Pick<AcaoEntrega, "status" | "data_prevista">, hoje: string) => a.status === "em_andamento" && !!a.data_prevista && a.data_prevista < hoje;

/** Ações que aparecem no ciclo: criadas/atualizadas nele, ou em andamento vindas de ciclos anteriores (carry-over). */
export function acoesDoCiclo<T extends AcaoEntrega>(acoes: T[], ciclo: string): (T & { empilhada: boolean })[] {
  return acoes
    .filter((a) => (a.ciclo_origem ?? ciclo) <= ciclo && (a.ciclo_origem === ciclo || a.ciclo_atualizacao === ciclo || a.status === "em_andamento"))
    .map((a) => ({ ...a, empilhada: (a.ciclo_origem ?? ciclo) < ciclo }))
    .sort((x, y) => Number(y.empilhada) - Number(x.empilhada) || (x.ciclo_origem ?? "").localeCompare(y.ciclo_origem ?? ""));
}
export const rotuloEmpilhada = (ciclo: string) => `Entrega em andamento · ciclo ${ciclo.slice(8, 10)}/${ciclo.slice(5, 7)}`;

export type ProjetoResp = { id: string; gerente?: string | null; diretor?: string | null };
export type IniciativaResp = { id: string; responsavel_nome?: string | null; indicador_id?: string | null };
/** Responsável sugerido: o do projeto/iniciativa; senão o da última ação vinculada a ele. */
export function responsavelSugerido(sel: { projeto_id: string | null; iniciativa_id: string | null }, projetos: ProjetoResp[], iniciativas: IniciativaResp[], anteriores: (AcaoEntrega & { updated_at?: string })[]) {
  let base = "";
  if (sel.projeto_id) { const p = projetos.find((x) => x.id === sel.projeto_id); base = (p?.gerente || p?.diretor || "").trim(); }
  if (sel.iniciativa_id) base = (iniciativas.find((x) => x.id === sel.iniciativa_id)?.responsavel_nome ?? "").trim();
  if (base) return base;
  const ult = anteriores
    .filter((a) => (sel.projeto_id && a.projeto_id === sel.projeto_id) || (sel.iniciativa_id && a.iniciativa_id === sel.iniciativa_id))
    .filter((a) => a.responsavel.trim())
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0];
  return ult?.responsavel.trim() ?? "";
}

type PV = { fonte_tipo: string; fonte_id: string; tipo: string; ref_id: string; impacto: string | null; status: string };
type AV = { iniciativa_id: string; tipo: string; ref_id: string; principal: boolean };
/** Vínculos sugeridos do projeto (portfolio_vinculos) ou da iniciativa (indicador principal + mt_acao_vinculos + portfolio_vinculos). Principal primeiro. */
export function vinculosSugeridos(sel: { projeto_id: string | null; iniciativa_id: string | null }, pv: PV[], av: AV[], iniciativas: IniciativaResp[]): Vinculo[] {
  const out: Vinculo[] = [];
  const add = (v: Vinculo) => { const i = out.findIndex((x) => x.tipo === v.tipo && x.ref_id === v.ref_id); if (i < 0) out.push(v); else if (v.principal) out[i].principal = true; };
  const fonte = sel.projeto_id ? { t: "projeto", id: sel.projeto_id } : sel.iniciativa_id ? { t: "iniciativa", id: sel.iniciativa_id } : null;
  if (!fonte) return [];
  if (sel.iniciativa_id) {
    const ini = iniciativas.find((x) => x.id === sel.iniciativa_id);
    if (ini?.indicador_id) add({ tipo: "indicador", ref_id: ini.indicador_id, principal: true });
    for (const v of av.filter((x) => x.iniciativa_id === sel.iniciativa_id)) add({ tipo: v.tipo === "objetivo" ? "objetivo" : "indicador", ref_id: v.ref_id, principal: v.principal });
  }
  for (const v of pv.filter((x) => x.fonte_tipo === fonte.t && x.fonte_id === fonte.id && x.status !== "removido" && (x.tipo === "objetivo" || x.tipo === "indicador")))
    add({ tipo: v.tipo as Vinculo["tipo"], ref_id: v.ref_id, principal: v.impacto === "principal" });
  return out.sort((a, b) => Number(b.principal) - Number(a.principal));
}
