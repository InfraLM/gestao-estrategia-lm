import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMetasBase, MESES_2S26, type Indicador } from "@/hooks/useMetasBase";

type Draft = { nome: string; meta_texto: string; meta_semestre: string; peso: string };
const toDraft = (i: Indicador): Draft => ({
  nome: i.nome, meta_texto: i.meta_texto ?? "", meta_semestre: i.meta_semestre == null ? "" : String(i.meta_semestre),
  peso: String(Math.round(Number(i.peso) * 1000) / 10),
});
const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

/** Matriz editável da Cesta de Metas — grava direto nos indicadores (origem "cesta") usados pelo Lançamento mensal e pelo Painel da Governança. */
export default function CestaMatrizEditavel({ extras }: { extras: (diretor: string, indicador: string) => { tipo?: string; objetivos?: string[] } | undefined }) {
  const { cadeiras, indicadores, metas, isGov, reload, loading } = useMetasBase();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [salvando, setSalvando] = useState<string | null>(null);

  const cesta = indicadores.filter((i) => i.origem === "cesta" && i.status === "ativo");
  useEffect(() => { setDrafts(Object.fromEntries(cesta.map((i) => [i.id, toDraft(i)]))); }, [indicadores]); // eslint-disable-line

  const db = supabase as any;

  async function salvar(i: Indicador) {
    const d = drafts[i.id]; if (!d) return;
    const novaMeta = num(d.meta_semestre); const novoPeso = (num(d.peso) ?? 0) / 100;
    if (d.nome === i.nome && d.meta_texto === (i.meta_texto ?? "") && novaMeta === i.meta_semestre && Math.abs(novoPeso - Number(i.peso)) < 1e-9) return;
    if (novaMeta != null && isNaN(novaMeta)) return toast.error("Meta numérica inválida");
    setSalvando(i.id);
    try {
      const { error } = await db.from("mt_indicadores").update({ nome: d.nome.trim() || i.nome, meta_texto: d.meta_texto || null, meta_semestre: novaMeta, peso: novoPeso }).eq("id", i.id);
      if (error) throw error;
      // Mantém a curva mensal coerente com a nova meta do semestre
      if (novaMeta !== i.meta_semestre && novaMeta != null) {
        const atuais = metas.filter((m) => m.indicador_id === i.id);
        const antiga = i.meta_semestre;
        const rows = MESES_2S26.map((comp, idx) => {
          const m = atuais.find((x) => x.competencia === comp);
          if (m && antiga) {
            const f = novaMeta / antiga;
            return { indicador_id: i.id, competencia: comp, meta_mes: m.meta_mes == null ? null : m.meta_mes * f, meta_acumulada: m.meta_acumulada == null ? null : m.meta_acumulada * f };
          }
          return { indicador_id: i.id, competencia: comp, meta_mes: novaMeta, meta_acumulada: novaMeta, _idx: idx };
        }).map(({ _idx, ...r }: any) => r);
        const r = await db.from("mt_metas_mensais").upsert(rows, { onConflict: "indicador_id,competencia" });
        if (r.error) throw r.error;
      }
      toast.success("Cesta atualizada — Lançamento mensal e Painel já usam o novo valor");
      await reload();
    } catch (e: any) { toast.error(e.message ?? "Erro ao salvar"); }
    finally { setSalvando(null); }
  }

  async function adicionar(cadeiraId: string, prefixo: string) {
    const n = cesta.filter((i) => i.cadeira_id === cadeiraId).length + 1;
    const { error } = await db.from("mt_indicadores").insert({
      codigo: `cesta.${prefixo}.${String(n).padStart(2, "0")}.${Date.now().toString(36).slice(-3)}`, nome: "Novo indicador", origem: "cesta",
      cadeira_id: cadeiraId, peso: 0, sentido: "maior", status: "ativo", regra_consolidacao: "pior",
    });
    if (error) return toast.error(error.message);
    reload();
  }

  async function arquivar(i: Indicador) {
    if (!confirm(`Arquivar "${i.nome}"? Ele sai da cesta e da nota mensal.`)) return;
    const { error } = await db.from("mt_indicadores").update({ status: "arquivado" }).eq("id", i.id);
    if (error) return toast.error(error.message);
    reload();
  }

  if (loading) return <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando cesta…</div>;

  const grupos = cadeiras.filter((c) => c.ativo && cesta.some((i) => i.cadeira_id === c.id));
  return (
    <div className="space-y-4">
      {!isGov && <p className="text-xs text-muted-foreground">Somente a Governança pode editar a cesta. Você está vendo em modo leitura.</p>}
      {grupos.map((c) => {
        const itens = cesta.filter((i) => i.cadeira_id === c.id);
        const soma = itens.reduce((s, i) => s + (num(drafts[i.id]?.peso ?? "") ?? 0), 0);
        const prefixo = itens[0]?.codigo.split(".")[1] ?? "x";
        return (
          <Card key={c.id}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0 gap-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{c.diretor_nome ?? "—"} <span className="text-muted-foreground font-normal">· {c.nome}</span></CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={Math.round(soma) === 100 ? "outline" : "destructive"} className="text-[10px]">pesos somam {Math.round(soma * 10) / 10}%</Badge>
                {isGov && <Button size="sm" variant="outline" onClick={() => adicionar(c.id, prefixo)}><Plus className="h-3 w-3 mr-1" /> Indicador</Button>}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicador</TableHead><TableHead className="w-48">Meta 2026/2 (texto)</TableHead>
                    <TableHead className="w-32">Meta numérica</TableHead><TableHead className="w-24">Peso %</TableHead><TableHead className="w-28">Vínculos</TableHead><TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((i) => {
                    const d = drafts[i.id] ?? toDraft(i);
                    const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => setDrafts((s) => ({ ...s, [i.id]: { ...d, [k]: e.target.value } }));
                    const ex = extras(c.diretor_nome ?? "", i.nome);
                    const p = { onBlur: () => salvar(i), onKeyDown: (e: React.KeyboardEvent) => e.key === "Enter" && (e.target as HTMLInputElement).blur(), disabled: !isGov || salvando === i.id, className: "h-8 text-xs" };
                    return (
                      <TableRow key={i.id}>
                        <TableCell><Input value={d.nome} onChange={set("nome")} {...p} aria-label="Indicador" /></TableCell>
                        <TableCell><Input value={d.meta_texto} onChange={set("meta_texto")} {...p} aria-label="Meta texto" /></TableCell>
                        <TableCell><Input value={d.meta_semestre} onChange={set("meta_semestre")} inputMode="decimal" {...p} aria-label="Meta numérica" /></TableCell>
                        <TableCell><Input value={d.peso} onChange={set("peso")} inputMode="decimal" {...p} aria-label="Peso" /></TableCell>
                        <TableCell className="text-[10px] space-x-1">
                          {ex?.tipo && <Badge variant="secondary" className="text-[10px]">{ex.tipo}</Badge>}
                          {ex?.objetivos?.map((o) => <Badge key={o} variant="outline" className="font-mono text-[10px]">{o}</Badge>)}
                        </TableCell>
                        <TableCell>
                          {salvando === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isGov && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => arquivar(i)} aria-label="Arquivar"><Archive className="h-3.5 w-3.5" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
      <p className="text-[11px] text-muted-foreground italic">Alterar a meta numérica ajusta automaticamente a curva mensal (jul–dez) usada no Lançamento mensal; alterar o peso muda o cálculo da nota no Lançamento e no Painel da Governança.</p>
    </div>
  );
}
