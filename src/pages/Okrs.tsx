import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Target, History } from "lucide-react";
import data from "@/data/okrs20262.json";
import bsc from "@/data/bscRev02.json";
import { OKRS } from "@/data/okrs";
import BaseSubmissaoIA from "@/components/BaseSubmissaoIA";
import { useBaseOverrides } from "@/hooks/useBaseOverrides";
import { useConteudo } from "@/hooks/useConteudo";
import { EditarConteudo } from "@/components/EditarConteudo";

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
  const { aplicar } = useBaseOverrides("okrs");
  const [sem, setSem] = useState("todos");
  const { data: okrsBase } = useConteudo<any[]>("okrs.2026-2", data.okrs as any[]);
  const okrs = okrsBase.map((o) => ({ ...o, krs: o.krs.map((k: any) => aplicar("kr", k.codigo, k)) }));
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">OKRs</h2>
          <p className="text-sm text-muted-foreground">Objetivos priorizados do semestre (OKR 2026/2 consolidado 20.08.26), vinculados aos objetivos estratégicos do BSC (Rev.02).</p>
        </div>

        <div className="flex justify-end"><EditarConteudo chave="okrs.2026-2" padrao={data.okrs as any[]} titulo="OKRs 2026/2 · KRs e vínculo com objetivos do BSC (primários/secundários: códigos F.01, C.01...)" /></div>

        <BaseSubmissaoIA modulo="okrs" titulo="Atualizar OKRs e Cesta de Metas com IA" contexto={() => ({ okrs, diretores: data.diretores })} />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Semestre:</span>
          {[["todos", "Todos (lista consolidada)"], ["2026-2", "2026/2 · vigente"], ["2026-1", "2026/1 · histórico"]].map(([v, l]) => (
            <Button key={v} size="sm" variant={sem === v ? "default" : "outline"} onClick={() => setSem(v)}>{l}</Button>
          ))}
          <Badge variant="outline" className="ml-auto">{(sem !== "2026-1" ? okrs.length : 0) + (sem !== "2026-2" ? (hist?.okrs.length ?? 0) : 0)} OKRs</Badge>
        </div>

        <div className="space-y-4">
          {sem !== "2026-1" && (<>
            {okrs.map((o) => (
              <Card key={o.codigo}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{o.titulo}<Badge variant="outline" className="ml-auto text-[10px]">2026/2 · vigente</Badge></CardTitle>
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
                        {k.__atualizado && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">atualizado</Badge>}
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
          </>)}
          {sem !== "2026-2" && (<>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> OKRs 2026/1 — mantidos como histórico (somente leitura).</p>
              {hist?.okrs.map((o) => (
                <Card key={o.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{o.tema}<Badge variant="outline" className="ml-auto text-[10px]">2026/1 · histórico</Badge></CardTitle>
                    <div className="text-[11px] text-muted-foreground space-y-1 mt-1">
                      <div>Responsável: {o.responsavel}</div>
                      <p className="italic">{o.objetivo}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {o.krs.map((k) => {
                      const m = k.titulo.match(/^(KR[\d.]+)\s*·\s*(.*)$/);
                      return (
                        <div key={k.id} className="text-xs p-2 rounded border border-border">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="font-mono text-[10px] shrink-0">{m ? m[1] : k.id}</Badge>
                            <span className="flex-1 font-medium">{m ? m[2] : k.titulo}</span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
          </>)}
        </div>
      </div>
    </TooltipProvider>
  );
}
