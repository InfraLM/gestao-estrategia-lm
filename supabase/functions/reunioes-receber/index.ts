import postgres from "npm:postgres@3.4.9";
import { ErroContrato, LIMITE_BYTES, tokenConfere, validarReuniao } from "./validar.ts";

// Recebe as reuniões do app de Reuniões (TI, Vini), uma por envio, de servidor para servidor.
// Autenticação: segredo REUNIOES_INGEST_TOKEN (mín. 32 caracteres) no cabeçalho x-integracao-token.
// Onde grava (decisão de 25/11/2026, pedido da TI por LGPD): no Postgres da LM, schema governanca, pela função
// governanca.reun_receber (docs/integracoes/reunioes-banco-lm.sql). Nada fica no banco do Lovable.
// Conexão: segredo REUNIOES_PG_URL (usuário app_governanca). O servidor da LM não aceita SSL hoje (TI, 25/11);
// se a URL trouxer sslmode=require, a conexão passa a exigir SSL sem mudar o código.
// GET com o token só confere se o banco responde (não grava nada).
const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function conectar(url: string) {
  return postgres(url, { ssl: /sslmode=(require|verify-ca|verify-full)/.test(url) ? "require" : false, max: 1, connect_timeout: 10, idle_timeout: 5, prepare: false });
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") return out({ erro: "Use POST" }, 405);
  const esperado = Deno.env.get("REUNIOES_INGEST_TOKEN");
  if (!esperado || esperado.length < 32) return out({ erro: "Integração não configurada" }, 503);
  if (!tokenConfere(req.headers.get("x-integracao-token"), esperado)) return out({ erro: "Token ausente ou inválido" }, 401);

  let dados;
  if (req.method === "POST") {
    const tamanho = Number(req.headers.get("content-length") ?? 0);
    if (tamanho > LIMITE_BYTES) return out({ erro: "Envio maior que 2 MB" }, 413);
    const bruto = await req.text();
    if (new TextEncoder().encode(bruto).length > LIMITE_BYTES) return out({ erro: "Envio maior que 2 MB" }, 413);
    let corpo: unknown;
    try { corpo = JSON.parse(bruto); } catch { return out({ erro: "JSON inválido" }, 400); }
    try { dados = validarReuniao(corpo); } catch (e) {
      if (e instanceof ErroContrato) return out({ erro: e.message }, 400);
      throw e;
    }
  }

  const url = Deno.env.get("REUNIOES_PG_URL");
  if (!url) return out({ erro: "Banco de reuniões não configurado" }, 503);
  const sql = conectar(url);
  try {
    if (!dados) {
      await sql`select 1`;
      return out({ ok: true, banco: "conectado" });
    }
    const [r] = await sql`select governanca.reun_receber(${sql.json(dados)}) as resultado`;
    return out({ ok: true, id: dados.id, resultado: r?.resultado ?? "gravado", recebido_em: new Date().toISOString() });
  } catch (e) {
    console.error("reunioes-receber", (e as Error)?.message);
    return out({ erro: "Falha ao gravar; tente de novo em alguns minutos" }, 500);
  } finally {
    await sql.end({ timeout: 2 }).catch(() => {});
  }
});
