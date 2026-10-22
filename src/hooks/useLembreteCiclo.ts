import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cicloPadrao, semanaCheckout, seloCiclo, lembreteAtivo } from "@/lib/rotinaSemanal";

/** Aviso no app (sem e-mail): a partir de sexta 8h em São Paulo, para o diretor com cadeira vinculada, até o envio do ciclo. */
export function useLembreteCiclo() {
  const { user } = useAuth();
  const [st, setSt] = useState<{ ativo: boolean; ciclo: string }>({ ativo: false, ciclo: cicloPadrao() });
  useEffect(() => {
    if (!user) return;
    const db = supabase as any; const ciclo = cicloPadrao(); const out = semanaCheckout(ciclo);
    (async () => {
      const { data: c } = await db.from("mt_cadeiras").select("id").eq("diretor_user_id", user.id).eq("ativo", true).limit(1).maybeSingle();
      if (!c) return setSt({ ativo: false, ciclo });
      const { data: r } = await db.from("mt_checkins").select("tipo,semana,status,enviado_em,conteudo").eq("cadeira_id", c.id).in("semana", [ciclo, out]);
      const ci = (r ?? []).find((x: any) => x.tipo === "checkin" && x.semana === ciclo);
      const co = (r ?? []).find((x: any) => x.tipo === "checkout" && x.semana === out);
      setSt({ ativo: lembreteAtivo(ciclo, seloCiclo(ci, co, ciclo).estado === "enviado"), ciclo });
    })();
  }, [user?.id]);
  return st;
}
