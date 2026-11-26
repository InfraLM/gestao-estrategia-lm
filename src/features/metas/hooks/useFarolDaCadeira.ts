import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { carregarSituacoesKpi } from "@/hooks/useAvaliacoesBsc";
import { mapaArvore } from "@/lib/avaliacaoBsc";
import { MESES_2S26 } from "@/hooks/useMetasBase";
import { useRegrasFarol } from "@/features/metas/hooks/useRegrasFarol";
import { kpisForaDaMeta, type KpiForaDaMeta } from "@/features/metas/lib/farolDaCadeira";
import rev02 from "@/data/bscRev02.json";

const db = supabase as any;

/** Carrega os mesmos dados da Matriz de apontamentos (só quando `ativo`) e devolve os KPIs vermelhos e amarelos da cadeira. */
export function useFarolDaCadeira(indicadores: any[], cadeiraId: string | null | undefined, ativo: boolean) {
  const { regras } = useRegrasFarol();
  const base = useQuery({
    queryKey: ["farol-da-cadeira-base"],
    enabled: ativo,
    staleTime: 60_000,
    queryFn: async () => {
      const [l, m, s, a]: any[] = await Promise.all([
        db.from("mt_lancamentos").select("indicador_id,competencia,valor,revisao,sem_medicao,declaracao,justificativa,status_entrega,avanco_pct,updated_at,analise_snapshot"),
        db.from("mt_metas_mensais").select("indicador_id,competencia,meta_mes"),
        carregarSituacoesKpi(),
        db.from("conteudo_editavel").select("valor,updated_at").eq("chave", "bsc.rev02").maybeSingle(),
      ]);
      if (l.error || m.error) throw l.error ?? m.error;
      return { lancs: l.data ?? [], metas: m.data ?? [], checkouts: (s.data ?? []) as any[], arvore: { m: mapaArvore((a.data?.valor ?? rev02) as any[]), d: a.data?.updated_at ?? null } };
    },
  });
  const itens: KpiForaDaMeta[] = useMemo(() => {
    if (!ativo || !cadeiraId || !base.data) return [];
    return kpisForaDaMeta({ indicadores, cadeiraId, meses: MESES_2S26, regras, ...base.data });
  }, [ativo, cadeiraId, base.data, indicadores, regras]);
  return { itens, carregando: ativo && base.isLoading, erro: base.isError };
}
