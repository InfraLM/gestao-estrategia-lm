import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Scale } from "lucide-react";
import data from "@/data/okrs20262.json";
import bsc from "@/data/bscRev02.json";
import CestaMatrizEditavel from "@/components/CestaMatrizEditavel";
import BaseSubmissaoIA from "@/components/BaseSubmissaoIA";
import { useBaseOverrides } from "@/hooks/useBaseOverrides";
import { useConteudo } from "@/hooks/useConteudo";
import { EditarConteudo } from "@/components/EditarConteudo";

const CESTA_DEF = { regra: data.regra, pesosCorporativos: data.pesosCorporativos, diretores: data.diretores, notas: data.notas };

const nomeObj = (c: string) => (bsc as { codigo: string; nome: string }[]).find((o) => o.codigo === c)?.nome ?? c;
const pct = (v: any) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "—");

export default function CestaMetas() {
  const { aplicar: aplicarOkrs } = useBaseOverrides("okrs");
  const { aplicar: aplicarCesta } = useBaseOverrides("cesta");
  const { data: cesta } = useConteudo<any>("cesta.2026-2", CESTA_DEF);
  const diretores = (cesta.diretores as typeof data.diretores).map((d) => ({ ...d, metas: d.metas.map((m) => { const ref = `${d.nome}::${m.indicador}`; return aplicarCesta("meta_diretor", ref, aplicarOkrs("meta_diretor", ref, m)); }) }));
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Cesta de Metas por Diretoria</h2>
            <p className="text-sm text-muted-foreground">Metas semestrais por diretor, vinculadas aos OKRs e aos objetivos estratégicos do BSC.</p>
          </div>
          <div className="flex items-center gap-2"><EditarConteudo chave="cesta.2026-2" padrao={CESTA_DEF} titulo="Cesta de Metas 2026/2" /><Badge className="bg-primary text-primary-foreground">2026/2 · 1º ciclo</Badge></div>
        </div>

        <BaseSubmissaoIA modulo="cesta" titulo="Atualizar Cesta de Metas com IA" contexto={() => ({ okrs: data.okrs, diretores })} />

        <Tabs defaultValue="2026-2">
          <TabsList>
            <TabsTrigger value="2026-2">2026/2</TabsTrigger>
          </TabsList>
          <TabsContent value="2026-2" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Regra da cesta</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  {(cesta.regra as typeof data.regra).map((r) => (
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
                    {(cesta.pesosCorporativos as typeof data.pesosCorporativos).map((p) => (
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
                {(cesta.notas as typeof data.notas).map((n) => <p key={n} className="text-[11px] text-muted-foreground italic">{n}</p>)}
              </CardContent>
            </Card>

            <CestaMatrizEditavel extras={(dir, ind) => diretores.find((d) => d.nome === dir)?.metas.find((m: any) => m.indicador === ind) as any} />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
