import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { itemArvore } from "@/lib/bscRev03";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Heart, Cog, GraduationCap, History, ChevronDown, ChevronRight } from "lucide-react";
import rev02 from "@/data/bscRev02.json";
import BaseSubmissaoIA from "@/components/BaseSubmissaoIA";
import { useBaseOverrides } from "@/hooks/useBaseOverrides";
import { useConteudo } from "@/hooks/useConteudo";
import { EditarConteudo } from "@/components/EditarConteudo";

type Kpi = { kpi: string; nivel: string; diretor: string; coDiretor: string; formula: string; situacaoAtual: string; meta2026: string; farol: string; responsavelImplantacao: string; statusImplantacao: string };
type Obj = { codigo: string; nome: string; kpis: Kpi[] };

const PERSP = [
  { prefixo: "F.", nome: "Financeira", icon: DollarSign, cor: "from-success/20 to-success/5 border-success/30" },
  { prefixo: "C.", nome: "Cliente & Mercado", icon: Heart, cor: "from-primary/20 to-primary/5 border-primary/30" },
  { prefixo: "P.", nome: "Processos", icon: Cog, cor: "from-info/20 to-info/5 border-info/30" },
  { prefixo: "AC.", nome: "Aprendizagem & Crescimento", icon: GraduationCap, cor: "from-warning/20 to-warning/5 border-warning/30" },
];

const farolCls = (f: string) => {
  const v = f.toLowerCase();
  if (v.includes("off")) return "bg-destructive/10 text-destructive border-destructive/30";
  if (v.includes("risk") || v.includes("risco") || v.includes("aten")) return "bg-warning/10 text-warning border-warning/30";
  if (v.includes("on")) return "bg-success/10 text-success border-success/30";
  return "";
};

