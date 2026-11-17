import { createClient } from "npm:@supabase/supabase-js@2";

/** Valida o token do chamador e exige conta liberada (usuario_liberado e não líder restrito). Retorna Response de erro ou null. */
export async function exigirContaLiberada(req: Request, cors: Record<string, string>): Promise<Response | null> {
  const resp = (error: string, status: number) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return resp("Não autenticado", 401);
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u, error } = await client.auth.getUser(auth.slice(7));
  if (error || !u?.user) return resp("Não autenticado", 401);
  const [lib, restr] = await Promise.all([
    client.rpc("usuario_liberado", { _uid: u.user.id }),
    client.rpc("is_lider_restrito", { _uid: u.user.id }),
  ]);
  if (lib.error || restr.error || lib.data !== true || restr.data !== false) return resp("Conta não liberada", 403);
  return null;
}
