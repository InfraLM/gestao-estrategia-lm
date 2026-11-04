import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, Loader2, Plus, Send } from "lucide-react";
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
  APROVACOES, AVISO_INICIATIVA, CARGOS, CLASSIFICACAO, CRITERIOS, EXECUCAO, FAIXAS, PRAZOS, QW_LIMITE_ITENS, TRIAGEM,
  ativos, camposFaltando, classificar, comentarioObrigatorio, contagem, csv, indicadores, podeEditarItem,
  type LinhaPainel, type QwItem, type StatusExecucao,
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

function Seletor<T extends string>({ id, value, onChange, opcoes, disabled }: { id?: string; value: T | ""; onChange: (v: T) => void; opcoes: Record<string, string>; disabled?: boolean }) {
  return <Select value={value || undefined} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
    <SelectTrigger id={id}><SelectValue placeholder="Selecione" /></SelectTrigger>
    <SelectContent>{Object.entries(opcoes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
  </Select>;
}

function ItemEditor({ item, editavel, limite, objetivos, aoSalvar, areas = [] }: { item: QwItem; editavel: boolean; limite: number; objetivos: Record<string, string>; aoSalvar: () => void; areas?: Area[] }) {
  const [f, setF] = useState<QwItem>(item);
  const [estado, setEstado] = useState<SaveState>({ estado: "ocioso" });
  const set = (k: keyof QwItem, v: any) => { setF((p) => ({ ...p, [k]: v })); setEstado({ estado: "alterado" }); };
  const cls = classificar(f.faixa_investimento, f.aprovacao_necessaria, f.prazo_resultado, limite);
  const salvar = async () => {
    setEstado({ estado: "salvando" });
    const { titulo, observacao, acao_proposta, indicador, valor_atual, valor_alvo, objetivo_id, faixa_investimento, aprovacao_necessaria, prazo_resultado, mudanca_maior, responsavel_execucao, area_rotulo } = f;
    const { error } = await db.rpc("qw_salvar_item", { _id: item.id, _dados: { titulo, observacao, acao_proposta, indicador, valor_atual, valor_alvo, objetivo_id: objetivo_id ?? "", faixa_investimento, aprovacao_necessaria, prazo_resultado, mudanca_maior, responsavel_execucao, area_rotulo } });
    if (error) { setEstado({ estado: "erro", erro: error.message }); erro(error); return; }
    setEstado({ estado: "salvo", em: new Date() }); aoSalvar();
  };
  const p = `qw-${item.id}`;
  const txt = (k: keyof QwItem, label: string, req = true, area = false, max?: number) => <FormField id={`${p}-${k}`} label={label} required={req}>
    {area ? <Textarea value={(f[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} disabled={!editavel} rows={2} />
      : <Input value={(f[k] as string) ?? ""} maxLength={max} onChange={(e) => set(k, e.target.value)} disabled={!editavel} />}
  </FormField>;
  return <div className="space-y-3">
    <div className="grid gap-3 md:grid-cols-2">
      {areas.length > 0 && <FormField id={`${p}-area`} label="Área" required={areas.length > 1}><Seletor value={f.area_rotulo ?? ""} onChange={(v) => set("area_rotulo", v)} opcoes={Object.fromEntries(areas.map((a) => [a.area_rotulo, a.area_rotulo]))} disabled={!editavel} /></FormField>}
      {txt("titulo", `Título (${f.titulo.length}/80)`, true, false, 80)}
      <FormField id={`${p}-obj`} label="Objetivo do BSC" required><Seletor value={f.objetivo_id ?? ""} onChange={(v) => set("objetivo_id", v)} opcoes={objetivos} disabled={!editavel} /></FormField>
      {txt("observacao", "O que você observou", true, true)}
      {txt("acao_proposta", "Ação proposta", true, true)}
      {txt("indicador", "Indicador")}
      <div className="grid grid-cols-2 gap-3">{txt("valor_atual", "Valor atual", false)}{txt("valor_alvo", "Valor alvo")}</div>
      <FormField id={`${p}-faixa`} label="Investimento"><Seletor value={f.faixa_investimento} onChange={(v) => set("faixa_investimento", v)} opcoes={FAIXAS} disabled={!editavel} /></FormField>
      <FormField id={`${p}-aprov`} label="Aprovação necessária"><Seletor value={f.aprovacao_necessaria} onChange={(v) => set("aprovacao_necessaria", v)} opcoes={APROVACOES} disabled={!editavel} /></FormField>
      <FormField id={`${p}-prazo`} label="Prazo para resultado"><Seletor value={f.prazo_resultado} onChange={(v) => set("prazo_resultado", v)} opcoes={PRAZOS} disabled={!editavel} /></FormField>
      {txt("responsavel_execucao", "Responsável pela execução")}
      <div className="md:col-span-2">{txt("mudanca_maior", "Que mudança maior este quick win ajuda a destravar?", true, true)}</div>
    </div>
    {cls === "iniciativa_maior" && <p className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-2 text-sm" role="status"><AlertTriangle className="h-4 w-4" />{AVISO_INICIATIVA}</p>}
    {editavel && <div className="flex flex-wrap items-center justify-between gap-2"><SaveFeedback state={estado} onRetry={salvar} /><Button size="sm" onClick={salvar} disabled={estado.estado === "salvando"}>Salvar rascunho</Button></div>}
  </div>;
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
    <Badge variant={i.classificacao === "quick_win" ? "default" : "secondary"}>{CLASSIFICACAO[i.classificacao]}</Badge>
    <Badge variant="outline">{TRIAGEM[i.status_triagem]}</Badge>
    {i.status_triagem === "aprovado" && <Badge variant="outline">{EXECUCAO[i.status_execucao]}</Badge>}
  </div>;
}

function MeusQuickWins({ d, liderId, recarregar }: { d: NonNullable<ReturnType<typeof useDados>["data"]>; liderId: string; recarregar: () => void }) {
  const lider = d.lideres.find((l) => l.id === liderId);
  const ctx = d.ctx.lideres.find((l) => l.id === liderId);
  const ciclo = d.ciclos.find((c) => c.status === "aberto") ?? d.ciclos.find((c) => c.status === "fechado");
  const envio = ciclo ? d.envios.find((e) => e.ciclo_id === ciclo.id && e.lider_id === liderId) : undefined;
  const itens = envio ? d.itens.filter((i) => i.envio_id === envio.id) : [];
  const lista = ativos(itens);
  const aberto = ciclo?.status === "aberto";
  const [busy, setBusy] = useState(false);
  const adicionar = async () => { setBusy(true); const { error } = await db.rpc("qw_salvar_item", { _id: null, _dados: {} }); setBusy(false); if (error) return erro(error); recarregar(); };
  const enviar = async () => {
    const faltando = lista.filter((i) => camposFaltando(i, (ctx?.areas.filter((a) => a.ativo).length ?? 0) > 1).length).length;
    if (faltando) return erro({ message: `Há ${faltando} item(ns) com campos obrigatórios em branco. Salve antes de enviar.` });
    if (!envio) return;
    if (!window.confirm(`Enviar ${lista.length} quick win(s) ao seu diretor?`)) return;
    setBusy(true); const { error } = await db.rpc("qw_enviar", { _envio: envio.id }); setBusy(false);
    if (error) return erro(error); toast({ title: ctx?.aguardando_diretor ? "Enviado · aguardando diretor" : "Envio registrado" }); recarregar();
  };
  const retirar = async (id: string) => { if (!window.confirm("Retirar este item do rascunho?")) return; const { error } = await db.rpc("qw_cancelar_item", { _id: id }); if (error) return erro(error); recarregar(); };
  if (!lider) return <p>Líder não encontrado.</p>;
  return <div className="space-y-4">
    {ctx?.aguardando_diretor && <p className="text-sm text-warning" role="status">Diretor pendente. Você pode preencher e enviar; a Governança acompanha o encaminhamento.</p>}
    <Card><CardContent className="grid gap-3 pt-6 text-sm md:grid-cols-4">
      <div><div className="text-muted-foreground">Líder</div><div className="font-medium">{lider.nome}</div></div>
      <div><div className="text-muted-foreground">Cargo</div><div className="font-medium">{CARGOS[lider.cargo]}</div></div>
      <div><div className="text-muted-foreground">Cadeira</div><div className="font-medium">{ctx?.cadeira ?? "—"}</div></div>
      <div><div className="text-muted-foreground">Diretor</div><div className="font-medium">{ctx?.areas.some((a) => a.ativo) ? ctx.areas.filter((a) => a.ativo).map((a) => `${a.area_rotulo}: ${a.diretor ?? "pendente"}`).join(" · ") : ctx?.diretor ?? "Pendente"}</div></div>
    </CardContent></Card>
    <Card><CardContent className="space-y-2 pt-6 text-sm">
      {ciclo ? <p><strong>Ciclo {ciclo.ano}</strong> · {aberto ? "aberto" : "fechado"} · prazo {dataBR(ciclo.data_fechamento)} · investimento até R$ {Number(ciclo.limite_investimento).toLocaleString("pt-BR")} · resultado em até {ciclo.prazo_max_dias} dias</p> : <p>Nenhum ciclo aberto no momento.</p>}
      <ul className="flex flex-wrap gap-2">{CRITERIOS.map((c) => <li key={c}><Badge variant="outline">{c}</Badge></li>)}</ul>
    </CardContent></Card>
    {ciclo && <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm"><strong>{contagem(itens)}</strong> quick wins {envio?.aguardando_diretor && <Badge variant="outline">Aguardando diretor</Badge>} · envio: {envio?.status === "enviado" ? `enviado em ${new Date(envio.enviado_em ?? "").toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "rascunho"}</div>
      <div className="flex gap-2">
        {aberto && (!envio || envio.status === "rascunho") && <Button variant="outline" onClick={adicionar} disabled={busy || lista.length >= QW_LIMITE_ITENS}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>}
        {aberto && envio && (envio.status === "rascunho" || lista.some((i) => ["ajustar", "devolvido"].includes(i.status_triagem))) && <Button onClick={enviar} disabled={busy || lista.length < 1}><Send className="mr-1 h-4 w-4" />Enviar</Button>}
      </div>
    </div>}
    {lista.map((i) => { const ed = !!envio && podeEditarItem(envio.status, i, aberto); return <Card key={i.id}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0"><CardTitle className="text-base">#{i.ordem} {i.titulo || "Novo quick win"}</CardTitle><StatusItem i={i} /></CardHeader>
      <CardContent className="space-y-3">
        {i.comentario_diretor && <p className="rounded-md bg-muted p-2 text-sm"><strong>Comentário do diretor:</strong> {i.comentario_diretor}</p>}
        <ItemEditor item={i} editavel={ed} limite={Number(ciclo?.limite_investimento ?? 20000)} areas={ctx?.areas.filter((a) => a.ativo) ?? []} objetivos={d.objetivos} aoSalvar={recarregar} />
        {i.status_triagem === "aprovado" && ciclo?.status !== "arquivado" && <Execucao item={i} aoSalvar={recarregar} />}
        {envio?.status === "rascunho" && aberto && <Button variant="ghost" size="sm" onClick={() => retirar(i.id)}>Retirar do rascunho</Button>}
      </CardContent></Card>; })}
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
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>#{i.ordem} {i.titulo}{i.area_rotulo && ` · ${i.area_rotulo}`}</strong><StatusItem i={i} /></div>
      <p className="text-sm"><span className="text-muted-foreground">Ação:</span> {i.acao_proposta}</p>
      <p className="text-sm"><span className="text-muted-foreground">Indicador:</span> {i.indicador} ({i.valor_atual ?? "—"} → {i.valor_alvo}) · {i.objetivo_id ? d.objetivos[i.objetivo_id] : ""}</p>
      <p className="text-sm text-muted-foreground">{FAIXAS[i.faixa_investimento]} · {APROVACOES[i.aprovacao_necessaria]} · {PRAZOS[i.prazo_resultado]}</p>
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
  const [f, setF] = useState<Record<string, string>>({ ano: anos[0] ?? "", cadeira: "todos", cargo: "todos", objetivo: "todos", classificacao: "todos", triagem: "todos", execucao: "todos" });
  const ciclo = d.ciclos.find((c) => String(c.ano) === f.ano);
  const cadeira = (id: string) => d.ctx.lideres.find((l) => l.id === id)?.cadeira ?? "—";
  const lideres = d.lideres.filter((l) => l.ativo && (f.cadeira === "todos" || cadeira(l.id) === f.cadeira) && (f.cargo === "todos" || l.cargo === f.cargo));
  const envios = d.envios.filter((e) => e.ciclo_id === ciclo?.id && lideres.some((l) => l.id === e.lider_id));
  const linhas: LinhaPainel[] = useMemo(() => d.itens.filter((i) => envios.some((e) => e.id === i.envio_id && e.status === "enviado"))
    .filter((i) => (f.objetivo === "todos" || i.objetivo_id === f.objetivo) && (f.classificacao === "todos" || i.classificacao === f.classificacao) && (f.triagem === "todos" || i.status_triagem === f.triagem) && (f.execucao === "todos" || i.status_execucao === f.execucao))
    .map((i) => { const e = envios.find((x) => x.id === i.envio_id); const l = d.lideres.find((x) => x.id === e?.lider_id); return { item: i, lider: { id: l?.id ?? "", nome: l?.nome ?? "—", cargo: l?.cargo ?? "", cadeira: cadeira(l?.id ?? "") }, enviado: true }; }), [d, f, envios]);
  const ind = indicadores(lideres.length, envios.filter((e) => e.status === "enviado").length, linhas.map((x) => x.item), d.objetivos);
  const cadeiras = Object.fromEntries([...new Set(d.ctx.lideres.map((l) => l.cadeira).filter((c): c is string => Boolean(c)))].map((c) => [c, c]));
  const filtro = (k: string, label: string, opcoes: Record<string, string>) => <FormField id={`f-${k}`} label={label}><Seletor value={f[k]} onChange={(v) => setF((p) => ({ ...p, [k]: v }))} opcoes={k === "ano" ? opcoes : { todos: "Todos", ...opcoes }} /></FormField>;
  const exportar = () => { const b = new Blob([csv(linhas, d.objetivos)], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `quick-wins-${f.ano}.csv`; a.click(); };
  return <div className="space-y-4">
    <PendenciasDiretor d={d} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {filtro("ano", "Ano", Object.fromEntries(anos.map((a) => [a, a])))}{filtro("cadeira", "Diretoria / cadeira", cadeiras)}{filtro("cargo", "Cargo", CARGOS)}{filtro("objetivo", "Objetivo BSC", d.objetivos)}
      {filtro("classificacao", "Classificação", CLASSIFICACAO)}{filtro("triagem", "Triagem", TRIAGEM)}{filtro("execucao", "Execução", EXECUCAO)}
      <div className="flex items-end"><Button variant="outline" onClick={exportar}><Download className="mr-1 h-4 w-4" />Exportar CSV</Button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[["Líderes que enviaram", `${ind.pctEnviaram}%`], ["Quick wins enviados", ind.total], ["Aprovados", `${ind.pctAprovados}%`], ["Concluídos com resultado medido", `${ind.pctConcluidos}%`]].map(([k, v]) =>
        <Card key={k as string}><CardContent className="pt-6"><div className="text-2xl font-semibold">{v}</div><div className="text-sm text-muted-foreground">{k}</div></CardContent></Card>)}
    </div>
    <Card><CardHeader><CardTitle className="text-base">Distribuição por objetivo</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
      {Object.entries(ind.distribuicao).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div key={k} className="flex justify-between gap-2"><span>{k}</span><strong>{v}</strong></div>)}
      {!ind.total && <p className="text-muted-foreground">Sem envios com estes filtros.</p>}
    </CardContent></Card>
    <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Líder", "Título", "Área", "Objetivo", "Classificação", "Triagem", "Execução"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
      <tbody>{linhas.map(({ item: i, lider: l }) => <tr key={i.id} className="border-t"><td className="p-2">{l.nome}</td><td className="p-2">{i.titulo}</td><td className="p-2">{i.area_rotulo ?? "—"}</td><td className="p-2">{i.objetivo_id ? d.objetivos[i.objetivo_id]?.split(" · ")[0] : "—"}</td><td className="p-2">{CLASSIFICACAO[i.classificacao]}</td><td className="p-2">{TRIAGEM[i.status_triagem]}</td><td className="p-2">{EXECUCAO[i.status_execucao]}</td></tr>)}</tbody></table></div>
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
  if (p.lider_id) abas.push({ id: "meus", label: "Meus quick wins", conteudo: <MeusQuickWins d={d} liderId={p.lider_id} recarregar={recarregar} /> });
  if (p.diretor) abas.push({ id: "triagem", label: "Triagem", conteudo: <Triagem d={d} recarregar={recarregar} filtroDiretor={undefined} /> });
  if (p.gov_ceo) abas.push({ id: "painel", label: "Painel", conteudo: <Painel d={d} /> });
  if (p.gov_ceo && !p.diretor) abas.push({ id: "triagem", label: "Triagem (todos)", conteudo: <Triagem d={d} recarregar={recarregar} /> });
  if (p.governanca) abas.push({ id: "admin", label: "Administração", conteudo: <Administracao d={d} recarregar={recarregar} /> });
  if (!abas.length) return <p className="text-muted-foreground">Você não tem acesso ao Quick Wins.</p>;
  return <div className="space-y-4"><div><h1 className="text-2xl font-bold">Quick Wins</h1><p className="text-sm text-muted-foreground">Até {QW_LIMITE_ITENS} quick wins por líder em cada ciclo anual.</p></div><AbasPagina abas={abas} /></div>;
}
