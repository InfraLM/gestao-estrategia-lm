import { useMemo, useState } from "react";
import { useProcessosDB, assinarFluxo, type Processo } from "@/hooks/useProcessosDB";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Workflow, Target, ImageOff, Upload, Save, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NIVEIS = ["Gerencial", "Finalístico", "Suporte", "Outros"];
const STATUSES = ["MAPEAMENTO", "VALIDAÇÃO INTERNA", "APROVAÇÃO DIRETORIA", "REVISÃO CONCLUÍDA VIGENTE"];
const MATURIDADES = [
  { v: 1, label: "1 · Inicial" }, { v: 2, label: "2 · Repetível" },
  { v: 3, label: "3 · Definido" }, { v: 4, label: "4 · Gerenciado" }, { v: 5, label: "5 · Otimizado" },
];

const nivelColors: Record<string, string> = {
  "Gerencial": "bg-violet-500/15 text-violet-700 border-violet-500/30",
  "Finalístico": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "Suporte": "bg-sky-500/15 text-sky-700 border-sky-500/30",
  "Outros": "bg-slate-500/15 text-slate-700 border-slate-500/30",
};

export default function CadeiaValor() {
  const { data: processos, loading, reload } = useProcessosDB();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "pmo", "super_admin"]),
    ]).then(([{ data }]) => setIsAdmin(!!(data && data.length)));
  }, [user]);

  const ativos = useMemo(() => processos.filter(p => p.ativo !== false), [processos]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ativos;
    return ativos.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.nome.toLowerCase().includes(q) ||
      (p.area || "").toLowerCase().includes(q)
    );
  }, [ativos, search]);

  const grupos = useMemo(() => {
    const g: Record<string, Processo[]> = { "Gerencial": [], "Finalístico": [], "Suporte": [], "Outros": [] };
    filtered.forEach(p => {
      const k = NIVEIS.includes(p.nivel) ? p.nivel : "Outros";
      g[k].push(p);
    });
    return g;
  }, [filtered]);

  const selected = processos.find(p => p.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, nome ou área…"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {loading ? "Carregando…" : `${filtered.length} processo(s) ativo(s)`}
          </div>
        </CardContent>
      </Card>

      {NIVEIS.map(nv => {
        const items = grupos[nv];
        if (!items || !items.length) return null;
        return (
          <Card key={nv}>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className={nivelColors[nv]}>{nv}</Badge>
                <span className="text-muted-foreground text-sm font-normal">{items.length} processos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map(p => (
                <ProcessoCard key={p.id} processo={p} onOpen={() => setSelectedId(p.id)} />
              ))}
            </CardContent>
          </Card>
        );
      })}

      {!loading && filtered.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-12">
          Nenhum processo encontrado.
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <DetalheCadeia processo={selected} isAdmin={isAdmin} onChanged={reload} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProcessoCard({ processo, onOpen }: { processo: Processo; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all overflow-hidden group"
    >
      <div className="aspect-video bg-surface-muted flex items-center justify-center overflow-hidden">
        {processo.imagemFluxoUrl ? (
          <img src={processo.imagemFluxoUrl} alt={`Fluxo ${processo.nome}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
            <ImageOff className="h-6 w-6" />
            <span>Sem fluxo</span>
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary">
          <span className="text-muted-foreground font-mono text-xs mr-1">{processo.id}</span>
          {processo.nome}
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px]">{processo.area || "—"}</Badge>
          {processo.maturidade && (
            <Badge variant="secondary" className="text-[10px]">Mat. {processo.maturidade}</Badge>
          )}
        </div>
        {processo.kpiNome && (
          <div className="text-xs border-t pt-2 mt-2">
            <div className="text-muted-foreground">{processo.kpiNome}</div>
            <div className="font-medium">
              {processo.kpiValor != null ? `${processo.kpiValor}${processo.kpiUnidade || ""}` : "—"}
              {processo.kpiMeta != null && (
                <span className="text-muted-foreground"> / meta {processo.kpiMeta}{processo.kpiUnidade || ""}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

function DetalheCadeia({
  processo, isAdmin, onChanged,
}: { processo: Processo; isAdmin: boolean; onChanged: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<Processo>(processo);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("processos").update({
      status: edit.status,
      nivel: edit.nivel,
      area: edit.area,
      maturidade: edit.maturidade,
      dono: edit.dono,
      diretor: edit.diretor,
      kpi_nome: edit.kpiNome,
      kpi_valor: edit.kpiValor,
      kpi_meta: edit.kpiMeta,
      kpi_unidade: edit.kpiUnidade,
    }).eq("id", edit.id);
    setBusy(false);
    if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Atualizado com sucesso" });
    onChanged();
  };

  const uploadImg = async (file: File) => {
    setBusy(true);
    const path = `${edit.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("processo-fluxos").upload(path, file, { upsert: true });
    if (upErr) { setBusy(false); toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" }); return; }
    const { data: pub } = supabase.storage.from("processo-fluxos").getPublicUrl(path);
    const { error } = await supabase.from("processos").update({ imagem_fluxo_url: pub.publicUrl }).eq("id", edit.id);
    setBusy(false);
    if (error) { toast({ title: "Erro ao salvar URL", variant: "destructive" }); return; }
    const assinada = await assinarFluxo(pub.publicUrl);
    setEdit(e => ({ ...e, imagemFluxoUrl: assinada }));
    toast({ title: "Imagem do fluxo atualizada" });
    onChanged();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">{processo.id}</span>
          {processo.nome}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="rounded-md border bg-surface-muted overflow-hidden">
          {edit.imagemFluxoUrl ? (
            <img src={edit.imagemFluxoUrl} alt="Fluxo" className="w-full max-h-[400px] object-contain" />
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground gap-1">
              <ImageOff className="h-8 w-8" />
              <span className="text-sm">Imagem do fluxo não cadastrada</span>
            </div>
          )}
          {isAdmin && (
            <div className="border-t bg-card p-2 flex items-center justify-end">
              <Label className="text-xs cursor-pointer inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-muted">
                <Upload className="h-3.5 w-3.5" />
                Enviar imagem do fluxo
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImg(f); }}
                />
              </Label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Área">
            {isAdmin
              ? <Input value={edit.area || ""} onChange={e => setEdit({ ...edit, area: e.target.value })} />
              : <span>{edit.area || "—"}</span>}
          </Field>
          <Field label="Nível">
            {isAdmin ? (
              <Select value={edit.nivel || ""} onValueChange={v => setEdit({ ...edit, nivel: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{NIVEIS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            ) : <span>{edit.nivel || "—"}</span>}
          </Field>
          <Field label="Status">
            {isAdmin ? (
              <Select value={edit.status || ""} onValueChange={v => setEdit({ ...edit, status: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            ) : <span>{edit.status || "—"}</span>}
          </Field>
          <Field label="Maturidade">
            {isAdmin ? (
              <Select value={edit.maturidade ? String(edit.maturidade) : ""} onValueChange={v => setEdit({ ...edit, maturidade: Number(v) })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{MATURIDADES.map(m => <SelectItem key={m.v} value={String(m.v)}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            ) : <span>{edit.maturidade ?? "—"}</span>}
          </Field>
          <Field label="Dono do processo">
            {isAdmin
              ? <Input value={edit.dono || ""} onChange={e => setEdit({ ...edit, dono: e.target.value })} />
              : <span>{edit.dono || "—"}</span>}
          </Field>
          <Field label="Diretor responsável">
            {isAdmin
              ? <Input value={edit.diretor || ""} onChange={e => setEdit({ ...edit, diretor: e.target.value })} />
              : <span>{edit.diretor || "—"}</span>}
          </Field>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Entrega de Valor
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-0">
            <Field label="Métrica / KPI">
              {isAdmin
                ? <Input value={edit.kpiNome || ""} onChange={e => setEdit({ ...edit, kpiNome: e.target.value })} placeholder="Ex.: SLA atendimento" />
                : <span>{edit.kpiNome || "—"}</span>}
            </Field>
            <Field label="Unidade">
              {isAdmin
                ? <Input value={edit.kpiUnidade || ""} onChange={e => setEdit({ ...edit, kpiUnidade: e.target.value })} placeholder="% / h / un" />
                : <span>{edit.kpiUnidade || "—"}</span>}
            </Field>
            <Field label="Meta">
              {isAdmin
                ? <Input type="number" value={edit.kpiMeta ?? ""} onChange={e => setEdit({ ...edit, kpiMeta: e.target.value === "" ? undefined : Number(e.target.value) })} />
                : <span>{edit.kpiMeta ?? "—"}</span>}
            </Field>
            <Field label="Valor atual">
              {isAdmin
                ? <Input type="number" value={edit.kpiValor ?? ""} onChange={e => setEdit({ ...edit, kpiValor: e.target.value === "" ? undefined : Number(e.target.value) })} />
                : <span>{edit.kpiValor ?? "—"}</span>}
            </Field>
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={save} disabled={busy} size="sm" className="gap-1.5">
              <Save className="h-4 w-4" /> Salvar alterações
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div>{children}</div>
    </div>
  );
}
