import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Search, Sparkles, GitBranch, ClipboardList, Users, Calendar, Target } from "lucide-react";
import { projetos } from "@/data/mockData";
import { SaudeBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

const CLASSIF_COLORS: Record<string, string> = {
  "Melhoria Contínua": "bg-blue-100 text-blue-800 border-blue-200",
  "Melhoria Contínua com EPP": "bg-purple-100 text-purple-800 border-purple-200",
};

export default function Melhorias() {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<string>("Todas");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  const todas = useMemo(
    () => projetos.filter(p => p.classificacao === "Melhoria Contínua" || p.classificacao === "Melhoria Contínua com EPP"),
    []
  );

  const filtradas = useMemo(() => todas.filter(p => {
    if (tipo !== "Todas" && p.classificacao !== tipo) return false;
    if (statusFilter !== "Todos" && p.status !== statusFilter) return false;
    if (q && !p.nome.toLowerCase().includes(q.toLowerCase()) && !p.id.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [todas, tipo, statusFilter, q]);

  const local = todas.filter(p => p.classificacao === "Melhoria Contínua").length;
  const epp = todas.filter(p => p.classificacao === "Melhoria Contínua com EPP").length;
  const concluidas = todas.filter(p => p.status === "Concluído").length;
  const emAndamento = todas.filter(p => p.status === "Em Andamento").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Gestão de Melhorias
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Iniciativas de Melhoria Contínua e Melhoria com Impacto em Processos (EPP). Governança simplificada — autonomia das áreas com visibilidade estratégica.
        </p>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList>
          <TabsTrigger value="lista">Lista de Melhorias</TabsTrigger>
          <TabsTrigger value="governanca">Governança</TabsTrigger>
          <TabsTrigger value="rituais">Rituais</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-6 mt-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Total de melhorias</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{todas.length}</div>
            </Card>
            <Card className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Melhoria Contínua (local)</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-blue-700">{local}</div>
            </Card>
            <Card className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Com Impacto (EPP)</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-purple-700">{epp}</div>
            </Card>
            <Card className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Em andamento · Concluídas</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">
                <span className="text-success">{emAndamento}</span>
                <span className="text-muted-foreground/50 text-base"> / </span>
                <span>{concluidas}</span>
              </div>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="p-4 shadow-card flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar melhoria…" className="pl-9" />
            </div>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todos os tipos</SelectItem>
                <SelectItem value="Melhoria Contínua">Melhoria Contínua</SelectItem>
                <SelectItem value="Melhoria Contínua com EPP">Com Impacto (EPP)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os status</SelectItem>
                <SelectItem value="Backlog">Backlog</SelectItem>
                <SelectItem value="A Iniciar">A Iniciar</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Validação">Validação</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* Lista */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtradas.map(p => (
              <Card key={p.id} className="p-5 shadow-card hover:shadow-elevated transition-shadow group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground tabular-nums">{p.id} · {p.diretor}</div>
                    <div className="font-semibold mt-0.5 line-clamp-2">{p.nome}</div>
                  </div>
                  <SaudeBadge saude={p.saude} />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <Badge variant="outline" className={cn("text-[10px] font-normal", CLASSIF_COLORS[p.classificacao])}>
                    {p.classificacao === "Melhoria Contínua com EPP" ? "Impacto em Processos (EPP)" : "Local"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">{p.status}</Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">ICE {p.ice.toFixed(1)}</Badge>
                </div>
                <div className="flex justify-end">
                  <Link to={`/melhorias/${p.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Abrir BC e governança <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {filtradas.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground shadow-card">Nenhuma melhoria encontrada.</Card>
          )}
        </TabsContent>

        {/* Governança */}
        <TabsContent value="governanca" className="space-y-6 mt-6">
          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" /> Classificação das Iniciativas</h3>
            <p className="text-sm text-muted-foreground mb-5">Cada iniciativa é classificada em uma de três categorias, determinando o nível de governança.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-3 text-left font-medium border">Critério</th>
                    <th className="p-3 text-left font-medium border text-blue-700">Melhoria Contínua</th>
                    <th className="p-3 text-left font-medium border text-purple-700">Com Impacto em Processos</th>
                    <th className="p-3 text-left font-medium border text-emerald-700">Projeto Institucional</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Origem", "Operação local, problema pontual", "Sugestão local com reflexo em outras áreas", "Planejamento Estratégico / OKRs"],
                    ["Escopo", "Interno ao departamento", "Transversal (afeta múltiplos fluxos)", "Transformacional e complexo"],
                    ["Governança", "Gestor da área (autonomia total)", "Gestor + validação do Escritório de Processos", "Estrutura formal (PMO, Gates, Comitês)"],
                    ["Recursos", "Orçamento operacional (OPEX) local", "Recursos locais com apoio técnico do EPP", "Investimentos substanciais (CAPEX/OPEX)"],
                    ["Risco", "Gerenciável e local", "Risco de desalinhamento de processos", "Significativo (reputacional/legal)"],
                  ].map(row => (
                    <tr key={row[0]}>
                      <td className="p-3 border font-medium bg-muted/30">{row[0]}</td>
                      <td className="p-3 border">{row[1]}</td>
                      <td className="p-3 border">{row[2]}</td>
                      <td className="p-3 border">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Tabela de Amplitude</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Qualquer resposta <strong>SIM</strong> classifica automaticamente a iniciativa como <strong>Melhoria com Impacto em Processos (EPP)</strong>.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "Envolve outra área, altera entregas ou SLA entre departamentos?",
                "A melhoria altera processo corporativo mapeado?",
                "A melhoria exige mudança em sistema ou automação relevante?",
                "A melhoria pode gerar impacto financeiro relevante ou mudança operacional significativa?",
              ].map((q) => (
                <li key={q} className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border">
                  <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Papéis e Responsabilidades</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="font-semibold text-blue-900">Gestores de Área</div>
                <div className="text-sm text-blue-800/80 mt-1">Protagonistas. Identificam, conduzem e acompanham melhorias locais com autonomia.</div>
              </div>
              <div className="p-4 border rounded-lg bg-purple-50">
                <div className="font-semibold text-purple-900">Escritório de Processos (EPP)</div>
                <div className="text-sm text-purple-800/80 mt-1">Parceiro técnico. Apoia melhorias que afetam processos corporativos e mantém a matriz atualizada.</div>
              </div>
              <div className="p-4 border rounded-lg bg-emerald-50">
                <div className="font-semibold text-emerald-900">PMO</div>
                <div className="text-sm text-emerald-800/80 mt-1">Facilitador estratégico. Estrutura a metodologia e conecta melhorias à estratégia. Não executa.</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Rituais */}
        <TabsContent value="rituais" className="space-y-6 mt-6">
          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Quinzenal · Operacional</h3>
            <p className="text-xs text-muted-foreground mb-4">PMO + Escritório de Processos + Gestores</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 text-left font-medium">Ação</th>
                  <th className="p-2 text-center font-medium text-blue-700 w-32">Contínua</th>
                  <th className="p-2 text-center font-medium text-purple-700 w-32">EPP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Verificar rota, progresso e prazo", true, true],
                  ["Verificar mudanças de escopo", true, true],
                  ["Identificar e remover impedimentos operacionais", true, true],
                  ["Atualizar impacto das melhorias em indicadores", true, true],
                  ["Identificar novas melhorias de processos", true, true],
                  ["Atualizar backlog de melhorias", true, true],
                  ["Atualizar impacto em Objetivos e KRs", false, true],
                  ["Revisar mudanças e impactos em processos", false, true],
                  ["Discutir dependências interáreas", false, true],
                  ["Revisar e atualizar matriz de stakeholders", false, true],
                  ["Homologar alterações e atualizar matriz de processos", false, true],
                ].map(([acao, c, e]) => (
                  <tr key={String(acao)} className="border-t">
                    <td className="p-2">{acao as string}</td>
                    <td className="p-2 text-center">{c ? "✔" : "—"}</td>
                    <td className="p-2 text-center">{e ? "✔" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Mensal · Estratégico</h3>
            <p className="text-xs text-muted-foreground mb-4">Diretores + PMO + Escritório de Processos</p>
            <ul className="text-sm space-y-1.5">
              <li>✔ Consolidar impacto em objetivos, KRs e indicadores</li>
              <li>✔ Consolidar marcos entregues e pendências</li>
              <li>✔ Consolidar impacto em horas liberadas e financeiro</li>
              <li>✔ Coletar novas melhorias</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
