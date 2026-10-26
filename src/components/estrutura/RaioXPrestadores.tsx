import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useFitFinderAccess } from "@/hooks/useFitFinderAccess";
import { DIRETORIAS_FITFINDER } from "../../../supabase/functions/fitfinder-sync/mapear";
import { X, Plus } from "lucide-react";

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
  const { gov, podeLer, carregando } = useFitFinderAccess();
  const [novas, setNovas] = useState<Record<string, string>>({});
  const [d, setD] = useState<any>({ cfg: null, esp: [], mapa: [], log: [], cads: [], carregado: false });
  const carregar = () => Promise.all([
    db.from("fitfinder_integracao_config").select("ativo,diretores_podem_ler").maybeSingle(),
    db.from("fitfinder_espelho").select("*").eq("ativo", true).order("diretoria"),
    db.from("fitfinder_diretoria_cadeiras").select("*").order("diretoria"),
    db.from("fitfinder_sync_log").select("*").order("iniciado_em", { ascending: false }).limit(10),
    db.from("mt_cadeiras").select("id,nome").eq("ativo", true).order("nome"),
  ]).then(([cfg, esp, mapa, log, cads]: any[]) => setD({ cfg: cfg.data, esp: esp.data ?? [], mapa: mapa.data ?? [], log: log.data ?? [], cads: cads.data ?? [], carregado: true }));
  useEffect(() => {
    if (podeLer) carregar();
  }, [podeLer]);
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
    const { error } = await db.from("fitfinder_diretoria_cadeiras").update(patch).eq("id", id);
    if (error) toast.error("Não foi possível salvar."); else carregar();
  };
  const adicionar = async (diretoria: string) => {
    const cadeira_id = novas[diretoria];
    if (!cadeira_id || !gov) return;
    const { error } = await db.from("fitfinder_diretoria_cadeiras").insert({ diretoria, cadeira_id, status: "sugerido" });
    if (error) toast.error("Não foi possível adicionar. Confira se o par já existe.");
    else { setNovas(n => ({ ...n, [diretoria]: "" })); carregar(); }
  };
  const remover = async (id: string) => {
    const { error } = await db.from("fitfinder_diretoria_cadeiras").delete().eq("id", id);
    if (error) toast.error("Não foi possível remover."); else carregar();
  };
  const liberarDiretores = async (diretores_podem_ler: boolean) => {
    const { error } = await db.from("fitfinder_integracao_config").update({ diretores_podem_ler, atualizado_por: await uid(), updated_at: new Date().toISOString() }).eq("id", true);
    if (error) toast.error("Não foi possível alterar o acesso."); else carregar();
  };
  const mapaDe = (dir: string) => d.mapa.filter((m: any) => m.diretoria === dir);
  const nomeCad = (id?: string | null) => d.cads.find((c: any) => c.id === id)?.nome;
  const ultima = d.esp.reduce((m: string | null, e: any) => (!m || e.sincronizado_em > m ? e.sincronizado_em : m), null);
  const visiveis = podeLer ? d.esp : [];
  const diretorias = [...new Set<string>([...DIRETORIAS_FITFINDER, ...d.mapa.map((m: any) => m.diretoria)])];
  if (carregando) return <p role="status" className="text-sm text-muted-foreground">Carregando…</p>;
  if (!podeLer) return <p role="alert" className="text-sm text-muted-foreground">Raio-x restrito à Governança e ao CEO.</p>;

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
            <div className="flex flex-wrap items-center gap-2">
              <Switch aria-label="Permitir diretor ver a própria diretoria" checked={!!d.cfg?.diretores_podem_ler} onCheckedChange={liberarDiretores} />
              <span>Diretor vê a própria diretoria: {d.cfg?.diretores_podem_ler ? "ligado" : "desligado"}</span>
            </div>
            <p className="text-xs text-muted-foreground">A liberação exige vínculo confirmado e não libera acesso à Estrutura organizacional.</p>
            {d.log.length > 0 && <ul className="text-xs text-muted-foreground">{d.log.map((l: any) => <li key={l.id}>{new Date(l.iniciado_em).toLocaleString("pt-BR")} · {l.ok ? `OK · ${l.diretorias} diretorias` : l.ok === false ? `Falha${l.mensagem ? ` · ${l.mensagem}` : ""}` : "Em andamento"}</li>)}</ul>}
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Diretorias do Fit Finder → cadeiras ({d.mapa.filter((m: any) => m.status === "confirmado").length}/{d.mapa.length} vínculos confirmados)</p>
              <p className="text-xs text-muted-foreground">Números da diretoria inteira, não separados por cadeira. Sugestões aguardam confirmação da Naira.</p>
              {diretorias.map(dir => <section key={dir} className="space-y-2 border-b py-3">
                <h4 className="text-sm font-medium break-words">{dir} · {mapaDe(dir).map((m: any) => nomeCad(m.cadeira_id)).filter(Boolean).join(", ") || "Sem cadeiras"}</h4>
                {mapaDe(dir).map((x: any) => <div key={x.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="min-w-0 flex-1 break-words">{nomeCad(x.cadeira_id)}</span>
                  <Badge variant={x.status === "confirmado" ? "default" : "outline"}>{x.status === "confirmado" ? "Confirmado" : "Sugerido"}</Badge>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => salvarMapa(x.id, { status: x.status === "confirmado" ? "sugerido" : "confirmado" })}>{x.status === "confirmado" ? "Desfazer" : "Confirmar"}</Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Remover vínculo" aria-label={`Remover ${dir} · ${nomeCad(x.cadeira_id)}`} onClick={() => remover(x.id)}><X className="h-4 w-4" /></Button>
                </div>)}
                <div className="flex items-center gap-2">
                  <Select value={novas[dir] ?? ""} onValueChange={v => setNovas(n => ({ ...n, [dir]: v }))}>
                    <SelectTrigger className="h-8 w-full max-w-80 min-w-0" aria-label={`Adicionar cadeira a ${dir}`}><SelectValue placeholder="Adicionar cadeira" /></SelectTrigger>
                    <SelectContent>{d.cads.filter((c: any) => !mapaDe(dir).some((m: any) => m.cadeira_id === c.id)).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" title="Adicionar vínculo sugerido" aria-label={`Adicionar vínculo ${dir}`} disabled={!novas[dir]} onClick={() => adicionar(dir)}><Plus className="h-4 w-4" /></Button>
                </div>
              </section>)}
            </div>
          </CardContent>
        </Card>
      )}

      {d.carregado && !visiveis.length && (
        <p className="rounded border p-6 text-center text-sm text-muted-foreground">
          Ainda não há dados sincronizados do Fit Finder.
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
                  {e.diretoria} · {m.map((x: any) => nomeCad(x.cadeira_id)).filter(Boolean).join(", ") || "Sem cadeiras"}
                  {m.some((x: any) => x.status !== "confirmado") && <Badge variant="outline">Vínculos a confirmar</Badge>}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Números da diretoria inteira, não separados por cadeira.</p>
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
