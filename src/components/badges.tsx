import { cn } from "@/lib/utils";
import { type StatusExecucao, type StatusBC, type Classificacao, type Wave, type Saude } from "@/data/mockData";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Conceito Wave (LM): agrupamento intencional e sequenciado de iniciativas que
// remove restrições críticas, instala capacidades organizacionais e habilita o
// próximo nível de execução da estratégia — respeitando dependências, risco e
// capacidade de absorção. Wave ordena capacidades (lógica), não cronograma.
export const WAVE_DESCRIPTIONS: Record<Wave, { titulo: string; periodo: string; foco: string }> = {
  W1: {
    titulo: "Wave 1 — Estrutura mínima",
    periodo: "Remove risco sistêmico",
    foco: "Remove restrições estruturais e protege EEA/C.01: governança, dados e financeiro (teto de variáveis, FP&A 36m, cohort P&L, CAPEX, dashboards, forecast por NRR), processos e qualidade (gestão à vista, gates de prontidão, alertas de engajamento) e pessoas e liderança (treino do método, matriz performance, PDI, OTE/PLR, rituais 1:1). Sem isso, crescer quebra.",
  },
  W2: {
    titulo: "Wave 2 — Escala com controle",
    periodo: "Crescer com previsibilidade, eficiência e repetição",
    foco: "Comercial e aquisição (leadscore, funil, DRE de vendedor, squads, outbound/field), produto e jornada (escada de valor, BU Paciente Grave, app próprio, alertas de CX), operação e capacidade (ITC, simulação com IA) e alavancas estratégicas (follow-up automatizado, scripts/pitch com IA, pricing & packaging 2.0 ancorado no cohort P&L).",
  },
  W3: {
    titulo: "Wave 3 — Aceleração e diferenciação",
    periodo: "Vantagem competitiva, novos modelos e inovação",
    foco: "IA avançada e diferenciação (chat IA LM, copilotos, biblioteca de algoritmos, Emy Education AI-native, portfólio de agentes), marca e ecossistema (ALUMNI, calendário editorial, Pílulas, Social Selling, LM Capital/FIDC) e expansão estrutural (multi-hub SP/Recife/Curitiba, Faculty Cloud, SVST multidisciplinar, P04 Angola).",
  },
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
  const info = WAVE_DESCRIPTIONS[wave];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(baseClass, map[wave], "cursor-help")} aria-label={info.titulo}>{wave}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <div className="font-semibold text-sm">{info.titulo}</div>
          <div className="text-xs text-muted-foreground">{info.periodo}</div>
          <p className="text-xs leading-relaxed">{info.foco}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function SaudeBadge({ saude }: { saude: Saude }) {
  const map: Record<Saude, string> = {
    "On-Track": "bg-success-soft text-success border-success/30",
    "Alerta": "bg-warning-soft text-warning-foreground border-warning/40",
    "Off-Track": "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <span className={cn(baseClass, map[saude])}>● {saude}</span>;
}
