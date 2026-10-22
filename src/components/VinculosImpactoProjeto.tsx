import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GrupoMultiSelect from "@/components/socios/GrupoMultiSelect";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Indicador, Objetivo, Okr } from "@/hooks/useMetasBase";
import type { ProjVinc, ProjetoG } from "@/hooks/useProjetosGestao";

const db = supabase as any;
type Tipo = ProjVinc["tipo"];
export const TIPO_VINC: Record<Tipo, string> = { bsc_objetivo: "Objetivo BSC", bsc_kpi: "KPI BSC", kr: "KR 2026/2", cesta: "Cesta de metas" };

/** Edita os vínculos de impacto do projeto (objetivo BSC, KPI BSC, KR 2026/2, cesta). */
export default function VinculosImpactoProjeto({ projeto, vinculos, indicadores, okrs, objetivos, onSalvo, podeEditar }: {
  projeto: ProjetoG; vinculos: ProjVinc[]; indicadores: Indicador[]; okrs: Okr[]; objetivos: Objetivo[]; onSalvo: () => void; podeEditar: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const atuais = (t: Tipo) => vinculos.filter((v) => v.projeto_id === projeto.id && v.tipo === t).map((v) => v.ref_id);
  const [sel, setSel] = useState<Record<Tipo, string[]>>({ bsc_objetivo: [], bsc_kpi: [], kr: [], cesta: [] });
  const [salvando, setSalvando] = useState(false);
  const ativos = indicadores.filter((i) => i.status === "ativo" && !i.parent_id);
  const okr2 = new Set(okrs.filter((o) => o.semestre === "2026/2").map((o) => o.id));
  const op = (l: Indicador[]) => l.map((i) => ({ value: i.id, label: `${i.codigo} · ${i.nome}` }));
  const opcoes: Record<Tipo, { value: string; label: string }[]> = {
    bsc_objetivo: objetivos.map((o) => ({ value: o.id, label: `${o.codigo} · ${o.descricao}` })),
    bsc_kpi: op(ativos.filter((i) => i.origem === "bsc")),
    kr: op(ativos.filter((i) => i.origem === "okr" && i.okr_id && okr2.has(i.okr_id))),
    cesta: op(ativos.filter((i) => i.origem === "cesta")),
  };
  const total = (Object.keys(TIPO_VINC) as Tipo[]).reduce((n, t) => n + atuais(t).length, 0);
  const abrir = () => { setSel({ bsc_objetivo: atuais("bsc_objetivo"), bsc_kpi: atuais("bsc_kpi"), kr: atuais("kr"), cesta: atuais("cesta") }); setAberto(true); };
  const salvar = async () => {
    setSalvando(true);
    const atual = vinculos.filter((v) => v.projeto_id === projeto.id);
    const remover = atual.filter((v) => !sel[v.tipo].includes(v.ref_id)).map((v) => v.id);
    const novos = (Object.keys(sel) as Tipo[]).flatMap((t) => sel[t].filter((r) => !atual.some((v) => v.tipo === t && v.ref_id === r)).map((ref_id) => ({ projeto_id: projeto.id, tipo: t, ref_id })));
    let erro = null;
    if (remover.length) erro = (await db.from("projeto_vinculos").delete().in("id", remover)).error;
    if (!erro && novos.length) erro = (await db.from("projeto_vinculos").insert(novos)).error;
    setSalvando(false);
    if (erro) return toast.error(erro.message);
    toast.success("Vínculos salvos."); setAberto(false); onSalvo();
  };
  return (
    <>
      <Button size="sm" variant="outline" onClick={abrir}>{total ? `${total} vínculo(s)` : "Vincular"}</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Vínculos de impacto · {projeto.codigo}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{projeto.nome}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(TIPO_VINC) as Tipo[]).map((t) => (
              <div key={t} className="space-y-1"><Label className="text-xs">{TIPO_VINC[t]}</Label>
                <GrupoMultiSelect grupos={[{ grupo: TIPO_VINC[t], opcoes: opcoes[t] }]} value={sel[t]} onChange={(x) => setSel({ ...sel, [t]: x })} placeholder={TIPO_VINC[t]} disabled={!podeEditar} />
              </div>
            ))}
          </div>
          {(projeto.objetivos?.length || projeto.krs?.length) ? (
            <p className="text-xs text-muted-foreground">Histórico (somente leitura): objetivos {projeto.objetivos?.join(", ") || "—"} · KRs {projeto.krs?.join(", ") || "—"}</p>
          ) : null}
          {podeEditar && <div className="flex justify-end"><Button disabled={salvando} onClick={salvar}>{salvando ? "Salvando…" : "Salvar vínculos"}</Button></div>}
        </DialogContent>
      </Dialog>
    </>
  );
}
