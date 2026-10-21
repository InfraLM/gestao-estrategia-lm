import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase, statusEfetivo, STATUS_INI, fmtNum, MESES_2S26 } from "@/hooks/useMetasBase";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import PendenciasComites from "@/components/PendenciasComites";
import { puxarAcao } from "@/lib/governancaPendencias";
import {
  CheckinV2, CheckoutV2, Entrega as EntregaV2, KpiResposta, KpiRetrato, Pendencia, Prioridade as PrioridadeV2, Responsavel,
  LIMITE_TEXTO, addDias, alternar, confirmarNoAlvo, entregasDePrioridades, idadeSemanas, mesclarHerdadas, montarRetrato, NO_ALVO,
  normalizarCheckin, normalizarCheckout, novoId, pendenciasCheckin, pendenciasCheckout, periodoSemana, prioridadesHerdadas,
  respostaVazia, riscoAberto, semEmail, cicloPadrao, ciclosDisponiveis, semanaCheckout, competenciaDaSemana, ultimaSituacao,
} from "@/lib/rotinaSemanal";
import { avaliarBsc, AVALIACAO_LBL } from "@/lib/avaliacaoBsc";
import rev02 from "@/data/bscRev02.json";

const db = supabase as any;
export type Prioridade = PrioridadeV2;
export type CheckinConteudo = CheckinV2;
export type Entrega = EntregaV2;
export type KpiSituacao = { indicador_id: string; valor: string; situacao: "no_trilho" | "atencao" | "fora" | ""; comentario: string };
export const SITUACAO_LBL: Record<string, string> = { no_trilho: "No trilho", atencao: "Atenção", fora: "Fora do trilho" };
export type CheckoutConteudo = CheckoutV2;
export const ENTREGA_LBL: Record<string, string> = { entregue: "Entregue", parcial: "Parcial", nao_entregue: "Não entregue" };
const TIPO_RISCO: Record<string, string> = { risco: "Risco", impedimento: "Impedimento", decisao: "Decisão pendente" };
const ORIGEM_LBL: Record<string, string> = { bsc: "BSC", okr: "KR", cesta: "Cesta" };

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
const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
const novaPri = (): PrioridadeV2 => ({ id: novoId(), titulo: "", iniciativa_id: "", resultado: "", prazo: "", responsavel: { tipo: "eu" } });
const irPara = (id: string) => { const el = document.getElementById(id); el?.scrollIntoView({ behavior: "smooth", block: "center" }); (el as HTMLElement | null)?.focus?.(); };
type Tipo = "checkin" | "checkout";
type Salvo = { estado: "ocioso" | "salvando" | "salvo" | "erro"; em?: Date; erro?: string };

