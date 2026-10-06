import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ModuloBase = "estrategia" | "okrs" | "pmo";
export type PropostaBase = {
  id: string; submissao_id: string; modulo: ModuloBase; entidade: string; ref: string; campo: string;
  valor_atual: string | null; valor_novo: string; justificativa: string | null; confianca: number | null;
  status: string; revisado_em: string | null; created_at: string;
};

/** Atualizações aprovadas (via análise IA) que sobrepõem a base estática do módulo. */
export function useBaseOverrides(modulo: ModuloBase) {
  const [aprovadas, setAprovadas] = useState<PropostaBase[]>([]);
  const load = useCallback(async () => {
    const { data } = await (supabase as any).from("base_propostas_ia").select("*")
      .eq("modulo", modulo).eq("status", "aprovado").order("revisado_em", { ascending: true });
    setAprovadas((data as PropostaBase[]) ?? []);
  }, [modulo]);
  useEffect(() => {
    load();
    const ch = supabase.channel(`overrides-${modulo}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "base_propostas_ia" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, modulo]);

  /** Aplica overrides em um objeto (cópia rasa) para a entidade/ref. */
  const aplicar = useCallback(<T extends Record<string, any>>(entidade: string, ref: string, obj: T): T => {
    const o: any = { ...obj };
    for (const p of aprovadas) {
      if (p.entidade !== entidade || p.ref !== ref) continue;
      o[p.campo] = p.campo === "peso" ? Number(p.valor_novo) : p.valor_novo;
      o.__atualizado = true;
    }
    return o;
  }, [aprovadas]);

  return { aprovadas, aplicar, reload: load };
}
