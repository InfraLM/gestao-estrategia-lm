import { useEffect, useMemo, useState } from "react";
import AtividadesRotina from "@/components/AtividadesRotina";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase, fmtNum } from "@/hooks/useMetasBase";
import { cicloPadrao, ciclosDisponiveis, semanaCheckout, prazoCiclo } from "@/lib/rotinaSemanal";
import { useConformidade, pctC } from "@/components/Conformidade";
import { useTransparencia } from "@/hooks/useTransparencia";
import { ExtrasLeitura } from "@/components/EntregasExtras";
import { contar, origemDash, situacaoDash, avaliarApontamento, KpiDash, OrigemDash, ORIGEM_DASH_LBL, Situacao, SITUACAO_DASH_LBL } from "@/lib/dashboardRotina";

const db = supabase as any;
const fmt = (s: string) => new Date(s + "T12:00").toLocaleDateString("pt-BR");
const SITS: Situacao[] = ["on", "off", "acomp", "pendente", "fora"];
const COR: Record<Situacao, string> = { on: "bg-primary/70", off: "bg-destructive", acomp: "bg-accent-foreground/40", pendente: "bg-muted-foreground/30", fora: "bg-secondary-foreground/20" };
type Reg = { cadeira_id: string; semana: string; status: string; enviado_em: string | null; primeiro_envio_em: string | null; kpis: KpiDash[] };

function Barra({ c }: { c: ReturnType<typeof contar> }) {
  if (!c.total) return <div className="h-2 rounded bg-muted" />;
  return <div className="flex h-2 overflow-hidden rounded" aria-hidden>{SITS.map((s) => c[s] ? <div key={s} className={COR[s]} style={{ width: `${(c[s] / c.total) * 100}%` }} /> : null)}</div>;
}

