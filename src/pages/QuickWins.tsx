import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownWideNarrow, Download, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AbasPagina, { type Aba } from "@/components/AbasPagina";
import { FormField } from "@/components/FormField";
import { SaveFeedback, type SaveState } from "@/components/SaveFeedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useQwPerfil } from "@/hooks/useQuickWins";
import {
  CARGOS, CRITERIOS_CURTOS, EXECUCAO, EXPLICACAO, ICE_LEGENDA, PERGUNTA, QW_LIMITE_ITENS, ROTULOS, TITULO_EXPLICACAO, TRIAGEM,
  ativos, camposFaltando, comentarioObrigatorio, contagem, csv, custoTexto, faixaIce, formatarIce, iceScore, indicadores, linhaVazia, podeEditarItem, tituloAutomatico,
  type LinhaForm, type LinhaPainel, type QwItem, type StatusExecucao,
} from "@/lib/quickWins";

const db = supabase as any;
type Ciclo = { id: string; ano: number; status: string; data_abertura: string | null; data_fechamento: string | null; limite_investimento: number; prazo_max_dias: number };
type Lider = { id: string; user_id: string | null; email: string; nome: string; cargo: string; cadeira_id: string | null; diretor_user_id: string | null; diretor_lider_id: string | null; triagem_governanca: boolean; ativo: boolean; revisao_pendente: boolean };
type Envio = { id: string; ciclo_id: string; lider_id: string; status: "rascunho" | "enviado"; enviado_em: string | null; aguardando_diretor: boolean };
type Area = { id: string; area_rotulo: string; ativo: boolean; diretor_user_id: string | null; diretor_lider_id: string | null; diretor_efetivo: string | null; diretor: string | null };
type Ctx = { itens_triaveis: string[]; diretores_lideres: { id: string; nome: string; user_id: string | null }[]; lideres: { id: string; cadeira: string | null; diretor: string | null; diretor_efetivo: string | null; aguardando_diretor: boolean; areas: Area[] }[]; cadeiras: { id: string; nome: string }[]; diretores: { user_id: string; nome: string }[] };

