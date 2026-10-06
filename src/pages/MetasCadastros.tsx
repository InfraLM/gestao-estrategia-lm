import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useMetasBase, MESES_2S26, NOME_MES, STATUS_INI, statusEfetivo, fmtNum, fmtData, EMAIL_CORP,
  type Indicador, type Iniciativa,
} from "@/hooks/useMetasBase";

const db = supabase as any;
const NONE = "__none";
const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\./g, "").replace(",", ".")));
const txtNum = (v: number | null | undefined) => (v == null ? "" : String(v).replace(".", ","));

async function salvar(tabela: string, row: any, id?: string) {
  const { error } = id ? await db.from(tabela).update(row).eq(id.includes("=") ? id.split("=")[0] : "id", id.includes("=") ? id.split("=")[1] : id) : await db.from(tabela).insert(row);
  if (error) { toast.error(error.message); return false; }
  toast.success("Salvo"); return true;
}

function Sel({ value, onChange, items, placeholder, allowNone }: { value: string | null; onChange: (v: string | null) => void; items: { v: string; l: string }[]; placeholder: string; allowNone?: boolean }) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NONE}>— sem vínculo —</SelectItem>}
        {items.map((i) => <SelectItem key={i.v} value={i.v}>{i.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-medium">{label}</span>{children}</label>;
}

export default function MetasCadastros() {
  const b = useMetasBase();
  const [edit, setEdit] = useState<{ tipo: string; row: any } | null>(null);
  const [origemF, setOrigemF] = useState<string>("todas");
  const [cadF, setCadF] = useState<string>("todas");
  const [statusF, setStatusF] = useState<string>("ativo");

  const nomeCad = (id: string | null) => b.cadeiras.find((c) => c.id === id)?.nome ?? "—";
  const nomeObj = (id: string | null) => b.objetivos.find((o) => o.id === id)?.codigo ?? "—";
  const nomeOkr = (id: string | null) => b.okrs.find((o) => o.id === id)?.codigo ?? "—";
  const nomePessoa = (id: string | null) => { const p = b.perfis.find((x) => x.user_id === id); return p?.display_name || p?.email || "—"; };
  const cadItems = b.cadeiras.map((c) => ({ v: c.id, l: c.nome }));
  const objItems = b.objetivos.map((o) => ({ v: o.id, l: `${o.codigo} · ${o.descricao}` }));
  const okrItems = b.okrs.map((o) => ({ v: o.id, l: o.nome }));
  const pessoaItems = b.perfis.map((p) => ({ v: p.user_id, l: p.display_name || p.email || p.user_id }));

  const indicadores = useMemo(() => b.indicadores.filter((i) =>
    (origemF === "todas" || i.origem === origemF) && (cadF === "todas" || i.cadeira_id === cadF) && (statusF === "todos" || i.status === statusF)
  ), [b.indicadores, origemF, cadF, statusF]);

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!b.corporativo && !b.isGov) {
    return (
      <Card className="p-6 max-w-lg">
        <div className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" /> Acesso restrito</div>
        <p className="text-sm text-muted-foreground mt-2">O Sistema de Metas é exclusivo para e-mails corporativos ({EMAIL_CORP}).</p>
      </Card>
    );
  }
  const ro = !b.isGov;
  const abrir = (tipo: string, row: any) => setEdit({ tipo, row: { ...row } });
  const set = (k: string, v: any) => setEdit((e) => e && { ...e, row: { ...e.row, [k]: v } });
  const remover = async (tabela: string, id: string) => {
    if (!confirm("Excluir este registro?")) return;
    const { error } = await db.from(tabela).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); b.reload(); }
  };

  const BotaoNovo = ({ tipo, row, label }: { tipo: string; row: any; label: string }) =>
    ro ? null : <Button size="sm" onClick={() => abrir(tipo, row)}><Plus className="h-4 w-4 mr-1" />{label}</Button>;
  const Acoes = ({ tipo, row, tabela }: { tipo: string; row: any; tabela: string }) =>
    ro ? null : (
      <div className="flex gap-1 justify-end">
        <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => abrir(tipo, row)}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => remover(tabela, row.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    );

  const gravar = async () => {
    if (!edit) return;
    const r = edit.row; let ok = false;
    switch (edit.tipo) {
      case "cadeira": {
        const diretor = b.perfis.find((p) => p.user_id === r.diretor_user_id);
        ok = await salvar("mt_cadeiras", { nome: r.nome, diretor_user_id: r.diretor_user_id, diretor_nome: diretor?.display_name ?? r.diretor_nome ?? null, ativo: r.ativo ?? true }, r.id);
        break;
      }
      case "usuario": {
        const { error } = await db.from("mt_usuarios").upsert({ user_id: r.user_id, perfil: r.perfil ?? "diretor", cadeira_id: r.cadeira_id ?? null });
        if (error) toast.error(error.message); else { toast.success("Salvo"); ok = true; }
        break;
      }
      case "objetivo": ok = await salvar("mt_objetivos", { codigo: r.codigo, perspectiva: r.perspectiva, descricao: r.descricao }, r.id); break;
      case "okr": {
        const { data, error } = r.id
          ? await db.from("mt_okrs").update({ codigo: r.codigo, nome: r.nome, semestre: r.semestre }).eq("id", r.id).select().single()
          : await db.from("mt_okrs").insert({ codigo: r.codigo, nome: r.nome, semestre: r.semestre ?? "2026/2" }).select().single();
        if (error) { toast.error(error.message); break; }
        await db.from("mt_okr_objetivos").delete().eq("okr_id", data.id);
        if ((r.objs ?? []).length) await db.from("mt_okr_objetivos").insert(r.objs.map((o: string) => ({ okr_id: data.id, objetivo_id: o })));
        toast.success("Salvo"); ok = true; break;
      }
      case "indicador": {
        if (r.parent_id && r.regra_pai === "media_ponderada" && (r.peso_componente == null)) { toast.error("Informe o peso do componente (regra média ponderada)."); return; }
        const row = {
          codigo: r.codigo, nome: r.nome, origem: r.origem, objetivo_id: r.objetivo_id, okr_id: r.origem === "okr" ? r.okr_id : null,
          cadeira_id: r.cadeira_id, unidade: r.unidade || null, sentido: r.sentido, peso: r.peso ?? 0, status: r.status,
          meta_semestre: r.meta_semestre, meta_texto: r.meta_texto || null, parent_id: r.parent_id, regra_consolidacao: r.regra_consolidacao,
          peso_componente: r.peso_componente, observacoes: r.observacoes || null,
        };
        const { data, error } = r.id ? await db.from("mt_indicadores").update(row).eq("id", r.id).select().single() : await db.from("mt_indicadores").insert(row).select().single();
        if (error) { toast.error(error.message); break; }
        const metas = MESES_2S26.map((c) => ({ indicador_id: data.id, competencia: c, meta_mes: r.metas?.[c]?.mes ?? null, meta_acumulada: r.metas?.[c]?.acum ?? null }));
        const { error: e2 } = await db.from("mt_metas_mensais").upsert(metas, { onConflict: "indicador_id,competencia" });
        if (e2) toast.error(e2.message); else { toast.success("Salvo"); ok = true; }
        break;
      }
      case "iniciativa": {
        const resp = b.perfis.find((p) => p.user_id === r.responsavel_user_id);
        ok = await salvar("mt_iniciativas", {
          titulo: r.titulo, okr_id: r.okr_id, indicador_id: r.indicador_id, objetivo_id: r.objetivo_id, cadeira_id: r.cadeira_id,
          responsavel_user_id: r.responsavel_user_id, responsavel_nome: resp?.display_name ?? resp?.email ?? null,
          prazo: r.prazo || null, status: r.status ?? "a_iniciar", comentario: r.comentario || null, ...(r.id ? {} : { created_by: b.user?.id }),
        }, r.id);
        break;
      }
    }
    if (ok) { setEdit(null); b.reload(); }
  };

  const abrirIndicador = (i: Partial<Indicador>) => {
    const metas: any = {};
    for (const m of b.metas.filter((m) => m.indicador_id === i.id)) metas[m.competencia] = { mes: m.meta_mes, acum: m.meta_acumulada };
    abrir("indicador", { sentido: "maior", status: "ativo", peso: 1, origem: "bsc", regra_consolidacao: "pior", ...i, metas });
  };
  const podeCriarIniciativa = b.isGov || !!b.minhaCadeira;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Cadastros · Sistema de Metas 2S26</h2>
          <p className="text-sm text-muted-foreground">Base compartilhada pelo Lançamento Mensal de Metas e pelo Check-in semanal.</p>
        </div>
        <Badge variant={b.isGov ? "default" : "outline"} className="gap-1">
          <ShieldCheck className="h-3 w-3" /> {b.isGov ? "Governança · pode editar" : "Diretor · somente leitura"}
        </Badge>
      </div>

      <Tabs defaultValue="indicadores">
        <div className="overflow-x-auto"><TabsList className="flex-wrap h-auto">
          <TabsTrigger value="indicadores">Indicadores ({b.indicadores.length})</TabsTrigger>
          <TabsTrigger value="iniciativas">Iniciativas ({b.iniciativas.length})</TabsTrigger>
          <TabsTrigger value="okrs">OKRs ({b.okrs.length})</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos BSC ({b.objetivos.length})</TabsTrigger>
          <TabsTrigger value="cadeiras">Cadeiras ({b.cadeiras.length})</TabsTrigger>
          {b.isGov && <TabsTrigger value="usuarios">Usuários e perfis</TabsTrigger>}
        </TabsList></div>

        {/* INDICADORES */}
        <TabsContent value="indicadores" className="space-y-3">
          <div className="flex gap-2 flex-wrap items-end">
            <div className="w-40"><Campo label="Origem"><Sel value={origemF} onChange={(v) => setOrigemF(v ?? "todas")} placeholder="Origem" items={[{ v: "todas", l: "Todas" }, { v: "bsc", l: "KPI do BSC" }, { v: "okr", l: "KR de OKR" }, { v: "cesta", l: "Cesta de metas" }]} /></Campo></div>
            <div className="w-56"><Campo label="Cadeira"><Sel value={cadF} onChange={(v) => setCadF(v ?? "todas")} placeholder="Cadeira" items={[{ v: "todas", l: "Todas" }, ...cadItems]} /></Campo></div>
            <div className="w-36"><Campo label="Status"><Sel value={statusF} onChange={(v) => setStatusF(v ?? "todos")} placeholder="Status" items={[{ v: "todos", l: "Todos" }, { v: "ativo", l: "Ativos" }, { v: "arquivado", l: "Arquivados" }]} /></Campo></div>
            <div className="ml-auto"><BotaoNovo tipo="indicador" row={{}} label="Novo indicador" /></div>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
                <th className="text-left p-2 freeze-col-1 bg-muted">Código</th><th className="text-left p-2">Nome</th><th className="p-2">Origem</th>
                <th className="text-left p-2">Objetivo</th><th className="text-left p-2">Cadeira</th><th className="p-2">Sentido</th>
                <th className="p-2">Peso</th><th className="text-left p-2">Meta</th><th className="p-2">Curva</th><th className="p-2">Status</th><th className="p-2" />
              </tr></thead>
              <tbody>
                {indicadores.map((i) => {
                  const nMetas = b.metas.filter((m) => m.indicador_id === i.id && m.meta_mes != null).length;
                  const pai = b.indicadores.find((x) => x.id === i.parent_id);
                  return (
                    <tr key={i.id} className="border-t">
                      <td className="p-2 font-mono text-xs freeze-col-1 bg-card">{i.codigo}</td>
                      <td className="p-2 min-w-[220px]">{i.nome}{pai && <div className="text-[11px] text-muted-foreground">componente de {pai.codigo}</div>}</td>
                      <td className="p-2 text-center"><Badge variant="outline" className="text-[10px] uppercase">{i.origem}</Badge></td>
                      <td className="p-2">{nomeObj(i.objetivo_id)}{i.okr_id && <div className="text-[11px] text-muted-foreground">{nomeOkr(i.okr_id)}</div>}</td>
                      <td className="p-2">{nomeCad(i.cadeira_id)}</td>
                      <td className="p-2 text-center text-xs">{i.sentido === "maior" ? "↑ maior" : "↓ menor"}</td>
                      <td className="p-2 text-center">{Number(i.peso) === 0 ? <Badge variant="secondary" className="text-[10px]">peso 0</Badge> : fmtNum(Number(i.peso))}</td>
                      <td className="p-2 text-xs">{i.meta_semestre != null ? `${fmtNum(i.meta_semestre)} ${i.unidade ?? ""}` : i.meta_texto ?? "—"}</td>
                      <td className="p-2 text-center text-xs">{nMetas ? `${nMetas}/6` : <span className="text-warning">pendente</span>}</td>
                      <td className="p-2 text-center"><Badge variant={i.status === "ativo" ? "default" : "secondary"} className="text-[10px]">{i.status}</Badge></td>
                      <td className="p-2">{!ro && <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => abrirIndicador(i)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => remover("mt_indicadores", i.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>}</td>
                    </tr>
                  );
                })}
                {!indicadores.length && <tr><td colSpan={11} className="p-4 text-center text-muted-foreground">Nenhum indicador.</td></tr>}
              </tbody>
            </table>
          </Card>
          <p className="text-xs text-muted-foreground">Arquivados saem dos lançamentos, mas o histórico é preservado. Peso 0 aparece em seção própria e não entra na nota.</p>
        </TabsContent>

        {/* INICIATIVAS */}
        <TabsContent value="iniciativas" className="space-y-3">
          <div className="flex justify-end">{podeCriarIniciativa && <Button size="sm" onClick={() => abrir("iniciativa", { status: "a_iniciar", cadeira_id: b.minhaCadeira })}><Plus className="h-4 w-4 mr-1" />Nova iniciativa</Button>}</div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
                <th className="text-left p-2 freeze-col-1 bg-muted">Título</th><th className="text-left p-2">Origem</th><th className="text-left p-2">Objetivo</th>
                <th className="text-left p-2">Cadeira</th><th className="text-left p-2">Responsável</th><th className="p-2">Prazo</th><th className="p-2">Status</th><th className="p-2" />
              </tr></thead>
              <tbody>
                {b.iniciativas.map((i) => {
                  const st = statusEfetivo(i);
                  const podeEditar = b.isGov || i.cadeira_id === b.minhaCadeira || i.responsavel_user_id === b.user?.id;
                  const ind = b.indicadores.find((x) => x.id === i.indicador_id);
                  return (
                    <tr key={i.id} className="border-t">
                      <td className="p-2 min-w-[220px] freeze-col-1 bg-card">{i.titulo}</td>
                      <td className="p-2 text-xs">{i.okr_id ? nomeOkr(i.okr_id) : ind ? ind.codigo : "sem vínculo"}</td>
                      <td className="p-2">{nomeObj(i.objetivo_id)}</td>
                      <td className="p-2">{nomeCad(i.cadeira_id)}</td>
                      <td className="p-2">{i.responsavel_nome ?? "—"}</td>
                      <td className="p-2 text-center">{fmtData(i.prazo)}</td>
                      <td className="p-2 text-center"><Badge variant={st === "atrasada" ? "destructive" : "outline"} className="text-[10px]">{STATUS_INI[st]}</Badge></td>
                      <td className="p-2">{podeEditar && <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => abrir("iniciativa", i)}><Pencil className="h-4 w-4" /></Button>
                        {b.isGov && <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => remover("mt_iniciativas", i.id)}><Trash2 className="h-4 w-4" /></Button>}
                      </div>}</td>
                    </tr>
                  );
                })}
                {!b.iniciativas.length && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Nenhuma iniciativa cadastrada.</td></tr>}
              </tbody>
            </table>
          </Card>
          <p className="text-xs text-muted-foreground">"Atrasada" é marcado automaticamente quando o prazo vence sem conclusão.</p>
        </TabsContent>

        {/* OKRS */}
        <TabsContent value="okrs" className="space-y-3">
          <div className="flex justify-end"><BotaoNovo tipo="okr" row={{ semestre: "2026/2", objs: [] }} label="Novo OKR" /></div>
          <div className="grid gap-3 md:grid-cols-2">
            {b.okrs.map((o) => {
              const objs = b.okrObj.filter((x) => x.okr_id === o.id).map((x) => x.objetivo_id);
              const krs = b.indicadores.filter((i) => i.okr_id === o.id);
              return (
                <Card key={o.id} className="p-4 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div><div className="font-semibold text-sm">{o.nome}</div><div className="text-xs text-muted-foreground">{o.semestre} · {krs.length} KRs</div></div>
                    <Acoes tipo="okr" tabela="mt_okrs" row={{ ...o, objs }} />
                  </div>
                  <div className="flex gap-1 flex-wrap">{objs.map((x) => <Badge key={x} variant="outline" className="text-[10px]">{nomeObj(x)}</Badge>)}</div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">{krs.map((k) => <li key={k.id}>{k.codigo} · {k.nome} <span className="opacity-70">({nomeCad(k.cadeira_id)})</span></li>)}</ul>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* OBJETIVOS */}
        <TabsContent value="objetivos" className="space-y-3">
          <div className="flex justify-end"><BotaoNovo tipo="objetivo" row={{}} label="Novo objetivo" /></div>
          <Card className="divide-y">
            {b.objetivos.map((o) => (
              <div key={o.id} className="p-3 flex items-center gap-3">
                <span className="font-mono text-xs w-14">{o.codigo}</span>
                <div className="flex-1"><div className="text-sm">{o.descricao}</div><div className="text-xs text-muted-foreground">{o.perspectiva}</div></div>
                <Acoes tipo="objetivo" tabela="mt_objetivos" row={o} />
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* CADEIRAS */}
        <TabsContent value="cadeiras" className="space-y-3">
          <div className="flex justify-end"><BotaoNovo tipo="cadeira" row={{ ativo: true }} label="Nova cadeira" /></div>
          <Card className="divide-y">
            {b.cadeiras.map((c) => (
              <div key={c.id} className="p-3 flex items-center gap-3">
                <div className="flex-1"><div className="text-sm font-medium">{c.nome}</div>
                  <div className="text-xs text-muted-foreground">Diretor: {c.diretor_user_id ? nomePessoa(c.diretor_user_id) : `${c.diretor_nome ?? "—"} (sem usuário vinculado)`} · {b.indicadores.filter((i) => i.cadeira_id === c.id && i.status === "ativo").length} indicadores</div></div>
                <Acoes tipo="cadeira" tabela="mt_cadeiras" row={c} />
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* USUÁRIOS */}
        {b.isGov && (
          <TabsContent value="usuarios" className="space-y-3">
            <p className="text-xs text-muted-foreground">Cada usuário pertence a uma cadeira. Diretor edita só a própria cadeira; Governança administra tudo. Só e-mails {EMAIL_CORP} acessam o sistema.</p>
            <Card className="divide-y">
              {b.perfis.map((p) => {
                const u = b.usuarios.find((x) => x.user_id === p.user_id);
                const corp = p.email?.toLowerCase().endsWith(EMAIL_CORP);
                return (
                  <div key={p.user_id} className="p-3 flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]"><div className="text-sm">{p.display_name ?? p.email}</div><div className="text-xs text-muted-foreground">{p.email}{!corp && " · fora do domínio (sem acesso)"}</div></div>
                    <Badge variant={u?.perfil === "governanca" ? "default" : "outline"} className="text-[10px]">{u ? (u.perfil === "governanca" ? "Governança" : "Diretor") : "não configurado"}</Badge>
                    <span className="text-xs w-48">{nomeCad(u?.cadeira_id ?? null)}</span>
                    <Button size="icon" variant="ghost" aria-label="Editar" disabled={!corp} onClick={() => abrir("usuario", { user_id: p.user_id, perfil: u?.perfil ?? "diretor", cadeira_id: u?.cadeira_id ?? null, _nome: p.display_name ?? p.email })}><Pencil className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* FORMULÁRIOS */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.row.id || edit?.tipo === "usuario" ? "Editar" : "Novo"} · {{ cadeira: "Cadeira", usuario: "Usuário", objetivo: "Objetivo BSC", okr: "OKR", indicador: "Indicador", iniciativa: "Iniciativa" }[edit?.tipo ?? ""]}</DialogTitle></DialogHeader>
          {edit && (() => { const r = edit.row; switch (edit.tipo) {
            case "cadeira": return (<div className="space-y-3">
              <Campo label="Nome"><Input value={r.nome ?? ""} onChange={(e) => set("nome", e.target.value)} /></Campo>
              <Campo label="Diretor responsável (usuário)"><Sel value={r.diretor_user_id} onChange={(v) => set("diretor_user_id", v)} items={pessoaItems} placeholder="Selecione" allowNone /></Campo>
              {!r.diretor_user_id && <Campo label="Nome do diretor (enquanto não tem usuário)"><Input value={r.diretor_nome ?? ""} onChange={(e) => set("diretor_nome", e.target.value)} /></Campo>}
            </div>);
            case "usuario": return (<div className="space-y-3">
              <p className="text-sm font-medium">{r._nome}</p>
              <Campo label="Perfil"><Sel value={r.perfil} onChange={(v) => set("perfil", v ?? "diretor")} items={[{ v: "diretor", l: "Diretor" }, { v: "governanca", l: "Governança" }]} placeholder="Perfil" /></Campo>
              <Campo label="Cadeira"><Sel value={r.cadeira_id} onChange={(v) => set("cadeira_id", v)} items={cadItems} placeholder="Selecione" allowNone /></Campo>
            </div>);
            case "objetivo": return (<div className="space-y-3">
              <Campo label="Código"><Input value={r.codigo ?? ""} onChange={(e) => set("codigo", e.target.value)} placeholder="Ex.: F.01" /></Campo>
              <Campo label="Perspectiva"><Sel value={r.perspectiva ?? null} onChange={(v) => set("perspectiva", v)} placeholder="Selecione" items={["Financeira", "Cliente", "Processos Internos", "Aprendizado e Crescimento"].map((x) => ({ v: x, l: x }))} /></Campo>
              <Campo label="Descrição"><Textarea value={r.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} /></Campo>
            </div>);
            case "okr": return (<div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Código"><Input value={r.codigo ?? ""} onChange={(e) => set("codigo", e.target.value)} /></Campo>
                <Campo label="Semestre"><Input value={r.semestre ?? ""} onChange={(e) => set("semestre", e.target.value)} /></Campo>
              </div>
              <Campo label="Nome"><Input value={r.nome ?? ""} onChange={(e) => set("nome", e.target.value)} /></Campo>
              <Campo label="Objetivos estratégicos vinculados">
                <div className="grid sm:grid-cols-2 gap-1">{b.objetivos.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={(r.objs ?? []).includes(o.id)} onChange={(e) => set("objs", e.target.checked ? [...(r.objs ?? []), o.id] : (r.objs ?? []).filter((x: string) => x !== o.id))} />
                    {o.codigo} · {o.descricao}
                  </label>))}</div>
              </Campo>
            </div>);
            case "indicador": {
              const pai = b.indicadores.find((x) => x.id === r.parent_id);
              return (<div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Campo label="Código"><Input value={r.codigo ?? ""} onChange={(e) => set("codigo", e.target.value)} placeholder="Ex.: c.01" /></Campo>
                  <Campo label="Origem"><Sel value={r.origem} onChange={(v) => set("origem", v)} placeholder="Origem" items={[{ v: "bsc", l: "KPI do BSC" }, { v: "okr", l: "KR de OKR" }, { v: "cesta", l: "Cesta de metas" }]} /></Campo>
                  <Campo label="Status"><Sel value={r.status} onChange={(v) => set("status", v)} placeholder="Status" items={[{ v: "ativo", l: "Ativo" }, { v: "arquivado", l: "Arquivado" }]} /></Campo>
                </div>
                <Campo label="Nome"><Input value={r.nome ?? ""} onChange={(e) => set("nome", e.target.value)} /></Campo>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Campo label="Objetivo estratégico"><Sel value={r.objetivo_id} onChange={(v) => set("objetivo_id", v)} items={objItems} placeholder="Selecione" allowNone /></Campo>
                  <Campo label="Cadeira responsável"><Sel value={r.cadeira_id} onChange={(v) => set("cadeira_id", v)} items={cadItems} placeholder="Selecione" allowNone /></Campo>
                  {r.origem === "okr" && <Campo label="OKR"><Sel value={r.okr_id} onChange={(v) => set("okr_id", v)} items={okrItems} placeholder="Selecione" /></Campo>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Campo label="Unidade"><Input value={r.unidade ?? ""} onChange={(e) => set("unidade", e.target.value)} placeholder="%, R$, dias" /></Campo>
                  <Campo label="Sentido"><Sel value={r.sentido} onChange={(v) => set("sentido", v)} placeholder="Sentido" items={[{ v: "maior", l: "Quanto maior melhor" }, { v: "menor", l: "Quanto menor melhor" }]} /></Campo>
                  <Campo label="Peso"><Input inputMode="decimal" value={txtNum(r.peso)} onChange={(e) => set("peso", num(e.target.value) ?? 0)} /></Campo>
                  <Campo label="Meta do semestre"><Input inputMode="decimal" value={txtNum(r.meta_semestre)} onChange={(e) => set("meta_semestre", num(e.target.value))} /></Campo>
                </div>
                <Campo label="Meta (texto de referência)"><Input value={r.meta_texto ?? ""} onChange={(e) => set("meta_texto", e.target.value)} /></Campo>
                <Campo label="Curva de metas mensais (2º semestre)">
                  <div className="overflow-x-auto"><table className="text-xs w-full">
                    <thead><tr><th className="text-left p-1" />{MESES_2S26.map((c) => <th key={c} className="p-1">{NOME_MES[c.slice(5)]}</th>)}</tr></thead>
                    <tbody>{(["mes", "acum"] as const).map((k) => (
                      <tr key={k}><td className="p-1 whitespace-nowrap">{k === "mes" ? "Meta do mês" : "Meta acumulada"}</td>
                        {MESES_2S26.map((c) => <td key={c} className="p-1"><Input className="h-8 min-w-[70px]" inputMode="decimal" aria-label={`${k} ${c}`} value={txtNum(r.metas?.[c]?.[k])}
                          onChange={(e) => set("metas", { ...r.metas, [c]: { ...r.metas?.[c], [k]: num(e.target.value) } })} /></td>)}</tr>))}
                    </tbody></table></div>
                </Campo>
                <div className="rounded-md border p-3 space-y-3">
                  <div className="text-xs font-semibold">Indicador composto</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Campo label="É componente de"><Sel value={r.parent_id} onChange={(v) => setEdit((e) => e && { ...e, row: { ...e.row, parent_id: v, regra_pai: b.indicadores.find((x) => x.id === v)?.regra_consolidacao } })} allowNone placeholder="Não é componente"
                      items={b.indicadores.filter((x) => x.id !== r.id && !x.parent_id).map((x) => ({ v: x.id, l: `${x.codigo} · ${x.nome}` }))} /></Campo>
                    {r.parent_id
                      ? <Campo label={`Peso do componente${(r.regra_pai ?? pai?.regra_consolidacao) === "media_ponderada" ? " (obrigatório)" : ""}`}><Input inputMode="decimal" value={txtNum(r.peso_componente)} onChange={(e) => set("peso_componente", num(e.target.value))} /></Campo>
                      : <Campo label="Regra de consolidação dos componentes"><Sel value={r.regra_consolidacao} onChange={(v) => set("regra_consolidacao", v)} placeholder="Regra" items={[{ v: "pior", l: "Pior resultado entre os componentes" }, { v: "media_ponderada", l: "Média ponderada (peso por componente)" }]} /></Campo>}
                  </div>
                </div>
                <Campo label="Fórmula / observações"><Textarea value={r.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} /></Campo>
              </div>);
            }
            case "iniciativa": return (<div className="space-y-3">
              <Campo label="Título"><Input value={r.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} /></Campo>
              <div className="grid sm:grid-cols-2 gap-3">
                <Campo label="Origem (OKR ou objetivo do BSC)">
                  <Sel value={r.okr_id ? `okr:${r.okr_id}` : r.objetivo_id && !r.indicador_id ? `obj:${r.objetivo_id}` : null} allowNone placeholder="Sem vínculo"
                    onChange={(v) => setEdit((e) => e && { ...e, row: { ...e.row, okr_id: v?.startsWith("okr:") ? v.slice(4) : null, objetivo_id: v?.startsWith("obj:") ? v.slice(4) : e.row.objetivo_id } })}
                    items={[...b.okrs.map((o) => ({ v: `okr:${o.id}`, l: `OKR · ${o.nome}` })), ...b.objetivos.map((o) => ({ v: `obj:${o.id}`, l: `BSC · ${o.codigo} ${o.descricao}` }))]} />
                </Campo>
                <Campo label="KPI / KR de origem (opcional)"><Sel value={r.indicador_id} onChange={(v) => set("indicador_id", v)} allowNone placeholder="Nenhum" items={b.indicadores.filter((i) => i.status === "ativo").map((i) => ({ v: i.id, l: `${i.codigo} · ${i.nome}` }))} /></Campo>
                <Campo label="Objetivo estratégico"><Sel value={r.objetivo_id} onChange={(v) => set("objetivo_id", v)} items={objItems} placeholder="Selecione" allowNone /></Campo>
                <Campo label="Cadeira"><Sel value={r.cadeira_id} onChange={(v) => set("cadeira_id", v)} items={b.isGov ? cadItems : cadItems.filter((c) => c.v === b.minhaCadeira)} placeholder="Selecione" allowNone={b.isGov} /></Campo>
                <Campo label="Responsável (qualquer usuário)"><Sel value={r.responsavel_user_id} onChange={(v) => set("responsavel_user_id", v)} items={pessoaItems} placeholder="Selecione" allowNone /></Campo>
                <Campo label="Prazo"><Input type="date" value={r.prazo ?? ""} onChange={(e) => set("prazo", e.target.value)} /></Campo>
                <Campo label="Status"><Sel value={r.status} onChange={(v) => set("status", v)} placeholder="Status" items={["a_iniciar", "em_andamento", "concluida", "cancelada"].map((x) => ({ v: x, l: STATUS_INI[x] }))} /></Campo>
              </div>
              <Campo label="Comentário"><Textarea value={r.comentario ?? ""} onChange={(e) => set("comentario", e.target.value)} /></Campo>
            </div>);
          } return null; })()}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button><Button onClick={gravar}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
