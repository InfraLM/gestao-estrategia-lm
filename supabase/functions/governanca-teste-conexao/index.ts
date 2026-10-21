import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { agregar, papelAutorizado } from "./agregar.ts";

const URL_PADRAO = "https://zrbixzqorerfespucmni.supabase.co/functions/v1/exportar-estrategia";

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
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", c.claims.sub);
  if (!papelAutorizado((roles ?? []).map((r: { role: string }) => r.role))) return out({ error: "Sem permissão" }, 403);

  const token = Deno.env.get("GOV_EXPORT_TOKEN");
  if (!token) return out({ ok: false, status_http: null, motivo: "secret_ausente" }, 200);
  try {
    const r = await fetch(Deno.env.get("GOV_EXPORT_URL") || URL_PADRAO, {
      headers: { "x-integracao-token": token }, signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) { await r.body?.cancel(); return out({ ok: false, status_http: r.status }); }
    return out({ ok: true, status_http: r.status, ...agregar(await r.json()) });
  } catch {
    return out({ ok: false, status_http: null });
  }
});
