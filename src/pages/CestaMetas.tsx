import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Scale } from "lucide-react";
import data from "@/data/okrs20262.json";
import bsc from "@/data/bscRev02.json";

const nomeObj = (c: string) => (bsc as { codigo: string; nome: string }[]).find((o) => o.codigo === c)?.nome ?? c;
const pct = (v: any) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "—");

export default function CestaMetas() {
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Cesta de Metas por Diretoria</h2>
            <p className="text-sm text-muted-foreground">Metas semestrais por diretor, vinculadas aos OKRs e aos objetivos estratégicos do BSC.</p>
          </div>
          <Badge className="bg-primary text-primary-foreground">2026/2 · 1º ciclo</Badge>
        </div>

        <Tabs defaultValue="2026-2">
          <TabsList>
            <TabsTrigger value="2026-2">2026/2</TabsTrigger>
          </TabsList>
          <TabsContent value="2026-2" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Regra da cesta</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  {data.regra.map((r) => (
                    <div key={r.componente} className="p-3 rounded border border-border text-xs">
                      <div className="flex items-center justify-between mb-1"><span className="font-semibold">{r.componente}</span><Badge variant="outline">{r.peso}</Badge></div>
                      <p className="text-muted-foreground">{r.composicao}</p>
                    </div>
                  ))}
                </div>
                <div className="text-xs font-semibold">Peso de cada OKR no componente corporativo</div>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Diretor</TableHead><TableHead>Cadeira</TableHead><TableHead>OKR1</TableHead><TableHead>OKR2</TableHead><TableHead>OKR3</TableHead><TableHead>NSM</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pesosCorporativos.map((p) => (
                      <TableRow key={p.diretor}>
                        <TableCell className="font-medium">{p.diretor}</TableCell>
                        <TableCell className="text-muted-foreground">{p.cadeira}</TableCell>
                        {[p.OKR1, p.OKR2, p.OKR3, p.NSM].map((v, i) => (
                          <TableCell key={i} className={v >= 0.4 ? "font-semibold text-primary" : ""}>{pct(v)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {data.notas.map((n) => <p key={n} className="text-[11px] text-muted-foreground italic">{n}</p>)}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {data.diretores.map((d) => (
                <Card key={d.titulo}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{d.nome} <span className="text-muted-foreground font-normal">· {d.cargo}</span></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {d.metas.map((m) => (
                      <div key={m.indicador} className="text-xs p-2 rounded border border-border space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="flex-1 font-medium">{m.indicador}</span>
                          {m.peso != null && <Badge variant="outline" className="text-[10px]">peso {pct(m.peso)}</Badge>}
                          <Badge variant="secondary" className="text-[10px]">{m.tipo}</Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span><span className="text-muted-foreground">Meta 2026/2:</span> <strong>{m.meta}</strong></span>
                          <div className="flex flex-wrap gap-1">
                            {m.objetivos.map((c) => (
                              <Tooltip key={c}>
                                <TooltipTrigger asChild><Badge variant="outline" className="font-mono text-[10px] cursor-help">{c}</Badge></TooltipTrigger>
                                <TooltipContent><span className="text-xs">{nomeObj(c)}</span></TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                        {m.obs && <p className="text-[11px] text-muted-foreground italic">{m.obs}</p>}
                      </div>
                    ))}
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
