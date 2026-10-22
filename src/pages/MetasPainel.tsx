import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase, MESES_2S26, statusEfetivo } from "@/hooks/useMetasBase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ENTREGA_LBL } from "@/pages/MetasSemanal";
import { cicloPadrao, semanaCheckout, seloCiclo } from "@/lib/rotinaSemanal";
import { srPendentesPorCadeira } from "@/lib/projetosGestao";
import { useAvaliacoesBsc, cadeirasVisiveisBsc } from "@/hooks/useAvaliacoesBsc";
import { useConformidade, pctC } from "@/components/Conformidade";

const db = supabase as any;
const ORIGENS = ["bsc", "okr", "cesta"];
const MES_LONGO: Record<string, string> = { "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };
const tituloComp = (c: string) => `${MES_LONGO[c.slice(5)]}/${c.slice(0, 4)}`;
const pct = (v: number | null | undefined) => (v == null ? "—" : `${(Number(v) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
const dt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export type Faixa = { nome: string; min: number; cor: string };
export type Regua = { ativa: boolean; faixas: Faixa[] };
const CORES: Record<string, { l: string; cls: string }> = {
  destructive: { l: "Vermelho", cls: "bg-destructive text-destructive-foreground" },
  warning: { l: "Amarelo", cls: "bg-warning text-warning-foreground" },
  success: { l: "Verde", cls: "bg-success text-success-foreground" },
  info: { l: "Azul", cls: "bg-info text-info-foreground" },
  neutral: { l: "Cinza", cls: "bg-muted text-muted-foreground" },
};
/** Faixa da nota (nota em fração; limites em %). Retorna null quando a régua está desligada. */
export function faixaDaNota(nota: number | null, r: Regua | null) {
  if (!r?.ativa || nota == null) return null;
  const ord = [...r.faixas].sort((a, b) => b.min - a.min);
  return ord.find((f) => nota * 100 >= f.min) ?? null;
}

function segunda(d = new Date()) {
  const x = new Date(d); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w);
  return x.toISOString().slice(0, 10);
}

function mesAtual() {
  const d = new Date(); const c = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return MESES_2S26.includes(c) ? c : MESES_2S26[MESES_2S26.length - 1];
}

export default function MetasPainel() {
  const b = useMetasBase();
  const [comp, setComp] = useState(mesAtual());
  const [comps, setComps] = useState<any[]>([]);
  const avalBsc = useAvaliacoesBsc(b.loading ? null : comp, cadeirasVisiveisBsc(b), ORIGENS);
  const conf = useConformidade();
  const [envios, setEnvios] = useState<any[]>([]);
  const [lancs, setLancs] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [ver, setVer] = useState<any>(null);
  const [srProj, setSrProj] = useState<any[]>([]);
  const [srRegs, setSrRegs] = useState<any[]>([]);
  useEffect(() => {
    db.from("projetos").select("codigo,status,cadeira_id").then(({ data }: any) => setSrProj(data ?? []));
    db.from("mt_status_projetos").select("projeto_codigo,arquivo_path,farol_escopo,farol_custo,farol_cronograma").eq("competencia", comp).then(({ data }: any) => setSrRegs(data ?? []));
  }, [comp]);
  const srPend = useMemo(() => srPendentesPorCadeira(srProj, srRegs), [srProj, srRegs]);

  const load = async () => {
    const [c, e, l, a, k] = await Promise.all([
      db.from("mt_competencias").select("*"), db.from("mt_envios").select("*"),
      db.from("mt_lancamentos").select("id,indicador_id,competencia,revisao"),
      db.from("mt_auditoria").select("*").order("alterado_em", { ascending: false }).limit(1000),
      db.from("mt_checkins").select("*").gte("semana", segunda(new Date(Date.now() - 28 * 864e5))),
    ]);
    setComps(c.data ?? []); setEnvios(e.data ?? []); setLancs(l.data ?? []); setAudit(a.data ?? []); setChecks(k.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const compRow = comps.find((c) => c.competencia === comp);
  const rev = compRow?.revisao ?? 0;
  const nomeUser = (id: string | null) => b.perfis.find((p) => p.user_id === id)?.display_name ?? "—";
  const cadeiras = b.cadeiras.filter((c) => c.ativo);

  const linhas = cadeiras.map((c) => {
    const e = envios.find((x) => x.cadeira_id === c.id && x.competencia === comp && x.revisao === rev);
    const ant = rev > 0 ? envios.find((x) => x.cadeira_id === c.id && x.competencia === comp && x.revisao === rev - 1) : null;
    const atrasadas = b.iniciativas.filter((i) => i.cadeira_id === c.id && statusEfetivo(i) === "atrasada").length;
    return { c, e, ant, atrasadas };
  });
  const enviadas = linhas.filter((l) => l.e?.status === "enviado").length;

  // Avisos: alterações feitas depois do primeiro envio da cadeira na competência
  const avisos = useMemo(() => {
    const lancMap = new Map(lancs.map((l) => [l.id, l]));
    const indMap = new Map(b.indicadores.map((i) => [i.id, i]));
    return audit.flatMap((a) => {
      const l = lancMap.get(a.registro_id); if (!l || l.competencia !== comp) return [];
      const ind = indMap.get(l.indicador_id); if (!ind) return [];
      const e = envios.find((x) => x.cadeira_id === ind.cadeira_id && x.competencia === comp && x.revisao === l.revisao);
      if (!e?.primeiro_envio_em || new Date(a.alterado_em) <= new Date(e.primeiro_envio_em)) return [];
      return [{ a, ind, e, rev: l.revisao, cad: b.cadeiras.find((c) => c.id === ind.cadeira_id)?.nome ?? "—" }];
    });
  }, [audit, lancs, envios, b.indicadores, b.cadeiras, comp]);
  const reaberturas = linhas.filter((l) => l.ant);

  const ciclo = cicloPadrao(); const semOut = semanaCheckout(ciclo);

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <Dialog open={!!ver} onOpenChange={(o) => !o && setVer(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ver?.tipo === "checkin" ? "Check-in" : "Checkout"} · {ver?.nome}</DialogTitle></DialogHeader>
          {ver && <p className="text-xs text-muted-foreground">{ver.enviado_por_nome ?? "—"} · {ver.enviado_em ? dt(ver.enviado_em) : ""}</p>}
          {ver?.tipo === "checkin" && (
            <div className="space-y-3 text-sm">
              <ol className="list-decimal pl-5 space-y-1">{(ver.conteudo.prioridades ?? []).map((p: any, i: number) => (
                <li key={i}><b>{p.titulo}</b>{p.iniciativa_id && <span className="text-muted-foreground"> · {b.iniciativas.find((x) => x.id === p.iniciativa_id)?.titulo}</span>}{p.resultado && <p className="text-muted-foreground">Esperado: {p.resultado}</p>}</li>))}</ol>
              <p><b>Riscos e bloqueios:</b> {ver.conteudo.riscos || "—"}</p>
              <p><b>Apoio necessário:</b> {ver.conteudo.apoio || "—"}</p>
              <p><b>Confiança:</b> {ver.conteudo.confianca}/5</p>
            </div>
          )}
          {ver?.tipo === "checkout" && (
            <div className="space-y-3 text-sm">
              <ul className="space-y-1">{(ver.conteudo.entregas ?? []).map((e: any, i: number) => (
                <li key={i}><Badge variant={e.status === "entregue" ? "default" : e.status === "parcial" ? "secondary" : "destructive"}>{ENTREGA_LBL[e.status] ?? "—"}</Badge> {e.titulo}{e.motivo && <p className="text-muted-foreground pl-2">{e.motivo}</p>}</li>))}</ul>
              <p><b>Entregas fora do planejado:</b> {ver.conteudo.extras || "—"}</p>
              <p><b>Aprendizados:</b> {ver.conteudo.aprendizados || "—"}</p>
              <p><b>Foco da próxima semana:</b> {ver.conteudo.proxima || "—"}</p>
              <p><b>Avaliação da semana:</b> {ver.conteudo.ritmo}/5</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Painel da Governança</p>
            <h1 className="text-2xl font-bold">Metas – {tituloComp(comp)}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={compRow?.estado === "fechado" ? "destructive" : "default"}>{compRow?.estado === "fechado" ? "Fechado" : compRow?.estado === "reaberto" ? "Reaberto" : "Aberto"}</Badge>
              {rev > 0 && <Badge variant="outline">Rev. {rev}</Badge>}
              <Badge variant="secondary">{enviadas}/{cadeiras.length} cadeiras atualizadas</Badge>
              {avisos.length > 0 && <Badge variant="destructive">{avisos.length} alteração(ões) após envio</Badge>}
            </div>
          </div>
          <div className="w-56 space-y-1">
            <Label>Competência</Label>
            <Select value={comp} onValueChange={setComp}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MESES_2S26.map((m) => <SelectItem key={m} value={m}>{tituloComp(m)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Conformidade, indicadores e formulários por cadeira</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-3">Cadeira</th><th className="pr-3">Conformidade do ciclo semanal</th>
                <th className="pr-3">Form. mensal de OKRs/metas</th>
                <th className="pr-3">Indicadores (BSC, KRs e cesta)</th><th className="pr-3">Ciclo semanal (checkout + check-in)</th>
                <th className="pr-3">Iniciativas atrasadas</th><th className="pr-3">Status reports pendentes no mês</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ c, e, ant, atrasadas }) => {
                const ci = checks.find((k) => k.cadeira_id === c.id && k.semana === ciclo && k.tipo === "checkin");
                const co = checks.find((k) => k.cadeira_id === c.id && k.semana === semOut && k.tipo === "checkout");
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-3"><p className="font-medium">{c.nome}</p><p className="text-xs text-muted-foreground">{c.diretor_nome ?? "—"}</p></td>
                    <td className="pr-3 text-xs">{(() => { if (!conf.carregado) return "…"; const r = conf.de(c.id); const m = r.porMes[comp]; return <span><b className="text-sm tabular-nums">{pctC(r.acumulado.taxa)}</b> acumulado{r.tendencia != null && <span className={r.tendencia < 0 ? "text-destructive" : "text-success"}> {r.tendencia >= 0 ? "▲" : "▼"}{Math.abs(Math.round(r.tendencia * 100))} p.p.</span>}
                      <span className="block text-muted-foreground">mês: {pctC(m?.taxa ?? null)} · pontualidade {pctC(r.acumulado.pontualidade)} · completude {pctC(r.acumulado.completudeMedia)}</span></span>; })()}</td>
                    <td className="pr-3">
                      {e?.status === "enviado"
                        ? <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> Enviado {e.enviado_em ? dt(e.enviado_em) : ""}</span>
                        : e ? <span className="inline-flex items-center gap-1 text-warning"><Clock className="h-4 w-4" /> Rascunho</span>
                        : <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="h-4 w-4" /> Não atualizada</span>}
                    </td>
                    <td className="pr-3 text-xs">{(() => { const a = avalBsc.porCadeira[c.id]; return a ? <span><b className="text-success">{a.cont.on}</b> on · <b className="text-destructive">{a.cont.off}</b> off · {a.cont.acomp} acomp.{a.cont.pendente ? ` · ${a.cont.pendente} pendente(s) de apontamento` : ""}{a.cont.encerrada ? ` · ${a.cont.encerrada} encerrada(s)` : ""}{a.cont.sem_meta ? ` · ${a.cont.sem_meta} s/ meta` : ""}{a.itens.filter((x) => x.origem).map((x) => <span key={x.id} className="block text-muted-foreground">{x.nome}: {x.origem}</span>)}</span> : "—"; })()}</td>
                    <td className="pr-3">{(() => { const sc = seloCiclo(ci, co, ciclo); return <div className="space-y-1">
                      <Badge className={sc.estado === "enviado" ? (sc.atrasado ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground") : ""} variant={sc.estado === "enviado" ? "default" : sc.atrasado ? "destructive" : "outline"}>{sc.estado === "enviado" ? `Enviado${sc.atrasado ? " · fora do prazo" : ""}` : sc.estado === "parcial" ? "Parcial" : sc.estado === "rascunho" ? "Rascunho" : "Pendente"}</Badge>
                      <div className="flex gap-2 text-xs">{co && <button className="underline" onClick={() => setVer({ ...co, nome: c.nome })}>ver checkout</button>}{ci && <button className="underline" onClick={() => setVer({ ...ci, nome: c.nome })}>ver check-in</button>}</div>
                    </div>; })()}</td>
                    <td className="pr-3">{atrasadas ? <Badge variant="destructive">{atrasadas}</Badge> : "0"}</td>
                    <td className="pr-3 text-xs">{(() => { const s = srPend[c.id]; if (!s) return "—"; return s.pendentes.length ? <span title={s.pendentes.join(", ")}><Badge variant="destructive">{s.pendentes.length}</Badge> de {s.total}</span> : <span className="text-success">0 de {s.total}</span>; })()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Ciclo de {new Date(ciclo + "T12:00").toLocaleDateString("pt-BR")}: checkout da semana de {new Date(semOut + "T12:00").toLocaleDateString("pt-BR")} e check-in da semana de {new Date(ciclo + "T12:00").toLocaleDateString("pt-BR")}. Não há nota mensal: cada indicador tem sua avaliação pelo tipo de apontamento (valor mensal, meta semestral/anual declarada ou entrega). Conformidade = ciclos enviados no prazo com 90% ou mais de completude ÷ ciclos devidos, desde o ciclo de 26/10/2026. Use "ver checkout/check-in" para o conteúdo. Envio único do ciclo; prazo segunda 23h59 (São Paulo).</p>
        <p className="text-xs"><Link className="underline" to="/metas/semanal">Abrir formulário semanal</Link></p>
        <Button asChild variant="link" className="px-0"><Link to="/lancamentos?aba=lancar">Abrir formulário mensal</Link></Button>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Avisos de mudanças em dados já enviados</h2>
        {avisos.length === 0 && reaberturas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma alteração após envio nesta competência.</p>}
        <div className="space-y-2">
          {reaberturas.map(({ c, e, ant }) => (
            <div key={"r" + c.id} className="rounded border border-warning/50 bg-warning-soft p-3 text-sm">
              <b>{c.nome}</b>: mês reaberto (Rev. {rev}).
            </div>
          ))}
          {avisos.map(({ a, ind, e, cad }) => (
            <div key={a.id} className="rounded border border-destructive/40 p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span><b>{cad}</b> · <span className="font-mono text-xs">{ind.codigo}</span> {ind.nome}</span>
                <span className="text-xs text-muted-foreground">{nomeUser(a.alterado_por)} · {dt(a.alterado_em)}</span>
              </div>
              <p className="mt-1">{a.campo === "comentario" ? "Comentário" : a.campo === "apontamento" ? "Declaração / status de entrega" : "Valor apontado"}: <s className="text-muted-foreground">{a.valor_anterior ?? "vazio"}</s> → <b>{a.valor_novo ?? "vazio"}</b></p>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
