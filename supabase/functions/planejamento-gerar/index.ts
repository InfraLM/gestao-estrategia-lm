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

    const [dec, pdec, lanc, ind, sit, sr, vig, conf, cads] = await Promise.all([
      sb.from("decisoes_estrategicas").select("codigo,titulo,data_decisao,decisao,racional,impacto_bsc").eq("acesso_reservado", false).order("data_decisao", { ascending: false }).limit(150),
      sb.from("projeto_decisoes").select("codigo,competencia,decisao,desfecho,justificativa").order("created_at", { ascending: false }).limit(80),
      sb.from("mt_lancamentos").select("indicador_id,competencia,valor,revisao,declaracao,justificativa,status_entrega,avanco_pct"),
      sb.from("mt_indicadores").select("id,codigo,nome,origem,meta_semestre,meta_texto,tipo_apontamento,prazo_entrega").eq("status", "ativo"),
      sb.rpc("rotina_situacoes_kpi"),
      sb.from("mt_status_projetos").select("projeto_codigo,competencia,saude,farol_escopo,farol_custo,farol_cronograma,avancos,desvios").order("competencia", { ascending: false }).limit(200),
      sb.from("planejamento_revisoes").select("numero,conteudo").eq("tipo", tipo).eq("status", "aprovado").maybeSingle(),
      sb.rpc("rotina_conformidade", { _de: "2026-10-19", _ate: new Date().toISOString().slice(0, 10) }),
      sb.from("mt_cadeiras").select("id,nome,diretor_user_id").eq("ativo", true),
    ]);
    const inds = new Map((ind.data ?? []).map((i: any) => [i.id, i]));
    const fontes = new Set<string>();
    const L: string[] = [];
    L.push("## Decisões (Contexto e Decisões, inclui deliberações GOV)");
    for (const d of dec.data ?? []) { fontes.add(String(d.codigo).toUpperCase()); L.push(`- ${d.codigo} (${d.data_decisao ?? ""}): ${d.titulo} — ${d.decisao ?? ""} ${d.impacto_bsc ? `[BSC ${d.impacto_bsc}]` : ""}`); }
    L.push("## Decisões de projeto (SR)");
    for (const d of pdec.data ?? []) { if (!d.codigo) continue; fontes.add(String(d.codigo).toUpperCase()); L.push(`- ${d.codigo} (${d.competencia}): ${d.decisao} → ${d.desfecho ?? ""}. ${d.justificativa ?? ""}`); }
    L.push("## Lançamentos mensais (código do indicador@mês)");
    for (const l of lanc.data ?? []) {
      const i: any = inds.get(l.indicador_id); if (!i) continue; const tipo = i.tipo_apontamento ?? "valor_mensal";
      const c = `${i.codigo}@${l.competencia}`.toUpperCase();
      if (tipo === "entrega") { if (!l.status_entrega) continue; fontes.add(c); L.push(`- ${c}: ${i.nome} — ENTREGA, status ${l.status_entrega}${l.avanco_pct != null ? ` (${l.avanco_pct}%)` : ""}, prazo ${i.prazo_entrega ?? "—"}`); continue; }
      if (tipo === "valor_periodo") { if (!l.declaracao && l.valor == null) continue; fontes.add(c); L.push(`- ${c}: ${i.nome} — meta semestral/anual ${i.meta_semestre ?? i.meta_texto ?? "—"}; declaração do diretor: ${l.declaracao ?? "—"}${l.justificativa ? ` (justificativa: ${l.justificativa})` : ""}${l.valor != null ? `; valor apontado ${l.valor}` : ""} (DECLARADO, não calculado)`); continue; }
      if (l.valor == null) continue; fontes.add(c); L.push(`- ${c}: ${i.nome} = ${l.valor} (valor mensal; meta semestre ${i.meta_semestre ?? i.meta_texto ?? "—"})`);
    }
    L.push("## Situações apontadas em checkouts enviados (código@semana)");
    for (const s of (sit.data ?? []).slice(0, 300)) { const i: any = inds.get(s.indicador_id); if (!i || !s.situacao_atual) continue; const c = `${i.codigo}@${s.semana}`.toUpperCase(); fontes.add(c); L.push(`- ${c}: ${i.nome} situação "${s.situacao_atual}"`); }
    L.push("## Taxa de conformidade do ciclo semanal por cadeira (CONF-cadeira) — substitui a nota mensal");
    {
      const add = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
      const prazo = (s: string) => new Date(`${add(s, 7)}T23:59:59-03:00`);
      const sems: string[] = []; for (let s = "2026-10-19"; prazo(s) < new Date(); s = add(s, 7)) sems.push(s);
      for (const c of (cads.data ?? []).filter((x: any) => x.diretor_user_id)) {
        if (!sems.length) break;
        let conf_ = 0, pont = 0;
        for (const s of sems) {
          const r: any = (conf.data ?? []).find((x: any) => x.cadeira_id === c.id && String(x.semana).slice(0, 10) === s && x.status === "enviado");
          if (!r) continue; const ok = new Date(r.primeiro_envio_em ?? r.enviado_em) <= prazo(s) && new Date(r.enviado_em) <= prazo(s);
          if (ok) pont++; const comp = r.completude; if (ok && comp && comp.total > 0 && comp.feitos / comp.total >= 0.9) conf_++;
        }
        const cod = `CONF-${c.nome}`.toUpperCase(); fontes.add(cod);
        L.push(`- ${cod}: conformidade ${Math.round(conf_ / sems.length * 100)}% (${conf_}/${sems.length} ciclos), pontualidade ${Math.round(pont / sems.length * 100)}%`);
      }
    }
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
