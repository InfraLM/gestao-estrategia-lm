import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, RefreshCw, Eye, Save, FlaskConical, PlugZap, Users, Unplug } from "lucide-react";
import { toast } from "sonner";
import { cicloPadrao } from "@/lib/rotinaSemanal";
import { DestinatarioAviso, alternarPermitido, mensagemAviso, recebeAutomatico } from "@/lib/avisosCiclo";

const db = supabase as any;
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const PADRAO = { ativo: false, remetente_pronto: false, abertura_dia: 5, abertura_hora: "08:00", lembrete_dia: 1, lembrete_hora: "14:00", destinatarios_permitidos: null as string[] | null };
type Envio = { id: string; nome: string; ciclo: string; tipo: string; status: string; criado_em: string; enviado_em: string | null; abriu_em: string | null; erro: string | null; tentativas?: number };
type Remetente = { remetente: string | null; configurado_em: string } | null;

export default function AvisosCiclo() {
  const [config, setConfig] = useState(PADRAO);
  const [ciclo] = useState(cicloPadrao);
  const [destinatarios, setDestinatarios] = useState<DestinatarioAviso[]>([]);
  const [historico, setHistorico] = useState<Envio[]>([]);
  const [busy, setBusy] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState("");
  const [preview, setPreview] = useState<DestinatarioAviso | null>(null);
  const [confirmar, setConfirmar] = useState<DestinatarioAviso | "todos" | null>(null);
  const [filtro, setFiltro] = useState("todos");
  const [permitidos, setPermitidos] = useState<string[] | null>(null);
  const [emailTeste, setEmailTeste] = useState("");
  const [listaAlterada, setListaAlterada] = useState(false);
  const [remetente, setRemetente] = useState<Remetente>(null);
  const [desconectar, setDesconectar] = useState(false);
  const load = async () => {
    const [c, d, h, r] = await Promise.all([
      db.from("rotina_avisos_config").select("*").maybeSingle(),
      db.rpc("rotina_avisos_destinatarios", { _ciclo: ciclo }),
      db.from("rotina_avisos_envios").select("id,nome,ciclo,tipo,status,criado_em,enviado_em,abriu_em,erro,tentativas").order("criado_em", { ascending: false }).limit(200),
      db.rpc("rotina_avisos_remetente_info"),
    ]);
    if (c.error || d.error || h.error) { setErro("Não foi possível carregar os avisos."); return; }
    setConfig(c.data ? { ...PADRAO, ...c.data, abertura_hora: c.data.abertura_hora.slice(0, 5), lembrete_hora: c.data.lembrete_hora.slice(0, 5) } : PADRAO);
    setPermitidos(c.data?.destinatarios_permitidos ?? null); setListaAlterada(false);
    setDestinatarios(d.data ?? []); setHistorico(h.data ?? []); setRemetente(r.error ? null : r.data ?? null); setCarregado(true); setErro("");
  };
  useEffect(() => { void load(); }, []);
  const save = async () => {
    setBusy(true);
    const { error } = await db.rpc("rotina_avisos_salvar", { _ativo: config.ativo, _abertura_dia: config.abertura_dia, _abertura_hora: config.abertura_hora, _lembrete_dia: config.lembrete_dia, _lembrete_hora: config.lembrete_hora });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Horários salvos"); void load();
  };
  const reenviar = async () => {
    if (!confirmar) return;
    setBusy(true);
    const { data, error } = await db.rpc("rotina_avisos_preparar", { _ciclo: ciclo, _tipo: "manual", _cadeira: confirmar === "todos" ? null : confirmar.cadeira_id });
    setBusy(false); setConfirmar(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${data} envio(s) solicitado(s)`); void load();
  };
  const funcao = async (body: Record<string, unknown>) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("rotina-avisos-enviar", { body });
    setBusy(false);
    if (error || data?.error) {
      let msg = data?.error as string | undefined;
      try { msg = msg ?? (await (error as { context?: Response } | null)?.context?.json())?.error; } catch { /* ignore */ }
      toast.error(msg ?? "Falha ao chamar o envio de e-mails"); return null;
    }
    return data;
  };
  const testarEmail = async () => {
    const r = await funcao({ acao: "teste", email: emailTeste.trim(), ciclo });
    if (r) toast.success(`E-mail de teste enviado para ${r.para}`);
  };
  const testar = async (d: DestinatarioAviso) => {
    const r = await funcao({ acao: "teste", cadeira_id: d.cadeira_id, ciclo });
    if (r) toast.success(`E-mail de teste enviado para ${r.para}`);
  };
  const conectar = async () => {
    const r = await funcao({ acao: "configurar" });
    if (r) { toast.success(`Remetente Gmail conectado (${r.remetente})`); void load(); }
  };
  const processarFila = async () => {
    const r = await funcao({ acao: "processar" });
    if (r) { toast.success(`Fila processada: ${r.enviados} enviado(s), ${r.falhas} falha(s)${r.reprocessar ? `, ${r.reprocessar} para nova tentativa` : ""}`); void load(); }
  };
  const desligar = async () => {
    setBusy(true);
    const { error } = await db.rpc("rotina_avisos_desconectar");
    setBusy(false); setDesconectar(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Envio desconectado"); void load();
  };
  const naFila = historico.filter(h => h.status === "aguardando" || h.status === "processando").length;
  const salvarLista = async () => {
    setBusy(true);
    const { error } = await db.rpc("rotina_avisos_permitidos_salvar", { _emails: permitidos });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Lista de destinatários salva"); void load();
  };
  const prontos = destinatarios.filter(d => !d.motivo);
  const elegiveis = prontos.map(d => d.email).filter((e): e is string => !!e);
  return <section className="space-y-4 border-t pt-5" aria-label="E-mails do ciclo semanal">
    <div className="flex flex-wrap justify-between gap-3 items-center"><h2 className="font-semibold flex gap-2 items-center"><Mail className="h-5 w-5" />E-mails do ciclo semanal</h2><Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button></div>
    {erro && <p role="alert" className="text-destructive text-sm">{erro}</p>}
    <div className="flex flex-wrap items-end gap-2"><div className="space-y-1"><Label htmlFor="avisos-email-teste">Enviar teste para um e-mail</Label><Input id="avisos-email-teste" className="w-72" type="email" placeholder="nome@liberdademedicaedu.com.br" value={emailTeste} onChange={e => setEmailTeste(e.target.value)} /></div><Button variant="outline" disabled={busy || !/^[^@\s]+@liberdademedicaedu\.com\.br$/i.test(emailTeste.trim())} onClick={() => void testarEmail()}><FlaskConical className="h-4 w-4 mr-2" />Enviar teste</Button><span className="text-xs text-muted-foreground">Não grava nada; usa contagens de exemplo.</span></div>
    {!config.remetente_pronto && <div role="status" className="text-sm text-warning bg-warning-soft border border-warning/30 rounded p-3 flex flex-wrap items-center justify-between gap-2"><span>Envio automático desligado · conecte o remetente (Gmail) depois de testar.</span><Button size="sm" variant="outline" disabled={busy || !carregado} onClick={conectar}><PlugZap className="h-4 w-4 mr-2" />Conectar remetente</Button></div>}
    {config.remetente_pronto && <div className="text-sm border rounded p-3 flex flex-wrap items-center justify-between gap-2"><span>Remetente Gmail conectado{remetente?.remetente ? <> · <b>{remetente.remetente}</b></> : null}{remetente ? ` desde ${new Date(remetente.configurado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}{naFila ? ` · ${naFila} na fila` : ""}</span><div className="flex flex-wrap gap-1"><Button size="sm" variant="ghost" disabled={busy} onClick={() => void processarFila()}><RefreshCw className="h-4 w-4 mr-2" />Processar fila agora</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => setDesconectar(true)}><Unplug className="h-4 w-4 mr-2" />Desconectar</Button></div></div>}
    <div className="flex items-center gap-3"><Switch id="avisos-ativo" checked={config.ativo} disabled={!config.remetente_pronto || busy || !carregado} onCheckedChange={ativo => setConfig({ ...config, ativo })} /><Label htmlFor="avisos-ativo">Disparo {config.ativo ? "ligado" : "desligado"}</Label><Badge variant="outline">São Paulo</Badge></div>
    <div className="grid sm:grid-cols-2 gap-4">{(["abertura", "lembrete"] as const).map(tipo => <div key={tipo} className="space-y-2"><h3 className="text-sm font-medium">{tipo === "abertura" ? "Abertura" : "Lembrete dos não enviados"}</h3><div className="flex gap-2"><Select value={String(config[`${tipo}_dia`])} onValueChange={v => setConfig({ ...config, [`${tipo}_dia`]: Number(v) })}><SelectTrigger className="flex-1" aria-label={`Dia de ${tipo}`}><SelectValue /></SelectTrigger><SelectContent>{DIAS.map((dia, i) => <SelectItem key={dia} value={String(i)}>{dia}</SelectItem>)}</SelectContent></Select><Input className="w-32" type="time" aria-label={`Horário de ${tipo}`} value={config[`${tipo}_hora`]} onChange={e => setConfig({ ...config, [`${tipo}_hora`]: e.target.value })} /></div></div>)}</div>
    <div className="flex flex-wrap gap-2"><Button disabled={busy || !carregado} onClick={save}><Save className="h-4 w-4 mr-2" />Salvar horários</Button><Button variant="outline" disabled={busy || !config.remetente_pronto || !prontos.some(d => !d.enviado)} onClick={() => setConfirmar("todos")}><Mail className="h-4 w-4 mr-2" />Reenviar aos pendentes</Button></div>
    <div className="flex flex-wrap justify-between items-center gap-2"><h3 className="text-sm font-semibold">Diretores · ciclo {ciclo} · prazo segunda 23h59</h3><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{permitidos === null ? "Todos os elegíveis recebem" : `${permitidos.length} na lista`}</span><Button size="sm" variant="outline" disabled={busy || !listaAlterada} onClick={salvarLista}><Users className="h-4 w-4 mr-2" />Salvar lista</Button></div></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left border-b"><tr><th className="py-2 pr-3">Diretor / cadeira</th><th className="pr-3">Recebimento</th><th className="pr-3">Pendências</th><th className="pr-3">Automático</th><th>Ações</th></tr></thead><tbody>{destinatarios.map(d => <tr key={d.cadeira_id} className="border-b"><td className="py-3 pr-3">{d.nome}<span className="block text-xs text-muted-foreground">{d.cadeira}</span></td><td className="pr-3">{d.motivo ? <><Badge variant="outline">Não recebe</Badge><p className="text-xs text-destructive mt-1">{d.motivo}</p></> : <><Badge variant="secondary">{d.enviado ? "Ciclo enviado" : "Ciclo pendente"}</Badge><p className="text-xs text-muted-foreground">{d.email}</p></>}</td><td className="pr-3 text-xs">{d.pendencias.prioridades} prioridades · {d.pendencias.kpis} KPIs<br />{d.pendencias.atas} atas · {d.pendencias.status_reports} status reports</td><td className="pr-3"><Switch aria-label={`E-mail automático para ${d.nome}`} disabled={!!d.motivo || !d.email || busy} checked={!d.motivo && recebeAutomatico(d.email, permitidos)} onCheckedChange={v => { setPermitidos(alternarPermitido(permitidos, elegiveis, d.email!, v)); setListaAlterada(true); }} /></td><td><div className="flex gap-1"><Button size="icon" variant="ghost" aria-label={`Enviar teste para ${d.nome}`} title="Enviar e-mail de teste (não grava nada)" disabled={!!d.motivo || busy} onClick={() => void testar(d)}><FlaskConical className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Prévia para ${d.nome}`} title="Prévia do e-mail" onClick={() => setPreview(d)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Reenviar para ${d.nome}`} title="Reenviar e-mail" disabled={!!d.motivo || !config.remetente_pronto || busy} onClick={() => setConfirmar(d)}><Mail className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div>
    <div className="flex flex-wrap justify-between items-center gap-2"><h3 className="text-sm font-semibold">Histórico de envios</h3><Select value={filtro} onValueChange={setFiltro}><SelectTrigger className="w-48" aria-label="Filtrar histórico"><SelectValue /></SelectTrigger><SelectContent>{["todos", "enviado", "falhou", "aguardando", "processando"].map(s => <SelectItem key={s} value={s}>{s === "todos" ? "Todos os envios" : s}</SelectItem>)}</SelectContent></Select></div>
    {!historico.length ? <p className="text-sm text-muted-foreground">Nenhum envio registrado.</p> : <ul className="space-y-2">{historico.filter(h => filtro === "todos" || h.status === filtro).map(h => <li key={h.id} className="border-b py-2 text-sm"><b>{h.nome}</b> · {h.ciclo} · {h.tipo} · <Badge variant={h.status === "falhou" ? "destructive" : "outline"}>{h.status}</Badge><p className="text-xs text-muted-foreground">{new Date(h.enviado_em ?? h.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {h.abriu_em ? `Abriu em ${new Date(h.abriu_em).toLocaleString("pt-BR")}` : "Abertura não informada"}</p>{h.erro && <p className={`${h.status === "falhou" ? "text-destructive" : "text-muted-foreground"} text-xs`}>{h.erro}{h.tentativas && h.tentativas > 1 ? ` · ${h.tentativas} tentativas` : ""}</p>}</li>)}</ul>}
    <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}><DialogContent><DialogHeader><DialogTitle>Prévia do e-mail</DialogTitle></DialogHeader>{preview && <p className="whitespace-pre-line text-sm break-words">{mensagemAviso(preview, ciclo).text}</p>}</DialogContent></Dialog>
    <Dialog open={!!confirmar} onOpenChange={o => !o && setConfirmar(null)}><DialogContent><DialogHeader><DialogTitle>Confirmar reenvio</DialogTitle></DialogHeader><p className="text-sm">Enviar e-mail {confirmar === "todos" ? "a todos os diretores elegíveis com ciclo pendente" : `para ${confirmar?.nome ?? ""}`}?</p><Button disabled={busy} onClick={reenviar}>Confirmar envio</Button></DialogContent></Dialog>
    <Dialog open={desconectar} onOpenChange={setDesconectar}><DialogContent><DialogHeader><DialogTitle>Desconectar envio</DialogTitle></DialogHeader><p className="text-sm">Desliga os disparos automáticos e o envio. Mensagens na fila aguardam nova conexão e expiram após 14 dias.</p><Button variant="destructive" disabled={busy} onClick={desligar}>Desconectar</Button></DialogContent></Dialog>
  </section>;
}