export default function MetasSemanal() {
  const b = useMetasBase();
  const access = useModuleAccess();
  const [cad, setCad] = useState<string>("");
  const [sem, setSem] = useState(cicloPadrao());
  const semOut = semanaCheckout(sem);
  const semDe = (t: Tipo) => (t === "checkin" ? sem : semOut);
  const [cinOut, setCinOut] = useState<CheckinV2>(normalizarCheckin(null));
  const [arvore, setArvore] = useState<{ mapa: Record<string, string>; data: string | null }>({ mapa: {}, data: null });
  const [rows, setRows] = useState<any[]>([]);
  const [hist, setHist] = useState<any[]>([]);
  const [ci, setCiRaw] = useState<CheckinV2>(normalizarCheckin(null));
  const [co, setCoRaw] = useState<CheckoutV2>(normalizarCheckout(null));
  const [riscos, setRiscos] = useState<any[]>([]);
  const [contatos, setContatos] = useState<any[]>([]);
  const [salvo, setSalvo] = useState<Salvo>({ estado: "ocioso" });
  const [enviando, setEnviando] = useState(false);
  const [aba, setAba] = useState<Tipo>("checkout");
  const ciRef = useRef(ci); const coRef = useRef(co);
  const sujo = useRef<Record<Tipo, boolean>>({ checkin: false, checkout: false });
  const gravando = useRef(false); const repetir = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const chaveLocal = (t: Tipo) => `rotina:${cad}:${semDe(t)}:${t}`;

  useEffect(() => { if (!cad && !b.loading) setCad(b.minhaCadeira ?? b.cadeiras.find((c) => c.ativo)?.id ?? ""); }, [b.loading]);
  const podeEditar = access.canWrite("rotina") && (b.isGovernanca || (!!cad && b.minhaCadeira === cad));
  const comp = competenciaDaSemana(semOut);
  const competencia = MESES_2S26.includes(comp) ? comp : null;

  const flushRef = useRef<() => void>(() => {});
  const rowsRef = useRef<any[]>([]); rowsRef.current = rows;
  const agendar = () => { clearTimeout(timer.current); timer.current = setTimeout(() => flushRef.current(), 1000); };
  const setCi = (x: CheckinV2) => { setCiRaw(x); ciRef.current = x; sujo.current.checkin = true; localStorage.setItem(chaveLocal("checkin"), JSON.stringify(x)); agendar(); };
  const setCo = (x: CheckoutV2) => { setCoRaw(x); coRef.current = x; sujo.current.checkout = true; localStorage.setItem(chaveLocal("checkout"), JSON.stringify(x)); agendar(); };

  const load = async () => {
    if (!cad) return;
    clearTimeout(timer.current); sujo.current = { checkin: false, checkout: false };
    const [{ data }, { data: rs }, { data: cts }, { data: reg }, { data: arv }] = await Promise.all([
      db.from("mt_checkins").select("*").eq("cadeira_id", cad).gte("semana", addDias(sem, -56)).lte("semana", sem),
      db.from("mt_rotina_riscos").select("*").eq("cadeira_id", cad).order("created_at"),
      db.from("mt_rotina_contatos").select("*").eq("cadeira_id", cad),
      db.from("mt_parametros").select("valor").eq("chave", "regua").maybeSingle(),
      db.from("conteudo_editavel").select("valor,updated_at").eq("chave", "bsc.rev02").maybeSingle(),
    ]);
    const mapa: Record<string, string> = {};
    for (const o of ((arv?.valor ?? rev02) as any[])) for (const k of o.kpis ?? []) if (k.situacaoAtual) mapa[String(k.kpi).trim()] = k.situacaoAtual;
    setArvore({ mapa, data: arv?.updated_at ?? null });
    const atual = (data ?? []).filter((r: any) => (r.semana === sem && r.tipo === "checkin") || (r.semana === semOut && r.tipo === "checkout"));
    setRows(atual); setHist(data ?? []); setRiscos(rs ?? []); setContatos(cts ?? []);
    const comEmail = (x: any) => x == null ? x : JSON.parse(JSON.stringify(x), (_k, v) => (v && v.tipo === "externo" && v.contato_id ? { ...v, email: (cts ?? []).find((c: any) => c.id === v.contato_id)?.email ?? "" } : v));
    const local = (t: Tipo) => { try { const s = localStorage.getItem(`rotina:${cad}:${t === "checkin" ? sem : semOut}:${t}`); return s ? JSON.parse(s) : null; } catch { return null; } };
    const rIn = atual.find((r: any) => r.tipo === "checkin"); const rOut = atual.find((r: any) => r.tipo === "checkout");
    const lin = local("checkin"), lout = local("checkout");
    const cin = normalizarCheckin(comEmail(lin ?? rIn?.conteudo));
    let cout = normalizarCheckout(comEmail(lout ?? rOut?.conteudo));
    const rInOut = (data ?? []).find((r: any) => r.semana === semOut && r.tipo === "checkin");
    const cOut = normalizarCheckin(rInOut?.conteudo); setCinOut(cOut);
    if (!cout.entregas.length) cout.entregas = entregasDePrioridades(cOut.prioridades);
    cout.entregas = mesclarHerdadas(cout.entregas, prioridadesHerdadas(data ?? [], semOut));
    if (!cout.envio_token) cout.envio_token = novoId();
    // Números ao vivo até o primeiro envio; depois ficam os gravados no envio.
    if (!cout.primeiro_envio_em) {
      const { data: base } = await db.rpc("rotina_retrato", { _cadeira: cad, _comp: competencia ?? comp });
      cout.kpis_retrato = montarRetrato(base ?? [], competencia, reg?.valor?.faixas);
    }
    setCiRaw(cin); ciRef.current = cin; setCoRaw(cout); coRef.current = cout;
    if (lin) sujo.current.checkin = true;
    if (lout) sujo.current.checkout = true;
    if (sujo.current.checkin || sujo.current.checkout) agendar();
    setSalvo({ estado: "ocioso" });
  };
  useEffect(() => { load(); }, [cad, sem, podeEditar]);

  /** Grava contatos externos (e-mail fica só na tabela protegida) e devolve conteúdo sem e-mail. */
  const prepararContatos = async (conteudo: any) => {
    const lista = [...contatos]; const visita = async (v: any): Promise<any> => {
      if (Array.isArray(v)) { const o = []; for (const x of v) o.push(await visita(x)); return o; }
      if (v && typeof v === "object") {
        const o: any = {}; for (const k of Object.keys(v)) o[k] = await visita(v[k]);
        if (o.tipo === "externo" && o.nome?.trim() && o.email?.trim()) {
          const email = o.email.trim().toLowerCase();
          let c = lista.find((x) => x.email.toLowerCase() === email && x.nome === o.nome.trim());
          if (!c) { const { data, error } = await db.from("mt_rotina_contatos").insert({ cadeira_id: cad, nome: o.nome.trim(), email, criado_por: b.user?.id }).select().single(); if (error) throw error; c = data; lista.push(c); }
          o.contato_id = c.id;
        }
        return o;
      }
      return v;
    };
    const r = await visita(conteudo); setContatos(lista); return semEmail(r);
  };

  const gravar = async (tipo: Tipo, extra: any = {}, conteudoOverride?: any) => {
    const conteudo = await prepararContatos(conteudoOverride ?? (tipo === "checkin" ? ciRef.current : coRef.current));
    const atual = rowsRef.current.find((r) => r.tipo === tipo);
    const payload: any = { cadeira_id: cad, semana: semDe(tipo), tipo, conteudo, status: atual?.status ?? "rascunho", ...extra };
    const { data, error } = await db.from("mt_checkins").upsert(payload, { onConflict: "cadeira_id,semana,tipo" }).select().single();
    if (error) throw error;
    rowsRef.current = [...rowsRef.current.filter((r) => r.tipo !== tipo), data]; setRows(rowsRef.current);
    localStorage.removeItem(chaveLocal(tipo));
  };

  const flush = async () => {
    if (!podeEditar || !cad) return;
    if (gravando.current) { repetir.current = true; return; }
    const tipos = (["checkin", "checkout"] as Tipo[]).filter((t) => sujo.current[t]);
    if (!tipos.length) return;
    gravando.current = true; setSalvo({ estado: "salvando" });
    try {
      for (const t of tipos) { sujo.current[t] = false; await gravar(t); }
      setSalvo({ estado: "salvo", em: new Date() });
    } catch (e: any) {
      tipos.forEach((t) => (sujo.current[t] = true));
      setSalvo({ estado: "erro", erro: e?.message ?? "Falha de rede" });
    } finally {
      gravando.current = false;
      if (repetir.current) { repetir.current = false; agendar(); }
    }
  };

  flushRef.current = flush;
  const reaproveitaveis = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const i of b.iniciativas as any[]) {
      if (i.cadeira_id !== cad || !i.indicador_id || !i.checkin_token || i.checkin_token === co.envio_token || ["concluida", "cancelada"].includes(i.status)) continue;
      (m[i.indicador_id] ??= []).push(i);
    }
    return m;
  }, [b.iniciativas, cad, co.envio_token]);
  const pendIn = pendenciasCheckin(ci);
  const pendOut = pendenciasCheckout(co, reaproveitaveis);

  const nomeResp = (r: Responsavel) => r.tipo === "cadeira" ? b.cadeiras.find((c) => c.id === r.cadeira_id)?.nome ?? null
    : r.tipo === "externo" ? r.nome ?? null : b.perfis.find((p) => p.user_id === b.user?.id)?.display_name ?? b.user?.email ?? null;

  const enviar = async (tipo: Tipo) => {
    if (enviando || gravando.current) return;
    if ((tipo === "checkin" ? pendIn : pendOut).length) return toast.error("Resolva as pendências antes de enviar.");
    setEnviando(true); clearTimeout(timer.current);
    try {
      const nome = b.perfis.find((p) => p.user_id === b.user?.id)?.display_name ?? b.user?.email ?? null;
      const agora = new Date().toISOString();
      let conteudo: any = tipo === "checkin" ? { ...ciRef.current } : { ...coRef.current };
      if (tipo === "checkout" && !conteudo.primeiro_envio_em) conteudo.kpis_retrato = (conteudo.kpis_retrato ?? []).map((k: KpiRetrato) => ({ ...k, congelado_em: agora }));
      conteudo.primeiro_envio_em ??= agora;
      if (tipo === "checkout") {
        const resp: KpiResposta[] = [];
        for (const k of conteudo.kpis_resposta as KpiResposta[]) {
          if (k.ok === false && k.plano.trim() && k.vira_iniciativa && !k.iniciativa_criada_id) {
            const ret = conteudo.kpis_retrato?.find((r: KpiRetrato) => r.indicador_id === k.indicador_id);
            const alvo = k.reaproveitar === "sim" ? (k.iniciativa_alvo_id || reaproveitaveis[k.indicador_id]?.[0]?.id) : null;
            const { data, error } = await db.rpc("rotina_criar_iniciativa", {
              _cadeira: cad, _semana: semOut, _token: conteudo.envio_token, _indicador: k.indicador_id,
              _titulo: `${ret?.codigo ?? "KPI"} · ${k.plano.trim().slice(0, 80)}`,
              _comentario: [k.impacto.trim() && `Impacto: ${k.impacto.trim()}`, `Plano: ${k.plano.trim()}`].filter(Boolean).join("\n\n"),
              _prazo: k.prazo || null, _resp_nome: nomeResp(k.responsavel), _status: k.status_ini || "em_andamento", _reaproveitar: alvo,
            });
            if (error) throw error;
            resp.push({ ...k, iniciativa_criada_id: data });
          } else resp.push(k);
        }
        conteudo.kpis_resposta = resp;
        for (const e of conteudo.entregas as EntregaV2[]) {
          if (e.iniciativa_id && e.novo_status_ini) await db.from("mt_iniciativas").update({ status: e.novo_status_ini }).eq("id", e.iniciativa_id);
        }
        setCoRaw(conteudo); coRef.current = conteudo;
      } else { setCiRaw(conteudo); ciRef.current = conteudo; }
      sujo.current[tipo] = false;
      await gravar(tipo, { status: "enviado", enviado_por: b.user?.id, enviado_por_nome: nome, enviado_em: agora }, conteudo);
      if (tipo === "checkout") b.reload();
      setSalvo({ estado: "salvo", em: new Date() });
      toast.success("Enviado à Governança.");
    } catch (e: any) { toast.error(e?.message ?? "Falha ao enviar"); }
    finally { setEnviando(false); }
  };

  // ---------- Riscos ----------
  const [novoRisco, setNovoRisco] = useState({ tipo: "risco", descricao: "" });
  const registrarRisco = async () => {
    if (!novoRisco.descricao.trim()) return;
    const { data, error } = await db.from("mt_rotina_riscos").insert({ cadeira_id: cad, tipo: novoRisco.tipo, descricao: novoRisco.descricao.trim(), semana_criada: sem, criado_por: b.user?.id }).select().single();
    if (error) return toast.error(error.message);
    setRiscos([...riscos, data]); setNovoRisco({ tipo: novoRisco.tipo, descricao: "" });
  };
  const mudarRisco = async (r: any, resolver: boolean) => {
    const upd = resolver ? { resolvido_em: new Date().toISOString(), resolvido_por: b.user?.id } : { reaberto_em: new Date().toISOString() };
    const { data, error } = await db.from("mt_rotina_riscos").update(upd).eq("id", r.id).select().single();
    if (error) return toast.error(error.message);
    setRiscos(riscos.map((x) => (x.id === r.id ? data : x)));
  };
  const riscosVisiveis = riscos.filter((r) => r.semana_criada <= sem);
  const abertos = riscosVisiveis.filter(riscoAberto); const resolvidos = riscosVisiveis.filter((r) => !riscoAberto(r));

  // ---------- Componentes ----------
  const RespSelect = ({ id, v, on }: { id: string; v: Responsavel; on: (r: Responsavel) => void }) => {
    const val = v.tipo === "cadeira" ? `cad:${v.cadeira_id}` : v.tipo || "eu";
    return (
      <div className="space-y-2">
        <Select value={val} disabled={!podeEditar} onValueChange={(x) => on(x === "eu" ? { tipo: "eu" } : x === "externo" ? { tipo: "externo", nome: "", email: "" } : { tipo: "cadeira", cadeira_id: x.slice(4) })}>
          <SelectTrigger id={id} aria-label="Responsável"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="eu">Eu</SelectItem>
            {b.cadeiras.filter((c) => c.ativo).map((c) => <SelectItem key={c.id} value={`cad:${c.id}`}>{c.nome}</SelectItem>)}
            <SelectItem value="externo">Alguém de fora da diretoria</SelectItem>
          </SelectContent>
        </Select>
        {v.tipo === "externo" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Nome" value={v.nome ?? ""} disabled={!podeEditar} onChange={(e) => on({ ...v, nome: e.target.value })} />
            {(podeEditar || v.email) && <Input type="email" placeholder="E-mail" value={v.email ?? ""} disabled={!podeEditar} onChange={(e) => on({ ...v, email: e.target.value })} />}
          </div>
        )}
      </div>
    );
  };

  const Situacao = ({ tipo }: { tipo: Tipo }) => {
    const r = rows.find((x) => x.tipo === tipo); const prazo = prazoDe(semDe(tipo), tipo);
    if (r?.status === "enviado") {
      const primeiro = r.conteudo?.primeiro_envio_em ?? r.enviado_em;
      const atrasou = new Date(primeiro) > prazo;
      return <Badge className={atrasou ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}>Enviado {new Date(r.enviado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}{atrasou ? " · fora do prazo" : ""}</Badge>;
    }
    return <Badge variant={new Date() > prazo ? "destructive" : "outline"}>{r ? "Rascunho" : "Pendente"} · prazo {prazo.toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</Badge>;
  };

  const Escala = ({ v, on, lbl }: { v: number; on: (n: number) => void; lbl: string }) => (
    <div className="space-y-1"><Label>{lbl}</Label>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <Button key={n} type="button" size="sm" variant={v === n ? "default" : "outline"} disabled={!podeEditar} onClick={() => on(n)}>{n}</Button>)}</div>
    </div>
  );

  const Revisao = ({ tipo, blocos, pend }: { tipo: Tipo; blocos: { id: string; txt: string }[]; pend: Pendencia[] }) => {
    const enviado = rows.find((r) => r.tipo === tipo)?.status === "enviado";
    return (
      <Card className="p-4 space-y-3 border-primary/40">
        <h3 className="font-semibold">Revisão antes de enviar</h3>
        <ul className="space-y-1 text-sm">{blocos.map((x) => <li key={x.id} className="flex justify-between gap-2"><span>{x.txt}</span><button type="button" className="text-primary underline" onClick={() => irPara(x.id)}>Ver</button></li>)}</ul>
        {pend.length > 0 && (
          <div className="space-y-1"><p className="text-sm font-medium text-destructive">Pendências</p>
            <ul className="space-y-1 text-sm">{pend.map((p, i) => <li key={i}><button type="button" className="text-destructive underline text-left" onClick={() => irPara(p.campo)}>{p.texto}</button></li>)}</ul>
          </div>
        )}
        {podeEditar && <div className="space-y-1">
          <Button disabled={pend.length > 0 || enviando} onClick={() => enviar(tipo)}>{enviando ? "Enviando…" : enviado ? `Reenviar ${tipo === "checkin" ? "check-in" : "checkout"}` : `Enviar ${tipo === "checkin" ? "check-in" : "checkout"}`}</Button>
          {pend.length > 0 && <p className="text-xs text-muted-foreground">Resolva as pendências acima para liberar o envio.</p>}
        </div>}
      </Card>
    );
  };

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const cadNome = b.cadeiras.find((c) => c.id === cad)?.nome ?? "";
  const retrato = co.kpis_retrato ?? [];
  const resp = (id: string) => co.kpis_resposta.find((k) => k.indicador_id === id) ?? respostaVazia(id, sem);
  const setResp = (id: string, x: Partial<KpiResposta>) => {
    const atual = resp(id); const lista = co.kpis_resposta.filter((k) => k.indicador_id !== id);
    setCo({ ...co, kpis_resposta: [...lista, { ...atual, ...x }] });
  };
  const noAlvo = retrato.filter((k) => k.faixa && NO_ALVO.includes(k.faixa));
  const inis = b.iniciativas.filter((i) => i.cadeira_id === cad && !["concluida", "cancelada"].includes(i.status));
  const vinc = (id?: string) => {
    const x = b.iniciativas.find((i) => i.id === id); if (!x) return null;
    const okr = b.okrs.find((o) => o.id === x.okr_id); const obj = b.objetivos.find((o) => o.id === x.objetivo_id);
    const ind = b.indicadores.find((o) => o.id === x.indicador_id);
    return { x, txt: [okr?.codigo, ind?.codigo, obj?.codigo].filter(Boolean).join(" · ") };
  };
  const entregasAtuais = co.entregas.filter((e) => !e.herdada_de);
  const respostas = co.kpis_resposta.filter((k) => k.ok != null && retrato.some((r) => r.indicador_id === k.indicador_id));

  return (
    <div className="space-y-4 pb-10">
      <Card className="p-4 sm:p-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Formulário semanal do diretor</p>
          <h1 className="text-2xl font-bold">{periodoSemana(sem)}</h1>
          <p className="text-sm text-muted-foreground">{cadNome}{!podeEditar && " · somente leitura"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-56 space-y-1"><Label>Cadeira</Label>
            <Select value={cad} onValueChange={(v) => { flush(); setCad(v); }}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{b.cadeiras.filter((c) => c.ativo).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="w-64 space-y-1"><Label>Ciclo</Label>
            <Select value={sem} onValueChange={(v) => { flush(); setSem(v); }}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ciclosDisponiveis().map((s) => <SelectItem key={s} value={s}>{fmtSem(s)} (checkout {fmtSem(semanaCheckout(s))})</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
      </Card>

      <Tabs value={aba} onValueChange={(v) => setAba(v as Tipo)}>
        <TabsList><TabsTrigger value="checkout">Checkout da semana anterior</TabsTrigger><TabsTrigger value="checkin">Check-in da semana</TabsTrigger></TabsList>

        <TabsContent value="checkin" className="space-y-4">
          <PendenciasComites cadeira={cad} usuario={b.user?.id} podeEditar={podeEditar} admin={access.roles.some((r) => r === "admin" || r === "super_admin")}
            vinculadas={ci.prioridades.flatMap((p) => (p.gov_acao_id ? [p.gov_acao_id] : []))}
            onPuxar={(acao) => {
              if (!podeEditar) return;
              const r = puxarAcao(ci.prioridades, acao);
              if (r.erro === "duplicada") return toast.info("Esta pendência já está nas prioridades.");
              if (r.erro === "cheio") return toast.error("Limite de 5 prioridades atingido.");
              setCi({ ...ci, prioridades: r.prioridades.map((p: any) => ({ ...novaPri(), ...p, id: p.id ?? novoId(), responsavel: p.responsavel ?? { tipo: "eu" }, prazo: p.prazo ?? "" })) });
            }} />
          <Card className="p-4 space-y-4" id="bloco-prioridades">
            <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">Prioridades da semana</h2><Situacao tipo="checkin" /></div>
            {ci.prioridades.map((p, i) => {
              const set = (x: Partial<PrioridadeV2>) => setCi({ ...ci, prioridades: ci.prioridades.map((q, j) => (j === i ? { ...q, ...x } : q)) });
              return (
                <div key={p.id} className="grid gap-2 rounded border p-3 md:grid-cols-[1fr_1fr_auto]">
                  {p.gov_acao_id && <div className="md:col-span-3"><Badge variant="secondary">Comitê {p.gov_comite_codigo || "—"}</Badge></div>}
                  <Input id={`pri-${i}-titulo`} placeholder={`Prioridade ${i + 1}`} value={p.titulo} disabled={!podeEditar} onChange={(e) => set({ titulo: e.target.value })} />
                  <Select value={p.iniciativa_id || "none"} onValueChange={(v) => set({ iniciativa_id: v === "none" ? "" : v })} disabled={!podeEditar}>
                    <SelectTrigger><SelectValue placeholder="Iniciativa vinculada" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Sem iniciativa vinculada</SelectItem>
                      {inis.map((x) => <SelectItem key={x.id} value={x.id}>{x.titulo} · {STATUS_INI[statusEfetivo(x)]}</SelectItem>)}</SelectContent>
                  </Select>
                  {podeEditar && <Button variant="ghost" size="icon" aria-label="Remover prioridade" onClick={() => setCi({ ...ci, prioridades: ci.prioridades.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>}
                  <Input className="md:col-span-2" placeholder="Resultado esperado até sexta" value={p.resultado} disabled={!podeEditar} onChange={(e) => set({ resultado: e.target.value })} />
                  <div className="md:col-span-2 grid gap-2 sm:grid-cols-[160px_1fr]">
                    <div className="space-y-1"><Label htmlFor={`pri-${i}-prazo`}>Prazo</Label><Input id={`pri-${i}-prazo`} type="date" value={p.prazo} disabled={!podeEditar} onChange={(e) => set({ prazo: e.target.value })} /></div>
                    <div className="space-y-1"><Label>Responsável</Label>{RespSelect({ id: `pri-${i}-resp`, v: p.responsavel, on: (r) => set({ responsavel: r }) })}</div>
                  </div>
                </div>
              );
            })}
            {podeEditar && ci.prioridades.length < 5 && <Button variant="outline" size="sm" onClick={() => setCi({ ...ci, prioridades: [...ci.prioridades, novaPri()] })}><Plus className="h-4 w-4 mr-1" /> Prioridade (até 5)</Button>}
          </Card>

          <Card className="p-4 space-y-3" id="bloco-riscos">
            <h2 className="font-semibold">Riscos, impedimentos e decisões pendentes</h2>
            <p className="text-xs text-muted-foreground">Ficam com a cadeira e reaparecem toda semana até serem resolvidos.</p>
            {abertos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item aberto.</p>}
            {abertos.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm">
                <span><Badge variant="outline" className="mr-2">{TIPO_RISCO[r.tipo]}</Badge>{r.descricao} <span className="text-muted-foreground">· {idadeSemanas(r.semana_criada, sem)}{r.reaberto_em ? " · reaberto" : ""}</span></span>
                {podeEditar && <Button size="sm" variant="outline" onClick={() => mudarRisco(r, true)}>Resolver</Button>}
              </div>
            ))}
            {resolvidos.length > 0 && <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Resolvidos ({resolvidos.length})</summary>
              {resolvidos.map((r) => (
                <div key={r.id} className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                  <span className="text-muted-foreground"><Badge variant="outline" className="mr-2">{TIPO_RISCO[r.tipo]}</Badge>{r.descricao} · resolvido em {new Date(r.resolvido_em).toLocaleDateString("pt-BR")}</span>
                  {podeEditar && <Button size="sm" variant="ghost" onClick={() => mudarRisco(r, false)}>Reabrir</Button>}
                </div>))}
            </details>}
            {podeEditar && <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
              <Select value={novoRisco.tipo} onValueChange={(v) => setNovoRisco({ ...novoRisco, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TIPO_RISCO).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
              <Input placeholder="Descrição (não poderá ser editada depois)" value={novoRisco.descricao} onChange={(e) => setNovoRisco({ ...novoRisco, descricao: e.target.value })} />
              <Button variant="outline" onClick={registrarRisco}>Registrar</Button>
            </div>}
            {ci.riscos.trim() && <div className="rounded bg-muted p-2 text-sm"><p className="text-xs text-muted-foreground">Registro antigo desta semana</p><p className="whitespace-pre-wrap">{ci.riscos}</p></div>}
          </Card>

          <Card className="p-4 space-y-3" id="bloco-apoio">
            <div className="space-y-1"><Label>Apoio necessário (de quem e para quê)</Label><Textarea rows={3} value={ci.apoio} disabled={!podeEditar} onChange={(e) => setCi({ ...ci, apoio: e.target.value })} /></div>
            <Escala lbl="Confiança em cumprir a semana (1 = baixa, 5 = alta)" v={ci.confianca} on={(n) => setCi({ ...ci, confianca: n })} />
          </Card>

          <Revisao tipo="checkin" pend={pendIn} blocos={[
            { id: "bloco-prioridades", txt: `Prioridades: ${ci.prioridades.filter((p) => p.titulo.trim()).length}` },
            { id: "bloco-riscos", txt: `Riscos/impedimentos abertos: ${abertos.length}` },
            { id: "bloco-apoio", txt: `Apoio: ${ci.apoio.trim() ? "preenchido" : "—"} · Confiança ${ci.confianca}/5` },
          ]} />
        </TabsContent>

        <TabsContent value="checkout" className="space-y-4">
          <Card className="p-4 space-y-4" id="bloco-entregas">
            <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">Resultado das prioridades</h2><Situacao tipo="checkout" /></div>
            {co.entregas.length === 0 && <p className="text-sm text-muted-foreground">Sem prioridades declaradas no check-in de {fmtSem(semOut)}.</p>}
            {podeEditar && entregasAtuais.length === 0 && cinOut.prioridades.some((p) => p.titulo) && (
              <Button variant="outline" size="sm" onClick={() => setCo({ ...co, entregas: mesclarHerdadas(entregasDePrioridades(cinOut.prioridades), co.entregas.filter((e) => e.herdada_de)) })}>Trazer prioridades do check-in de {fmtSem(semOut)}</Button>
            )}
            {co.entregas.map((e, i) => {
              const set = (x: Partial<EntregaV2>) => setCo({ ...co, entregas: co.entregas.map((q, j) => (j === i ? { ...q, ...x } : q)) });
              if (e.herdada_de) return (
                <div key={i} id={`ent-${i}`} className="rounded border border-dashed p-3 space-y-2 text-sm">
                  <p className="font-medium">{e.titulo} <span className="text-muted-foreground font-normal">· semana de {fmtSem(e.herdada_de)}</span></p>
                  <p className="text-muted-foreground">Você declarou isto como prioridade. Entregou nesta semana?</p>
                  {e.status === "entregue"
                    ? <div className="flex gap-2 items-center"><Badge>Entregue</Badge>{podeEditar && <Button size="sm" variant="ghost" onClick={() => set({ status: "" })}>Desfazer</Button>}</div>
                    : podeEditar && <Button size="sm" variant="outline" onClick={() => set({ status: "entregue" })}>Entreguei</Button>}
                </div>);
              return (
                <div key={i} className="grid gap-2 rounded border p-3 md:grid-cols-[1fr_180px]">
                  <div className="self-center space-y-1"><p className="font-medium">{e.titulo}</p>{e.gov_acao_id && <Badge variant="secondary">Comitê {e.gov_comite_codigo || "—"}</Badge>}</div>
                  <Select value={e.status} onValueChange={(v) => set({ status: v as EntregaV2["status"] })} disabled={!podeEditar}>
                    <SelectTrigger id={`ent-${i}`}><SelectValue placeholder="Resultado" /></SelectTrigger>
                    <SelectContent>{Object.entries(ENTREGA_LBL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  {(() => { const v = vinc(e.iniciativa_id); if (!v) return null; return (
                    <div className="md:col-span-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Iniciativa: <b className="text-foreground">{v.x.titulo}</b>{v.txt && ` (${v.txt})`} · atual {STATUS_INI[statusEfetivo(v.x)]}</span>
                      <Select value={e.novo_status_ini || "manter"} onValueChange={(nv) => set({ novo_status_ini: nv === "manter" ? "" : nv })} disabled={!podeEditar}>
                        <SelectTrigger className="w-56 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="manter">Manter status</SelectItem>{["a_iniciar", "em_andamento", "concluida", "cancelada"].map((k) => <SelectItem key={k} value={k}>Atualizar para: {STATUS_INI[k]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>); })()}
                  {e.status && e.status !== "entregue" && <Input id={`ent-${i}-motivo`} className="md:col-span-2" placeholder="Por que não foi entregue e qual o novo prazo?" value={e.motivo} disabled={!podeEditar} onChange={(ev) => set({ motivo: ev.target.value })} />}
                  <div className="md:col-span-2 space-y-1"><Label>Responsável</Label>{RespSelect({ id: `ent-${i}-resp`, v: e.responsavel ?? { tipo: "eu" }, on: (r) => set({ responsavel: r }) })}</div>
                </div>
              );
            })}
          </Card>

          <Card className="p-4 space-y-3" id="bloco-kpis">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Seus KPIs estão performando dentro do esperado?</h2>
              {podeEditar && noAlvo.length > 0 && <Button size="sm" variant="outline" onClick={() => setCo({ ...co, kpis_resposta: confirmarNoAlvo(retrato, co.kpis_resposta, sem) })}>Confirmar Sim nos {noAlvo.length} no alvo</Button>}
            </div>
            <p className="text-xs text-muted-foreground">Resposta opcional. {co.primeiro_envio_em ? `Números gravados no envio de ${new Date(co.primeiro_envio_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : "Números ao vivo até o envio"}{competencia ? ` · competência ${competencia.slice(5)}/${competencia.slice(0, 4)}` : " · semana sem competência mensal"}. Não altera a nota nem o lançamento mensal.</p>
            {retrato.some((k) => k.origem === "bsc") && <p className="text-sm rounded bg-muted p-2">KPIs de BSC não entram na nota; são avaliados como on track / off track ao fim do mês ou do período da meta.</p>}
            {retrato.length === 0 && <p className="text-sm text-muted-foreground">Nenhum KPI sob responsabilidade desta cadeira.</p>}
            <div className="grid gap-3 lg:grid-cols-2">
              {retrato.map((k) => {
                const r = resp(k.indicador_id); const cand = reaproveitaveis[k.indicador_id] ?? [];
                const ult = ultimaSituacao(k.indicador_id, arvore.mapa[k.nome.trim()] ? { valor: arvore.mapa[k.nome.trim()], data: arvore.data } : null, hist.filter((h) => h.tipo === "checkout"), semOut);
                const semMeta = k.meta_mes == null && (k.origem !== "bsc" || (k.meta_semestre == null && !k.meta_texto));
                const aval = k.origem === "bsc" ? avaliarBsc({ sentido: k.sentido ?? "maior", competencia: k.competencia, meta_mes: k.meta_mes, meta_semestre: k.meta_semestre ?? null, meta_texto: k.meta_texto ?? null, realizado: k.realizado, situacao: r.situacao_atual || ult?.valor }) : null;
                return (
                  <div key={k.indicador_id} className="rounded border p-3 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="font-medium text-sm">{k.codigo} · {k.nome}</p>
                        <p className="text-xs text-muted-foreground">Última situação atual apontada: {ult ? <><b className="text-foreground">{ult.valor}</b> · {ult.fonte}{ult.data && ult.fonte === "Árvore de KPIs" ? ` · ${new Date(ult.data).toLocaleDateString("pt-BR")}` : ult.fonte === "Árvore de KPIs" ? " · Rev.02" : ""}</> : "—"}</p></div>
                      <div className="flex gap-1"><Badge variant="outline">{ORIGEM_LBL[k.origem]}{k.origem === "cesta" ? ` · peso ${fmtNum(k.peso)}` : ""}</Badge>{k.faixa && <Badge variant="secondary">{k.faixa}</Badge>}{aval && <Badge variant={aval === "off" ? "destructive" : aval === "on" ? "default" : "outline"}>{AVALIACAO_LBL[aval]}</Badge>}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs"><div><p className="text-muted-foreground">Meta do mês</p><p>{k.meta_mes != null ? fmtNum(k.meta_mes) : k.origem === "bsc" && (k.meta_semestre != null || k.meta_texto) ? `Período: ${k.meta_texto || fmtNum(k.meta_semestre)}` : "Sem meta registrada"}</p></div><div><p className="text-muted-foreground">Realizado</p><p>{fmtNum(k.realizado)}</p></div><div><p className="text-muted-foreground">{k.origem === "bsc" ? "Avaliação" : "Atingimento"}</p><p>{k.origem === "bsc" ? (aval ? AVALIACAO_LBL[aval] : "—") : semMeta ? "Sem meta registrada" : pct(k.atingimento)}</p></div></div>
                    <Input placeholder="Situação atual (opcional)" maxLength={200} value={r.situacao_atual ?? ""} disabled={!podeEditar} onChange={(e) => setResp(k.indicador_id, { situacao_atual: e.target.value })} />
                    <div className="flex gap-2">
                      <Button size="sm" variant={r.ok === true ? "default" : "outline"} disabled={!podeEditar} onClick={() => setResp(k.indicador_id, { ok: alternar(r.ok, true) })}>Sim</Button>
                      <Button size="sm" variant={r.ok === false ? "destructive" : "outline"} disabled={!podeEditar} onClick={() => setResp(k.indicador_id, { ok: alternar(r.ok, false) })}>Não</Button>
                    </div>
                    {r.ok === false && <div className="space-y-2">
                      <div className="space-y-1"><Label>Impacto (opcional)</Label><Textarea rows={2} maxLength={LIMITE_TEXTO} value={r.impacto} disabled={!podeEditar} onChange={(e) => setResp(k.indicador_id, { impacto: e.target.value })} /></div>
                      <div className="space-y-1"><Label>Plano de ação (opcional)</Label><Textarea rows={3} maxLength={LIMITE_TEXTO} value={r.plano} disabled={!podeEditar} onChange={(e) => setResp(k.indicador_id, { plano: e.target.value })} /></div>
                      {r.plano.trim() && <div className="space-y-2 rounded bg-muted/50 p-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={r.vira_iniciativa} disabled={!podeEditar || !!r.iniciativa_criada_id} onCheckedChange={(v) => setResp(k.indicador_id, { vira_iniciativa: !!v })} />Este plano vira uma iniciativa</label>
                        {r.iniciativa_criada_id && <Badge variant="secondary">Iniciativa registrada</Badge>}
                        {r.vira_iniciativa && !r.iniciativa_criada_id && <>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1"><Label htmlFor={`kpi-${k.indicador_id}-prazo`}>Prazo</Label><Input id={`kpi-${k.indicador_id}-prazo`} type="date" value={r.prazo} disabled={!podeEditar} onChange={(e) => setResp(k.indicador_id, { prazo: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Status</Label>
                              <Select value={r.status_ini} disabled={!podeEditar} onValueChange={(v) => setResp(k.indicador_id, { status_ini: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{["a_iniciar", "em_andamento", "concluida", "cancelada"].map((s) => <SelectItem key={s} value={s}>{STATUS_INI[s]}</SelectItem>)}</SelectContent></Select></div>
                          </div>
                          <div className="space-y-1"><Label>Responsável</Label>{RespSelect({ id: `kpi-${k.indicador_id}-resp`, v: r.responsavel, on: (x) => setResp(k.indicador_id, { responsavel: x }) })}</div>
                          {cand.length > 0 && <div id={`kpi-${k.indicador_id}-reap`} tabIndex={-1} className="space-y-1 text-sm">
                            <p>Já existe iniciativa aberta deste indicador criada em check-in anterior: <b>{cand[0].titulo}</b></p>
                            <div className="flex gap-2">
                              <Button size="sm" variant={r.reaproveitar === "sim" ? "default" : "outline"} disabled={!podeEditar} onClick={() => setResp(k.indicador_id, { reaproveitar: "sim", iniciativa_alvo_id: cand[0].id })}>Reaproveitar</Button>
                              <Button size="sm" variant={r.reaproveitar === "nova" ? "default" : "outline"} disabled={!podeEditar} onClick={() => setResp(k.indicador_id, { reaproveitar: "nova", iniciativa_alvo_id: undefined })}>Criar outra iniciativa</Button>
                            </div>
                          </div>}
                        </>}
                      </div>}
                    </div>}
                  </div>
                );
              })}
            </div>
            {(co.kpis?.length ?? 0) > 0 && <div className="space-y-1 text-sm"><p className="text-xs text-muted-foreground">Apontamentos antigos</p>
              {co.kpis!.map((k, i) => { const ind = b.indicadores.find((x) => x.id === k.indicador_id); return <p key={i}>{ind?.codigo} · {ind?.nome} {k.valor && `— ${k.valor}`} {k.situacao && `(${SITUACAO_LBL[k.situacao]})`}</p>; })}</div>}
          </Card>

          <Card className="p-4 space-y-3" id="bloco-extras">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1"><Label>Entregas fora do planejado</Label><Textarea rows={3} value={co.extras} disabled={!podeEditar} onChange={(e) => setCo({ ...co, extras: e.target.value })} /></div>
              <div className="space-y-1"><Label>Aprendizados</Label><Textarea rows={3} value={co.aprendizados} disabled={!podeEditar} onChange={(e) => setCo({ ...co, aprendizados: e.target.value })} /></div>
              <div className="space-y-1"><Label>Foco da próxima semana</Label><Textarea rows={3} value={co.proxima} disabled={!podeEditar} onChange={(e) => setCo({ ...co, proxima: e.target.value })} /></div>
            </div>
            <Escala lbl="Avaliação da semana (1 = ruim, 5 = excelente)" v={co.ritmo} on={(n) => setCo({ ...co, ritmo: n })} />
          </Card>

          <Revisao tipo="checkout" pend={pendOut} blocos={[
            { id: "bloco-entregas", txt: `Prioridades: ${entregasAtuais.filter((e) => e.status === "entregue").length} entregues de ${entregasAtuais.length}${co.entregas.length > entregasAtuais.length ? ` · ${co.entregas.length - entregasAtuais.length} de semanas anteriores` : ""}` },
            { id: "bloco-kpis", txt: `KPIs: ${respostas.length}/${retrato.length} respondidos · ${respostas.filter((k) => k.ok === false).length} "Não" · ${co.kpis_resposta.filter((k) => k.ok === false && k.vira_iniciativa && k.plano.trim()).length} plano(s) viram iniciativa` },
            { id: "bloco-extras", txt: `Extras, aprendizados e foco · avaliação ${co.ritmo}/5` },
          ]} />
        </TabsContent>
      </Tabs>

      {podeEditar && <div className="fixed bottom-2 right-4 z-40 rounded-full border bg-background px-3 py-1 text-xs shadow">
        {salvo.estado === "salvando" ? "Salvando…" : salvo.estado === "salvo" ? `Salvo às ${salvo.em!.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
          : salvo.estado === "erro" ? <span className="text-destructive">Não foi possível salvar — suas alterações estão guardadas neste aparelho. <button className="underline" onClick={() => flush()}>Tentar de novo</button></span> : "Salvamento automático"}
      </div>}
    </div>
  );
}
