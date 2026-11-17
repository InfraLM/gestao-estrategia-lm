import GrupoMultiSelect from "@/components/socios/GrupoMultiSelect";
import { Label } from "@/components/ui/label";
import { Vinculos, normalizarVinculos, unir, vinculosDoProjeto } from "@/lib/rotinaSemanal";
import type { Indicador, Objetivo, Okr } from "@/hooks/useMetasBase";

export type ProjetoLite = { id: string; codigo: string | null; nome: string; objetivos: string[] | null; krs: string[] | null };

/** Quatro listas de seleção múltipla: BSC (todos), KRs 2026/2 (todos), cesta (só da cadeira) e projetos do portfólio. */
export default function VinculosAcao({ id, valor, onChange, indicadores, okrs, objetivos, projetos, cadeira, disabled }: {
  id: string; valor?: Vinculos; onChange: (v: Vinculos) => void; indicadores: Indicador[]; okrs: Okr[]; objetivos: Objetivo[];
  projetos: ProjetoLite[]; cadeira: string; disabled?: boolean;
}) {
  const v = normalizarVinculos(valor);
  const ativos = indicadores.filter((i) => i.status === "ativo" && !i.parent_id);
  const okr2 = new Set(okrs.filter((o) => o.semestre === "2026/2").map((o) => o.id));
  const op = (l: Indicador[]) => l.map((i) => ({ value: i.id, label: `${i.codigo} · ${i.nome}` }));
  const bsc = op(ativos.filter((i) => i.origem === "bsc"));
  const kr = op(ativos.filter((i) => i.origem === "okr" && i.okr_id && okr2.has(i.okr_id)));
  const cesta = op(ativos.filter((i) => i.origem === "cesta" && i.cadeira_id === cadeira));
  const proj = projetos.map((p) => ({ value: p.id, label: `${p.codigo ? p.codigo + " · " : ""}${p.nome}` }));
  const setProjetos = (ids: string[]) => {
    const novos = ids.filter((x) => !v.projetos.includes(x));
    let { bsc: b, kr: k } = v;
    for (const pid of novos) { const p = projetos.find((x) => x.id === pid); if (p) { const s = vinculosDoProjeto(p, ativos, objetivos); b = unir(b, s.bsc); k = unir(k, s.kr); } }
    onChange({ ...v, projetos: ids, bsc: b, kr: k });
  };
  return (
    <div className="md:col-span-full grid gap-2 sm:grid-cols-2 rounded bg-muted/40 p-2" id={id}>
      <p className="sm:col-span-2 text-xs font-medium text-muted-foreground">Vínculos (opcional; escolher um projeto já sugere os KPIs de BSC dos objetivos dele)</p>
      <div className="space-y-1"><Label className="text-xs">Projetos do portfólio</Label><GrupoMultiSelect grupos={[{ grupo: "Portfólio", opcoes: proj }]} value={v.projetos} onChange={setProjetos} placeholder="Projetos" disabled={disabled} /></div>
      <div className="space-y-1"><Label className="text-xs">KPIs da Árvore (BSC)</Label><GrupoMultiSelect grupos={[{ grupo: "BSC", opcoes: bsc }]} value={v.bsc} onChange={(x) => onChange({ ...v, bsc: x })} placeholder="KPIs de BSC" disabled={disabled} /></div>
      <div className="space-y-1"><Label className="text-xs">OKRs / KRs 2026/2</Label><GrupoMultiSelect grupos={[{ grupo: "KRs", opcoes: kr }]} value={v.kr} onChange={(x) => onChange({ ...v, kr: x })} placeholder="KRs" disabled={disabled} /></div>
      <div className="space-y-1"><Label className="text-xs">Cesta de metas da cadeira</Label><GrupoMultiSelect grupos={[{ grupo: "Cesta", opcoes: cesta }]} value={v.cesta} onChange={(x) => onChange({ ...v, cesta: x })} placeholder="Itens da cesta" disabled={disabled} /></div>
    </div>
  );
}
