import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import seedJson from "@/data/processos.json";
import { useRefetchOnFocus } from "./useRefetchOnFocus";
import { useNomesOrganizacionais } from './useNomesOrganizacionais';


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

/** Arquivos de fluxo são privados: troca o endereço salvo por um link temporário (só com login). */
export async function assinarFluxo(url?: string): Promise<string | undefined> {
  const m = url?.match(/\/processo-fluxos\/(.+)$/);
  if (!m) return url;
  const path = decodeURIComponent(m[1].split("?")[0]);
  const { data } = await supabase.storage.from("processo-fluxos").createSignedUrl(path, 60 * 60 * 12);
  return data?.signedUrl ?? url;
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
      const mapped = rows.map(mapRow);
      await Promise.all(mapped.map(async p => { p.imagemFluxoUrl = await assinarFluxo(p.imagemFluxoUrl); }));
      setData(applyLocalEdits(mapped));
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useRefetchOnFocus(reload);

  const nomes = useNomesOrganizacionais(data.flatMap(p => [{ fonte: 'processos', id: p.id, campo: 'diretor' }, { fonte: 'processos', id: p.id, campo: 'dono' }]));
  return { data: data.map(p => ({ ...p, diretor: nomes.resolver('processos', p.id, 'diretor', p.diretor), dono: nomes.resolver('processos', p.id, 'dono', p.dono) })), loading, reload };
}

