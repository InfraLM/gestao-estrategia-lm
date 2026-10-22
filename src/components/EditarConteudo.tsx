import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConteudo } from "@/hooks/useConteudo";
import { useRevisaoContexto } from "@/hooks/useConteudoRevisoes";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const clone = (v: any) => JSON.parse(JSON.stringify(v));
const OCULTOS = ["cor", "badge", "chip", "icon", "cls"];
const rotulo = (k: string) => k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const oculto = (k: string) => k.startsWith("__") || OCULTOS.includes(k);

function vazioDe(exemplo: any): any {
  if (typeof exemplo === "string") return "";
  if (typeof exemplo === "number") return 0;
  if (typeof exemplo === "boolean") return false;
  if (Array.isArray(exemplo)) return [];
  if (exemplo && typeof exemplo === "object") return Object.fromEntries(Object.entries(exemplo).map(([k, v]) => [k, oculto(k) ? v : vazioDe(v)]));
  return "";
}

function Campo({ value, onChange, label }: { value: any; onChange: (v: any) => void; label?: string }) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {label && <div className="text-xs font-semibold text-muted-foreground">{label}</div>}
        {value.map((item, i) => (
          <div key={i} className="flex gap-2 items-start border-l-2 border-border pl-2">
            <div className="flex-1"><Campo value={item} onChange={(v) => { const n = [...value]; n[i] = v; onChange(n); }} /></div>
            <Button type="button" size="icon" variant="ghost" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remover">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...value, value.length ? vazioDe(value[0]) : ""])}>
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
      </div>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div className="space-y-2 rounded-md border p-2">
        {label && <div className="text-xs font-semibold">{label}</div>}
        {Object.entries(value).filter(([k]) => !oculto(k)).map(([k, v]) => (
          <Campo key={k} label={rotulo(k)} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
        ))}
      </div>
    );
  }
  const isNum = typeof value === "number";
  const long = typeof value === "string" && value.length > 70;
  return (
    <div className="space-y-1">
      {label && <div className="text-[11px] text-muted-foreground">{label}</div>}
      {long ? (
        <Textarea value={value} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input type={isNum ? "number" : "text"} value={value ?? ""} onChange={(e) => onChange(isNum ? Number(e.target.value) : e.target.value)} />
      )}
    </div>
  );
}

/** Botão "Editar" que abre um formulário gerado a partir dos dados. Só aparece para Admin/PMO. */
export function EditarConteudo<T>({ chave, padrao, titulo }: { chave: string; padrao: T; titulo: string }) {
  const { data, save, restaurar, canEdit, editado, sugestao } = useConteudo(chave, padrao);
  const ctx = useRevisaoContexto();
  const item = ctx?.revisao?.status === "rascunho" ? ctx.itens.find(i => i.chave === chave) : null;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  if (!canEdit && !item) return null;

  const run = async (fn: () => Promise<void>, msg: string) => {
    setSaving(true);
    try { await fn(); toast.success(msg); setOpen(false); }
    catch (e: any) { toast.error(e.message ?? "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  return (
    <>
      {item && <Link to={`/historico/${ctx?.documento}?documento=${ctx?.documento}&rev=${ctx?.revisao?.numero}&item=${item.id}`}><Badge variant="outline">alterado · {item.status.replace(/_/g, " ")}</Badge></Link>}
      {canEdit && <>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setDraft(clone(data)); setOpen(true); }}>
        <Pencil className="h-3 w-3 mr-1" /> Editar{editado ? " · editado" : ""}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar · {titulo}</DialogTitle></DialogHeader>
          {draft !== null && <Campo value={draft} onChange={setDraft} />}
          <DialogFooter className="gap-2">
            {editado && (
              <Button variant="outline" disabled={saving} onClick={() => run(restaurar, sugestao ? "Restauração enviada para aprovação" : "Conteúdo original restaurado")}>{sugestao ? "Propor restauração" : "Restaurar original"}</Button>
            )}
            <Button disabled={saving} onClick={() => run(() => save(draft), sugestao ? "Sugestão enviada para aprovação; conteúdo vigente preservado" : "Alterações salvas")}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} {sugestao ? "Enviar para aprovação" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>}
    </>
  );
}
