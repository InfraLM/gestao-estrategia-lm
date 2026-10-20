import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "./useModuleAccess";
import { moduleForContent } from "@/lib/moduleAccess";

let cache: Record<string, any> | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

async function loadAll() {
  const { data } = await (supabase as any).from("conteudo_editavel").select("chave,valor");
  cache = Object.fromEntries(((data as any[]) ?? []).map((r) => [r.chave, r.valor]));
  listeners.forEach((l) => l());
}

/** Conteúdo editável (Diagnóstico/Estratégia/BSC/OKRs): base estática + versão salva no banco. */
export function useConteudo<T>(chave: string, padrao: T) {
  const { user } = useAuth();
  const access = useModuleAccess();
  const [, force] = useState(0);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (!cache && !loading) loading = loadAll().finally(() => (loading = null));
    return () => { listeners.delete(l); };
  }, []);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("user_roles").select("role").eq("user_id", user.id).then(({ data }: any) => {
      const r = ((data as any[]) ?? []).map((x) => x.role);
      setCanEdit(r.some((x) => ["super_admin", "admin", "pmo"].includes(x)));
    });
  }, [user]);

  const data: T = cache && chave in cache ? (cache[chave] as T) : padrao;

  const save = useCallback(async (valor: T) => {
    const { error } = await (supabase as any).from("conteudo_editavel").upsert({
      chave, valor, atualizado_por: user?.id ?? null, atualizado_por_nome: user?.email ?? null,
    });
    if (error) throw error;
    cache = { ...(cache ?? {}), [chave]: valor };
    listeners.forEach((l) => l());
  }, [chave, user]);

  const restaurar = useCallback(() => save(padrao), [save, padrao]);

  return { data, save, restaurar, canEdit: access.canWrite(moduleForContent(chave)) && (canEdit || access.explicitEditor(moduleForContent(chave))), editado: !!cache && chave in cache };
}
