import { cn } from "@/lib/utils";
import { type StatusExecucao, type StatusBC, type Classificacao, type Wave, type Saude } from "@/data/mockData";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const WAVE_DESCRIPTIONS: Record<Wave, { titulo: string; periodo: string; foco: string }> = {
  W1: { titulo: "Wave 1 — Fundamentos & Quick Wins", periodo: "2026", foco: "Estruturação da PMO, governança e iniciativas de impacto rápido com baixa complexidade." },
  W2: { titulo: "Wave 2 — Crescimento & Escala",     periodo: "2027 – 2028", foco: "Expansão de produtos institucionais, integração de processos e ganho de escala operacional." },
  W3: { titulo: "Wave 3 — Inovação & Expansão",      periodo: "2029 – 2030", foco: "Novos modelos de negócio, transformação digital avançada e diversificação do portfolio." },
};

const baseClass = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap";

export function StatusBadge({ status }: { status: StatusExecucao }) {
  const map: Record<StatusExecucao, string> = {
    "Em Andamento": "bg-success-soft text-success border-success/30",
    "Atrasado": "bg-destructive/10 text-destructive border-destructive/30",
    "Pausado": "bg-warning-soft text-warning-foreground border-warning/40",
    "Backlog": "bg-neutral-soft text-neutral border-border",
    "A Iniciar": "bg-info-soft text-info border-info/30",
    "Concluído": "bg-success-soft text-success border-success/30",
    "Cancelado": "bg-muted text-muted-foreground border-border",
    "Em Avaliação": "bg-warning-soft text-warning-foreground border-warning/40",
    "Validação": "bg-info-soft text-info border-info/30",
    "Encerramento": "bg-warning-soft text-warning-foreground border-warning/40",
  };
  return <span className={cn(baseClass, map[status])}>● {status}</span>;
}

export function BCBadge({ status }: { status: StatusBC }) {
  const map: Record<StatusBC, string> = {
    "Ativo EPP": "bg-success-soft text-success border-success/30",
    "BC em Construção": "bg-info-soft text-info border-info/30",
    "Em Revisão": "bg-warning-soft text-warning-foreground border-warning/40",
    "Sem BC": "bg-muted text-muted-foreground border-border",
    "Projeto Concluído": "bg-success-soft text-success border-success/30",
    "BC não aplicável": "bg-muted text-muted-foreground border-border",
    "Adiado": "bg-warning-soft text-warning-foreground border-warning/40",
    "Validado": "bg-success-soft text-success border-success/30",
  };
  return <span className={cn(baseClass, map[status])}>{status}</span>;
}

export function ClassBadge({ value }: { value: Classificacao }) {
  const map: Record<Classificacao, string> = {
    "Institucional": "bg-primary/10 text-primary border-primary/30",
    "Melhoria Contínua": "bg-info-soft text-info border-info/30",
    "Melhoria Contínua com EPP": "bg-purple-100 text-purple-700 border-purple-300",
    "Novo Produto": "bg-success-soft text-success border-success/30",
  };
  return <span className={cn(baseClass, map[value])}>{value}</span>;
}

export function WaveBadge({ wave }: { wave: Wave }) {
  const map: Record<Wave, string> = {
    W1: "bg-[hsl(var(--wave-1))]/10 text-[hsl(var(--wave-1))] border-[hsl(var(--wave-1))]/30",
    W2: "bg-[hsl(var(--wave-2))]/10 text-[hsl(var(--wave-2))] border-[hsl(var(--wave-2))]/30",
    W3: "bg-[hsl(var(--wave-3))]/10 text-[hsl(var(--wave-3))] border-[hsl(var(--wave-3))]/30",
  };
  return <span className={cn(baseClass, map[wave])}>{wave}</span>;
}

export function SaudeBadge({ saude }: { saude: Saude }) {
  const map: Record<Saude, string> = {
    "On-Track": "bg-success-soft text-success border-success/30",
    "Alerta": "bg-warning-soft text-warning-foreground border-warning/40",
    "Off-Track": "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <span className={cn(baseClass, map[saude])}>● {saude}</span>;
}
