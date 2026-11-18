import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "./useModuleAccess";
import type { CalendarioKpi } from '@/lib/frequenciaApontamento';
import { useBaseOrganizacional } from './useBaseOrganizacional';
import { nomeVinculado } from '@/lib/baseOrganizacional';

/** Base compartilhada do Sistema de Metas 2S26 (lançamento mensal e, depois, check-in semanal). */
export type Cadeira = { id: string; nome: string; diretor_user_id: string | null; diretor_nome: string | null; ativo: boolean };
export type Objetivo = { id: string; codigo: string; perspectiva: string; descricao: string };
export type Okr = { id: string; codigo: string; nome: string; semestre: string };
export type Indicador = CalendarioKpi & {
  id: string; codigo: string; nome: string; origem: "bsc" | "okr" | "cesta"; objetivo_id: string | null; okr_id: string | null;
  cadeira_id: string | null; unidade: string | null; sentido: "maior" | "menor"; peso: number; status: "ativo" | "arquivado";
  meta_semestre: number | null; meta_texto: string | null; parent_id: string | null; regra_consolidacao: "pior" | "media_ponderada";
  tipo_apontamento?: "valor_mensal" | "valor_periodo" | "entrega"; prazo_entrega?: string | null; status_implantacao_medicao?: string | null;
  peso_componente: number | null; observacoes: string | null;
  analise_configurada_em?:string|null; tolerancia?:number|null; analise_historico?:any[];
};
export type MetaMensal = { id: string; indicador_id: string; competencia: string; meta_mes: number | null; meta_acumulada: number | null };
export type Iniciativa = {
  id: string; titulo: string; okr_id: string | null; indicador_id: string | null; objetivo_id: string | null; cadeira_id: string | null;
  responsavel_user_id: string | null; responsavel_nome: string | null; prazo: string | null;
  responsavel_pessoa_id?: string | null;
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

type BaseMetas = {
  cadeiras: Cadeira[]; objetivos: Objetivo[]; okrs: Okr[]; okrObj: { okr_id: string; objetivo_id: string }[];
  indicadores: Indicador[]; metas: MetaMensal[]; iniciativas: Iniciativa[]; usuarios: UsuarioMt[]; perfis: Perfil[];
};
const BASE_VAZIA: BaseMetas = { cadeiras: [], objetivos: [], okrs: [], okrObj: [], indicadores: [], metas: [], iniciativas: [], usuarios: [], perfis: [] };

/**
 * Tempo em que a base baixada continua valendo sem nova busca. Dentro dele, trocar de tela reaproveita o que já veio
 * (antes, cada uma das telas que usam este hook baixava as 9 tabelas de novo). Toda tela que grava nessas tabelas chama
 * `reload()` depois de salvar, o que atualiza a base para todas as telas abertas.
 */
export const BASE_METAS_VALIDADE_MS = 60_000;
export const chaveBaseMetas = (userId: string | null) => ["metas-base", userId] as const;

export async function buscarBaseMetas(): Promise<BaseMetas> {
  const db = supabase as any;
  const q = (t: string, o = "created_at") => db.from(t).select("*").order(o);
  const [c, o, k, ko, i, m, n, u, p] = await Promise.all([
    q("mt_cadeiras", "nome"), q("mt_objetivos", "codigo"), q("mt_okrs", "codigo"), db.from("mt_okr_objetivos").select("*"),
    q("mt_indicadores", "codigo"), q("mt_metas_mensais", "competencia"), q("mt_iniciativas"), db.from("mt_usuarios").select("*"),
    db.from("profiles").select("user_id,display_name,email").order("display_name"),
  ]);
  return { cadeiras: c.data ?? [], objetivos: o.data ?? [], okrs: k.data ?? [], okrObj: ko.data ?? [], indicadores: i.data ?? [], metas: m.data ?? [], iniciativas: n.data ?? [], usuarios: u.data ?? [], perfis: p.data ?? [] };
}

export function useMetasBase() {
  const org = useBaseOrganizacional();
  const { user } = useAuth();
  const access = useModuleAccess();
  const queryClient = useQueryClient();
  const uid = user?.id ?? null;
  // A chave leva o usuário: cada conta vê só o que as regras do banco liberam para ela.
  const base = useQuery({ queryKey: chaveBaseMetas(uid), queryFn: buscarBaseMetas, staleTime: BASE_METAS_VALIDADE_MS });
  const gov = useQuery({
    queryKey: ["mt-is-governanca", uid],
    queryFn: async () => { const { data } = await (supabase as any).rpc("mt_is_governanca", { _uid: uid }); return !!data; },
    enabled: !!uid, staleTime: 5 * 60_000,
  });
  const s = base.data ?? BASE_VAZIA;
  const loading = base.isPending;
  const isGov = gov.data ?? false;
  const load = useCallback(async () => { await queryClient.refetchQueries({ queryKey: chaveBaseMetas(uid), exact: true }); }, [queryClient, uid]);

  const corporativo = !!user?.email?.toLowerCase().endsWith(EMAIL_CORP);
  const meu = s.usuarios.find((x) => x.user_id === user?.id);
  const pessoas = org.diretorio.pessoas;
  const cadeiras = s.cadeiras.map(c => { const titular = org.diretorio.cadeiras.find(k => k.id === c.id)?.titular_pessoa_id; const pessoa = pessoas.find(p => p.id === titular || (c.diretor_user_id && p.user_id === c.diretor_user_id)); return { ...c, diretor_nome: pessoa?.nome ?? c.diretor_nome }; });
  const perfis = s.perfis.map(p => ({ ...p, display_name: pessoas.find(x => x.user_id === p.user_id)?.nome ?? p.display_name }));
  const iniciativas = s.iniciativas.map(i => ({ ...i, responsavel_nome: nomeVinculado(i.responsavel_pessoa_id, i.responsavel_nome, pessoas) || null }));
  return { ...s, cadeiras, perfis, iniciativas, pessoasOrg: pessoas, loading: loading || access.loading, reload: load, isGov: isGov && access.canWrite("metas"), isGovernanca: isGov, corporativo, minhaCadeira: meu?.cadeira_id ?? null, user };
}
