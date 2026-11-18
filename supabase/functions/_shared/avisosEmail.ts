// Pure helpers (no Deno APIs) so they are shared by the edge function and the vitest suite.
export type Pendencias = { prioridades: number; kpis: number; atas: number; status_reports: number };
export type TipoAviso = "abertura" | "lembrete" | "manual";
export type TipoFila = TipoAviso | "impedimento";
export type Aviso = { nome: string; ciclo: string; tipo: TipoAviso; pendencias: Pendencias };

export const APP_URL = "https://gestao-estrategia-lm.lovable.app";
export const REMETENTE_NOME_PADRAO = "Gestão e Estratégia LM";

/** Structured content rendered by the React Email layout (Lovable Emails). */
export type Bloco = { tipo: "p"; texto: string; negrito?: boolean } | { tipo: "destaque"; texto: string } | { tipo: "titulo"; texto: string } | { tipo: "lista"; itens: string[]; ordenada?: boolean };
export type DadosEmail = { subject: string; titulo: string; blocos: Bloco[]; botao?: { texto: string; url: string }; rodape?: string };
const RODAPE_ROTINA = "Liberdade Médica · Rotina semanal de check-in e checkout. Mensagem automática; responda pelo app.";

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
function moldura(titulo: string, corpo: string, botao: { texto: string; url: string }, rodape = "Liberdade Médica · Rotina semanal de check-in e checkout. Mensagem automática; responda pelo app.") {
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
<tr><td style="padding:14px 24px;background:${COR.fundo};border-top:1px solid ${COR.borda};font-size:12px;color:${COR.suave}">${esc(rodape)}</td></tr>
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
  const titulo = lembrete ? "Seu check-in/checkout vence hoje" : `Ciclo de ${dataBr(a.ciclo)} aberto`;
  const botao = { texto: "Abrir meu check-in/checkout", url };
  const html = moldura(titulo, corpo, botao);
  const dados: DadosEmail = { subject, titulo, botao, rodape: RODAPE_ROTINA, blocos: [
    { tipo: "p", texto: `Olá, ${nome}.` }, { tipo: "p", texto: abertura }, { tipo: "destaque", texto: `Prazo: ${prazo}.` },
    { tipo: "titulo", texto: "Pendências no momento:" }, { tipo: "lista", itens },
  ] };
  return { subject, text, html, dados };
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
  const botao = { texto: "Ver impedimento", url };
  const html = moldura("Impedimento recebido", corpo, botao);
  const dados: DadosEmail = { subject, titulo: "Impedimento recebido", botao, rodape: RODAPE_ROTINA, blocos: [{ tipo: "p", texto: `Olá, ${nome}.` }, ...linhas.map(texto => ({ tipo: "p" as const, texto }))] };
  return { subject, text, html, dados };
}

/** Routes a queued outbox row to its template. */
export function montarEnvio(e: { tipo: TipoFila; ciclo: string; nome: string; pendencias: Record<string, unknown> | null }) {
  if (e.tipo === "impedimento") return montarImpedimento(e);
  return montarEmail({ nome: e.nome, ciclo: e.ciclo, tipo: e.tipo, pendencias: (e.pendencias ?? {}) as Pendencias });
}

