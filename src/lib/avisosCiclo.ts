import { montarEmail } from "../../supabase/functions/rotina-avisos-enviar/email";
/** Only explicitly allowlisted weekly destinations survive login. */
export function semanaLink(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getUTCDay() === 1 ? value : null;
}
export type PendenciasAviso = { prioridades: number; kpis: number; atas: number; status_reports: number };
export type DestinatarioAviso = { cadeira_id: string; cadeira: string; usuario_id: string | null; nome: string; email: string | null; motivo: string | null; enviado: boolean; pendencias: PendenciasAviso };
export function cronSemanal(dia: number, hora: string) {
  if (!Number.isInteger(dia) || dia < 0 || dia > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) throw new Error("Horário inválido");
  const [h, m] = hora.split(":").map(Number);
  const utc = h + 3;
  return `${m} ${utc % 24} * * ${(dia + Math.floor(utc / 24)) % 7}`;
}
export const podeReceberAviso = (d: DestinatarioAviso, tipo: "abertura" | "lembrete" | "manual") => !d.motivo && (tipo === "abertura" || !d.enviado);
/** Same template the Gmail worker sends, so the Governance preview matches the real e-mail. */
export function mensagemAviso(d: DestinatarioAviso, ciclo: string, tipo: "abertura" | "lembrete" | "manual" = "abertura") {
  if (!semanaLink(ciclo)) throw new Error("Ciclo inválido");
  return montarEmail({ nome: d.nome, ciclo, tipo, pendencias: d.pendencias });
}
/** Weekly e-mail allowlist: null = every eligible chair receives automatic notices. */
export const recebeAutomatico = (email: string | null, lista: string[] | null) => !!email && (lista === null || lista.includes(email.trim().toLowerCase()));
/** Toggling starts from "everyone eligible" when no list exists yet; result is normalized and sorted. */
export function alternarPermitido(lista: string[] | null, elegiveis: string[], email: string, recebe: boolean): string[] {
  const base = new Set((lista ?? elegiveis).map(e => e.trim().toLowerCase()));
  const alvo = email.trim().toLowerCase();
  if (recebe) base.add(alvo); else base.delete(alvo);
  return [...base].filter(Boolean).sort();
}
