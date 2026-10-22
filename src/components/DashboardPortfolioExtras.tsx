import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useProjetosGestao } from "@/hooks/useProjetosGestao";
import { usePortfolioVinculos } from "@/hooks/usePortfolioVinculos";

const FARÓIS = ["farol_escopo", "farol_custo", "farol_cronograma"] as const;
const ROTULO: Record<string, string> = { farol_escopo: "Escopo", farol_custo: "Custo", farol_cronograma: "Cronograma" };

/** Blocos com dados já existentes: farol do status report, vínculos por objetivo e atualizações diretas. */
export default function DashboardPortfolioExtras() {
  const g = useProjetosGestao();
  const v = usePortfolioVinculos();
  const [audit, setAudit] = useState<any[]>([]);
  useEffect(() => { (supabase as any).from("pmo_atualizacoes_auditoria").select("*").order("created_at", { ascending: false }).limit(8).then(({ data }: any) => setAudit(data ?? [])); }, []);

  const farol = useMemo(() => FARÓIS.map((k) => {
    const c = { verde: 0, amarelo: 0, vermelho: 0, sem: 0 };
    g.projetos.forEach((p) => { const f = (g.ultimo(p.codigo) as any)?.[k]; if (f === "verde" || f === "amarelo" || f === "vermelho") c[f as "verde"]++; else c.sem++; });
    return { k, ...c };
  }), [g.projetos, g.reports]);

  const porObjetivo = useMemo(() => {
    const ativos = v.vinculos.filter((x) => x.status !== "removido");
    const objDe = (x: any) => x.tipo === "objetivo" ? x.ref_id : v.alvos.find((a) => a.tipo === "indicador" && a.id === x.ref_id)?.objetivo_id;
    return v.alvos.filter((a) => a.tipo === "objetivo").map((o) => {
      const vs = ativos.filter((x) => objDe(x) === o.id);
      const fontes = new Map<string, string>(); vs.forEach((x) => { const cur = fontes.get(x.fonte_id); if (cur !== "validado") fontes.set(x.fonte_id, x.status); });
      const val = [...fontes.values()].filter((s) => s === "validado").length;
      return { o, total: fontes.size, val, prop: fontes.size - val };
    }).filter((r) => r.total > 0).sort((a, b) => a.o.codigo.localeCompare(b.o.codigo));
  }, [v.vinculos, v.alvos]);

  const nomeProj = (id: string) => { const p = g.projetos.find((x) => x.id === id); return p ? `${p.codigo} · ${p.nome}` : "Projeto"; };
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Farol do Status Report</h3><Link to="/pmo/farol" className="text-xs text-primary underline">Abrir farol</Link></div>
        {g.loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : <table className="w-full text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="text-left">Dimensão</th><th>Verde</th><th>Amarelo</th><th>Vermelho</th><th>Sem apont.</th></tr></thead>
          <tbody>{farol.map((f) => <tr key={f.k} className="border-t text-center tabular-nums"><td className="text-left py-1.5">{ROTULO[f.k]}</td><td className="text-success font-semibold">{f.verde}</td><td className="text-warning font-semibold">{f.amarelo}</td><td className="text-destructive font-semibold">{f.vermelho}</td><td className="text-muted-foreground">{f.sem}</td></tr>)}</tbody></table>}
        <p className="text-[11px] text-muted-foreground mt-2">Último apontamento mensal de cada projeto.</p>
      </Card>
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Vínculos por objetivo</h3><Link to="/impacto-estrategico?aba=vinculos" className="text-xs text-primary underline">Ver vínculos</Link></div>
        {v.loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : porObjetivo.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum vínculo registrado.</p> :
          <table className="w-full text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="text-left">Objetivo</th><th>Itens</th><th>Validados</th><th>A validar</th></tr></thead>
            <tbody>{porObjetivo.map((r) => <tr key={r.o.id} className="border-t text-center tabular-nums"><td className="text-left py-1.5" title={r.o.nome}>{r.o.codigo}</td><td>{r.total}</td><td className="text-success">{r.val}</td><td className="text-warning">{r.prop}</td></tr>)}</tbody></table>}
        <p className="text-[11px] text-muted-foreground mt-2">Projetos e iniciativas, contando propostos e validados.</p>
      </Card>
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Atualizações diretas recentes</h3><Link to="/pmo/atualizar-status" className="text-xs text-primary underline">Atualizar status</Link></div>
        {audit.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma atualização direta registrada.</p> :
          <ul className="space-y-2 text-sm">{audit.map((a) => <li key={a.id} className="border-t pt-2"><p className="font-medium truncate">{nomeProj(a.projeto_id)}</p><p className="text-xs text-muted-foreground">{a.campo ?? "status"}: {String(a.valor_anterior ?? "—")} → {String(a.valor_novo ?? "—")} · {a.usuario_nome ?? a.alterado_por_nome ?? "Usuário"} · {new Date(a.created_at).toLocaleDateString("pt-BR")}</p></li>)}</ul>}
      </Card>
    </div>
  );
}
