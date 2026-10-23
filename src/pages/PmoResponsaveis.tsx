import { useEffect, useMemo, useState } from "react";
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
  const [propostas,setPropostas]=useState<any[]>([]);
  const [confianca,setConfianca]=useState('todas');
  const [busy,setBusy]=useState(false);
  const carregarPropostas=async()=>{const {data,error}=await db.from('projeto_cadeira_sugestoes').select('*');if(error)toast.error(error.message);else setPropostas(data??[]);};
  useEffect(()=>{if(b.isGovernanca)void carregarPropostas();},[b.isGovernanca]);
  const gov = b.isGovernanca;
  const cads = b.cadeiras.filter((c) => c.ativo);
  const nomeCad = (id: string | null) => b.cadeiras.find((c) => c.id === id)?.nome ?? "—";

  const linhas = useMemo(() => g.projetos.map((p) => {
    const proposta=propostas.find(s=>s.projeto_id===p.id&&s.status==='proposto');
    const sug = proposta ? [proposta.principal,...proposta.apoio] : sugerirCadeiras(p.diretor, cads);
    return { p, sug, proposta, apoio: g.apoio.filter((a) => a.projeto_id === p.id).map((a) => a.cadeira_id) };
  }), [g.projetos, g.apoio, cads,propostas]);
  const confirmados = linhas.filter((l) => l.p.cadeira_id).length;
  const fila = linhas.filter((l) => !l.p.cadeira_id && !l.sug.length).length;
  const situacao = linhas.filter((l) => l.p.situacao_confirmada_em).length;
  const visiveis = linhas.filter((l) => {
    if(confianca!=='todas'&&l.proposta?.confianca!==confianca)return false;
    if (busca && !`${l.p.codigo} ${l.p.nome} ${l.p.diretor ?? ""}`.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtro === "fila") return !l.p.cadeira_id && !l.sug.length;
    if (filtro === "sugeridos") return !l.p.cadeira_id && l.sug.length > 0;
    if (filtro === "confirmados") return !!l.p.cadeira_id;
    return true;
  });
  const valor = (l: typeof linhas[number]) => escolha[l.p.id] ?? { principal: l.p.cadeira_id ?? l.sug[0] ?? "", apoio: l.p.cadeira_id ? l.apoio : l.sug.slice(1) };

  const definir = async (ids: string[], principal: string | null, apoio: string[] | null) => {
    if(busy)return;setBusy(true);
    const { error } = principal ? await db.rpc('projeto_aprovar_sugestoes',{_itens:ids.map(projeto_id=>({projeto_id,principal,apoio:apoio??[]}))}) : await db.rpc("projeto_definir_cadeira", { _projetos: ids, _cadeira: principal, _apoio: apoio });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} projeto(s) atualizado(s).`); setMarcados([]); g.reload();void carregarPropostas();
  };
  const confirmarSugestoes = async () => {
    // Agrupa os marcados pela escolha exibida (principal + apoio) e confirma cada grupo.
    if(busy)return;
    const itens=marcados.flatMap(id=>{const l=linhas.find(x=>x.p.id===id);if(!l)return [];const v=valor(l);return v.principal?[{projeto_id:id,principal:v.principal,apoio:v.apoio}]:[];});
    if(itens.length!==marcados.length)return toast.error('Escolha a cadeira de todos os selecionados.');
    setBusy(true);const {error}=await db.rpc('projeto_aprovar_sugestoes',{_itens:itens});setBusy(false);
    if(error)return toast.error(error.message);toast.success(`${itens.length} escolhas confirmadas.`);setMarcados([]);setEscolha({});g.reload();void carregarPropostas();
  };
  const gerar=async()=>{if(busy)return;const ids=g.projetos.filter(p=>!p.cadeira_id).map(p=>p.id);setBusy(true);let n=0;try{for(let i=0;i<ids.length;i+=10){const {data,error}=await supabase.functions.invoke('ciclo-preparar',{body:{tipo:'cadeiras',ids:ids.slice(i,i+10)}});if(error||data?.error)throw new Error(data?.error??error?.message);n+=data.propostos;}toast.success(`${n} sugestões, sem confirmar responsáveis.`);}catch(e){toast.error(e instanceof Error?e.message:'Falha na geração');}finally{setBusy(false);void carregarPropostas();}};

  if (b.loading || g.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Responsáveis dos projetos</h1>
        <p className="text-sm text-muted-foreground">Sugestões a confirmar · cadeira principal e apoio</p></div>
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
        <Select value={confianca} onValueChange={setConfianca}><SelectTrigger className="w-48" aria-label="Confiança da sugestão"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="todas">Todas as confianças</SelectItem>{['alta','media','baixa'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
        {gov&&<Button variant="outline" disabled={busy} onClick={gerar}>{busy?'Gerando…':'Sugerir responsáveis com IA'}</Button>}
        {gov && marcados.length > 0 && <>
          <Button size="sm" disabled={busy} onClick={confirmarSugestoes}>Confirmar escolha de {marcados.length}</Button>
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
                  {l.proposta&&<><Badge variant="outline">IA · {l.proposta.confianca}</Badge><p className="text-xs mt-1 text-muted-foreground max-w-64">{l.proposta.justificativa}</p></>}
                </td>
                <td className="p-2 min-w-[180px]">{gov
                  ? <GrupoMultiSelect grupos={[{ grupo: "Cadeiras", opcoes: cads.filter((c) => c.id !== v.principal).map((c) => ({ value: c.id, label: c.nome })) }]} value={v.apoio} onChange={(x) => setEscolha({ ...escolha, [l.p.id]: { ...v, apoio: x } })} placeholder="Apoio" />
                  : <span className="text-xs">{l.apoio.map(nomeCad).join(", ") || "—"}</span>}</td>
                <td className="p-2"><VinculosImpactoProjeto projeto={l.p} vinculos={g.vinculos} indicadores={b.indicadores} okrs={b.okrs} objetivos={b.objetivos} onSalvo={g.reload} podeEditar={podeVinc} /></td>
                <td className="p-2 whitespace-nowrap">{gov && <div className="flex gap-1">
                  <Button size="sm" disabled={busy||!v.principal} onClick={() => definir([l.p.id], v.principal, v.apoio)}>Confirmar</Button>
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
