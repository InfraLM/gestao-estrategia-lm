import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const schema = z.object({ convite_id: z.string().uuid() });
Deno.serve(async (req) => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Método não permitido" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return respond({ error: "Serviço de convite indisponível" }, 503);
    const client = createClient(url, key);
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return respond({ error: "Entre na sua conta" }, 401);
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user) return respond({ error: "Sessão inválida" }, 401);
    const { data: allowed, error: roleError } = await client.rpc("is_super_admin", { _user_id: auth.user.id });
    if (roleError || !allowed) return respond({ error: "Somente o Admin Principal pode convidar usuários" }, 403);
    const input = schema.safeParse(await req.json());
    if (!input.success) return respond({ error: "Convite inválido" }, 400);
    const { data: invite, error } = await client.from("usuario_convites").select("id,email,aceito_em").eq("id", input.data.convite_id).single();
    if (error || !invite || invite.aceito_em) return respond({ error: "Convite não encontrado ou já aceito" }, 400);
    const { error: sendError } = await client.auth.admin.inviteUserByEmail(invite.email, { redirectTo: "https://nextlevel-lm.lovable.app/auth" });
    if (sendError) return respond({ error: "Convite cadastrado, mas não foi possível enviar o e-mail. Verifique se a conta já existe ou tente novamente." }, 400);
    const { error: updateError } = await client.from("usuario_convites").update({ email_enviado_em: new Date().toISOString() }).eq("id", invite.id);
    if (updateError) return respond({ error: "E-mail enviado, mas a confirmação de envio não foi registrada." }, 500);
    return respond({ ok: true });
  } catch {
    return respond({ error: "Não foi possível enviar o convite" }, 500);
  }
});