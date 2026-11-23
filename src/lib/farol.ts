/**
 * Farol de 3 cores (glossário da LM, termo "Farol" e parâmetro x07 "Tolerância do amarelo").
 * Camada por cima da avaliação On/Off (avaliarPorTipo): não muda a regra de on/off, a conformidade nem os painéis.
 * - verde: na meta (On track);
 * - amarelo: abaixo da meta, dentro da tolerância (padrão: até 5% da meta; ou a tolerância cadastrada no indicador,
 *   na unidade da meta, quando houver);
 * - vermelho: fora da tolerância, ou Off track sem número para medir a distância (declarado pelo diretor ou entrega).
 * Sem farol (null) quando ainda não há avaliação: em acompanhamento, pendente, sem meta ou encerrada.
 */
import { lerMeta, type Avaliacao, type MetaLida } from "./avaliacaoBsc";

export type CorFarol = "verde" | "amarelo" | "vermelho";
export const FAROL_LBL: Record<CorFarol, string> = { verde: "Verde", amarelo: "Amarelo", vermelho: "Vermelho" };
/** Ponto de partida do glossário (x07): até 5% abaixo da meta. */
export const TOLERANCIA_PADRAO_PCT = 0.05;

export type EntradaFarol = {
  aval: Avaliacao;
  valor: number | null;
  meta: number | string | null;
  sentido: "maior" | "menor";
  /** Tolerância cadastrada no indicador, na unidade da meta (mt_indicadores.tolerancia). */
  tolerancia?: number | null;
  /** Percentual padrão; só para testes ou futura configuração. */
  toleranciaPct?: number;
};

/** Quanto falta para a meta, na unidade da meta (0 quando cumpre). */
export function distanciaDaMeta(valor: number, meta: MetaLida, sentido: "maior" | "menor"): number {
  if (meta.tipo === "faixa") return valor < meta.min ? meta.min - valor : valor > meta.max ? valor - meta.max : 0;
  const s = meta.sentido ?? sentido;
  return s === "maior" ? Math.max(0, meta.v - valor) : Math.max(0, valor - meta.v);
}

/** Folga aceita como amarelo, na unidade da meta. */
export function folgaAmarelo(meta: MetaLida, valor: number, tolerancia?: number | null, pct = TOLERANCIA_PADRAO_PCT): number {
  if (tolerancia != null && Number.isFinite(tolerancia) && tolerancia > 0) return tolerancia;
  const ref = meta.tipo === "faixa" ? (valor < meta.min ? meta.min : meta.max) : meta.v;
  return Math.abs(ref) * pct;
}

export function farol(e: EntradaFarol): CorFarol | null {
  if (e.aval !== "on" && e.aval !== "off") return null;
  const meta = lerMeta(e.meta);
  // On track só por causa da tolerância cadastrada (abaixo da meta "pura"): pelo glossário, é amarelo.
  if (e.aval === "on") return meta && e.valor != null && Number.isFinite(e.valor) && distanciaDaMeta(e.valor, meta, e.sentido) > 0 ? "amarelo" : "verde";
  if (e.valor == null || !Number.isFinite(e.valor) || !meta) return "vermelho";
  const falta = distanciaDaMeta(e.valor, meta, e.sentido);
  if (falta === 0) return "verde";
  return falta <= folgaAmarelo(meta, e.valor, e.tolerancia, e.toleranciaPct) + 1e-9 ? "amarelo" : "vermelho";
}

export function contarFarol(lista: (CorFarol | null)[]) {
  const n = (c: CorFarol | null) => lista.filter((x) => x === c).length;
  return { verde: n("verde"), amarelo: n("amarelo"), vermelho: n("vermelho"), sem_farol: n(null) };
}
