import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase, MESES_2S26, NOME_MES, fmtNum } from "@/hooks/useMetasBase";
import { carregarSituacoesKpi } from "@/hooks/useAvaliacoesBsc";
import { mapaArvore, AVALIACAO_LBL, numeroBr, STATUS_ENTREGA_LBL, TIPO_LBL, type CheckoutReg } from "@/lib/avaliacaoBsc";
import { competenciaDaSemana } from "@/lib/rotinaSemanal";
import { celulaMes, marcarCriticos, grupoDo, GRUPO_LBL, type Grupo, type Celula } from "@/lib/matrizApontamentos";
import { cn } from "@/lib/utils";
import rev02 from "@/data/bscRev02.json";
import { devidoNoCiclo, previstoNoMes } from '@/lib/frequenciaApontamento';
import { addDias } from '@/lib/rotinaSemanal';

const db = supabase as any;
const COR: Record<string, string> = { on: "bg-success/15 text-success", off: "bg-destructive/15 text-destructive", acomp: "bg-muted text-muted-foreground", sem_meta: "bg-muted/50 text-muted-foreground", pendente: "bg-warning/15 text-warning", encerrada: "bg-muted/50 text-muted-foreground" };
const pct = (v: number | null) => (v == null ? "" : `${Math.round(v * 100)}%`);
const dm = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;

