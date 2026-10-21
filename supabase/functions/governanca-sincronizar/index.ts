import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { contarUpsert, nomesNovos, papelAutorizado, prepararPayload } from "./sync.ts";

const URL_PADRAO = "https://zrbixzqorerfespucmni.supabase.co/functions/v1/exportar-estrategia";
// Fase B: sincronização completa. Futuro: USAR_DESDE=true envia "desde" = último concluido_em com ok.
const USAR_DESDE = false;

const lotes = <T>(a: T[], n = 500) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

Deno.serve(async (req) => {
  const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return out({ error: "Não autenticado" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: c, error } = await anon.auth.getClaims(auth.slice(7));
  if (error || !c?.claims?.sub) return out({ error: "Não autenticado" }, 401);
  const uid = c.claims.sub as string;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", uid);
  if (!papelAutorizado((roles ?? []).map((r: { role: string }) => r.role))) return out({ error: "Sem permissão" }, 403);

  const { data: log } = await db.from("gov_sync_log").insert({ iniciado_por: uid }).select("id").single();
  const fim = async (campos: Record<string, unknown>) => {
    if (log?.id) await db.from("gov_sync_log").update({ ...campos, concluido_em: new Date().toISOString() }).eq("id", log.id);
    return out(campos);
  };

  const token = Deno.env.get("GOV_EXPORT_TOKEN");
  if (!token) return fim({ ok: false, status_http: null, erro: "secret_ausente" });

  let destino = Deno.env.get("GOV_EXPORT_URL") || URL_PADRAO;
  if (USAR_DESDE) {
    const { data: ult } = await db.from("gov_sync_log").select("concluido_em").eq("ok", true).order("concluido_em", { ascending: false }).limit(1).maybeSingle();
    if (ult?.concluido_em) destino += `?desde=${encodeURIComponent(ult.concluido_em)}`;
  }

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

    return fim({
      ok: true, status_http: status,
      acoes_recebidas: p.acoes_recebidas, acoes_inseridas: cont.inseridas, acoes_atualizadas: cont.atualizadas,
      deliberacoes_recebidas: p.deliberacoes_recebidas, deliberacoes_excluidas: p.deliberacoes_excluidas,
      nomes_novos: novos.length,
    });
  } catch {
    return fim({ ok: false, status_http: status, erro: "falha_gravacao" });
  }
});
