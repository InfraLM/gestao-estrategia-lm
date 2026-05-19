import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import seedJson from "@/data/processos.json";

export type Processo = {
  id: string; nome: string; nivel: string; revisao: number | null;
  diretor: string; dono: string; status: string;
  fornecedores: string[]; clientes: string[]; documentos: any[];
  vinculo?: Record<string, number>;
  maturidade?: number; kpiValor?: number;
  ativo?: boolean;
  area?: string;
  imagemFluxoUrl?: string;
  kpiNome?: string;
  kpiMeta?: number;
  kpiUnidade?: string;
};

const MATRIZ_EDITS_KEY = "matriz-processos-edits-v1";

function applyLocalEdits(rows: Processo[]): Processo[] {
  try {
    const raw = localStorage.getItem(MATRIZ_EDITS_KEY);
    const edits: Record<string, Partial<Processo>> = raw ? JSON.parse(raw) : {};
    return rows.map(p => ({ ...p, ...edits[p.id] }));
  } catch { return rows; }
}

function mapRow(r: any): Processo {
  return {
    id: r.id, nome: r.nome, nivel: r.nivel, revisao: r.revisao,
    diretor: r.diretor, dono: r.dono, status: r.status,
    fornecedores: r.fornecedores || [], clientes: r.clientes || [], documentos: r.documentos || [],
    vinculo: r.vinculo || undefined,
    maturidade: r.maturidade ?? undefined,
    kpiValor: r.kpi_valor ?? undefined,
    ativo: r.ativo ?? true,
    area: r.area ?? undefined,
    imagemFluxoUrl: r.imagem_fluxo_url ?? undefined,
    kpiNome: r.kpi_nome ?? undefined,
    kpiMeta: r.kpi_meta ?? undefined,
    kpiUnidade: r.kpi_unidade ?? undefined,
  };
}

/** Carrega processos do banco; faz fallback para o seed JSON em caso de falha. */
export function useProcessosDB() {
  const [data, setData] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("processos")
      .select("id,nome,nivel,revisao,diretor,dono,status,fornecedores,clientes,documentos,vinculo,maturidade,kpi_valor,ativo,area,imagem_fluxo_url,kpi_nome,kpi_meta,kpi_unidade");
    if (error || !rows || rows.length === 0) {
      setData(applyLocalEdits(seedJson as Processo[]));
    } else {
      setData(applyLocalEdits(rows.map(mapRow)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, reload };
}
