export const INICIO_FREQUENCIA = "2026-10-26";
export const FREQUENCIAS = ["semanal", "quinzenal", "mensal", "trimestral", "semestral"] as const;
export type Frequencia = typeof FREQUENCIAS[number];
export const FREQUENCIA_LBL: Record<Frequencia, string> = { semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral" };
export const TRATAMENTOS = ["Pilotar", "Suavizar", "Vigiar por exceção", "Revisar"] as const;
export type CalendarioKpi = { frequencia?: Frequencia | null; mes_ciclo?: number | null; semana_mes?: number | null; frequencia_inicio?: string | null; origem_frequencia?: string | null; tratamento?: string | null };
const dia = (s: string) => new Date(`${s}T12:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
export function semanaDoMes(ciclo: string): number { return Math.floor((dia(ciclo).getUTCDate() - 1) / 7) + 1; }
export function devidoNoCiclo(k: CalendarioKpi, ciclo: string, critico = false): boolean {
  if (!k.frequencia || ciclo < (k.frequencia_inicio ?? INICIO_FREQUENCIA)) return true;
  const d = dia(ciclo), semana = semanaDoMes(ciclo), mes = d.getUTCMonth();
  if (d.getUTCDay() !== 1) return false;
  if (critico) return semana === (k.semana_mes ?? 1);
  if (k.frequencia === "semanal") return true;
  if (semana === 5) return false;
  if (k.frequencia === "quinzenal") return semana === 1 || semana === 3;
  if (semana !== (k.semana_mes ?? 1)) return false;
  if (k.frequencia === "trimestral") return mes % 3 + 1 === (k.mes_ciclo ?? 1);
  if (k.frequencia === "semestral") return mes % 6 + 1 === (k.mes_ciclo ?? 1);
  return true;
}
export function segundasMes(comp: string): string[] {
  const [ano, mes] = comp.split("-").map(Number); const out: string[] = [];
  const d = new Date(Date.UTC(ano, mes - 1, 1, 12));
  while (d.getUTCMonth() === mes - 1) { if (d.getUTCDay() === 1) out.push(iso(d)); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}
export const previstoNoMes = (k: CalendarioKpi, comp: string) => segundasMes(comp).some(c => devidoNoCiclo(k, c));
export type PeriodoApontamento = { chave: string; label: string; inicio: string; fim: string; competencia: string };
export function periodoApontamento(k: CalendarioKpi, ciclo: string, critico = false): PeriodoApontamento {
  const d = dia(ciclo), y = d.getUTCFullYear(), m = d.getUTCMonth();
  const f = critico ? "mensal" : k.frequencia ?? "mensal";
  if (f === "semanal" || f === "quinzenal") {
    const fim = new Date(d); fim.setUTCDate(fim.getUTCDate() - 1);
    const ini = new Date(d); ini.setUTCDate(ini.getUTCDate() - (f === "semanal" ? 7 : 14));
    return { chave: `${iso(ini)}/${iso(fim)}`, label: `${iso(ini)} a ${iso(fim)}`, inicio: iso(ini), fim: iso(fim), competencia: iso(fim).slice(0, 7) };
  }
  const n = f === "trimestral" ? 3 : f === "semestral" ? 6 : 1;
  const corte = Math.floor(m / n) * n;
  const ini = new Date(Date.UTC(y, corte - n, 1, 12)), fim = new Date(Date.UTC(y, corte, 0, 12));
  const label = f === "trimestral" ? `${Math.floor(ini.getUTCMonth() / 3) + 1}º tri ${ini.getUTCFullYear()}` : f === "semestral" ? `${Math.floor(ini.getUTCMonth() / 6) + 1}º sem ${ini.getUTCFullYear()}` : new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" }).format(ini);
  return { chave: `${iso(ini)}/${iso(fim)}`, label, inicio: iso(ini), fim: iso(fim), competencia: iso(fim).slice(0, 7) };
}
export function registrarLeituraNormal(estado: { normais: number; ultimoPeriodo: string | null; ativo: boolean }, periodo: string, normal: boolean) {
  if (!estado.ativo || periodo === estado.ultimoPeriodo) return estado;
  const normais = normal ? estado.normais + 1 : 0;
  return { normais, ultimoPeriodo: periodo, ativo: normais < 2 };
}
export const resumoFrequencia = (k: CalendarioKpi) => !k.frequencia ? "Sem classificação" : `${FREQUENCIA_LBL[k.frequencia]}${["trimestral", "semestral"].includes(k.frequencia) ? ` · mês ${k.mes_ciclo ?? 1}` : ""}${k.frequencia === "quinzenal" ? " · semanas 1 e 3" : k.frequencia === "semanal" ? " · todas" : ` · semana ${k.semana_mes ?? 1}`}`;