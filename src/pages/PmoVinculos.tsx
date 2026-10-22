import { useEffect, useState } from "react";
import { CadastroIniciativas } from "./Hubs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetasBase } from "@/hooks/useMetasBase";
import EmpilhadosVinculo, { carregarBaseVinculos } from "@/components/EmpilhadosVinculo";
import { iniciativasDoItem } from "@/lib/projetosGestao";

type Tipo = "objetivo" | "bsc" | "okr" | "cesta";
const LBL: Record<Tipo, string> = { objetivo: "Objetivos BSC", bsc: "KPIs BSC", okr: "KRs 2026/2", cesta: "Cesta de metas" };

/** Iniciativas e projetos empilhados em cada objetivo, KPI, KR e item de cesta. */
export default function PmoVinculos() {
  const b = useMetasBase();
  const [tipo, setTipo] = useState<Tipo>("objetivo");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [cont, setCont] = useState<Record<string, number>>({});
  const okr2 = new Set(b.okrs.filter((o) => o.semestre === "2026/2").map((o) => o.id));
  const itens = tipo === "objetivo"
    ? b.objetivos.map((o) => ({ id: o.id, codigo: o.codigo, nome: o.descricao }))
    : b.indicadores.filter((i) => i.status === "ativo" && !i.parent_id && i.origem === tipo && (tipo !== "okr" || (i.okr_id && okr2.has(i.okr_id)))).map((i) => ({ id: i.id, codigo: i.codigo, nome: i.nome }));
  useEffect(() => {
    carregarBaseVinculos().then((base) => {
      const m: Record<string, number> = {};
      for (const it of itens) {
        const refs = tipo === "objetivo" ? [it.id, ...base.indicadores.filter((i) => i.objetivo_id === it.id && i.origem === "bsc").map((i) => i.id)] : [it.id];
        m[it.id] = iniciativasDoItem(base.inis, base.vinc, refs).length + new Set(base.pv.filter((v) => refs.includes(v.ref_id)).map((v) => v.projeto_id)).size;
      }
      setCont(m);
    });
  }, [tipo, b.loading]);
  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const vis = itens.filter((i) => !busca || `${i.codigo} ${i.nome}`.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Iniciativas e projetos por vínculo</h1>
        <p className="text-sm text-muted-foreground">Tudo o que está vinculado a cada objetivo, KPI de BSC, KR e item de cesta: iniciativas do check-in/checkout e de Metas, e projetos do portfólio. O objetivo também soma o que está vinculado aos KPIs dele.</p></div>
      <div className="flex flex-wrap gap-2">
        <Select value={tipo} onValueChange={(v) => { setTipo(v as Tipo); setAberto(null); }}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{(Object.keys(LBL) as Tipo[]).map((t) => <SelectItem key={t} value={t}>{LBL[t]}</SelectItem>)}</SelectContent></Select>
        <Input className="max-w-xs" placeholder="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="space-y-2">{vis.map((it) => (
        <Card key={it.id} className="p-3">
          <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setAberto(aberto === it.id ? null : it.id)}>
            <span><span className="font-medium">{it.codigo}</span> · {it.nome}</span><Badge variant="outline">{cont[it.id] ?? "…"}</Badge>
          </button>
          {aberto === it.id && <div className="mt-3">{tipo === "objetivo" ? <EmpilhadosVinculo objetivoCodigo={it.codigo} /> : <EmpilhadosVinculo refs={[it.id]} />}</div>}
        </Card>
      ))}</div>
      <details className="rounded border p-3" open={new URLSearchParams(window.location.search).get("aba") === "cadastro"}>
        <summary className="cursor-pointer font-semibold">Cadastro de iniciativas</summary>
        <div className="mt-3"><CadastroIniciativas /></div>
      </details>
    </div>
  );
}
