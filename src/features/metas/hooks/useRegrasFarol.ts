import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { montarRegras, REGRAS_PADRAO, type RegrasFarol } from "@/features/metas/lib/regrasFarol";

const db = supabase as any;
export const CHAVE_REGRAS_FAROL = ["farol-regras"] as const;

/** Lê as regras do farol; se as tabelas ainda não existem ou a leitura falha, vale o padrão (5%). */
export async function buscarRegrasFarol(): Promise<RegrasFarol> {
  const [g, e] = await Promise.all([
    db.from("mt_farol_regras").select("amarelo_pct").eq("id", 1).maybeSingle(),
    db.from("mt_farol_excecoes").select("indicador_id,amarelo_pct,motivo,ativo").eq("ativo", true),
  ]);
  if (g.error || e.error) return REGRAS_PADRAO;
  return montarRegras(g.data, e.data);
}

export function useRegrasFarol() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: CHAVE_REGRAS_FAROL, queryFn: buscarRegrasFarol, staleTime: 60_000 });
  return { regras: q.data ?? REGRAS_PADRAO, carregando: q.isLoading, recarregar: () => qc.invalidateQueries({ queryKey: CHAVE_REGRAS_FAROL }) };
}
