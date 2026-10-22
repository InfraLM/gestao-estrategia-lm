import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Paperclip, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { projetos } from "@/data/mockData";

const db = supabase as any;
const MES: Record<string, string> = { "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez" };
export const compLabel = (c: string) => `${MES[c.slice(5)]}/${c.slice(0, 4)}`;

export type StatusProjeto = {
  id?: string; projeto_codigo: string; competencia: string; cadeira_id: string | null;
  saude: string | null; pct_cronograma: number | null; entregas: string | null; custo_realizado: number | null;
  equipe: string | null; recursos: string | null; avancos: string | null; desvios: string | null;
  arquivo_path: string | null; arquivo_nome: string | null; enviado_por_nome: string | null; updated_at?: string;
};

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Projetos do portfólio cujo diretor corresponde ao diretor da cadeira (primeiro nome). */
export const projetosDoDiretor = (diretorNome: string | null | undefined) => {
  if (!diretorNome) return [];
  const p = norm(diretorNome.split(" ")[0]);
  return projetos.filter((x) => x.diretor && norm(x.diretor).split(/\s+/).includes(p));
};

export function useStatusProjeto(projetoCodigo: string) {
  const [lista, setLista] = useState<StatusProjeto[]>([]);
  useEffect(() => {
    db.from("mt_status_projetos").select("*").eq("projeto_codigo", projetoCodigo).order("competencia", { ascending: false })
      .then(({ data }: any) => setLista(data ?? []));
  }, [projetoCodigo]);
  return lista;
}

async function baixar(path: string) {
  const { data, error } = await supabase.storage.from("status-reports").createSignedUrl(path, 120);
  if (error) return toast.error(error.message);
  window.open(data.signedUrl, "_blank");
}

const brl = (v: number | null) => (v == null ? "—" : `R$ ${v.toLocaleString("pt-BR")}`);

