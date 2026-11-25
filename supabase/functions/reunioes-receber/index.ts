import { createClient } from "npm:@supabase/supabase-js@2";
import { ErroContrato, LIMITE_BYTES, tokenConfere, validarReuniao } from "./validar.ts";

// Recebe as reuniões do app de Reuniões (TI, Vini), uma por envio, de servidor para servidor.
// Autenticação: segredo REUNIOES_INGEST_TOKEN (mín. 32 caracteres) no cabeçalho x-integracao-token.
// Grava só por reun_receber (service role): atualiza pelo id, nunca apaga (itens que somem viram removido=true).
const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return out({ erro: "Use POST" }, 405);
  const esperado = Deno.env.get("REUNIOES_INGEST_TOKEN");
  if (!esperado || esperado.length < 32) return out({ erro: "Integração não configurada" }, 503);
  if (!tokenConfere(req.headers.get("x-integracao-token"), esperado)) return out({ erro: "Token ausente ou inválido" }, 401);

  const tamanho = Number(req.headers.get("content-length") ?? 0);
  if (tamanho > LIMITE_BYTES) return out({ erro: "Envio maior que 2 MB" }, 413);
  const bruto = await req.text();
  if (new TextEncoder().encode(bruto).length > LIMITE_BYTES) return out({ erro: "Envio maior que 2 MB" }, 413);

  let corpo: unknown;
  try { corpo = JSON.parse(bruto); } catch { return out({ erro: "JSON inválido" }, 400); }
  let dados;
  try { dados = validarReuniao(corpo); } catch (e) {
    if (e instanceof ErroContrato) return out({ erro: e.message }, 400);
    throw e;
  }

  const url = Deno.env.get("SUPABASE_URL"), chave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !chave) return out({ erro: "Configuração ausente" }, 503);
  const db = createClient(url, chave, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("reun_receber", { _dados: dados });
  if (error) { console.error("reun_receber", error.message); return out({ erro: "Falha ao gravar; tente de novo em alguns minutos" }, 500); }
  return out({ ok: true, id: dados.id, resultado: data ?? "gravado", recebido_em: new Date().toISOString() });
});
