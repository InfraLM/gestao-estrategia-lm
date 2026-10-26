import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { mapearExport, sugerirCadeira } from "./mapear.ts";

// Sincronização com o app Fit Finder (raio-x dos prestadores). Começa DESLIGADA; exige
// FITFINDER_EXPORT_URL/FITFINDER_EXPORT_TOKEN e Governança/CEO. Grava apenas agregados por diretoria.
Deno.serve(async (req) => {
  const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return out({ error: "Não autenticado" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: c, error } = await anon.auth.getClaims(auth.slice(7));
  if (error || !c?.claims?.sub) return out({ error: "Não autenticado" }, 401);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: ok } = await admin.rpc("proj_gov_ou_ceo", { _uid: c.claims.sub });
  if (!ok) return out({ error: "Sem permissão" }, 403);

  const params = new URL(req.url).searchParams;
  const teste = params.get("teste") === "1";
  const desde = params.get("desde");
  const { data: cfg } = await admin.from("fitfinder_integracao_config").select("ativo").maybeSingle();
  if (!cfg?.ativo) return out({ ok: false, motivo: "desligada" });
  const token = Deno.env.get("FITFINDER_EXPORT_TOKEN"), alvo = Deno.env.get("FITFINDER_EXPORT_URL");
  if (!token || !alvo) return out({ ok: false, motivo: "secret_ausente" });

  const { data: log } = teste ? { data: null } : await admin.from("fitfinder_sync_log").insert({ modo: "manual", usuario: c.claims.sub }).select("id").single();
  const fim = async (b: Record<string, unknown>) => { if (log) await admin.from("fitfinder_sync_log").update({ concluido_em: new Date().toISOString(), ...b }).eq("id", log.id); };
  try {
    const u = new URL(alvo);
    if (desde && !Number.isNaN(Date.parse(desde))) u.searchParams.set("desde", desde);
    const r = await fetch(u, { headers: { "x-integracao-token": token }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) { await r.body?.cancel(); await fim({ ok: false, mensagem: `HTTP ${r.status}` }); return out({ ok: false, status_http: r.status }); }
    const m = mapearExport(await r.json());
    if (teste) return out({ ok: true, diretorias: m.diretorias.length });
    const agora = new Date().toISOString();
    if (m.diretorias.length) {
      await admin.from("fitfinder_espelho").upsert(m.diretorias.map((d) => ({ ...d, ativo: true, gerado_em: m.gerado_em, sincronizado_em: agora })));
      const { data: cads } = await admin.from("mt_cadeiras").select("id,nome").eq("ativo", true);
      await admin.from("fitfinder_diretoria_cadeira").upsert(
        m.diretorias.map((d) => ({ diretoria: d.diretoria, cadeira_id: sugerirCadeira(d.diretoria, cads ?? []), status: "sugerido" })),
        { onConflict: "diretoria", ignoreDuplicates: true });
    }
    // sincronização completa (sem "desde"): diretorias ausentes deixam de aparecer
    if (!desde) {
      const nomes = m.diretorias.map((d) => d.diretoria);
      const q = admin.from("fitfinder_espelho").update({ ativo: false });
      await (nomes.length ? q.not("diretoria", "in", `(${nomes.map((n) => `"${n.replace(/"/g, '\\"')}"`).join(",")})`) : q.neq("diretoria", ""));
    }
    await fim({ ok: true, diretorias: m.diretorias.length });
    return out({ ok: true, diretorias: m.diretorias.length });
  } catch {
    await fim({ ok: false, mensagem: "falha de conexão ou resposta inválida" });
    return out({ ok: false, status_http: null });
  }
});
