import { Card } from "@/components/ui/card";
import { Construction, GanttChart, ListChecks, ShieldAlert, GitBranch, ScrollText } from "lucide-react";

const blocks = [
  { icon: GanttChart, title: "Cronograma (Gantt simplificado)", desc: "Linha do tempo visual de marcos e dependências." },
  { icon: ListChecks, title: "Lista de Tarefas", desc: "Quebra de entregas, responsáveis e progresso por tarefa." },
  { icon: ShieldAlert, title: "Registro de Riscos", desc: "Mapeamento, probabilidade, impacto e mitigação." },
  { icon: GitBranch, title: "Mudanças de Escopo", desc: "Solicitações de mudança com fluxo de aprovação." },
  { icon: ScrollText, title: "Histórico de Decisões", desc: "Log de decisões críticas e contexto." },
];

export default function Gestao() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="p-8 shadow-elevated bg-gradient-dark text-background relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/15 grid place-items-center">
            <Construction className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-primary/80 font-semibold mb-1">Em desenvolvimento</div>
            <h2 className="text-2xl font-semibold mb-1">Gestão de Projetos Individual</h2>
            <p className="text-sm text-background/70 max-w-2xl">Esta funcionalidade está em desenvolvimento e será lançada em breve. Confira abaixo um preview da estrutura planejada para o módulo.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blocks.map(b => (
          <Card key={b.title} className="p-5 shadow-card border-dashed bg-surface-muted/40">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-background grid place-items-center text-muted-foreground border border-border">
                <b.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{b.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="h-2 w-full rounded bg-muted" />
                  <div className="h-2 w-4/5 rounded bg-muted" />
                  <div className="h-2 w-3/5 rounded bg-muted" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 shadow-card border-dashed bg-surface-muted/40">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Preview · Cronograma</div>
        <div className="space-y-2">
          {["Discovery","Planejamento","Execução · Sprint 1","Execução · Sprint 2","Validação","Encerramento"].map((t, i) => (
            <div key={t} className="flex items-center gap-3 text-xs">
              <span className="w-32 text-muted-foreground">{t}</span>
              <div className="flex-1 h-3 rounded bg-muted relative overflow-hidden">
                <div className="absolute inset-y-0 rounded bg-muted-foreground/20" style={{ left: `${i * 12}%`, width: `${20 + i * 4}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
