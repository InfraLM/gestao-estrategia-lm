import { AlertCircle, CheckCircle2, Loader2, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SaveState = { estado: "ocioso" | "alterado" | "salvando" | "salvo" | "erro"; em?: Date; erro?: string };

export function SaveFeedback({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const Icon = state.estado === "erro" ? AlertCircle : state.estado === "salvando" ? Loader2 : state.estado === "salvo" ? CheckCircle2 : Cloud;
  const text = state.estado === "erro" ? "Não foi possível salvar. Rascunho guardado neste aparelho."
    : state.estado === "salvando" ? "Salvando rascunho…"
    : state.estado === "salvo" ? `Rascunho salvo às ${state.em?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) ?? "—"}`
    : state.estado === "alterado" ? "Alterações neste aparelho · aguardando salvamento"
    : "Salvamento automático do rascunho";
  return <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs" role={state.estado === "erro" ? "alert" : "status"} aria-live="polite" aria-atomic="true">
    <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${state.estado === "salvando" ? "animate-spin motion-reduce:animate-none" : ""}`} />
    <span className={state.estado === "erro" ? "text-destructive" : "text-muted-foreground"}>{text}</span>
    {state.estado === "erro" && <Button size="sm" variant="outline" onClick={onRetry}>Tentar novamente</Button>}
  </div>;
}