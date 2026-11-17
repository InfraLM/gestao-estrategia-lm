import { createClient } from "npm:@supabase/supabase-js@2";
import { EMAIL_VALIDO, REMETENTE_NOME_PADRAO } from "./avisosEmail.ts";
import { credencialGmail, enviarGmail } from "./gmail.ts";

export const MENSAGEM_LIMITE_IA = "Limite diário de uso da IA atingido. Tente novamente amanhã.";
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));

/**
 * Conta 1 chamada de IA da pessoa logada (ia_registrar_uso) e devolve 429 quando o teto do dia acabou.
 * Chamadas sem usuário logado não contam. Alertas viram e-mail em segundo plano; falha no e-mail nunca bloqueia.
 */
export async function registrarUsoIa(req: Request, funcao: string, cors: Record<string, string>): Promise<Response | null> {
  const resp = (error: string, status: number) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const auth = req.headers.get("Authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data, error } = await client.rpc("ia_registrar_uso", { _funcao: funcao });
  if (error || !data) { console.error("ia_registrar_uso", error); return resp("Não foi possível verificar o limite de uso da IA.", 503); }
  const r = data as { permitido: boolean; alerta_id?: string | null };
  if (r.alerta_id) {
    const tarefa = enviarAlerta(r.alerta_id).catch(e => console.error("alerta ia", e));
    // @ts-ignore EdgeRuntime é global no runtime das funções
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(tarefa); else await tarefa;
  }
  return r.permitido ? null : resp(MENSAGEM_LIMITE_IA, 429);
}

async function enviarAlerta(id: string) {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!service) return;
  const db = createClient(Deno.env.get("SUPABASE_URL")!, service, { auth: { persistSession: false } });
  const marcar = (envio_status: string, envio_erro: string | null) => db.from("ia_uso_alertas").update({ envio_status, envio_erro }).eq("id", id);
  try {
    const { data: a } = await db.from("ia_uso_alertas").select("*").eq("id", id).single();
    if (!a) return;
    const [{ data: p }, { data: prof }] = await Promise.all([
      db.from("ia_limite_parametros").select("email_alerta").eq("id", 1).maybeSingle(),
      db.from("profiles").select("display_name,email").eq("user_id", a.user_id).maybeSingle(),
    ]);
    const para = String(p?.email_alerta ?? "").trim();
    if (!EMAIL_VALIDO.test(para)) throw new Error("email_alerta inválido");
    const credencial = credencialGmail(k => Deno.env.get(k));
    const remetente = { nome: Deno.env.get("GMAIL_REMETENTE_NOME") || REMETENTE_NOME_PADRAO, email: (Deno.env.get("GMAIL_REMETENTE") ?? "").trim().toLowerCase() };
    if (!credencial || !EMAIL_VALIDO.test(remetente.email)) throw new Error("Remetente do Gmail não configurado");
    const nome = String(prof?.display_name || prof?.email || a.user_id);
    const horario = new Date(a.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const titulo = a.tipo === "subiu" ? "atingiu 100, teto subiu para 150" : "atingiu 150, bloqueado até amanhã";
    const linhas = [`Pessoa: ${nome}`, `Função: ${a.funcao}`, `Horário: ${horario}`, `Total de chamadas no dia: ${a.chamadas}`];
    await enviarGmail(credencial, remetente, para, {
      subject: `Alerta de uso da IA: ${nome} ${titulo}`,
      text: [`Alerta de uso da IA: ${titulo}.`, "", ...linhas].join("\n"),
      html: `<p><b>Alerta de uso da IA:</b> ${esc(titulo)}.</p><ul>${linhas.map(l => `<li>${esc(l)}</li>`).join("")}</ul>`,
    });
    await marcar("enviado", null);
  } catch (e) {
    await marcar("falhou", String((e as Error)?.message ?? e).slice(0, 500));
  }
}
