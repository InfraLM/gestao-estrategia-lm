// Pure helpers (no Deno APIs) so they are shared by the edge function and the vitest suite.
export type Pendencias = { prioridades: number; kpis: number; atas: number; status_reports: number };
export type TipoAviso = "abertura" | "lembrete" | "manual";
export type Aviso = { nome: string; ciclo: string; tipo: TipoAviso; pendencias: Pendencias; teste?: boolean };

export const APP_URL = "https://gestao-estrategia-lm.lovable.app";
export const REMETENTE_PADRAO = "Gestão Estratégica LM <no-reply@liberdademedicaedu.com.br>";

/** Missing/empty secrets must never authorize scheduled requests. */
export function tokenValido(recebido: string | null, esperado: string | undefined): boolean {
  if (!recebido || !esperado || esperado.length < 32 || recebido.length !== esperado.length) return false;
  let d = 0;
  for (let i = 0; i < esperado.length; i++) d |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return d === 0;
}

/** Only validated Monday dates enter links. */
export function cicloValido(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value && d.getUTCDay() === 1;
}

/** Cycle shown on Friday is next Monday's; Monday to Thursday is the current one (São Paulo). */
export function cicloAtual(agora = new Date()): string {
  const sp = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const iso = ((sp.getDay() + 6) % 7) + 1; // 1 = Monday … 7 = Sunday
  const segunda = new Date(Date.UTC(sp.getFullYear(), sp.getMonth(), sp.getDate() - (iso - 1) + (iso >= 5 ? 7 : 0), 12));
  return segunda.toISOString().slice(0, 10);
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
const n = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.trunc(Number(v))) : 0);
const dataBr = (ciclo: string) => ciclo.split("-").reverse().join("/");

/** Only first name + own counts: no private content ever enters the e-mail. */
export function montarEmail(a: Aviso) {
  if (!cicloValido(a.ciclo)) throw new Error("Ciclo inválido");
  const p = { prioridades: n(a.pendencias?.prioridades), kpis: n(a.pendencias?.kpis), atas: n(a.pendencias?.atas), status_reports: n(a.pendencias?.status_reports) };
  const url = `${APP_URL}/metas/semanal?semana=${a.ciclo}`;
  const nome = (a.nome || "").trim().split(/\s+/)[0] || "diretor(a)";
  const prazo = `segunda-feira, ${dataBr(a.ciclo)}, às 23h59 (horário de São Paulo)`;
  const lembrete = a.tipo === "lembrete";
  const prefixo = a.teste ? "[Teste] " : "";
  const subject = `${prefixo}${lembrete ? "Lembrete: check-in/checkout vence hoje às 23h59" : `Check-in/checkout do ciclo ${dataBr(a.ciclo)} está aberto`}`;
  const abertura = lembrete
    ? "Seu check-in/checkout da semana ainda não foi enviado. O prazo termina hoje."
    : "O formulário de check-in (prioridades da semana) e checkout (retrospectiva da semana anterior) já está disponível.";
  const itens = [`${p.prioridades} prioridade(s) a definir`, `${p.kpis} KPI(s) a apontar`, `${p.atas} pendência(s) de atas`, ...(p.status_reports ? [`${p.status_reports} status report(s) de projeto`] : [])];
  const text = [`Olá, ${nome}.`, "", abertura, `Prazo: ${prazo}.`, "", "Pendências no momento:", ...itens.map(i => `• ${i}`), "", `Abrir meu check-in/checkout: ${url}`, ...(a.teste ? ["", "Este é um e-mail de teste."] : [])].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1f2937;max-width:560px">
<p>Olá, ${esc(nome)}.</p><p>${esc(abertura)}</p><p><b>Prazo:</b> ${esc(prazo)}.</p>
<p style="margin-bottom:4px">Pendências no momento:</p><ul style="margin-top:0">${itens.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
<p><a href="${url}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">Abrir meu check-in/checkout</a></p>
${a.teste ? '<p style="color:#6b7280;font-size:12px">Este é um e-mail de teste.</p>' : ""}</div>`;
  return { subject, text, html };
}
