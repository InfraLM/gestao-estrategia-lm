import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { faltaTexto, PASSO_LBL, type PassoCiclo, type JustificativaFarol } from "@/features/metas/lib/guiaSemanal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const fmtNumero = (v: number | null, unidade: string | null) => v == null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${unidade ? ` ${unidade}` : ""}`;
const fmtMes = (c: string) => `${c.slice(5, 7)}/${c.slice(0, 4)}`;

/** Barra de passos do formulário semanal (um passo por tela). Só apresentação. */
export function PassosCiclo({ passos, atual, faltas, prazo, onIr }: { passos: PassoCiclo[]; atual: PassoCiclo; faltas: Partial<Record<PassoCiclo, number>>; prazo?: string | null; onIr: (p: PassoCiclo) => void }) {
  const idx = passos.indexOf(atual);
  return (
    <nav aria-label="Passos do formulário semanal" className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Passo {idx + 1} de {passos.length} · {PASSO_LBL[atual]}</span>{prazo && <span>Enviar até {prazo}</span>}</div>
      <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${((idx + 1) / passos.length) * 100}%` }} /></div>
      <ol className="flex flex-wrap gap-1">
        {passos.map((p, i) => {
          const falta = faltas[p] ?? 0;
          return (
            <li key={p}>
              <button type="button" onClick={() => onIr(p)} aria-current={p === atual ? "step" : undefined}
                className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-muted/60",
                  p === atual ? "border-primary bg-primary/10 font-medium" : "border-border")}>
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", falta > 0 ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                {PASSO_LBL[p]}{falta > 0 && <span className="text-destructive">· {faltaTexto(falta)}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Passo "Indicadores fora da meta": vermelho pede causa, impacto e ação (obrigatório); amarelo é opcional. */
export function BlocoFarol({ lista, unidades, onChange, podeEditar, carregando, erro }: {
  lista: JustificativaFarol[]; unidades: Record<string, string | null>; onChange: (l: JustificativaFarol[]) => void;
  podeEditar: boolean; carregando: boolean; erro: boolean;
}) {
  const setCampo = (id: string, campo: "causa" | "impacto" | "acao", v: string) => onChange(lista.map((j) => j.indicador_id === id ? { ...j, [campo]: v } : j));
  if (carregando) return <p className="text-sm text-muted-foreground">Conferindo seus indicadores…</p>;
  if (erro) return <p role="alert" className="text-sm text-destructive">Não foi possível conferir os indicadores agora. Recarregue a página.</p>;
  if (!lista.length) return null;
  const vermelhos = lista.filter((j) => j.cor === "vermelho").length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {vermelhos > 0 ? `${vermelhos === 1 ? "1 indicador está vermelho" : `${vermelhos} indicadores estão vermelhos`}: explique a causa, o impacto e o que vai fazer. ` : ""}
        Os amarelos estão perto da meta: comentar é opcional.
      </p>
      {lista.map((j) => {
        const obrig = j.cor === "vermelho";
        return (
          <div key={j.indicador_id} id={`farol-${j.indicador_id}`} tabIndex={-1} className={cn("space-y-3 rounded-lg border p-3", obrig ? "border-destructive/50" : "border-yellow-400/60")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-medium">{j.codigo} · {j.nome}</p>
              <span className={cn("rounded px-2 py-0.5 text-xs", obrig ? "bg-destructive/15 text-destructive" : "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200")}>{obrig ? "Vermelho · obrigatório" : "Amarelo · opcional"}</span>
            </div>
            <p className="text-xs text-muted-foreground">{fmtMes(j.competencia)}: realizado {fmtNumero(j.valor, unidades[j.indicador_id] ?? null)} · meta {fmtNumero(j.meta, unidades[j.indicador_id] ?? null)}</p>
            {(["causa", "impacto", "acao"] as const).map((c) => (
              <div key={c} className="space-y-1">
                <Label htmlFor={`farol-${j.indicador_id}-${c}`}>{c === "causa" ? "Por que ficou fora da meta?" : c === "impacto" ? "Qual o impacto?" : "O que você vai fazer, e até quando?"}{obrig ? " *" : " (opcional)"}</Label>
                <Textarea id={`farol-${j.indicador_id}-${c}`} rows={2} maxLength={4000} disabled={!podeEditar} value={j[c]}
                  placeholder={c === "causa" ? "Ex.: a campanha de captação atrasou duas semanas" : c === "impacto" ? "Ex.: 40 matrículas a menos no mês" : "Ex.: nova campanha no ar até 05/12, com o time de marketing"}
                  onChange={(e) => setCampo(j.indicador_id, c, e.target.value)} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

type Passo = "checkout" | "checkin" | "revisao";

/** Guia de 3 passos no topo do formulário semanal: onde a pessoa está e o que falta em cada parte. Só apresentação. */
export function GuiaCicloSemanal({ atual, faltaCheckout, faltaCheckin, prazo, enviado, onIr }: {
  atual: Passo; faltaCheckout: number; faltaCheckin: number; prazo: string; enviado: boolean; onIr: (p: Passo) => void;
}) {
  const passos: { id: Passo; n: number; titulo: string; sub: string; ok: boolean }[] = [
    { id: "checkout", n: 1, titulo: "Como foi a semana passada", sub: faltaTexto(faltaCheckout), ok: faltaCheckout === 0 },
    { id: "checkin", n: 2, titulo: "Plano desta semana", sub: faltaTexto(faltaCheckin), ok: faltaCheckin === 0 },
    { id: "revisao", n: 3, titulo: enviado ? "Ciclo enviado" : "Revisar e enviar", sub: enviado ? "pode reenviar se mudar algo" : `até ${prazo}`, ok: enviado },
  ];
  return (
    <nav aria-label="Passos do formulário semanal" className="grid gap-2 sm:grid-cols-3">
      {passos.map((p) => (
        <button key={p.id} type="button" onClick={() => onIr(p.id)} aria-current={atual === p.id ? "step" : undefined}
          className={cn("flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
            atual === p.id ? "border-primary bg-primary/5" : "border-border")}>
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            p.ok ? "bg-success text-success-foreground" : atual === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {p.ok ? <Check className="h-4 w-4" /> : p.n}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{p.titulo}</span>
            <span className={cn("block text-xs", p.ok ? "text-success" : "text-muted-foreground")}>{p.sub}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}

/** Texto longo resumido, com "ver detalhes" para abrir o restante. */
export function TextoResumido({ texto, limite = 160, className }: { texto: string; limite?: number; className?: string }) {
  const [aberto, setAberto] = useState(false);
  if (texto.length <= limite) return <span className={className}>{texto}</span>;
  const corte = texto.slice(0, limite);
  const resumo = corte.slice(0, Math.max(corte.lastIndexOf(" "), limite - 20)).trimEnd();
  return (
    <span className={className}>
      {aberto ? texto : `${resumo}…`}{" "}
      <button type="button" className="text-xs font-normal text-primary underline-offset-2 hover:underline" onClick={() => setAberto(!aberto)}>
        {aberto ? "ver menos" : "ver detalhes"}
      </button>
    </span>
  );
}
