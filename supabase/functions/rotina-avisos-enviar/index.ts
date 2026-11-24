import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { EMAIL_VALIDO, montarConviteQuickWins, montarEnvio, tokenValido, type DadosEmail, type TipoFila } from "./email.ts";
import { enviarEmail, ErroEnvio, REMETENTE_EMAIL } from "../_shared/enviarEmail.ts";
import { destinatariosConviteIndividual } from "./conviteIndividual.ts";

// Weekly check-in/checkout e-mails (and assigned-impediment notices) through Lovable Emails (notifylv.liberdademedicaedu.com.br).
// - x-cron-token (pg_net wake on enqueue; 10-minute retry cron only while rows are pending): delivers the queue.
// - Governança JWT + {acao:"configurar"}: registers this endpoint for the wake and marks the sender ready (audited).
// - Governança JWT + {acao:"processar"}: delivers the queue on demand.
// Rows are claimed/finished only through service-role RPCs: one row per claim, max 3 attempts, 14-day expiry.
const MAX_POR_EXECUCAO = 100;
const PAUSA_MS = 300; // gentle pacing

type Fila = { id: string; tipo: TipoFila; ciclo: string; nome: string; destinatario: string; pendencias: Record<string, unknown> | null; tentativas: number };

Deno.serve(async req => {
  const out = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return out({ error: "Método não permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronToken = Deno.env.get("ROTINA_AVISOS_CRON_TOKEN");
  const faltaEnvio = () => (Deno.env.get("LOVABLE_API_KEY") ? "" : "Envio de e-mails indisponível (LOVABLE_API_KEY ausente)");
  if (!url || !anonKey || !serviceKey) return out({ error: "Configuração ausente" }, 503);
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  const enviar = async (modelo: string, para: string, dados: DadosEmail, chave: string) => {
    const falta = faltaEnvio();
    if (falta) throw new ErroEnvio(falta, false);
    await enviarEmail(modelo, para, dados, chave);
    return "";
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
          provedorId = await enviar(e.tipo === "impedimento" ? "impedimento-recebido" : "aviso-ciclo", e.destinatario, montarEnvio(e).dados, `aviso-${e.id}`);
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
  const body = await req.json().catch(() => ({}));
  const acao = String(body?.acao ?? "");
  if (!gov) return out({ error: "Sem permissão: somente a Governança" }, 403);

  if (acao === "configurar") {
    if (faltaEnvio()) return out({ error: faltaEnvio() }, 503);
    if (!cronToken || cronToken.length < 32) return out({ error: "Cadastre o secret ROTINA_AVISOS_CRON_TOKEN (mín. 32 caracteres)" }, 503);
    const { error } = await db.rpc("rotina_avisos_remetente_configurar", { _token: cronToken, _url: `${url}/functions/v1/rotina-avisos-enviar`, _uid: uid, _remetente: REMETENTE_EMAIL });
    if (error) return out({ error: "Não foi possível conectar o remetente" }, 500);
    return out({ ok: true, remetente: REMETENTE_EMAIL });
  }

  if (acao === "processar") {
    try { return out({ ok: true, ...(await processar()) }); } catch { return out({ ok: false, error: "Falha ao processar a fila" }, 500); }
  }

  // Quick Wins invitation (Governança). modo "teste": up to 5 corporate addresses, nothing recorded.
  // modo "lideres": every active e-mail of the "Envio Quick Wins" list (qw_envio_lista), once per cycle (qw_convites_email).
  if (acao === "qw_convite") {
    const falta = faltaEnvio();
    if (falta) return out({ error: falta }, 503);
    const { data: ciclo } = await db.from("qw_ciclos").select("id,ano,data_fechamento,status").eq("status", "aberto").order("ano", { ascending: false }).limit(1).maybeSingle();
    const modo = String(body?.modo ?? "");
    if (modo === "teste") {
      const para = Array.isArray(body?.para) ? [...new Set((body.para as unknown[]).map(e => String(e ?? "").trim().toLowerCase()).filter(Boolean))] : [];
      if (!para.length || para.length > 5 || para.some(e => !EMAIL_VALIDO.test(e) || !e.endsWith("@liberdademedicaedu.com.br"))) return out({ error: "Informe de 1 a 5 e-mails @liberdademedicaedu.com.br" }, 400);
      const m = montarConviteQuickWins({ ano: ciclo?.ano ?? new Date().getFullYear(), prazo: ciclo?.data_fechamento ?? null, teste: true });
      const resultado: { para: string; ok: boolean; erro?: string }[] = [];
      for (const e of para) {
        try { await enviar("convite-quick-wins", e, m.dados, `qw-teste-${crypto.randomUUID()}`); resultado.push({ para: e, ok: true }); } catch (err) { resultado.push({ para: e, ok: false, erro: String((err as Error).message).slice(0, 300) }); }
        await new Promise(r => setTimeout(r, PAUSA_MS));
      }
      return out({ ok: resultado.every(r => r.ok), resultado });
    }
    if (modo === "lideres" || modo === "individual") {
      if (!ciclo) return out({ error: "Abra o ciclo de Quick Wins antes de enviar o convite" }, 409);
      // Recipients = the "Envio Quick Wins" list (Governance-curated), once per e-mail per cycle.
      const [{ data: lista, error: e1 }, { data: feitos, error: e2 }, { data: lideres }] = await Promise.all([
        db.from("qw_envio_lista").select("email,nome").eq("ativo", true),
        db.from("qw_convites_email").select("email").eq("ciclo_id", ciclo.id),
        db.from("qw_lideres").select("id,email"),
      ]);
      if (e1 || e2) return out({ error: "Não foi possível carregar a lista Envio Quick Wins" }, 500);
      let destinatarios = (lista ?? []) as { email: string; nome: string }[];
      if (modo === "individual") {
        try { destinatarios = destinatariosConviteIndividual(destinatarios, body?.email); }
        catch (err) { return out({ error: (err as Error).message }, 400); }
      }
      const ja = new Set((feitos ?? []).map((f: { email: string }) => f.email.toLowerCase()));
      const liderPorEmail = new Map(((lideres ?? []) as { id: string; email: string }[]).map(l => [l.email.trim().toLowerCase(), l.id]));
      const m = montarConviteQuickWins({ ano: ciclo.ano, prazo: ciclo.data_fechamento });
      let enviados = 0; const falhas: { nome: string; erro: string }[] = [];
      for (const l of destinatarios) {
        const email = l.email.trim().toLowerCase();
        if (ja.has(email)) continue;
        try {
          if (!EMAIL_VALIDO.test(email)) throw new Error("E-mail inválido");
          const id = await enviar("convite-quick-wins", email, m.dados, `qw-convite-${ciclo.id}-${email}`);
          enviados++;
          const { error: eReg } = await db.from("qw_convites_email").insert({ ciclo_id: ciclo.id, lider_id: liderPorEmail.get(email) ?? null, email, provedor_id: id || null, enviado_por: uid });
          if (eReg) falhas.push({ nome: l.nome, erro: "E-mail enviado, mas não registrado (pode ser reenviado)" });
        } catch (err) {
          falhas.push({ nome: l.nome, erro: String((err as Error).message).slice(0, 200) });
          if (err instanceof ErroEnvio && err.temporaria) break;
        }
        await new Promise(r => setTimeout(r, PAUSA_MS));
      }
      return out({ ok: !falhas.length, enviados, ja_enviados: destinatarios.filter(l => ja.has(l.email.trim().toLowerCase())).length, falhas });
    }
    return out({ error: "Modo inválido" }, 400);
  }

  return out({ error: "Ação inválida" }, 400);
});
