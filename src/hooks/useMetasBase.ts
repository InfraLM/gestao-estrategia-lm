import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Base compartilhada do Sistema de Metas 2S26 (lançamento mensal e, depois, check-in semanal). */
export type Cadeira = { id: string; nome: string; diretor_user_id: string | null; diretor_nome: string | null; ativo: boolean };
export type Objetivo = { id: string; codigo: string; perspectiva: string; descricao: string };
export type Okr = { id: string; codigo: string; nome: string; semestre: string };
export type Indicador = {
  id: string; codigo: string; nome: string; origem: "bsc" | "okr" | "cesta"; objetivo_id: string | null; okr_id: string | null;
  cadeira_id: string | null; unidade: string | null; sentido: "maior" | "menor"; peso: number; status: "ativo" | "arquivado";
  meta_semestre: number | null; meta_texto: string | null; parent_id: string | null; regra_consolidacao: "pior" | "media_ponderada";
  peso_componente: number | null; observacoes: string | null;
};
export type MetaMensal = { id: string; indicador_id: string; competencia: string; meta_mes: number | null; meta_acumulada: number | null };
export type Iniciativa = {
  id: string; titulo: string; okr_id: string | null; indicador_id: string | null; objetivo_id: string | null; cadeira_id: string | null;
  responsavel_user_id: string | null; responsavel_nome: string | null; prazo: string | null;
  status: "a_iniciar" | "em_andamento" | "concluida" | "cancelada"; comentario: string | null;
};
export type UsuarioMt = { user_id: string; perfil: "diretor" | "governanca"; cadeira_id: string | null };
export type Perfil = { user_id: string; display_name: string | null; email: string | null };

export const MESES_2S26 = ["2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];
export const NOME_MES: Record<string, string> = { "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez" };
export const STATUS_INI: Record<string, string> = { a_iniciar: "A iniciar", em_andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada", atrasada: "Atrasada" };

/** "Atrasada" é calculado: prazo vencido sem conclusão/cancelamento. */
export function statusEfetivo(i: Pick<Iniciativa, "status" | "prazo">) {
  if (i.prazo && !["concluida", "cancelada"].includes(i.status) && new Date(i.prazo + "T23:59:59") < new Date()) return "atrasada";
  return i.status;
}

export const fmtNum = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
export const fmtData = (d: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");
export const EMAIL_CORP = "@liberdademedicaedu.com.br";

export function useMetasBase() {
  const { user } = useAuth();
  const [s, setS] = useState({
    cadeiras: [] as Cadeira[], objetivos: [] as Objetivo[], okrs: [] as Okr[], okrObj: [] as { okr_id: string; objetivo_id: string }[],
    indicadores: [] as Indicador[], metas: [] as MetaMensal[], iniciativas: [] as Iniciativa[], usuarios: [] as UsuarioMt[], perfis: [] as Perfil[],
  });
  const [loading, setLoading] = useState(true);
  const [isGov, setIsGov] = useState(false);

  const load = useCallback(async () => {
    const db = supabase as any;
    const q = (t: string, o = "created_at") => db.from(t).select("*").order(o);
    const [c, o, k, ko, i, m, n, u, p] = await Promise.all([
      q("mt_cadeiras", "nome"), q("mt_objetivos", "codigo"), q("mt_okrs", "codigo"), db.from("mt_okr_objetivos").select("*"),
      q("mt_indicadores", "codigo"), q("mt_metas_mensais", "competencia"), q("mt_iniciativas"), db.from("mt_usuarios").select("*"),
      db.from("profiles").select("user_id,display_name,email").order("display_name"),
    ]);
    setS({ cadeiras: c.data ?? [], objetivos: o.data ?? [], okrs: k.data ?? [], okrObj: ko.data ?? [], indicadores: i.data ?? [], metas: m.data ?? [], iniciativas: n.data ?? [], usuarios: u.data ?? [], perfis: p.data ?? [] });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!user) return;
    (supabase as any).rpc("mt_is_governanca", { _uid: user.id }).then(({ data }: any) => setIsGov(!!data));
  }, [user]);

  const corporativo = !!user?.email?.toLowerCase().endsWith(EMAIL_CORP);
  const meu = s.usuarios.find((x) => x.user_id === user?.id);
  return { ...s, loading, reload: load, isGov, corporativo, minhaCadeira: meu?.cadeira_id ?? null, user };
}
