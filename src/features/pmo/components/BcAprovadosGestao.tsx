import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Projeto } from "@/data/mockData";

const db = supabase as any;
type BC = { id: string; titulo: string; proponente: string | null; area: string | null; problema: string | null; hipotese: string | null; ai_resumo: string | null; created_at: string; projeto_codigo: string | null };

/** Business cases aprovados (parecer "Saudável") disponíveis para virar projeto em Gestão de Projetos. */
export function BcAprovadosGestao({ projetos, onCriado }: { projetos: Projeto[]; onCriado: () => void }) {
  const [bcs, setBcs] = useState<BC[]>([]);
  const [sel, setSel] = useState<BC | null>(null);
  const [f, setF] = useState({ nome: "", diretor: "", wave: "W1", inicio: "2026/2", termino: "2026/2", budget: "", descricao: "" });
  const [salvando, setSalvando] = useState(false);
  const nav = useNavigate();

  const carregar = () => db.from("bc_scorecard_submissoes").select("id,titulo,proponente,area,problema,hipotese,ai_resumo,created_at,projeto_codigo")
    .eq("ai_gate", "saudavel").order("created_at", { ascending: false }).then(({ data }: any) => setBcs(data ?? []));
  useEffect(() => { carregar(); }, []);

  const abrir = (b: BC) => {
    setSel(b);
    setF({ nome: b.titulo, diretor: b.proponente ?? "", wave: "W1", inicio: "2026/2", termino: "2026/2", budget: "", descricao: [b.problema, b.hipotese].filter(Boolean).join("\n\n") || b.ai_resumo || "" });
  };

  const proximoCodigo = () => {
    const n = Math.max(0, ...projetos.map((p) => Number(p.id.replace(/\D/g, "")) || 0));
    return `P${String(n + 1).padStart(3, "0")}`;
  };

  const criar = async () => {
    if (!sel || !f.nome.trim()) return;
    setSalvando(true);
    const codigo = proximoCodigo();
    const { error } = await db.from("projetos").insert({
      codigo, nome: f.nome.trim(), descricao: f.descricao || null, diretor: f.diretor || null,
      wave: f.wave, classificacao: "Institucional", status: "Em Andamento", status_bc: "Validado", saude: "On-Track",
      budget: Number(f.budget.replace(/\./g, "").replace(",", ".")) || 0, realizado: 0, ice: 0,
      inicio: f.inicio, termino: f.termino, objetivos: [], krs: [],
    });
    if (error) { setSalvando(false); return toast.error(`Não foi possível criar o projeto: ${error.message}. Somente administradores e PMO podem incluir projetos.`); }
    await db.from("bc_scorecard_submissoes").update({ projeto_codigo: codigo }).eq("id", sel.id);
    setSalvando(false); setSel(null); toast.success(`Projeto ${codigo} incluído em Gestão de Projetos.`);
    carregar(); onCriado(); nav(`/gestao/${codigo}`);
  };

  const disponiveis = bcs.filter((b) => !b.projeto_codigo);
  return (
    <Card className="p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Business cases aprovados · {disponiveis.length} disponíveis</h3>
          <p className="text-xs text-muted-foreground">Só business cases com parecer “Saudável — Seguir para PMO” podem virar projeto. <Link to="/pmo/business-case" className="underline text-primary">Ver Business Case</Link></p>
        </div>
      </div>
      {bcs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum business case aprovado ainda.</p>}
      <div className="space-y-2">
        {bcs.map((b) => (
          <div key={b.id} className="border rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium">{b.titulo}</p>
              <p className="text-xs text-muted-foreground">{b.proponente ?? "—"}{b.area ? ` · ${b.area}` : ""} · {new Date(b.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            {b.projeto_codigo
              ? <Link to={`/gestao/${b.projeto_codigo}`}><Badge variant="outline">Projeto {b.projeto_codigo}</Badge></Link>
              : <Button size="sm" className="gap-1.5" onClick={() => abrir(b)}><Plus className="h-3.5 w-3.5" /> Incluir projeto</Button>}
          </div>
        ))}
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo projeto a partir do business case</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome do projeto</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Diretor</Label><Input value={f.diretor} onChange={(e) => setF({ ...f, diretor: e.target.value })} /></div>
              <div className="space-y-1"><Label>Onda</Label>
                <Select value={f.wave} onValueChange={(v) => setF({ ...f, wave: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["W1", "W2", "W3"].map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Início</Label><Input value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></div>
              <div className="space-y-1"><Label>Término</Label><Input value={f.termino} onChange={(e) => setF({ ...f, termino: e.target.value })} /></div>
              <div className="space-y-1 col-span-2"><Label>Orçamento (R$)</Label><Input value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} placeholder="ex.: 250000" /></div>
            </div>
            <div className="space-y-1"><Label>Descrição</Label><Textarea rows={4} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSel(null)}>Cancelar</Button>
            <Button disabled={salvando || !f.nome.trim()} onClick={criar}>Criar projeto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
