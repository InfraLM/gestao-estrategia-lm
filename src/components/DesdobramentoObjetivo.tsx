import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { carregarBaseVinculos } from "@/components/EmpilhadosVinculo";
import { iniciativasDoItem } from "@/lib/projetosGestao";
import { statusEfetivo, STATUS_INI, fmtData } from "@/hooks/useMetasBase";
import { useAvaliacoesBsc } from "@/hooks/useAvaliacoesBsc";
import { estaAtrasado, resumoImpacto, ItemImpacto, ROTULO_ORIGEM, OrigemImpacto } from "@/lib/impactoObjetivo";

const db = supabase as any;
const AVAL: Record<string, { t: string; v: "default" | "destructive" | "outline" | "secondary" }> = {
  on: { t: "On track", v: "default" }, off: { t: "Off track", v: "destructive" }, acomp: { t: "Em acompanhamento", v: "secondary" },
  sem_meta: { t: "Sem meta", v: "outline" }, pendente: { t: "Pendente de apontamento", v: "outline" }, encerrada: { t: "Encerrada", v: "outline" },
};
const GRUPO: Record<string, string> = { bsc: "KPIs de BSC", okr: "OKRs / KRs", cesta: "Cesta de metas" };
const hoje = () => new Date().toISOString().slice(0, 10);
const compAtual = () => new Date().toISOString().slice(0, 7);

type Gov = { acoes: any[]; decisoes: any[]; vinc: any[] };