export default function SemanalDashboard() {
  const b = useMetasBase();
  const conf = useConformidade();
  const t = useTransparencia();
  const ciclos = useMemo(() => ciclosDisponiveis(), []);
  const [ate, setAte] = useState(cicloPadrao());
  const [n, setN] = useState("1");
  const [cad, setCad] = useState("todas");
  const [origem, setOrigem] = useState<"todas" | OrigemDash>("todas");
  const [regs, setRegs] = useState<Reg[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [lista, setLista] = useState<{ titulo: string; itens: (KpiDash & { cadeira: string; semana: string })[] } | null>(null);
  const semanasOut = useMemo(() => { const out: string[] = []; const idx = [...new Set([ate, ...ciclos])].sort(); const i = idx.indexOf(ate); for (let j = Math.max(0, i - Number(n) + 1); j <= i; j++) out.push(semanaCheckout(idx[j])); return out; }, [ate, n, ciclos]);
  useEffect(() => {
    db.rpc("rotina_dashboard_kpis", { _semanas: semanasOut }).then(({ data }: any) => setRegs((data ?? []).map((r: any) => ({ ...r, semana: String(r.semana).slice(0, 10), kpis: r.kpis ?? [] }))));
    db.from("mt_checkins").select("cadeira_id,semana,tipo,status,conteudo").in("semana", [ate, semanaCheckout(ate)]).then(({ data }: any) => setForms(data ?? []));
  }, [semanasOut.join(), ate]);

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const cadeiras = b.cadeiras.filter((c) => c.ativo && (cad === "todas" || c.id === cad));
  const nomeCad = (id: string) => b.cadeiras.find((c) => c.id === id)?.nome ?? "—";
  const filtraK = (k: KpiDash) => origem === "todas" || origemDash(k) === origem;
  const kpisDe = (cid: string) => regs.filter((r) => r.cadeira_id === cid && r.status === "enviado").flatMap((r) => r.kpis.filter(filtraK).map((k) => ({ ...k, cadeira: nomeCad(cid), semana: r.semana })));
  const todos = cadeiras.flatMap((c) => kpisDe(c.id));
  const geral = contar(todos);
  const cicloAtualOut = semanaCheckout(ate);
  const situacaoCiclo = (cid: string) => {
    const r = regs.find((x) => x.cadeira_id === cid && x.semana === cicloAtualOut);
    const prazo = prazoCiclo(ate);
    if (!r || r.status !== "enviado") return new Date() > prazo ? { t: "Pendente · prazo vencido", v: "destructive" as const } : { t: "Pendente", v: "outline" as const };
    const envio = r.primeiro_envio_em ?? r.enviado_em;
    return envio && new Date(envio) <= prazo ? { t: "Enviado no prazo", v: "default" as const } : { t: "Enviado com atraso", v: "secondary" as const };
  };
  const abrir = (titulo: string, itens: (KpiDash & { cadeira: string; semana: string })[], s?: Situacao | "criticos") =>
    setLista({ titulo, itens: s === "criticos" ? itens.filter((k) => k.desvio_critico) : s ? itens.filter((k) => situacaoDash(k) === s) : itens });

  const Contagens = ({ itens, titulo }: { itens: (KpiDash & { cadeira: string; semana: string })[]; titulo: string }) => {
    const c = contar(itens);
    return <div className="space-y-2"><Barra c={c} />
      <div className="flex flex-wrap gap-1">{SITS.map((s) => <Button key={s} size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => abrir(`${titulo} · ${SITUACAO_DASH_LBL[s]}`, itens, s)}>{SITUACAO_DASH_LBL[s]}: <b className="ml-1">{c[s]}</b></Button>)}
        {c.criticos > 0 && <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => abrir(`${titulo} · desvios críticos`, itens, "criticos")}>Desvios críticos: {c.criticos}</Button>}</div></div>;
  };

  return (
    <div className="space-y-4">
      <header><h1 className="text-2xl font-bold">Dashboard da Rotina Semanal</h1>
        <p className="text-sm text-muted-foreground">Aderência e apontamentos de KPI de todas as cadeiras. Prioridades e entregas fora do planejado das outras cadeiras seguem o interruptor de transparência ({t.ativo ? "ligado" : "desligado"}).</p></header>
      <Card className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1"><Label>Ciclo (check-in)</Label><Select value={ate} onValueChange={setAte}><SelectTrigger aria-label="Ciclo"><SelectValue /></SelectTrigger>
          <SelectContent>{[...new Set([ate, ...ciclos])].sort().reverse().map((s) => <SelectItem key={s} value={s}>{fmt(s)} (checkout {fmt(semanaCheckout(s))})</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Período</Label><Select value={n} onValueChange={setN}><SelectTrigger aria-label="Período"><SelectValue /></SelectTrigger>
          <SelectContent>{["1", "2", "4", "8", "13"].map((x) => <SelectItem key={x} value={x}>{x === "1" ? "Só este ciclo" : `Últimas ${x} semanas`}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Diretor / cadeira</Label><Select value={cad} onValueChange={setCad}><SelectTrigger aria-label="Cadeira"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas</SelectItem>{b.cadeiras.filter((c) => c.ativo).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}{c.diretor_nome ? ` · ${c.diretor_nome}` : ""}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Origem</Label><Select value={origem} onValueChange={(v) => setOrigem(v as any)}><SelectTrigger aria-label="Origem"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas</SelectItem>{(Object.keys(ORIGEM_DASH_LBL) as OrigemDash[]).map((o) => <SelectItem key={o} value={o}>{ORIGEM_DASH_LBL[o]}</SelectItem>)}</SelectContent></Select></div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(ORIGEM_DASH_LBL) as OrigemDash[]).filter((o) => origem === "todas" || o === origem).map((o) => {
          const itens = todos.filter((k) => origemDash(k) === o);
          return <Card key={o} className="p-4 space-y-2"><p className="text-sm font-semibold">{ORIGEM_DASH_LBL[o]} <span className="text-muted-foreground font-normal">· {itens.length} apontamentos</span></p><Contagens itens={itens} titulo={ORIGEM_DASH_LBL[o]} /></Card>;
        })}
      </section>
      <Card className="p-4 space-y-2"><p className="text-sm font-semibold">Consolidado · {geral.total} apontamentos{semanasOut.length > 1 ? ` em ${semanasOut.length} semanas` : ""}</p><Contagens itens={todos} titulo="Consolidado" /></Card>

      <h2 className="text-lg font-semibold">Aderência por diretor</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cadeiras.map((c) => {
          const cf = conf.de(c.id); const sit = situacaoCiclo(c.id);
          const env = conf.regs.filter((r) => r.cadeira_id === c.id && r.status === "enviado").map((r) => r.primeiro_envio_em ?? r.enviado_em).filter(Boolean).sort().pop();
          const itens = kpisDe(c.id);
          return <Card key={c.id} className="p-4 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{c.nome}</p><p className="text-xs text-muted-foreground">{c.diretor_nome ?? "Sem diretor vinculado"}</p></div><Badge variant={sit.v}>{sit.t}</Badge></div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><p className="text-muted-foreground">Conformidade</p><p className="text-base font-semibold">{pctC(cf.acumulado.taxa)}</p></div>
              <div><p className="text-muted-foreground">Preenchidos × devidos</p><p className="text-base font-semibold">{cf.ciclos.filter((x) => x.enviado).length} / {cf.acumulado.devidos}</p></div>
              <div><p className="text-muted-foreground">Último envio</p><p>{env ? new Date(env).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}</p></div>
            </div>
            <p className="text-xs text-muted-foreground">Pontualidade {pctC(cf.acumulado.pontualidade)} · completude média {pctC(cf.acumulado.completudeMedia)}</p>
            <Contagens itens={itens} titulo={c.nome} />
          </Card>;
        })}
      </div>

      <AtividadesRotina ciclo={ate} cadeira={cad} />

      <h2 className="text-lg font-semibold">Formulários do ciclo {fmt(ate)}</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {cadeiras.map((c) => {
          const r = regs.find((x) => x.cadeira_id === c.id && x.semana === cicloAtualOut);
          const co = forms.find((x) => x.cadeira_id === c.id && x.semana === cicloAtualOut && x.tipo === "checkout");
          const ci = forms.find((x) => x.cadeira_id === c.id && x.semana === ate && x.tipo === "checkin");
          const ks = (r?.kpis ?? []).filter(filtraK);
          const pri = (ci?.conteudo?.prioridades ?? []).filter((p: any) => p.titulo);
          return <Card key={c.id} className="p-4 space-y-3">
            <p className="font-semibold">{c.nome} <span className="text-xs font-normal text-muted-foreground">{r?.status === "enviado" ? "enviado" : r ? "rascunho" : "sem formulário"}</span></p>
            {[["Apontamentos do calendário", ks.filter((k) => !k.voluntario && !k.desvio_critico)], ["Desvios críticos", ks.filter((k) => k.desvio_critico)], ["Outros KPIs (fora do calendário)", ks.filter((k) => k.voluntario && !k.desvio_critico)]].map(([lbl, l]: any) =>
              l.length > 0 && <div key={lbl}><p className="text-xs font-medium">{lbl}</p><ul className="text-sm space-y-1">{l.map((k: KpiDash) => <li key={k.indicador_id} className="flex flex-wrap justify-between gap-2"><span>{k.codigo} · {k.nome}</span><Badge variant={situacaoDash(k) === "off" ? "destructive" : "outline"}>{SITUACAO_DASH_LBL[situacaoDash(k)]}</Badge></li>)}</ul></div>)}
            {ks.length === 0 && <p className="text-sm text-muted-foreground">Sem apontamentos de KPI.</p>}
            {ci || co ? <>
              <div><p className="text-xs font-medium">Prioridades da semana</p>{pri.length ? <ul className="list-disc pl-5 text-sm">{pri.map((p: any) => <li key={p.id}>{p.titulo}</li>)}</ul> : <p className="text-sm text-muted-foreground">Sem prioridades.</p>}</div>
              {co && <div><p className="text-xs font-medium">Entregas fora do planejado</p><ExtrasLeitura conteudo={co.conteudo} /></div>}
            </> : <p className="text-xs text-muted-foreground">Prioridades e entregas fora do planejado visíveis só com a transparência ligada.</p>}
          </Card>;
        })}
      </div>

      <Dialog open={!!lista} onOpenChange={(o) => !o && setLista(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>{lista?.titulo}</DialogTitle></DialogHeader>
          {lista && (lista.itens.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum item.</p> :
            <ul className="space-y-2 text-sm">{lista.itens.map((k, i) => {
              const tipo = k.tipo_apontamento ?? "valor_mensal"; const meta = tipo === "entrega" ? (k.prazo_entrega ? `prazo ${fmt(k.prazo_entrega)}` : "sem prazo") : tipo === "valor_periodo" ? (k.meta_texto || fmtNum(k.meta_semestre ?? null) || "sem meta") : k.meta_mes != null ? fmtNum(k.meta_mes) : "sem meta";
              const valor = tipo === "entrega" ? (k.status_entrega || "—") : tipo === "valor_periodo" ? (k.declaracao ? `declarado ${k.declaracao === "on" ? "On" : "Off"}` : "—") + (k.situacao_atual ? ` · ${k.situacao_atual}` : "") : k.situacao_atual || fmtNum(k.realizado ?? null) || "—";
              return <li key={i} className="rounded border p-2"><p className="font-medium">{k.codigo} · {k.nome}</p>
                <p className="text-xs text-muted-foreground">{k.cadeira} · checkout {fmt(k.semana)} · período {k.periodo_label ?? "—"}</p>
                <p className="text-xs">Último valor: <b>{valor}</b> · Meta: {meta} · {SITUACAO_DASH_LBL[avaliarApontamento(k).aval]}{k.voluntario ? " · fora do calendário" : ""}{k.desvio_critico ? " · desvio crítico" : ""}</p></li>;
            })}</ul>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
