import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const db = supabase as any;
type Item = { rotulo: string; qtd: number | null; pequeno?: boolean };
const PEQ = "grupo pequeno";
const fmt = (x: { qtd: number | null; pequeno?: boolean } | undefined) => (x?.pequeno ? PEQ : x?.qtd ?? "—");
const fmtNum = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }));
const ROT_TESTE: Record<string, string> = { validos: "Válidos", invalidos: "Inválidos", incompletos: "Incompletos", sem_teste: "Sem teste" };

function Barras({ itens, sufixo = "" }: { itens: Item[]; sufixo?: string }) {
  if (!itens?.length) return <p className="text-xs text-muted-foreground">Sem dados.</p>;
  const max = Math.max(1, ...itens.map((i) => i.qtd ?? 0));
  return (
    <ul className="space-y-1">
      {itens.map((i) => (
        <li key={i.rotulo} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-xs">
          <span className="truncate" title={i.rotulo}>{i.rotulo}</span>
          <span className="h-2 rounded-full bg-muted"><span className="block h-2 rounded-full bg-primary" style={{ width: `${((i.qtd ?? 0) / max) * 100}%` }} /></span>
          <span className="tabular-nums text-muted-foreground">{i.pequeno ? PEQ : i.qtd == null ? "—" : `${fmtNum(i.qtd)}${sufixo}`}</span>
        </li>
      ))}
    </ul>
  );
}

