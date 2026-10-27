import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/FormField";
import GrupoMultiSelect from "@/components/socios/GrupoMultiSelect";
import { cn } from "@/lib/utils";
import { exclusiveAction } from "@/lib/exclusiveAction";
import type { Indicador, Iniciativa, Objetivo } from "@/hooks/useMetasBase";
import {
  AcaoEntrega, STATUS_ACAO_LBL, Vinculo, acaoAtrasada, acoesDoCiclo, errosAcao, novaAcao, responsavelSugerido, rotuloEmpilhada, vinculosSugeridos,
} from "@/lib/acoesEntrega";
import PessoaSelect from '@/components/estrutura/PessoaSelect';
import { useBaseOrganizacional } from '@/hooks/useBaseOrganizacional';
import { nomeVinculado } from '@/lib/baseOrganizacional';

const db = supabase as any;
type Proj = { id: string; codigo: string | null; nome: string; cadeira_id: string | null; gerente: string | null; diretor: string | null };
type Linha = AcaoEntrega & { chave: string; empilhada?: boolean; estado?: "salvando" | "salvo" | "erro"; erroMsg?: string; tentou?: boolean };
const hojeSP = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).toISOString().slice(0, 10);
const fmt = (d: string | null) => (d ? new Date(`${d}T12:00`).toLocaleDateString("pt-BR") : "—");

export function rotuloVinculo(v: Vinculo, indicadores: Indicador[], objetivos: Objetivo[]) {
  if (v.tipo === "objetivo") { const o = objetivos.find((x) => x.id === v.ref_id); return o ? `Objetivo ${o.codigo}` : "Objetivo"; }
  const i = indicadores.find((x) => x.id === v.ref_id); const o = { bsc: "BSC", okr: "KR", cesta: "Cesta" } as Record<string, string>;
  return i ? `${o[i.origem] ?? ""} ${i.codigo} · ${i.nome}` : "Indicador";
}

