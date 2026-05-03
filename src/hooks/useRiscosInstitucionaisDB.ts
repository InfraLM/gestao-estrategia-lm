import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RiscoInstDB = {
  id: string;
  nome: string;
  natureza: string;
  tipo: string;
  impacto: number;
  ocorrencia: number;
  status: string;
  impactoFinanceiro?: number;
  acoesMitigadoras: string;
  responsaveis: string;
  dueDate: string;
  contingencia?: string;
};

export function useRiscosInstitucionaisDB() {
  const [data, setData] = useState<RiscoInstDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("riscos_institucionais")
        .select("*")
        .order("impacto", { ascending: false });
      if (cancel) return;
      if (!error && rows) {
        setData(rows.map((r: any) => ({
          id: r.id, nome: r.nome, natureza: r.natureza, tipo: r.tipo,
          impacto: r.impacto, ocorrencia: r.ocorrencia, status: r.status,
          impactoFinanceiro: r.impacto_financeiro ?? undefined,
          acoesMitigadoras: r.acoes_mitigadoras ?? "",
          responsaveis: r.responsaveis ?? "",
          dueDate: r.due_date ?? "",
          contingencia: r.contingencia ?? undefined,
        })));
      }
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [tick]);

  return { data, loading, refetch: () => setTick((t) => t + 1) };
}
