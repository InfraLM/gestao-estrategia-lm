import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase, statusEfetivo, STATUS_INI } from "@/hooks/useMetasBase";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import PendenciasComites from "@/components/PendenciasComites";
import { entregasDoCheckin, puxarAcao, PrioridadeSemanal } from "@/lib/governancaPendencias";

const db = supabase as any;
export type Prioridade = PrioridadeSemanal;
export type CheckinConteudo = { prioridades: Prioridade[]; riscos: string; apoio: string; confianca: number };
export type Entrega = { titulo: string; status: "entregue" | "parcial" | "nao_entregue" | ""; motivo: string; iniciativa_id?: string; novo_status_ini?: string; gov_acao_id?: string; gov_comite_codigo?: string };
export type KpiSituacao = { indicador_id: string; valor: string; situacao: "no_trilho" | "atencao" | "fora" | ""; comentario: string };
export const SITUACAO_LBL: Record<string, string> = { no_trilho: "No trilho", atencao: "Atenção", fora: "Fora do trilho" };
export type CheckoutConteudo = { entregas: Entrega[]; extras: string; aprendizados: string; proxima: string; ritmo: number; kpis?: KpiSituacao[] };
export const ENTREGA_LBL: Record<string, string> = { entregue: "Entregue", parcial: "Parcial", nao_entregue: "Não entregue" };

export function segunda(d = new Date()) {
  const x = new Date(d); x.setHours(12); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w);
  return x.toISOString().slice(0, 10);
}
/** Prazos: check-in até segunda 12h; checkout até sexta 18h (horário local). */
export function prazoDe(semana: string, tipo: string) {
  const d = new Date(semana + "T00:00:00");
  if (tipo === "checkin") d.setHours(12); else { d.setDate(d.getDate() + 4); d.setHours(18); }
  return d;
}
const fmtSem = (s: string) => new Date(s + "T12:00").toLocaleDateString("pt-BR");
const vazioIn = (): CheckinConteudo => ({ prioridades: [{ titulo: "", iniciativa_id: "", resultado: "" }], riscos: "", apoio: "", confianca: 3 });

