// Backlog Estratégico — análise IA de submissões
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TEXT_MIME_PREFIXES = ["text/", "application/json", "application/xml"];

function isTextual(mime: string | null): boolean {
  if (!mime) return false;
  return TEXT_MIME_PREFIXES.some((p) => mime.startsWith(p)) ||
    mime.includes("csv");
}

async function safeReadAsText(blob: Blob, maxChars = 12000): Promise<string> {
  try {
    const t = await blob.text();
    return t.length > maxChars ? t.slice(0, maxChars) + "\n…[truncado]" : t;
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissao_id } = await req.json();
    if (!submissao_id) {
      return new Response(JSON.stringify({ error: "submissao_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Carrega submissão
    const { data: sub, error: subErr } = await admin
      .from("backlog_submissoes")
      .select("*")
      .eq("id", submissao_id)
      .single();
    if (subErr || !sub) throw new Error("Submissão não encontrada");

    await admin
      .from("backlog_submissoes")
      .update({ status: "processando", erro: null })
      .eq("id", submissao_id);

    // Baixa arquivo
    let conteudo = "";
    try {
      const { data: file, error: fileErr } = await admin.storage
        .from("backlog-submissoes")
        .download(sub.arquivo_path);
      if (fileErr) throw fileErr;
      if (file && isTextual(sub.arquivo_tipo)) {
        conteudo = await safeReadAsText(file);
      } else if (file) {
        conteudo =
          `[Arquivo binário (${sub.arquivo_tipo ?? "?"}, ${sub.arquivo_tamanho ?? 0} bytes). Conteúdo não-textual — análise se baseia no título e descrição fornecidos pelo autor.]`;
      }
    } catch (e) {
      console.error("download err", e);
    }

    // Pega backlog atual (para a IA evitar duplicatas e propor vínculos coerentes)
    // Como o backlog é mock no front, mandamos só os dados textuais via descrição.
    // Aqui, se houver tabela futura, plugamos aqui. Por enquanto, contexto vazio.
    const contextoIniciativas: Array<{ id: string; titulo: string; tipo: string; wave: string }> = [];

    const systemPrompt = `Você é o assistente de PMO Estratégico da Liberdade Médica.
Sua função é analisar documentos submetidos (planilhas, PDFs, atas, gravações transcritas, apresentações) e propor atualizações no Backlog Estratégico.

Regras:
- Cada iniciativa tem: tipo ("Reforço de Fraqueza" | "Defesa Identificada" | "Potencializar Força" | "Explorar Oportunidade"), wave ("W1"|"W2"|"W3"), prioridade ("Crítica"|"Alta"|"Média"|"Baixa"), responsavel, ICE (1-10), titulo, acao (o que fazer), resultadoEsperado, vinculos (lista de projetos do portfólio).
- Retorne propostas concretas, evitando duplicatas. Se já existir iniciativa similar no contexto, sugira "atualizar" em vez de "criar".
- Use "vincular" quando o documento aponta para um projeto existente.
- Confiança 0..1: quão certo está da proposta.`;

    const userPrompt = `Submissão: ${sub.titulo}
Descrição/observações do autor: ${sub.descricao ?? "(vazio)"}
Arquivo: ${sub.arquivo_nome} (${sub.arquivo_tipo ?? "?"})

Contexto — iniciativas já existentes no backlog:
${JSON.stringify(contextoIniciativas).slice(0, 4000)}

Conteúdo extraído do arquivo:
"""
${conteudo || "(sem conteúdo textual)"}
"""

Gere de 1 a 6 propostas de atualização do Backlog Estratégico.`;

    const tool = {
      type: "function",
      function: {
        name: "propor_atualizacoes_backlog",
        description: "Lista de propostas de atualização do backlog estratégico.",
        parameters: {
          type: "object",
          properties: {
            resumo: { type: "string", description: "Resumo executivo da análise (até 400 caracteres)." },
            propostas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  acao: { type: "string", enum: ["criar", "atualizar", "vincular"] },
                  iniciativa_ref: { type: "string", description: "ID da iniciativa existente, se 'atualizar' ou 'vincular'." },
                  titulo: { type: "string" },
                  tipo: { type: "string", enum: ["Reforço de Fraqueza", "Defesa Identificada", "Potencializar Força", "Explorar Oportunidade"] },
                  wave: { type: "string", enum: ["W1", "W2", "W3"] },
                  prioridade: { type: "string", enum: ["Crítica", "Alta", "Média", "Baixa"] },
                  responsavel: { type: "string" },
                  ice: { type: "number" },
                  acao_descricao: { type: "string", description: "O que fazer." },
                  resultado_esperado: { type: "string" },
                  vinculos: {
                    type: "array",
                    items: { type: "string" },
                    description: "IDs ou nomes de projetos a vincular.",
                  },
                  justificativa: { type: "string" },
                  confianca: { type: "number", minimum: 0, maximum: 1 },
                },
                required: ["acao", "titulo", "justificativa", "confianca"],
                additionalProperties: false,
              },
            },
          },
          required: ["propostas"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "propor_atualizacoes_backlog" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429 || aiResp.status === 402) {
        await admin.from("backlog_submissoes").update({
          status: "erro",
          erro: aiResp.status === 429
            ? "Rate limit excedido. Tente novamente em instantes."
            : "Créditos de IA esgotados. Adicione fundos no workspace.",
        }).eq("id", submissao_id);
        return new Response(JSON.stringify({ error: "ai_unavailable", code: aiResp.status }), {
          status: aiResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Sem proposta da IA");
    const args = JSON.parse(toolCall.function.arguments || "{}");
    const propostas: any[] = Array.isArray(args.propostas) ? args.propostas : [];

    if (propostas.length > 0) {
      const rows = propostas.map((p) => ({
        submissao_id,
        acao: p.acao,
        iniciativa_ref: p.iniciativa_ref ?? null,
        payload: {
          titulo: p.titulo,
          tipo: p.tipo,
          wave: p.wave,
          prioridade: p.prioridade,
          responsavel: p.responsavel,
          ice: p.ice,
          acao_descricao: p.acao_descricao,
          resultado_esperado: p.resultado_esperado,
          vinculos: p.vinculos ?? [],
        },
        justificativa: p.justificativa,
        confianca: p.confianca,
        status: "pendente",
      }));
      await admin.from("backlog_propostas_ia").insert(rows);
    }

    await admin.from("backlog_submissoes").update({
      status: "processado",
      resumo_ia: args.resumo ?? null,
    }).eq("id", submissao_id);

    return new Response(
      JSON.stringify({ ok: true, propostas: propostas.length, resumo: args.resumo }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("backlog-analisar fatal", e);
    try {
      const { submissao_id } = await req.clone().json().catch(() => ({}));
      if (submissao_id) {
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
        await admin.from("backlog_submissoes").update({
          status: "erro",
          erro: e instanceof Error ? e.message : String(e),
        }).eq("id", submissao_id);
      }
    } catch {}
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
