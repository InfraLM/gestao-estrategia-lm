import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Target, History } from "lucide-react";
import data from "@/data/okrs20262.json";
import bsc from "@/data/bscRev02.json";
import { OKRS } from "@/data/okrs";

const nomeObj = (c: string) => (bsc as { codigo: string; nome: string }[]).find((o) => o.codigo === c)?.nome ?? c;

function ObjBadges({ cods, destaque = [] as string[] }: { cods: string[]; destaque?: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {cods.map((c) => (
        <Tooltip key={c}>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`font-mono text-[10px] cursor-help ${destaque.includes(c) ? "bg-primary/10 text-primary border-primary/40" : ""}`}>{c}</Badge>
          </TooltipTrigger>
          <TooltipContent><span className="text-xs">{nomeObj(c)}</span></TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export default function Okrs() {
  const hist = OKRS.find((s) => s.id === "2026-1");
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">OKRs</h2>
          <p className="text-sm text-muted-foreground">Objetivos priorizados do semestre (OKR 2026/2 consolidado 20.08.26), vinculados aos objetivos estratégicos do BSC (Rev.02).</p>
        </div>

        <Tabs defaultValue="atual">
          <TabsList>
            <TabsTrigger value="atual">2026/2 · vigente</TabsTrigger>
            <TabsTrigger value="historico">Histórico · 2026/1</TabsTrigger>
          </TabsList>

          <TabsContent value="atual" className="grid md:grid-cols-2 gap-4 mt-4">
            {data.okrs.map((o) => (
              <Card key={o.codigo}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{o.titulo}</CardTitle>
                  <div className="text-[11px] text-muted-foreground space-y-1 mt-1">
                    <div className="flex items-center gap-2"><span>Primários:</span><ObjBadges cods={o.primarios} destaque={o.primarios} /></div>
                    {o.secundarios.length > 0 && <div className="flex items-center gap-2"><span>Secundários:</span><ObjBadges cods={o.secundarios} /></div>}
                    {o.leitura && <p className="italic">{o.leitura}</p>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {o.krs.map((k: any) => {
                    const rem = k.status === "REMOVIDO";
                    return (
                    <div key={k.codigo} className={`text-xs p-2 rounded border border-border space-y-1 ${rem ? "opacity-60 border-dashed" : ""}`}>
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] shrink-0">{k.codigo}</Badge>
                        <span className={`flex-1 ${rem ? "line-through" : "font-medium"}`}>{k.titulo}</span>
                        <ObjBadges cods={k.objetivos} />
                        <Badge variant={rem ? "outline" : k.status === "ADICIONADO" ? "default" : "secondary"} className="text-[10px] shrink-0">{k.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-muted-foreground">
                        {k.meta && <span>Meta 2026/2: <strong className="text-foreground">{k.meta}</strong></span>}
                        {k.tipo && <span>Tipo: {k.tipo}</span>}
                        {k.peso != null && <span>Peso no OKR: {Math.round(k.peso * 100)}%</span>}
                        {k.responsavel && <span>Responsável: {k.responsavel}</span>}
                      </div>
                      {k.obs && <p className="text-[11px] text-muted-foreground italic">{k.obs}</p>}
                    </div>
                  );})}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="historico" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> OKRs 2026/1 — mantidos como histórico (somente leitura).</p>
            <div className="grid md:grid-cols-2 gap-4">
              {hist?.okrs.map((o) => (
                <Card key={o.id} className="opacity-90">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{o.tema} <span className="text-muted-foreground font-normal">· {o.responsavel}</span></CardTitle>
                    <p className="text-[11px] text-muted-foreground">{o.objetivo}</p>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    {o.krs.map((k) => <div key={k.id}>▸ {k.titulo}</div>)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