export const QW_LINK = `${APP_URL}/quick-wins/formulario`;
/** Quick Wins invitation to leaders: Governance-approved text (Naira). Same message for every leader; no personal data. */
export function montarConviteQuickWins(c: { ano: number; prazo: string | null; teste?: boolean }) {
  const ano = Number.isInteger(c.ano) ? c.ano : new Date().getFullYear();
  const prazo = c.prazo && /^\d{4}-\d{2}-\d{2}$/.test(c.prazo) ? dataBr(c.prazo) : "";
  const subject = `${c.teste ? "[Teste] " : ""}Quick Wins ${ano}: quais vocês enxergam para a sua área?`;
  const passo3 = `Preencha, salve como rascunho se quiser continuar depois, e envie${prazo ? ` até ${prazo}` : " dentro do prazo do ciclo"}.`;
  const criterios = ["exige baixo investimento;", "não depende de grandes aprovações;", "gera resultado concreto e mensurável;", "cria momento para mudanças maiores."];
  const text = [
    "Olá, líderes LM!", "",
    `Queremos ouvir quem está mais perto da operação. Por isso, estamos abrindo o ciclo de Quick Wins ${ano}, e a visão de cada um de vocês é essencial.`, "",
    "O que são Quick Wins?",
    "São ações de baixo esforço e bom impacto, com resultados visíveis em curto prazo. Um bom quick win:",
    ...criterios.map(t => `* ${t}`), "",
    "A pergunta é simples: quais quick wins você enxerga para a sua área de atuação e para a empresa? Cada líder pode registrar até 10.", "",
    "Como acessar:",
    `1. Entre em ${QW_LINK}`,
    "2. Faça login com o seu e-mail corporativo (@liberdademedicaedu.com.br). O formulário já abre com o seu nome.",
    `3. ${passo3}`, "",
    "Leva poucos minutos, e não precisa estar tudo perfeito: ideias simples e práticas são exatamente o que buscamos.", "",
    "Qualquer dúvida ou dificuldade de acesso, é só responder este e-mail.", "",
    "Obrigada pela contribuição de todos!", "",
    "Naira",
  ].join("\n");
  const p = (t: string, extra = "") => `<p style="margin:0 0 14px${extra}">${t}</p>`;
  const corpo = [
    p("Olá, líderes LM!"),
    p(`Queremos ouvir quem está mais perto da operação. Por isso, estamos abrindo o ciclo de Quick Wins ${ano}, e a visão de cada um de vocês é essencial.`),
    `<p style="margin:0 0 6px;font-weight:bold;color:${COR.marinho}">O que são Quick Wins?</p>`,
    p("São ações de baixo esforço e bom impacto, com resultados visíveis em curto prazo. Um bom quick win:", ";margin-bottom:6px"),
    `<ul style="margin:0 0 14px;padding-left:20px">${criterios.map(t => `<li style="margin:2px 0">${esc(t)}</li>`).join("")}</ul>`,
    p(`A pergunta é simples: <b>quais quick wins você enxerga para a sua área de atuação e para a empresa?</b> Cada líder pode registrar até 10.`),
    `<p style="margin:0 0 6px;font-weight:bold;color:${COR.marinho}">Como acessar:</p>`,
    `<ol style="margin:0 0 14px;padding-left:20px"><li style="margin:2px 0">Entre em <a href="${QW_LINK}" style="color:${COR.vermelho}">${esc(QW_LINK)}</a>.</li><li style="margin:2px 0">Faça login com o seu e-mail corporativo (@liberdademedicaedu.com.br). O formulário já abre com o seu nome.</li><li style="margin:2px 0">${prazo ? `Preencha, salve como rascunho se quiser continuar depois, e envie até <b>${esc(prazo)}</b>.` : esc(passo3)}</li></ol>`,
    p("Leva poucos minutos, e não precisa estar tudo perfeito: ideias simples e práticas são exatamente o que buscamos."),
    p("Qualquer dúvida ou dificuldade de acesso, é só responder este e-mail."),
    p("Obrigada pela contribuição de todos!"),
    p("Naira", ";font-weight:bold"),
  ].join("\n");
  const botao = { texto: "Abrir meu formulário de Quick Wins", url: QW_LINK };
  const rodape = "Liberdade Médica · Quick Wins. Dúvidas? Responda este e-mail.";
  const html = moldura(`Quick Wins ${ano}`, corpo, botao, rodape);
  const dados: DadosEmail = { subject, titulo: `Quick Wins ${ano}`, botao, rodape, blocos: [
    { tipo: "p", texto: "Olá, líderes LM!" },
    { tipo: "p", texto: `Queremos ouvir quem está mais perto da operação. Por isso, estamos abrindo o ciclo de Quick Wins ${ano}, e a visão de cada um de vocês é essencial.` },
    { tipo: "titulo", texto: "O que são Quick Wins?" },
    { tipo: "p", texto: "São ações de baixo esforço e bom impacto, com resultados visíveis em curto prazo. Um bom quick win:" },
    { tipo: "lista", itens: criterios },
    { tipo: "p", texto: "A pergunta é simples: quais quick wins você enxerga para a sua área de atuação e para a empresa? Cada líder pode registrar até 10." },
    { tipo: "titulo", texto: "Como acessar:" },
    { tipo: "lista", ordenada: true, itens: [`Entre em ${QW_LINK}.`, "Faça login com o seu e-mail corporativo (@liberdademedicaedu.com.br). O formulário já abre com o seu nome.", passo3] },
    { tipo: "p", texto: "Leva poucos minutos, e não precisa estar tudo perfeito: ideias simples e práticas são exatamente o que buscamos." },
    { tipo: "p", texto: "Qualquer dúvida ou dificuldade de acesso, é só responder este e-mail." },
    { tipo: "p", texto: "Obrigada pela contribuição de todos!" }, { tipo: "p", texto: "Naira", negrito: true },
  ] };
  return { subject, text, html, dados };
}

/** Provider status → retry later (rate limit / outage) or fail for good. */
export const falhaTemporaria = (status: number) => status === 429 || status >= 500;

export const EMAIL_VALIDO = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/;
