import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase } from "@/hooks/useMetasBase";
import { useProjetosGestao, abrirArquivoStatus, type ProjetoG, type StatusRep } from "@/hooks/useProjetosGestao";
import { DECISOES, decisaoPendente, podeDecidir, temDesvio } from "@/lib/projetosGestao";
import { compLabel } from "@/components/StatusReportProjeto";

const db = supabase as any;
const COR: Record<string, string> = { verde: "bg-success", amarelo: "bg-warning", vermelho: "bg-destructive" };
const Luz = ({ f }: { f: string | null | undefined }) => f ? <span className={`inline-block h-3 w-3 rounded-full ${COR[f] ?? "bg-muted"}`} title={f} aria-label={f} /> : <span className="text-xs text-muted-foreground">sem apontamento</span>;

/** Farol de escopo, custo e cronograma de todos os projetos + registro de decisão em desvios. */
export default function PmoFarol() {
  const b = useMetasBase();
  const g = useProjetosGestao();
  const [busca, setBusca] = useState("");
  const [cad, setCad] = useState("todas");
  const [so, setSo] = useState("todos");
  const [dec, setDec] = useState<{ p: ProjetoG; r: StatusRep } | null>(null);
  const decide = podeDecidir({ governanca: b.isGovernanca, ceo: g.ceo });
  const nomeCad = (id: string | null) => b.cadeiras.find((c) => c.id === id)?.nome ?? "Sem responsável";

  if (b.loading || g.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const linhas = g.projetos.map((p) => {
    const r = g.ultimo(p.codigo); const ds = g.decisoes.filter((d) => d.projeto_id === p.id);
    return { p, r, ds, pend: !!r && decisaoPendente(r, ds) };
  }).filter((l) => {
    if (busca && !`${l.p.codigo} ${l.p.nome}`.toLowerCase().includes(busca.toLowerCase())) return false;
    if (cad !== "todas" && (cad === "sem" ? !!l.p.cadeira_id : l.p.cadeira_id !== cad)) return false;
    if (so === "desvio") return temDesvio(l.r);
    if (so === "pendente") return l.pend;
    return true;
  });
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Farol de Status Report</h1>
        <p className="text-sm text-muted-foreground">Último apontamento mensal de cada projeto. Projetos com amarelo ou vermelho pedem registro de decisão da Governança ou do CEO.</p></div>
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Buscar projeto" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <Select value={cad} onValueChange={setCad}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas as cadeiras</SelectItem><SelectItem value="sem">Sem responsável</SelectItem>{b.cadeiras.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
        <Select value={so} onValueChange={setSo}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="desvio">Com desvio</SelectItem><SelectItem value="pendente">Decisão pendente</SelectItem></SelectContent></Select>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs"><tr><th className="p-2">Projeto</th><th className="p-2">Cadeira</th><th className="p-2">Escopo</th><th className="p-2">Custo</th><th className="p-2">Cronograma</th><th className="p-2">Último apontamento</th><th className="p-2">Anexo</th><th className="p-2">Decisão</th></tr></thead>
          <tbody>{linhas.map(({ p, r, ds, pend }) => (
            <tr key={p.id} className="border-t align-top">
              <td className="p-2"><p className="font-medium">{p.codigo}</p><p className="text-xs text-muted-foreground max-w-xs">{p.nome} · {p.status}</p></td>
              <td className="p-2 text-xs">{nomeCad(p.cadeira_id)}</td>
              <td className="p-2"><Luz f={r?.farol_escopo} /></td><td className="p-2"><Luz f={r?.farol_custo} /></td><td className="p-2"><Luz f={r?.farol_cronograma} /></td>
              <td className="p-2 text-xs">{r ? `${compLabel(r.competencia)} · ${r.enviado_por_nome ?? "—"}` : "—"}</td>
              <td className="p-2">{r?.arquivo_path && <Button size="sm" variant="ghost" onClick={async () => { if (!(await abrirArquivoStatus(r.arquivo_path!))) toast.error("Você não tem acesso a este anexo."); }}><Paperclip className="h-4 w-4" /></Button>}</td>
              <td className="p-2 text-xs space-y-1">
                {pend && <Badge variant="destructive">Decisão pendente</Badge>}
                {ds[0] && <p>{ds[0].codigo} · {DECISOES[ds[0].decisao]}</p>}
                {decide && r && temDesvio(r) && <Button size="sm" variant="outline" onClick={() => setDec({ p, r })}>Registrar decisão</Button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
      {dec && <DialogDecisao alvo={dec} onClose={() => setDec(null)} onSalvo={() => { setDec(null); g.reload(); }} />}
    </div>
  );
}

function DialogDecisao({ alvo, onClose, onSalvo }: { alvo: { p: ProjetoG; r: StatusRep }; onClose: () => void; onSalvo: () => void }) {
  const [decisao, setDecisao] = useState("");
  const [desfecho, setDesfecho] = useState("");
  const [just, setJust] = useState("");
  const [proj, setProj] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvar = async () => {
    if (!decisao || !just.trim()) return toast.error("Escolha a decisão e escreva a justificativa.");
    if (decisao === "encerrar" && !desfecho) return toast.error("Informe se o projeto foi Concluído ou Cancelado.");
    setSalvando(true);
    const { data, error } = await db.rpc("projeto_registrar_decisao", { _projeto: alvo.p.id, _competencia: alvo.r.competencia, _decisao: decisao, _desfecho: desfecho || null, _justificativa: just, _projecoes: proj || null });
    setSalvando(false);
    if (error) return toast.error(error.message);
    toast.success(`Decisão ${data} registrada.`); onSalvo();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Decisão · {alvo.p.codigo} · {compLabel(alvo.r.competencia)}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {alvo.r.comentario && <p className="text-sm text-muted-foreground whitespace-pre-wrap">Comentário do diretor: {alvo.r.comentario}</p>}
          <div className="space-y-1"><Label>Decisão</Label><Select value={decisao} onValueChange={setDecisao}><SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
            <SelectContent>{Object.entries(DECISOES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          {decisao === "encerrar" && <div className="space-y-1"><Label>O projeto foi</Label><Select value={desfecho} onValueChange={setDesfecho}><SelectTrigger><SelectValue placeholder="Concluído ou Cancelado" /></SelectTrigger>
            <SelectContent><SelectItem value="Concluído">Concluído</SelectItem><SelectItem value="Cancelado">Cancelado</SelectItem></SelectContent></Select></div>}
          <div className="space-y-1"><Label>Justificativa</Label><Textarea rows={3} value={just} onChange={(e) => setJust(e.target.value)} /></div>
          <div className="space-y-1"><Label>Projeções / ajustes aceitos</Label><Textarea rows={3} value={proj} onChange={(e) => setProj(e.target.value)} /></div>
          <div className="flex justify-end"><Button disabled={salvando} onClick={salvar}>{salvando ? "Registrando…" : "Registrar decisão"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
