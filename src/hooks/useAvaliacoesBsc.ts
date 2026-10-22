import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { avaliarKpiBsc, contarAvaliacoes, mapaArvore, Avaliacao, CheckoutReg } from "@/lib/avaliacaoBsc";
import rev02 from "@/data/bscRev02.json";

/** Situações numéricas dos checkouts ENVIADOS, só os números (sem o resto do formulário), via função autorizada. */
export async function carregarSituacoesKpi(): Promise<{ data: CheckoutReg[]; alertas: Set<string> }> {
  const { data } = await (supabase as any).rpc("rotina_situacoes_kpi");
  const m = new Map<string, CheckoutReg & { cadeira_id: string }>();
  for (const r of (data ?? []) as any[]) {
    const k = `${r.cadeira_id}|${r.semana}`;
    if (!m.has(k)) m.set(k, { cadeira_id: r.cadeira_id, semana: r.semana, status: "enviado", enviado_em: r.enviado_em, conteudo: { kpis_resposta: [] } });
    m.get(k)!.conteudo.kpis_resposta.push({ indicador_id: r.indicador_id, situacao_atual: r.situacao_atual });
  }
  const ultimo = new Map<string, any>();
  for (const r of (data ?? []) as any[]) { const u = ultimo.get(r.indicador_id); if (!u || r.semana > u.semana) ultimo.set(r.indicador_id, r); }
  const alertas = new Set([...ultimo.values()].filter((r) => r.plano_sem_iniciativa).map((r) => r.indicador_id as string));
  return { data: [...m.values()], alertas };
}

export type ItemBsc = { id: string; nome: string; cadeira_id: string; aval: Avaliacao; origem: string | null };
export type AvalCadeira = { itens: ItemBsc[]; cont: ReturnType<typeof contarAvaliacoes>; off: ItemBsc[] };

/** Avaliação On/Off track dos KPIs de BSC por cadeira, pela regra única `avaliarKpiBsc`.
 *  `cadeiras` = null → todas (Governança/CEO); senão só as listadas. Conteúdo dos checkouts não sai deste hook. */
export function useAvaliacoesBsc(competencia: string | null, cadeiras: string[] | null = null) {
  const [porCadeira, setPor] = useState<Record<string, AvalCadeira>>({});
  const chave = cadeiras ? cadeiras.join(",") : "*";
  useEffect(() => {
    if (!competencia || (cadeiras && cadeiras.length === 0)) { setPor({}); return; }
    const db = supabase as any;
    const ck = carregarSituacoesKpi();
    Promise.all([
      db.from("mt_indicadores").select("id,nome,cadeira_id,sentido,meta_semestre,meta_texto,nivel,parent_id").eq("origem", "bsc").eq("status", "ativo"),
      db.from("mt_metas_mensais").select("indicador_id,meta_mes").eq("competencia", competencia),
      db.from("mt_lancamentos").select("indicador_id,valor,revisao,sem_medicao").eq("competencia", competencia),
      ck,
      db.from("conteudo_editavel").select("valor,updated_at").eq("chave", "bsc.rev02").maybeSingle(),
    ]).then(([i, m, l, c, a]: any[]) => {
      const arv = mapaArvore((a.data?.valor ?? rev02) as any[]); const arvData = a.data?.updated_at ?? null;
      const out: Record<string, AvalCadeira> = {};
      for (const ind of (i.data ?? []).filter((x: any) => x.cadeira_id && !x.parent_id && (x.nivel ?? "Tático") !== "Operacional" && (!cadeiras || cadeiras.includes(x.cadeira_id)))) {
        const meta = (m.data ?? []).find((x: any) => x.indicador_id === ind.id)?.meta_mes ?? null;
        const lanc = (l.data ?? []).filter((x: any) => x.indicador_id === ind.id && !x.sem_medicao).sort((a: any, b: any) => b.revisao - a.revisao)[0];
        const sit = arv[String(ind.nome).trim()];
        const r = avaliarKpiBsc({ indicador_id: ind.id, sentido: ind.sentido, competencia, meta_mes: meta, meta_semestre: ind.meta_semestre, meta_texto: ind.meta_texto, realizado: lanc?.valor ?? null },
          sit ? { valor: sit, data: arvData } : null, (c.data ?? []).filter((x: any) => x.cadeira_id === ind.cadeira_id));
        (out[ind.cadeira_id] ??= { itens: [], cont: contarAvaliacoes([]), off: [] }).itens.push({ id: ind.id, nome: ind.nome, cadeira_id: ind.cadeira_id, ...r });
      }
      for (const k of Object.keys(out)) { out[k].cont = contarAvaliacoes(out[k].itens.map((x) => x.aval)); out[k].off = out[k].itens.filter((x) => x.aval === "off"); }
      setPor(out);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competencia, chave]);
  return { porCadeira };
}

/** Transparência: Governança, CEO e todo diretor com cadeira veem a avaliação de todas as cadeiras; sem cadeira, nada. */
export function cadeirasVisiveisBsc(b: { isGovernanca: boolean; minhaCadeira: string | null; cadeiras: { id: string; nome: string }[] }): string[] | null {
  if (b.isGovernanca || b.minhaCadeira) return null;
  return [];
}
