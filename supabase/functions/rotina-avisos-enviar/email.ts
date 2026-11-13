// Pure helpers (no Deno APIs) so they are shared by the edge function and the vitest suite.
export type Pendencias = { prioridades: number; kpis: number; atas: number; status_reports: number };
export type TipoAviso = "abertura" | "lembrete" | "manual";
export type TipoFila = TipoAviso | "impedimento";
export type Aviso = { nome: string; ciclo: string; tipo: TipoAviso; pendencias: Pendencias };

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

// Identidade LM no e-mail: vermelho, preto e branco, com detalhe em azul-marinho. Só HTML com estilos inline (clientes de e-mail).
const COR = { vermelho: "#E42535", marinho: "#1B2A4A", texto: "#1F2937", suave: "#6B7280", fundo: "#F4F4F5", borda: "#E4E4E7" };
/** Moldura comum dos avisos: faixa com a marca, título, corpo e um botão. Recebe HTML já escapado. */
function moldura(titulo: string, corpo: string, botao: { texto: string; url: string }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title></head>
<body style="margin:0;padding:0;background:${COR.fundo}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.fundo};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${COR.borda};border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:${COR.texto}">
<tr><td style="background:${COR.marinho};padding:16px 24px;border-bottom:4px solid ${COR.vermelho}">
<span style="display:inline-block;background:${COR.vermelho};color:#ffffff;font-weight:bold;font-size:14px;padding:4px 8px;border-radius:4px;letter-spacing:1px">LM</span>
<span style="color:#ffffff;font-size:15px;font-weight:bold;padding-left:8px;vertical-align:middle">Gestão e Estratégia</span></td></tr>
<tr><td style="padding:24px 24px 8px"><h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${COR.marinho}">${esc(titulo)}</h1>
<div style="font-size:15px;line-height:1.6">${corpo}</div></td></tr>
<tr><td style="padding:8px 24px 28px"><a href="${botao.url}" style="display:inline-block;background:${COR.vermelho};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:6px">${esc(botao.texto)}</a></td></tr>
<tr><td style="padding:14px 24px;background:${COR.fundo};border-top:1px solid ${COR.borda};font-size:12px;color:${COR.suave}">Liberdade Médica · Rotina semanal de check-in e checkout. Mensagem automática; responda pelo app.</td></tr>
</table></td></tr></table></body></html>`;
}

/** Only first name + own counts: no private content ever enters the e-mail. */
export function montarEmail(a: Aviso) {
  if (!cicloValido(a.ciclo)) throw new Error("Ciclo inválido");
  const p = { prioridades: n(a.pendencias?.prioridades), kpis: n(a.pendencias?.kpis), atas: n(a.pendencias?.atas), status_reports: n(a.pendencias?.status_reports) };
  const url = `${APP_URL}/metas/semanal?semana=${a.ciclo}`;
  const nome = (a.nome || "").trim().split(/\s+/)[0] || "diretor(a)";
  const prazo = `segunda-feira, ${dataBr(a.ciclo)}, às 23h59 (horário de São Paulo)`;
  const lembrete = a.tipo === "lembrete";
  const subject = lembrete ? "Lembrete: check-in/checkout vence hoje às 23h59" : `Check-in/checkout do ciclo ${dataBr(a.ciclo)} está aberto`;
  const abertura = lembrete
    ? "Seu check-in/checkout da semana ainda não foi enviado. O prazo termina hoje."
    : "O formulário de check-in (prioridades da semana) e checkout (retrospectiva da semana anterior) já está disponível.";
  const itens = [`${p.prioridades} prioridade(s) a definir`, `${p.kpis} KPI(s) a apontar`, `${p.atas} pendência(s) de atas`, ...(p.status_reports ? [`${p.status_reports} status report(s) de projeto`] : [])];
  const text = [`Olá, ${nome}.`, "", abertura, `Prazo: ${prazo}.`, "", "Pendências no momento:", ...itens.map(i => `• ${i}`), "", `Abrir meu check-in/checkout: ${url}`].join("\n");
  const corpo = `<p style="margin:0 0 12px">Olá, ${esc(nome)}.</p><p style="margin:0 0 16px">${esc(abertura)}</p>
<p style="margin:0 0 16px;padding:12px 14px;background:#FEF2F2;border-left:4px solid ${COR.vermelho};border-radius:4px"><b>Prazo:</b> ${esc(prazo)}.</p>
<p style="margin:0 0 6px;font-weight:bold;color:${COR.marinho}">Pendências no momento:</p>
<ul style="margin:0 0 8px;padding-left:20px">${itens.map(i => `<li style="margin:2px 0">${esc(i)}</li>`).join("")}</ul>`;
  const html = moldura(lembrete ? "Seu check-in/checkout vence hoje" : `Ciclo de ${dataBr(a.ciclo)} aberto`, corpo, { texto: "Abrir meu check-in/checkout", url });
  return { subject, text, html };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const curto = (v: unknown, max = 120) => (typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : "");

/** Assigned-impediment notice: origin chair, who flagged it and wanted date only — never the impediment text. */
export function montarImpedimento(a: { nome: string; ciclo: string; pendencias: Record<string, unknown> | null }) {
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
  const subject = `Impedimento recebido · ${origem}`;
  const text = [`Olá, ${nome}.`, "", ...linhas, "", `Ver impedimento: ${url}`].join("\n");
  const corpo = `<p style="margin:0 0 12px">Olá, ${esc(nome)}.</p>${linhas.map(l => `<p style="margin:0 0 12px">${esc(l)}</p>`).join("")}`;
  const html = moldura("Impedimento recebido", corpo, { texto: "Ver impedimento", url });
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
