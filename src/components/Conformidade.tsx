import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { conformidadeCadeira, INICIO_CONFORMIDADE, type RegCiclo } from "@/lib/conformidade";

const db = supabase as any;
export const pctC = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

/** Registros de checkout para a conformidade. A função do banco só devolve as cadeiras que o usuário pode ver (Governança, CEO ou a própria). */
export function useConformidade() {
  const [regs, setRegs] = useState<RegCiclo[]>([]);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    db.rpc("rotina_conformidade", { _de: INICIO_CONFORMIDADE, _ate: hoje }).then(({ data }: any) => {
      setRegs((data ?? []).map((r: any) => ({ ...r, semana: String(r.semana).slice(0, 10) }))); setOk(true);
    });
  }, []);
  return { regs, carregado: ok, de: (cadeira: string) => conformidadeCadeira(cadeira, regs) };
}

/** Cartão "Sua conformidade" no formulário do diretor. */
export function CartaoConformidade({ cadeira }: { cadeira: string }) {
  const c = useConformidade();
  if (!c.carregado || !cadeira) return null;
  const r = c.de(cadeira);
  return (
    <Card className="p-4 flex flex-wrap items-center gap-4">
      <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Sua conformidade</p>
        <p className="text-2xl font-bold tabular-nums">{pctC(r.acumulado.taxa)}</p>
        <p className="text-xs text-muted-foreground">{r.acumulado.conformes} de {r.acumulado.devidos} ciclos no prazo e completos</p></div>
      <div className="text-sm space-y-0.5"><p>Pontualidade: <b>{pctC(r.acumulado.pontualidade)}</b></p><p>Completude média: <b>{pctC(r.acumulado.completudeMedia)}</b></p></div>
      {r.tendencia != null && <Badge variant={r.tendencia < 0 ? "destructive" : "secondary"}>{r.tendencia >= 0 ? "▲" : "▼"} {Math.abs(Math.round(r.tendencia * 100))} p.p. no mês</Badge>}
      <p className="text-xs text-muted-foreground basis-full">Conta a partir do checkout de 19/10/2026. Ciclo conforme = enviado até segunda 23h59 com todos os itens obrigatórios. Ciclo não enviado conta como não conforme.</p>
    </Card>
  );
}
