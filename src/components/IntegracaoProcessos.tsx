import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { divergencias } from "@/lib/processosImpacto";

const db = supabase as any;
const TIPO_DIV: Record<string, string> = { so_local: "Só na lista local", so_zeev: "Só no app de processos", nome: "Nome diferente", maturidade: "Maturidade diferente" };

/** Governança: liga/desliga a integração com o app de processos e confirma correspondências. */
export default function IntegracaoProcessos() {
  const [gov, setGov] = useState(false);
  const [d, setD] = useState<any>({ cfg: null, corr: [], dirs: [], log: [], inds: [], cads: [], local: [], esp: [] });
  const carregar = () => Promise.all([
    db.from("proc_integracao_config").select("ativo").maybeSingle(),
    db.from("proc_kpi_correspondencia").select("*").order("kpi_nome_origem"),
    db.from("proc_diretoria_cadeira").select("*").order("diretoria"),
    db.from("proc_sync_log").select("*").order("iniciado_em", { ascending: false }).limit(10),
    db.from("mt_indicadores").select("id,codigo,nome,origem").eq("status", "ativo").is("parent_id", null).order("codigo"),
    db.from("mt_cadeiras").select("id,nome").eq("ativo", true).order("nome"),
    db.from("processos").select("id,nome,maturidade").eq("ativo", true),
    db.from("proc_espelho_processos").select("codigo,nome,maturidade_nivel").eq("ativo", true),
  ]).then(([cfg, corr, dirs, log, inds, cads, local, esp]: any[]) => setD({ cfg: cfg.data, corr: corr.data ?? [], dirs: dirs.data ?? [], log: log.data ?? [], inds: inds.data ?? [], cads: cads.data ?? [], local: local.data ?? [], esp: esp.data ?? [] }));
  useEffect(() => {
    carregar();
    supabase.auth.getUser().then(({ data }) => data.user && db.rpc("proj_gov_ou_ceo", { _uid: data.user.id }).then(({ data: ok }: any) => setGov(!!ok)));
  }, []);
  const divs = useMemo(() => (d.esp.length ? divergencias(d.local, d.esp) : []), [d]);
  const uid = async () => (await supabase.auth.getUser()).data.user?.id;

  const ligar = async (v: boolean) => {
    const { error } = await db.from("proc_integracao_config").update({ ativo: v, atualizado_por: await uid(), updated_at: new Date().toISOString() }).eq("id", true);
    if (error) toast.error("Não foi possível alterar."); else carregar();
  };
  const sync = async (teste: boolean) => {
    const { data, error } = await supabase.functions.invoke(`processos-sync${teste ? "?teste=1" : ""}`, { method: "POST" });
    if (error) return toast.error("Falha ao chamar a sincronização.");
    if (data?.motivo === "desligada") return toast.info("A integração está desligada.");
    if (data?.motivo === "secret_ausente") return toast.info("Falta o endereço e o token da exportação do app de processos.");
    data?.ok ? toast.success(`${teste ? "Conexão OK" : "Sincronizado"}: ${data.processos} processos, ${data.impactos} impactos, ${data.melhorias} melhorias.`) : toast.error(`Falha (HTTP ${data?.status_http ?? "—"}).`);
    carregar();
  };
  const salvarCorr = async (id: string, patch: any) => {
    const { error } = await db.from("proc_kpi_correspondencia").update({ ...patch, confirmado_por: await uid(), confirmado_em: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Não foi possível salvar."); else carregar();
  };
  const salvarDir = async (id: string, patch: any) => {
    const { error } = await db.from("proc_diretoria_cadeira").update({ ...patch, confirmado_por: await uid(), confirmado_em: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Não foi possível salvar."); else carregar();
  };
  const nomeInd = (id: string | null) => { const i = d.inds.find((x: any) => x.id === id); return i ? `${i.codigo} · ${i.nome}` : "—"; };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Integração com o app Gestão Processos</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground text-xs">Até o app de processos ter a exportação, o Impacto Estratégico usa a lista local de processos. Quando a sincronização trouxer dados, o espelho substitui a lista local e as divergências aparecem abaixo. KPIs e diretorias só valem depois de confirmados aqui.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2"><Switch checked={!!d.cfg?.ativo} disabled={!gov} onCheckedChange={ligar} /> {d.cfg?.ativo ? "Ligada" : "Desligada"}</span>
            {gov && <Button size="sm" variant="outline" disabled={!d.cfg?.ativo} onClick={() => sync(true)}>Testar conexão</Button>}
            {gov && <Button size="sm" disabled={!d.cfg?.ativo} onClick={() => sync(false)}>Sincronizar agora</Button>}
            <Badge variant="outline">{d.esp.length ? `${d.esp.length} processos espelhados` : "Sem espelho · usando lista local"}</Badge>
          </div>
          {d.log.length > 0 && <ul className="text-xs text-muted-foreground">{d.log.map((l: any) => <li key={l.id}>{new Date(l.iniciado_em).toLocaleString("pt-BR")} · {l.ok ? `OK · ${l.processos} proc., ${l.impactos} impactos, ${l.melhorias} melhorias` : `Falha${l.mensagem ? ` · ${l.mensagem}` : ""}`}</li>)}</ul>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Correspondência de KPIs ({d.corr.filter((c: any) => c.status === "confirmado").length}/{d.corr.length} confirmados)</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {!d.corr.length && <p className="text-xs text-muted-foreground">Aparece depois da primeira sincronização.</p>}
          {d.corr.map((c: any) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 text-xs">
              <span className="flex-1 min-w-[200px]"><span className="font-medium">{c.kpi_codigo_origem || "sem código"}</span> · {c.kpi_nome_origem}</span>
              {gov ? (
                <Select value={c.indicador_id ?? ""} onValueChange={(v) => salvarCorr(c.id, { indicador_id: v, status: "sugerido" })}>
                  <SelectTrigger className="h-8 w-72"><SelectValue placeholder="Escolher indicador" /></SelectTrigger>
                  <SelectContent>{d.inds.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.codigo} · {i.nome}</SelectItem>)}</SelectContent>
                </Select>) : <span>{nomeInd(c.indicador_id)}</span>}
              <Badge variant={c.status === "confirmado" ? "default" : "outline"}>{c.status === "confirmado" ? "Confirmado" : c.status === "sem_correspondencia" ? "Sem correspondência" : "Sugerido"}</Badge>
              {gov && <Button size="sm" variant="outline" className="h-7" disabled={!c.indicador_id} onClick={() => salvarCorr(c.id, { status: "confirmado" })}>Confirmar</Button>}
              {gov && <Button size="sm" variant="ghost" className="h-7" onClick={() => salvarCorr(c.id, { status: "sem_correspondencia", indicador_id: null })}>Sem correspondência</Button>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Diretoria → cadeira</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {!d.dirs.length && <p className="text-xs text-muted-foreground">Aparece depois da primeira sincronização.</p>}
          {d.dirs.map((x: any) => (
            <div key={x.id} className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 text-xs">
              <span className="flex-1 min-w-[160px] font-medium">{x.diretoria}</span>
              {gov ? (
                <Select value={x.cadeira_id ?? ""} onValueChange={(v) => salvarDir(x.id, { cadeira_id: v, status: "sugerido" })}>
                  <SelectTrigger className="h-8 w-60"><SelectValue placeholder="Escolher cadeira" /></SelectTrigger>
                  <SelectContent>{d.cads.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>) : <span>{d.cads.find((c: any) => c.id === x.cadeira_id)?.nome ?? "—"}</span>}
              <Badge variant={x.status === "confirmado" ? "default" : "outline"}>{x.status === "confirmado" ? "Confirmado" : "Sugerido"}</Badge>
              {gov && <Button size="sm" variant="outline" className="h-7" disabled={!x.cadeira_id} onClick={() => salvarDir(x.id, { status: "confirmado" })}>Confirmar</Button>}
            </div>
          ))}
        </CardContent>
      </Card>

      {gov && d.esp.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Divergências lista local × app de processos ({divs.length})</CardTitle></CardHeader>
          <CardContent><ul className="divide-y text-xs">{divs.map((x, i) => (
            <li key={i} className="py-1.5 flex flex-wrap gap-2"><span className="font-medium">{x.codigo}</span><Badge variant="outline">{TIPO_DIV[x.tipo]}</Badge>
              <span className="text-muted-foreground">{x.local ? `Local: ${x.local}` : ""}{x.local && x.zeev ? " · " : ""}{x.zeev ? `App de processos: ${x.zeev}` : ""}</span></li>))}</ul></CardContent>
        </Card>
      )}
    </div>
  );
}
