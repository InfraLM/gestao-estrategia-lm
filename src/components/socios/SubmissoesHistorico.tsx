import { useState } from "react";
import { FileText, Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { kpiNome } from "@/hooks/useObjetivosKpis";
import { CAMPOS_COMPARACAO, valorCampo, normalizar, INVEST_ITENS, LINHAS_VERMELHAS, PAPEIS, Diretriz, Projeto } from "@/lib/sociosTradeoff";

type Versao = { id: string; user_id: string; versao: number; enviado_em: string };
type Doc = { versao: number; enviado_em: string; respostas: any; diretrizes: Diretriz[]; projetos: Projeto[]; extras: any };

const fmt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const ABERTAS: [string, string][] = [
  ["motor_porque", "Motor · por quê"], ["principio_obs", "Princípio · observações"], ["portfolio_obs", "Portfólio · comentário"], ["produto_novo", "Produto novo a testar/lançar"],
  ["trafego_obs", "Mídia · observações"], ["novo_aposta", "Primeira aposta Motor 2"], ["novo_lider", "Liderança do novo"],
  ["ddl_obs", "DDL · observações"], ["venda_cond", "Condições de venda"], ["sucessao_val", "Valuation"],
  ["papel_escopo", "Escopo do papel"], ["lv_inegociavel", "Linha mais inegociável"], ["lv_preocupacao", "Preocupações"],
];
const CONHECIDAS = new Set([...CAMPOS_COMPARACAO.map(c => c.key), ...ABERTAS.map(a => a[0]), "invest", "invest_ok", "lv", "resultados", "produtos", "portfolio_v"]);

const valorTexto = (v: any): string => Array.isArray(v) ? v.filter(Boolean).join(" · ") : typeof v === "object" && v ? JSON.stringify(v) : String(v ?? "");

function Linha({ k, v }: { k: string; v: any }) {
  if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return null;
  return <div className="grid gap-1 border-b py-2 sm:grid-cols-[40%_1fr]"><div className="text-xs text-muted-foreground">{k}</div><div className="whitespace-pre-line text-sm">{valorTexto(v)}</div></div>;
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <section className="space-y-1"><h3 className="pt-3 text-sm font-semibold text-primary">{titulo}</h3>{children}</section>;
}

function Documento({ d, nome }: { d: Doc; nome: string }) {
  const r = normalizar(d.respostas);
  const outros = Object.keys(r).filter(k => !CONHECIDAS.has(k));
  const linhas = LINHAS_VERMELHAS.filter(l => r.lv?.[l.id]?.on);
  return (
    <div id="doc-socio" className="space-y-2">
      <div className="text-sm text-muted-foreground">{nome} · versão {d.versao} · enviado em {fmt(d.enviado_em)}</div>
      <Secao titulo="Escolhas">
        {CAMPOS_COMPARACAO.map(c => <Linha key={c.key} k={c.label} v={valorCampo(c, r)} />)}
      </Secao>
      <Secao titulo="Onde investir R$ 1 mi (ordem)">
        {(r.invest ?? []).length ? <ol className="list-decimal pl-5 text-sm">{r.invest.map((v: string) => <li key={v}>{INVEST_ITENS.find(i => i.v === v)?.label ?? v}</li>)}</ol> : <div className="text-sm text-muted-foreground">—</div>}
      </Secao>
      <Secao titulo="Respostas abertas">
        {ABERTAS.map(([k, l]) => <Linha key={k} k={l} v={r[k]} />)}
        <Linha k="Resultados não financeiros" v={r.resultados} />
        <Linha k="Papel em 2027" v={PAPEIS.find(p => p.v === r.papel_tipo)?.label} />
      </Secao>
      <Secao titulo="Linhas vermelhas">
        {linhas.length ? linhas.map(l => <Linha key={l.id} k={l.label} v={r.lv[l.id].valor || "Sim"} />) : <div className="text-sm text-muted-foreground">Nenhuma marcada</div>}
      </Secao>
      <Secao titulo="Diretrizes">
        {(d.diretrizes ?? []).length ? <ol className="list-decimal space-y-1 pl-5 text-sm">{d.diretrizes.map((x, i) => <li key={i}>{x.texto}{x.objetivos?.length ? <span className="text-muted-foreground"> · {x.objetivos.join(", ")}</span> : null}{x.porque ? <div className="text-xs text-muted-foreground">Por quê: {x.porque}</div> : null}</li>)}</ol> : <div className="text-sm text-muted-foreground">—</div>}
      </Secao>
      <Secao titulo="Projetos (ordem de prioridade)">
        {(d.projetos ?? []).length ? <ol className="list-decimal space-y-1 pl-5 text-sm">{d.projetos.map((p: any, i) => <li key={i}><span className="font-medium">{p.nome}</span>{p.objetivos?.length ? <span className="text-muted-foreground"> · {p.objetivos.join(", ")}</span> : null}{(p.kpis?.length || p.kpi_outro) ? <div className="text-xs text-muted-foreground">KPIs: {[...(p.kpis ?? []).map(kpiNome), p.kpi_outro].filter(Boolean).join(", ")}</div> : null}{Object.entries(p).filter(([k]) => !["nome", "objetivos", "kpis", "kpi_outro"].includes(k)).map(([k, v]) => <div key={k} className="text-xs text-muted-foreground">{k}: {valorTexto(v)}</div>)}</li>)}</ol> : <div className="text-sm text-muted-foreground">—</div>}
      </Secao>
      <Secao titulo="Comentários finais">
        {Object.entries(d.extras ?? {}).map(([k, v]) => <Linha key={k} k={k === "parar" ? "Parar / reduzir" : k === "comentarios" ? "Comentários" : k} v={v} />)}
      </Secao>
      {outros.length > 0 && <Secao titulo="Outros campos">{outros.map(k => <Linha key={k} k={k} v={r[k]} />)}</Secao>}
    </div>
  );
}

export default function SubmissoesHistorico({ versoes, nomes }: { versoes: Versao[]; nomes: Record<string, string> }) {
  const [filtro, setFiltro] = useState("todos");
  const [aberto, setAberto] = useState<{ v: Versao; d?: Doc } | null>(null);
  const lista = versoes.filter(v => filtro === "todos" || v.user_id === filtro);

  const abrir = async (v: Versao) => {
    setAberto({ v });
    const { data, error } = await (supabase as any).from("socios_respostas_versoes").select("*").eq("id", v.id).single();
    if (!error) setAberto({ v, d: data });
  };
  const imprimir = () => {
    const el = document.getElementById("doc-socio"); if (!el) return;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<html><head><title>Desejos dos Sócios 2027 · ${nomes[aberto!.v.user_id] ?? ""} v${aberto!.v.versao}</title><style>body{font-family:sans-serif;padding:24px;font-size:13px}h3{margin-top:18px}</style></head><body><h2>Desejos dos Sócios 2027</h2>${el.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
        <CardTitle className="text-base">Formulários enviados · histórico</CardTitle>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os sócios</SelectItem>
            {Object.entries(nomes).map(([id, n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!lista.length ? <div className="py-6 text-center text-sm text-muted-foreground">Nenhum formulário enviado ainda.</div> : (
          <div className="divide-y">
            {lista.map(v => {
              const ultima = versoes.find(x => x.user_id === v.user_id)?.id === v.id;
              return (
                <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div className="flex items-center gap-2"><span className="font-medium">{nomes[v.user_id] ?? "Sócio"}</span><Badge variant="outline">versão {v.versao}</Badge>{ultima && <Badge>vigente</Badge>}</div>
                  <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{fmt(v.enviado_em)}</span>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => abrir(v)}><FileText className="mr-1 h-3.5 w-3.5" />Abrir</Button></div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <Dialog open={!!aberto} onOpenChange={o => !o && setAberto(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pr-8">
            <DialogTitle>{aberto ? `${nomes[aberto.v.user_id] ?? "Sócio"} · versão ${aberto.v.versao}` : ""}</DialogTitle>
            {aberto?.d && <Button size="sm" variant="outline" onClick={imprimir}><Printer className="mr-1 h-3.5 w-3.5" />Imprimir / PDF</Button>}
          </DialogHeader>
          {aberto?.d ? <Documento d={aberto.d} nome={nomes[aberto.v.user_id] ?? ""} /> : <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