/** Item 2 do checkout: entregas registradas por ação, salvas uma a uma (não entram na completude). */
export default function AcoesEntregaCheckout({ cadeira, ciclo, podeEditar, indicadores, objetivos, iniciativas }: {
  cadeira: string; ciclo: string; podeEditar: boolean; indicadores: Indicador[]; objetivos: Objetivo[]; iniciativas: Iniciativa[];
}) {
  const [projetos, setProjetos] = useState<Proj[]>([]);
  const [todas, setTodas] = useState<AcaoEntrega[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [verTodos, setVerTodos] = useState(false);
  const [erro, setErro] = useState(false);
  const guard = useRef(exclusiveAction());

  const carregar = async () => {
    if (!cadeira) return;
    const [p, a] = await Promise.all([
      db.from("projetos").select("id,codigo,nome,cadeira_id,gerente,diretor").order("codigo"),
      db.from("rotina_acoes_entrega").select("*").eq("cadeira_id", cadeira).order("created_at"),
    ]);
    if (p.error || a.error) { setErro(true); return; }
    setErro(false); setProjetos(p.data ?? []); setTodas(a.data ?? []);
    setLinhas(acoesDoCiclo((a.data ?? []) as AcaoEntrega[], ciclo).map((x) => ({ ...x, chave: x.id ?? crypto.randomUUID() })));
  };
  useEffect(() => { carregar(); }, [cadeira, ciclo]);

  const opcoes = useMemo(() => {
    const pj = projetos.filter((p) => verTodos || p.cadeira_id === cadeira);
    const ini = iniciativas.filter((i) => i.status !== "cancelada" && (verTodos || i.cadeira_id === cadeira));
    return [
      { grupo: "Projetos estratégicos (PMO)", itens: pj.map((p) => ({ value: `p:${p.id}`, label: `${p.codigo ? p.codigo + " · " : ""}${p.nome}` })) },
      { grupo: "Iniciativas", itens: ini.map((i) => ({ value: `i:${i.id}`, label: i.titulo })) },
    ];
  }, [projetos, iniciativas, verTodos, cadeira]);
  const rotuloFonte = (l: AcaoEntrega) => {
    if (l.projeto_id) { const p = projetos.find((x) => x.id === l.projeto_id); return p ? `${p.codigo ? p.codigo + " · " : ""}${p.nome}` : "Projeto"; }
    if (l.iniciativa_id) return iniciativas.find((x) => x.id === l.iniciativa_id)?.titulo ?? "Iniciativa";
    return "Sem projeto/iniciativa";
  };

  const set = (chave: string, x: Partial<Linha>) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...x, estado: x.estado ?? undefined } : l)));
  const escolherFonte = async (l: Linha, valor: string) => {
    const sel = { projeto_id: valor.startsWith("p:") ? valor.slice(2) : null, iniciativa_id: valor.startsWith("i:") ? valor.slice(2) : null };
    let vinc: Vinculo[] = [];
    if (sel.projeto_id || sel.iniciativa_id) {
      const [pv, av] = await Promise.all([
        db.from("portfolio_vinculos").select("fonte_tipo,fonte_id,tipo,ref_id,impacto,status").eq("fonte_id", sel.projeto_id ?? sel.iniciativa_id),
        sel.iniciativa_id ? db.from("mt_acao_vinculos").select("iniciativa_id,tipo,ref_id,principal").eq("iniciativa_id", sel.iniciativa_id) : Promise.resolve({ data: [] }),
      ]);
      vinc = vinculosSugeridos(sel, pv.data ?? [], av.data ?? [], iniciativas);
    }
    set(l.chave, { ...sel, responsavel: responsavelSugerido(sel, projetos, iniciativas, todas) || l.responsavel, vinculos: vinc });
  };

  const salvar = (l: Linha) => guard.current(async () => {
    set(l.chave, { tentou: true });
    if (Object.keys(errosAcao(l)).length) return;
    set(l.chave, { tentou: true, estado: "salvando" });
    const { data, error } = await db.rpc("org_acao_salvar", { _id: l.id ?? null, _cadeira: cadeira, _ciclo: ciclo, _dados: {
      responsavel_pessoa_id: l.responsavel_pessoa_id ?? null,
      projeto_id: l.projeto_id, iniciativa_id: l.iniciativa_id, responsavel: l.responsavel, descricao: l.descricao, vinculos: l.vinculos,
      status: l.status, data_conclusao: l.status === "concluida" ? l.data_conclusao : null, data_prevista: l.data_prevista, motivo_cancelamento: l.status === "cancelada" ? l.motivo_cancelamento : "",
    } });
    if (error) { set(l.chave, { estado: "erro", erroMsg: error.message }); return; }
    setTodas((t) => [...t.filter((x) => x.id !== data.id), data]);
    set(l.chave, { ...data, chave: l.chave, estado: "salvo", tentou: false });
  });

  const gruposVinc = useMemo(() => {
    const ativos = indicadores.filter((i) => i.status === "ativo" && !i.parent_id);
    const op = (o: string) => ativos.filter((i) => i.origem === o && (o !== "cesta" || verTodos || i.cadeira_id === cadeira)).map((i) => ({ value: `indicador:${i.id}`, label: `${i.codigo} · ${i.nome}` }));
    return [
      { grupo: "Objetivos BSC", opcoes: objetivos.map((o) => ({ value: `objetivo:${o.id}`, label: `${o.codigo} · ${o.descricao}` })) },
      { grupo: "KPIs BSC", opcoes: op("bsc") }, { grupo: "OKRs / KRs", opcoes: op("okr") }, { grupo: "Cesta de metas", opcoes: op("cesta") },
    ];
  }, [indicadores, objetivos, verTodos, cadeira]);
  const hoje = hojeSP();

  return <div className="space-y-3 rounded border p-3" aria-label="Ações e entregas">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="font-medium">Ações e entregas por projeto ou iniciativa</h3>
        <p className="text-xs text-muted-foreground">Opcional. Cada ação é salva separadamente e não altera a completude. Itens em andamento voltam no próximo ciclo até serem concluídos ou cancelados.</p></div>
      <div className="flex items-center gap-2"><Checkbox id="acoes-ver-todos" checked={verTodos} onCheckedChange={(v) => setVerTodos(!!v)} /><Label htmlFor="acoes-ver-todos" className="text-xs">Ver projetos e iniciativas de todas as cadeiras</Label></div>
    </div>
    {erro && <p role="alert" className="text-sm text-destructive">Não foi possível carregar as ações.</p>}
    {linhas.map((l) => {
      const e = l.tentou ? errosAcao(l) : {};
      const fonte = l.projeto_id ? `p:${l.projeto_id}` : l.iniciativa_id ? `i:${l.iniciativa_id}` : "nenhum";
      const id = `acao-${l.chave}`;
      const bloqueada = !podeEditar || (!!l.id && l.status !== "em_andamento" && l.ciclo_atualizacao !== ciclo);
      return <div key={l.chave} className="space-y-3 rounded bg-muted/40 p-3">
        <div className="flex flex-wrap gap-2">
          {l.empilhada && <Badge variant="secondary">{rotuloEmpilhada(l.ciclo_origem!)}</Badge>}
          {l.id && <Badge variant="outline">{STATUS_ACAO_LBL[l.status]}</Badge>}
          {acaoAtrasada(l, hoje) && <Badge variant="destructive">Atrasada · previsto {fmt(l.data_prevista)}</Badge>}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5 min-w-0"><Label id={`${id}-fonte-l`}>Projeto/iniciativa</Label>
            <FonteSelect labelId={`${id}-fonte-l`} valor={fonte} rotulo={rotuloFonte(l)} grupos={opcoes} disabled={bloqueada} onChange={(v) => escolherFonte(l, v)} />
            <p className="text-xs text-muted-foreground">Ao escolher, o responsável e os vínculos são sugeridos e podem ser editados.</p></div>
          <FormField id={`${id}-resp`} label="Responsável" help="Pré-preenchido pelo projeto/iniciativa ou pela última ação ligada a ele.">
            <PessoaSelect value={l.responsavel_pessoa_id} texto={l.responsavel} disabled={bloqueada} onChange={p => set(l.chave, { responsavel_pessoa_id: p?.id ?? null })} />
          </FormField>
          <FormField id={`${id}-desc`} label="Descrição da entrega" required error={e.descricao} className="md:col-span-2">
            <Textarea value={l.descricao} maxLength={2000} disabled={bloqueada} onChange={(ev) => set(l.chave, { descricao: ev.target.value })} />
          </FormField>
          <div className="space-y-1.5 md:col-span-2 min-w-0"><Label>Vínculo estratégico (BSC, OKR, cesta de metas)</Label>
            <GrupoMultiSelect grupos={gruposVinc} disabled={bloqueada} placeholder="Escolher vínculos"
              value={l.vinculos.map((v) => `${v.tipo}:${v.ref_id}`)}
              chip={(k) => { const v = l.vinculos.find((x) => `${x.tipo}:${x.ref_id}` === k); return v ? `${v.principal ? "Principal · " : ""}${rotuloVinculo(v, indicadores, objetivos)}` : k; }}
              onChange={(ks) => set(l.chave, { vinculos: ks.map((k) => { const [tipo, ref_id] = k.split(":"); return l.vinculos.find((x) => x.tipo === tipo && x.ref_id === ref_id) ?? { tipo: tipo as Vinculo["tipo"], ref_id, principal: false }; }) })} />
            {!l.vinculos.length && <p className="text-xs text-muted-foreground">Sem vínculos herdados; escolha se fizer sentido.</p>}</div>
          <FormField id={`${id}-status`} label="Status" required>
            <Select value={l.status} disabled={!podeEditar} onValueChange={(v) => set(l.chave, { status: v as AcaoEntrega["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="em_andamento">Em andamento</SelectItem><SelectItem value="concluida">Concluída</SelectItem>{l.id && <SelectItem value="cancelada">Cancelada</SelectItem>}</SelectContent>
            </Select>
          </FormField>
          {l.status === "concluida" && <FormField id={`${id}-conc`} label="Data de conclusão" required error={e.data_conclusao}>
            <Input type="date" value={l.data_conclusao ?? ""} disabled={!podeEditar} onChange={(ev) => set(l.chave, { data_conclusao: ev.target.value || null })} /></FormField>}
          {l.status === "em_andamento" && <FormField id={`${id}-prev`} label="Data prevista de conclusão" required error={e.data_prevista}>
            <Input type="date" value={l.data_prevista ?? ""} disabled={!podeEditar} onChange={(ev) => set(l.chave, { data_prevista: ev.target.value || null })} /></FormField>}
          {l.status === "cancelada" && <FormField id={`${id}-mot`} label="Motivo do cancelamento" required error={e.motivo_cancelamento}>
            <Input value={l.motivo_cancelamento} maxLength={500} disabled={!podeEditar} onChange={(ev) => set(l.chave, { motivo_cancelamento: ev.target.value })} /></FormField>}
        </div>
        {podeEditar && <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={l.estado === "salvando"} onClick={() => salvar(l)}>{l.estado === "salvando" ? "Salvando…" : "Salvar ação"}</Button>
          {!l.id && <Button size="sm" variant="ghost" onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))}>Descartar</Button>}
          <span aria-live="polite" className={cn("text-xs", l.estado === "erro" ? "text-destructive" : "text-muted-foreground")}>
            {l.estado === "salvo" ? "Salvo" : l.estado === "erro" ? `Não foi possível salvar: ${l.erroMsg}` : !l.id ? "Ainda não salva" : ""}</span>
        </div>}
      </div>;
    })}
    {!linhas.length && <p className="text-sm text-muted-foreground">Nenhuma ação registrada neste ciclo.</p>}
    {podeEditar && <Button variant="outline" size="sm" onClick={() => setLinhas((ls) => [...ls, { ...novaAcao(), chave: crypto.randomUUID() }])}><Plus className="mr-1 h-4 w-4" />Adicionar ação/entrega</Button>}
  </div>;
}

