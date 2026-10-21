import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// One-time admin setup: token passes server-to-server only and never enters responses.
Deno.serve(async req => {
  const out = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return out({ error: "Método não permitido" }, 405);
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return out({ error: "Não autenticado" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const token = Deno.env.get("GOV_SYNC_CRON_TOKEN");
  if (!url || !anonKey || !serviceKey || !token) return out({ ok: false, error: "Configuração ausente; não agendado" }, 503);
  const anon = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
  const { data: claims, error } = await anon.auth.getClaims(auth.slice(7));
  if (error || !claims?.claims?.sub) return out({ error: "Não autenticado" }, 401);
  const db = createClient(url, serviceKey);
  const { data: admin } = await db.rpc("gov_is_admin", { _uid: claims.claims.sub });
  if (!admin) return out({ error: "Sem permissão" }, 403);
  const { error: setupError } = await db.rpc("gov_configurar_cron", { _token: token, _url: `${url}/functions/v1/governanca-sincronizar` });
  if (setupError) return out({ ok: false, error: "Não foi possível agendar" }, 500);
  return out({ ok: true, schedule: "7 * * * *" });
});