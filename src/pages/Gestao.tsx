import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, FolderKanban, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { projetos } from "@/data/mockData";
import { SaudeBadge } from "@/components/badges";
import { SubmissaoProjetoDialog } from "@/components/SubmissaoProjetoDialog";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Gestao() {
  const [q, setQ] = useState("");

  const iniciados = useMemo(
    () => projetos.filter(p =>
      p.classificacao === "Institucional" &&
      (p.status === "Em Andamento" || p.status === "Em Avaliação" || p.status === "Atrasado")
    ),
    []
  );

  const filtrados = useMemo(
    () => iniciados.filter(p => !q || p.nome.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase())),
    [iniciados, q]
  );

  const onTrack = iniciados.filter(p => p.saude === "On-Track").length;
  const alerta = iniciados.filter(p => p.saude === "Alerta").length;
  const offTrack = iniciados.filter(p => p.saude === "Off-Track").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gestão de Projetos Institucionais</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acesso individual a cada projeto institucional iniciado — cronograma, EAP, riscos, desvios, custos e stakeholders.
            <br />
            <span className="text-xs">Iniciativas de Melhoria Contínua estão em <Link to="/melhorias" className="underline text-primary">Gestão de Melhorias</Link>.</span>
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar projeto…"
            className="pl-9 w-64"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Projetos iniciados</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{iniciados.length}</div>
            </div>
            <FolderKanban className="h-5 w-5 text-foreground" />
          </div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">On-Track</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-success">{onTrack}</div>
            </div>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Alerta</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-warning-foreground">{alerta}</div>
            </div>
            <Clock className="h-5 w-5 text-warning-foreground" />
          </div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Off-Track</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-destructive">{offTrack}</div>
            </div>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
        </Card>
      </div>

      {/* Lista de projetos iniciados */}
      <div>
        <h3 className="font-semibold mb-3 px-1">Projetos iniciados · {filtrados.length}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtrados.map(p => {
            const exec = p.budget > 0 ? Math.min(100, (p.realizado / p.budget) * 100) : 0;
            return (
              <Card key={p.id} className="p-5 shadow-card hover:shadow-elevated transition-shadow group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground tabular-nums">{p.id} · {p.wave} · {p.classificacao}</div>
                    <div className="font-semibold mt-0.5 truncate">{p.nome}</div>
                  </div>
                  <SaudeBadge saude={p.saude} />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                  <div>
                    <div className="text-muted-foreground">Diretor</div>
                    <div className="font-medium truncate">{p.diretor}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Início</div>
                    <div className="font-medium tabular-nums">{p.inicio}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Término</div>
                    <div className="font-medium tabular-nums">{p.termino}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Execução financeira</span>
                    <span className="tabular-nums font-medium">{exec.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        p.saude === "Off-Track" ? "bg-destructive" : p.saude === "Alerta" ? "bg-warning" : "bg-success"
                      )}
                      style={{ width: `${exec}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                    R$ {p.realizado.toLocaleString("pt-BR")} / R$ {p.budget.toLocaleString("pt-BR")}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-normal">BC: {p.statusBC}</Badge>
                    <Badge variant="outline" className="text-[10px] font-normal">{p.status}</Badge>
                  </div>
                  <Link to={`/gestao/${p.id}`}>
                    <Button size="sm" className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground">
                      Abrir gestão <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {filtrados.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground shadow-card">
            Nenhum projeto encontrado para "{q}".
          </Card>
        )}
      </div>
    </div>
  );
}
