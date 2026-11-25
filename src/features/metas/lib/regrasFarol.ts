/**
 * Regras do farol configuráveis pela Governança (pedido da Naira, 25/11/2026).
 * - Faixa geral do amarelo: vale para todos os indicadores (padrão 5%, parâmetro x07 do glossário).
 * - Exceção por indicador: substitui a faixa geral só naquele indicador.
 * A tolerância cadastrada no próprio indicador (na unidade da meta, em Cadastros) continua tendo prioridade,
 * como em src/lib/farol.ts. Sem as tabelas no banco, vale o padrão de 5%: nada muda para quem usa.
 */
import { TOLERANCIA_PADRAO_PCT } from "@/lib/farol";

export type ExcecaoFarol = { pct: number; motivo: string | null };
export type RegrasFarol = { geralPct: number; excecoes: Record<string, ExcecaoFarol>; ativas: boolean };
export const REGRAS_PADRAO: RegrasFarol = { geralPct: TOLERANCIA_PADRAO_PCT, excecoes: {}, ativas: false };
/** Limite aceito pelo banco (mt_farol_salvar): de 0% a 50% da meta. */
export const PCT_MAXIMO = 0.5;

type LinhaGeral = { amarelo_pct: number | string | null } | null | undefined;
type LinhaExcecao = { indicador_id: string; amarelo_pct: number | string; motivo?: string | null; ativo?: boolean | null };

export function montarRegras(geral: LinhaGeral, excecoes: LinhaExcecao[] | null | undefined): RegrasFarol {
  const g = geral?.amarelo_pct == null ? NaN : Number(geral.amarelo_pct);
  const r: RegrasFarol = { geralPct: Number.isFinite(g) ? g : TOLERANCIA_PADRAO_PCT, excecoes: {}, ativas: !!geral };
  for (const e of excecoes ?? []) {
    const p = Number(e.amarelo_pct);
    if (e.ativo === false || !Number.isFinite(p)) continue;
    r.excecoes[e.indicador_id] = { pct: p, motivo: e.motivo ?? null };
  }
  return r;
}

/** Faixa do amarelo que vale para o indicador: a exceção dele, ou a faixa geral. */
export function pctDoIndicador(r: RegrasFarol | null | undefined, indicadorId: string): number {
  const regras = r ?? REGRAS_PADRAO;
  return regras.excecoes[indicadorId]?.pct ?? regras.geralPct;
}

/** "5", "5%", "2,5" → 0,05 / 0,05 / 0,025. Vazio, texto ou fora de 0% a 50% → null. */
export function lerPct(txt: string): number | null {
  const limpo = txt.replace("%", "").trim().replace(",", ".");
  if (limpo === "" || !/^\d+(\.\d+)?$/.test(limpo)) return null;
  const p = Number(limpo) / 100;
  return p >= 0 && p <= PCT_MAXIMO ? Math.round(p * 1e6) / 1e6 : null;
}

export const fmtPct = (p: number) => `${(p * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/** Exemplo de leitura da regra para quem configura: "Meta 100: verde a partir de 100, amarelo de 95 a 99,99, vermelho abaixo de 95". */
export function exemploFaixa(pct: number, meta = 100): string {
  const limite = meta * (1 - pct);
  const n = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  if (pct === 0) return `Meta ${n(meta)}: verde a partir de ${n(meta)}; abaixo disso, vermelho (sem amarelo).`;
  return `Meta ${n(meta)} (maior é melhor): verde a partir de ${n(meta)}, amarelo de ${n(limite)} até abaixo de ${n(meta)}, vermelho abaixo de ${n(limite)}.`;
}