/** Raio-x dos prestadores por diretoria (Fit Finder). Somente agregados; a visibilidade é decidida pelo banco. */
export default function RaioXPrestadores() {
  const [gov, setGov] = useState(false);
  const [d, setD] = useState<any>({ cfg: null, esp: [], mapa: [], log: [], cads: [], carregado: false });
  const carregar = () => Promise.all([
    db.from("fitfinder_integracao_config").select("ativo").maybeSingle(),
    db.from("fitfinder_espelho").select("*").eq("ativo", true).order("diretoria"),
    db.from("fitfinder_diretoria_cadeira").select("*").order("diretoria"),
    db.from("fitfinder_sync_log").select("*").order("iniciado_em", { ascending: false }).limit(10),
    db.from("mt_cadeiras").select("id,nome").eq("ativo", true).order("nome"),
  ]).then(([cfg, esp, mapa, log, cads]: any[]) => setD({ cfg: cfg.data, esp: esp.data ?? [], mapa: mapa.data ?? [], log: log.data ?? [], cads: cads.data ?? [], carregado: true }));
  useEffect(() => {
    carregar();
    supabase.auth.getUser().then(({ data }) => data.user && db.rpc("proj_gov_ou_ceo", { _uid: data.user.id }).then(({ data: ok }: any) => setGov(!!ok)));
  }, []);
  const uid = async () => (await supabase.auth.getUser()).data.user?.id;
  const ligar = async (v: boolean) => {
    const { error } = await db.from("fitfinder_integracao_config").update({ ativo: v, atualizado_por: await uid(), updated_at: new Date().toISOString() }).eq("id", true);
    if (error) toast.error("Não foi possível alterar."); else carregar();
  };
  const sync = async (teste: boolean) => {
    const { data, error } = await supabase.functions.invoke(`fitfinder-sync${teste ? "?teste=1" : ""}`, { method: "POST" });
    if (error) return toast.error("Falha ao chamar a sincronização.");
    if (data?.motivo === "desligada") return toast.info("A integração está desligada.");
    if (data?.motivo === "secret_ausente") return toast.info("Falta o endereço e o token da exportação do Fit Finder.");
    data?.ok ? toast.success(`${teste ? "Conexão OK" : "Sincronizado"}: ${data.diretorias} diretorias.`) : toast.error(`Falha (HTTP ${data?.status_http ?? "—"}).`);
    carregar();
  };
  const salvarMapa = async (id: string, patch: any) => {
    const { error } = await db.from("fitfinder_diretoria_cadeira").update(patch).eq("id", id);
    if (error) toast.error("Não foi possível salvar."); else carregar();
  };
  const mapaDe = (dir: string) => d.mapa.find((m: any) => m.diretoria === dir);
  const nomeCad = (id?: string | null) => d.cads.find((c: any) => c.id === id)?.nome;
  const ultima = d.esp.reduce((m: string | null, e: any) => (!m || e.sincronizado_em > m ? e.sincronizado_em : m), null);
  // Governança/CEO veem tudo; diretores só recebem do banco a diretoria confirmada da própria cadeira
  const visiveis = gov ? d.esp : d.esp.filter((e: any) => mapaDe(e.diretoria)?.status === "confirmado");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Raio-x dos prestadores</h3>
          <p className="text-xs text-muted-foreground">Dados agregados do Fit Finder por diretoria. Grupos com menos de 3 pessoas aparecem como “grupo pequeno”. Nenhum dado individual é guardado aqui.</p>
        </div>
        <Badge variant="outline">Última sincronização: {ultima ? new Date(ultima).toLocaleString("pt-BR") : "nunca"}</Badge>
      </div>

      {gov && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Integração com o Fit Finder (Governança/CEO)</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2"><Switch aria-label="Ligar integração Fit Finder" checked={!!d.cfg?.ativo} onCheckedChange={ligar} /> {d.cfg?.ativo ? "Ligada" : "Desligada"}</span>
              <Button size="sm" variant="outline" disabled={!d.cfg?.ativo} onClick={() => sync(true)}>Testar conexão</Button>
              <Button size="sm" disabled={!d.cfg?.ativo} onClick={() => sync(false)}>Sincronizar agora</Button>
            </div>
            {d.log.length > 0 && <ul className="text-xs text-muted-foreground">{d.log.map((l: any) => <li key={l.id}>{new Date(l.iniciado_em).toLocaleString("pt-BR")} · {l.ok ? `OK · ${l.diretorias} diretorias` : l.ok === false ? `Falha${l.mensagem ? ` · ${l.mensagem}` : ""}` : "Em andamento"}</li>)}</ul>}
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Diretoria do Fit Finder → cadeira ({d.mapa.filter((m: any) => m.status === "confirmado").length}/{d.mapa.length} confirmadas)</p>
              {!d.mapa.length && <p className="text-xs text-muted-foreground">Aparece depois da primeira sincronização. A sugestão é automática; só vale depois de confirmada.</p>}
              {d.mapa.map((x: any) => (
                <div key={x.id} className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 text-xs">
                  <span className="min-w-[160px] flex-1 font-medium">{x.diretoria}</span>
                  <Select value={x.cadeira_id ?? ""} onValueChange={(v) => salvarMapa(x.id, { cadeira_id: v, status: "sugerido" })}>
                    <SelectTrigger className="h-8 w-60" aria-label={`Cadeira de ${x.diretoria}`}><SelectValue placeholder="Escolher cadeira" /></SelectTrigger>
                    <SelectContent>{d.cads.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                  <Badge variant={x.status === "confirmado" ? "default" : "outline"}>{x.status === "confirmado" ? "Confirmado" : "Sugerido"}</Badge>
                  {x.status !== "confirmado"
                    ? <Button size="sm" variant="outline" className="h-7" disabled={!x.cadeira_id} onClick={() => salvarMapa(x.id, { status: "confirmado" })}>Confirmar</Button>
                    : <Button size="sm" variant="ghost" className="h-7" onClick={() => salvarMapa(x.id, { status: "sugerido" })}>Desfazer</Button>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {d.carregado && !visiveis.length && (
        <p className="rounded border p-6 text-center text-sm text-muted-foreground">
          {gov ? "Ainda não há dados sincronizados do Fit Finder." : "Nenhuma diretoria disponível para você. Diretores veem apenas a da própria cadeira, depois que a Governança confirmar a correspondência."}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {visiveis.map((e: any) => {
          const m = mapaDe(e.diretoria);
          const testes: Item[] = Object.keys(ROT_TESTE).map((k) => ({ rotulo: ROT_TESTE[k], ...(e.testes?.[k] ?? { qtd: null }) }));
          return (
            <Card key={e.diretoria}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                  {e.diretoria}
                  {m?.cadeira_id && <Badge variant="outline">{nomeCad(m.cadeira_id)}{m.status !== "confirmado" ? " · a confirmar" : ""}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {e.grupo_pequeno ? <p className="text-sm text-muted-foreground">Grupo pequeno (menos de 3 prestadores): indicadores ocultos para preservar a privacidade.</p> : <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded border p-2"><div className="text-xl font-semibold">{fmtNum(e.total_prestadores)}</div><div className="text-[11px] text-muted-foreground">Prestadores</div></div>
                    <div className="rounded border p-2"><div className="text-xl font-semibold">{fmtNum(e.aderencia?.media)}</div><div className="text-[11px] text-muted-foreground">Aderência média ao cargo</div></div>
                    <div className="rounded border p-2"><div className="text-xl font-semibold">{fmtNum(e.ocupacao?.media)}</div><div className="text-[11px] text-muted-foreground">Ocupação média</div></div>
                  </div>
                  <section><h4 className="mb-1 text-xs font-medium">Distribuição por cargo</h4><Barras itens={e.por_cargo} /></section>
                  <section><h4 className="mb-1 text-xs font-medium">Testes cognitivos</h4><Barras itens={testes} /></section>
                  <section>
                    <h4 className="mb-1 text-xs font-medium">Aderência ao cargo · abaixo do esperado: {fmt(e.aderencia?.abaixo_esperado)}</h4>
                    <Barras itens={e.aderencia?.faixas ?? []} />
                  </section>
                  <section><h4 className="mb-1 text-xs font-medium">Ocupação por faixa</h4><Barras itens={e.ocupacao?.faixas ?? []} /></section>
                  <section><h4 className="mb-1 text-xs font-medium">Alocação de atividades por tipo</h4><Barras itens={e.ocupacao?.alocacao_por_tipo ?? []} /></section>
                </>}
                <p className="text-[11px] text-muted-foreground">Gerado no Fit Finder: {e.gerado_em ? new Date(e.gerado_em).toLocaleString("pt-BR") : "—"} · sincronizado {new Date(e.sincronizado_em).toLocaleString("pt-BR")}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
