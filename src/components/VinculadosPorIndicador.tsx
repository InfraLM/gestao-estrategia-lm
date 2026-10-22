import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import EmpilhadosVinculo from "@/components/EmpilhadosVinculo";
import { cn } from "@/lib/utils";

/** Bloco "Iniciativas e projetos vinculados" para cada KR (origem kr) ou item da cesta (origem cesta). */
export default function VinculadosPorIndicador({ origem, titulo }: { origem: "kr" | "cesta"; titulo: string }) {
  const [itens, setItens] = useState<any[]>([]);
  const [cads, setCads] = useState<Record<string, string>>({});
  const [aberto, setAberto] = useState<string | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    const db = supabase as any;
    db.from("mt_indicadores").select("id,codigo,nome,cadeira_id").eq("origem", origem).order("codigo").then(({ data }: any) => setItens(data ?? []));
    db.from("mt_cadeiras").select("id,nome").then(({ data }: any) => setCads(Object.fromEntries((data ?? []).map((c: any) => [c.id, c.nome]))));
  }, [origem]);
  const lista = useMemo(() => itens.filter((i) => `${i.codigo} ${i.nome} ${cads[i.cadeira_id] ?? ""}`.toLowerCase().includes(q.toLowerCase())), [itens, q, cads]);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{titulo}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Input placeholder="Buscar item…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        {!lista.length && <p className="text-xs text-muted-foreground">Nenhum item encontrado.</p>}
        <ul className="divide-y rounded border">
          {lista.map((i) => (
            <li key={i.id}>
              <button type="button" aria-expanded={aberto === i.id} onClick={() => setAberto(aberto === i.id ? null : i.id)} className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-muted/50">
                <span className="font-mono text-xs text-muted-foreground">{i.codigo}</span>
                <span className="flex-1">{i.nome}</span>
                <span className="text-xs text-muted-foreground">{cads[i.cadeira_id] ?? ""}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", aberto === i.id ? "" : "-rotate-90")} />
              </button>
              {aberto === i.id && <div className="p-3 bg-muted/30"><EmpilhadosVinculo refs={[i.id]} /></div>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
