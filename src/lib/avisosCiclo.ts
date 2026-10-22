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
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
export function mensagemAviso(d: DestinatarioAviso, ciclo: string) {
  if (!semanaLink(ciclo)) throw new Error("Ciclo inválido");
  const url = `https://gestao-estrategia-lm.lovable.app/metas/semanal?semana=${ciclo}`;
  const p = d.pendencias;
  const text = `Olá, ${d.nome}.\nCiclo de ${ciclo}. Prazo: segunda-feira, ${ciclo}, às 23h59 (São Paulo).\nPendentes: ${p.prioridades} prioridade(s), ${p.kpis} KPI(s), ${p.atas} pendência(s) de atas e ${p.status_reports} status report(s).\nAbrir meu check-in/checkout: ${url}`;
  return { subject: `Check-in/checkout · ciclo ${ciclo}`, text, html: `<p>Olá, ${escape(d.nome)}.</p><p>Ciclo de ${ciclo}. Prazo: segunda-feira às 23h59 (São Paulo).</p><p>Pendentes: ${p.prioridades} prioridade(s), ${p.kpis} KPI(s), ${p.atas} pendência(s) de atas e ${p.status_reports} status report(s).</p><p><a href="${url}">Abrir meu check-in/checkout</a></p>` };
}