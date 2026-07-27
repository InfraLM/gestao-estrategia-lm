import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { projetos as mockProjetos, type Projeto } from "@/data/mockData";
import { useRefetchOnFocus } from "./useRefetchOnFocus";

/**
 * Carrega projetos do banco no formato Projeto (compatível com o mockData),
 * com fallback para o mock quando o banco não responde ou está vazio.
 * Refaz o fetch automaticamente quando a aba volta ao foco.
 */
export function useProjetosDB() {
  const [data, setData] = useState<Projeto[]>(mockProjetos);
  const [loading, setLoading] = useState(true);
  const [usingDB, setUsingDB] = useState(false);
  const cancelRef = useRef(false);

  const fetchProjetos = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from("projetos")
      .select("codigo,nome,wave,classificacao,categoria,objetivos,krs,diretor,gerente,budget,realizado,status_bc,status,saude,inicio,termino,ice,descricao,avancos,causa_raiz,plano_acao");
    if (cancelRef.current) return;
    if (!error && rows && rows.length > 0) {
      const mapped: Projeto[] = rows.map((r: any) => ({
        id: r.codigo,
        nome: r.nome,
        wave: r.wave,
        classificacao: r.classificacao,
        categoria: r.categoria || undefined,
        objetivos: r.objetivos || [],
        krs: r.krs || [],
        diretor: r.diretor || "Não atribuído",
        gerente: r.gerente || undefined,
        budget: Number(r.budget) || 0,
        realizado: Number(r.realizado) || 0,
        statusBC: r.status_bc,
        status: r.status,
        saude: r.saude,
        inicio: r.inicio || "",
        termino: r.termino || "",
        ice: Number(r.ice) || 0,
        descricao: r.descricao || "",
        avancos: r.avancos || undefined,
        causaRaiz: r.causa_raiz || undefined,
        planoAcao: r.plano_acao || undefined,
      }));
      setData(mapped);
      setUsingDB(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    fetchProjetos();
    return () => { cancelRef.current = true; };
  }, [fetchProjetos]);

  useRefetchOnFocus(fetchProjetos);

  return { data, loading, usingDB, refetch: fetchProjetos };
}