export default function MetasSemanal() {
  const b = useMetasBase();
  const access = useModuleAccess();
  const [cad, setCad] = useState<string>("");
  const [sem, setSem] = useState(segunda());
  const [rows, setRows] = useState<any[]>([]);
  const [ci, setCi] = useState<CheckinConteudo>(vazioIn());
  const [co, setCo] = useState<CheckoutConteudo>({ entregas: [], extras: "", aprendizados: "", proxima: "", ritmo: 3 });

  useEffect(() => { if (!cad && !b.loading) setCad(b.minhaCadeira ?? b.cadeiras.find((c) => c.ativo)?.id ?? ""); }, [b.loading]);
  const load = async () => {
    if (!cad) return;
    const { data } = await db.from("mt_checkins").select("*").eq("cadeira_id", cad).eq("semana", sem);
    setRows(data ?? []);
    const rIn = data?.find((r: any) => r.tipo === "checkin"); const rOut = data?.find((r: any) => r.tipo === "checkout");
    const cin: CheckinConteudo = rIn?.conteudo?.prioridades ? rIn.conteudo : vazioIn();
    setCi(cin);
    setCo(rOut?.conteudo?.entregas ? rOut.conteudo : {
      entregas: entregasDoCheckin(cin.prioridades),
      extras: "", aprendizados: "", proxima: "", ritmo: 3, kpis: [],
    });
  };
  useEffect(() => { load(); }, [cad, sem]);

  const podeEditar = access.canWrite("rotina") && (b.isGovernanca || (!!cad && b.minhaCadeira === cad));
  const semanas = useMemo(() => [0, 1, 2, 3, 4, 5].map((n) => segunda(new Date(Date.now() - n * 7 * 864e5))), []);
  const inis = b.iniciativas.filter((i) => i.cadeira_id === cad && !["concluida", "cancelada"].includes(i.status));
  const inds = b.indicadores.filter((x) => x.cadeira_id === cad && x.status === "ativo");
  const kpis = co.kpis ?? [];
  const vinc = (id?: string) => {
    const x = b.iniciativas.find((i) => i.id === id); if (!x) return null;
    const okr = b.okrs.find((o) => o.id === x.okr_id); const obj = b.objetivos.find((o) => o.id === x.objetivo_id);
    const ind = b.indicadores.find((o) => o.id === x.indicador_id);
    return { x, txt: [okr?.codigo, ind?.codigo, obj?.codigo].filter(Boolean).join(" · ") };
  };
  const row = (t: string) => rows.find((r) => r.tipo === t);

  const salvar = async (tipo: "checkin" | "checkout", enviar: boolean) => {
    const conteudo = tipo === "checkin" ? ci : co;
    if (enviar) {
      if (tipo === "checkin" && !ci.prioridades.some((p) => p.titulo.trim())) return toast.error("Informe ao menos uma prioridade.");
      if (tipo === "checkout" && co.entregas.some((e) => !e.status)) return toast.error("Marque o resultado de cada prioridade.");
      if (tipo === "checkout" && co.entregas.some((e) => e.status !== "entregue" && !e.motivo.trim())) return toast.error("Explique o motivo das prioridades não entregues ou parciais.");
    }
    const nome = b.perfis.find((p) => p.user_id === b.user?.id)?.display_name ?? b.user?.email ?? null;
    const atual = row(tipo);
    const payload: any = { cadeira_id: cad, semana: sem, tipo, conteudo, status: enviar ? "enviado" : (atual?.status ?? "rascunho") };
    if (enviar) Object.assign(payload, { enviado_por: b.user?.id, enviado_por_nome: nome, enviado_em: new Date().toISOString() });
    const { error } = await db.from("mt_checkins").upsert(payload, { onConflict: "cadeira_id,semana,tipo" });
    if (error) return toast.error(error.message);
    if (enviar && tipo === "checkout") {
      for (const e of co.entregas) {
        if (e.iniciativa_id && e.novo_status_ini) await db.from("mt_iniciativas").update({ status: e.novo_status_ini }).eq("id", e.iniciativa_id);
      }
      b.reload();
    }
    toast.success(enviar ? "Enviado à Governança." : "Rascunho salvo."); load();
  };

  const Situacao = ({ tipo }: { tipo: string }) => {
    const r = row(tipo); const prazo = prazoDe(sem, tipo);
    if (r?.status === "enviado") {
      const atrasou = new Date(r.enviado_em) > prazo;
      return <Badge className={atrasou ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}>Enviado {new Date(r.enviado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}{atrasou ? " · fora do prazo" : ""}</Badge>;
    }
    return <Badge variant={new Date() > prazo ? "destructive" : "outline"}>{r ? "Rascunho" : "Pendente"} · prazo {prazo.toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</Badge>;
  };

  const Escala = ({ v, on, lbl }: { v: number; on: (n: number) => void; lbl: string }) => (
    <div className="space-y-1"><Label>{lbl}</Label>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <Button key={n} type="button" size="sm" variant={v === n ? "default" : "outline"} disabled={!podeEditar} onClick={() => on(n)}>{n}</Button>)}</div>
    </div>
  );

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const cadNome = b.cadeiras.find((c) => c.id === cad)?.nome ?? "";

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Formulário semanal do diretor</p>
          <h1 className="text-2xl font-bold">Check-in e Checkout – semana de {fmtSem(sem)}</h1>
          <p className="text-sm text-muted-foreground">{cadNome}{!podeEditar && " · somente leitura"}</p>
        </div>
        <div className="flex gap-2">
          <div className="w-56 space-y-1"><Label>Cadeira</Label>
            <Select value={cad} onValueChange={setCad}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{b.cadeiras.filter((c) => c.ativo).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="w-40 space-y-1"><Label>Semana</Label>
            <Select value={sem} onValueChange={setSem}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{semanas.map((s) => <SelectItem key={s} value={s}>{fmtSem(s)}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="checkin">
        <TabsList><TabsTrigger value="checkin">Check-in (segunda)</TabsTrigger><TabsTrigger value="checkout">Checkout (sexta)</TabsTrigger></TabsList>

        <TabsContent value="checkin">
          <div className="mb-4"><PendenciasComites cadeira={cad} usuario={b.user?.id} podeEditar={podeEditar} admin={access.roles.some(r => r === "admin" || r === "super_admin")}
            vinculadas={ci.prioridades.flatMap(p => p.gov_acao_id ? [p.gov_acao_id] : [])}
            onPuxar={acao => {
              if (!podeEditar) return;
              const r = puxarAcao(ci.prioridades, acao);
              if (r.erro === "duplicada") return toast.info("Esta pendência já está nas prioridades.");
              if (r.erro === "cheio") return toast.error("Limite de 5 prioridades atingido.");
              setCi({ ...ci, prioridades: r.prioridades });
            }} /></div>
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">Prioridades da semana</h2><Situacao tipo="checkin" /></div>
            {ci.prioridades.map((p, i) => {
              const set = (x: Partial<Prioridade>) => setCi({ ...ci, prioridades: ci.prioridades.map((q, j) => (j === i ? { ...q, ...x } : q)) });
              return (
                <div key={i} className="grid gap-2 rounded border p-3 md:grid-cols-[1fr_1fr_auto]">
                  {p.gov_acao_id && <div className="md:col-span-3"><Badge variant="secondary">Comitê {p.gov_comite_codigo || "—"}</Badge></div>}
                  <Input placeholder={`Prioridade ${i + 1}`} value={p.titulo} disabled={!podeEditar} onChange={(e) => set({ titulo: e.target.value })} />
                  <Select value={p.iniciativa_id || "none"} onValueChange={(v) => set({ iniciativa_id: v === "none" ? "" : v })} disabled={!podeEditar}>
                    <SelectTrigger><SelectValue placeholder="Iniciativa vinculada" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Sem iniciativa vinculada</SelectItem>
                      {inis.map((x) => <SelectItem key={x.id} value={x.id}>{x.titulo} · {STATUS_INI[statusEfetivo(x)]}</SelectItem>)}</SelectContent>
                  </Select>
                  {podeEditar && <Button variant="ghost" size="icon" aria-label="Remover prioridade" onClick={() => setCi({ ...ci, prioridades: ci.prioridades.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>}
                  <Input className="md:col-span-2" placeholder="Resultado esperado até sexta" value={p.resultado} disabled={!podeEditar} onChange={(e) => set({ resultado: e.target.value })} />
                </div>
              );
            })}
            {podeEditar && ci.prioridades.length < 5 && <Button variant="outline" size="sm" onClick={() => setCi({ ...ci, prioridades: [...ci.prioridades, { titulo: "", iniciativa_id: "", resultado: "" }] })}><Plus className="h-4 w-4 mr-1" /> Prioridade (até 5)</Button>}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1"><Label>Riscos e bloqueios</Label><Textarea rows={3} value={ci.riscos} disabled={!podeEditar} onChange={(e) => setCi({ ...ci, riscos: e.target.value })} /></div>
              <div className="space-y-1"><Label>Apoio necessário (de quem e para quê)</Label><Textarea rows={3} value={ci.apoio} disabled={!podeEditar} onChange={(e) => setCi({ ...ci, apoio: e.target.value })} /></div>
            </div>
            <Escala lbl="Confiança em cumprir a semana (1 = baixa, 5 = alta)" v={ci.confianca} on={(n) => setCi({ ...ci, confianca: n })} />
            {podeEditar && <div className="flex gap-2"><Button variant="outline" onClick={() => salvar("checkin", false)}>Salvar rascunho</Button><Button onClick={() => salvar("checkin", true)}>Enviar check-in</Button></div>}
          </Card>
        </TabsContent>

        <TabsContent value="checkout">
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">Resultado das prioridades</h2><Situacao tipo="checkout" /></div>
            {co.entregas.length === 0 && <p className="text-sm text-muted-foreground">Preencha e salve o check-in para trazer as prioridades da semana.</p>}
            {podeEditar && co.entregas.length === 0 && ci.prioridades.some((p) => p.titulo) && (
              <Button variant="outline" size="sm" onClick={() => setCo({ ...co, entregas: entregasDoCheckin(ci.prioridades) })}>Trazer prioridades do check-in</Button>
            )}
            {co.entregas.map((e, i) => {
              const set = (x: Partial<Entrega>) => setCo({ ...co, entregas: co.entregas.map((q, j) => (j === i ? { ...q, ...x } : q)) });
              return (
                <div key={i} className="grid gap-2 rounded border p-3 md:grid-cols-[1fr_180px]">
                  <div className="self-center space-y-1"><p className="font-medium">{e.titulo}</p>{e.gov_acao_id && <Badge variant="secondary">Comitê {e.gov_comite_codigo || "—"}</Badge>}</div>
                  <Select value={e.status} onValueChange={(v) => set({ status: v as Entrega["status"] })} disabled={!podeEditar}>
                    <SelectTrigger><SelectValue placeholder="Resultado" /></SelectTrigger>
                    <SelectContent>{Object.entries(ENTREGA_LBL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  {(() => { const v = vinc(e.iniciativa_id); if (!v) return null; return (
                    <div className="md:col-span-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Iniciativa: <b className="text-foreground">{v.x.titulo}</b>{v.txt && ` (${v.txt})`} · atual {STATUS_INI[statusEfetivo(v.x)]}</span>
                      <Select value={e.novo_status_ini || "manter"} onValueChange={(nv) => set({ novo_status_ini: nv === "manter" ? "" : nv })} disabled={!podeEditar}>
                        <SelectTrigger className="w-56 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="manter">Manter status</SelectItem>{["a_iniciar","em_andamento","concluida","cancelada"].map((k) => <SelectItem key={k} value={k}>Atualizar para: {STATUS_INI[k]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>); })()}
                  {e.status && e.status !== "entregue" && <Input className="md:col-span-2" placeholder="Por que não foi entregue e qual o novo prazo?" value={e.motivo} disabled={!podeEditar} onChange={(ev) => set({ motivo: ev.target.value })} />}
                </div>
              );
            })}
            <div className="space-y-2">
              <h3 className="font-semibold">Situação atual de KPIs da cadeira</h3>
              {kpis.map((k, i) => {
                const setK = (x: Partial<KpiSituacao>) => setCo({ ...co, kpis: kpis.map((q, j) => (j === i ? { ...q, ...x } : q)) });
                return (
                  <div key={i} className="grid gap-2 rounded border p-3 md:grid-cols-[2fr_120px_160px_auto]">
                    <Select value={k.indicador_id} onValueChange={(v) => setK({ indicador_id: v })} disabled={!podeEditar}>
                      <SelectTrigger><SelectValue placeholder="Indicador" /></SelectTrigger>
                      <SelectContent>{inds.map((x) => <SelectItem key={x.id} value={x.id}>{x.codigo} · {x.nome}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Valor atual" value={k.valor} disabled={!podeEditar} onChange={(e) => setK({ valor: e.target.value })} />
                    <Select value={k.situacao} onValueChange={(v) => setK({ situacao: v as KpiSituacao["situacao"] })} disabled={!podeEditar}>
                      <SelectTrigger><SelectValue placeholder="Situação" /></SelectTrigger>
                      <SelectContent>{Object.entries(SITUACAO_LBL).map(([a, l]) => <SelectItem key={a} value={a}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                    {podeEditar && <Button variant="ghost" size="icon" aria-label="Remover KPI" onClick={() => setCo({ ...co, kpis: kpis.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>}
                    <Input className="md:col-span-3" placeholder="Comentário (opcional)" value={k.comentario} disabled={!podeEditar} onChange={(e) => setK({ comentario: e.target.value })} />
                  </div>
                );
              })}
              {podeEditar && <Button variant="outline" size="sm" onClick={() => setCo({ ...co, kpis: [...kpis, { indicador_id: "", valor: "", situacao: "", comentario: "" }] })}><Plus className="h-4 w-4 mr-1" /> Apontar KPI</Button>}
              <p className="text-xs text-muted-foreground">Apontamento semanal de acompanhamento — não substitui o lançamento mensal oficial.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1"><Label>Entregas fora do planejado</Label><Textarea rows={3} value={co.extras} disabled={!podeEditar} onChange={(e) => setCo({ ...co, extras: e.target.value })} /></div>
              <div className="space-y-1"><Label>Aprendizados</Label><Textarea rows={3} value={co.aprendizados} disabled={!podeEditar} onChange={(e) => setCo({ ...co, aprendizados: e.target.value })} /></div>
              <div className="space-y-1"><Label>Foco da próxima semana</Label><Textarea rows={3} value={co.proxima} disabled={!podeEditar} onChange={(e) => setCo({ ...co, proxima: e.target.value })} /></div>
            </div>
            <Escala lbl="Avaliação da semana (1 = ruim, 5 = excelente)" v={co.ritmo} on={(n) => setCo({ ...co, ritmo: n })} />
            {podeEditar && <div className="flex gap-2"><Button variant="outline" onClick={() => salvar("checkout", false)}>Salvar rascunho</Button><Button onClick={() => salvar("checkout", true)}>Enviar checkout</Button></div>}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
