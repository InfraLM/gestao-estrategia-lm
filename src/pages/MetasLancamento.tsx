import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Lock, Save, Send, Unlock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useMetasBase, MESES_2S26, STATUS_INI, statusEfetivo, fmtNum, type Indicador,
} from "@/hooks/useMetasBase";
import { avaliarPorTipo, AVALIACAO_LBL, TIPO_LBL, STATUS_ENTREGA_LBL, type StatusEntrega } from "@/lib/avaliacaoBsc";
import { exclusiveAction } from "@/lib/exclusiveAction";
import { useModuleAccess } from "@/hooks/useModuleAccess";

const db = supabase as any;
const MES_LONGO: Record<string, string> = { "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };
const MES_CURTO: Record<string, string> = { "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez" };
const tituloComp = (c: string) => `${MES_LONGO[c.slice(5)]}/${c.slice(0, 4)}`;
const parseNum = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\./g, "").replace(",", ".")));
const txt = (v: number | null | undefined) => (v == null ? "" : String(v).replace(".", ","));
const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);

type Comp = { competencia: string; estado: "aberto" | "fechado" | "reaberto"; revisao: number };
type Lanc = { id?: string; indicador_id: string; competencia: string; revisao: number; valor: number | null; sem_medicao: boolean; comentario: string | null;
  declaracao?: "on" | "off" | null; justificativa?: string | null; status_entrega?: StatusEntrega | null; avanco_pct?: number | null; evidencia?: string | null; updated_at?: string };
type Envio = { cadeira_id: string; competencia: string; revisao: number; status: string; nota: number | null; enviado_por_nome: string | null; enviado_em: string | null };
type Rascunho = { valor: string; sem: boolean; comentario: string; declaracao: "on" | "off" | null; justificativa: string; status_entrega: StatusEntrega | ""; avanco: string; evidencia: string };
const tipoDe = (i: Indicador) => i.tipo_apontamento ?? "valor_mensal";

/** Atingimento respeitando o sentido: maior = realizado/meta; menor = meta/realizado. */
export function atingimento(real: number | null, meta: number | null, sentido: "maior" | "menor") {
  if (real == null || meta == null || meta === 0) return null;
  if (sentido === "maior") return real / meta;
  if (real === 0) return null;
  return meta / real;
}

function mesAtual() {
  const d = new Date();
  const c = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return MESES_2S26.includes(c) ? c : MESES_2S26[MESES_2S26.length - 1];
}

