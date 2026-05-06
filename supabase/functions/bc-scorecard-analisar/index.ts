// Edge function: analisa um Business Case com base no framework ScoreCard LM
// e retorna gate (saudavel/condicional/bloqueado) + análise detalhada por dimensão.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import mammoth from "npm:mammoth@1.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FRAMEWORK = `
# ScoreCard LM — Diretriz Operacional de Governança de Projetos

Avalie o Business Case em 5 dimensões. As 3 primeiras são ESTRUTURAIS (um vermelho pode bloquear); as 2 últimas são OPERACIONAIS.

## 1. Tese Financeira
- ROI 24m: ≥40% Verde | 20–39% Amarelo | <20% Vermelho
- Payback eficiência/automação: ≤12m V | 13–18m A | >18m R
- Payback produto/recorrência: ≤18m V | 19–24m A | >24m R

## 2. Risco Institucional
- Jurídico/regulatório: marco conhecido V | zona cinzenta com parecer A | risco autuação/judicialização R
- Reputacional: invisível/reforça marca V | ruído controlável A | compromete confiança R
- Clínico/ético: sem implicação V | atenção A | compromete autoridade científica R

## 3. Evidência de Demanda
- Volume base ativa: >10% V | 5–9% A | <5% ou sem dado R
- Qualidade fonte: dado concreto (ticket, NPS, pesquisa) V | benchmarking/qualitativo A | tese interna sem validação R

## 4. Capacidade Operacional
- Peso técnico: domínio total V | treinamento <10% A | treinamento ≥10% ou contratação sênior R
- Sequestro capacidade: <15% V | 15–25% A | >25% R
- Regra: 2 critérios vermelhos = dimensão vermelha; 1 vermelho = dimensão amarela

## 5. Trade-offs
- Conflito de fila: nenhum afetado V | 1 secundário reprogramado A | >1 ou estratégico sacrificado R

## Gate
- Saudável: 0 vermelhos estruturais e até 1 operacional
- Condicional: 1 vermelho estrutural isolado OU 2 operacionais
- Bloqueado: 2+ estruturais OU 1 estrutural + 1 operacional

