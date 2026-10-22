import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ConteudoRevisoesHistorico from "@/components/ConteudoRevisoesHistorico";
import { NOMES_CONTEUDO, DocumentoConteudo } from "@/lib/conteudoRevisoes";

type Sub = { id: string; titulo: string; descricao: string | null; arquivo_nome: string; arquivo_path: string; status: string; resumo_ia: string | null; submitted_by_nome: string | null; created_at: string };
type Edit = { chave: string; atualizado_por_nome: string | null; updated_at: string };

const NOMES = NOMES_CONTEUDO;

const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function HistoricoModulo({ titulo, descricao, modulo, prefixos, documento }: { titulo: string; descricao: string; modulo: string; prefixos: string[]; documento?: DocumentoConteudo }) {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [edits, setEdits] = useState<Edit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const db = supabase as any;
      const [s, e] = await Promise.all([
        db.from("base_submissoes").select("id,titulo,descricao,arquivo_nome,arquivo_path,status,resumo_ia,submitted_by_nome,created_at").eq("modulo", modulo).order("created_at", { ascending: false }),
        prefixos.length ? db.from("conteudo_editavel").select("chave,atualizado_por_nome,updated_at").order("updated_at", { ascending: false }) : { data: [] },
      ]);
      setSubs(s.data ?? []);
      setEdits(((e.data ?? []) as Edit[]).filter((x) => prefixos.some((p) => x.chave.startsWith(p))));
      setLoading(false);
    })();
  }, [modulo, prefixos.join(",")]);

  const baixar = async (path: string) => {
    const { data, error } = await supabase.storage.from("base-submissoes").createSignedUrl(path, 120);
    if (error || !data) return toast.error("Não foi possível baixar o arquivo");
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>

      {modulo === "estrategia" && <ConteudoRevisoesHistorico documentoInicial={documento} />}

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Arquivos enviados ({subs.length})</h3>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : subs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda.</p>
        ) : subs.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-3 border-t pt-3 first:border-0 first:pt-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{s.titulo}</span>
                <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{s.arquivo_nome} · {s.submitted_by_nome ?? "—"} · {fmt(s.created_at)}</div>
              {s.resumo_ia && <p className="text-xs mt-1 text-foreground/80">{s.resumo_ia}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => baixar(s.arquivo_path)}><Download className="h-3 w-3 mr-1" /> Baixar</Button>
          </div>
        ))}
      </Card>

      {prefixos.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Pencil className="h-4 w-4 text-primary" /> Edições de conteúdo ({edits.length})</h3>
          {loading ? null : edits.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma edição registrada.</p> : edits.map((e) => (
            <div key={e.chave} className="text-sm flex justify-between gap-3 border-t pt-2 first:border-0 first:pt-0">
              <span>{NOMES[e.chave] ?? e.chave}</span>
              <span className="text-xs text-muted-foreground">{e.atualizado_por_nome ?? "—"} · {fmt(e.updated_at)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
