// Gmail API sender (Google Workspace). Two supported credentials, checked in this order:
// 1) GMAIL_SERVICE_ACCOUNT_JSON — service account with domain-wide delegation, scope gmail.send,
//    impersonating the sender mailbox (GMAIL_REMETENTE).
// 2) GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + GMAIL_REFRESH_TOKEN — OAuth consent of the sender mailbox.
import { base64url, falhaTemporaria, mensagemMime } from "./email.ts";

/** Carries whether retrying later can succeed (429/5xx/network) or not (auth, invalid address). */
export class ErroEnvio extends Error {
  constructor(message: string, readonly temporaria: boolean) { super(message); }
}

const ESCOPO = "https://www.googleapis.com/auth/gmail.send";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

type Credencial = { tipo: "service_account"; conta: { client_email: string; private_key: string } } | { tipo: "oauth"; id: string; segredo: string; refresh: string };

export function credencialGmail(envBruto: (k: string) => string | undefined): Credencial | null {
  // Pasted secrets often carry stray spaces/newlines at the ends.
  const env = (k: string) => envBruto(k)?.trim() || undefined;
  const sa = env("GMAIL_SERVICE_ACCOUNT_JSON");
  if (sa) {
    const conta = JSON.parse(sa);
    if (!conta?.client_email || !conta?.private_key) throw new Error("GMAIL_SERVICE_ACCOUNT_JSON inválido");
    return { tipo: "service_account", conta };
  }
  const id = env("GMAIL_CLIENT_ID"), segredo = env("GMAIL_CLIENT_SECRET"), refresh = env("GMAIL_REFRESH_TOKEN");
  return id && segredo && refresh ? { tipo: "oauth", id, segredo, refresh } : null;
}

const enc = new TextEncoder();
async function assinarJwt(conta: { client_email: string; private_key: string }, sub: string) {
  const agora = Math.floor(Date.now() / 1000);
  const cab = base64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const corpo = base64url(enc.encode(JSON.stringify({ iss: conta.client_email, sub, scope: ESCOPO, aud: TOKEN_URL, iat: agora, exp: agora + 3600 })));
  const pem = conta.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const chave = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const assinatura = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", chave, enc.encode(`${cab}.${corpo}`)));
  return `${cab}.${corpo}.${base64url(assinatura)}`;
}

/** Actionable hint for the usual Google token errors. */
export function dicaOAuth(tipo: Credencial["tipo"], erro: string) {
  if (tipo === "service_account" && erro === "unauthorized_client") return ". Falta a delegação em todo o domínio no Admin Console (ou remova GMAIL_SERVICE_ACCOUNT_JSON para usar o refresh token).";
  if (tipo === "oauth" && erro === "unauthorized_client") return ". O refresh token não foi gerado com este GMAIL_CLIENT_ID: no OAuth Playground marque \"Use your own OAuth credentials\" antes de autorizar.";
  if (tipo === "oauth" && erro === "invalid_client") return ". GMAIL_CLIENT_ID ou GMAIL_CLIENT_SECRET incorretos.";
  if (erro === "invalid_grant") return ". Refresh token expirado ou revogado: gere outro no OAuth Playground.";
  return "";
}

let cache: { token: string; expira: number } | null = null;
async function tokenAcesso(c: Credencial, remetenteEmail: string) {
  if (cache && cache.expira > Date.now() + 60_000) return cache.token;
  const body = c.tipo === "service_account"
    ? new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: await assinarJwt(c.conta, remetenteEmail) })
    : new URLSearchParams({ grant_type: "refresh_token", client_id: c.id, client_secret: c.segredo, refresh_token: c.refresh });
  const r = await fetch(TOKEN_URL, { method: "POST", body, signal: AbortSignal.timeout(15000) }).catch(e => { throw new ErroEnvio(`Google OAuth indisponível: ${(e as Error).message}`, true); });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new ErroEnvio(`Google OAuth ${r.status} (${c.tipo === "service_account" ? "conta de serviço" : "refresh token da caixa"}): ${String(j.error ?? "erro")}${j.error_description ? ` — ${String(j.error_description)}` : ""}${dicaOAuth(c.tipo, String(j.error ?? ""))}`.slice(0, 400), falhaTemporaria(r.status));
  cache = { token: j.access_token, expira: Date.now() + Number(j.expires_in ?? 3600) * 1000 };
  return cache.token;
}

export async function enviarGmail(c: Credencial, de: { nome: string; email: string }, para: string, m: { subject: string; text: string; html: string }) {
  const token = await tokenAcesso(c, de.email);
  const raw = base64url(enc.encode(mensagemMime(de, para, m)));
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(de.email)}/messages/send`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ raw }), signal: AbortSignal.timeout(20000),
  }).catch(e => { throw new ErroEnvio(`Gmail indisponível: ${(e as Error).message}`, true); });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) cache = null;
  if (!r.ok) throw new ErroEnvio(`Gmail ${r.status}: ${String(j?.error?.message ?? "erro").slice(0, 300)}`, falhaTemporaria(r.status));
  return String(j.id ?? "");
}
