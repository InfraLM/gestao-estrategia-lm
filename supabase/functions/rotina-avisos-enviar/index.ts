import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { cicloAtual, cicloValido, montarEmail, REMETENTE_PADRAO, tokenValido, type Aviso } from "./email.ts";

// Weekly check-in/checkout e-mails through Resend.
// - x-cron-token (wake-on-enqueue trigger): delivers queued abertura/lembrete/manual rows.
// - Governança JWT + {acao:"teste", cadeira_id}: sends one preview to that director; writes nothing.
// - Governança JWT + {acao:"configurar"}: registers this endpoint for the trigger and marks the sender ready.
// - Governança JWT + {acao:"processar"}: delivers the queue on demand.
const TIPOS = ["abertura", "lembrete", "manual"];
const LOTE = 50;

Deno.serve(async req => {
  const out = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return out({ error: "Método não permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronToken = Deno.env.get("ROTINA_AVISOS_CRON_TOKEN");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const remetente = Deno.env.get("ROTINA_AVISOS_REMETENTE") || REMETENTE_PADRAO;
  if (!url || !anonKey || !serviceKey) return out({ error: "Configuração ausente" }, 503);
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  const enviar = async (para: string, aviso: Aviso, idempotencia?: string) => {
    if (!resendKey) throw new Error("RESEND_API_KEY ausente");
    const m = montarEmail(aviso);
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", ...(idempotencia ? { "Idempotency-Key": idempotencia } : {}) },
      body: JSON.stringify({ from: remetente, to: [para], subject: m.subject, text: m.text, html: m.html }),
      signal: AbortSignal.timeout(20000),
    });
    const corpo = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Resend ${r.status}: ${String(corpo?.message ?? corpo?.name ?? "erro").slice(0, 300)}`);
    return String(corpo?.id ?? "");
  };

  const processar = async () => {
    const { data: cfg } = await db.from("rotina_avisos_config").select("remetente_pronto").maybeSingle();
    if (!cfg?.remetente_pronto) return { enviados: 0, falhas: 0, motivo: "remetente não pronto" };
    const { data: fila, error } = await db.from("rotina_avisos_envios").select("id,ciclo,tipo,nome,destinatario,pendencias")
      .eq("status", "aguardando").eq("canal", "email").in("tipo", TIPOS).order("criado_em").limit(LOTE);
    if (error) throw new Error("Falha ao ler a fila");
    let enviados = 0, falhas = 0;
    for (const item of fila ?? []) {
      // Claim: only one worker moves a row out of 'aguardando'.
      const { data: claim } = await db.from("rotina_avisos_envios").update({ status: "processando" }).eq("id", item.id).eq("status", "aguardando").select("id");
      if (!claim?.length) continue;
      try {
        const id = await enviar(item.destinatario, { nome: item.nome, ciclo: item.ciclo, tipo: item.tipo, pendencias: item.pendencias }, `rotina-aviso-${item.id}`);
        await db.from("rotina_avisos_envios").update({ status: "enviado", enviado_em: new Date().toISOString(), provedor_id: id || null, erro: null }).eq("id", item.id);
        enviados++;
      } catch (e) {
        await db.from("rotina_avisos_envios").update({ status: "falhou", erro: String((e as Error).message ?? e).slice(0, 500) }).eq("id", item.id);
        falhas++;
      }
      await new Promise(r => setTimeout(r, 600)); // Resend default limit: 2 req/s
    }
    return { enviados, falhas };
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
  const { data: gov } = await anon.rpc("mt_is_governanca", { _uid: uid });
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
      const id = await enviar(d.email, { nome: d.nome, ciclo, tipo, pendencias: d.pendencias, teste: true });
      return out({ ok: true, para: d.email, ciclo, tipo, provedor_id: id });
    } catch (e) { return out({ ok: false, error: String((e as Error).message ?? e) }, 502); }
  }

  if (acao === "configurar") {
    if (!resendKey) return out({ error: "Cadastre o secret RESEND_API_KEY antes de conectar" }, 503);
    if (!cronToken || cronToken.length < 32) return out({ error: "Cadastre o secret ROTINA_AVISOS_CRON_TOKEN (mín. 32 caracteres)" }, 503);
    const { error } = await db.rpc("rotina_avisos_remetente_configurar", { _token: cronToken, _url: `${url}/functions/v1/rotina-avisos-enviar`, _uid: uid });
    if (error) return out({ error: "Não foi possível conectar o remetente" }, 500);
    return out({ ok: true });
  }

  if (acao === "processar") {
    try { return out({ ok: true, ...(await processar()) }); } catch { return out({ ok: false, error: "Falha ao processar a fila" }, 500); }
  }

  return out({ error: "Ação inválida" }, 400);
});
