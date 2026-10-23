import { useEffect, useRef, useState } from "react";
import { exclusiveAction } from "@/lib/exclusiveAction";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FAROIS, FAROL_LBL, SITUACOES, projetoEmAberto } from "@/lib/projetosGestao";
import { abrirArquivoStatus } from "@/hooks/useProjetosGestao";
import { compLabel } from "@/components/StatusReportProjeto";

const db = supabase as any;
export type ResumoSR = { total: number; completos: number; pendentes: string[] };

/** Etapa do checkout no último ciclo do mês: status report de cada projeto em aberto da cadeira principal. */
export default function StatusReportCiclo({ cadeira, competencia, ciclo, podeEditar, userId, userNome, onResumo }: {
  cadeira: string; competencia: string; ciclo: string; podeEditar: boolean; userId?: string; userNome: string | null; onResumo: (r: ResumoSR) => void;
}) {
  const [projs, setProjs] = useState<any[]>([]);
  const [regs, setRegs] = useState<Record<string, any>>({});
  const load = async () => {
    const { data: p } = await db.from("projetos").select("id,codigo,nome,status,situacao_confirmada_em").eq("cadeira_id", cadeira).order("codigo");
    const abertos = (p ?? []).filter((x: any) => projetoEmAberto(x.status));
    setProjs(abertos);
    const ids = abertos.map((x: any) => x.codigo);
    const { data: r } = ids.length ? await db.from("mt_status_projetos").select("*").eq("competencia", competencia).in("projeto_codigo", ids) : { data: [] };
    setRegs(Object.fromEntries((r ?? []).map((x: any) => [x.projeto_codigo, x])));
  };
  useEffect(() => { load(); }, [cadeira, competencia]);
  useEffect(() => {
    const pend = projs.filter((p) => { const r = regs[p.codigo]; return !r?.arquivo_path || !r?.farol_escopo || !r?.farol_custo || !r?.farol_cronograma; }).map((p) => p.codigo);
    onResumo({ total: projs.length, completos: projs.length - pend.length, pendentes: pend });
  }, [projs, regs]);

  return (
    <section className="py-5 border-b space-y-3 scroll-mt-40" id="bloco-status-report" tabIndex={-1}>
      <h2 className="font-semibold">5. Status report dos projetos · {compLabel(competencia)}</h2>
      <p className="text-xs text-muted-foreground">Último ciclo do mês: anexe o status report de cada projeto em aberto em que sua cadeira é a principal e aponte o farol. A falta de anexo fica como pendência, mas não impede o envio do ciclo.</p>
      {!projs.length && <p className="text-sm text-muted-foreground">Nenhum projeto em aberto com esta cadeira como principal. Se faltar algum, peça à Governança em "Responsáveis dos projetos".</p>}
      {projs.map((p) => <LinhaProjeto key={p.id + competencia} p={p} atual={regs[p.codigo]} competencia={competencia} ciclo={ciclo} cadeira={cadeira} podeEditar={podeEditar} userId={userId} userNome={userNome} onSalvo={load} />)}
    </section>
  );
}