const dataBR = (d: string | null) => (d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");
const erro = (e: any) => toast({ title: "Não foi possível concluir", description: e?.message ?? String(e), variant: "destructive" });

function useDados() {
  return useQuery({
    queryKey: ["qw-dados"],
    queryFn: async () => {
      const [c, l, e, i, o, ctx] = await Promise.all([
        db.from("qw_ciclos").select("*").order("ano", { ascending: false }),
        db.from("qw_lideres").select("*").order("nome"),
        db.from("qw_envios").select("*"),
        db.from("qw_itens").select("*").order("ordem"),
        db.from("mt_objetivos").select("id,codigo,descricao").order("codigo"),
        db.rpc("qw_contexto"),
      ]);
      for (const r of [c, l, e, i, ctx]) if (r.error) throw r.error;
      const objetivos: Record<string, string> = {};
      for (const x of o.data ?? []) objetivos[x.id] = `${x.codigo} · ${x.descricao}`;
      return { ciclos: c.data as Ciclo[], lideres: l.data as Lider[], envios: e.data as Envio[], itens: i.data as QwItem[], objetivos, ctx: ctx.data as Ctx };
    },
  });
}

function Seletor<T extends string>({ id, value, onChange, opcoes, disabled, placeholder = "Selecione" }: { id?: string; value: T | ""; onChange: (v: T) => void; opcoes: Record<string, string>; disabled?: boolean; placeholder?: string }) {
  return <Select value={value || undefined} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
    <SelectTrigger id={id}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{Object.entries(opcoes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
  </Select>;
}

function Execucao({ item, aoSalvar }: { item: QwItem; aoSalvar: () => void }) {
  const [st, setSt] = useState<StatusExecucao>(item.status_execucao);
  const [res, setRes] = useState(item.resultado_medido ?? "");
  const salvar = async () => { const { error } = await db.rpc("qw_atualizar_execucao", { _item: item.id, _status: st, _resultado: res }); if (error) return erro(error); toast({ title: "Execução atualizada" }); aoSalvar(); };
  return <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[200px_1fr_auto] md:items-end">
    <FormField id={`ex-${item.id}`} label="Execução"><Seletor<StatusExecucao> value={st} onChange={setSt} opcoes={EXECUCAO} /></FormField>
    <FormField id={`res-${item.id}`} label="Resultado medido" required={st === "concluido"}><Input value={res} onChange={(e) => setRes(e.target.value)} /></FormField>
    <Button size="sm" onClick={salvar}>Salvar</Button>
  </div>;
}

function StatusItem({ i }: { i: QwItem }) {
  return <div className="flex flex-wrap gap-1.5">
    <Badge variant="outline">{TRIAGEM[i.status_triagem]}</Badge>
    {i.status_triagem === "aprovado" && <Badge variant="outline">{EXECUCAO[i.status_execucao]}</Badge>}
  </div>;
}

type LinhaEstado = LinhaForm & { id?: string };
const NOTAS = { "1": "1", "2": "2", "3": "3", "4": "4", "5": "5" };
const CUSTO = { nao: "Não", sim: "Sim" };
const linhaDe = (i?: QwItem): LinhaEstado => i ? { id: i.id, acao_proposta: i.acao_proposta ?? "", observacao: i.observacao ?? "", investimento_estimado: i.investimento_estimado ?? "", tem_custo: i.tem_custo ?? null, ice_impacto: i.ice_impacto ?? null, ice_confianca: i.ice_confianca ?? null, ice_facilidade: i.ice_facilidade ?? null, area_rotulo: i.area_rotulo ?? "" }
  : { acao_proposta: "", observacao: "", investimento_estimado: "", tem_custo: null, ice_impacto: null, ice_confianca: null, ice_facilidade: null, area_rotulo: "" };
const COR_ICE = { alto: "bg-success-soft text-success", medio: "bg-warning-soft text-warning", baixo: "bg-muted text-muted-foreground" };

function SeloIce({ i }: { i: Partial<QwItem> }) {
  const s = iceScore(i);
  return <span className={`inline-flex min-w-10 justify-center rounded-full px-2 py-1 text-sm font-semibold ${s == null ? "text-muted-foreground" : COR_ICE[faixaIce(s)]}`} aria-label={`ICE ${formatarIce(s)}`}>{formatarIce(s)}</span>;
}

function Formulario({ d, liderId, recarregar }: { d: NonNullable<ReturnType<typeof useDados>["data"]>; liderId: string | null; recarregar: () => void }) {
  const lider = liderId ? d.lideres.find((l) => l.id === liderId) : undefined;
  const previa = !lider;
  const ctx = liderId ? d.ctx.lideres.find((l) => l.id === liderId) : undefined;
  const cicloAberto = d.ciclos.find((c) => c.status === "aberto");
  const ciclo = cicloAberto ?? (lider ? d.ciclos.find((c) => c.status === "fechado") : undefined);
  const envio = ciclo && lider ? d.envios.find((e) => e.ciclo_id === ciclo.id && e.lider_id === lider.id) : undefined;
  const lista = envio ? ativos(d.itens.filter((i) => i.envio_id === envio.id)).sort((x, y) => x.ordem - y.ordem) : [];
  const chave = lista.map((i) => `${i.id}:${i.status_triagem}:${i.acao_proposta}:${i.observacao}:${i.tem_custo}:${i.ice_impacto}${i.ice_confianca}${i.ice_facilidade}:${i.investimento_estimado}:${i.area_rotulo}`).join("|");
  return <div className="space-y-4">
    {previa && <p className="border-l-4 border-primary bg-muted p-3 text-sm" role="status"><strong>Prévia — é assim que as lideranças veem o formulário.</strong> Somente leitura.</p>}
    {!cicloAberto && <p className="border-l-4 border-warning bg-warning/10 p-3 text-sm" role="status">O ciclo de Quick Wins ainda não foi aberto.</p>}
    {ctx?.aguardando_diretor && <p className="text-sm text-warning" role="status">Diretor pendente. Você pode preencher e enviar; a Governança acompanha o encaminhamento.</p>}
    <Card><CardContent className="space-y-3 pt-6 text-sm">
      <h2 className="text-lg font-semibold">{TITULO_EXPLICACAO}</h2>
      <p>{EXPLICACAO}</p>
      <p><span className="text-muted-foreground">Critérios:</span> {CRITERIOS_CURTOS.join(" · ").toLowerCase()}</p>
      {lider && <p><span className="text-muted-foreground">Respondendo como:</span> <strong>{lider.nome} · {CARGOS[lider.cargo] ?? lider.cargo}</strong></p>}
      {ciclo?.data_fechamento && <p><span className="text-muted-foreground">Prazo:</span> <strong>{dataBR(ciclo.data_fechamento)}</strong></p>}
    </CardContent></Card>
    <p className="text-lg font-semibold">{PERGUNTA}</p>
    <TabelaQuickWins key={chave} lista={lista} envio={envio} aberto={!!cicloAberto && ciclo?.status === "aberto"} previa={previa} cicloId={ciclo?.id} liderId={lider?.id}
      areas={ctx?.areas.filter((a) => a.ativo) ?? []} aguardandoDiretor={!!ctx?.aguardando_diretor} cicloArquivado={ciclo?.status === "arquivado"} recarregar={recarregar} />
  </div>;
}

function TabelaQuickWins({ lista, envio, aberto, previa, cicloId, liderId, areas, aguardandoDiretor, cicloArquivado, recarregar }: { lista: QwItem[]; envio?: Envio; aberto: boolean; previa: boolean; cicloId?: string; liderId?: string; areas: Area[]; aguardandoDiretor: boolean; cicloArquivado: boolean; recarregar: () => void }) {
  const [linhas, setLinhas] = useState<LinhaEstado[]>(() => Array.from({ length: QW_LIMITE_ITENS }, (_, n) => linhaDe(lista[n])));
  const [estado, setEstado] = useState<SaveState>({ estado: "ocioso" });
  const [busy, setBusy] = useState(false);
  const porId = (id?: string) => lista.find((i) => i.id === id);
  const multiArea = areas.length > 1;
  const rascunho = !envio || envio.status === "rascunho";
  const editavel = (l: LinhaEstado) => { if (previa || !aberto) return false; const it = porId(l.id); return it ? podeEditarItem(envio?.status ?? "rascunho", it, aberto) : rascunho; };
  const set = (n: number, k: keyof LinhaForm, v: unknown) => { setLinhas((p) => p.map((l, i) => (i === n ? { ...l, [k]: v } : l))); setEstado({ estado: "alterado" }); };
  const salvarTudo = async () => {
    for (const l of linhas) {
      if (!editavel(l)) continue;
      if (linhaVazia(l)) { if (l.id && rascunho) { const { error } = await db.rpc("qw_cancelar_item", { _id: l.id }); if (error) throw error; } continue; }
      const dados: Record<string, unknown> = { acao_proposta: l.acao_proposta, titulo: tituloAutomatico(l.acao_proposta ?? ""), observacao: l.observacao, tem_custo: l.tem_custo, investimento_estimado: l.tem_custo ? l.investimento_estimado ?? "" : "", ice_impacto: l.ice_impacto, ice_confianca: l.ice_confianca, ice_facilidade: l.ice_facilidade };
      if (multiArea) dados.area_rotulo = l.area_rotulo ?? "";
      const { error } = await db.rpc("qw_salvar_item", { _id: l.id ?? null, _dados: dados });
      if (error) throw error;
    }
  };
  const salvar = async () => {
    setBusy(true); setEstado({ estado: "salvando" });
    try { await salvarTudo(); setEstado({ estado: "salvo", em: new Date() }); recarregar(); }
    catch (e: any) { setEstado({ estado: "erro", erro: e.message }); erro(e); } finally { setBusy(false); }
  };
  const preenchidas = linhas.filter((l) => !linhaVazia(l));
  const enviar = async () => {
    const incompletas = preenchidas.filter((l) => camposFaltando(l as Partial<QwItem>, multiArea).length).length;
    if (!preenchidas.length) return erro({ message: "Preencha ao menos 1 iniciativa para enviar." });
    if (incompletas) return erro({ message: `Há ${incompletas} linha(s) com campos obrigatórios em branco (destacados em vermelho).` });
    if (!window.confirm(`Enviar ${preenchidas.length} quick win(s) ao seu diretor?`)) return;
    setBusy(true);
    try {
      await salvarTudo();
      let id = envio?.id;
      if (!id) { const r = await db.from("qw_envios").select("id").eq("ciclo_id", cicloId).eq("lider_id", liderId).maybeSingle(); if (r.error) throw r.error; id = r.data?.id; }
      const { error } = await db.rpc("qw_enviar", { _envio: id }); if (error) throw error;
      toast({ title: aguardandoDiretor ? "Enviado · aguardando diretor" : "Envio registrado" }); recarregar();
    } catch (e) { erro(e); } finally { setBusy(false); }
  };
  const algumEditavel = linhas.some(editavel);
  const podeEnviar = !previa && aberto && (rascunho || lista.some((i) => ["ajustar", "devolvido"].includes(i.status_triagem)));
  const inv = "border-destructive ring-1 ring-destructive";
  const rotulo = "text-xs font-medium text-muted-foreground lg:sr-only";
  return <div className="space-y-3">
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <strong>Critérios ICE (1 = baixo, 5 = alto):</strong>{" "}
      {Object.values(ICE_LEGENDA).map(([n, t]) => <span key={n} className="mr-3 inline-block"><strong>{n}</strong> — {t.toLowerCase()}</span>)}
      <span className="inline-block">· <strong>ICE</strong> = média dos três</span>
    </div>
    {envio && <p className="text-sm">{contagem(lista)} · envio: {envio.status === "enviado" ? `enviado em ${new Date(envio.enviado_em ?? "").toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "rascunho"} {envio.aguardando_diretor && <Badge variant="outline">Aguardando diretor</Badge>}</p>}
    <div className="hidden gap-2 rounded-t-md bg-muted px-2 py-2 text-xs font-semibold lg:grid lg:grid-cols-[2rem_1.2fr_1.5fr_9rem_4.5rem_4.5rem_4.5rem_3.5rem]" aria-hidden>
      <span>#</span><span>Iniciativa</span><span>Justificativa</span><span>Tem custo?</span><span title={ICE_LEGENDA.ice_impacto[1]}>Impacto</span><span title={ICE_LEGENDA.ice_confianca[1]}>Confiança</span><span title={ICE_LEGENDA.ice_facilidade[1]}>Facilidade</span><span>ICE</span>
    </div>
    <ol className="space-y-3 lg:space-y-0">{linhas.map((l, n) => {
      const it = porId(l.id); const ed = editavel(l); const falta = linhaVazia(l) ? [] : camposFaltando(l as Partial<QwItem>, multiArea);
      const err = (k: string) => (ed && falta.includes(k) ? inv : "");
      const id = `qw-l${n + 1}`;
      return <li key={n} className="rounded-md border p-3 lg:rounded-none lg:border-x lg:border-t-0 lg:p-2">
        <div className="grid gap-2 lg:grid-cols-[2rem_1.2fr_1.5fr_9rem_4.5rem_4.5rem_4.5rem_3.5rem] lg:items-start">
          <span className="font-semibold">{n + 1}</span>
          <div><label htmlFor={`${id}-ini`} className={rotulo}>Iniciativa</label><Textarea id={`${id}-ini`} rows={2} className={err("acao_proposta")} aria-invalid={!!err("acao_proposta")} value={l.acao_proposta ?? ""} onChange={(e) => set(n, "acao_proposta", e.target.value)} disabled={!ed} placeholder="O que fazer" /></div>
          <div><label htmlFor={`${id}-jus`} className={rotulo}>Justificativa</label><Textarea id={`${id}-jus`} rows={2} className={err("observacao")} aria-invalid={!!err("observacao")} value={l.observacao ?? ""} onChange={(e) => set(n, "observacao", e.target.value)} disabled={!ed} placeholder="Que problema resolve ou que ganho gera?" /></div>
          <div className="space-y-1"><label htmlFor={`${id}-custo`} className={rotulo}>Tem custo?</label>
            <div className={`rounded-md ${err("tem_custo")}`}><Seletor id={`${id}-custo`} value={l.tem_custo == null ? "" : l.tem_custo ? "sim" : "nao"} onChange={(v) => set(n, "tem_custo", v === "sim")} opcoes={CUSTO} disabled={!ed} /></div>
            {l.tem_custo && <><label htmlFor={`${id}-valor`} className="text-xs font-medium text-muted-foreground">Valor estimado (R$)</label><Input id={`${id}-valor`} className={err("investimento_estimado")} aria-invalid={!!err("investimento_estimado")} value={l.investimento_estimado ?? ""} onChange={(e) => set(n, "investimento_estimado", e.target.value)} disabled={!ed} placeholder="Ex.: R$ 2 mil" /></>}
          </div>
          <div className="grid grid-cols-3 gap-2 lg:contents">{(["ice_impacto", "ice_confianca", "ice_facilidade"] as const).map((k) => <div key={k}>
            <label htmlFor={`${id}-${k}`} className={rotulo} title={ICE_LEGENDA[k][1]}>{ICE_LEGENDA[k][0]}</label>
            <div className={`rounded-md ${err(k)}`}><Seletor id={`${id}-${k}`} value={l[k] == null ? "" : String(l[k])} onChange={(v) => set(n, k, Number(v))} opcoes={NOTAS} disabled={!ed} placeholder="–" /></div>
          </div>)}</div>
          <div className="flex items-center gap-2 lg:block"><span className={rotulo}>ICE</span><SeloIce i={l} /></div>
        </div>
        {(multiArea || it) && <div className="mt-2 space-y-2 lg:pl-10">
          {multiArea && <div className="max-w-xs"><label htmlFor={`${id}-area`} className="text-xs font-medium text-muted-foreground">Área</label><div className={`rounded-md ${err("area_rotulo")}`}><Seletor id={`${id}-area`} value={l.area_rotulo ?? ""} onChange={(v) => set(n, "area_rotulo", v)} opcoes={Object.fromEntries(areas.map((a) => [a.area_rotulo, a.area_rotulo]))} disabled={!ed} /></div></div>}
          {it && envio?.status === "enviado" && <StatusItem i={it} />}
          {it?.comentario_diretor && <p className="rounded-md bg-muted p-2 text-sm"><strong>Comentário do diretor:</strong> {it.comentario_diretor}</p>}
          {it && it.status_triagem === "aprovado" && !cicloArquivado && !previa && <Execucao item={it} aoSalvar={recarregar} />}
        </div>}
        {ed && falta.length > 0 && <p className="mt-1 text-xs text-destructive">Faltam campos obrigatórios nesta linha.</p>}
      </li>;
    })}</ol>
    {algumEditavel && <div className="flex flex-wrap items-center justify-between gap-2">
      <SaveFeedback state={estado} onRetry={salvar} />
      <div className="flex gap-2">
        <Button variant="outline" onClick={salvar} disabled={busy}>Salvar rascunho</Button>
        {podeEnviar && <Button onClick={enviar} disabled={busy || !preenchidas.length}><Send className="mr-1 h-4 w-4" />Enviar ao diretor</Button>}
      </div>
    </div>}
  </div>;
}

function Triagem({ d, recarregar, filtroDiretor }: { d: NonNullable<ReturnType<typeof useDados>["data"]>; recarregar: () => void; filtroDiretor?: string }) {
  const [coment, setComent] = useState<Record<string, string>>({});
  const ciclo = d.ciclos.find((c) => c.status === "aberto");
  const lideres = d.lideres.filter((l) => !filtroDiretor || d.ctx.lideres.find((c) => c.id === l.id)?.diretor_efetivo === filtroDiretor);
  const triar = async (id: string, acao: "aprovar" | "ajustar" | "devolver" | "converter") => {
    if (comentarioObrigatorio(acao) && !(coment[id] ?? "").trim()) return erro({ message: "Comentário obrigatório para esta ação." });
    const { error } = await db.rpc("qw_triar", { _item: id, _acao: acao, _comentario: coment[id] ?? "" }); if (error) return erro(error);
    toast({ title: "Triagem registrada" }); recarregar();
  };
  if (!ciclo) return <p className="text-sm text-muted-foreground">Nenhum ciclo aberto para triagem.</p>;
  const envios = d.envios.filter((e) => e.ciclo_id === ciclo.id && e.status === "enviado" && lideres.some((l) => l.id === e.lider_id) && d.itens.some((i) => i.envio_id === e.id && d.ctx.itens_triaveis.includes(i.id)));
  if (!envios.length) return <p className="text-sm text-muted-foreground">Nenhum envio recebido neste ciclo.</p>;
  return <div className="space-y-4">{envios.map((e) => { const l = d.lideres.find((x) => x.id === e.lider_id); if (!l) return null; return <Card key={e.id}>
    <CardHeader><CardTitle className="text-base">{l.nome} · {CARGOS[l.cargo]}</CardTitle></CardHeader>
    <CardContent className="space-y-3">{ativos(d.itens.filter((i) => i.envio_id === e.id && d.ctx.itens_triaveis.includes(i.id))).map((i) => <div key={i.id} className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>#{i.ordem}{i.area_rotulo && ` · ${i.area_rotulo}`}</strong><StatusItem i={i} /></div>
      <p className="text-sm"><span className="text-muted-foreground">{ROTULOS.acao_proposta}:</span> {i.acao_proposta}</p>
      <p className="text-sm"><span className="text-muted-foreground">{ROTULOS.observacao}:</span> {i.observacao}</p>
      <p className="text-sm"><span className="text-muted-foreground">Tem custo?</span> {custoTexto(i)}{i.tem_custo && ` · ${i.investimento_estimado || "valor não informado"}`}</p>
      <p className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">ICE:</span> I {i.ice_impacto ?? "—"} · C {i.ice_confianca ?? "—"} · F {i.ice_facilidade ?? "—"} <SeloIce i={i} /></p>
      {i.status_triagem === "pendente" && <>
        <FormField id={`com-${i.id}`} label="Comentário (obrigatório exceto para aprovar)"><Textarea rows={2} value={coment[i.id] ?? ""} onChange={(ev) => setComent((p) => ({ ...p, [i.id]: ev.target.value }))} /></FormField>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => triar(i.id, "aprovar")}>Aprovar</Button>
          <Button size="sm" variant="outline" onClick={() => triar(i.id, "ajustar")}>Pedir ajuste</Button>
          <Button size="sm" variant="outline" onClick={() => triar(i.id, "devolver")}>Devolver</Button>
          <Button size="sm" variant="outline" onClick={() => triar(i.id, "converter")}>Converter em iniciativa</Button>
        </div></>}
    </div>)}</CardContent></Card>; })}</div>;
}

function Painel({ d }: { d: NonNullable<ReturnType<typeof useDados>["data"]> }) {
  const anos = d.ciclos.map((c) => String(c.ano));
  const [f, setF] = useState<Record<string, string>>({ ano: anos[0] ?? "", cadeira: "todos", cargo: "todos", triagem: "todos", execucao: "todos" });
  const ciclo = d.ciclos.find((c) => String(c.ano) === f.ano);
  const cadeira = (id: string) => d.ctx.lideres.find((l) => l.id === id)?.cadeira ?? "—";
  const lideres = d.lideres.filter((l) => l.ativo && (f.cadeira === "todos" || cadeira(l.id) === f.cadeira) && (f.cargo === "todos" || l.cargo === f.cargo));
  const envios = d.envios.filter((e) => e.ciclo_id === ciclo?.id && lideres.some((l) => l.id === e.lider_id));
  const linhas: LinhaPainel[] = useMemo(() => d.itens.filter((i) => envios.some((e) => e.id === i.envio_id && e.status === "enviado"))
    .filter((i) => (f.triagem === "todos" || i.status_triagem === f.triagem) && (f.execucao === "todos" || i.status_execucao === f.execucao))
    .map((i) => { const e = envios.find((x) => x.id === i.envio_id); const l = d.lideres.find((x) => x.id === e?.lider_id); return { item: i, lider: { id: l?.id ?? "", nome: l?.nome ?? "—", cargo: l?.cargo ?? "", cadeira: cadeira(l?.id ?? "") }, enviado: true }; }), [d, f, envios]);
  const [ordenarIce, setOrdenarIce] = useState(false);
  const visiveis = ordenarIce ? [...linhas].sort((a, b) => (iceScore(b.item) ?? -1) - (iceScore(a.item) ?? -1)) : linhas;
  const ind = indicadores(lideres.length, envios.filter((e) => e.status === "enviado").length, linhas.map((x) => x.item), d.objetivos);
  const cadeiras = Object.fromEntries([...new Set(d.ctx.lideres.map((l) => l.cadeira).filter((c): c is string => Boolean(c)))].map((c) => [c, c]));
  const filtro = (k: string, label: string, opcoes: Record<string, string>) => <FormField id={`f-${k}`} label={label}><Seletor value={f[k]} onChange={(v) => setF((p) => ({ ...p, [k]: v }))} opcoes={k === "ano" ? opcoes : { todos: "Todos", ...opcoes }} /></FormField>;
  const exportar = () => { const b = new Blob([csv(linhas)], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `quick-wins-${f.ano}.csv`; a.click(); };
  return <div className="space-y-4">
    <PendenciasDiretor d={d} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {filtro("ano", "Ano", Object.fromEntries(anos.map((a) => [a, a])))}{filtro("cadeira", "Diretoria / cadeira", cadeiras)}{filtro("cargo", "Cargo", CARGOS)}
      {filtro("triagem", "Triagem", TRIAGEM)}{filtro("execucao", "Execução", EXECUCAO)}
      <div className="flex items-end"><Button variant="outline" onClick={exportar}><Download className="mr-1 h-4 w-4" />Exportar CSV</Button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[["Líderes que enviaram", `${ind.pctEnviaram}%`], ["Quick wins enviados", ind.total], ["Aprovados", `${ind.pctAprovados}%`], ["Concluídos com resultado medido", `${ind.pctConcluidos}%`]].map(([k, v]) =>
        <Card key={k as string}><CardContent className="pt-6"><div className="text-2xl font-semibold">{v}</div><div className="text-sm text-muted-foreground">{k}</div></CardContent></Card>)}
    </div>
    <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Líder", "Área", ROTULOS.acao_proposta, ROTULOS.observacao, "Tem custo", "Valor", "I", "C", "F"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}
        <th className="p-2 text-left" aria-sort={ordenarIce ? "descending" : "none"}><button type="button" className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline" onClick={() => setOrdenarIce((v) => !v)} aria-pressed={ordenarIce}>ICE<ArrowDownWideNarrow className="h-3.5 w-3.5" /></button></th>
        {["Triagem", "Execução"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
      <tbody>{visiveis.map(({ item: i, lider: l }) => <tr key={i.id} className="border-t"><td className="p-2">{l.nome}</td><td className="p-2">{i.area_rotulo ?? "—"}</td><td className="p-2">{i.acao_proposta}</td><td className="p-2">{i.observacao}</td><td className="p-2">{custoTexto(i)}</td><td className="p-2">{i.tem_custo ? i.investimento_estimado || "—" : "—"}</td><td className="p-2">{i.ice_impacto ?? "—"}</td><td className="p-2">{i.ice_confianca ?? "—"}</td><td className="p-2">{i.ice_facilidade ?? "—"}</td><td className="p-2"><SeloIce i={i} /></td><td className="p-2">{TRIAGEM[i.status_triagem]}</td><td className="p-2">{EXECUCAO[i.status_execucao]}</td></tr>)}</tbody></table></div>
  </div>;
}

function Administracao({ d, recarregar }: { d: NonNullable<ReturnType<typeof useDados>["data"]>; recarregar: () => void }) {
  const [novo, setNovo] = useState({ email: "", nome: "", cargo: "coordenador", cadeira_id: "", diretor_user_id: "", diretor_lider_id: "" });
  const rpc = async (fn: string, args: object, ok: string) => { const { error } = await db.rpc(fn, args); if (error) return erro(error); toast({ title: ok }); recarregar(); };
  const cadeiras = Object.fromEntries(d.ctx.cadeiras.map((c) => [c.id, c.nome]));
  const diretores = opcoesDiretor(d.ctx);
  return <div className="space-y-6">
    <PendenciasDiretor d={d} />
    <Card><CardHeader><CardTitle className="text-base">Ciclos anuais</CardTitle></CardHeader><CardContent className="space-y-3">
      {d.ciclos.map((c) => <CicloLinha key={c.id} c={c} rpc={rpc} />)}
      <Button variant="outline" size="sm" onClick={() => { const ano = window.prompt("Ano do novo ciclo"); if (ano) rpc("qw_ciclo_salvar", { _id: null, _dados: { ano: Number(ano) } }, "Ciclo criado em rascunho"); }}>Novo ciclo</Button>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Líderes cadastrados</CardTitle></CardHeader><CardContent className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <FormField id="nl-email" label="E-mail corporativo" required><Input value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} placeholder="nome@liberdademedicaedu.com.br" /></FormField>
        <FormField id="nl-nome" label="Nome" required><Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></FormField>
        <FormField id="nl-cargo" label="Cargo" required><Seletor value={novo.cargo} onChange={(v) => setNovo({ ...novo, cargo: v })} opcoes={CARGOS} /></FormField>
        <FormField id="nl-cad" label="Cadeira"><Seletor value={novo.cadeira_id} onChange={(v) => setNovo({ ...novo, cadeira_id: v })} opcoes={cadeiras} /></FormField>
        <FormField id="nl-dir" label="Diretor"><Seletor value={valorDiretor(novo)} onChange={(v) => setNovo({ ...novo, ...dadosDiretor(v) })} opcoes={diretores} /></FormField>
        <div className="flex items-end"><Button onClick={() => { if (!novo.email.trim().toLowerCase().endsWith("@liberdademedicaedu.com.br")) return erro({ message: "Use um e-mail @liberdademedicaedu.com.br" }); rpc("qw_lider_salvar", { _id: null, _dados: novo }, "Líder cadastrado"); }}>Cadastrar</Button></div>
      </div>
      <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Nome", "E-mail", "Cargo", "Cadeira", "Diretor", "1º login", "Ativo"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>{d.lideres.map((l) => <tr key={l.id} className="border-t">
          <td className="p-2">{l.nome}{l.revisao_pendente && <Badge variant="outline" className="ml-1">revisar</Badge>}</td><td className="p-2">{l.email}</td><td className="p-2 min-w-40"><Seletor value={l.cargo} onChange={(v) => rpc("qw_lider_salvar", { _id: l.id, _dados: { cargo: v } }, "Cargo atualizado")} opcoes={CARGOS} /></td>
          <td className="p-2 min-w-40"><Seletor value={l.cadeira_id ?? ""} onChange={(v) => rpc("qw_lider_salvar", { _id: l.id, _dados: { cadeira_id: v } }, "Cadeira atualizada")} opcoes={cadeiras} /></td>
          <td className="p-2 min-w-40"><Seletor value={valorDiretor(l)} onChange={(v) => rpc("qw_lider_salvar", { _id: l.id, _dados: dadosDiretor(v) }, "Diretor atualizado")} opcoes={diretores} /></td>
          <td className="p-2">{l.user_id ? "Sim" : "Aguardando"}</td>
          <td className="p-2"><Switch checked={l.ativo} aria-label={`Ativo: ${l.nome}`} onCheckedChange={(v) => rpc("qw_lider_ativar", { _id: l.id, _ativo: v }, v ? "Líder reativado" : "Líder inativado")} /></td>
        </tr>)}</tbody></table></div>
    </CardContent></Card>
    <div className="space-y-4">{d.lideres.filter((l) => l.ativo).map((l) => <AreasDiretores key={l.id} lider={l} ctx={d.ctx} rpc={rpc} />)}</div>
  </div>;
}


const dadosDiretor = (v: string) => ({ diretor_user_id: v.startsWith("u:") ? v.slice(2) : "", diretor_lider_id: v.startsWith("l:") ? v.slice(2) : "" });
const valorDiretor = (v: { diretor_user_id: string | null; diretor_lider_id: string | null }) => v.diretor_user_id ? `u:${v.diretor_user_id}` : v.diretor_lider_id ? `l:${v.diretor_lider_id}` : "pendente";
const opcoesDiretor = (ctx: Ctx) => ({ pendente: "Diretor pendente", ...Object.fromEntries(ctx.diretores.map((d) => [`u:${d.user_id}`, d.nome])), ...Object.fromEntries(ctx.diretores_lideres.map((d) => [`l:${d.id}`, `${d.nome}${d.user_id ? "" : " · aguardando login"}`])) });
function PendenciasDiretor({ d }: { d: NonNullable<ReturnType<typeof useDados>["data"]> }) {
 const pendentes = d.ctx.lideres.filter((c) => c.aguardando_diretor && d.lideres.some((l) => l.id === c.id && l.ativo));
 if (!pendentes.length) return null;
 return <div className="border-l-4 border-warning bg-warning/10 p-3 text-sm" role="status"><strong>Diretores pendentes · {pendentes.length} líder(es)</strong><ul>{pendentes.map((c) => <li key={c.id}>{d.lideres.find((l) => l.id === c.id)?.nome}: {c.areas.filter((a) => a.ativo && !a.diretor_efetivo).map((a) => a.area_rotulo).join(", ") || c.diretor || "sem diretor definido"}{d.envios.some((e) => e.lider_id === c.id && e.aguardando_diretor) ? " · envio aguardando diretor" : ""}</li>)}</ul></div>;
}
function AreasDiretores({ lider, ctx, rpc }: { lider: Lider; ctx: Ctx; rpc: (fn: string, args: object, ok: string) => void }) {
 const [area, setArea] = useState(""); const [diretor, setDiretor] = useState("pendente");
 const areas = ctx.lideres.find((c) => c.id === lider.id)?.areas ?? [];
 return <details className="border-b pb-3"><summary className="cursor-pointer text-sm font-medium">Áreas de triagem · {lider.nome} ({areas.filter((a) => a.ativo).length})</summary><div className="space-y-3 pt-3">
 {areas.map((a) => <AreaDiretorLinha key={a.id} area={a} liderId={lider.id} ctx={ctx} rpc={rpc} />)}
 <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><FormField id={`nova-area-${lider.id}`} label="Nova área"><Input value={area} onChange={(e) => setArea(e.target.value)} /></FormField><FormField id={`novo-dir-${lider.id}`} label="Diretor"><Seletor value={diretor} onChange={setDiretor} opcoes={opcoesDiretor(ctx)} /></FormField><Button variant="outline" size="sm" disabled={!area.trim()} onClick={() => rpc("qw_diretor_salvar", { _id: null, _lider: lider.id, _dados: { area_rotulo: area, ...dadosDiretor(diretor) } }, "Área cadastrada")}>Adicionar área</Button></div>
 </div></details>;
}
function AreaDiretorLinha({ area, liderId, ctx, rpc }: { area: Area; liderId: string; ctx: Ctx; rpc: (fn: string, args: object, ok: string) => void }) {
 const [nome, setNome] = useState(area.area_rotulo); const [diretor, setDiretor] = useState(valorDiretor(area));
 return <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"><FormField id={`area-${area.id}`} label="Área"><Input value={nome} onChange={(e) => setNome(e.target.value)} /></FormField><FormField id={`dir-${area.id}`} label="Diretor"><Seletor value={diretor} onChange={setDiretor} opcoes={opcoesDiretor(ctx)} /></FormField><Button size="sm" variant="outline" disabled={!nome.trim()} onClick={() => rpc("qw_diretor_salvar", { _id: area.id, _lider: liderId, _dados: { area_rotulo: nome, ...dadosDiretor(diretor) } }, "Vínculo atualizado")}>Salvar</Button><Switch checked={area.ativo} aria-label={`Área ativa: ${area.area_rotulo}`} onCheckedChange={(ativo) => rpc("qw_diretor_salvar", { _id: area.id, _lider: liderId, _dados: { ativo } }, ativo ? "Área reativada" : "Área inativada")} /></div>;
}

function CicloLinha({ c, rpc }: { c: Ciclo; rpc: (fn: string, args: object, ok: string) => void }) {
  const [v, setV] = useState({ data_abertura: c.data_abertura ?? "", data_fechamento: c.data_fechamento ?? "", limite_investimento: String(c.limite_investimento), prazo_max_dias: String(c.prazo_max_dias) });
  return <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[80px_1fr_1fr_1fr_1fr_auto] md:items-end">
    <div><div className="font-semibold">{c.ano}</div><Badge variant="outline">{c.status}</Badge></div>
    <FormField id={`ab-${c.id}`} label="Abertura"><Input type="date" value={v.data_abertura} onChange={(e) => setV({ ...v, data_abertura: e.target.value })} /></FormField>
    <FormField id={`fe-${c.id}`} label="Prazo / fechamento"><Input type="date" value={v.data_fechamento} onChange={(e) => setV({ ...v, data_fechamento: e.target.value })} /></FormField>
    <FormField id={`li-${c.id}`} label="Limite (R$)"><Input type="number" value={v.limite_investimento} onChange={(e) => setV({ ...v, limite_investimento: e.target.value })} /></FormField>
    <FormField id={`pz-${c.id}`} label="Prazo máx. (dias)"><Input type="number" value={v.prazo_max_dias} onChange={(e) => setV({ ...v, prazo_max_dias: e.target.value })} /></FormField>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => rpc("qw_ciclo_salvar", { _id: c.id, _dados: v }, "Ciclo salvo")}>Salvar</Button>
      {["rascunho", "fechado"].includes(c.status) && <Button size="sm" onClick={() => window.confirm(`Abrir o ciclo ${c.ano}?`) && rpc("qw_abrir_ciclo", { _id: c.id }, "Ciclo aberto")}>Abrir</Button>}
      {c.status === "aberto" && <Button size="sm" variant="outline" onClick={() => window.confirm(`Fechar o ciclo ${c.ano}? Os itens ficam em leitura.`) && rpc("qw_fechar_ciclo", { _id: c.id }, "Ciclo fechado")}>Fechar</Button>}
      {c.status === "fechado" && <Button size="sm" variant="ghost" onClick={() => rpc("qw_ciclo_salvar", { _id: c.id, _dados: { status: "arquivado" } }, "Ciclo arquivado")}>Arquivar</Button>}
    </div>
  </div>;
}

export default function QuickWins() {
  const perfil = useQwPerfil();
  const dados = useDados();
  const qc = useQueryClient();
  const recarregar = () => qc.invalidateQueries({ queryKey: ["qw-dados"] });
  if (perfil.isPending || dados.isPending) return <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (dados.error || perfil.error) return <p className="text-destructive">Não foi possível carregar o Quick Wins.</p>;
  const p = perfil.data, d = dados.data;
  if (!p || !d) return <p>Não foi possível carregar o Quick Wins.</p>;
  const abas: Aba[] = [];
  if (p.lider_id || p.diretor || p.gov_ceo || p.governanca) abas.push({ id: "formulario", label: "Formulário", conteudo: <Formulario d={d} liderId={p.lider_id} recarregar={recarregar} /> });
  if (p.diretor) abas.push({ id: "triagem", label: "Triagem", conteudo: <Triagem d={d} recarregar={recarregar} filtroDiretor={undefined} /> });
  if (p.gov_ceo) abas.push({ id: "painel", label: "Painel", conteudo: <Painel d={d} /> });
  if (p.gov_ceo && !p.diretor) abas.push({ id: "triagem", label: "Triagem (todos)", conteudo: <Triagem d={d} recarregar={recarregar} /> });
  if (p.governanca) abas.push({ id: "admin", label: "Administração", conteudo: <Administracao d={d} recarregar={recarregar} /> });
  if (!abas.length) return <p className="text-muted-foreground">Você não tem acesso ao Quick Wins.</p>;
  return <div className="space-y-4"><div><h1 className="text-2xl font-bold">Quick Wins</h1><p className="text-sm text-muted-foreground">Até {QW_LIMITE_ITENS} quick wins por líder em cada ciclo anual.</p></div><AbasPagina abas={abas} /></div>;
}
