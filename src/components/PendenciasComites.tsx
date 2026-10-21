import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GovAcao, contarPendencias, ordenarPendencias, seloPrazo } from "@/lib/governancaPendencias";

const data = (valor: string | null) => {
  if (!valor) return "—";
  const d = new Date(valor.length === 10 ? `${valor}T12:00:00` : valor);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
};

export default function PendenciasComites({ cadeira, usuario, podeEditar, admin, vinculadas, onPuxar }: {
  cadeira: string; usuario?: string; podeEditar: boolean; admin: boolean; vinculadas: string[]; onPuxar: (acao: GovAcao) => void;
}) {
  const q = useQuery({
    queryKey: ["gov-pendencias", usuario, cadeira], enabled: !!cadeira && !!usuario,
    queryFn: async () => {
      const [acoes, log] = await Promise.all([
        supabase.rpc("gov_acoes_da_cadeira", { _cadeira: cadeira }),
        supabase.rpc("gov_ultima_sincronizacao", { _cadeira: cadeira }),
      ]);
      if (acoes.error) throw acoes.error;
      if (log.error) throw log.error;
      return { acoes: acoes.data as GovAcao[], sincronizado: log.data };
    }, refetchOnWindowFocus: true,
  });
  const acoes = ordenarPendencias(q.data?.acoes ?? []);
  const cont = contarPendencias(acoes);
  return <Collapsible defaultOpen className="rounded border p-4" aria-label="Pendências de comitês">
    <CollapsibleTrigger asChild><Button variant="ghost" className="h-auto w-full justify-between gap-2 whitespace-normal text-left">
      <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">Pendências de comitês</span>
        <Badge variant="secondary">{cont.total} total</Badge><Badge variant="outline">{cont.vencidas} vencidas</Badge><Badge variant="outline">{cont.semPrazo} sem prazo</Badge>
      </span><ChevronDown className="h-4 w-4 shrink-0" />
    </Button></CollapsibleTrigger>
    <CollapsibleContent className="pt-3 space-y-3">
      {q.isPending && <p className="text-sm text-muted-foreground">Carregando pendências…</p>}
      {q.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar as pendências.</p>}
      {!q.isPending && !q.isError && !acoes.length && <p className="text-sm text-muted-foreground">Nenhuma pendência de comitê para esta cadeira.</p>}
      {acoes.map(a => <div key={a.id} className="border-b pb-3 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 break-words font-medium">{a.titulo}</h3>
          {podeEditar && <Button size="sm" variant="outline" disabled={vinculadas.includes(a.id)} onClick={() => onPuxar(a)}><Plus className="mr-1 h-4 w-4" />{vinculadas.includes(a.id) ? "Já na semana" : "Puxar para a semana"}</Button>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">Comitê {a.comite_codigo ?? "—"}</Badge>
          <Badge variant={seloPrazo(a.prazo) === "Vencida" ? "destructive" : "secondary"}>{seloPrazo(a.prazo) === "Vencida" ? `Vencida · ${data(a.prazo)}` : a.prazo ? data(a.prazo) : "Sem prazo"}</Badge>
          {a.prioridade && <Badge variant="outline">{a.prioridade}</Badge>}
          {a.precisa_escalar && <Badge variant="destructive">Escalar</Badge>}
        </div>
        <p className="text-sm text-muted-foreground break-words">{a.reuniao_titulo ?? "Reunião não informada"} · {data(a.reuniao_data)} · Responsável: {a.responsavel_origem ?? "—"}</p>
        {!!a.outros_responsaveis?.length && <p className="text-sm text-muted-foreground">Compartilhada com: {a.outros_responsaveis.join(", ")}</p>}
      </div>)}
      <p className="text-xs text-muted-foreground">Fonte: app de Governança · sincronizado em {q.data?.sincronizado ? new Date(q.data.sincronizado).toLocaleString("pt-BR") : "—"}
        {admin && <> · <Link className="underline" to="/governanca/integracao">Integração Governança</Link></>}
      </p>
    </CollapsibleContent>
  </Collapsible>;
}