function LinhaProjeto({ p, atual, competencia, ciclo, cadeira, podeEditar, userId, userNome, onSalvo }: any) {
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({ escopo: "", custo: "", cronograma: "", comentario: "", situacao: "" });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const saveOnce = useRef(exclusiveAction());
  useEffect(() => {
    setF({ escopo: atual?.farol_escopo ?? "", custo: atual?.farol_custo ?? "", cronograma: atual?.farol_cronograma ?? "", comentario: atual?.comentario ?? "", situacao: atual?.confirmacao_status ?? "" });
  }, [atual?.id, atual?.updated_at]);
  const completo = !!atual?.arquivo_path && !!atual?.farol_escopo && !!atual?.farol_custo && !!atual?.farol_cronograma;
  const pedeSituacao = !p.situacao_confirmada_em;

  const salvar = () => saveOnce.current(async () => {
    setSalvando(true);
    try {
    let arquivo_path = atual?.arquivo_path ?? null, arquivo_nome = atual?.arquivo_nome ?? null;
    if (arquivo) {
      const path = `${p.codigo}/${competencia}/${Date.now()}_${arquivo.name.replace(/[^\w.\-]/g, "_")}`;
      const { error } = await supabase.storage.from("status-reports").upload(path, arquivo);
      if (error) { setSalvando(false); return toast.error(error.message); }
      arquivo_path = path; arquivo_nome = arquivo.name;
    }
    const row = {
      projeto_codigo: p.codigo, competencia, cadeira_id: cadeira, farol_escopo: f.escopo || null, farol_custo: f.custo || null,
      farol_cronograma: f.cronograma || null, comentario: f.comentario || null, confirmacao_status: f.situacao || null, semana_ciclo: ciclo,
      arquivo_path, arquivo_nome, enviado_por: userId, enviado_por_nome: userNome,
    };
    const { error } = await db.from("mt_status_projetos").upsert(row, { onConflict: "projeto_codigo,competencia" });
    if (!error && f.situacao && f.situacao !== atual?.confirmacao_status) {
      const { error: e2 } = await db.rpc("projeto_confirmar_situacao", { _projeto: p.id, _situacao: f.situacao });
      if (e2) toast.error(e2.message);
    }
    setSalvando(false);
    if (error) return toast.error(error.message);
    setArquivo(null); toast.success(`Status report de ${p.codigo} salvo.`); onSalvo();
    } catch (e: any) { toast.error(e?.message ?? "Não foi possível salvar o status report"); }
    finally { setSalvando(false); }
  });
  const Sel = ({ k, lbl }: { k: "escopo" | "custo" | "cronograma"; lbl: string }) => (
    <div className="space-y-1"><Label htmlFor={`sr-${p.codigo}-${k}`} className="text-xs">{lbl}</Label>
      <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })} disabled={!podeEditar}>
        <SelectTrigger id={`sr-${p.codigo}-${k}`} className="h-8"><SelectValue placeholder="Farol" /></SelectTrigger>
        <SelectContent>{FAROIS.map((x) => <SelectItem key={x} value={x}>{FAROL_LBL[x]}</SelectItem>)}</SelectContent>
      </Select></div>
  );
  return (
    <div className="border rounded-md p-3 space-y-3" id={`sr-${p.codigo}`}>
      <Button type="button" variant="ghost" aria-expanded={aberto} aria-controls={`sr-${p.codigo}-campos`} className="h-auto flex w-full flex-wrap items-center justify-between gap-2 whitespace-normal text-left" onClick={() => setAberto((a) => !a)}>
        <span><span className="font-medium">{p.codigo} · {p.nome}</span> <span className="text-xs text-muted-foreground">{p.status}</span></span>
        <Badge variant={completo ? "outline" : "destructive"}>{completo ? "Completo" : "Pendente"}</Badge>
      </Button>
      {aberto && <div id={`sr-${p.codigo}-campos`} className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3"><Sel k="escopo" lbl="Escopo" /><Sel k="custo" lbl="Custo" /><Sel k="cronograma" lbl="Cronograma" /></div>
        <div className="space-y-1"><Label className="text-xs">Comentário</Label><Textarea rows={2} maxLength={4000} value={f.comentario} disabled={!podeEditar} onChange={(e) => setF({ ...f, comentario: e.target.value })} /></div>
        {(pedeSituacao || atual?.confirmacao_status) && <div className="space-y-1 max-w-xs"><Label className="text-xs">Confirme a situação do projeto</Label>
          <Select value={f.situacao} onValueChange={(v) => setF({ ...f, situacao: v })} disabled={!podeEditar}>
            <SelectTrigger className="h-8"><SelectValue placeholder="Situação" /></SelectTrigger>
            <SelectContent>{Object.entries(SITUACOES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          {f.situacao === "nao_e_meu" && <p className="text-xs text-muted-foreground">O projeto volta para a fila da Governança.</p>}
        </div>}
        <div className="flex flex-wrap items-center gap-2">
          <Label className="flex items-center gap-1 text-xs"><Paperclip className="h-4 w-4" /> Anexo</Label>
          <Input type="file" className="max-w-xs" disabled={!podeEditar} onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          {atual?.arquivo_path && <Button size="sm" variant="outline" onClick={() => abrirArquivoStatus(atual.arquivo_path)}>{atual.arquivo_nome}</Button>}
          {podeEditar && <Button size="sm" className="ml-auto" disabled={salvando} onClick={salvar}>{salvando ? "Salvando…" : "Salvar"}</Button>}
        </div>
      </div>}
    </div>
  );
}
