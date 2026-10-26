import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const db = supabase as any;
const fmt = (d: string | null) => (d ? new Date(`${String(d).slice(0, 10)}T12:00`).toLocaleDateString("pt-BR") : "sem data");
const TIPO_LBL: Record<string, string> = { ata: "Ata", prioridade: "Prioridade", impedimento: "Impedimento" };

export function useAtasAguardando(ativo: boolean) {
  return useQuery({ queryKey: ["rotina-atas-aguardando"], enabled: ativo, queryFn: async () => {
    const { data, error } = await db.rpc("rotina_atas_aguardando"); if (error) throw error; return (data ?? []) as any[];
  } });
}

/** Governança: fila de ações de atas sem dono e pendências com mais de 3 meses (não empilham, não contam na completude). */
export default function GestaoPendenciasRotina({ cadeiras }: { cadeiras: { id: string; nome: string; ativo?: boolean; diretor_nome?: string | null }[] }) {
  const qc = useQueryClient();
  const fila = useAtasAguardando(true);
  const antigas = useQuery({ queryKey: ["rotina-pendencias-antigas"], queryFn: async () => {
    const { data, error } = await db.rpc("rotina_pendencias_antigas"); if (error) throw error; return (data ?? []) as any[];
  } });
  const [sel, setSel] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const ativas = cadeiras.filter((c) => c.ativo !== false);

  const gerir = async (tipo: string, ref: string, acao: "atribuir" | "reativar" | "baixar") => {
    const k = `${tipo}:${ref}`;
    if (acao === "atribuir" && !sel[k]) return toast.error("Escolha a cadeira.");
    if (acao === "baixar" && !motivo[k]?.trim()) return toast.error("Informe o motivo da baixa.");
    setBusy(k);
    const { error } = await db.rpc("rotina_pendencia_gerir", { _tipo: tipo, _ref: ref, _acao: acao, _cadeira: sel[k] ?? null, _motivo: motivo[k] ?? "" });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(acao === "atribuir" ? "Atribuída: empilha no próximo ciclo da cadeira." : acao === "reativar" ? "Reativada: volta a empilhar." : "Baixa registrada.");
    qc.invalidateQueries({ queryKey: ["rotina-atas-aguardando"] }); qc.invalidateQueries({ queryKey: ["rotina-pendencias-antigas"] });
  };
  const Acoes = ({ tipo, refId, atribuir }: { tipo: string; refId: string; atribuir: boolean }) => {
    const k = `${tipo}:${refId}`;
    return <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_auto_minmax(0,1fr)_auto]">
      {atribuir ? <Select value={sel[k] ?? ""} onValueChange={(v) => setSel({ ...sel, [k]: v })}>
        <SelectTrigger aria-label="Cadeira responsável"><SelectValue placeholder="Cadeira responsável" /></SelectTrigger>
        <SelectContent>{ativas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}{c.diretor_nome ? ` · ${c.diretor_nome}` : ""}</SelectItem>)}</SelectContent>
      </Select> : <span />}
      {atribuir ? <Button size="sm" disabled={busy === k} onClick={() => gerir(tipo, refId, "atribuir")}>Atribuir</Button> : <span />}
      <Input aria-label="Motivo da baixa" placeholder="Motivo da baixa" maxLength={300} value={motivo[k] ?? ""} onChange={(e) => setMotivo({ ...motivo, [k]: e.target.value })} />
      <Button size="sm" variant="outline" disabled={busy === k} onClick={() => gerir(tipo, refId, "baixar")}>Baixar</Button>
    </div>;
  };

  return <div className="space-y-4">
    <section className="space-y-2 rounded border p-4" aria-label="Aguardando avaliação">
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Ações de atas aguardando avaliação</h2><Badge variant="secondary">{fila.data?.length ?? 0}</Badge></div>
      <p className="text-xs text-muted-foreground">Ações sem responsável, ou cujo responsável não está ligado a uma cadeira, não vão para nenhum formulário. Ao atribuir, passam a empilhar no próximo ciclo da cadeira escolhida.</p>
      {fila.isPending && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {fila.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar a fila.</p>}
      {fila.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ação aguardando avaliação.</p>}
      {fila.data?.map((a) => <div key={a.id} className="space-y-2 border-b pb-3">
        <p className="font-medium break-words">{a.titulo}</p>
        <p className="text-xs text-muted-foreground break-words">Ata · {a.reuniao_titulo ?? "Reunião"} ({fmt(a.reuniao_data)}) · Comitê {a.comite_codigo ?? "—"} · Prazo {fmt(a.prazo)} · {a.motivo === "sem_responsavel" ? "Sem responsável" : `Responsável "${a.responsavel_origem || a.responsavel_email}" sem cadeira`}</p>
        <Acoes tipo="ata" refId={a.id} atribuir />
      </div>)}
    </section>
    <section className="space-y-2 rounded border p-4" aria-label="Pendências antigas">
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Pendências antigas (&gt; 3 meses)</h2><Badge variant="secondary">{antigas.data?.length ?? 0}</Badge></div>
      <p className="text-xs text-muted-foreground">Atas, prioridades e impedimentos ainda abertos com origem há mais de 3 meses. Não empilham nem contam na completude. Reativar faz voltar a empilhar por mais 3 meses.</p>
      {antigas.isPending && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {antigas.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar as pendências antigas.</p>}
      {antigas.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pendência antiga.</p>}
      {antigas.data?.map((p) => <div key={`${p.tipo}:${p.ref}`} className="space-y-2 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{TIPO_LBL[p.tipo]}</Badge><span className="font-medium break-words">{p.titulo}</span></div>
        <p className="text-xs text-muted-foreground">{p.detalhe} · origem {fmt(p.origem)} · {(p.cadeiras ?? []).map((c: any) => c.nome).join(", ") || "sem cadeira"}</p>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={busy === `${p.tipo}:${p.ref}`} onClick={() => gerir(p.tipo, p.ref, "reativar")}>Reativar</Button></div>
        <Acoes tipo={p.tipo} refId={p.ref} atribuir={p.tipo !== "prioridade"} />
      </div>)}
    </section>
  </div>;
}
