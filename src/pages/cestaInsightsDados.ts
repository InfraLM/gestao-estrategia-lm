import type { Database } from "@/integrations/supabase/types";
import { canAccessModule, type ModuleGrant } from "@/lib/moduleAccess";
import { semAcentos } from "./contextoDecisoes";
export type CombinadoCesta = Database["public"]["Tables"]["cesta_insights"]["Row"];
export const ADERENCIAS = { atende: "Atende", parcial: "Parcial", nao_atende: "Não atende", nao_avaliado: "Não avaliado" } as const;
export type Aderencia = keyof typeof ADERENCIAS;
export const CORES_ADERENCIA: Record<Aderencia, string> = {
  atende: "bg-success-soft text-success border-success/30", parcial: "bg-warning-soft text-warning-foreground border-warning/40",
  nao_atende: "bg-destructive/10 text-destructive border-destructive/30", nao_avaliado: "bg-neutral-soft text-neutral border-border",
};
export function aderenciaValida(valor: string | null): Aderencia {
  return valor && Object.prototype.hasOwnProperty.call(ADERENCIAS, valor) ? valor as Aderencia : "nao_avaliado";
}
export function contarAderencias(itens: Pick<CombinadoCesta, "aderencia">[]) {
  const contagem = { atende: 0, parcial: 0, nao_atende: 0, nao_avaliado: 0 };
  for (const item of itens) contagem[aderenciaValida(item.aderencia)]++;
  return contagem;
}
export function podeEditarCesta(logado: boolean, grants: ModuleGrant[], roles: string[]) {
  return logado && canAccessModule(grants, "incentivos", true, roles.includes("super_admin"), roles.includes("admin"));
}
export function filtrarCombinados(itens: CombinadoCesta[], cadeira: string, aderencia: string, decisao: string, busca: string) {
  const termo = semAcentos(busca.trim());
  return itens.filter(i => (cadeira === "todos" || i.mt_cadeira_id === cadeira)
    && (aderencia === "todos" || aderenciaValida(i.aderencia) === aderencia)
    && (decisao === "todos" || i.decisao_codigo === decisao)
    && (!termo || [i.decisao_codigo, i.combinado, i.indicador_ref, i.observacao].some(t => semAcentos(t ?? "").includes(termo))));
}
export function avaliacaoPayload(aderencia: Aderencia, observacao: string, userId: string, hoje = new Date()) {
  const data = [hoje.getFullYear(), String(hoje.getMonth() + 1).padStart(2, "0"), String(hoje.getDate()).padStart(2, "0")].join("-");
  return { aderencia, observacao: observacao.trim() || null, avaliado_em: data, avaliado_por: userId };
}