## Janela Estratégica (concessão)
Pontos: Exclusividade (1–3) + Urgência (1–3) + Custo de inação (1–3)
- 8–9 Única: até +1 vermelho operacional adicional (vedado reputacional/clínico)
- 5–7 Passiva: nenhuma concessão, exige validação executiva
- 3–4 Indiferente: sem concessão
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { submissao_id } = await req.json();
    if (!submissao_id) throw new Error("submissao_id requerido");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: sub, error } = await supabase
      .from("bc_scorecard_submissoes").select("*").eq("id", submissao_id).single();
    if (error || !sub) throw new Error(error?.message || "submissão não encontrada");

    await supabase.from("bc_scorecard_submissoes")
      .update({ status: "analisando" }).eq("id", submissao_id);

    // Se há arquivo: PDF vai como anexo multimodal; DOCX é convertido para texto via mammoth;
    // demais tipos (txt/md/csv) são lidos como texto. Outros formatos não suportados pelo Gemini.
    let fileParts: any[] = [];
    let extractedText = "";
    if (sub.arquivo_path) {
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("business-cases").download(sub.arquivo_path);
      if (dlErr) throw new Error(`Falha ao baixar arquivo: ${dlErr.message}`);
      const arrayBuf = await fileData.arrayBuffer();
      const mime = (sub.arquivo_tipo || "").toLowerCase();
      const nameLower = (sub.arquivo_nome || "").toLowerCase();
      const isPdf = mime.includes("pdf") || nameLower.endsWith(".pdf");
      const isDocx = mime.includes("officedocument.wordprocessingml") || nameLower.endsWith(".docx");
      const isText = mime.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(nameLower);

      if (isPdf) {
        const buf = new Uint8Array(arrayBuf);
        let b64 = "";
        const chunk = 0x8000;
        for (let i = 0; i < buf.length; i += chunk) {
          b64 += String.fromCharCode(...buf.subarray(i, i + chunk));
        }
        b64 = btoa(b64);
        fileParts.push({ type: "image_url", image_url: { url: `data:application/pdf;base64,${b64}` } });
      } else if (isDocx) {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
        extractedText = result.value || "";
      } else if (isText) {
        extractedText = new TextDecoder().decode(arrayBuf);
      } else {
        extractedText = `[Arquivo "${sub.arquivo_nome}" do tipo ${mime || "desconhecido"} não pôde ser lido automaticamente. Converta para PDF ou DOCX.]`;
      }
    }

    const userText = `
Business Case submetido:

Título: ${sub.titulo}
Proponente: ${sub.proponente ?? "—"}
Área: ${sub.area ?? "—"}
Tipo de projeto: ${sub.tipo_projeto}
Problema: ${sub.problema ?? "—"}
Hipótese: ${sub.hipotese ?? "—"}
Público-alvo: ${sub.publico_alvo ?? "—"}

Tese financeira:
- ROI estimado (24m): ${sub.roi_pct ?? "n/i"}%
- Payback estimado: ${sub.payback_meses ?? "n/i"} meses

Demanda:
- % base ativa com manifestação: ${sub.pct_base_demanda ?? "n/i"}%
- Qualidade da fonte: ${sub.qualidade_fonte ?? "n/i"}
- Evidência: ${sub.evidencia_demanda ?? "—"}

Risco:
- Jurídico/regulatório: ${sub.risco_juridico ?? "n/i"}
- Reputacional: ${sub.risco_reputacional ?? "n/i"}
- Clínico/ético: ${sub.risco_clinico ?? "n/i"}

Capacidade:
- Peso técnico: ${sub.peso_tecnico ?? "n/i"}
- Sequestro de capacidade: ${sub.sequestro_capacidade_pct ?? "n/i"}%

Trade-offs:
- Conflito de fila: ${sub.conflito_fila ?? "n/i"}

Janela estratégica:
- Exclusividade: ${sub.janela_exclusividade ?? 1}/3
- Urgência: ${sub.janela_urgencia ?? 1}/3
- Custo de inação: ${sub.janela_custo_inacao ?? 1}/3

${sub.arquivo_path ? "IMPORTANTE: o anexo contém o Business Case completo. EXTRAIA do anexo todas as informações que faltam acima (ROI, payback, riscos, demanda, capacidade, trade-offs, janela) e use-as na análise. Quando o formulário e o anexo divergirem, prefira o anexo se mais detalhado." : ""}

${extractedText ? `--- CONTEÚDO DO ARQUIVO ANEXO ---\n${extractedText.slice(0, 60000)}\n--- FIM DO ARQUIVO ---` : ""}

Aplique RIGOROSAMENTE o framework ScoreCard LM. Retorne JSON:
{
  "gate": "saudavel" | "condicional" | "bloqueado",
  "resumo_executivo": "string (até 3 parágrafos)",
  "dados_extraidos": { "titulo":"", "proponente":"", "area":"", "tipo_projeto":"", "problema":"", "hipotese":"", "publico_alvo":"", "roi_pct":null, "payback_meses":null, "pct_base_demanda":null, "qualidade_fonte":"", "evidencia_demanda":"", "risco_juridico":"", "risco_reputacional":"", "risco_clinico":"", "peso_tecnico":"", "sequestro_capacidade_pct":null, "conflito_fila":"" },
  "janela": { "pontos": number, "classificacao": "Única|Passiva|Indiferente", "concessao_aplicada": boolean, "justificativa": "string" },
  "dimensoes": [
    { "nome": "Tese Financeira", "tipo": "estrutural", "cor": "verde|amarelo|vermelho", "criterios": [{"nome": "string","cor":"verde|amarelo|vermelho","comentario":"string"}], "analise": "string" }
  ],
  "vermelhos_estruturais": number,
  "vermelhos_operacionais": number,
  "recomendacoes": ["string"],
  "plano_mitigacao": ["string"]
}`;

    const userContent: any = fileParts.length > 0
      ? [{ type: "text", text: userText }, ...fileParts]
      : userText;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: `Você é um analista do PMO da Liberdade Médica. Aplique o framework ScoreCard LM com rigor. Sempre responda em JSON válido conforme solicitado.\n\n${FRAMEWORK}` },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      throw new Error(`AI gateway ${aiResp.status}: ${txt}`);
    }

    const aiJson = await aiResp.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    await supabase.from("bc_scorecard_submissoes").update({
      status: "analisado",
      ai_gate: parsed.gate ?? null,
      ai_resumo: parsed.resumo_executivo ?? null,
      ai_resultado: parsed,
      ai_erro: null,
    }).eq("id", submissao_id);

    return new Response(JSON.stringify({ ok: true, resultado: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    try {
      const { submissao_id } = await req.clone().json().catch(() => ({}));
      if (submissao_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase.from("bc_scorecard_submissoes")
          .update({ status: "erro", ai_erro: msg }).eq("id", submissao_id);
      }
    } catch (_) {}
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
