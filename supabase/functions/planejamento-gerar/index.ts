// Gera RASCUNHO de revisão (relatório mensal ou diagnóstico por ferramenta). Só Governança; 3 por mês por tipo.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const TIPOS = ["relatorio", "diag_PESTEL", "diag_Porter", "diag_RBV_VRIN", "diag_Oceano_Azul", "diag_SWOT", "diag_Ansoff"];

function validarFontes(texto: string, validos: Set<string>) {
  return texto.replace(/\[FONTE:\s*([^\]]+)\]/gi, (_m, lista: string) => {
    const ok = lista.split(/[,;]/).map((c) => c.trim()).filter((c) => validos.has(c.toUpperCase()));
    return ok.length ? `[FONTE: ${ok.join(", ")}]` : "[sem fonte]";
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "Faça login." }, 401);
    const { data: gov } = await sb.rpc("mt_is_governanca", { _uid: u.user.id });
    if (!gov) return json({ error: "Somente a Governança gera rascunhos." }, 403);
    const { tipo, competencia } = await req.json();
    if (!TIPOS.includes(tipo)) return json({ error: "Tipo inválido." }, 400);

    const inicioMes = new Date(); inicioMes.setUTCDate(1); inicioMes.setUTCHours(0, 0, 0, 0);
    const { count } = await sb.from("planejamento_revisoes").select("id", { count: "exact", head: true }).eq("tipo", tipo).gte("gerado_em", inicioMes.toISOString());
    if ((count ?? 0) >= 3) return json({ error: "Limite de 3 gerações neste mês para este tipo." }, 429);

    const [dec, pdec, lanc, ind, sit, sr, vig] = await Promise.all([
      sb.from("decisoes_estrategicas").select("codigo,titulo,data_decisao,decisao,racional,impacto_bsc").eq("acesso_reservado", false).order("data_decisao", { ascending: false }).limit(150),
      sb.from("projeto_decisoes").select("codigo,competencia,decisao,desfecho,justificativa").order("created_at", { ascending: false }).limit(80),
      sb.from("mt_lancamentos").select("indicador_id,competencia,valor,revisao"),
      sb.from("mt_indicadores").select("id,codigo,nome,origem,meta_semestre,meta_texto").eq("status", "ativo"),
      sb.rpc("rotina_situacoes_kpi"),
      sb.from("mt_status_projetos").select("projeto_codigo,competencia,saude,farol_escopo,farol_custo,farol_cronograma,avancos,desvios").order("competencia", { ascending: false }).limit(200),
      sb.from("planejamento_revisoes").select("numero,conteudo").eq("tipo", tipo).eq("status", "aprovado").maybeSingle(),
    ]);
    const inds = new Map((ind.data ?? []).map((i: any) => [i.id, i]));
    const fontes = new Set<string>();
    const L: string[] = [];
    L.push("## Decisões (Contexto e Decisões, inclui deliberações GOV)");
    for (const d of dec.data ?? []) { fontes.add(String(d.codigo).toUpperCase()); L.push(`- ${d.codigo} (${d.data_decisao ?? ""}): ${d.titulo} — ${d.decisao ?? ""} ${d.impacto_bsc ? `[BSC ${d.impacto_bsc}]` : ""}`); }
    L.push("## Decisões de projeto (SR)");
    for (const d of pdec.data ?? []) { if (!d.codigo) continue; fontes.add(String(d.codigo).toUpperCase()); L.push(`- ${d.codigo} (${d.competencia}): ${d.decisao} → ${d.desfecho ?? ""}. ${d.justificativa ?? ""}`); }
    L.push("## Lançamentos mensais (código do indicador@mês)");
    for (const l of lanc.data ?? []) { const i: any = inds.get(l.indicador_id); if (!i || l.valor == null) continue; const c = `${i.codigo}@${l.competencia}`.toUpperCase(); fontes.add(c); L.push(`- ${c}: ${i.nome} = ${l.valor} (meta semestre ${i.meta_semestre ?? i.meta_texto ?? "—"})`); }
    L.push("## Situações apontadas em checkouts enviados (código@semana)");
    for (const s of (sit.data ?? []).slice(0, 300)) { const i: any = inds.get(s.indicador_id); if (!i || !s.situacao_atual) continue; const c = `${i.codigo}@${s.semana}`.toUpperCase(); fontes.add(c); L.push(`- ${c}: ${i.nome} situação "${s.situacao_atual}"`); }
    L.push("## Status reports (projeto@mês)");
    for (const r of sr.data ?? []) { const c = `${r.projeto_codigo}@${r.competencia}`.toUpperCase(); fontes.add(c); L.push(`- ${c}: saúde ${r.saude ?? "—"}; faróis escopo ${r.farol_escopo ?? "—"}, custo ${r.farol_custo ?? "—"}, cronograma ${r.farol_cronograma ?? "—"}. Avanços: ${r.avancos ?? ""} Desvios: ${r.desvios ?? ""}`); }
    if (vig.data) { fontes.add(`REV-${vig.data.numero}`); L.push(`## Versão vigente (REV-${vig.data.numero})\n${vig.data.conteudo}`); }

    const alvo = tipo === "relatorio" ? `um RELATÓRIO MENSAL de planejamento estratégico para tomada de decisão, competência ${competencia ?? ""}: síntese, avanços, desvios, decisões tomadas, decisões pendentes e recomendações`
      : `a nova revisão do DIAGNÓSTICO ESTRATÉGICO pela ferramenta ${tipo.slice(5).replace("_", " ")}`;
    const system = `Você é analista de estratégia da Liberdade Médica. Escreva ${alvo}, em português, em markdown.
REGRAS OBRIGATÓRIAS:
- Use SOMENTE os dados fornecidos. Não invente números, datas, nomes ou fatos.
- TODA frase com fato ou número termina com [FONTE: CÓDIGO] usando exatamente os códigos da entrada (ex.: [FONTE: D-012], [FONTE: C01-A@2026-09]).
- Se precisar afirmar algo sem dado de apoio, marque [sem fonte].
- Recomendações devem citar as fontes que as motivam.`;

    const key = Deno.env.get("LOVABLE_API_KEY"); if (!key) return json({ error: "IA não configurada." }, 500);
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", stream: true, messages: [{ role: "system", content: system }, { role: "user", content: L.join("\n").slice(0, 180000) }] }),
    });
    if (resp.status === 429) return json({ error: "Limite de uso da IA atingido. Tente mais tarde." }, 429);
    if (resp.status === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }, 402);
    if (resp.status === 403) return json({ error: "Uso de IA bloqueado para o workspace." }, 403);
    if (!resp.ok || !resp.body) { console.error("ai", resp.status, await resp.text()); return json({ error: "Erro na IA." }, 502); }
    let texto = ""; let buf = "";
    const rd = resp.body.getReader(); const dec2 = new TextDecoder();
    for (;;) {
      const { done, value } = await rd.read(); if (done) break;
      buf += dec2.decode(value, { stream: true });
      let idx; while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue; const d = line.slice(5).trim(); if (d === "[DONE]") continue;
        try { texto += JSON.parse(d).choices?.[0]?.delta?.content ?? ""; } catch { /* parcial */ }
      }
    }
    if (!texto.trim()) return json({ error: "A IA não devolveu conteúdo." }, 502);
    const conteudo = validarFontes(texto, fontes);
    const citadas = [...new Set([...conteudo.matchAll(/\[FONTE:\s*([^\]]+)\]/gi)].flatMap((m) => m[1].split(",").map((c) => c.trim())))];
    const { data: ult } = await sb.from("planejamento_revisoes").select("numero").eq("tipo", tipo).order("numero", { ascending: false }).limit(1).maybeSingle();
    const { data: row, error } = await sb.from("planejamento_revisoes").insert({ tipo, competencia: competencia ?? null, numero: (ult?.numero ?? 0) + 1, conteudo, fontes: citadas, gerado_por: u.user.id }).select().single();
    if (error) return json({ error: error.message }, 400);
    return json(row);
  } catch (e) {
    console.error(e); return json({ error: "Erro inesperado." }, 500);
  }
});
