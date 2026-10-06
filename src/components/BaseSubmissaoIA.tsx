import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Upload, Loader2, Check, X, FileText, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { ModuloBase, PropostaBase } from "@/hooks/useBaseOverrides";

type Sub = { id: string; titulo: string; arquivo_nome: string; status: string; resumo_ia: string | null; erro: string | null; submitted_by_nome: string | null; created_at: string };

const PMO_NUM = new Set(["budget", "realizado"]);
const PMO_CAMPOS = new Set(["status", "saude", "avancos", "causa_raiz", "plano_acao", "diretor", "gerente", "budget", "realizado", "termino", "wave"]);

interface Props { modulo: ModuloBase; titulo: string; contexto: () => unknown; podeRevisar?: boolean }

export default function BaseSubmissaoIA({ modulo, titulo, contexto }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [expand, setExpand] = useState(true);
  const [t, setT] = useState(""); const [d, setD] = useState(""); const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [props, setProps] = useState<PropostaBase[]>([]);
  const [podeRevisar, setPodeRevisar] = useState(false);

  const load = useCallback(async () => {
    const db = supabase as any;
    const [{ data: s }, { data: p }] = await Promise.all([
      db.from("base_submissoes").select("id,titulo,arquivo_nome,status,resumo_ia,erro,submitted_by_nome,created_at").eq("modulo", modulo).order("created_at", { ascending: false }).limit(10),
      db.from("base_propostas_ia").select("*").eq("modulo", modulo).eq("status", "pendente").order("created_at", { ascending: false }).limit(100),
    ]);
    setSubs(s ?? []); setProps(p ?? []);
  }, [modulo]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`base-ia-${modulo}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "base_submissoes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "base_propostas_ia" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, modulo]);

  useEffect(() => {
    if (!user) { setPodeRevisar(false); return; }
    (supabase as any).rpc("can_review_modulo", { _user_id: user.id, _modulo: modulo }).then(({ data }: any) => setPodeRevisar(!!data));
  }, [user, modulo]);

  const enviar = async () => {
    if (!user) return toast({ title: "Faça login para enviar", variant: "destructive" });
    if (!file || !t.trim()) return toast({ title: "Informe título e arquivo", variant: "destructive" });
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${modulo}/${Date.now()}.${ext}`;
      const { error: ue } = await supabase.storage.from("base-submissoes").upload(path, file, { contentType: file.type || undefined });
      if (ue) throw ue;
      const { data: sub, error: ie } = await (supabase as any).from("base_submissoes").insert({
        modulo, titulo: t.trim(), descricao: d.trim() || null, arquivo_nome: file.name, arquivo_path: path,
        arquivo_tipo: file.type || null, arquivo_tamanho: file.size, contexto: JSON.stringify(contexto()).slice(0, 60000),
        submitted_by: user.id, submitted_by_nome: user.email ?? null,
      }).select("id").single();
      if (ie) throw ie;
      const { error: fe } = await supabase.functions.invoke("base-analisar", { body: { submissao_id: sub.id } });
      if (fe) throw fe;
      toast({ title: "Arquivo enviado", description: "A IA está analisando. As propostas aparecem aqui para aprovação." });
      setOpen(false); setT(""); setD(""); setFile(null); load();
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const revisar = async (p: PropostaBase, aprovar: boolean) => {
    try {
      if (aprovar && modulo === "pmo" && p.entidade === "projeto") {
        if (!PMO_CAMPOS.has(p.campo)) throw new Error(`Campo "${p.campo}" não pode ser atualizado automaticamente.`);
        const valor = PMO_NUM.has(p.campo) ? Number(String(p.valor_novo).replace(/[^\d.,-]/g, "").replace(",", ".")) : p.valor_novo;
        const { error, count } = await (supabase as any).from("projetos").update({ [p.campo]: valor }, { count: "exact" }).eq("codigo", p.ref);
        if (error) throw error;
        if (!count) throw new Error(`Projeto ${p.ref} não encontrado ou sem permissão.`);
      }
      const { error } = await (supabase as any).from("base_propostas_ia").update({
        status: aprovar ? "aprovado" : "rejeitado", revisado_por: user?.id, revisado_em: new Date().toISOString(),
      }).eq("id", p.id);
      if (error) throw error;
      toast({ title: aprovar ? "Atualização aplicada à base" : "Proposta rejeitada" });
      load();
    } catch (e: any) {
      toast({ title: "Não foi possível revisar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button type="button" onClick={() => setExpand(!expand)} className="flex items-center gap-2 text-left">
            {expand ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {titulo}</CardTitle>
            {props.length > 0 && <Badge className="bg-primary text-primary-foreground">{props.length} pendentes</Badge>}
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Upload className="h-4 w-4" /> Submeter arquivo</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {titulo}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={t} onChange={(e) => setT(e.target.value)} placeholder="Ex.: Revisão de metas setembro" /></div>
                <div><Label>O que deve ser atualizado? (opcional)</Label><Textarea rows={3} value={d} onChange={(e) => setD(e.target.value)} /></div>
                <div>
                  <Label>Arquivo</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  <p className="text-[11px] text-muted-foreground mt-1">Aceita planilhas, PDF, Word, PowerPoint, imagens, áudio, texto e CSV. A IA compara com a base atual e propõe mudanças campo a campo para aprovação.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
                <Button onClick={enviar} disabled={busy} className="gap-1.5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Enviar e analisar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      {expand && (
        <CardContent className="space-y-3">
          {subs.length === 0 && <p className="text-xs text-muted-foreground">Nenhum arquivo submetido ainda.</p>}
          {subs.map((s) => {
            const ps = props.filter((p) => p.submissao_id === s.id);
            return (
              <div key={s.id} className="rounded border border-border p-2 space-y-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{s.titulo}</span>
                  <span className="text-muted-foreground">· {s.arquivo_nome} · {new Date(s.created_at).toLocaleString("pt-BR")}</span>
                  <Badge variant={s.status === "erro" ? "destructive" : "outline"} className="text-[10px] ml-auto">
                    {s.status === "processando" || s.status === "pendente" ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />analisando</> : s.status}
                  </Badge>
                </div>
                {s.erro && <p className="text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {s.erro}</p>}
                {s.resumo_ia && <p className="text-muted-foreground italic">{s.resumo_ia}</p>}
                {ps.map((p) => (
                  <div key={p.id} className="rounded bg-muted/40 p-2 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{p.entidade}</Badge>
                      <span className="font-mono text-[11px]">{p.ref}</span>
                      <span className="text-muted-foreground">· {p.campo}</span>
                      {p.confianca != null && <span className="text-muted-foreground ml-auto">confiança {Math.round(p.confianca * 100)}%</span>}
                    </div>
                    <div><span className="text-muted-foreground line-through">{p.valor_atual || "(vazio)"}</span> → <strong>{p.valor_novo}</strong></div>
                    {p.justificativa && <p className="text-[11px] text-muted-foreground">{p.justificativa}</p>}
                    {podeRevisar ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 gap-1" onClick={() => revisar(p, true)}><Check className="h-3.5 w-3.5" /> Aprovar</Button>
                        <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => revisar(p, false)}><X className="h-3.5 w-3.5" /> Rejeitar</Button>
                      </div>
                    ) : <p className="text-[11px] text-muted-foreground">Aguardando aprovação de um administrador do módulo.</p>}
                  </div>
                ))}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