/** Bloco do formulário mensal: um status report por projeto da cadeira. */
export function StatusReportsDaCadeira({ cadeiraId, diretorNome, comp, podeEditar, userId, userNome }: {
  cadeiraId: string; diretorNome: string | null; comp: string; podeEditar: boolean; userId?: string; userNome: string | null;
}) {
  const [extras, setExtras] = useState<string[]>([]);
  const base = useMemo(() => projetosDoDiretor(diretorNome), [diretorNome]);
  const lista = [...base, ...projetos.filter((p) => extras.includes(p.id) && !base.some((b) => b.id === p.id))];
  const [regs, setRegs] = useState<Record<string, StatusProjeto>>({});

  useEffect(() => {
    const ids = lista.map((p) => p.id);
    if (!ids.length) { setRegs({}); return; }
    db.from("mt_status_projetos").select("*").eq("competencia", comp).in("projeto_codigo", ids)
      .then(({ data }: any) => setRegs(Object.fromEntries((data ?? []).map((r: StatusProjeto) => [r.projeto_codigo, r]))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp, cadeiraId, lista.length]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Anexe o status report mensal de cada projeto sob sua responsabilidade. As informações atualizam a aba “Status Report” do projeto em Gestão de Projetos (saúde, cronograma, entregas, custos, equipe e recursos).
      </p>
      {lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhum projeto do portfólio associado a este diretor.</p>}
      {lista.map((p) => (
        <FormProjeto key={p.id + comp} projeto={p} comp={comp} cadeiraId={cadeiraId} podeEditar={podeEditar}
          atual={regs[p.id]} userId={userId} userNome={userNome}
          onSalvo={(r) => setRegs((x) => ({ ...x, [p.id]: r }))} />
      ))}
      {podeEditar && (
        <div className="flex items-center gap-2">
          <Label className="text-xs">Incluir outro projeto:</Label>
          <Select value="" onValueChange={(v) => setExtras((x) => [...x, v])}>
            <SelectTrigger className="w-[360px] h-8"><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
            <SelectContent>{projetos.filter((p) => !lista.some((l) => l.id === p.id)).map((p) => <SelectItem key={p.id} value={p.id}>{p.id} · {p.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function FormProjeto({ projeto, comp, cadeiraId, podeEditar, atual, userId, userNome, onSalvo }: any) {
  const vazio = { saude: "", pct: "", entregas: "", custo: "", equipe: "", recursos: "", avancos: "", desvios: "" };
  const [f, setF] = useState(vazio);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (!atual) { setF(vazio); return; }
    setF({ saude: atual.saude ?? "", pct: atual.pct_cronograma?.toString() ?? "", entregas: atual.entregas ?? "", custo: atual.custo_realizado?.toString() ?? "",
      equipe: atual.equipe ?? "", recursos: atual.recursos ?? "", avancos: atual.avancos ?? "", desvios: atual.desvios ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual?.id, atual?.updated_at]);
  const set = (k: keyof typeof vazio) => (e: any) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\./g, "").replace(",", ".")));

  const salvar = async () => {
    if (!atual?.arquivo_path && !arquivo) return toast.error(`${projeto.id}: anexe o arquivo do status report.`);
    setSalvando(true);
    let arquivo_path = atual?.arquivo_path ?? null, arquivo_nome = atual?.arquivo_nome ?? null;
    if (arquivo) {
      const path = `${projeto.id}/${comp}/${Date.now()}_${arquivo.name.replace(/[^\w.\-]/g, "_")}`;
      const { error } = await supabase.storage.from("status-reports").upload(path, arquivo);
      if (error) { setSalvando(false); return toast.error(error.message); }
      arquivo_path = path; arquivo_nome = arquivo.name;
    }
    const row = {
      projeto_codigo: projeto.id, competencia: comp, cadeira_id: cadeiraId, saude: f.saude || null,
      pct_cronograma: num(f.pct), entregas: f.entregas || null, custo_realizado: num(f.custo), equipe: f.equipe || null,
      recursos: f.recursos || null, avancos: f.avancos || null, desvios: f.desvios || null,
      arquivo_path, arquivo_nome, enviado_por: userId, enviado_por_nome: userNome,
    };
    const { data, error } = await db.from("mt_status_projetos").upsert(row, { onConflict: "projeto_codigo,competencia" }).select().single();
    setSalvando(false);
    if (error) return toast.error(error.message);
    setArquivo(null); onSalvo(data); toast.success(`Status report de ${projeto.id} salvo.`);
  };

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="text-left" onClick={() => setAberto((a) => !a)}>
          <p className="font-medium">{projeto.id} · {projeto.nome}</p>
          <p className="text-xs text-muted-foreground">{projeto.diretor} · {projeto.status}</p>
        </button>
        <div className="flex items-center gap-2">
          <Badge variant={atual ? "outline" : "destructive"}>{atual ? `Anexado · ${atual.arquivo_nome}` : "Pendente"}</Badge>
          <Button size="sm" variant="ghost" onClick={() => setAberto((a) => !a)}>{aberto ? "Fechar" : "Preencher"}</Button>
        </div>
      </div>
      {aberto && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-2">
            <div className="space-y-1"><Label>Saúde</Label>
              <Select value={f.saude} onValueChange={set("saude")} disabled={!podeEditar}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{["On-Track", "Alerta", "Off-Track"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Cronograma executado (%)</Label><Input disabled={!podeEditar} value={f.pct} onChange={set("pct")} placeholder="ex.: 45" /></div>
            <div className="space-y-1"><Label>Custo realizado acumulado (R$)</Label><Input disabled={!podeEditar} value={f.custo} onChange={set("custo")} placeholder="ex.: 120000" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="space-y-1"><Label>Entregas do mês</Label><Textarea rows={2} disabled={!podeEditar} value={f.entregas} onChange={set("entregas")} /></div>
            <div className="space-y-1"><Label>Avanços</Label><Textarea rows={2} disabled={!podeEditar} value={f.avancos} onChange={set("avancos")} /></div>
            <div className="space-y-1"><Label>Equipe envolvida</Label><Textarea rows={2} disabled={!podeEditar} value={f.equipe} onChange={set("equipe")} /></div>
            <div className="space-y-1"><Label>Recursos (necessários/alocados)</Label><Textarea rows={2} disabled={!podeEditar} value={f.recursos} onChange={set("recursos")} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Desvios, causa raiz e plano de ação</Label><Textarea rows={2} disabled={!podeEditar} value={f.desvios} onChange={set("desvios")} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="flex items-center gap-1"><Paperclip className="h-4 w-4" /> Arquivo do status report</Label>
            <Input type="file" className="max-w-xs" disabled={!podeEditar} onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
            {atual?.arquivo_path && <Button size="sm" variant="outline" onClick={() => baixar(atual.arquivo_path)}><Download className="h-4 w-4 mr-1" /> {atual.arquivo_nome}</Button>}
            {podeEditar && <Button size="sm" className="ml-auto" disabled={salvando} onClick={salvar}><Save className="h-4 w-4 mr-1" /> Salvar status report</Button>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Aba "Status Report" dentro de Gestão de Projetos. */
export function StatusReportTab({ lista }: { lista: StatusProjeto[] }) {
  if (!lista.length) return (
    <Card className="p-8 text-center text-sm text-muted-foreground">
      Nenhum status report enviado ainda. O diretor anexa o status report mensalmente no formulário de Lançamento mensal (Metas 2S26).
    </Card>
  );
  const ult = lista[0];
  return (
    <div className="space-y-5">
      <Card className="p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Último status report · {compLabel(ult.competencia)}</h3>
          <span className="text-xs text-muted-foreground">Enviado por {ult.enviado_por_nome ?? "—"}</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Info t="Saúde" v={ult.saude} />
          <Info t="Cronograma executado" v={ult.pct_cronograma != null ? `${ult.pct_cronograma}%` : null} />
          <Info t="Custo realizado" v={brl(ult.custo_realizado)} />
          <Info t="Entregas" v={ult.entregas} />
          <Info t="Equipe envolvida" v={ult.equipe} />
          <Info t="Recursos" v={ult.recursos} />
          <Info t="Avanços" v={ult.avancos} />
          <Info t="Desvios e plano de ação" v={ult.desvios} span />
        </div>
      </Card>
      <Card className="p-5 shadow-card">
        <h3 className="font-semibold mb-3">Histórico mensal</h3>
        <div className="divide-y">
          {lista.map((r) => (
            <div key={r.id} className="py-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium w-20">{compLabel(r.competencia)}</span>
              <Badge variant="outline">{r.saude ?? "—"}</Badge>
              {(r as any).farol_escopo || (r as any).farol_custo || (r as any).farol_cronograma
                ? <span className="text-muted-foreground">Escopo {(r as any).farol_escopo ?? "—"} · Custo {(r as any).farol_custo ?? "—"} · Cronograma {(r as any).farol_cronograma ?? "—"}{(r as any).comentario ? ` · ${(r as any).comentario}` : ""}</span>
                : <span className="text-muted-foreground">Cronograma {r.pct_cronograma ?? "—"}% · Custo {brl(r.custo_realizado)}</span>}
              {r.arquivo_path && <Button size="sm" variant="ghost" className="ml-auto" onClick={() => baixar(r.arquivo_path!)}><Download className="h-4 w-4 mr-1" /> {r.arquivo_nome}</Button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const Info = ({ t, v, span }: { t: string; v: string | null; span?: boolean }) => (
  <div className={span ? "sm:col-span-2" : ""}>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t}</p>
    <p className="whitespace-pre-wrap">{v || "—"}</p>
  </div>
);
