import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { FormDados } from "@/lib/sociosTradeoff";

export type SocioRow = {
  id: string; user_id: string; status: string; respostas: any; diretrizes: any; projetos: any; extras: any;
  versao: number; enviado_em: string | null; primeiro_envio_em: string | null; reaberto_ate: string | null; updated_at: string;
};
export type Participante = { id: string; email: string; nome_exibicao: string; user_id: string | null; respondente: boolean; pode_ver_consolidado: boolean; ativo: boolean };

const db = supabase as any;

export function useMinhaResposta() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["socios-minha", user?.id];
  const q = useQuery({
    queryKey: key, enabled: !!user,
    queryFn: async () => {
      const [p, r] = await Promise.all([
        db.from("socios_participantes").select("*").eq("user_id", user!.id).maybeSingle(),
        db.from("socios_respostas_2027").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);
      if (p.error) throw p.error;
      if (r.error) throw r.error;
      return { participante: p.data as Participante | null, resposta: r.data as SocioRow | null };
    },
  });
  const salvar = async (d: FormDados) => {
    const { data, error } = await db.from("socios_respostas_2027")
      .upsert({ user_id: user!.id, ...d }, { onConflict: "user_id" }).select("*").single();
    if (error) throw error;
    qc.setQueryData(key, (old: any) => ({ ...old, resposta: data }));
    return data as SocioRow;
  };
  const enviar = async (d: FormDados) => {
    await salvar(d);
    const { error } = await db.rpc("socios_enviar");
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: key });
  };
  return { ...q, salvar, enviar };
}

export function useConsolidado() {
  return useQuery({
    queryKey: ["socios-consolidado"],
    queryFn: async () => {
      const [p, r, v] = await Promise.all([
        db.from("socios_participantes").select("*").order("nome_exibicao"),
        db.from("socios_respostas_2027").select("*"),
        db.from("socios_respostas_versoes").select("id,user_id,versao,enviado_em").order("enviado_em", { ascending: false }),
      ]);
      for (const x of [p, r, v]) if (x.error) throw x.error;
      return { participantes: p.data as Participante[], respostas: r.data as SocioRow[], versoes: v.data as { id: string; user_id: string; versao: number; enviado_em: string }[] };
    },
  });
}

export async function reabrirSocio(userId: string, ate: string) {
  const { error } = await db.rpc("socios_reabrir", { _user_id: userId, _ate: ate });
  if (error) throw error;
}

export function useRespostaPorLink(token: string) {
  const qc = useQueryClient();
  const key = ["socios-link", token];
  const q = useQuery({
    queryKey: key, retry: false,
    queryFn: async () => {
      const { data, error } = await db.rpc("socios_link_carregar", { _token: token });
      if (error) throw error;
      return data as { participante: Participante | null; resposta: SocioRow | null };
    },
  });
  const salvar = async (d: FormDados) => {
    const { data, error } = await db.rpc("socios_link_salvar", { _token: token, _respostas: d.respostas, _diretrizes: d.diretrizes, _projetos: d.projetos, _extras: d.extras });
    if (error) throw error;
    qc.setQueryData(key, (old: any) => ({ ...old, resposta: data }));
    return data as SocioRow;
  };
  const enviar = async (d: FormDados) => {
    await salvar(d);
    const { error } = await db.rpc("socios_link_enviar", { _token: token });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: key });
  };
  return { ...q, salvar, enviar };
}

export async function gerarLinkSocio(participanteId: string) {
  const { data, error } = await db.rpc("socios_link_gerar", { _participante_id: participanteId });
  if (error) throw error;
  return `${window.location.origin.includes("localhost") ? "https://nextlevel-lm.lovable.app" : window.location.origin}/responder/${data}`;
}
export async function revogarLinkSocio(participanteId: string) {
  const { error } = await db.rpc("socios_link_revogar", { _participante_id: participanteId });
  if (error) throw error;
}
