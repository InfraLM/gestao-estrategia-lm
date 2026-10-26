import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { filtrarItens, planoEmMassa, ItemPendencia, Sugestao } from "@/lib/pendenciasMassa";

const db = supabase as any;
const fmt = (d: string | null) => (d ? new Date(`${String(d).slice(0, 10)}T12:00`).toLocaleDateString("pt-BR") : "sem data");
const TIPO_LBL: Record<string, string> = { ata: "Ata", prioridade: "Prioridade" };
const SUG_LBL: Record<string, string> = { atribuir: "Atribuir", baixar: "Sugerir baixa", reativar: "Reativar" };
const CONF_LBL: Record<string, string> = { alta: "alta", media: "média", baixa: "baixa" };
type Cad = { id: string; nome: string; ativo?: boolean; diretor_nome?: string | null };

export function useAtasAguardando(ativo: boolean) {
  return useQuery({ queryKey: ["rotina-atas-aguardando"], enabled: ativo, queryFn: async () => {
    const { data, error } = await db.rpc("rotina_atas_aguardando"); if (error) throw error; return (data ?? []) as any[];
  } });
}

/** Governança: fila de atas sem dono e pendências > 3 meses, com sugestões da IA (nunca aplicadas sozinhas) e ações em massa auditadas. */
export default function GestaoPendenciasRotina({ cadeiras }: { cadeiras: Cad[] }) {
  const fila = useAtasAguardando(true);
  const antigas = useQuery({ queryKey: ["rotina-pendencias-antigas"], queryFn: async () => {
    const { data, error } = await db.rpc("rotina_pendencias_antigas"); if (error) throw error; return (data ?? []) as any[];
  } });
  const sug = useQuery({ queryKey: ["rotina-pendencia-sugestoes"], queryFn: async () => {
    const { data, error } = await db.from("rotina_pendencia_sugestoes").select("*"); if (error) throw error; return (data ?? []) as Sugestao[];
  } });
  const itensFila: ItemPendencia[] = (fila.data ?? []).map((a) => ({ tipo: "ata", ref: a.id, titulo: a.titulo, comite: a.comite_codigo, reuniao: a.reuniao_titulo, data: a.reuniao_data, detalhe: a.motivo === "sem_responsavel" ? "Sem responsável" : `Responsável "${a.responsavel_origem || a.responsavel_email}" sem cadeira`, cadeiras: [] }));
  const itensAntigas: ItemPendencia[] = (antigas.data ?? []).map((p) => ({ tipo: p.tipo, ref: p.ref, titulo: p.titulo, comite: p.comite_codigo ?? null, reuniao: p.reuniao_titulo ?? null, data: p.origem, detalhe: p.detalhe, cadeiras: (p.cadeiras ?? []).map((c: any) => c.nome) }));
  return <div className="space-y-4">
    <Painel titulo="Ações de atas aguardando avaliação" contexto="aguardando" ajuda="Ações sem responsável, ou cujo responsável não está ligado a uma cadeira, não vão para nenhum formulário. Ao atribuir, passam a empilhar no próximo ciclo da cadeira escolhida."
      itens={itensFila} carregando={fila.isPending} erro={fila.isError} sugestoes={sug.data ?? []} cadeiras={cadeiras} />
    <Painel titulo="Pendências antigas (> 3 meses)" contexto="antiga" ajuda="Atas e prioridades ainda abertas com origem há mais de 3 meses. Não empilham nem contam na completude. Reativar faz voltar a empilhar por mais 3 meses. Impedimentos atribuídos não entram aqui: empilham até serem resolvidos ou encerrados."
      itens={itensAntigas} carregando={antigas.isPending} erro={antigas.isError} sugestoes={sug.data ?? []} cadeiras={cadeiras} />
  </div>;
}

