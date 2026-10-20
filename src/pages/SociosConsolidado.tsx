import { useMemo, useState } from "react";
import { Download, Loader2, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConsolidado, reabrirSocio } from "@/hooks/useSocios";
import { useObjetivosKpis, kpiNome } from "@/hooks/useObjetivosKpis";
import { Regua } from "@/components/socios/Campos";
import { TradeOff } from "./SociosFormulario";
import {
  calcularEixos, compararSocios, posicionamento, statusExibido, pontosProjeto, LINHAS_VERMELHAS, CONSEQUENCIAS, PAPEIS, INVEST_ITENS,
  Diretriz, Projeto, Respostas,
} from "@/lib/sociosTradeoff";

const fmtData = (s?: string | null) => (s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");

function baixarCsv(nome: string, linhas: (string | number)[][]) {
  const csv = linhas.map(l => l.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `${nome}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function SociosConsolidado() {
  const q = useConsolidado();
  const { nomeObjetivo } = useObjetivosKpis();
  const [reabrirAte, setReabrirAte] = useState<Record<string, string>>({});
  const [detalhe, setDetalhe] = useState<string | null>(null);

  const socios = useMemo(() => {
    if (!q.data) return [];
    return q.data.participantes.filter(p => p.respondente).map(p => {
      const row = q.data!.respostas.find(r => r.user_id === p.user_id) ?? null;
      const r: Respostas = row?.respostas ?? {};
      return { p, row, r, eixos: calcularEixos(r), diretrizes: (row?.diretrizes ?? []) as Diretriz[], projetos: (row?.projetos ?? []) as Projeto[] };
    });
  }, [q.data]);

  if (q.isPending) return <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (q.isError) return <div className="py-16 text-center text-muted-foreground">Não foi possível carregar a visão consolidada.</div>;

  const comparacao = compararSocios(socios.map(s => s.r));
  const divergencias = comparacao.filter(c => c.diverge).length;
  const porObjetivo: Record<string, { diretrizes: number; projetos: number }> = {};
  socios.forEach(s => {
    s.diretrizes.forEach(d => d.objetivos?.forEach(o => { (porObjetivo[o] ??= { diretrizes: 0, projetos: 0 }).diretrizes++; }));
    s.projetos.forEach(p => p.objetivos?.forEach(o => { (porObjetivo[o] ??= { diretrizes: 0, projetos: 0 }).projetos++; }));
  });
  const projetos: Record<string, { nome: string; pontos: number; objetivos: Set<string>; kpis: Set<string>; quem: string[] }> = {};
  socios.forEach(s => s.projetos.forEach((p, i) => {
    if (!p.nome?.trim()) return;
    const k = p.nome.trim().toLowerCase();
    const x = (projetos[k] ??= { nome: p.nome.trim(), pontos: 0, objetivos: new Set(), kpis: new Set(), quem: [] });
    x.pontos += pontosProjeto(i); p.objetivos?.forEach(o => x.objetivos.add(o)); p.kpis?.forEach(o => x.kpis.add(kpiNome(o))); if (p.kpi_outro) x.kpis.add(p.kpi_outro);
    x.quem.push(`${s.p.nome_exibicao} (${i + 1}º)`);
  }));
  const ranking = Object.values(projetos).sort((a, b) => b.pontos - a.pontos);

  const reabrir = async (userId: string | null) => {
    if (!userId) return toast.error("Este sócio ainda não aceitou o convite.");
    const ate = reabrirAte[userId];
    if (!ate) return toast.error("Informe até quando reabrir.");
    try { await reabrirSocio(userId, new Date(`${ate}T23:59:59-03:00`).toISOString()); toast.success("Formulário reaberto"); q.refetch(); }
    catch (e: any) { toast.error(e.message); }
  };

  const exportar = () => {
    const head = ["Pergunta", ...socios.map(s => s.p.nome_exibicao), "Diverge"];
    const linhas: (string | number)[][] = [head, ...comparacao.map(c => [c.label, ...c.valores, c.diverge ? "sim" : ""])];
    linhas.push([], ["Eixo", ...socios.map(s => s.p.nome_exibicao)]);
    linhas.push(["Foco no core ↔ Motor 2", ...socios.map(s => s.eixos.core ?? "")], ["Preservar caixa ↔ Acelerar", ...socios.map(s => s.eixos.caixa ?? "")], ["Reinvestir ↔ Retorno", ...socios.map(s => s.eixos.retorno ?? "")]);
    linhas.push([], ["Linha vermelha", ...socios.map(s => s.p.nome_exibicao)]);
    LINHAS_VERMELHAS.forEach(l => linhas.push([l.label, ...socios.map(s => s.r.lv?.[l.id]?.on ? `sim${s.r.lv[l.id].valor ? ` (${s.r.lv[l.id].valor})` : ""}` : "")]));
    linhas.push([], ["Sócio", "Diretriz", "Objetivos", "Por quê"]);
    socios.forEach(s => s.diretrizes.forEach(d => linhas.push([s.p.nome_exibicao, d.texto, d.objetivos.join(", "), d.porque ?? ""])));
    linhas.push([], ["Projeto", "Pontos", "Objetivos", "KPIs", "Quem priorizou"]);
    ranking.forEach(p => linhas.push([p.nome, p.pontos, [...p.objetivos].join(", "), [...p.kpis].join(", "), p.quem.join(", ")]));
    baixarCsv("desejos_socios_2027", linhas);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Conteúdo confidencial — visível apenas para quem tem permissão de consolidado.</p>
        <Button variant="outline" onClick={exportar}><Download className="h-4 w-4 mr-1" />Exportar CSV</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {socios.map(s => {
          const st = statusExibido(s.row);
          const versoes = q.data!.versoes.filter(v => v.user_id === s.p.user_id);
          return (
            <Card key={s.p.id}>
              <CardContent className="pt-5 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="font-semibold">{s.p.nome_exibicao}</span>
                  <Badge variant={st === "Enviado" ? "default" : "outline"} className={cn(st === "Pendente" && "text-muted-foreground")}>{st}</Badge></div>
                <div className="text-xs text-muted-foreground">{s.p.user_id ? `Último envio: ${fmtData(s.row?.enviado_em)}` : "Convite ainda não aceito"}</div>
                {versoes.length > 0 && <div className="text-xs text-muted-foreground">{versoes.length} envio(s){versoes.length > 1 ? ` · reenviado em ${fmtData(versoes[0].enviado_em)}` : ""}</div>}
                {s.row?.reaberto_ate && <div className="text-xs text-muted-foreground">Reaberto até {fmtData(s.row.reaberto_ate)}</div>}
                <div className="flex flex-col gap-1">
                  <Input type="date" className="h-8 text-xs" aria-label={`Reabrir ${s.p.nome_exibicao} até`} value={reabrirAte[s.p.user_id ?? ""] ?? ""} onChange={e => setReabrirAte(x => ({ ...x, [s.p.user_id ?? ""]: e.target.value }))} />
                  <Button size="sm" variant="outline" className="h-8" onClick={() => reabrir(s.p.user_id)}><Unlock className="h-3.5 w-3.5 mr-1" />Reabrir</Button>
                </div>
                <Button size="sm" variant="link" className="h-auto p-0" disabled={!s.row} onClick={() => setDetalhe(detalhe === s.p.id ? null : s.p.id)}>{detalhe === s.p.id ? "Ocultar trade-off" : "Ver trade-off"}</Button>
              </CardContent>
            </Card>
          );
        })}
        <Card><CardContent className="pt-5"><div className="text-xs text-muted-foreground">Divergências</div><div className="text-3xl font-bold text-primary">{divergencias}</div><div className="text-xs text-muted-foreground">perguntas com respostas diferentes</div></CardContent></Card>
      </div>

      {detalhe && (() => { const s = socios.find(x => x.p.id === detalhe)!; return <div><h3 className="font-semibold mb-2">Trade-off · {s.p.nome_exibicao}</h3><TradeOff r={s.r} eixos={s.eixos} nomeObjetivo={nomeObjetivo} /></div>; })()}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Eixos · os sócios na mesma régua</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-3 text-xs">{socios.map(s => <span key={s.p.id}><b>{s.p.nome_exibicao.slice(0, 1)}</b> = {s.p.nome_exibicao} {posicionamento(s.r, s.eixos) ? `· ${posicionamento(s.r, s.eixos)!.titulo}` : ""}</span>)}</div>
          <Regua esquerda="Foco no core" direita="Abrir Motor 2" marcadores={socios.map(s => ({ nome: s.p.nome_exibicao, valor: s.eixos.core }))} />
          <Regua esquerda="Preservar caixa" direita="Acelerar" marcadores={socios.map(s => ({ nome: s.p.nome_exibicao, valor: s.eixos.caixa }))} />
          <Regua esquerda="Reinvestir" direita="Retorno aos sócios" marcadores={socios.map(s => ({ nome: s.p.nome_exibicao, valor: s.eixos.retorno }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Mapa de divergências</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-2 pr-3">Pergunta</th>{socios.map(s => <th key={s.p.id} className="py-2 pr-3">{s.p.nome_exibicao}</th>)}</tr></thead>
            <tbody>
              {comparacao.map(c => (
                <tr key={c.key} className={cn("border-b align-top", c.diverge && "bg-warning/10")}>
                  <td className="py-2 pr-3 font-medium">{c.label}</td>{c.valores.map((v, i) => <td key={i} className="py-2 pr-3">{v}</td>)}
                </tr>
              ))}
              <tr className="border-b align-top"><td className="py-2 pr-3 font-medium">7. Ranking de investimento</td>
                {socios.map(s => <td key={s.p.id} className="py-2 pr-3">{s.r.invest_ok ? s.r.invest!.map((v, i) => `${i + 1}º ${INVEST_ITENS.find(x => x.v === v)?.label}`).join(" · ") : "—"}</td>)}</tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Linhas vermelhas</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-2 pr-3">Linha vermelha</th>{socios.map(s => <th key={s.p.id} className="py-2 pr-3">{s.p.nome_exibicao}</th>)}</tr></thead>
            <tbody>
              {LINHAS_VERMELHAS.map(l => (
                <tr key={l.id} className="border-b"><td className="py-2 pr-3">{l.label}</td>
                  {socios.map(s => { const v = s.r.lv?.[l.id]; return <td key={s.p.id} className="py-2 pr-3">{v?.on ? <Badge variant="destructive">{v.valor ? `${v.valor} ${l.unidade ?? ""}` : "sim"}</Badge> : "—"}</td>; })}</tr>
              ))}
              <tr className="border-b"><td className="py-2 pr-3 font-medium">Se cruzada</td>{socios.map(s => <td key={s.p.id} className="py-2 pr-3">{CONSEQUENCIAS.find(c => c.v === s.r.lv_consequencia)?.label ?? "—"}</td>)}</tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Diretrizes e projetos por objetivo</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {!Object.keys(porObjetivo).length && <p className="text-muted-foreground">Sem diretrizes ainda.</p>}
            {Object.entries(porObjetivo).sort().map(([o, v]) => (
              <div key={o} className="flex justify-between border-b py-1"><span>{o} · {nomeObjetivo(o)}</span><span className="text-muted-foreground">{v.diretrizes} diretriz(es) · {v.projetos} projeto(s)</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Ranking de projetos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!ranking.length && <p className="text-muted-foreground">Nenhum projeto indicado.</p>}
            {ranking.map((p, i) => (
              <div key={p.nome} className="rounded-md border p-2">
                <div className="flex justify-between font-medium"><span>{i + 1}. {p.nome}</span><span className="text-primary">{p.pontos} pts</span></div>
                <div className="text-xs text-muted-foreground">Objetivos: {[...p.objetivos].join(", ") || "—"} · KPIs: {[...p.kpis].join(", ") || "—"}</div>
                <div className="text-xs text-muted-foreground">Priorizado por: {p.quem.join(", ")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Respostas abertas</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {socios.map(s => (
            <div key={s.p.id} className="space-y-2 text-sm">
              <div className="font-semibold">{s.p.nome_exibicao}</div>
              {[
                ["Motor · por quê", s.r.motor_porque], ["Princípio", s.r.principio_obs], ["Portfólio", s.r.portfolio_obs], ["Mídia", s.r.trafego_obs],
                ["Primeira aposta Motor 2", s.r.novo_aposta], ["Liderança do novo", s.r.novo_lider], ["DDL · observações", s.r.ddl_obs], ["Condições de venda", s.r.venda_cond],
                ["Valuation", s.r.sucessao_val], ["Resultados não financeiros", (s.r.resultados ?? []).filter(Boolean).join(" · ")],
                ["Papel", [PAPEIS.find(p => p.v === s.r.papel_tipo)?.label, s.r.papel_escopo].filter(Boolean).join(" — ")],
                ["Linha mais inegociável", s.r.lv_inegociavel], ["Preocupações", s.r.lv_preocupacao],
                ["Parar / reduzir", s.row?.extras?.parar], ["Comentários", s.row?.extras?.comentarios],
              ].filter(([, v]) => v).map(([k, v]) => <div key={k as string}><div className="text-xs text-muted-foreground">{k}</div><div className="whitespace-pre-line">{v}</div></div>)}
              {s.diretrizes.length > 0 && <div><div className="text-xs text-muted-foreground">Diretrizes</div><ul className="list-disc pl-4">{s.diretrizes.map((d, i) => <li key={i}>{d.texto} {d.objetivos.length ? <span className="text-xs text-muted-foreground">({d.objetivos.join(", ")})</span> : null}</li>)}</ul></div>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
