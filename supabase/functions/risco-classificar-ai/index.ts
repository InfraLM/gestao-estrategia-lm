// Edge function: classifica risco de processo (natureza, tipo e causa raiz) via IA
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NATUREZAS = ["Variação", "Ambiguidade", "Evento", "Emergente", "Condição de incerteza"];
const TIPOS = ["Financeiro", "Legal", "Reputacional", "Processo operacional", "Recursos (Pessoas/Materiais)", "Tecnologia/Sistemas"];

const SYSTEM_PROMPT = `Você é especialista em gestão de riscos corporativos (ISO 31000). A partir da descrição de um risco vinculado a um processo de negócio, classifique:

- natureza (escolha UMA): ${NATUREZAS.join(" | ")}
  • Evento: acontecimento específico e incerto (greve, falha de servidor, atraso em entrega).
  • Variação: incerteza em torno de uma variável já conhecida (produtividade, câmbio, custo de material).
  • Ambiguidade: falta de clareza sobre requisitos, contexto, tecnologia ou ambiente.
  • Emergente: risco que surge ao longo do tempo e não estava previsto inicialmente (pandemia, mudança regulatória súbita).
  • Condição de incerteza: situação estrutural de incerteza que permeia o contexto.

- tipo (escolha UM): ${TIPOS.join(" | ")}
  • Financeiro: orçamento, custos, fluxo de caixa, câmbio, viabilidade econômica.
  • Legal: leis, normas, contratos, compliance.
  • Reputacional: imagem, credibilidade, confiança da organização.
  • Processo operacional: falhas, atrasos, ineficiências ou não conformidades em fluxos.
  • Recursos (Pessoas/Materiais): competências, engajamento, disponibilidade, resistência à mudança.
  • Tecnologia/Sistemas: falhas, integrações, segurança da informação, infraestrutura, adoção.

- causa_raiz: 1-2 frases objetivas explicando a origem provável do risco (fonte, processo, pessoa ou condição que pode levar ao evento indesejado). Se já houver causa informada, refine-a sem contradizê-la.

- justificativa: 1 frase curta explicando por que a natureza e o tipo escolhidos se aplicam.

Responda SEMPRE via tool call estruturado.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { risco, causa, processoNome, impacto, probabilidade } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    const userPrompt = `Processo: ${processoNome || "—"}
Risco: ${risco || "—"}
Causa informada: ${causa || "(vazia)"}
Impacto estimado (1-5): ${impacto ?? "—"}
Probabilidade estimada (1-5): ${probabilidade ?? "—"}`;

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
            name: "classificar_risco",
            description: "Classifica risco com natureza, tipo e causa raiz",
            parameters: {
              type: "object",
              properties: {
                natureza: { type: "string", enum: NATUREZAS },
                tipo: { type: "string", enum: TIPOS },
                causa_raiz: { type: "string" },
                justificativa: { type: "string" },
              },
              required: ["natureza", "tipo", "causa_raiz", "justificativa"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classificar_risco" } },
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
    console.error("risco-classificar-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
