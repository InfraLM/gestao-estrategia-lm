import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { avaliarBsc, contarAvaliacoes, Avaliacao } from "@/lib/avaliacaoBsc";

type Item = { id: string; nome: string; cadeira_id: string; aval: Avaliacao };
export type AvalCadeira = { itens: Item[]; cont: ReturnType<typeof contarAvaliacoes>; off: Item[] };

/** Avaliação On/Off track dos KPIs de BSC (Estratégico/Tático) por cadeira, para a competência dada. */
export function useAvaliacoesBsc(competencia: string | null) {
  const [porCadeira, setPor] = useState<Record<string, AvalCadeira>>({});
  useEffect(() => {
    if (!competencia) { setPor({}); return; }
    const db = supabase as any;
    Promise.all([
      db.from("mt_indicadores").select("id,nome,cadeira_id,sentido,meta_semestre,meta_texto,nivel,parent_id").eq("origem", "bsc").eq("status", "ativo"),
      db.from("mt_metas_mensais").select("indicador_id,meta_mes").eq("competencia", competencia),
      db.from("mt_lancamentos").select("indicador_id,valor,revisao,sem_medicao").eq("competencia", competencia),
    ]).then(([i, m, l]: any[]) => {
      const out: Record<string, AvalCadeira> = {};
      for (const ind of (i.data ?? []).filter((x: any) => x.cadeira_id && !x.parent_id && (x.nivel ?? "Tático") !== "Operacional")) {
        const meta = (m.data ?? []).find((x: any) => x.indicador_id === ind.id)?.meta_mes ?? null;
        const lanc = (l.data ?? []).filter((x: any) => x.indicador_id === ind.id && !x.sem_medicao).sort((a: any, b: any) => b.revisao - a.revisao)[0];
        const aval = avaliarBsc({ sentido: ind.sentido, competencia, meta_mes: meta, meta_semestre: ind.meta_semestre, meta_texto: ind.meta_texto, realizado: lanc?.valor ?? null });
        (out[ind.cadeira_id] ??= { itens: [], cont: contarAvaliacoes([]), off: [] }).itens.push({ id: ind.id, nome: ind.nome, cadeira_id: ind.cadeira_id, aval });
      }
      for (const k of Object.keys(out)) { out[k].cont = contarAvaliacoes(out[k].itens.map((x) => x.aval)); out[k].off = out[k].itens.filter((x) => x.aval === "off"); }
      setPor(out);
    });
  }, [competencia]);
  return { porCadeira };
}
