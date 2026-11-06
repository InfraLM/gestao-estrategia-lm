import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { cicloAtual, cicloValido, EMAIL_VALIDO, montarEmail, montarEnvio, REMETENTE_NOME_PADRAO, tokenValido, type TipoFila } from "./email.ts";
import { credencialGmail, enviarGmail, ErroEnvio } from "./gmail.ts";

// Weekly check-in/checkout e-mails (and assigned-impediment notices) through the Gmail API (Google Workspace).
// - x-cron-token (pg_net wake on enqueue + 10-minute cron): delivers the queue.
// - Governança JWT + {acao:"teste", cadeira_id}: sends one preview to that director; writes nothing.
// - Governança JWT + {acao:"configurar"}: registers this endpoint for the wake and marks the sender ready (audited).
// - Governança JWT + {acao:"processar"}: delivers the queue on demand.
// Rows are claimed/finished only through service-role RPCs: one row per claim, max 3 attempts, 14-day expiry.
const MAX_POR_EXECUCAO = 100;
const PAUSA_MS = 300; // gentle pacing for the Gmail API

type Fila = { id: string; tipo: TipoFila; ciclo: string; nome: string; destinatario: string; pendencias: Record<string, unknown> | null; tentativas: number };

Deno.serve(async req => {
  const out = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return out({ error: "Método não permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronToken = Deno.env.get("ROTINA_AVISOS_CRON_TOKEN");
  const remetente = { nome: Deno.env.get("GMAIL_REMETENTE_NOME") || REMETENTE_NOME_PADRAO, email: (Deno.env.get("GMAIL_REMETENTE") ?? "").trim().toLowerCase() };
  let credencial: ReturnType<typeof credencialGmail> = null;
  let erroCredencial = "";
  try { credencial = credencialGmail(k => Deno.env.get(k)); } catch (e) { erroCredencial = String((e as Error).message); }
  const faltaGmail = () => erroCredencial || (!credencial ? "Cadastre GMAIL_SERVICE_ACCOUNT_JSON (ou GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN)" : !EMAIL_VALIDO.test(remetente.email) ? "Cadastre GMAIL_REMETENTE (caixa que envia)" : "");
  if (!url || !anonKey || !serviceKey) return out({ error: "Configuração ausente" }, 503);
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  const enviar = async (para: string, m: { subject: string; text: string; html: string }) => {
    const falta = faltaGmail();
    if (falta || !credencial) throw new ErroEnvio(falta, false);
    return await enviarGmail(credencial, remetente, para, m);
  };

  const processar = async () => {
    let enviados = 0, falhas = 0, reprocessar = 0, total = 0;
    while (total < MAX_POR_EXECUCAO) {
      // One row per claim: if Google rate-limits mid-run, no other row is left claimed without an attempt.
      const { data, error } = await db.rpc("rotina_avisos_reivindicar", { _limite: 1 });
      if (error) throw new Error("Falha ao ler a fila");
      const lote = (data ?? []) as Fila[];
      if (!lote.length) break;
      for (const e of lote) {
        total++;
        let ok = false, provedorId = "", erro = "", temporaria = false;
        try {
          if (!EMAIL_VALIDO.test(e.destinatario ?? "")) throw new ErroEnvio("Destinatário sem e-mail válido", false);
          provedorId = await enviar(e.destinatario, montarEnvio(e));
          ok = true;
        } catch (err) {
          erro = String((err as Error).message ?? err).slice(0, 500);
          temporaria = err instanceof ErroEnvio ? err.temporaria : false;
        }
        const { data: status } = await db.rpc("rotina_avisos_concluir", ok
          ? { _id: e.id, _ok: true, _provedor_id: provedorId || null }
          : { _id: e.id, _ok: false, _erro: erro, _reprocessar: temporaria });
        if (status === "enviado") enviados++; else if (status === "aguardando") reprocessar++; else falhas++;
        // Rate limit / outage will not recover within this run: leave the rest for the 10-minute retry.
        if (!ok && temporaria) return { enviados, falhas, reprocessar, interrompido: true };
        await new Promise(r => setTimeout(r, PAUSA_MS));
      }
    }
    return { enviados, falhas, reprocessar };
  };

  // Scheduled / wake-on-enqueue path.
  const cronHeader = req.headers.get("x-cron-token");
  if (cronHeader !== null) {
    if (!tokenValido(cronHeader, cronToken)) return out({ error: "Não autenticado" }, 401);
    try { return out({ ok: true, ...(await processar()) }); } catch { return out({ ok: false, error: "Falha ao processar a fila" }, 500); }
  }

  // Governance user path.
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return out({ error: "Não autenticado" }, 401);
  const anon = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
  const { data: claims, error: authError } = await anon.auth.getClaims(auth.slice(7));
  const uid = claims?.claims?.sub;
  if (authError || !uid) return out({ error: "Não autenticado" }, 401);
  const { data: gov } = await db.rpc("mt_is_governanca", { _uid: uid });
  if (!gov) return out({ error: "Sem permissão" }, 403);

  const body = await req.json().catch(() => ({}));
  const acao = String(body?.acao ?? "");

  if (acao === "teste") {
    const ciclo = typeof body?.ciclo === "string" && cicloValido(body.ciclo) ? body.ciclo : cicloAtual();
    const { data: lista, error } = await db.rpc("rotina_avisos_destinatarios", { _ciclo: ciclo });
    if (error) return out({ error: "Não foi possível carregar os destinatários" }, 500);
    const d = (lista ?? []).find((x: { cadeira_id: string }) => x.cadeira_id === body?.cadeira_id);
    if (!d) return out({ error: "Cadeira não encontrada" }, 404);
    if (d.motivo || !d.email) return out({ error: `Não recebe: ${d.motivo ?? "sem e-mail"}` }, 422);
    const tipo = body?.tipo === "lembrete" ? "lembrete" : "abertura";
    try {
      const id = await enviar(d.email, montarEmail({ nome: d.nome, ciclo, tipo, pendencias: d.pendencias, teste: true }));
      return out({ ok: true, para: d.email, ciclo, tipo, provedor_id: id });
    } catch (e) { return out({ ok: false, error: String((e as Error).message ?? e) }, 502); }
  }

  if (acao === "configurar") {
    if (faltaGmail()) return out({ error: faltaGmail() }, 503);
    if (!cronToken || cronToken.length < 32) return out({ error: "Cadastre o secret ROTINA_AVISOS_CRON_TOKEN (mín. 32 caracteres)" }, 503);
    const { error } = await db.rpc("rotina_avisos_remetente_configurar", { _token: cronToken, _url: `${url}/functions/v1/rotina-avisos-enviar`, _uid: uid, _remetente: remetente.email });
    if (error) return out({ error: "Não foi possível conectar o remetente" }, 500);
    return out({ ok: true, remetente: remetente.email });
  }

  if (acao === "processar") {
    try { return out({ ok: true, ...(await processar()) }); } catch { return out({ ok: false, error: "Falha ao processar a fila" }, 500); }
  }

  return out({ error: "Ação inválida" }, 400);
});