function FonteSelect({ labelId, valor, rotulo, grupos, disabled, onChange }: {
  labelId: string; valor: string; rotulo: string; grupos: { grupo: string; itens: { value: string; label: string }[] }[]; disabled?: boolean; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant="outline" aria-labelledby={labelId} disabled={disabled} className="w-full justify-between font-normal">
      <span className="truncate">{rotulo}</span><ChevronsUpDown className="h-4 w-4 opacity-50" /></Button></PopoverTrigger>
    <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0" align="start">
      <Command><CommandInput placeholder="Buscar projeto ou iniciativa…" /><CommandList className="max-h-72">
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup><CommandItem value="Sem projeto/iniciativa" onSelect={() => { onChange("nenhum"); setOpen(false); }}><Check className={cn("mr-2 h-4 w-4", valor === "nenhum" ? "opacity-100" : "opacity-0")} />Sem projeto/iniciativa</CommandItem></CommandGroup>
        {grupos.map((g) => <CommandGroup key={g.grupo} heading={g.grupo}>{g.itens.map((o) => <CommandItem key={o.value} value={`${g.grupo} ${o.label} ${o.value}`} onSelect={() => { onChange(o.value); setOpen(false); }}>
          <Check className={cn("mr-2 h-4 w-4", valor === o.value ? "opacity-100" : "opacity-0")} /><span className="flex-1">{o.label}</span></CommandItem>)}</CommandGroup>)}
      </CommandList></Command>
    </PopoverContent>
  </Popover>;
}

/** Lista somente leitura (dashboard por diretor e ficha do projeto). */
export function AcoesEntregaLista({ filtro, cadeiras, titulo }: { filtro: { projeto_id?: string; cadeira_id?: string }; cadeiras?: { id: string; nome: string }[]; titulo: string }) {
  const { diretorio } = useBaseOrganizacional();
  const [itens, setItens] = useState<any[] | null>(null);
  useEffect(() => {
    let q = db.from("rotina_acoes_entrega").select("*").order("updated_at", { ascending: false }).limit(300);
    if (filtro.projeto_id) q = q.eq("projeto_id", filtro.projeto_id);
    if (filtro.cadeira_id) q = q.eq("cadeira_id", filtro.cadeira_id);
    q.then(({ data }: any) => setItens(data ?? []));
  }, [filtro.projeto_id, filtro.cadeira_id]);
  const hoje = hojeSP();
  const porCad = new Map<string, any[]>();
  for (const i of itens ?? []) porCad.set(i.cadeira_id, [...(porCad.get(i.cadeira_id) ?? []), i]);
  return <section className="space-y-2 rounded border p-4" aria-label={titulo}>
    <h2 className="font-semibold">{titulo}</h2>
    {itens === null && <p className="text-sm text-muted-foreground">Carregando…</p>}
    {itens?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ação registrada.</p>}
    {[...porCad.entries()].map(([cad, lista]) => <div key={cad} className="space-y-1">
      {cadeiras && <p className="text-sm font-medium">{cadeiras.find((c) => c.id === cad)?.nome ?? "Cadeira"} · {lista.filter((x) => x.status === "concluida").length} concluídas · {lista.filter((x) => x.status === "em_andamento").length} em andamento · {lista.filter((x) => acaoAtrasada(x, hoje)).length} atrasadas</p>}
      <ul className="space-y-1 text-sm">{lista.map((a) => <li key={a.id} className="flex flex-wrap items-center gap-2 border-b pb-1">
        <Badge variant={acaoAtrasada(a, hoje) ? "destructive" : "outline"}>{acaoAtrasada(a, hoje) ? "Atrasada" : STATUS_ACAO_LBL[a.status as AcaoEntrega["status"]]}</Badge>
        <span className="min-w-0 flex-1 break-words">{a.descricao}</span>
        <span className="text-xs text-muted-foreground">{nomeVinculado(a.responsavel_pessoa_id, a.responsavel, diretorio.pessoas) || '—'} · {a.status === "concluida" ? `concluída ${fmt(a.data_conclusao)}` : a.status === "em_andamento" ? `previsto ${fmt(a.data_prevista)}` : a.motivo_cancelamento}</span>
      </li>)}</ul>
    </div>)}
  </section>;
}
