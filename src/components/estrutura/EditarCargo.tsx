import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NIVEIS } from "@/pages/estruturaOrganizacional";
import { descendentes, validarCargo } from "@/lib/organograma";
import PessoaSelect from './PessoaSelect';

export type CargoEdicao = { id?: string; nome: string; ocupante_nome: string | null; nivel: string | null; parent_id: string | null; ordem: number | null; ativo: boolean | null; observacoes?: string | null; mt_cadeira_id?: string | null; pessoa_id?: string | null };
export default function EditarCargo({ cargo, cargos, salvar, fechar, campos = [], cadeirasSemanal }: {
  cargo: CargoEdicao; cargos: CargoEdicao[]; salvar: (valor: CargoEdicao & Record<string, unknown>) => Promise<void>;
  fechar: () => void; campos?: { campo: string; titulo: string; valor: string | null }[];
  /** Só para a Governança: liga o cargo à cadeira do formulário semanal (líderes diretos = cargos abaixo). */
  cadeirasSemanal?: { id: string; nome: string }[];
}) {
  const [valor, setValor] = useState<CargoEdicao & Record<string, unknown>>({ ...cargo, ...Object.fromEntries(campos.map(c => [c.campo, c.valor])) });
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [busca, setBusca] = useState("");
  const parentes = cargos.flatMap(c => c.id ? [{ id: c.id, parent_id: c.parent_id }] : []);
  const bloqueados = cargo.id ? descendentes(cargo.id, parentes) : new Set<string>();
  const alterar = (campo: string, v: unknown) => setValor(atual => ({ ...atual, [campo]: v }));
  const submit = async () => {
    const e = validarCargo(valor, parentes);
    if (e) { setErro(e); return; }
    setBusy(true); setErro("");
    try { await salvar({ ...valor, nome: valor.nome.trim() }); fechar(); }
    catch { setErro("Não foi possível salvar. Verifique sua permissão e tente novamente."); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={aberto => { if (!aberto && !busy) fechar(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{cargo.id ? "Editar cargo" : "Novo cargo"}</DialogTitle></DialogHeader>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); void submit(); }}>
      <div className="space-y-1.5"><Label htmlFor="cargo-nome">Cargo / cadeira</Label><Input id="cargo-nome" required value={valor.nome} onChange={e => alterar("nome", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Ocupante</Label><PessoaSelect label="Ocupante" value={valor.pessoa_id} texto={valor.ocupante_nome} onChange={p => alterar('pessoa_id', p?.id ?? null)} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Nível</Label><Select value={valor.nivel ?? "outro"} onValueChange={v => alterar("nivel", v)}><SelectTrigger aria-label="Nível do cargo"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(NIVEIS).map(([v, t]) => <SelectItem key={v} value={v}>{v === "outro" ? "Operacional / outro" : t}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="cargo-ordem">Ordem</Label><Input id="cargo-ordem" type="number" step="1" value={valor.ordem ?? 0} onChange={e => alterar("ordem", Number(e.target.value))} /></div></div>
      <div className="space-y-1.5"><Label>Cadeira superior</Label><Select value={valor.parent_id ?? "raiz"} onValueChange={v => alterar("parent_id", v === "raiz" ? null : v)}><SelectTrigger aria-label="Cadeira superior"><SelectValue /></SelectTrigger><SelectContent><div className="p-2"><Input placeholder="Buscar cargo ou ocupante" aria-label="Buscar cadeira superior" value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={e => e.stopPropagation()} /></div><SelectItem value="raiz">Sem superior</SelectItem>{cargos.filter(c => c.id && !bloqueados.has(c.id) && `${c.nome} ${c.ocupante_nome}`.toLocaleLowerCase().includes(busca.toLocaleLowerCase())).map(c => <SelectItem key={c.id} value={c.id ?? "raiz"}>{c.nome} {c.ocupante_nome ? `· ${c.ocupante_nome}` : ""}</SelectItem>)}</SelectContent></Select></div>
      {cadeirasSemanal && <div className="space-y-1.5"><Label>Diretor da cadeira (formulário semanal)</Label><Select value={(valor.mt_cadeira_id as string | null) ?? "nenhuma"} onValueChange={v => alterar("mt_cadeira_id", v === "nenhuma" ? null : v)}><SelectTrigger aria-label="Cadeira do formulário semanal"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhuma">Não é diretor de cadeira</SelectItem>{cadeirasSemanal.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Os cargos logo abaixo deste aparecem como "Responsável pela entrega" no formulário semanal.</p></div>}
      <Label className="flex items-center gap-2"><Checkbox checked={valor.ativo === true} onCheckedChange={v => alterar("ativo", v === true)} />Ativo</Label>
      {campos.length ? campos.map(c => <div className="space-y-1.5" key={c.campo}><Label htmlFor={`edit-${c.campo}`}>{c.titulo}</Label><Textarea id={`edit-${c.campo}`} value={String(valor[c.campo] ?? "")} onChange={e => alterar(c.campo, e.target.value || null)} rows={3} /></div>) : <div className="space-y-1.5"><Label htmlFor="cargo-notas">Observações</Label><Textarea id="cargo-notas" value={valor.observacoes ?? ""} onChange={e => alterar("observacoes", e.target.value)} /></div>}
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={fechar}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar</Button></div>
    </form>
  </DialogContent></Dialog>;
}