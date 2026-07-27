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

// Framework institucional de Wave (fonte: documento "O QUE É WAVE").
// Usado para sugerir a wave adequada ao projeto e comparar com a wave declarada.
const WAVE_FRAMEWORK = `
# Framework Wave — Liberdade Médica

Wave é um agrupamento intencional e sequenciado de iniciativas que remove
restrições críticas do sistema, instala capacidades organizacionais e habilita
o próximo nível de execução da estratégia, respeitando dependências lógicas,
risco e capacidade de absorção da organização.

Wave NÃO é fase (cronológica), roadmap (entregas), sprint (tático) ou OKR (resultado).
Wave ordena CAPACIDADES e RESTRIÇÕES.

## WAVE 1 — Estrutura mínima
Remove risco sistêmico. Governança, dados, financeiro, processos, método,
pessoas e liderança. Sem isso, crescer quebra.
Exemplos: teto de despesas variáveis, PA financeira 36m, cohort P&L, CAPEX roadmap,
dashboards estratégicos/táticos/operacionais, documentos de governança, rituais
de decisão, gestão à vista, checklist de qualidade de aulas, gates de prontidão,
sistema de alerta de inatividade, treinamento de liderança, matriz de performance,
PDI por cadeira, remuneração variável, ritual 1:1, Selo de Governança de IA.

## WAVE 2 — Escala com controle
Cresce com previsibilidade, eficiência e repetição. DEPENDE de W1 instalada.
Exemplos: leadscore avançado, otimização de funil, DRE de vendedores, squads
de alta performance, times de aquisição/expansão/field/outbound, escada de valor,
BU Paciente Grave, app UX próprio, alerta de engajamento integrado à jornada,
ITC simulação com cadáveres, centro de simulação com IA, robô de follow-up,
central de scripts, pitch com IA, insights diários por IA, pricing & packaging 2.0.

## WAVE 3 — Aceleração e diferenciação
Vantagem competitiva, novos modelos, IA avançada, expansão estrutural.
Só entra depois de W2 estável.
Exemplos: Chat IA especializado, copilotos internos, biblioteca de algoritmos
educacionais, Emy Education, portfólio de agentes, Aluno ALUMNI, calendário
editorial anual, Projeto Pílulas, social selling, branding LM, plataforma de
provas com IA, LM Capital (seguro, empréstimos, FIDC), multi-hub hospital-escola,
filial LM SP, Faculty Cloud, SVST, P04 Angola Pós Online.

## Regra de classificação
1. Remove gargalo estrutural / risco sistêmico? → W1
2. Depende de capacidades W1 e permite crescer com previsibilidade/repetição? → W2
3. Diferenciação, novo modelo ou expansão estrutural que exige W1+W2 estáveis? → W3
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
        // Extrai texto do PDF (muito mais rápido que enviar PDF inteiro como anexo multimodal)
        try {
          const { extractText, getDocumentProxy } = await import("https://esm.sh/unpdf@0.12.1");
          const pdf = await getDocumentProxy(new Uint8Array(arrayBuf));
          const { text } = await extractText(pdf, { mergePages: true });
          extractedText = Array.isArray(text) ? text.join("\n") : text;
        } catch (err) {
          console.error("Falha extraindo PDF, fallback p/ multimodal:", err);
          const buf = new Uint8Array(arrayBuf);
          let b64 = "";
          const chunk = 0x8000;
          for (let i = 0; i < buf.length; i += chunk) {
            b64 += String.fromCharCode(...buf.subarray(i, i + chunk));
          }
          b64 = btoa(b64);
          fileParts.push({ type: "image_url", image_url: { url: `data:application/pdf;base64,${b64}` } });
        }
      } else if (isDocx) {
        // mammoth on Deno expects a Node Buffer via the `buffer` option
        const { Buffer } = await import("node:buffer");
        const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuf) });
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

${extractedText ? `--- CONTEÚDO DO ARQUIVO ANEXO ---\n${extractedText.slice(0, 20000)}\n--- FIM DO ARQUIVO ---` : ""}

Aplique RIGOROSAMENTE o framework ScoreCard LM E o framework Wave.
Ao classificar a Wave: extraia do formulário/anexo se o proponente declarou uma
wave (W1/W2/W3). Determine a wave adequada segundo o framework Wave e aponte
alinhamento (ok | desalinhado | nao_declarado). Justifique em 1–2 frases.

Retorne JSON:
{
  "gate": "saudavel" | "condicional" | "bloqueado",
  "resumo_executivo": "string (até 3 parágrafos)",
  "dados_extraidos": { "titulo":"", "proponente":"", "area":"", "tipo_projeto":"", "problema":"", "hipotese":"", "publico_alvo":"", "roi_pct":null, "payback_meses":null, "pct_base_demanda":null, "qualidade_fonte":"", "evidencia_demanda":"", "risco_juridico":"", "risco_reputacional":"", "risco_clinico":"", "peso_tecnico":"", "sequestro_capacidade_pct":null, "conflito_fila":"" },
  "janela": { "pontos": number, "classificacao": "Única|Passiva|Indiferente", "concessao_aplicada": boolean, "justificativa": "string" },
  "wave": { "declarada": "W1|W2|W3|null", "sugerida": "W1|W2|W3", "alinhamento": "ok|desalinhado|nao_declarado", "justificativa": "string", "capacidades_dependentes": ["string"] },
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
        model: "google/gemini-2.5-flash",
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
