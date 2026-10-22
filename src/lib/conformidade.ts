/** Taxa de conformidade do preenchimento do ciclo semanal (substitui a nota mensal na tela).
 *  Regras da Naira: conforme = no prazo E completude ≥ 90%; conta a partir do ciclo de 26/10/2026 (checkout da semana de 19/10); todos os diretores, Governança e CEO veem todas as cadeiras. */
import type { CheckoutV2, CheckinV2 } from "@/lib/rotinaSemanal";
import { addDias } from "@/lib/rotinaSemanal";

/** Primeiro ciclo devido: 26/10/2026 = checkout da semana de 19/10. */
export const INICIO_CONFORMIDADE = "2026-10-19";
export const COMPLETUDE_MINIMA = 0.9;

export type Completude = { feitos: number; total: number; faltando: string[] };

/** Itens obrigatórios do ciclo: KPI V com valor; S com declaração (+ justificativa se Off); E com status;
 *  ao menos uma prioridade; toda pendência de ata com status; status report dos projetos no último ciclo do mês. */
export function calcularCompletude(co: CheckoutV2, ci: CheckinV2, sr: { total: number; completos: number } | null): Completude {
  let feitos = 0, total = 0; const faltando: string[] = [];
  const conta = (ok: boolean, txt: string) => { total++; if (ok) feitos++; else faltando.push(txt); };
  for (const k of co.kpis_retrato ?? []) {
    const r = co.kpis_resposta.find((x) => x.indicador_id === k.indicador_id);
    const tipo = k.tipo_apontamento ?? "valor_mensal";
    if (r?.desvio_critico) conta(!!r.situacao_atual?.trim()&&!!r.causa?.trim()&&!!r.impacto?.trim()&&!!r.plano?.trim(),`${k.codigo}: desvio crítico`);
    else if (tipo === "entrega") conta(!!r?.status_entrega, `${k.codigo}: status de entrega`);
    else if (tipo === "valor_periodo") conta(!!r?.declaracao && (r.declaracao === "on" || !!r.justificativa?.trim()), `${k.codigo}: declaração On/Off`);
    else conta(!!r?.situacao_atual?.trim() || k.realizado != null, `${k.codigo}: valor apontado`);
  }
  conta(ci.prioridades.some((p) => p.titulo?.trim()), "Prioridades da semana seguinte");
  for (const a of co.atas ?? []) conta(!!a.status, `Pendência de ata: ${a.titulo}`);
  if (sr && sr.total > 0) for (let i = 0; i < sr.total; i++) conta(i < sr.completos, "Status report de projeto");
  return { feitos, total, faltando };
}

/** Prazo do checkout da semana S (segunda a domingo): segunda seguinte 23h59 em São Paulo. */
export const prazoCheckout = (semana: string) => new Date(`${addDias(semana, 7)}T23:59:59-03:00`);

export type RegCiclo = { cadeira_id: string; semana: string; status: string; enviado_em: string | null; primeiro_envio_em: string | null; completude: Completude | null };
export type CicloAval = { semana: string; enviado: boolean; noPrazo: boolean; completude: number | null; conforme: boolean };

/** Semanas de checkout cujo prazo já venceu (ciclos devidos). */
export function semanasDevidas(de: string, agora = new Date()): string[] {
  const out: string[] = [];
  for (let s = de; prazoCheckout(s) < agora; s = addDias(s, 7)) out.push(s);
  return out;
}

export function avaliarCiclo(semana: string, r: RegCiclo | undefined): CicloAval {
  if (!r || r.status !== "enviado") return { semana, enviado: false, noPrazo: false, completude: null, conforme: false };
  const envio = r.primeiro_envio_em ?? r.enviado_em;
  // Reenvio depois do prazo conta como atrasado.
  const noPrazo = !!envio && new Date(envio) <= prazoCheckout(semana) && (!r.enviado_em || new Date(r.enviado_em) <= prazoCheckout(semana));
  const c = r.completude && r.completude.total > 0 ? r.completude.feitos / r.completude.total : null;
  return { semana, enviado: true, noPrazo, completude: c, conforme: noPrazo && c != null && c >= COMPLETUDE_MINIMA };
}

export type Taxa = { devidos: number; conformes: number; taxa: number | null; pontualidade: number | null; completudeMedia: number | null };
export function taxa(ciclos: CicloAval[]): Taxa {
  const d = ciclos.length;
  const cs = ciclos.filter((c) => c.completude != null).map((c) => c.completude!);
  return {
    devidos: d, conformes: ciclos.filter((c) => c.conforme).length,
    taxa: d ? ciclos.filter((c) => c.conforme).length / d : null,
    pontualidade: d ? ciclos.filter((c) => c.noPrazo).length / d : null,
    completudeMedia: d ? cs.reduce((a, b) => a + b, 0) / d : null,
  };
}

/** Conformidade por cadeira: por mês (pelo domingo da semana) e acumulado; tendência = mês atual − anterior. */
export function conformidadeCadeira(cadeira: string, regs: RegCiclo[], agora = new Date(), de = INICIO_CONFORMIDADE) {
  const ciclos = semanasDevidas(de, agora).map((s) => avaliarCiclo(s, regs.find((r) => r.cadeira_id === cadeira && r.semana === s)));
  const mesDe = (s: string) => addDias(s, 6).slice(0, 7);
  const meses = [...new Set(ciclos.map((c) => mesDe(c.semana)))].sort();
  const porMes = Object.fromEntries(meses.map((m) => [m, taxa(ciclos.filter((c) => mesDe(c.semana) === m))]));
  const [a, b] = [porMes[meses[meses.length - 1]]?.taxa, porMes[meses[meses.length - 2]]?.taxa];
  return { ciclos, acumulado: taxa(ciclos), porMes, tendencia: a != null && b != null ? a - b : null };
}
