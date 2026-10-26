import { ReactNode } from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Opcao, Pergunta } from "@/lib/sociosTradeoff";

export function Help({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground"><Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><div>{children}</div></div>;
}

export function Opcoes({ opcoes, value, onChange, disabled, name }: { opcoes: Opcao[]; value?: string; onChange: (v: string) => void; disabled?: boolean; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2">
      {opcoes.map(o => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} disabled={disabled} onClick={() => onChange(o.v)}
          className={cn("flex items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors disabled:opacity-60",
            value === o.v ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50")}>
          <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold", value === o.v ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>{o.v.length <= 2 ? o.v : ""}</span>
          <span>{o.labelCurto && <span className="mb-1 block font-semibold">{o.labelCurto}</span>}{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function BlocoPergunta({ p, value, onChange, disabled, pendente, children, nota }: { p: Pergunta; value?: string; onChange: (v: string) => void; disabled?: boolean; pendente?: boolean; children?: ReactNode; nota?: ReactNode }) {
  return (
    <Card id={`q-${p.code}`} className={cn(pendente && "border-destructive")}>
      <CardHeader className="pb-3"><CardTitle className="text-base">{p.num}. {p.titulo}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {p.citacao && <blockquote className="border-l-4 border-primary pl-3 italic">"{p.citacao}"</blockquote>}
        {p.enunciado && <p className="text-sm font-medium">{p.enunciado}</p>}
        {p.help && <Help>{p.help}</Help>}
        {p.helps?.map((h, i) => <Help key={i}>{h}</Help>)}
        {nota}
        <Opcoes name={p.titulo} opcoes={p.opcoes} value={value} onChange={onChange} disabled={disabled} />
        {children}
        {pendente && <p className="text-sm text-destructive">Resposta obrigatória.</p>}
      </CardContent>
    </Card>
  );
}

export function Campo({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><Label className="text-sm">{label}</Label>{children}</div>;
}

export function SelectSimples({ opcoes, value, onChange, disabled, placeholder = "Selecione" }: { opcoes: Opcao[]; value?: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{opcoes.map(o => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

/** Régua 0–100 com um ou mais marcadores. */
export function Regua({ esquerda, direita, marcadores }: { esquerda: string; direita: string; marcadores: { nome: string; valor: number | null }[] }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium"><span>{esquerda}</span><span>{direita}</span></div>
      <div className="relative h-8 rounded-full bg-gradient-to-r from-muted to-primary/30">
        {marcadores.filter(m => m.valor !== null).map(m => (
          <div key={m.nome} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.valor}%` }} title={`${m.nome}: ${m.valor}`}>
            <div className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow">{marcadores.length > 1 ? m.nome.slice(0, 1) : m.valor}</div>
          </div>
        ))}
      </div>
      {marcadores.some(m => m.valor === null) && <p className="text-xs text-muted-foreground">Responda mais perguntas para posicionar {marcadores.filter(m => m.valor === null).map(m => m.nome).join(", ")}.</p>}
    </div>
  );
}
