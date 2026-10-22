import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase, MESES_2S26, NOME_MES } from "@/hooks/useMetasBase";
import { TIPOS_REVISAO, LIMITE_MENSAL, temSemFonte, diffLinhas } from "@/lib/planejamentoFontes";

const db = supabase as any;
const STATUS: Record<string, string> = { rascunho: "Rascunho", aprovado: "Vigente", substituido: "Substituída" };

/** Relatório mensal e diagnóstico por ferramenta: a IA gera rascunho com fontes; a Governança edita e aprova. */
export default function PlanejamentoRevisoes() {
  const b = useMetasBase();
  const [tipo, setTipo] = useState("relatorio");
  const [comp, setComp] = useState(MESES_2S26[2]);
  const [revs, setRevs] = useState<any[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [gerando, setGerando] = useState(false);
  const load = () => db.from("planejamento_revisoes").select("*").eq("tipo", tipo).order("numero", { ascending: false }).then(({ data }: any) => setRevs(data ?? []));
  useEffect(() => { load(); setSel(null); }, [tipo]);
  const atual = revs.find((r) => r.id === sel) ?? null;
  const vigente = revs.find((r) => r.status === "aprovado");
  useEffect(() => { setTexto(atual?.conteudo ?? ""); }, [atual?.id]);
  const noMes = revs.filter((r) => r.gerado_em >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).length;
  const diff = useMemo(() => (atual && vigente && atual.id !== vigente.id ? diffLinhas(vigente.conteudo, texto) : []), [atual, vigente, texto]);

  const gerar = async () => {
    setGerando(true);
    const { data, error } = await supabase.functions.invoke("planejamento-gerar", { body: { tipo, competencia: tipo === "relatorio" ? comp : null } });
    setGerando(false);
    const msg = (data as any)?.error ?? (error ? await (error as any).context?.json?.().then((j: any) => j?.error).catch(() => null) ?? "Não foi possível gerar." : null);
    if (msg) { toast.error(msg); return; }
    toast.success("Rascunho gerado."); await load(); setSel((data as any).id);
  };
  const salvar = async () => { const { error } = await db.from("planejamento_revisoes").update({ conteudo: texto, updated_at: new Date().toISOString() }).eq("id", atual.id); if (error) toast.error(error.message); else { toast.success("Rascunho salvo."); load(); } };
  const aprovar = async () => { await salvar(); const { error } = await db.rpc("planejamento_aprovar", { _id: atual.id }); if (error) toast.error(error.message); else { toast.success("Revisão aprovada e vigente."); load(); } };

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const gov = b.isGovernanca;
  const editavel = gov && atual?.status === "rascunho";

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="w-72 space-y-1"><Label>Documento</Label>
          <Select value={tipo} onValueChange={setTipo}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TIPOS_REVISAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        {tipo === "relatorio" && <div className="w-32 space-y-1"><Label>Competência</Label>
          <Select value={comp} onValueChange={setComp}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MESES_2S26.map((m) => <SelectItem key={m} value={m}>{NOME_MES[m.slice(5)]}/26</SelectItem>)}</SelectContent></Select></div>}
        {gov && <Button onClick={gerar} disabled={gerando || noMes >= LIMITE_MENSAL}><Sparkles className="h-4 w-4 mr-1" />{gerando ? "Gerando…" : "Gerar rascunho com IA"}</Button>}
        {gov && <span className="text-xs text-muted-foreground">{noMes}/{LIMITE_MENSAL} gerações neste mês · gere após o fechamento do mês</span>}
      </Card>
      <p className="text-xs text-muted-foreground">A IA usa só decisões (D, SR, GOV), lançamentos, situações de checkouts enviados e status reports. Respostas dos Sócios e contatos ficam de fora. Cada afirmação cita a fonte; o que não confere aparece como [sem fonte] e impede a aprovação.</p>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="p-2 space-y-1 h-fit">
          {!revs.length && <p className="text-sm text-muted-foreground p-2">Nenhuma revisão ainda.</p>}
          {revs.filter((r) => gov || r.status !== "rascunho").map((r) => (
            <button key={r.id} onClick={() => setSel(r.id)} className={`w-full text-left rounded p-2 text-sm ${sel === r.id ? "bg-muted" : "hover:bg-muted/50"}`}>
              <div className="flex items-center justify-between gap-2"><span className="font-medium">Rev. {r.numero}</span><Badge variant={r.status === "aprovado" ? "default" : "outline"}>{STATUS[r.status]}</Badge></div>
              <div className="text-xs text-muted-foreground">{new Date(r.gerado_em).toLocaleDateString("pt-BR")}{r.aprovado_por_nome ? ` · aprovada por ${r.aprovado_por_nome}` : ""}</div>
            </button>
          ))}
        </Card>
        {atual ? (
          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Rev. {atual.numero} · {TIPOS_REVISAO[tipo]}</h2><Badge variant="outline">{STATUS[atual.status]}</Badge>
              {atual.aprovado_em && <span className="text-xs text-muted-foreground">aprovada em {new Date(atual.aprovado_em).toLocaleString("pt-BR")} por {atual.aprovado_por_nome}</span>}</div>
            {editavel ? <Textarea className="min-h-[420px] font-mono text-xs" value={texto} onChange={(e) => setTexto(e.target.value)} />
              : <pre className="whitespace-pre-wrap text-sm font-sans">{atual.conteudo}</pre>}
            {editavel && temSemFonte(texto) && <p className="text-sm text-destructive">Há afirmações [sem fonte]. Edite ou remova antes de aprovar.</p>}
            {editavel && <div className="flex gap-2"><Button variant="outline" onClick={salvar}>Salvar rascunho</Button><Button onClick={aprovar} disabled={temSemFonte(texto)}><CheckCircle2 className="h-4 w-4 mr-1" />Aprovar e tornar vigente</Button></div>}
            {diff.length > 0 && (
              <details className="rounded border p-2"><summary className="cursor-pointer text-sm font-medium">Comparar com a vigente (Rev. {vigente.numero})</summary>
                <div className="mt-2 space-y-0.5 text-xs font-mono">{diff.filter((d) => d.tipo !== "igual").map((d, i) => <p key={i} className={d.tipo === "nova" ? "text-success" : "text-destructive line-through"}>{d.tipo === "nova" ? "+ " : "− "}{d.linha}</p>)}</div>
              </details>
            )}
          </Card>
        ) : <Card className="p-4 text-sm text-muted-foreground">Escolha uma revisão na lista{gov ? " ou gere um rascunho" : ""}.</Card>}
      </div>
    </div>
  );
}
