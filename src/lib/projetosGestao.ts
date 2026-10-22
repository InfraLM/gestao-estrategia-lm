import { addDias, semanaCheckout } from "@/lib/rotinaSemanal";

/** Status que exigem status report mensal. Backlog, Concluído e Cancelado ficam fora. */
export const STATUS_EM_ABERTO = ["Em Andamento", "Atrasado", "Pausado", "A Iniciar"];
export const projetoEmAberto = (status: string | null | undefined) => !!status && STATUS_EM_ABERTO.includes(status);

/**
 * Ciclo S é o último apontamento do mês M quando o domingo da semana do checkout (S−7)
 * cai em M e o domingo da semana seguinte (S) já está em outro mês.
 */
export function ultimoCicloDoMes(ciclo: string): string | null {
  const dom = addDias(semanaCheckout(ciclo), 6);
  const prox = addDias(dom, 7);
  return dom.slice(0, 7) !== prox.slice(0, 7) ? dom.slice(0, 7) : null;
}

export type Farol = "verde" | "amarelo" | "vermelho";
export const FAROIS: Farol[] = ["verde", "amarelo", "vermelho"];
export const FAROL_LBL: Record<string, string> = { verde: "Verde", amarelo: "Amarelo", vermelho: "Vermelho" };
export const temDesvio = (r: { farol_escopo?: string | null; farol_custo?: string | null; farol_cronograma?: string | null } | null | undefined) =>
  !!r && [r.farol_escopo, r.farol_custo, r.farol_cronograma].some((f) => f === "amarelo" || f === "vermelho");

export const DECISOES: Record<string, string> = {
  manter_aceite: "Manter com aceite de desvios e projeções",
  manter_ajustes: "Manter com ajustes",
  suspender: "Suspender",
  replanejar: "Replanejar (nova linha de base)",
  encerrar: "Encerrar",
};
export const SITUACOES: Record<string, string> = {
  em_andamento: "Em andamento", concluido: "Concluído", suspenso: "Suspenso", cancelado: "Cancelado", nao_e_meu: "Não é meu",
};

/** Decisão pendente: há desvio no último report e nenhuma decisão registrada naquela competência. */
export const decisaoPendente = (ultimo: any, decisoes: { competencia: string }[]) =>
  temDesvio(ultimo) && !decisoes.some((d) => d.competencia === ultimo.competencia);

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const CARGO: [RegExp, string][] = [
  [/\bceo\b/, "CEO"], [/\bcfo\b/, "CFO"], [/\bcmo\b/, "CMO"], [/\bcoo\b|operac/, "COO"], [/\bcro\b|\bcpto\b/, "CPTO"], [/\bcppo\b/, "CPPO (Processos e Pessoas)"],
  [/comercial|novos negocios/, "Comercial"], [/governanca/, "Governança"], [/juridico|institucional/, "Institucional"],
];
/** Sugere cadeiras (principal primeiro) a partir do texto livre do diretor. Nunca grava: é só sugestão. */
export function sugerirCadeiras(diretor: string | null | undefined, cadeiras: { id: string; nome: string; diretor_nome?: string | null }[]): string[] {
  if (!diretor || /nao atribu/.test(norm(diretor))) return [];
  const out: string[] = [];
  for (const parte of diretor.split(/\+|\//).map((x) => norm(x.trim())).filter(Boolean)) {
    let id: string | undefined;
    for (const [re, nome] of CARGO) if (re.test(parte)) { id = cadeiras.find((c) => norm(c.nome).startsWith(norm(nome)))?.id; if (id) break; }
    if (!id) {
      const pn = parte.split(/\s+/)[0];
      id = cadeiras.find((c) => c.diretor_nome && norm(c.diretor_nome).split(/\s+/)[0] === pn)?.id;
    }
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export type VincIni = { iniciativa_id: string; tipo: string; ref_id: string };
/** Empilha iniciativas por item: vínculo principal (indicador/okr/objetivo) + vínculos secundários. */
export function iniciativasDoItem<T extends { id: string; indicador_id?: string | null; okr_id?: string | null; objetivo_id?: string | null }>(
  inis: T[], vinc: VincIni[], refs: string[], projeto?: string,
): T[] {
  const set = new Set(refs);
  return inis.filter((i) =>
    (i.indicador_id && set.has(i.indicador_id)) || (i.okr_id && set.has(i.okr_id)) || (i.objetivo_id && set.has(i.objetivo_id)) ||
    vinc.some((v) => v.iniciativa_id === i.id && (set.has(v.ref_id) || (projeto && v.tipo === "projeto" && v.ref_id === projeto))));
}

export const podeDecidir = (p: { governanca: boolean; ceo: boolean }) => p.governanca || p.ceo;

/** Status reports pendentes no mês por cadeira principal: projeto em aberto sem anexo ou sem os três faróis. */
export function srPendentesPorCadeira(projetos: { codigo: string; status: string | null; cadeira_id: string | null }[], regs: { projeto_codigo: string; arquivo_path?: string | null; farol_escopo?: string | null; farol_custo?: string | null; farol_cronograma?: string | null }[]) {
  const out: Record<string, { total: number; pendentes: string[] }> = {};
  for (const p of projetos) {
    if (!p.cadeira_id || !projetoEmAberto(p.status)) continue;
    const r = regs.find((x) => x.projeto_codigo === p.codigo);
    const o = (out[p.cadeira_id] ??= { total: 0, pendentes: [] }); o.total++;
    if (!r?.arquivo_path || !r?.farol_escopo || !r?.farol_custo || !r?.farol_cronograma) o.pendentes.push(p.codigo);
  }
  return out;
}
