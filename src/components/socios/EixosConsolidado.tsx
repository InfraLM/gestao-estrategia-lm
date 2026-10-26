import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calcularEixos, posicionamento, type Eixos, type Respostas } from "@/lib/sociosTradeoff";
import { consensoEixo, identidadesSocios, respostasDoEixo } from "@/lib/sociosEixos";

const eixos: { key: keyof Eixos; esquerda: string; direita: string }[] = [
  { key: "core", esquerda: "Foco no core", direita: "Abrir Motor 2" },
  { key: "caixa", esquerda: "Preservar caixa", direita: "Acelerar" },
  { key: "retorno", esquerda: "Reinvestir", direita: "Retorno aos sócios" },
];
const cores = ["socios-cor-0", "socios-cor-1", "socios-cor-2", "socios-cor-3", "socios-cor-4", "socios-cor-5", "socios-cor-6", "socios-cor-7"];

export default function EixosConsolidado({ respondentes }: { respondentes: { id: string; nome: string; respostas: Respostas }[] }) {
  const pessoas = identidadesSocios(respondentes).map(p => {
    const respostas = respondentes.find(r => r.id === p.id)?.respostas ?? {};
    const valores = calcularEixos(respostas);
    return { ...p, respostas, valores, pos: posicionamento(respostas, valores)?.titulo };
  });
  return <section aria-label="Eixos · os sócios na mesma régua" className="space-y-4">
    <h2 className="text-base font-semibold">Eixos · os sócios na mesma régua</h2>
    <div aria-label="Legenda dos respondentes" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {pessoas.map(p => <span key={p.id} className="flex items-center gap-2"><span className={`socios-identidade ${cores[p.cor]} grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold`}>{p.sigla}</span>{p.nome}</span>)}
    </div>
    <TooltipProvider delayDuration={100}>
      {eixos.map(eixo => {
        const consenso = consensoEixo(pessoas.map(p => p.valores[eixo.key]));
        return <Card key={eixo.key} aria-label={`${eixo.esquerda} ↔ ${eixo.direita}`}>
          <CardHeader className="pb-3"><CardTitle className="text-base">{eixo.esquerda} ↔ {eixo.direita}</CardTitle></CardHeader>
          <CardContent>
            <div className="socios-raias">
              <div className="socios-extremos text-xs font-medium"><span>{eixo.esquerda} ←</span><span className="text-right">→ {eixo.direita}</span></div>
              <div className="socios-meio" aria-hidden="true" />
              {pessoas.map(p => {
                const valor = p.valores[eixo.key];
                return <div key={p.id} className="socios-raia">
                  <div className={valor === null ? "text-muted-foreground" : ""}>
                    <span className="text-sm font-medium">{p.nome}</span>
                    {p.pos && <span className="ml-1 text-xs text-muted-foreground">({p.pos})</span>}
                  </div>
                  <div className="socios-regua relative h-12 min-w-0 px-4">
                    <div className="absolute inset-x-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
                    <div className="relative h-full">
                      {valor === null ? <span className="absolute inset-0 flex items-center justify-center bg-card text-xs text-muted-foreground">sem dados suficientes</span> :
                        <Tooltip>
                          <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={`${p.nome}: ${valor} em ${eixo.esquerda} ↔ ${eixo.direita}`} className={`socios-identidade ${cores[p.cor]} absolute top-1/2 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full text-[10px] font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`} style={{ left: `${valor}%` }}>{p.sigla}</Button></TooltipTrigger>
                          <TooltipContent className="max-w-[min(20rem,calc(100vw-2rem))] space-y-1"><p className="font-semibold">{p.nome} · {valor}</p><ul className="text-xs">{respostasDoEixo(p.respostas, eixo.key).map(r => <li key={r}>{r}</li>)}</ul></TooltipContent>
                        </Tooltip>}
                    </div>
                  </div>
                  <span className="socios-valor text-right text-sm font-semibold tabular-nums">{valor ?? "—"}</span>
                </div>;
              })}
              <div className="socios-escala flex justify-between px-4 text-[10px] text-muted-foreground"><span>0</span><span>50</span><span>100</span></div>
            </div>
            <div className="mt-4 border-t pt-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">Faixa de consenso</div>
              <div className="relative mx-4 h-2 rounded-full bg-muted" aria-hidden="true">{consenso && <span className="absolute h-2 min-w-0.5 rounded-full bg-primary" style={{ left: `${consenso.min}%`, width: `${consenso.amplitude}%` }} />}</div>
              <p className="mt-2 text-sm">{!consenso ? "Sem dados suficientes para comparar" : consenso.participantes < 2 ? "Apenas um respondente com dados · comparação indisponível" : `Amplitude ${consenso.amplitude} pts: divergência ${consenso.divergencia}`}</p>
            </div>
          </CardContent>
        </Card>;
      })}
    </TooltipProvider>
  </section>;
}