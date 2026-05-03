import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Plus, X, Search, Briefcase, GitBranch, Repeat, Lock } from "lucide-react";
import { projetos } from "@/data/mockData";
import { cn } from "@/lib/utils";
import type { Predecessora, EntregaItem, PacoteEAP } from "@/hooks/useProjectEditableData";

interface CatalogoItem {
  refId: string;
  origem: Predecessora["origem"];
  label: string;
  contexto: string;
  concluido: boolean;
}

function buildCatalogo(currentProjectId: string, eap: PacoteEAP[]): {
  internas: CatalogoItem[];
  projetos: CatalogoItem[];
  estrategicas: CatalogoItem[];
  continuas: CatalogoItem[];
} {
  const internas: CatalogoItem[] = eap.flatMap(p =>
    p.entregas.map(e => ({
      refId: `${p.id}/${e.id}`,
      origem: "interna" as const,
      label: `${e.id} · ${e.titulo}`,
      contexto: p.titulo,
      concluido: e.status === "Concluído",
    }))
  );

  const projetosOutros: CatalogoItem[] = projetos
    .filter(p => p.id !== currentProjectId && p.classificacao === "Institucional")
    .map(p => ({
      refId: p.id,
      origem: "projeto" as const,
      label: `${p.id} · ${p.nome}`,
      contexto: p.diretor,
      concluido: p.status === "Concluído",
    }));

  const estrategicas: CatalogoItem[] = projetos
    .filter(p => p.classificacao === "Melhoria Contínua com EPP")
    .map(p => ({
      refId: `ME-${p.id}`,
      origem: "melhoria-estrategica" as const,
      label: `ME-${p.id} · ${p.nome}`,
      contexto: p.diretor,
      concluido: p.status === "Concluído",
    }));

  const continuas: CatalogoItem[] = projetos
    .filter(p => p.classificacao === "Melhoria Contínua")
    .map(p => ({
      refId: `MC-${p.id}`,
      origem: "melhoria-continua" as const,
      label: `MC-${p.id} · ${p.nome}`,
      contexto: p.diretor,
      concluido: p.status === "Concluído",
    }));

  return { internas, projetos: projetosOutros, estrategicas, continuas };
}

const ORIGEM_META: Record<Predecessora["origem"], { Icon: typeof Briefcase; color: string; label: string }> = {
  "interna": { Icon: Link2, color: "bg-slate-100 text-slate-800 border-slate-300", label: "Interna" },
  "projeto": { Icon: Briefcase, color: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "Projeto" },
  "melhoria-estrategica": { Icon: GitBranch, color: "bg-purple-50 text-purple-800 border-purple-200", label: "Melhoria Estr." },
  "melhoria-continua": { Icon: Repeat, color: "bg-blue-50 text-blue-800 border-blue-200", label: "Melh. Contínua" },
};

export function PredecessorBadge({ p }: { p: Predecessora }) {
  const meta = ORIGEM_META[p.origem];
  return (
    <Badge variant="outline" className={cn("text-[10px] gap-1 font-normal max-w-[180px]", meta.color)}>
      <meta.Icon className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate">{p.label}</span>
      {!p.concluido && <Lock className="h-2.5 w-2.5 shrink-0 text-destructive" />}
    </Badge>
  );
}

interface Props {
  entregaTitulo: string;
  entregaIdLocal: string;
  predecessoras: Predecessora[];
  currentProjectId: string;
  eap: PacoteEAP[];
  onChange: (predecessoras: Predecessora[]) => void;
}

export function PredecessoraDialog({
  entregaTitulo, entregaIdLocal, predecessoras, currentProjectId, eap, onChange
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const cat = useMemo(() => buildCatalogo(currentProjectId, eap), [currentProjectId, eap]);

  const togglePred = (item: CatalogoItem) => {
    const exists = predecessoras.find(p => p.refId === item.refId && p.origem === item.origem);
    if (exists) {
      onChange(predecessoras.filter(p => !(p.refId === item.refId && p.origem === item.origem)));
    } else {
      // Não permitir auto-referência interna
      if (item.origem === "interna" && item.refId.endsWith(`/${entregaIdLocal}`)) return;
      onChange([...predecessoras, { refId: item.refId, origem: item.origem, label: item.label, concluido: item.concluido }]);
    }
  };

  const isSelected = (item: CatalogoItem) =>
    !!predecessoras.find(p => p.refId === item.refId && p.origem === item.origem);

  const filtra = (arr: CatalogoItem[]) =>
    !q ? arr : arr.filter(i => `${i.label} ${i.contexto}`.toLowerCase().includes(q.toLowerCase()));

  const Lista = ({ arr }: { arr: CatalogoItem[] }) => (
    <div className="max-h-[320px] overflow-auto space-y-1 mt-3">
      {filtra(arr).map(item => {
        const selected = isSelected(item);
        const meta = ORIGEM_META[item.origem];
        return (
          <button
            key={`${item.origem}-${item.refId}`}
            onClick={() => togglePred(item)}
            className={cn(
              "w-full text-left p-2 rounded-md border text-sm flex items-start gap-2 transition-colors",
              selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            )}
          >
            <meta.Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.label}</div>
              <div className="text-xs text-muted-foreground truncate">{item.contexto}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.concluido
                ? <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-200">Concluída</Badge>
                : <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-200">Pendente</Badge>}
              {selected && <X className="h-3.5 w-3.5 text-primary" />}
            </div>
          </button>
        );
      })}
      {filtra(arr).length === 0 && (
        <div className="text-center text-xs text-muted-foreground py-6">Nenhum item encontrado.</div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs">
          <Link2 className="h-3 w-3" />
          {predecessoras.length > 0 ? `${predecessoras.length}` : <Plus className="h-3 w-3" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Predecessoras · {entregaTitulo}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Vincule entregas, projetos ou melhorias que precisam estar concluídos antes desta atividade. A entrega ficará <strong>bloqueada</strong> automaticamente até que todas as predecessoras estejam concluídas — base do caminho crítico do cronograma.
        </p>

        {predecessoras.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-md bg-muted/40 border">
            {predecessoras.map(p => (
              <PredecessorBadge key={`${p.origem}-${p.refId}`} p={p} />
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar atividade…" className="pl-9" />
        </div>

        <Tabs defaultValue="interna">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="interna" className="text-xs">Internas ({cat.internas.length})</TabsTrigger>
            <TabsTrigger value="projeto" className="text-xs">Projetos ({cat.projetos.length})</TabsTrigger>
            <TabsTrigger value="estr" className="text-xs">Melh. Estr. ({cat.estrategicas.length})</TabsTrigger>
            <TabsTrigger value="cont" className="text-xs">Melh. Contínua ({cat.continuas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="interna"><Lista arr={cat.internas} /></TabsContent>
          <TabsContent value="projeto"><Lista arr={cat.projetos} /></TabsContent>
          <TabsContent value="estr"><Lista arr={cat.estrategicas} /></TabsContent>
          <TabsContent value="cont"><Lista arr={cat.continuas} /></TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Calcula se uma entrega está bloqueada com base nas predecessoras (internas verificadas em runtime) */
export function isEntregaBloqueada(entrega: EntregaItem, eap: PacoteEAP[]): boolean {
  if (!entrega.predecessoras?.length) return false;
  return entrega.predecessoras.some(p => {
    if (p.origem === "interna") {
      const [pacoteId, entregaId] = p.refId.split("/");
      const pred = eap.find(pa => pa.id === pacoteId)?.entregas.find(en => en.id === entregaId);
      return !pred || pred.status !== "Concluído";
    }
    return !p.concluido;
  });
}