/** Drill-down do objetivo: KPIs, KRs e cesta com tudo o que está vinculado, de todas as origens. */
export default function DesdobramentoObjetivo({ objetivoCodigo }: { objetivoCodigo: string }) {
  const [base, setBase] = useState<any>(null);
  const [inds, setInds] = useState<any[]>([]);
  const [gov, setGov] = useState<Gov>({ acoes: [], decisoes: [], vinc: [] });
  const [podeVincular, setPode] = useState(false);
  const { porCadeira } = useAvaliacoesBsc(compAtual(), null, ["bsc", "okr", "cesta"]);
  const aval = useMemo(() => { const m: Record<string, string> = {}; for (const c of Object.values(porCadeira)) for (const i of c.itens) m[i.id] = i.aval; return m; }, [porCadeira]);

  const carregarGov = () => Promise.all([
    db.from("gov_acoes").select("id,titulo,status,prazo,responsavel_origem,comite_codigo,reuniao_data"),
    db.from("decisoes_estrategicas").select("id,codigo,titulo,data_decisao,responsavel"),
    db.from("estrategia_vinculos_gov").select("id,origem_tipo,origem_id,tipo,ref_id"),
  ]).then(([a, d, v]: any[]) => setGov({ acoes: a.data ?? [], decisoes: d.data ?? [], vinc: v.data ?? [] }));

  useEffect(() => {
    carregarBaseVinculos().then(setBase);
    db.from("mt_indicadores").select("id,codigo,nome,origem,objetivo_id,cadeira_id").eq("status", "ativo").is("parent_id", null).then(({ data }: any) => setInds(data ?? []));
    carregarGov();
    supabase.auth.getUser().then(({ data }) => data.user && db.rpc("proj_gov_ou_ceo", { _uid: data.user.id }).then(({ data: ok }: any) => setPode(!!ok)));
  }, []);

  const obj = base?.objetivos.find((o: any) => o.codigo === objetivoCodigo);
  const cad = (id: string | null) => base?.cadeiras.find((c: any) => c.id === id)?.nome ?? null;

  const itensDe = (refs: string[]): ItemImpacto[] => {
    if (!base) return [];
    const set = new Set(refs);
    const out: ItemImpacto[] = iniciativasDoItem(base.inis, base.vinc, refs).map((i: any) => ({
      id: i.id, titulo: i.titulo, origem: i.checkin_semana ? "rotina" : "metas", status: STATUS_INI[statusEfetivo(i)], prazo: i.prazo, responsavel: i.responsavel_nome, cadeira: cad(i.cadeira_id),
    }));
    const pids = new Set(base.pv.filter((v: any) => set.has(v.ref_id)).map((v: any) => v.projeto_id));
    for (const p of base.projetos.filter((p: any) => pids.has(p.id))) out.push({ id: p.id, codigo: p.codigo, titulo: p.nome, origem: "projeto", status: p.status, prazo: null, responsavel: null, cadeira: cad(p.cadeira_id), link: `/gestao/${p.codigo}` });
    for (const v of gov.vinc.filter((v) => set.has(v.ref_id))) {
      if (v.origem_tipo === "acao") { const a = gov.acoes.find((x) => x.id === v.origem_id); if (a) out.push({ id: a.id, titulo: a.titulo, origem: "ata", status: a.status, prazo: a.prazo, responsavel: a.responsavel_origem, cadeira: a.comite_codigo, codigo: a.comite_codigo }); }
      else { const d = gov.decisoes.find((x) => x.id === v.origem_id); if (d) out.push({ id: d.id, codigo: d.codigo, titulo: d.titulo, origem: "decisao", status: "Decidido", prazo: d.data_decisao, responsavel: d.responsavel, cadeira: null, link: `/contexto-decisoes?codigo=${d.codigo}` }); }
    }
    return out;
  };

  if (!base) return <p className="text-xs text-muted-foreground">Carregando desdobramento…</p>;
  if (!obj) return <p className="text-xs text-muted-foreground">Objetivo {objetivoCodigo} não está cadastrado na base de metas.</p>;
  const doObj = inds.filter((i) => i.objetivo_id === obj.id);
  const diretos = itensDe([obj.id]);
  const todos = [...diretos, ...doObj.flatMap((i) => itensDe([i.id]))];
  const r = resumoImpacto(todos, hoje());
  const kpis = doObj.filter((i) => i.origem === "bsc");
  const contAval = kpis.reduce((m: Record<string, number>, i) => { const a = aval[i.id] ?? "pendente"; m[a] = (m[a] ?? 0) + 1; return m; }, {});

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Desdobramento do objetivo · todas as origens</CardTitle>
        <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
          <Badge variant="outline">{r.total} itens</Badge>
          {(Object.keys(r.porOrigem) as OrigemImpacto[]).map((o) => <Badge key={o} variant="secondary">{ROTULO_ORIGEM[o]}: {r.porOrigem[o]}</Badge>)}
          <Badge variant={r.atrasados ? "destructive" : "outline"}>{r.atrasados} atrasados</Badge>
          {Object.entries(contAval).map(([a, n]) => <Badge key={a} variant={AVAL[a]?.v ?? "outline"}>KPIs {AVAL[a]?.t ?? a}: {n}</Badge>)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Bloco titulo="Direto no objetivo" itens={diretos} vincular={podeVincular ? { tipo: "objetivo", ref: obj.id } : null} gov={gov} onMudou={carregarGov} />
        {(["bsc", "okr", "cesta"] as const).map((g) => {
          const lista = doObj.filter((i) => i.origem === g);
          if (!lista.length) return null;
          return (
            <div key={g} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{GRUPO[g]} ({lista.length})</p>
              {lista.map((i) => (
                <Bloco key={i.id} titulo={`${i.codigo} · ${i.nome}`} sub={cad(i.cadeira_id)} farol={aval[i.id] ?? "pendente"} itens={itensDe([i.id])}
                  vincular={podeVincular ? { tipo: "indicador", ref: i.id } : null} gov={gov} onMudou={carregarGov} />
              ))}
            </div>
          );
        })}
        <p className="text-[11px] text-muted-foreground">Processos e melhorias do app de processos entram aqui quando a integração com ele estiver ativa.</p>
      </CardContent>
    </Card>
  );
}

