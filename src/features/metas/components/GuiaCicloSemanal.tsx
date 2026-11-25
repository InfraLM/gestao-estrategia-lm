import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { faltaTexto } from "@/features/metas/lib/guiaSemanal";

type Passo = "checkout" | "checkin" | "revisao";

/** Guia de 3 passos no topo do formulário semanal: onde a pessoa está e o que falta em cada parte. Só apresentação. */
export function GuiaCicloSemanal({ atual, faltaCheckout, faltaCheckin, prazo, enviado, onIr }: {
  atual: Passo; faltaCheckout: number; faltaCheckin: number; prazo: string; enviado: boolean; onIr: (p: Passo) => void;
}) {
  const passos: { id: Passo; n: number; titulo: string; sub: string; ok: boolean }[] = [
    { id: "checkout", n: 1, titulo: "Como foi a semana passada", sub: faltaTexto(faltaCheckout), ok: faltaCheckout === 0 },
    { id: "checkin", n: 2, titulo: "Plano desta semana", sub: faltaTexto(faltaCheckin), ok: faltaCheckin === 0 },
    { id: "revisao", n: 3, titulo: enviado ? "Ciclo enviado" : "Revisar e enviar", sub: enviado ? "pode reenviar se mudar algo" : `até ${prazo}`, ok: enviado },
  ];
  return (
    <nav aria-label="Passos do formulário semanal" className="grid gap-2 sm:grid-cols-3">
      {passos.map((p) => (
        <button key={p.id} type="button" onClick={() => onIr(p.id)} aria-current={atual === p.id ? "step" : undefined}
          className={cn("flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
            atual === p.id ? "border-primary bg-primary/5" : "border-border")}>
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            p.ok ? "bg-success text-success-foreground" : atual === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {p.ok ? <Check className="h-4 w-4" /> : p.n}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{p.titulo}</span>
            <span className={cn("block text-xs", p.ok ? "text-success" : "text-muted-foreground")}>{p.sub}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}

/** Texto longo resumido, com "ver detalhes" para abrir o restante. */
export function TextoResumido({ texto, limite = 160, className }: { texto: string; limite?: number; className?: string }) {
  const [aberto, setAberto] = useState(false);
  if (texto.length <= limite) return <span className={className}>{texto}</span>;
  const corte = texto.slice(0, limite);
  const resumo = corte.slice(0, Math.max(corte.lastIndexOf(" "), limite - 20)).trimEnd();
  return (
    <span className={className}>
      {aberto ? texto : `${resumo}…`}{" "}
      <button type="button" className="text-xs font-normal text-primary underline-offset-2 hover:underline" onClick={() => setAberto(!aberto)}>
        {aberto ? "ver menos" : "ver detalhes"}
      </button>
    </span>
  );
}
