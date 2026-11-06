// Pure helpers (no Deno APIs) so they are shared by the edge function and the vitest suite.
export type Pendencias = { prioridades: number; kpis: number; atas: number; status_reports: number };
export type TipoAviso = "abertura" | "lembrete" | "manual";
export type TipoFila = TipoAviso | "impedimento";
export type Aviso = { nome: string; ciclo: string; tipo: TipoAviso; pendencias: Pendencias; teste?: boolean };

export const APP_URL = "https://gestao-estrategia-lm.lovable.app";
export const REMETENTE_NOME_PADRAO = "Gestão Estratégica LM";

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const curto = (v: unknown, max = 120) => (typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : "");

/** Assigned-impediment notice: origin chair, who flagged it and wanted date only — never the impediment text. */
export function montarImpedimento(a: { nome: string; ciclo: string; pendencias: Record<string, unknown> | null; teste?: boolean }) {
  if (!cicloValido(a.ciclo)) throw new Error("Ciclo inválido");
  const link = curto(a.pendencias?.link, 200);
  const m = /^\/metas\/semanal\?semana=(\d{4}-\d{2}-\d{2})&impedimento=([0-9a-f-]{36})$/i.exec(link);
  const caminho = m && cicloValido(m[1]) && UUID.test(m[2]) ? `/metas/semanal?semana=${m[1]}&impedimento=${m[2]}` : `/metas/semanal?semana=${a.ciclo}`;
  const url = `${APP_URL}${caminho}`;
  const nome = (a.nome || "").trim().split(/\s+/)[0] || "diretor(a)";
  const origem = curto(a.pendencias?.cadeira_origem) || "Outra cadeira";
  const quem = curto(a.pendencias?.quem_sinalizou);
  const prazoTxt = curto(a.pendencias?.prazo_desejado, 10);
  const prazo = /^\d{4}-\d{2}-\d{2}$/.test(prazoTxt) ? dataBr(prazoTxt) : "";
  const linhas = [
    `A cadeira ${origem}${quem ? ` (${quem})` : ""} sinalizou um impedimento atribuído à sua cadeira.`,
    prazo ? `Prazo desejado: ${prazo}.` : "Sem prazo desejado informado.",
    `Responda com plano, prazo e status no checkout do ciclo de ${dataBr(a.ciclo)}.`,
  ];
  const prefixo = a.teste ? "[Teste] " : "";
  const subject = `${prefixo}Impedimento recebido · ${origem}`;
  const text = [`Olá, ${nome}.`, "", ...linhas, "", `Ver impedimento: ${url}`].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1f2937;max-width:560px">
<p>Olá, ${esc(nome)}.</p>${linhas.map(l => `<p>${esc(l)}</p>`).join("")}
<p><a href="${url}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">Ver impedimento</a></p></div>`;
  return { subject, text, html };
}

/** Routes a queued outbox row to its template. */
export function montarEnvio(e: { tipo: TipoFila; ciclo: string; nome: string; pendencias: Record<string, unknown> | null }) {
  if (e.tipo === "impedimento") return montarImpedimento(e);
  return montarEmail({ nome: e.nome, ciclo: e.ciclo, tipo: e.tipo, pendencias: (e.pendencias ?? {}) as Pendencias });
}

/** Provider status → retry later (rate limit / outage) or fail for good. */
export const falhaTemporaria = (status: number) => status === 429 || status >= 500;

// ---- MIME for the Gmail API (RFC 2822 + RFC 2047), no Deno APIs. ----
const base64 = (bytes: Uint8Array) => { let b = ""; for (let i = 0; i < bytes.length; i += 0x8000) b += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(b); };
export const base64url = (bytes: Uint8Array) => base64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const utf8 = (s: string) => new TextEncoder().encode(s);
const CRLF = "\r\n";
const semQuebra = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
const palavra = (s: string) => `=?UTF-8?B?${base64(utf8(semQuebra(s)))}?=`;
const linhas76 = (s: string) => s.replace(/.{1,76}/g, `$&${CRLF}`);
/** Ad-hoc Governance tests only go to corporate mailboxes. */
export const DOMINIO_CORPORATIVO = "@liberdademedicaedu.com.br";
export const emailCorporativo = (v: unknown): v is string => typeof v === "string" && EMAIL_VALIDO.test(v.trim()) && v.trim().toLowerCase().endsWith(DOMINIO_CORPORATIVO);
/** "naira.yurie@…" → "Naira" for the greeting of an ad-hoc test. */
export const nomeDoEmail = (email: string) => { const p = email.split("@")[0].split(/[._-]/)[0] ?? ""; return p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : "diretor(a)"; };
export const EMAIL_VALIDO = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/;

export function mensagemMime(de: { nome: string; email: string }, para: string, m: { subject: string; text: string; html: string }) {
  if (!EMAIL_VALIDO.test(de.email) || !EMAIL_VALIDO.test(para)) throw new Error("E-mail inválido");
  const limite = `lm-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return [
    `From: ${palavra(de.nome)} <${de.email}>`, `To: <${para}>`, `Subject: ${palavra(m.subject)}`, "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${limite}"`, "",
    `--${limite}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", linhas76(base64(utf8(m.text))),
    `--${limite}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", linhas76(base64(utf8(m.html))),
    `--${limite}--`, "",
  ].join(CRLF);
}