export default function MetasLancamento() {
  const b = useMetasBase();
  const access = useModuleAccess();
  const [comp, setComp] = useState(mesAtual());
  const [cadeira, setCadeira] = useState<string | null>(null);
  const [comps, setComps] = useState<Comp[]>([]);
  const [lancs, setLancs] = useState<Lanc[]>([]);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [rasc, setRasc] = useState<Record<string, Rascunho>>({});
  const [ini, setIni] = useState<Record<string, { status: string; prazo: string; comentario: string }>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const runOnce = useRef(exclusiveAction());
  const [feedback, setFeedback] = useState("");
  const [confirmar, setConfirmar] = useState<null | "fechar" | "reabrir">(null);

  const carregar = async () => {
    const [c, l, e] = await Promise.all([
      db.from("mt_competencias").select("*").order("competencia"),
      db.from("mt_lancamentos").select("*"),
      db.from("mt_envios").select("*"),
    ]);
    setComps(c.data ?? []); setLancs(l.data ?? []); setEnvios(e.data ?? []);
  };
  useEffect(() => { carregar(); }, []);
  useEffect(() => { if (!cadeira && !b.loading) setCadeira(b.minhaCadeira ?? b.cadeiras[0]?.id ?? null); }, [b.loading, b.minhaCadeira, b.cadeiras, cadeira]);

  const compRow = comps.find((c) => c.competencia === comp);
  const rev = compRow?.revisao ?? 0;
  const fechado = compRow?.estado === "fechado";
  const podeEditar = access.canWrite("metas") && !fechado && !!cadeira && (b.isGov || cadeira === b.minhaCadeira);

  // valor vigente de um indicador numa competência = maior revisão daquela competência
  const lancDe = (indId: string, c: string) => {
    const r = comps.find((x) => x.competencia === c)?.revisao ?? 0;
    return lancs.find((l) => l.indicador_id === indId && l.competencia === c && l.revisao === r) ?? null;
  };
  const metaDe = (indId: string, c: string) => b.metas.find((m) => m.indicador_id === indId && m.competencia === c) ?? null;

  const daCadeira = useMemo(() => b.indicadores.filter((i) => i.cadeira_id === cadeira && i.status === "ativo"), [b.indicadores, cadeira]);
  const topo = daCadeira.filter((i) => !i.parent_id || !daCadeira.some((p) => p.id === i.parent_id));
  const filhos = (id: string) => daCadeira.filter((i) => i.parent_id === id);
  const iniciativas = b.iniciativas.filter((i) => i.cadeira_id === cadeira);

  // preenche rascunho a partir do banco quando muda cadeira/competência
  useEffect(() => {
    const r: Record<string, Rascunho> = {};
    daCadeira.forEach((i) => {
      const l = lancs.find((x) => x.indicador_id === i.id && x.competencia === comp && x.revisao === rev);
      r[i.id] = { valor: txt(l?.valor), sem: !!l?.sem_medicao, comentario: l?.comentario ?? "", declaracao: l?.declaracao ?? null, justificativa: l?.justificativa ?? "", status_entrega: l?.status_entrega ?? "", avanco: txt(l?.avanco_pct), evidencia: l?.evidencia ?? "" };
    });
    setRasc(r); setErros({});
    const n: typeof ini = {};
    iniciativas.forEach((i) => { n[i.id] = { status: i.status, prazo: i.prazo ?? "", comentario: i.comentario ?? "" }; });
    setIni(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadeira, comp, rev, lancs, b.indicadores, b.iniciativas]);

  // cálculo
  const metaDez = (i: Indicador) => metaDe(i.id, "2026-12")?.meta_acumulada ?? i.meta_semestre ?? null;
  const calc = (i: Indicador): { mes: number | null; dez: number | null; nota: number | null } => {
    const kids = filhos(i.id);
    if (kids.length) {
      const r = kids.map((k) => ({ k, a: calc(k).nota })).filter((x) => x.a != null) as { k: Indicador; a: number }[];
      if (!r.length) return { mes: null, dez: null, nota: null };
      let v: number;
      if (i.regra_consolidacao === "media_ponderada") {
        const sp = r.reduce((s, x) => s + (x.k.peso_componente ?? 0), 0);
        v = sp ? r.reduce((s, x) => s + x.a * (x.k.peso_componente ?? 0), 0) / sp : r.reduce((s, x) => s + x.a, 0) / r.length;
      } else v = Math.min(...r.map((x) => x.a));
      return { mes: null, dez: null, nota: v };
    }
    const d = rasc[i.id];
    if (!d || d.sem) return { mes: null, dez: null, nota: null };
    const real = parseNum(d.valor);
    const mm = metaDe(i.id, comp);
    const mes = atingimento(real, mm?.meta_mes ?? null, i.sentido);
    // Acumulativa (curva soma mês a mês): soma realizados jul..mês e compara com a meta acumulada; também mostra vs. dezembro.
    const acumulativa = mm?.meta_acumulada != null && mm.meta_mes != null && mm.meta_acumulada !== mm.meta_mes;
    if (acumulativa && real != null) {
      const prev = MESES_2S26.slice(0, MESES_2S26.indexOf(comp)).reduce((s, c2) => s + (lancDe(i.id, c2)?.valor ?? 0), 0);
      const acum = prev + real;
      return { mes, dez: atingimento(acum, metaDez(i), i.sentido), nota: atingimento(acum, mm!.meta_acumulada, i.sentido) };
    }
    return { mes, dez: atingimento(real, metaDez(i), i.sentido), nota: mes };
  };
  // Sem nota mensal: cada indicador tem sua avaliação pela regra do tipo de apontamento (o que está na tela, ainda não enviado).
  const avalDe = (i: Indicador) => {
    const d = rasc[i.id]; const tipo = tipoDe(i);
    return avaliarPorTipo({ indicador_id: i.id, sentido: i.sentido, competencia: comp, meta_mes: tipo === "valor_mensal" ? metaDe(i.id, comp)?.meta_mes ?? null : null, meta_semestre: i.meta_semestre, meta_texto: i.meta_texto,
      realizado: d?.sem ? null : parseNum(d?.valor ?? ""), tipo, prazo_entrega: i.prazo_entrega ?? null,
      apontamento: d && (d.declaracao || d.status_entrega) ? { declaracao: d.declaracao, justificativa: d.justificativa, status_entrega: (d.status_entrega || null) as any, avanco_pct: parseNum(d.avanco), data: "", origem: "Lançar mês" } : null }, null, []);
  };

  const envio = envios.find((e) => e.cadeira_id === cadeira && e.competencia === comp && e.revisao === rev);

  const gravar = (enviar: boolean) => runOnce.current(async () => {
    if (!cadeira) return;
    if (enviar) {
      const er: Record<string, string> = {};
      daCadeira.filter((i) => !filhos(i.id).length).forEach((i) => {
        const d = rasc[i.id]; const tipo = tipoDe(i);
        if (tipo === "entrega") { if (!d?.status_entrega) er[i.id] = "Informe o status de entrega."; }
        else if (tipo === "valor_periodo") {
          if (!d?.declaracao) er[i.id] = "Declare On track ou Off track no mês.";
          else if (d.declaracao === "off" && !d.justificativa.trim()) er[i.id] = "Justifique o Off track.";
          else if (d.valor.trim() && Number.isNaN(parseNum(d.valor))) er[i.id] = "Valor inválido.";
        }
        else if (!d?.sem && d?.valor.trim() === "") er[i.id] = "Informe o realizado ou marque “Sem medição”.";
        else if (!d?.sem && Number.isNaN(parseNum(d.valor))) er[i.id] = "Valor inválido.";
      });
      setErros(er);
      if (Object.keys(er).length) { toast.error(`${Object.keys(er).length} indicador(es) com pendência. Revise os campos destacados.`); return; }
    }
    setSalvando(true); setFeedback(enviar ? "Enviando…" : "Salvando rascunho…");
    try {
    const rows = daCadeira.filter((i) => !filhos(i.id).length).map((i) => {
      const d = rasc[i.id]; const v = parseNum(d?.valor ?? "");
      const av = parseNum(d?.avanco ?? ""); const tipo = tipoDe(i);
      return { indicador_id: i.id, competencia: comp, revisao: rev, valor: d?.sem || Number.isNaN(v) || tipo === "entrega" ? null : v, sem_medicao: !!d?.sem && tipo === "valor_mensal", comentario: d?.comentario || null, updated_by: b.user?.id,
        declaracao: tipo === "valor_periodo" ? d?.declaracao ?? null : null, justificativa: tipo === "valor_periodo" && d?.declaracao === "off" ? d.justificativa.trim() || null : null,
        status_entrega: tipo === "entrega" ? d?.status_entrega || null : null, avanco_pct: tipo === "entrega" && av != null && !Number.isNaN(av) ? Math.max(0, Math.min(100, av)) : null, evidencia: tipo === "entrega" ? d?.evidencia || null : null };
    });
    const r1 = rows.length ? await db.from("mt_lancamentos").upsert(rows, { onConflict: "indicador_id,competencia,revisao" }) : { error: null };
    if (r1.error) { setSalvando(false); setFeedback("Não foi possível salvar os indicadores."); toast.error(r1.error.message); return; }
    let falhas = 0;
    for (const i of iniciativas) {
      const n = ini[i.id];
      if (n && (n.status !== i.status || (n.prazo || null) !== i.prazo || (n.comentario || null) !== i.comentario)) {
        const { error } = await db.from("mt_iniciativas").update({ status: n.status, prazo: n.prazo || null, comentario: n.comentario || null }).eq("id", i.id);
        if (error) { toast.error(`Iniciativa “${i.titulo}”: ${error.message}`); falhas++; }
      }
    }
    const nome = b.perfis.find((p) => p.user_id === b.user?.id)?.display_name ?? b.user?.email ?? null;
    const env = {
      cadeira_id: cadeira, competencia: comp, revisao: rev,
      status: enviar ? "enviado" : envio?.status ?? "rascunho",
      ...(enviar ? { enviado_por: b.user?.id, enviado_por_nome: nome, enviado_em: new Date().toISOString() } : {}),
    };
    const r2 = await db.from("mt_envios").upsert(env, { onConflict: "cadeira_id,competencia,revisao" });
    setSalvando(false);
    if (r2.error) { setFeedback("Indicadores salvos; não foi possível registrar o envio."); toast.error(r2.error.message); return; }
    setFeedback(falhas ? `Indicadores salvos; ${falhas} iniciativa(s) não salva(s).` : enviar ? "Formulário enviado." : "Rascunho salvo.");
    if (!falhas) toast.success(enviar ? "Formulário enviado. Cadeira marcada como atualizada." : "Rascunho salvo.");
    await Promise.all([carregar(), b.reload()]);
    } catch (e: any) { setFeedback("Não foi possível concluir o salvamento."); toast.error(e?.message ?? "Não foi possível salvar"); }
    finally { setSalvando(false); }
  });

  const executar = async () => {
    const fn = confirmar === "fechar" ? "mt_fechar" : "mt_reabrir";
    setConfirmar(null);
    const { error } = await db.rpc(fn, { _comp: comp });
    if (error) toast.error(error.message); else { toast.success(fn === "mt_fechar" ? "Mês fechado." : "Mês reaberto em nova revisão."); carregar(); }
  };

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const secoes: { t: string; itens: Indicador[] }[] = [
    { t: "1. KPIs do BSC", itens: topo.filter((i) => i.origem === "bsc" && (i as any).nivel !== "Operacional") },
    { t: "2. KRs dos OKRs", itens: topo.filter((i) => i.origem === "okr") },
    { t: "3. Cesta de metas", itens: topo.filter((i) => i.origem === "cesta") },
  ];

  const Linha = ({ i, nivel = 0 }: { i: Indicador; nivel?: number }) => {
    const kids = filhos(i.id);
    const m = metaDe(i.id, comp);
    const d: Rascunho = rasc[i.id] ?? { valor: "", sem: false, comentario: "", declaracao: null, justificativa: "", status_entrega: "", avanco: "", evidencia: "" };
    const c = calc(i); const tipo = tipoDe(i); const av = avalDe(i);
    const idxComp = MESES_2S26.indexOf(comp);
    const anteriores = MESES_2S26.slice(0, idxComp).map((mm) => ({ mm, l: lancDe(i.id, mm) }));
    const ultimo = [...anteriores].reverse().find((x) => x.l);
    const set = (p: Partial<Rascunho>) => setRasc((r) => ({ ...r, [i.id]: { ...d, ...p } }));
    return (
      <div className={`border rounded-md p-3 space-y-3 ${nivel ? "ml-4 bg-muted/30" : ""} ${erros[i.id] ? "border-destructive" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{i.codigo}</span>
              <Badge variant="outline" className="uppercase text-[10px]">{i.origem}</Badge>
              <Badge variant="secondary" className="text-[10px]">{TIPO_LBL[tipo]}</Badge>
              <Badge variant="outline" className="text-[10px]">{i.sentido === "maior" ? "↑ maior é melhor" : "↓ menor é melhor"}</Badge>
              {kids.length > 0 && <Badge className="text-[10px]">Composto · {i.regra_consolidacao === "pior" ? "pior resultado" : "média ponderada"}</Badge>}
            </div>
            <p className="font-medium mt-1">{i.nome}{i.unidade ? <span className="text-muted-foreground font-normal"> ({i.unidade})</span> : null}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Avaliação{av.fonte === "declarado" ? " (declarada)" : ""}</p>
            <Badge variant={av.aval === "off" ? "destructive" : av.aval === "on" ? "default" : "outline"}>{AVALIACAO_LBL[av.aval]}</Badge>
            {tipo === "valor_mensal" && kids.length === 0 && c.mes != null && <p className="text-xs text-muted-foreground tabular-nums">atingimento {pct(c.mes)}</p>}
          </div>
        </div>

        {kids.length === 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div className="rounded bg-muted/50 p-2"><p className="text-xs text-muted-foreground">{tipo === "valor_mensal" ? "Meta mensal" : tipo === "entrega" ? "Prazo da entrega" : "Meta de referência do mês"}</p><p className="font-medium tabular-nums">{tipo === "entrega" ? (i.prazo_entrega ? new Date(i.prazo_entrega + "T12:00:00").toLocaleDateString("pt-BR") : "Sem prazo") : fmtNum(m?.meta_mes)}</p></div>
              <div className="rounded bg-muted/50 p-2"><p className="text-xs text-muted-foreground">Meta acumulada</p><p className="font-medium tabular-nums">{fmtNum(m?.meta_acumulada)}</p></div>
              <div className="rounded bg-muted/50 p-2"><p className="text-xs text-muted-foreground">Meta semestral/anual</p><p className="font-medium tabular-nums">{i.meta_semestre != null ? fmtNum(i.meta_semestre) : i.meta_texto || "—"}</p></div>
              <div className="rounded bg-muted/50 p-2"><p className="text-xs text-muted-foreground">Situação atual</p><p className="font-medium tabular-nums">{ultimo ? (ultimo.l!.sem_medicao ? "Sem medição" : fmtNum(ultimo.l!.valor)) + ` (${MES_CURTO[ultimo.mm.slice(5)]})` : "—"}</p></div>
            </div>
            {anteriores.length > 0 && (
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="text-muted-foreground mr-1">Histórico:</span>
                {anteriores.map(({ mm, l }) => (
                  <span key={mm} className="rounded border px-1.5 py-0.5 tabular-nums">{MES_CURTO[mm.slice(5)]}: {l ? (l.sem_medicao ? "s/ medição" : fmtNum(l.valor)) : "—"}</span>
                ))}
              </div>
            )}
            <div className="grid sm:grid-cols-[200px_1fr] gap-3">
              {tipo === "entrega" ? <div className="space-y-2">
                <Label htmlFor={`status-entrega-${i.id}`}>Status de entrega · obrigatório ao enviar</Label>
                <Select value={d.status_entrega || ""} disabled={!podeEditar} onValueChange={(v) => set({ status_entrega: v as StatusEntrega })}><SelectTrigger id={`status-entrega-${i.id}`} aria-describedby={erros[i.id] ? `erro-${i.id}` : undefined} aria-invalid={!!erros[i.id]}><SelectValue placeholder="Escolha" /></SelectTrigger>
                  <SelectContent>{(Object.keys(STATUS_ENTREGA_LBL) as StatusEntrega[]).map((x) => <SelectItem key={x} value={x}>{STATUS_ENTREGA_LBL[x]}</SelectItem>)}</SelectContent></Select>
                <Label htmlFor={`av-${i.id}`}>% de avanço (opcional)</Label>
                <Input id={`av-${i.id}`} inputMode="decimal" disabled={!podeEditar} value={d.avanco} onChange={(e) => set({ avanco: e.target.value })} />
                <Label htmlFor={`ev-${i.id}`}>Evidência</Label>
                <Input id={`ev-${i.id}`} maxLength={400} disabled={!podeEditar} value={d.evidencia} onChange={(e) => set({ evidencia: e.target.value })} />
              </div> : <div className="space-y-2">
                {tipo === "valor_periodo" && <>
                  <Label>Declaração do diretor no mês</Label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={d.declaracao === "on" ? "default" : "outline"} disabled={!podeEditar} onClick={() => set({ declaracao: d.declaracao === "on" ? null : "on" })}>On track</Button>
                    <Button type="button" size="sm" variant={d.declaracao === "off" ? "destructive" : "outline"} disabled={!podeEditar} onClick={() => set({ declaracao: d.declaracao === "off" ? null : "off" })}>Off track</Button>
                  </div>
                  {d.declaracao === "off" && <><Label htmlFor={`j-${i.id}`}>Justificativa (obrigatória)</Label><Textarea id={`j-${i.id}`} aria-required="true" aria-invalid={!!erros[i.id]} aria-describedby={erros[i.id] ? `erro-${i.id}` : undefined} rows={2} disabled={!podeEditar} value={d.justificativa} onChange={(e) => set({ justificativa: e.target.value })} /></>}
                </>}
                <Label htmlFor={`v-${i.id}`}>{tipo === "valor_mensal" ? "Valor apontado — realizado do mês" : "Valor apontado — situação atual (opcional)"}</Label>
                <Input id={`v-${i.id}`} aria-describedby={erros[i.id] ? `erro-${i.id}` : undefined} aria-invalid={!!erros[i.id]} inputMode="decimal" placeholder="Ex.: 1.234,56" disabled={!podeEditar || d.sem}
                  value={d.sem ? "" : d.valor} onChange={(e) => set({ valor: e.target.value })} />
                <div className="flex items-center gap-2">
                  <Checkbox id={`s-${i.id}`} checked={d.sem} disabled={!podeEditar} onCheckedChange={(v) => set({ sem: !!v })} />
                  <Label htmlFor={`s-${i.id}`} className="text-sm font-normal">Sem medição</Label>
                </div>
                {tipo === "valor_mensal" && (c.mes != null || c.dez != null) ? (
                  <p className="text-xs text-muted-foreground">Mês: {pct(c.mes)} · Acumulado vs. Dez: {pct(c.dez)}</p>
                ) : null}
              </div>}
              <div className="space-y-2">
                <Label htmlFor={`c-${i.id}`}>Análise / comentário</Label>
                <Textarea id={`c-${i.id}`} rows={3} disabled={!podeEditar} value={d.comentario} onChange={(e) => set({ comentario: e.target.value })} />
              </div>
            </div>
            {erros[i.id] && <p id={`erro-${i.id}`} role="alert" className="text-sm text-destructive">{erros[i.id]}</p>}
          </>
        )}
        {kids.map((k) => <div key={k.id}>{Linha({ i: k, nivel: nivel + 1 })}</div>)}
      </div>
    );
  };

  const Secao = ({ t, n, children }: { t: string; n: number; children: React.ReactNode }) => (
    <details open className="group rounded-lg border bg-card">
      <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold list-none">
        <span>{t} <span className="text-muted-foreground font-normal">({n})</span></span>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 px-4 pb-4">{n === 0 ? <p className="text-sm text-muted-foreground">Nenhum item nesta seção.</p> : children}</div>
    </details>
  );

  return (
    <div className="space-y-4 pb-24">
      <Card className="p-4 sm:p-5 border-primary/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Competência</p>
            <h1 className="text-2xl font-bold">Lançamento de Metas – {tituloComp(comp)}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={fechado ? "destructive" : "default"}>{fechado ? "Fechado" : compRow?.estado === "reaberto" ? "Reaberto" : "Aberto"}</Badge>
              {rev > 0 && <Badge variant="outline">Rev. {rev}</Badge>}
              <Badge variant={envio?.status === "enviado" ? "default" : "secondary"}>
                {envio?.status === "enviado" ? `Atualizada · ${new Date(envio.enviado_em!).toLocaleDateString("pt-BR")}` : envio ? "Rascunho" : "Não atualizada"}
              </Badge>
              {!podeEditar && !fechado && <Badge variant="outline">Somente consulta</Badge>}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground max-w-[260px]">Sem nota mensal: cada indicador é avaliado pelo seu tipo (valor mensal, meta semestral/anual declarada ou entrega).</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="space-y-1">
            <Label htmlFor="mensal-competencia">Competência</Label>
            <Select value={comp} onValueChange={setComp}>
              <SelectTrigger id="mensal-competencia"><SelectValue /></SelectTrigger>
              <SelectContent>{MESES_2S26.map((m) => <SelectItem key={m} value={m}>{tituloComp(m)}{comps.find((c) => c.competencia === m)?.estado === "fechado" ? " · fechado" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mensal-cadeira">Cadeira</Label>
            <Select value={cadeira ?? undefined} onValueChange={setCadeira}>
              <SelectTrigger id="mensal-cadeira"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{b.cadeiras.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}{c.diretor_nome ? ` · ${c.diretor_nome}` : ""}{c.id === b.minhaCadeira ? " (minha)" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {fechado && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4" /> Mês fechado: lançamentos bloqueados para todos. Só a Governança pode reabrir.</p>}
        {b.isGov && (
          <div className="mt-3 flex gap-2">
            {fechado
              ? <Button variant="outline" size="sm" onClick={() => setConfirmar("reabrir")}><Unlock className="h-4 w-4 mr-1" /> Reabrir mês</Button>
              : <Button variant="outline" size="sm" onClick={() => setConfirmar("fechar")}><Lock className="h-4 w-4 mr-1" /> Fechar mês</Button>}
          </div>
        )}
      </Card>

      {secoes.map((s) => <div key={s.t}>{Secao({ t: s.t, n: s.itens.length, children: s.itens.map((i) => <div key={i.id}>{Linha({ i })}</div>) })}</div>)}

      {Secao({ t: "5. Iniciativas vinculadas", n: iniciativas.length, children: <>
        {iniciativas.map((i) => {
          const n = ini[i.id] ?? { status: i.status, prazo: i.prazo ?? "", comentario: i.comentario ?? "" };
          const set = (p: Partial<typeof n>) => setIni((x) => ({ ...x, [i.id]: { ...n, ...p } }));
          const ef = statusEfetivo({ status: n.status as any, prazo: n.prazo || null });
          return (
            <div key={i.id} className="border rounded-md p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{i.titulo}</p>
                <Badge variant={ef === "atrasada" ? "destructive" : "outline"}>{STATUS_INI[ef]}</Badge>
              </div>
              <div className="grid sm:grid-cols-[180px_170px_1fr] gap-2">
                <div className="space-y-1"><Label>Status</Label>
                  <Select value={n.status} onValueChange={(v) => set({ status: v })} disabled={!podeEditar}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["a_iniciar", "em_andamento", "concluida", "cancelada"].map((s) => <SelectItem key={s} value={s}>{STATUS_INI[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label htmlFor={`p-${i.id}`}>Prazo</Label><Input id={`p-${i.id}`} type="date" disabled={!podeEditar} value={n.prazo} onChange={(e) => set({ prazo: e.target.value })} /></div>
                <div className="space-y-1"><Label htmlFor={`ic-${i.id}`}>Comentário</Label><Textarea id={`ic-${i.id}`} rows={2} disabled={!podeEditar} value={n.comentario} onChange={(e) => set({ comentario: e.target.value })} /></div>
              </div>
            </div>
          );
        })}
      </> })}

      <p className="text-xs text-muted-foreground">O status report dos projetos agora é enviado no último checkout do mês (Rotina Semanal).</p>

      {podeEditar && (
        <div className="sticky bottom-0 z-30 border-t bg-background p-3 pr-16">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-2">
            <span className="mr-auto text-xs text-muted-foreground" role="status" aria-live="polite">{feedback || "Salvar rascunho não envia o formulário."}</span>
            <Button variant="outline" disabled={salvando} onClick={() => gravar(false)}><Save className="h-4 w-4 mr-1" /> {salvando ? "Salvando…" : "Salvar rascunho"}</Button>
            <Button disabled={salvando} onClick={() => gravar(true)}><Send className="h-4 w-4 mr-1" /> Enviar</Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmar} onOpenChange={(o) => !o && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmar === "fechar" ? `Fechar ${tituloComp(comp)}?` : `Reabrir ${tituloComp(comp)}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmar === "fechar"
                ? "Depois de fechado, ninguém consegue lançar nesta competência, inclusive o CEO. Só a Governança pode reabrir."
                : `Será criada a Rev. ${rev + 1}. Os valores e análises do fechamento anterior continuam guardados.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executar}>{confirmar === "fechar" ? "Sim, fechar mês" : "Sim, reabrir"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