/** Matriz consolidada: lançamento mensal + situação dos checkouts enviados + árvore, pela regra única de avaliação. */
export default function MatrizApontamentos() {
  const b = useMetasBase();
  const [lancs, setLancs] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [cks, setCks] = useState<(CheckoutReg & { cadeira_id: string })[]>([]);
  const [alertas, setAlertas] = useState<Set<string>>(new Set());
  const [arv, setArv] = useState<{ m: Record<string, string>; d: string | null }>({ m: {}, d: null });
  const [cad, setCad] = useState("todas");
  const [grupo, setGrupo] = useState<"todos" | Grupo>("todos");
  const [modo, setModo] = useState<"mes" | "semana">("mes");
  const [de, setDe] = useState(MESES_2S26[0]);
  const [ate, setAte] = useState(MESES_2S26[MESES_2S26.length - 1]);
  useEffect(() => {
    Promise.all([
      db.from("mt_lancamentos").select("indicador_id,competencia,valor,revisao,sem_medicao,declaracao,justificativa,status_entrega,avanco_pct,updated_at"),
      db.from("mt_metas_mensais").select("indicador_id,competencia,meta_mes"),
      carregarSituacoesKpi(),
      db.from("conteudo_editavel").select("valor,updated_at").eq("chave", "bsc.rev02").maybeSingle(),
    ]).then(([l, m, s, a]: any[]) => {
      setLancs(l.data ?? []); setMetas(m.data ?? []); setCks(s.data as any); setAlertas(s.alertas);
      setArv({ m: mapaArvore((a.data?.valor ?? rev02) as any[]), d: a.data?.updated_at ?? null });
    });
  }, []);

  const meses = MESES_2S26.filter((m) => m >= de && m <= ate);
  const semanas = useMemo(() => [...new Set(cks.map((c) => c.semana))].filter((s) => { const c = competenciaDaSemana(s); return c >= de && c <= ate; }).sort(), [cks, de, ate]);

  const linhas = useMemo(() => {
    const inds = b.indicadores.filter((i) => i.status === "ativo" && !i.parent_id && grupoDo(i as any) && (cad === "todas" || i.cadeira_id === cad) && (grupo === "todos" || grupoDo(i as any) === grupo));
    return inds.map((i: any) => {
      const ck = cks.filter((c) => c.cadeira_id === i.cadeira_id);
      const sit = arv.m[String(i.nome).trim()]; const arvore = sit ? { valor: sit, data: arv.d } : null;
      const fora=(comp:string)=>!!i.frequencia&&(!previstoNoMes(i,comp)||['trimestral','semestral'].includes(i.frequencia));
      const realizado = (comp: string) => lancs.filter((x) => x.indicador_id === i.id && (fora(comp)?x.competencia<=comp:x.competencia===comp) && !x.sem_medicao).sort((a,z)=>z.competencia.localeCompare(a.competencia)||z.revisao-a.revisao)[0]?.valor ?? null;
      const lancDe = (comp: string) => lancs.filter((x) => x.indicador_id === i.id && (fora(comp)?x.competencia<=comp:x.competencia===comp)).sort((a,z)=>z.competencia.localeCompare(a.competencia)||z.revisao-a.revisao)[0] ?? null;
      const metaMes = (comp: string) => metas.find((x) => x.indicador_id === i.id && x.competencia === comp)?.meta_mes ?? null;
      const mensais = marcarCriticos(MESES_2S26.map((comp) => celulaMes(i, comp, metaMes(comp), realizado(comp) == null ? null : Number(realizado(comp)), arvore, ck, new Date(), lancDe(comp))));
      const porMes = Object.fromEntries(MESES_2S26.map((m, k) => [m, mensais[k]]));
      const semanais: Record<string, Celula> = {};
      for (const s of semanas) {
        const k = ck.find((c) => c.semana === s)?.conteudo?.kpis_resposta?.find((x: any) => x.indicador_id === i.id && x.situacao_atual);
        const base = porMes[competenciaDaSemana(s)];
        const kk = ck.find((c) => c.semana === s)?.conteudo?.kpis_resposta?.find((x: any) => x.indicador_id === i.id && (x.situacao_atual || x.declaracao || x.status_entrega));
        semanais[s] = { ...(base ?? { aval: "acomp", origem: null, ating: null, meta: null }), foraCalendario: !!i.frequencia&&!devidoNoCiclo(i,addDias(s,7))&&!kk?.desvio_critico, valor: k ? numeroBr(k.situacao_atual) : base?.valor??null, origem: kk ? `checkout de ${dm(s)}` : base?.origem??null, status_entrega: kk?.status_entrega ?? base?.status_entrega ?? null } as Celula;
      }
      return { i, g: grupoDo(i) as Grupo, porMes, semanais, alerta: alertas.has(i.id) };
    });
  }, [b.indicadores, cks, lancs, metas, arv, cad, grupo, semanas, alertas]);

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!b.isGovernanca && !b.minhaCadeira) return <p className="text-sm text-muted-foreground">A matriz é visível para a Governança, o CEO e os diretores com cadeira.</p>;
  const cols = modo === "mes" ? meses : semanas;
  const nomeCad = (id: string | null) => b.cadeiras.find((c) => c.id === id)?.nome ?? "—";
  const grupos = (Object.keys(GRUPO_LBL) as Grupo[]).filter((g) => linhas.some((l) => l.g === g));

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="w-52 space-y-1"><Label>Cadeira / diretor</Label>
          <Select value={cad} onValueChange={setCad}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todas">Todas</SelectItem>{b.cadeiras.filter((c) => c.ativo).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}{c.diretor_nome ? ` · ${c.diretor_nome}` : ""}</SelectItem>)}</SelectContent></Select></div>
        <div className="w-44 space-y-1"><Label>Grupo</Label>
          <Select value={grupo} onValueChange={(v) => setGrupo(v as any)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos</SelectItem>{(Object.keys(GRUPO_LBL) as Grupo[]).map((g) => <SelectItem key={g} value={g}>{GRUPO_LBL[g]}</SelectItem>)}</SelectContent></Select></div>
        <div className="w-36 space-y-1"><Label>Colunas</Label>
          <Select value={modo} onValueChange={(v) => setModo(v as any)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="mes">Meses</SelectItem><SelectItem value="semana">Semanas</SelectItem></SelectContent></Select></div>
        {[["De", de, setDe], ["Até", ate, setAte]].map(([l, v, f]: any) => (
          <div key={l} className="w-28 space-y-1"><Label>{l}</Label>
            <Select value={v} onValueChange={f}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MESES_2S26.map((m) => <SelectItem key={m} value={m}>{NOME_MES[m.slice(5)]}/26</SelectItem>)}</SelectContent></Select></div>
        ))}
        <div className="ml-auto flex flex-wrap gap-2 text-xs">
          <span className={cn("rounded px-2 py-0.5", COR.off)}>Off track</span>
          <span className="rounded px-2 py-0.5 bg-destructive text-destructive-foreground inline-flex items-center gap-1"><Flame className="h-3 w-3" />Desvio crítico (2+ períodos off e abaixo de 70%)</span>
          <span className="inline-flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" />Plano "Não" sem iniciativa</span>
          <span className="rounded px-2 py-0.5 border border-destructive text-destructive">2+ meses declarados Off</span>
          <span className="rounded px-2 py-0.5 bg-muted">declarado = declaração do diretor</span>
        </div>
      </Card>

      {!linhas.length && <p className="text-sm text-muted-foreground">Nenhum indicador para os filtros escolhidos.</p>}
      {grupos.map((g) => (
        <Card key={g} className="overflow-x-auto">
          <h2 className="font-semibold p-3 pb-0">{GRUPO_LBL[g]}</h2>
          <table className="w-full text-xs mt-2">
            <thead className="bg-muted/50 text-muted-foreground"><tr>
              <th className="text-left p-2 min-w-[240px]">Indicador</th><th className="text-left p-2">Cadeira</th>
              {cols.map((c) => <th key={c} className="p-2 text-center min-w-[96px]">{modo === "mes" ? `${NOME_MES[c.slice(5)]}/26` : dm(c)}</th>)}
            </tr></thead>
            <tbody>{linhas.filter((l) => l.g === g).map((l) => (
              <tr key={l.i.id} className="border-t">
                <td className="p-2"><span className="font-mono text-muted-foreground">{l.i.codigo}</span> {l.i.nome} <span className="text-[10px] text-muted-foreground">· {TIPO_LBL[(l.i.tipo_apontamento ?? "valor_mensal") as keyof typeof TIPO_LBL]}</span>{l.alerta && <AlertTriangle aria-label="Plano Não sem iniciativa" className="inline h-3 w-3 ml-1 text-warning" />}</td>
                <td className="p-2">{nomeCad(l.i.cadeira_id)}</td>
                {cols.map((c) => { const x: Celula | undefined = modo === "mes" ? l.porMes[c] : l.semanais[c]; if (!x) return <td key={c} />;
                  return (
                    <td key={c} className="p-1" title={`${AVALIACAO_LBL[x.aval]}${x.origem ? ` · ${x.origem}` : ""}`}>
                      <div className={cn("rounded p-1 text-center", x.critico ? "bg-destructive text-destructive-foreground" : COR[x.aval], x.alertaDeclarado && "ring-1 ring-destructive")}>
                        {x.foraCalendario&&<p className="text-muted-foreground">Fora do calendário</p>}
                        {x.fonte === "entrega" ? <>
                          <div className="font-semibold">{x.status_entrega ? STATUS_ENTREGA_LBL[x.status_entrega] : AVALIACAO_LBL[x.aval]}</div>
                          <div className="opacity-80">{x.prazoVencido ? "prazo vencido" : l.i.prazo_entrega ? `prazo ${dm(l.i.prazo_entrega)}` : "status de entrega"}</div>
                        </> : <>
                          <div className="font-semibold tabular-nums">{x.critico && <Flame className="inline h-3 w-3 mr-0.5" />}{x.fonte === "declarado" && (x.aval === "on" || x.aval === "off") ? `${AVALIACAO_LBL[x.aval]} · declarado` : fmtNum(x.valor)}</div>
                          <div className="opacity-80">{x.fonte === "declarado" ? `meta semestral/anual ${fmtNum(x.meta)}` : `meta mensal ${fmtNum(x.meta)}`}{x.ating != null ? ` · ${pct(x.ating)}` : ""}</div>
                        </>}
                      </div>
                    </td>);
                })}
              </tr>
            ))}</tbody>
          </table>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground">Valor: realizado lançado no mês; sem lançamento, a última situação numérica de um checkout enviado ou da Árvore de KPIs (a mais recente). Valor mensal: On/Off calculado depois do fim do mês. Meta semestral/anual: vale a declaração do diretor no mês ("declarado"); a comparação com a meta só no fim do período. Entrega: status × prazo. Desvio crítico só onde há atingimento numérico. Riscos da rotina não são ligados a indicadores, por isso o alerta usa o plano "Não" sem iniciativa.</p>
    </div>
  );
}
