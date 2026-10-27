import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { projetos as mockProjetos, type Projeto } from "@/data/mockData";
import { useRefetchOnFocus } from "./useRefetchOnFocus";
import { useBaseOrganizacional } from './useBaseOrganizacional';
import { nomeVinculado } from '@/lib/baseOrganizacional';

/**
 * Carrega projetos do banco no formato Projeto (compatível com o mockData),
 * com fallback para o mock quando o banco não responde ou está vazio.
 * Refaz o fetch automaticamente quando a aba volta ao foco.
 */
export function useProjetosDB() {
  const org = useBaseOrganizacional();
  const [refs, setRefs] = useState<Record<string, { diretor: string | null; gerente: string | null }>>({});
  const [data, setData] = useState<Projeto[]>(mockProjetos);
  const [loading, setLoading] = useState(true);
  const [usingDB, setUsingDB] = useState(false);
  const cancelRef = useRef(false);

  const fetchProjetos = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from("projetos")
      .select("id,codigo,nome,wave,classificacao,categoria,objetivos,krs,diretor,gerente,diretor_pessoa_id,gerente_pessoa_id,budget,realizado,status_bc,status,saude,inicio,termino,ice,descricao,avancos,causa_raiz,plano_acao");
    if (cancelRef.current) return;
    if (!error && rows && rows.length > 0) {
      const [links, objs, inds, okrs] = await Promise.all([
        supabase.from("portfolio_vinculos").select("fonte_id,tipo,ref_id,status").eq("fonte_tipo", "projeto").neq("status", "removido"),
        supabase.from("mt_objetivos").select("id,codigo"),
        supabase.from("mt_indicadores").select("id,codigo,origem,objetivo_id,okr_id").eq("status", "ativo"),
        supabase.from("mt_okrs").select("id,semestre"),
      ]);
      const parts = new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit"}).formatToParts(new Date());
      const semestre = `${parts.find(p=>p.type==="year")?.value}/${Number(parts.find(p=>p.type==="month")?.value)<=6?1:2}`;
      const vigentes = new Set((okrs.data??[]).filter(o=>o.semestre===semestre).map(o=>o.id));
      const ativos = (inds.data??[]).filter(i=>i.origem!=="okr"||vigentes.has(i.okr_id??""));
      const objCodigo = (oid: string) => objs.data?.find(o => o.id === oid)?.codigo;
      const refs = (pid: string) => (links.data ?? []).filter(v => v.fonte_id === pid);
      const mapped: Projeto[] = rows.map((r: any) => ({
        id: r.codigo,
        nome: r.nome,
        wave: r.wave,
        classificacao: r.classificacao,
        categoria: r.categoria || undefined,
        objetivos: [...new Set(refs(r.id).flatMap(v => {
          const codigo = v.tipo === "objetivo" ? objCodigo(v.ref_id) : objCodigo(ativos.find(i => i.id === v.ref_id)?.objetivo_id ?? "");
          return codigo ? [codigo] : [];
        }))],
        krs: refs(r.id).flatMap(v => { const i = ativos.find(i => i.id === v.ref_id && i.origem === "okr"); return i ? [i.codigo] : []; }),
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
      setRefs(Object.fromEntries(rows.map(r => [r.codigo, { diretor: r.diretor_pessoa_id, gerente: r.gerente_pessoa_id }])));
      setUsingDB(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    fetchProjetos();
    window.addEventListener("portfolio-vinculos", fetchProjetos);
    return () => { cancelRef.current = true; window.removeEventListener("portfolio-vinculos", fetchProjetos); };
  }, [fetchProjetos]);

  useRefetchOnFocus(fetchProjetos);

  const projetados = data.map(p => ({ ...p, diretor: nomeVinculado(refs[p.id]?.diretor, p.diretor, org.diretorio.pessoas), gerente: nomeVinculado(refs[p.id]?.gerente, p.gerente, org.diretorio.pessoas) || undefined }));
  return { data: projetados, loading, usingDB, refetch: fetchProjetos };
}

