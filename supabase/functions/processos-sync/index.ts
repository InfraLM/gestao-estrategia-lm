import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { mapearExport, kpiChave, sugerirIndicador } from "./mapear.ts";

// Sincronização com o app "Gestão Processos - Zeev". DESLIGADA até: (1) a exportação existir lá,
// (2) os secrets PROC_EXPORT_URL e PROC_EXPORT_TOKEN, (3) a Governança ligar a integração.
// Grava apenas espelhos somente leitura e sugestões de correspondência (nunca confirma).
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

  const teste = new URL(req.url).searchParams.get("teste") === "1";
  const { data: cfg } = await admin.from("proc_integracao_config").select("ativo").maybeSingle();
  if (!cfg?.ativo) return out({ ok: false, motivo: "desligada" });
  const token = Deno.env.get("PROC_EXPORT_TOKEN"), alvo = Deno.env.get("PROC_EXPORT_URL");
  if (!token || !alvo) return out({ ok: false, motivo: "secret_ausente" });

  const { data: log } = teste ? { data: null } : await admin.from("proc_sync_log").insert({ modo: "manual" }).select("id").single();
  const fim = async (b: Record<string, unknown>) => { if (log) await admin.from("proc_sync_log").update({ concluido_em: new Date().toISOString(), ...b }).eq("id", log.id); };
  try {
    const r = await fetch(alvo, { headers: { "x-integracao-token": token }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) { await r.body?.cancel(); await fim({ ok: false, mensagem: `HTTP ${r.status}` }); return out({ ok: false, status_http: r.status }); }
    const m = mapearExport(await r.json());
    if (teste) return out({ ok: true, processos: m.procs.length, impactos: m.imps.length, melhorias: m.mels.length });
    if (m.procs.length) await admin.from("proc_espelho_processos").upsert(m.procs.map((p) => ({ ...p, sincronizado_em: new Date().toISOString() })));
    if (m.removidos.length) await admin.from("proc_espelho_processos").update({ ativo: false }).in("origem_id", m.removidos);
    for (const pid of new Set(m.imps.map((i) => i.processo_origem_id))) await admin.from("proc_espelho_impactos").delete().eq("processo_origem_id", pid);
    if (m.imps.length) await admin.from("proc_espelho_impactos").insert(m.imps);
    if (m.mels.length) await admin.from("proc_espelho_melhorias").upsert(m.mels.map((x) => ({ ...x, sincronizado_em: new Date().toISOString() })));
    const { data: inds } = await admin.from("mt_indicadores").select("id,codigo,nome").eq("status", "ativo");
    const kpis = new Map(m.imps.map((i) => [kpiChave(i.kpi_codigo, i.kpi_nome), i]));
    if (kpis.size) await admin.from("proc_kpi_correspondencia").upsert([...kpis].map(([k, i]) => ({
      kpi_chave: k, kpi_nome_origem: i.kpi_nome, kpi_codigo_origem: i.kpi_codigo, indicador_id: sugerirIndicador(i.kpi_codigo, i.kpi_nome, inds ?? []),
    })), { onConflict: "kpi_chave", ignoreDuplicates: true });
    const dirs = [...new Set(m.procs.map((p) => p.diretoria).filter(Boolean))];
    if (dirs.length) await admin.from("proc_diretoria_cadeira").upsert(dirs.map((d) => ({ diretoria: d })), { onConflict: "diretoria", ignoreDuplicates: true });
    await fim({ ok: true, processos: m.procs.length, impactos: m.imps.length, melhorias: m.mels.length });
    return out({ ok: true, processos: m.procs.length, impactos: m.imps.length, melhorias: m.mels.length });
  } catch {
    await fim({ ok: false, mensagem: "falha de conexão" });
    return out({ ok: false, status_http: null });
  }
});
