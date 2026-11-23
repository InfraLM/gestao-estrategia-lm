import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DECISOES } from "@/lib/projetosGestao";

/** Decisões de projetos com desvio (códigos SR), somente leitura, em Contexto e Decisões. */
export default function DecisoesProjetos() {
  const [lista, setLista] = useState<any[]>([]);
  useEffect(() => {
    (supabase as any).from("projeto_decisoes").select("*, projetos(codigo,nome)").order("created_at", { ascending: false }).then(({ data }: any) => setLista(data ?? []));
  }, []);
  return (
    <section className="space-y-2 pt-6">
      <h2 className="text-lg font-semibold">Decisões de projetos (Status Report)</h2>
      {!lista.length ? <p className="text-sm text-muted-foreground">Nenhuma decisão de projeto registrada.</p> : (
        <div className="divide-y rounded border">{lista.map((d) => (
          <div key={d.id} className="p-3 text-sm space-y-1">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{d.codigo}</Badge><span className="font-medium">{d.projetos?.codigo} · {d.projetos?.nome}</span>
              <Badge variant="outline">{DECISOES[d.decisao]}{d.desfecho ? ` · ${d.desfecho}` : ""}</Badge></div>
            <p className="whitespace-pre-wrap">{d.justificativa}</p>
            {d.projecoes && <p className="text-muted-foreground whitespace-pre-wrap">Projeções/ajustes: {d.projecoes}</p>}
            <p className="text-xs text-muted-foreground">{d.decidido_por_nome ?? "—"} · {new Date(d.created_at).toLocaleString("pt-BR")}</p>
          </div>
        ))}</div>
      )}
    </section>
  );
}