function Painel({ titulo, ajuda, contexto, itens, carregando, erro, sugestoes, cadeiras }: {
  titulo: string; ajuda: string; contexto: "aguardando" | "antiga"; itens: ItemPendencia[]; carregando: boolean; erro: boolean; sugestoes: Sugestao[]; cadeiras: Cad[];
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({ confianca: "todas", comite: "todos", reuniao: "todas", sugestao: "todas" });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [cadeiraMassa, setCadeiraMassa] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmar, setConfirmar] = useState<null | { acao: "sugerida" | "atribuir" | "baixar" | "reativar" }>(null);
  const [busy, setBusy] = useState(false);
  const [gerando, setGerando] = useState(false);
  const ativas = cadeiras.filter((c) => c.ativo !== false);
  const nomeCad = (id: string | null) => cadeiras.find((c) => c.id === id)?.nome ?? "—";
  const sugDe = (i: ItemPendencia) => sugestoes.find((s) => s.tipo === i.tipo && s.item_ref === i.ref);
  const visiveis = useMemo(() => filtrarItens(itens, sugestoes, f), [itens, sugestoes, f]);
  const comites = [...new Set(itens.map((i) => i.comite).filter(Boolean))] as string[];
  const reunioes = [...new Set(itens.map((i) => i.reuniao).filter(Boolean))] as string[];
  const selecionados = visiveis.filter((i) => sel.has(`${i.tipo}:${i.ref}`));
  const plano = confirmar ? planoEmMassa(selecionados, sugestoes, confirmar.acao, { cadeira: cadeiraMassa, motivo }) : null;
  const k = (i: ItemPendencia) => `${i.tipo}:${i.ref}`;

  const gerar = async () => {
    setGerando(true);
    const refs = itens.map((i) => i.ref);
    let n = 0;
    for (let x = 0; x < refs.length; x += 40) {
      const { data, error } = await supabase.functions.invoke("rotina-pendencias-sugerir", { body: { contexto, refs: refs.slice(x, x + 40) } });
      if (error) { toast.error("Não foi possível gerar as sugestões. Nada foi aplicado."); break; }
      n += data?.sugeridos ?? 0;
    }
    setGerando(false); toast.success(`${n} sugestões geradas. Nada foi aplicado.`);
    qc.invalidateQueries({ queryKey: ["rotina-pendencia-sugestoes"] });
  };
  const executar = async () => {
    if (!plano) return;
    setBusy(true); let ok = 0; const falhas: string[] = [];
    for (const op of plano.ops) {
      const { error } = await db.rpc("rotina_pendencia_gerir", { _tipo: op.tipo, _ref: op.ref, _acao: op.acao, _cadeira: op.cadeira ?? null, _motivo: op.motivo ?? "" });
      if (error) falhas.push(error.message); else ok++;
    }
    setBusy(false); setConfirmar(null); setSel(new Set());
    if (falhas.length) toast.error(`${ok} aplicadas, ${falhas.length} com erro: ${falhas[0]}`); else toast.success(`${ok} pendências atualizadas.`);
    qc.invalidateQueries({ queryKey: ["rotina-atas-aguardando"] }); qc.invalidateQueries({ queryKey: ["rotina-pendencias-antigas"] });
  };
  const FiltroSel = ({ id, valor, todos, opcoes, label }: { id: keyof typeof f; valor: string; todos: string; opcoes: { v: string; l: string }[]; label: string }) =>
    <Select value={valor} onValueChange={(v) => setF({ ...f, [id]: v })}><SelectTrigger aria-label={label} className="h-8 w-auto min-w-[140px] text-xs"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value={todos}>{label}: todos</SelectItem>{opcoes.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent></Select>;

  return <section className="space-y-3 rounded border p-4" aria-label={contexto === "aguardando" ? "Aguardando avaliação" : "Pendências antigas"}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2"><h2 className="font-semibold">{titulo}</h2><Badge variant="secondary">{itens.length}</Badge></div>
      <Button size="sm" variant="outline" disabled={gerando || !itens.length} onClick={gerar}>{gerando ? "Gerando sugestões…" : "Gerar sugestões da IA"}</Button>
    </div>
    <p className="text-xs text-muted-foreground">{ajuda} As sugestões da IA nunca são aplicadas sozinhas.</p>
    {carregando && <p className="text-sm text-muted-foreground">Carregando…</p>}
    {erro && <p role="alert" className="text-sm text-destructive">Não foi possível carregar a lista.</p>}
    {!!itens.length && <>
      <div className="flex flex-wrap gap-2">
        <FiltroSel id="confianca" valor={f.confianca} todos="todas" label="Confiança" opcoes={["alta", "media", "baixa", "sem"].map((v) => ({ v, l: v === "sem" ? "Sem sugestão" : `Confiança ${CONF_LBL[v]}` }))} />
        <FiltroSel id="sugestao" valor={f.sugestao} todos="todas" label="Sugestão" opcoes={(contexto === "aguardando" ? ["atribuir", "baixar"] : ["reativar", "baixar", "atribuir"]).map((v) => ({ v, l: SUG_LBL[v] }))} />
        {comites.length > 0 && <FiltroSel id="comite" valor={f.comite} todos="todos" label="Comitê" opcoes={comites.map((v) => ({ v, l: v }))} />}
        {reunioes.length > 0 && <FiltroSel id="reuniao" valor={f.reuniao} todos="todas" label="Reunião" opcoes={reunioes.map((v) => ({ v, l: v }))} />}
      </div>
      <div className="sticky top-14 z-10 space-y-2 rounded bg-muted p-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Checkbox id={`todos-${contexto}`} checked={visiveis.length > 0 && selecionados.length === visiveis.length} onCheckedChange={(v) => setSel(v ? new Set(visiveis.map(k)) : new Set())} />
          <label htmlFor={`todos-${contexto}`}>Selecionar todos os {visiveis.length} visíveis</label>
          <Badge variant="outline">{selecionados.length} selecionados</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={!selecionados.length} onClick={() => setConfirmar({ acao: "sugerida" })}>Aplicar sugestão da IA</Button>
          <Select value={cadeiraMassa} onValueChange={setCadeiraMassa}><SelectTrigger aria-label="Atribuir a cadeira" className="h-8 w-[200px] text-xs"><SelectValue placeholder="Atribuir a…" /></SelectTrigger>
            <SelectContent>{ativas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
          <Button size="sm" variant="outline" disabled={!selecionados.length || !cadeiraMassa} onClick={() => setConfirmar({ acao: "atribuir" })}>Atribuir</Button>
          <Input aria-label="Motivo da baixa (para todas)" placeholder="Motivo da baixa (para todas)" className="h-8 w-[240px] text-xs" maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <Button size="sm" variant="outline" disabled={!selecionados.length || !motivo.trim()} onClick={() => setConfirmar({ acao: "baixar" })}>Baixar com motivo</Button>
          {contexto === "antiga" && <Button size="sm" variant="outline" disabled={!selecionados.length} onClick={() => setConfirmar({ acao: "reativar" })}>Reativar</Button>}
        </div>
      </div>
    </>}
    {!carregando && !itens.length && <p className="text-sm text-muted-foreground">Nenhum item.</p>}
    <ul className="space-y-2">{visiveis.map((i) => { const s = sugDe(i); return <li key={k(i)} className="flex gap-3 border-b pb-2">
      <Checkbox aria-label={`Selecionar ${i.titulo}`} checked={sel.has(k(i))} onCheckedChange={(v) => { const n = new Set(sel); v ? n.add(k(i)) : n.delete(k(i)); setSel(n); }} className="mt-1" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{TIPO_LBL[i.tipo]}</Badge><span className="font-medium break-words">{i.titulo}</span></div>
        <p className="text-xs text-muted-foreground break-words">{i.reuniao ? `${i.reuniao} · ` : ""}{i.comite ? `Comitê ${i.comite} · ` : ""}origem {fmt(i.data)} · {i.detalhe}{i.cadeiras.length ? ` · ${i.cadeiras.join(", ")}` : ""}</p>
        {s ? <p className="text-xs"><Badge variant={s.sugestao === "baixar" ? "destructive" : "secondary"} className="mr-1">IA: {s.sugestao === "atribuir" ? `Atribuir a ${nomeCad(s.cadeira_id)}` : SUG_LBL[s.sugestao]} · confiança {CONF_LBL[s.confianca]}</Badge>
          <span className="text-muted-foreground">{s.justificativa}{s.motivo_sugerido ? ` Motivo sugerido: ${s.motivo_sugerido}` : ""}</span></p>
          : <p className="text-xs text-muted-foreground">Sem sugestão da IA.</p>}
      </div>
    </li>; })}</ul>
    <AlertDialog open={!!confirmar} onOpenChange={(o) => !o && setConfirmar(null)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Confirmar ação em massa</AlertDialogTitle>
          <AlertDialogDescription>{plano && <>
            {plano.ops.length} pendências serão atualizadas{plano.resumo.length ? `: ${plano.resumo.join(", ")}` : ""}.
            {plano.ignorados > 0 && ` ${plano.ignorados} selecionadas serão ignoradas (sem sugestão aplicável).`} Tudo fica registrado na auditoria.</>}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={busy || !plano?.ops.length} onClick={(e) => { e.preventDefault(); executar(); }}>{busy ? "Aplicando…" : `Aplicar em ${plano?.ops.length ?? 0}`}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}
