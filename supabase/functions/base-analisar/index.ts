// Análise IA de arquivos submetidos para atualização da base (Estratégia, OKRs, PMO)
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import * as XLSX from "npm:xlsx@0.18.5";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const GATEWAY = "https://ai.gateway.lovable.dev";
const MODEL = "openai/gpt-6-astra";
const MAX_TXT = 60000;

const ENTIDADES: Record<string, string> = {
  estrategia: `Entidades permitidas:
- "objetivo": ref = código do objetivo (ex.: F.01). campos: "nome".
- "kpi": ref = nome exato do KPI existente. campos: "meta2026", "situacaoAtual", "farol", "formula", "diretor", "coDiretor", "responsavelImplantacao", "statusImplantacao".`,
  okrs: `Entidades permitidas:
- "kr": ref = código do KR (ex.: OKR1-KR2, NSM-1). campos: "meta", "status", "responsavel", "obs", "tipo", "peso" (peso decimal 0..1).
- "meta_diretor": ref = "<Diretor>::<Indicador exato>". campos: "meta", "peso" (decimal 0..1), "obs", "tipo".`,
  cesta: `Entidades permitidas:
- "meta_diretor": ref = "<Diretor>::<Indicador exato>". campos: "meta", "peso" (decimal 0..1), "obs", "tipo".`,
  pmo: `Entidades permitidas:
- "projeto": ref = código do projeto (ex.: P014). campos: "status" (Backlog|A Iniciar|Em Andamento|Pausado|Atrasado|Concluído|Cancelado|Em Avaliação|Validação|Encerramento), "saude" (On-Track|Alerta|Off-Track), "avancos", "causa_raiz", "plano_acao", "diretor", "gerente", "budget" (número), "realizado" (número), "termino" (ex.: 2026/2), "wave" (W1|W2|W3).`,
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["resumo", "propostas"],
  properties: {
    resumo: { type: "string" },
    propostas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["entidade", "ref", "campo", "valor_atual", "valor_novo", "justificativa", "confianca"],
        properties: {
          entidade: { type: "string" },
          ref: { type: "string" },
          campo: { type: "string" },
          valor_atual: { type: "string" },
          valor_novo: { type: "string" },
          justificativa: { type: "string" },
          confianca: { type: "number" },
        },
      },
    },
  },
};

const ext = (n: string) => (n.split(".").pop() || "").toLowerCase();
const toB64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