function Bloco({ titulo, sub, farol, itens, vincular, gov, onMudou }: {
  titulo: string; sub?: string | null; farol?: string; itens: ItemImpacto[]; vincular: { tipo: string; ref: string } | null; gov: Gov; onMudou: () => void;
}) {
  const [abrir, setAbrir] = useState(false);
  const [busca, setBusca] = useState("");
  const h = hoje();
  const opcoes = useMemo(() => {
    if (!busca.trim()) return [];
    const q = busca.toLowerCase();
    return [
      ...gov.acoes.filter((a) => `${a.titulo} ${a.comite_codigo ?? ""}`.toLowerCase().includes(q)).map((a) => ({ t: "acao", id: a.id, rot: `Ata · ${a.titulo}` })),
      ...gov.decisoes.filter((d) => `${d.codigo} ${d.titulo}`.toLowerCase().includes(q)).map((d) => ({ t: "decisao", id: d.id, rot: `${d.codigo} · ${d.titulo}` })),
    ].slice(0, 8);
  }, [busca, gov]);
  const add = async (o: { t: string; id: string }) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await db.from("estrategia_vinculos_gov").insert({ origem_tipo: o.t, origem_id: o.id, tipo: vincular!.tipo, ref_id: vincular!.ref, criado_por: u.user?.id });
    if (error) return toast.error(error.message.includes("duplicate") ? "Já vinculado." : "Não foi possível vincular.");
    toast.success("Vínculo registrado."); setBusca(""); onMudou();
  };
  const remover = async (i: ItemImpacto) => {
    const v = gov.vinc.find((x) => x.origem_id === i.id && x.ref_id === vincular?.ref);
    if (v && !(await db.from("estrategia_vinculos_gov").delete().eq("id", v.id)).error) onMudou();
  };
  return (
    <div className="rounded border p-2 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium flex-1 min-w-[180px]">{titulo}{sub && <span className="text-xs text-muted-foreground"> · {sub}</span>}</span>
        {farol && <Badge variant={AVAL[farol]?.v ?? "outline"}>{AVAL[farol]?.t ?? farol}</Badge>}
        <Badge variant="outline">{itens.length}</Badge>
        {vincular && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAbrir(!abrir)}>Vincular ata/decisão</Button>}
      </div>
      {abrir && vincular && (
        <div className="space-y-1">
          <Input className="h-8 text-xs" placeholder="Buscar ação de ata ou decisão (título ou código)" value={busca} onChange={(e) => setBusca(e.target.value)} />
          {opcoes.map((o) => <button key={o.t + o.id} type="button" className="block w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-muted" onClick={() => add(o)}>{o.rot}</button>)}
        </div>
      )}
      {itens.length > 0 && (
        <ul className="divide-y text-xs">{itens.map((i) => {
          const atr = estaAtrasado(i, h);
          return (
            <li key={i.origem + i.id} className={`flex flex-wrap items-center gap-2 py-1.5 px-1 ${atr ? "bg-destructive/10" : ""}`}>
              <Badge variant="secondary" className="text-[10px]">{ROTULO_ORIGEM[i.origem]}</Badge>
              {i.link ? <Link to={i.link} className="font-medium text-primary underline flex-1 min-w-[160px]">{i.codigo ? `${i.codigo} · ` : ""}{i.titulo}</Link> : <span className="font-medium flex-1 min-w-[160px]">{i.titulo}</span>}
              {atr ? <Badge variant="destructive">Atrasado</Badge> : i.status && <Badge variant="outline">{i.status}</Badge>}
              <span className="text-muted-foreground">{i.origem === "decisao" ? "Decidido em" : "Prazo"} {i.prazo ? fmtData(i.prazo) : "—"} · {i.responsavel || "—"}{i.cadeira ? ` · ${i.cadeira}` : ""}</span>
              {vincular && (i.origem === "ata" || i.origem === "decisao") && <button type="button" className="text-muted-foreground underline" onClick={() => remover(i)}>remover</button>}
            </li>
          );
        })}</ul>
      )}
    </div>
  );
}