function KpiLinha({ k }: { k: Kpi }) {
  const [open, setOpen] = useState(false);
  const estr = k.nivel === "Estratégico";
  return (
    <div className={`rounded border ${estr ? "border-primary/40 bg-primary/5" : "border-border ml-4"} text-xs`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-start gap-2 p-2 text-left">
        {open ? <ChevronDown className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
        <span className={`flex-1 ${estr ? "font-semibold" : ""}`}>{k.kpi}</span>
        {(k as any).d091 && <Badge variant="outline" className="text-[10px] shrink-0 border-warning/40 text-warning">Sem status (D-091)</Badge>}
        {(k as any).__atualizado && <Badge variant="outline" className="text-[10px] shrink-0 bg-primary/10 text-primary border-primary/30">atualizado</Badge>}
        <Badge variant="outline" className="text-[10px] shrink-0">{k.nivel}</Badge>
        {k.farol && <Badge variant="outline" className={`text-[10px] shrink-0 ${farolCls(k.farol)}`}>{k.farol}</Badge>}
      </button>
      {open && (
        <div className="px-7 pb-2 space-y-1 text-muted-foreground">
          {k.formula && <div className="whitespace-pre-line"><strong className="text-foreground">Fórmula:</strong> {k.formula}</div>}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {k.situacaoAtual && <span><strong className="text-foreground">Atual:</strong> {k.situacaoAtual}</span>}
            {k.meta2026 && <span><strong className="text-foreground">Meta 2026:</strong> {k.meta2026}</span>}
            {k.diretor && <span><strong className="text-foreground">Diretor:</strong> {k.diretor}{k.coDiretor ? ` · co: ${k.coDiretor}` : ""}</span>}
            {k.responsavelImplantacao && <span><strong className="text-foreground">Implantação:</strong> {k.responsavelImplantacao}{k.statusImplantacao ? ` (${k.statusImplantacao})` : ""}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export type BscRev01 = { perspectiva: string; icon: any; cor: string; objetivos: { codigo: string; nome: string; meta: string; kpis: string[] }[] }[];

export default function BscArvoreKpis({ rev01 }: { rev01: BscRev01 }) {
  const [hist, setHist] = useState(false);
  const { aplicar } = useBaseOverrides("estrategia");
  const base = useConteudo("bsc.rev02", rev02 as Obj[]).data;
  const [db, setDb] = useState<{ objetivos: any[]; kpis: any[]; maes: any[] } | null>(null);
  useEffect(() => {
    let ativo = true;
    const c = supabase as any;
    Promise.all([
      c.from("mt_objetivos").select("id,codigo,descricao").order("codigo"),
      c.from("mt_indicadores").select("id,codigo,nome,nome_anterior,nivel,objetivo_id,sem_status_d091").eq("origem", "bsc").eq("status", "ativo").order("codigo"),
      c.from("bsc_metricas_mae").select("*").order("ordem"),
    ]).then(([o, i, m]: any[]) => { if (ativo && !o.error && !i.error) setDb({ objetivos: o.data ?? [], kpis: i.data ?? [], maes: m.data ?? [] }); });
    return () => { ativo = false; };
  }, []);
  const fonte: Obj[] = db
    ? db.objetivos.map((o) => ({
        codigo: o.codigo, nome: o.descricao,
        kpis: db.kpis.filter((i) => i.objetivo_id === o.id && (i.nivel === "Estratégico" || i.nivel === "Tático"))
          .map((i) => ({ ...(itemArvore(base as Obj[], i) ?? {}), kpi: i.nome, nivel: i.nivel, d091: i.sem_status_d091 } as any)),
      }))
    : (base as Obj[]);
  const objs = fonte.map((o) => ({ ...aplicar("objetivo", o.codigo, o), kpis: o.kpis.map((k) => aplicar("kpi", k.kpi, k)) }));
  const maes = db?.maes ?? [];
  return (
    <div className="space-y-6">
      <BaseSubmissaoIA modulo="estrategia" titulo="Atualizar BSC / Árvore de KPIs com IA" contexto={() => objs} />
      {maes.length ? (
        <section aria-label="Métricas-mãe" className="rounded-lg bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">Métricas-mãe (acima do BSC)</h3>
            <span className="text-xs text-muted-foreground">{objs.length} objetivos estratégicos</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {maes.map((m) => (
              <div key={m.id} className="rounded-md border border-border p-3 text-sm space-y-1">
                <span className="text-xs font-bold tracking-widest text-primary">{m.tipo === "NSM" ? "NORTH STAR" : m.tipo === "CRITICO" ? "NÚMERO CRÍTICO 2027" : "BHAG"}</span>
                <p className="font-semibold">{m.nome}</p>
                {m.meta_texto && <p className="text-xs"><strong>Meta:</strong> {m.meta_texto}</p>}
                {m.definicao && <p className="text-xs text-muted-foreground">{m.definicao}</p>}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-lg bg-card border border-border p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest text-primary">BHAG</span>
            <span className="font-semibold">1 milhão de vidas salvas até 2034</span>
          </div>
          <span className="text-xs text-muted-foreground">{objs.length} objetivos estratégicos</span>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        <Badge className="bg-primary text-primary-foreground">{db ? "Rev.03 · vigente" : "Rev.02"}</Badge>
        <EditarConteudo chave="bsc.rev02" padrao={rev02 as Obj[]} titulo="Detalhes dos KPIs (fórmula, situação e metas da Rev.02)" />
        <span>BSC Rev.03 (proposta 22/10/2026) — apenas KPIs Estratégicos e Táticos; detalhes herdados da árvore Rev.02 quando o KPI foi mantido.</span>
      </div>
      <p className="text-xs text-muted-foreground italic">Leitura de baixo para cima: pessoas, cultura e tecnologia habilitam os processos; processos entregam valor ao cliente; o cliente sustenta o resultado financeiro.</p>

      {PERSP.map((p) => {
        const grupo = objs.filter((o) => o.codigo.startsWith(p.prefixo));
        if (!grupo.length) return null;
        return (
          <Card key={p.nome} className={`bg-gradient-to-br ${p.cor} border`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <p.icon className="h-5 w-5" />
                <CardTitle className="text-lg">Perspectiva {p.nome}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {grupo.map((o) => (
                <div key={o.codigo} className="p-4 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="font-mono text-xs">{o.codigo}</Badge>
                    <h4 className="font-semibold text-sm">{o.nome}</h4>
                  </div>
                  <div className="space-y-1.5">
                    {o.kpis.map((k) => <KpiLinha key={k.kpi} k={k} />)}
                    {!o.kpis.length && <p className="text-xs text-muted-foreground">Nenhum KPI ativo.</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Histórico de revisões</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setHist(!hist)}>{hist ? "Ocultar Rev.01" : "Ver Rev.01"}</Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
            <div><strong className="text-foreground">Rev.03</strong> — BSC de 22/10/2026: dez objetivos (novo C.02), métricas-mãe acima do BSC e KPIs novos sem status até entrar no dicionário (D-091). Valores e vínculos dos KPIs mantidos foram preservados.</div>
            <div><strong className="text-foreground">Rev.02</strong> — Árvore de KPIs LM (17.09.26): objetivos reestruturados (F/C/P/AC) com KPIs estratégicos e táticos, diretores, fórmulas e metas.</div>
            <div><strong className="text-foreground">Rev.01</strong> — BSC original do planejamento estratégico (substituída).</div>
          </div>
        </CardHeader>
        {hist && (
          <CardContent className="space-y-4 opacity-80">
            {rev01.map((p) => (
              <div key={p.perspectiva}>
                <div className="text-xs font-semibold mb-2">Perspectiva {p.perspectiva}</div>
                <div className="grid md:grid-cols-2 gap-3">
                  {p.objetivos.map((o) => (
                    <div key={o.codigo} className="p-3 rounded border border-dashed border-border text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-[10px]">{o.codigo}</Badge>
                        <span className="font-medium">{o.nome}</span>
                      </div>
                      <div className="italic text-muted-foreground mb-1">Meta: {o.meta}</div>
                      {o.kpis.map((k) => <div key={k}>▸ {k}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
