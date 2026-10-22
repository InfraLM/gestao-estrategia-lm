import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase } from "@/hooks/useMetasBase";
import { useAvaliacoesBsc, cadeirasVisiveisBsc } from "@/hooks/useAvaliacoesBsc";
import { usePortfolioVinculos } from "@/hooks/usePortfolioVinculos";
import { AVALIACAO_LBL, type Avaliacao } from "@/lib/avaliacaoBsc";
import { avaliacaoKr, contarVinculosKr, semestreVigente } from "@/lib/aderenciaOkrs";

const COR: Record<Avaliacao, string> = { on: "text-success", off: "text-destructive", acomp: "text-warning", pendente: "text-muted-foreground", sem_meta: "text-muted-foreground", encerrada: "text-muted-foreground" };
const ORIGENS = ["okr"];
const mesAtual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

/** Aderência aos OKRs vigentes: avaliação pela regra única (tipo V/S/E) e vínculos por KR. */
export default function AderenciaOkrs() {
  const b = useMetasBase();
  const sem = semestreVigente();
  const aval = useAvaliacoesBsc(b.loading ? null : mesAtual(), b.loading ? null : cadeirasVisiveisBsc(b), ORIGENS);
  const v = usePortfolioVinculos();
  const [okrs, setOkrs] = useState<any[]>([]);
  const [krs, setKrs] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from("mt_okrs").select("id,codigo,nome").eq("semestre", sem).order("codigo");
      setOkrs(o ?? []);
      const ids = (o ?? []).map((x) => x.id);
      if (!ids.length) return;
      const { data: i } = await supabase.from("mt_indicadores").select("id,codigo,nome,okr_id").in("okr_id", ids).eq("status", "ativo").order("codigo");
      setKrs(i ?? []);
    })();
  }, [sem]);
  const avalPorKr = useMemo(() => { const m = new Map<string, Avaliacao>(); Object.values(aval.porCadeira).forEach((c) => c.itens.forEach((x) => m.set(x.id, x.aval))); return m; }, [aval.porCadeira]);

  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Aderência aos OKRs {sem}</h3>
        <span className="text-xs text-muted-foreground">Avaliação do mês e itens vinculados por KR (validados · a validar)</span>
      </div>
      {okrs.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum OKR cadastrado para {sem}.</p> :
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {okrs.map((o) => (
            <div key={o.id}>
              <div className="text-xs font-semibold text-primary tracking-wide">{o.codigo}</div>
              <div className="text-sm font-semibold mb-3">{o.nome}</div>
              <ul className="space-y-2.5">
                {krs.filter((k) => k.okr_id === o.id).map((k) => {
                  const a = avaliacaoKr(avalPorKr.get(k.id)); const c = contarVinculosKr(v.vinculos, k.id);
                  return (
                    <li key={k.id} className="text-xs border-t pt-2">
                      <p className="font-medium">{k.codigo ? `${k.codigo} — ` : ""}<span className="font-normal text-muted-foreground">{k.nome}</span></p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`font-semibold ${COR[a]}`}>{AVALIACAO_LBL[a]}</span>
                        <span className="tabular-nums"><span className="text-success">{c.validados}</span> · <span className="text-warning">{c.propostos}</span></span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>}
    </Card>
  );
}
