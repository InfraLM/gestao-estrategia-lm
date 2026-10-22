import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;
export type ProjetoG = {
  id: string; codigo: string; nome: string; status: string; diretor: string | null; cadeira_id: string | null;
  cadeira_confirmada_em: string | null; situacao_confirmada_em: string | null; objetivos: string[] | null; krs: string[] | null;
  atualizacao_direta_em: string | null; atualizacao_direta_nome: string | null;
};
export type ProjVinc = { id: string; projeto_id: string; tipo: "bsc_objetivo" | "bsc_kpi" | "kr" | "cesta"; ref_id: string };
export type StatusRep = {
  id: string; projeto_codigo: string; competencia: string; cadeira_id: string | null; farol_escopo: string | null; farol_custo: string | null;
  farol_cronograma: string | null; comentario: string | null; confirmacao_status: string | null; arquivo_path: string | null; arquivo_nome: string | null;
  enviado_por_nome: string | null; updated_at: string; saude: string | null; revisao: number;
};
export type DecisaoProj = { id: string; projeto_id: string; competencia: string; codigo: string; decisao: string; desfecho: string | null; justificativa: string; projecoes: string | null; decidido_por_nome: string | null; created_at: string };

/** Projetos com cadeira responsável, apoio, vínculos de impacto, status reports e decisões. */
export function useProjetosGestao() {
  const { user } = useAuth();
  const [s, setS] = useState({ projetos: [] as ProjetoG[], apoio: [] as { projeto_id: string; cadeira_id: string }[], vinculos: [] as ProjVinc[], reports: [] as StatusRep[], decisoes: [] as DecisaoProj[] });
  const [ceo, setCeo] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [p, a, v, r, d] = await Promise.all([
      db.from("projetos").select("id,codigo,nome,status,diretor,cadeira_id,cadeira_confirmada_em,situacao_confirmada_em,objetivos,krs,atualizacao_direta_em,atualizacao_direta_nome").order("codigo"),
      db.from("projeto_cadeiras_apoio").select("projeto_id,cadeira_id"),
      db.from("projeto_vinculos").select("id,projeto_id,tipo,ref_id"),
      db.from("mt_status_projetos").select("*").order("competencia", { ascending: false }),
      db.from("projeto_decisoes").select("*").order("created_at", { ascending: false }),
    ]);
    setS({ projetos: p.data ?? [], apoio: a.data ?? [], vinculos: v.data ?? [], reports: r.data ?? [], decisoes: d.data ?? [] });
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (user) db.rpc("proj_eh_ceo", { _uid: user.id }).then(({ data }: any) => setCeo(!!data)); }, [user]);
  const ultimo = (codigo: string) => s.reports.find((r) => r.projeto_codigo === codigo) ?? null;
  return { ...s, loading, reload: load, ceo, ultimo };
}

export async function abrirArquivoStatus(path: string) {
  const { data, error } = await supabase.storage.from("status-reports").createSignedUrl(path, 120);
  if (error || !data) return false;
  window.open(data.signedUrl, "_blank");
  return true;
}
