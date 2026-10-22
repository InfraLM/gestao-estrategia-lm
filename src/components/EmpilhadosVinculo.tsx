import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_INI, statusEfetivo, fmtData } from "@/hooks/useMetasBase";
import { seloVinculo } from "@/lib/portfolioVinculos";
import { iniciativasDoItem } from "@/lib/projetosGestao";

const db = supabase as any;
type Base = { inis: any[]; vinc: any[]; pv: any[]; projetos: any[]; cadeiras: any[]; objetivos: any[]; indicadores: any[]; estrategicos: any[] };
let cache: Promise<Base> | null = null;
window.addEventListener("portfolio-vinculos", () => { cache = null; });
export function carregarBaseVinculos(forcar = false): Promise<Base> {
  if (!cache || forcar) cache = Promise.all([
    db.from("mt_iniciativas").select("id,titulo,status,prazo,responsavel_nome,cadeira_id,indicador_id,okr_id,objetivo_id,checkin_semana,created_at"),
    db.from("mt_acao_vinculos").select("iniciativa_id,tipo,ref_id"),
    db.from("portfolio_vinculos").select("*"),
    db.from("projetos").select("id,codigo,nome,status,cadeira_id"),
    db.from("mt_cadeiras").select("id,nome"),
    db.from("mt_objetivos").select("id,codigo"),
    db.from("mt_indicadores").select("id,objetivo_id,origem,status,okr_id"),
    db.from("mt_okrs").select("id,semestre"),
   ]).then(([a, b, c, d, e, f, g, h]) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
    const sem = `${parts.find(p => p.type === "year")?.value}/${Number(parts.find(p => p.type === "month")?.value) <= 6 ? 1 : 2}`;
    const vig = new Set((h.data ?? []).filter(o => o.semestre === sem).map(o => o.id));
    const inds = (g.data ?? []).filter(i => i.status === "ativo" && (i.origem !== "okr" || vig.has(i.okr_id)));
    const ids = new Set([...inds.map(i => i.id), ...(f.data ?? []).map(o => o.id)]);
    const estrategicos = (c.data ?? []).filter(v => v.status !== "removido" && ids.has(v.ref_id));
    const vin = [...(b.data ?? []).filter(v => v.tipo === "projeto"), ...estrategicos.filter(v => v.fonte_tipo === "iniciativa").map(v => ({ ...v, iniciativa_id: v.fonte_id }))];
    return { inis: (a.data ?? []).map(i => ({ ...i, indicador_id: null, objetivo_id: null, okr_id: null })), vinc: vin, pv: estrategicos.filter(v => v.fonte_tipo === "projeto").map(v => ({ ...v, projeto_id: v.fonte_id })), projetos: d.data ?? [], cadeiras: e.data ?? [], objetivos: f.data ?? [], indicadores: inds, estrategicos };
  });
  return cache;
}

/** Lista empilhada de iniciativas (e projetos) vinculados a um item: projeto, KR, cesta, KPI ou objetivo BSC. */
export default function EmpilhadosVinculo({ refs = [], projetoCodigo, objetivoCodigo, mostrarProjetos = true }: {
  refs?: string[]; projetoCodigo?: string; objetivoCodigo?: string; mostrarProjetos?: boolean;
}) {
  const [b, setB] = useState<Base | null>(null);
  useEffect(() => { const load = () => carregarBaseVinculos(true).then(setB); load(); window.addEventListener("portfolio-vinculos", load); return () => window.removeEventListener("portfolio-vinculos", load); }, []);
  const dados = useMemo(() => {
    if (!b) return null;
    let alvo = [...refs];
    if (objetivoCodigo) {
      const o = b.objetivos.find((x) => x.codigo === objetivoCodigo);
      if (o) alvo = [...alvo, o.id, ...b.indicadores.filter((i) => i.objetivo_id === o.id && i.origem === "bsc").map((i) => i.id)];
    }
    const proj = projetoCodigo ? b.projetos.find((p) => p.codigo === projetoCodigo) : null;
    const inis = iniciativasDoItem(b.inis, b.vinc, alvo, proj?.id);
    const projIds = new Set(b.pv.filter((v) => alvo.includes(v.ref_id)).map((v) => v.projeto_id));
    return { inis, projs: b.projetos.filter((p) => projIds.has(p.id)) };
  }, [b, refs.join(","), projetoCodigo, objetivoCodigo]);
  if (!dados || !b) return <p className="text-xs text-muted-foreground">Carregando vínculos…</p>;
  const cad = (id: string | null) => b.cadeiras.find((c) => c.id === id)?.nome ?? "—";
  const selos = (tipo: string, id: string) => b.estrategicos.filter(v => v.fonte_tipo === tipo && v.fonte_id === id && (!refs.length || refs.includes(v.ref_id))).map(v => <Badge key={v.id} variant={v.status === "validado" ? "default" : "outline"}>{seloVinculo(v)}</Badge>);
  const origem = (i: any) => i.checkin_semana ? `checkout de ${new Date(i.checkin_semana + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}` : "Metas";
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Iniciativas vinculadas ({dados.inis.length})</p>
        {!dados.inis.length ? <p className="text-xs text-muted-foreground">Nenhuma iniciativa vinculada.</p> : (
          <ul className="divide-y rounded border text-sm">{dados.inis.map((i) => {
            const st = statusEfetivo(i);
            return (
              <li key={i.id} className={`p-2 flex flex-wrap items-center gap-2 ${st === "atrasada" ? "bg-destructive/10" : ""}`}>
                <span className="font-medium flex-1 min-w-[200px]">{i.titulo}</span>
                <Badge variant={st === "atrasada" ? "destructive" : "outline"}>{STATUS_INI[st]}</Badge>
                {selos("iniciativa", i.id)}
                <span className="text-xs text-muted-foreground">Prazo {fmtData(i.prazo)} · {i.responsavel_nome || "—"} · {cad(i.cadeira_id)} · {origem(i)}</span>
              </li>
            );
          })}</ul>
        )}
      </div>
      {mostrarProjetos && !projetoCodigo && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Projetos vinculados ({dados.projs.length})</p>
          {!dados.projs.length ? <p className="text-xs text-muted-foreground">Nenhum projeto vinculado.</p> : (
            <ul className="divide-y rounded border text-sm">{dados.projs.map((p) => (
              <li key={p.id} className="p-2 flex flex-wrap items-center gap-2"><Link className="font-medium text-primary underline" to={`/gestao/${p.codigo}`}>{p.codigo}</Link><span className="flex-1">{p.nome}</span>
                {selos("projeto", p.id)}<Badge variant="outline">{p.status}</Badge><span className="text-xs text-muted-foreground">{cad(p.cadeira_id)}</span></li>
            ))}</ul>
          )}
        </div>
      )}
    </div>
  );
}