async function extrair(blob: Blob, nome: string, mime: string, apiKey: string): Promise<{ texto?: string; parte?: Record<string, unknown>; nota?: string }> {
  const e = ext(nome);
  const buf = await blob.arrayBuffer();
  if (["xlsx", "xls", "xlsm", "ods", "csv"].includes(e)) {
    const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
    return { texto: wb.SheetNames.map((s) => `### Aba: ${s}\n${XLSX.utils.sheet_to_csv(wb.Sheets[s])}`).join("\n\n") };
  }
  if (["docx", "pptx"].includes(e)) {
    const zip = await JSZip.loadAsync(buf);
    const files = Object.keys(zip.files).filter((f) => e === "docx" ? f === "word/document.xml" : /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort();
    const parts: string[] = [];
    for (const f of files) {
      const xml = await zip.files[f].async("string");
      parts.push(xml.replace(/<\/(w:p|a:p)>/g, "\n").replace(/<[^>]+>/g, "").replace(/\n{2,}/g, "\n"));
    }
    return { texto: parts.join("\n---\n") };
  }
  if (e === "pdf" || mime.includes("pdf")) {
    return { parte: { type: "input_file", filename: nome, file_data: `data:application/pdf;base64,${toB64(buf)}` } };
  }
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(e)) {
    return { parte: { type: "input_image", image_url: `data:${mime || "image/png"};base64,${toB64(buf)}` } };
  }
  if (mime.startsWith("audio/") || mime.startsWith("video/") || ["mp3", "wav", "m4a", "mp4", "webm", "ogg"].includes(e)) {
    const fd = new FormData();
    fd.append("file", new File([buf], nome, { type: mime || "audio/mpeg" }));
    fd.append("model", "openai/gpt-transcribe");
    const r = await fetch(`${GATEWAY}/v1/audio/transcriptions`, { method: "POST", headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" }, body: fd });
    if (!r.ok) return { nota: `Falha ao transcrever áudio [${r.status}]: ${(await r.text()).slice(0, 300)}` };
    const j = await r.json();
    return { texto: `Transcrição:\n${j.text ?? ""}` };
  }
  // texto puro / json / md / xml / desconhecido
  try {
    return { texto: new TextDecoder().decode(buf) };
  } catch {
    return { nota: `Arquivo ${nome} não pôde ser lido.` };
  }
}

async function chamarIA(apiKey: string, system: string, content: Record<string, unknown>[]) {
  const r = await fetch(`${GATEWAY}/v1/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_schema", name: "propostas_base", strict: true, schema: SCHEMA } },
      input: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });
  if (!r.ok || !r.body) {
    const t = await r.text();
    throw Object.assign(new Error(`[${r.status}] ${t.slice(0, 500)}`), { status: r.status });
  }
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "", out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const linhas = buf.split("\n");
    buf = linhas.pop() ?? "";
    for (const l of linhas) {
      if (!l.startsWith("data:")) continue;
      const d = l.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      let ev: any;
      try { ev = JSON.parse(d); } catch { continue; }
      if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
      else if (ev.type === "response.failed" || ev.type === "error") throw new Error(ev.response?.error?.message ?? ev.message ?? "Falha da IA");
      else if (ev.type === "response.refusal.delta") throw new Error("A IA recusou analisar este conteúdo.");
    }
  }
  if (!out.trim()) throw new Error("A IA não retornou conteúdo.");
  return JSON.parse(out);
}

async function processar(submissaoId: string) {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const setSub = (v: Record<string, unknown>) => admin.from("base_submissoes").update(v).eq("id", submissaoId);
  try {
    const { data: sub, error } = await admin.from("base_submissoes").select("*").eq("id", submissaoId).single();
    if (error || !sub) throw new Error("Submissão não encontrada");
    await setSub({ status: "processando", erro: null });

    const { data: file, error: fe } = await admin.storage.from("base-submissoes").download(sub.arquivo_path);
    if (fe || !file) throw new Error("Não foi possível baixar o arquivo");
    const ex = await extrair(file, sub.arquivo_nome, sub.arquivo_tipo ?? "", apiKey);

    const content: Record<string, unknown>[] = [{
      type: "input_text",
      text: `Título: ${sub.titulo}\nObservações do autor: ${sub.descricao ?? "(vazio)"}\nArquivo: ${sub.arquivo_nome}\n\nBASE ATUAL (JSON):\n${(sub.contexto ?? "").slice(0, 40000)}\n\n${ex.texto ? `CONTEÚDO DO ARQUIVO:\n"""\n${ex.texto.slice(0, MAX_TXT)}\n"""` : ex.nota ?? "Conteúdo anexado abaixo."}`,
    }];
    if (ex.parte) content.push(ex.parte);

    const system = `Você é o analista de governança estratégica da Liberdade Médica (LM).
Compare o arquivo submetido com a BASE ATUAL do módulo "${sub.modulo}" e proponha atualizações campo a campo, para aprovação humana.
${ENTIDADES[sub.modulo] ?? ""}
Regras:
- Use apenas entidades, refs e campos permitidos; o "ref" deve existir na base atual.
- Proponha só mudanças sustentadas pelo arquivo; não invente valores. valor_atual = valor hoje na base ("" se vazio).
- confianca entre 0 e 1. justificativa curta citando o trecho/linha do arquivo.
- No máximo 25 propostas. Se nada mudar, retorne lista vazia e explique no resumo.
- resumo: até 500 caracteres, em português.`;

    const res = await chamarIA(apiKey, system, content);
    const propostas = (Array.isArray(res.propostas) ? res.propostas : []).slice(0, 25);
    if (propostas.length) {
      const { error: ie } = await admin.from("base_propostas_ia").insert(propostas.map((p: any) => ({
        submissao_id: submissaoId, modulo: sub.modulo, entidade: p.entidade, ref: p.ref, campo: p.campo,
        valor_atual: p.valor_atual ?? null, valor_novo: String(p.valor_novo ?? ""), justificativa: p.justificativa,
        confianca: Math.max(0, Math.min(1, Number(p.confianca) || 0)),
      })));
      if (ie) throw ie;
    }
    await setSub({ status: "analisado", resumo_ia: res.resumo ?? null });
  } catch (e: any) {
    console.error("base-analisar", e);
    const st = e?.status;
    const msg = st === 402 ? "Créditos de IA esgotados no workspace." : st === 429 ? "Limite de uso da IA atingido. Tente novamente em instantes." : String(e?.message ?? e);
    await setSub({ status: "erro", erro: msg.slice(0, 1000) });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Não autenticado" }, 401);
    const { submissao_id } = await req.json();
    if (!submissao_id || typeof submissao_id !== "string") return json({ error: "submissao_id obrigatório" }, 400);
    // @ts-ignore EdgeRuntime é global no Supabase
    EdgeRuntime.waitUntil(processar(submissao_id));
    return json({ ok: true, status: "processando" }, 202);
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
