// Edge function: analisa um insight submetido ao Diagnóstico Estratégico LM
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um(a) consultor(a) sênior de estratégia analisando contribuições para o Diagnóstico Estratégico da Liberdade Médica (LM) — escola de medicina/educação médica continuada.

CONTEXTO LM:
- Propósito: capacitar médicos/médicas para salvar vidas. BHAG: 1mi de vidas salvas até 2026.
- Frameworks aplicados: PESTEL, 5 Forças de Porter, RBV/VRIN, Oceano Azul (ERRC), SWOT, Ansoff.
- Diferenciais: conexão forte com plantão, ecossistema integrado, autoridade técnica.
- Vulnerabilidades: capital, dependência operacional hospitalar, escala.
- Concorrentes-chave: Afya, Sanar.

TAREFA: Avalie o insight submetido e devolva via tool call estruturado:
1. resumo (1-2 frases objetivas)
2. categoria_pestel/porter/swot quando aplicável (Força/Fraqueza/Oportunidade/Ameaça etc.)
3. relevancia (alta/media/baixa) — quão relevante para o diagnóstico
4. confianca (0-100) — quanto a evidência sustenta
5. sugestoes — recomendações de ações estratégicas concretas (3-5 bullets em markdown)
6. impacto_frameworks — quais frameworks o insight mais afeta`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { framework, titulo, conteudo, evidencias } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    const userPrompt = `Framework: ${framework}\nTítulo: ${titulo}\n\nConteúdo:\n${conteudo}\n\nEvidências:\n${evidencias || "—"}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analisar_insight",
            description: "Analisa um insight para o diagnóstico estratégico",
            parameters: {
              type: "object",
              properties: {
                resumo: { type: "string" },
                relevancia: { type: "string", enum: ["alta", "media", "baixa"] },
                confianca: { type: "number" },
                categoria: { type: "string", description: "Ex.: Força, Fraqueza, Oportunidade, Ameaça, Político, Econômico, Recurso VRIN..." },
                impacto_frameworks: { type: "array", items: { type: "string" } },
                sugestoes: { type: "string", description: "Recomendações em markdown com 3-5 bullets" },
              },
              required: ["resumo", "relevancia", "confianca", "categoria", "impacto_frameworks", "sugestoes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analisar_insight" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = tc ? JSON.parse(tc.function.arguments) : null;
    if (!args) return new Response(JSON.stringify({ error: "Sem resposta estruturada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("diagnostico-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
