import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { contarUpsert, nomesNovos, papelAutorizado, prepararPayload } from "./sync.ts";
import { cronAutorizado, destinoSincronizacao } from "./auth.ts";

const URL_PADRAO = "https://zrbixzqorerfespucmni.supabase.co/functions/v1/exportar-estrategia";
// Incremental apenas para chamadas agendadas; manual sempre completa.
const USAR_DESDE = true;

const lotes = <T>(a: T[], n = 500) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

Deno.serve(async (req) => {
  const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!["POST", "GET"].includes(req.method)) return out({ error: "Método não permitido" }, 405);
  const cronHeader = req.headers.get("x-cron-token");
  const agendada = cronAutorizado(cronHeader, Deno.env.get("GOV_SYNC_CRON_TOKEN"));
  if (cronHeader !== null && !agendada) return out({ error: "Não autenticado" }, 401);
  const auth = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return out({ error: "Configuração ausente" }, 503);
  const db = createClient(url, serviceKey);
  let uid: string | null = null;
  if (!agendada) {
    if (!auth?.startsWith("Bearer ")) return out({ error: "Não autenticado" }, 401);
    const anon = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: c, error } = await anon.auth.getClaims(auth.slice(7));
    if (error || !c?.claims?.sub) return out({ error: "Não autenticado" }, 401);
    uid = c.claims.sub as string;
    const { data: roles } = await db.from("user_roles").select("role").eq("user_id", uid);
    if (!papelAutorizado((roles ?? []).map((r: { role: string }) => r.role))) return out({ error: "Sem permissão" }, 403);
  }

  const { data: log } = await db.from("gov_sync_log").insert({ iniciado_por: uid }).select("id").single();
  const fim = async (campos: Record<string, unknown>) => {
    if (log?.id) await db.from("gov_sync_log").update({ ...campos, concluido_em: new Date().toISOString() }).eq("id", log.id);
    return out(campos);
  };

  const token = Deno.env.get("GOV_EXPORT_TOKEN");
  if (!token) return fim({ ok: false, status_http: null, erro: "secret_ausente" });

  const base = Deno.env.get("GOV_EXPORT_URL") || URL_PADRAO;
  let ultimoOk: string | null = null;
  if (USAR_DESDE && agendada) {
    const { data: ult } = await db.from("gov_sync_log").select("concluido_em").eq("ok", true).order("concluido_em", { ascending: false }).limit(1).maybeSingle();
    ultimoOk = ult?.concluido_em ?? null;
  }
  const destino = destinoSincronizacao(base, USAR_DESDE && agendada, ultimoOk, req.headers.get("x-sync-modo"));

  let payload: Record<string, unknown>;
  let status = 0;
  try {
    const r = await fetch(destino, { headers: { "x-integracao-token": token }, signal: AbortSignal.timeout(30000) });
    status = r.status;
    if (!r.ok) { await r.body?.cancel(); return fim({ ok: false, status_http: status, erro: "falha_exportacao" }); }
    payload = await r.json();
  } catch {
    return fim({ ok: false, status_http: status || null, erro: "falha_conexao" });
  }

  try {
    const p = prepararPayload(payload);
    const agora = new Date().toISOString();

    const existentes = new Set<string>();
    for (const l of lotes(p.acoes.map((a) => a.origem_id), 200)) {
      const { data, error: e } = await db.from("gov_acoes").select("origem_id").in("origem_id", l);
      if (e) throw e;
      (data ?? []).forEach((d: { origem_id: string }) => existentes.add(d.origem_id));
    }
    const cont = contarUpsert(existentes, p.acoes.map((a) => a.origem_id));
    for (const l of lotes(p.acoes.map((a) => ({ ...a, sincronizado_em: agora })))) {
      const { error: e } = await db.from("gov_acoes").upsert(l, { onConflict: "origem_id" });
      if (e) throw e;
    }
    for (const l of lotes(p.deliberacoes.map((d) => ({ ...d, sincronizado_em: agora })))) {
      const { error: e } = await db.from("gov_deliberacoes").upsert(l, { onConflict: "reuniao_origem_id,indice" });
      if (e) throw e;
    }

    const { data: mapa, error: em } = await db.from("gov_responsaveis_map").select("nome_normalizado");
    if (em) throw em;
    const novos = nomesNovos(p.acoes, new Set((mapa ?? []).map((m: { nome_normalizado: string }) => m.nome_normalizado)));
    if (novos.length) {
      const { error: e } = await db.from("gov_responsaveis_map").upsert(novos, { onConflict: "nome_normalizado", ignoreDuplicates: true });
      if (e) throw e;
    }

    const { data: publicadas, error: ep } = await db.rpc("gov_publicar_deliberacoes");
    if (ep) throw ep;
    return fim({
      ok: true, status_http: status,
      acoes_recebidas: p.acoes_recebidas, acoes_inseridas: cont.inseridas, acoes_atualizadas: cont.atualizadas,
      deliberacoes_recebidas: p.deliberacoes_recebidas, deliberacoes_excluidas: p.deliberacoes_excluidas,
      nomes_novos: novos.length,
      deliberacoes_publicadas: publicadas,
    });
  } catch {
    return fim({ ok: false, status_http: status, erro: "falha_gravacao" });
  }
});
