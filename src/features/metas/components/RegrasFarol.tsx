import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase } from "@/hooks/useMetasBase";
import { useRegrasFarol } from "@/features/metas/hooks/useRegrasFarol";
import { exemploFaixa, fmtPct, lerPct } from "@/features/metas/lib/regrasFarol";

const db = supabase as any;
const COR_AMARELO = "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200";
type Aud = { id: string; tabela: string; registro_id: string; valor_anterior: string | null; valor_novo: string | null; alterado_por: string | null; alterado_em: string };
const pctTxt = (v: string | null) => (v == null || v === "" ? "sem exceção" : fmtPct(Number(v)));

/** Regras do farol (Lançamentos > Regras do farol): faixa geral do amarelo, exceções por indicador e histórico. Só Governança edita. */
export default function RegrasFarol() {
  const b = useMetasBase();
  const { regras, recarregar } = useRegrasFarol();
  const pode = b.isGovernanca;
  const [geral, setGeral] = useState("");
  const [motivoGeral, setMotivoGeral] = useState("");
  const [busca, setBusca] = useState("");
  const [indId, setIndId] = useState<string>("");
  const [pctExc, setPctExc] = useState("");
  const [motivoExc, setMotivoExc] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setGeral(String(Math.round(regras.geralPct * 10000) / 100).replace(".", ",")); }, [regras.geralPct]);

  const historico = useQuery({
    queryKey: ["farol-historico", regras],
    enabled: pode && regras.ativas,
    queryFn: async (): Promise<Aud[]> => {
      const { data, error } = await db.from("mt_auditoria").select("id,tabela,registro_id,valor_anterior,valor_novo,alterado_por,alterado_em")
        .in("tabela", ["mt_farol_regras", "mt_farol_excecoes"]).order("alterado_em", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const ativos = useMemo(() => b.indicadores.filter((i) => i.status === "ativo").sort((a, z) => a.codigo.localeCompare(z.codigo)), [b.indicadores]);
  const nomeInd = (id: string) => { const i = b.indicadores.find((x) => x.id === id); return i ? `${i.codigo} · ${i.nome}` : "Indicador"; };
  const nomePessoa = (uid: string | null) => b.perfis.find((p) => p.user_id === uid)?.display_name ?? "—";
  const opcoes = ativos.filter((i) => !busca || `${i.codigo} ${i.nome}`.toLowerCase().includes(busca.toLowerCase())).slice(0, 80);
  const excecoes = Object.entries(regras.excecoes).sort(([a], [z]) => nomeInd(a).localeCompare(nomeInd(z)));

  const salvar = async (indicador: string | null, pct: number | null, motivo: string, ok: string) => {
    setBusy(true);
    try {
      const { error } = await db.rpc("mt_farol_salvar", { _indicador_id: indicador, _pct: pct, _motivo: motivo.trim() || null });
      if (error) throw error;
      toast.success(ok);
      await recarregar();
      return true;
    } catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar"); return false; } finally { setBusy(false); }
  };

  const pGeral = lerPct(geral);
  const pExc = lerPct(pctExc);

  if (!pode) return <Card className="p-4 text-sm text-muted-foreground">As regras do farol são configuradas pela Governança. Faixa do amarelo hoje: até {fmtPct(regras.geralPct)} abaixo da meta.</Card>;

  return (
    <div className="space-y-4 max-w-4xl">
      {!regras.ativas && <Card className="p-3 text-sm border-warning/40 bg-warning/10">As regras ainda não estão ativadas no banco. Enquanto isso, vale o padrão de 5% e não dá para salvar.</Card>}

      <Card className="p-4 space-y-3">
        <div>
          <h2 className="font-semibold">Como o farol funciona</h2>
          <p className="text-sm text-muted-foreground">Verde: na meta. <span className={`rounded px-1 ${COR_AMARELO}`}>Amarelo</span>: abaixo da meta, mas perto dela (dentro da faixa abaixo). Vermelho: fora da faixa, ou fora da meta sem número para medir (meta declarada pelo diretor ou entrega).</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">1. Faixa do amarelo para todos os indicadores</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32 space-y-1"><Label htmlFor="farol-geral">Até (% da meta)</Label><Input id="farol-geral" inputMode="decimal" value={geral} onChange={(e) => setGeral(e.target.value)} disabled={!regras.ativas || busy} /></div>
            <div className="min-w-[220px] flex-1 space-y-1"><Label htmlFor="farol-geral-motivo">Motivo da mudança (opcional)</Label><Input id="farol-geral-motivo" value={motivoGeral} maxLength={1000} onChange={(e) => setMotivoGeral(e.target.value)} disabled={!regras.ativas || busy} /></div>
            <Button disabled={!regras.ativas || busy || pGeral == null || pGeral === regras.geralPct}
              onClick={async () => { if (await salvar(null, pGeral, motivoGeral, "Faixa geral salva.")) setMotivoGeral(""); }}>Salvar</Button>
          </div>
          <p className="text-xs text-muted-foreground">{pGeral == null ? "Use um número de 0 a 50 (ex.: 5 ou 2,5)." : `Exemplo: ${exemploFaixa(pGeral)}`}</p>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">2. Exceções por indicador</h3>
          <p className="text-xs text-muted-foreground">Para um indicador que precisa de uma faixa diferente da geral. Se o indicador tiver uma tolerância cadastrada na unidade da meta (em Cadastros), ela continua valendo no lugar desta.</p>
        </div>
        {excecoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma exceção: todos os indicadores usam a faixa geral ({fmtPct(regras.geralPct)}).</p> : (
          <ul className="divide-y rounded border">
            {excecoes.map(([id, e]) => (
              <li key={id} className="flex flex-wrap items-center gap-2 p-2 text-sm">
                <span className="min-w-0 flex-1">{nomeInd(id)}{e.motivo && <span className="block text-xs text-muted-foreground">{e.motivo}</span>}</span>
                <Badge variant="outline">até {fmtPct(e.pct)}</Badge>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => salvar(id, null, "", "Exceção retirada; o indicador volta à faixa geral.")}>Tirar exceção</Button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-1">
            <Label htmlFor="farol-busca">Indicador</Label>
            <Input id="farol-busca" placeholder="Digite parte do código ou do nome para filtrar" value={busca} onChange={(e) => setBusca(e.target.value)} disabled={!regras.ativas || busy} />
            <Select value={indId} onValueChange={setIndId} disabled={!regras.ativas || busy}>
              <SelectTrigger aria-label="Escolha o indicador"><SelectValue placeholder="Escolha o indicador" /></SelectTrigger>
              <SelectContent>{opcoes.map((i) => <SelectItem key={i.id} value={i.id}>{i.codigo} · {i.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label htmlFor="farol-exc">Até (% da meta)</Label><Input id="farol-exc" inputMode="decimal" placeholder="Ex.: 10" value={pctExc} onChange={(e) => setPctExc(e.target.value)} disabled={!regras.ativas || busy} /></div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1 space-y-1"><Label htmlFor="farol-exc-motivo">Motivo (opcional)</Label><Input id="farol-exc-motivo" maxLength={1000} placeholder="Ex.: indicador muito sensível; 1% já é relevante" value={motivoExc} onChange={(e) => setMotivoExc(e.target.value)} disabled={!regras.ativas || busy} /></div>
          <Button disabled={!regras.ativas || busy || !indId || pExc == null}
            onClick={async () => { if (await salvar(indId, pExc, motivoExc, "Exceção salva.")) { setIndId(""); setPctExc(""); setMotivoExc(""); setBusca(""); } }}>Salvar exceção</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="text-sm font-semibold">3. Histórico de mudanças</h3>
        {!regras.ativas ? <p className="text-sm text-muted-foreground">Aparece aqui depois que as regras forem ativadas.</p>
          : historico.isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p>
          : (historico.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma mudança ainda. A regra em uso é a padrão de 5%.</p>
          : <ul className="space-y-1 text-sm">{historico.data!.map((h) => (
              <li key={h.id}>
                <span className="text-muted-foreground">{new Date(h.alterado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {nomePessoa(h.alterado_por)}:</span>{" "}
                {h.tabela === "mt_farol_regras" ? "faixa geral" : nomeInd(h.registro_id)} de {pctTxt(h.valor_anterior)} para {pctTxt(h.valor_novo)}
              </li>))}</ul>}
      </Card>
    </div>
  );
}
