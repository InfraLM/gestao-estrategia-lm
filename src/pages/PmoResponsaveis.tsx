import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase } from "@/hooks/useMetasBase";
import { useProjetosGestao } from "@/hooks/useProjetosGestao";
import { sugerirCadeiras } from "@/lib/projetosGestao";
import VinculosImpactoProjeto from "@/components/VinculosImpactoProjeto";
import GrupoMultiSelect from "@/components/socios/GrupoMultiSelect";

const db = supabase as any;
type Filtro = "todos" | "sugeridos" | "fila" | "confirmados";

/** Conferência em lote da cadeira responsável dos projetos (Governança) e vínculos de impacto. */
export default function PmoResponsaveis() {
  const b = useMetasBase();
  const g = useProjetosGestao();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [marcados, setMarcados] = useState<string[]>([]);
  const [escolha, setEscolha] = useState<Record<string, { principal: string; apoio: string[] }>>({});
  const [lote, setLote] = useState("");
  const gov = b.isGovernanca;
  const cads = b.cadeiras.filter((c) => c.ativo);
  const nomeCad = (id: string | null) => b.cadeiras.find((c) => c.id === id)?.nome ?? "—";

  const linhas = useMemo(() => g.projetos.map((p) => {
    const sug = sugerirCadeiras(p.diretor, cads);
    return { p, sug, apoio: g.apoio.filter((a) => a.projeto_id === p.id).map((a) => a.cadeira_id) };
  }), [g.projetos, g.apoio, cads]);
  const confirmados = linhas.filter((l) => l.p.cadeira_id).length;
  const fila = linhas.filter((l) => !l.p.cadeira_id && !l.sug.length).length;
  const situacao = linhas.filter((l) => l.p.situacao_confirmada_em).length;
  const visiveis = linhas.filter((l) => {
    if (busca && !`${l.p.codigo} ${l.p.nome} ${l.p.diretor ?? ""}`.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtro === "fila") return !l.p.cadeira_id && !l.sug.length;
    if (filtro === "sugeridos") return !l.p.cadeira_id && l.sug.length > 0;
    if (filtro === "confirmados") return !!l.p.cadeira_id;
    return true;
  });
  const valor = (l: typeof linhas[number]) => escolha[l.p.id] ?? { principal: l.p.cadeira_id ?? l.sug[0] ?? "", apoio: l.p.cadeira_id ? l.apoio : l.sug.slice(1) };

  const definir = async (ids: string[], principal: string | null, apoio: string[] | null) => {
    const { error } = await db.rpc("projeto_definir_cadeira", { _projetos: ids, _cadeira: principal, _apoio: apoio });
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} projeto(s) atualizado(s).`); setMarcados([]); g.reload();
  };
  const confirmarSugestoes = async () => {
    // Agrupa os marcados pela escolha exibida (principal + apoio) e confirma cada grupo.
    const grupos = new Map<string, string[]>();
    for (const id of marcados) { const l = linhas.find((x) => x.p.id === id)!; const v = valor(l); if (!v.principal) continue; const k = v.principal + "|" + v.apoio.join(","); grupos.set(k, [...(grupos.get(k) ?? []), id]); }
    if (!grupos.size) return toast.error("Nenhum dos marcados tem cadeira escolhida.");
    for (const [k, ids] of grupos) { const [pr, ap] = k.split("|"); await definir(ids, pr, ap ? ap.split(",") : []); }
  };

  if (b.loading || g.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Responsáveis dos projetos</h1>
        <p className="text-sm text-muted-foreground">A sugestão vem do texto do diretor e nunca é gravada sozinha: confirme a cadeira principal (e apoio, se houver). O status report mensal é pedido só à cadeira principal.</p></div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Projetos", g.projetos.length], ["Cadeira confirmada", confirmados], ["Situação confirmada pelo diretor", situacao], ["Sem responsável (fila)", fila]].map(([t, n]) => (
          <Card key={t as string} className="p-3"><p className="text-xs text-muted-foreground">{t}</p><p className="text-2xl font-semibold">{n}</p></Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Input className="max-w-xs" placeholder="Buscar projeto ou diretor" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="sugeridos">A confirmar (com sugestão)</SelectItem><SelectItem value="fila">Fila sem responsável</SelectItem><SelectItem value="confirmados">Confirmados</SelectItem></SelectContent>
        </Select>
        {gov && marcados.length > 0 && <>
          <Button size="sm" onClick={confirmarSugestoes}>Confirmar escolha de {marcados.length}</Button>
          <Select value={lote} onValueChange={setLote}><SelectTrigger className="w-48 h-9"><SelectValue placeholder="Atribuir cadeira…" /></SelectTrigger>
            <SelectContent>{cads.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
          <Button size="sm" variant="outline" disabled={!lote} onClick={() => definir(marcados, lote, [])}>Atribuir aos marcados</Button>
        </>}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs"><tr>
            {gov && <th className="p-2"><Checkbox checked={visiveis.length > 0 && visiveis.every((l) => marcados.includes(l.p.id))} onCheckedChange={(c) => setMarcados(c ? visiveis.map((l) => l.p.id) : [])} aria-label="Marcar todos" /></th>}
            <th className="p-2">Projeto</th><th className="p-2">Status</th><th className="p-2">Diretor (texto)</th><th className="p-2">Cadeira principal</th><th className="p-2">Apoio</th><th className="p-2">Vínculos</th><th className="p-2"></th>
          </tr></thead>
          <tbody>{visiveis.map((l) => {
            const v = valor(l);
            const podeVinc = gov || (!!l.p.cadeira_id && l.p.cadeira_id === b.minhaCadeira);
            return (
              <tr key={l.p.id} className="border-t align-top">
                {gov && <td className="p-2"><Checkbox checked={marcados.includes(l.p.id)} onCheckedChange={(c) => setMarcados((m) => c ? [...m, l.p.id] : m.filter((x) => x !== l.p.id))} aria-label={`Marcar ${l.p.codigo}`} /></td>}
                <td className="p-2"><p className="font-medium">{l.p.codigo}</p><p className="text-xs text-muted-foreground max-w-xs">{l.p.nome}</p></td>
                <td className="p-2 text-xs">{l.p.status}</td>
                <td className="p-2 text-xs">{l.p.diretor || <span className="text-muted-foreground">—</span>}</td>
                <td className="p-2 min-w-[180px]">
                  {gov ? <Select value={v.principal || "none"} onValueChange={(x) => setEscolha({ ...escolha, [l.p.id]: { ...v, principal: x === "none" ? "" : x } })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Sem cadeira</SelectItem>{cads.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select> : <span>{nomeCad(l.p.cadeira_id)}</span>}
                  <div className="mt-1">{l.p.cadeira_id ? <Badge variant="outline">Confirmada</Badge> : l.sug.length ? <Badge variant="secondary">Sugestão</Badge> : <Badge variant="destructive">Fila</Badge>}</div>
                </td>
                <td className="p-2 min-w-[180px]">{gov
                  ? <GrupoMultiSelect grupos={[{ grupo: "Cadeiras", opcoes: cads.filter((c) => c.id !== v.principal).map((c) => ({ value: c.id, label: c.nome })) }]} value={v.apoio} onChange={(x) => setEscolha({ ...escolha, [l.p.id]: { ...v, apoio: x } })} placeholder="Apoio" />
                  : <span className="text-xs">{l.apoio.map(nomeCad).join(", ") || "—"}</span>}</td>
                <td className="p-2"><VinculosImpactoProjeto projeto={l.p} vinculos={g.vinculos} indicadores={b.indicadores} okrs={b.okrs} objetivos={b.objetivos} onSalvo={g.reload} podeEditar={podeVinc} /></td>
                <td className="p-2 whitespace-nowrap">{gov && <div className="flex gap-1">
                  <Button size="sm" disabled={!v.principal} onClick={() => definir([l.p.id], v.principal, v.apoio)}>Confirmar</Button>
                  {l.p.cadeira_id && <Button size="sm" variant="ghost" onClick={() => definir([l.p.id], null, [])}>Voltar à fila</Button>}
                </div>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </Card>
    </div>
  );
}
