import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, FileText, Loader2, Clock, AlertCircle } from "lucide-react";

type Submissao = {
  id: string; titulo: string; descricao: string | null; arquivo_nome: string;
  status: string; resumo_ia: string | null; erro: string | null;
  submitted_by_nome: string | null; created_at: string;
};
type Proposta = {
  id: string; submissao_id: string; acao: string; iniciativa_ref: string | null;
  payload: any; justificativa: string | null; confianca: number | null;
  status: string; created_at: string;
};

export default function PropostasIABacklog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPmoOrAdmin, setIsPmoOrAdmin] = useState(false);
  const [subs, setSubs] = useState<Submissao[]>([]);
  const [props, setProps] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("backlog_submissoes").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("backlog_propostas_ia").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setSubs((s as any) ?? []);
    setProps((p as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("backlog-ia")
      .on("postgres_changes", { event: "*", schema: "public", table: "backlog_submissoes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "backlog_propostas_ia" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!user) { setIsPmoOrAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id)
      .then(({ data }) => {
        const roles = (data ?? []).map((r: any) => r.role);
        setIsPmoOrAdmin(roles.includes("admin") || roles.includes("pmo"));
      });
  }, [user]);

  const decidir = async (p: Proposta, status: "aprovada" | "rejeitada") => {
    const { error } = await supabase.from("backlog_propostas_ia").update({
      status, revisado_por: user?.id ?? null, revisado_em: new Date().toISOString(),
    }).eq("id", p.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: status === "aprovada" ? "Proposta aprovada" : "Proposta rejeitada" });
    load();
  };

  const pendentes = props.filter(p => p.status === "pendente");
  const subById = (id: string) => subs.find(s => s.id === id);

  const statusBadge = (st: string) => {
    const tone: Record<string, string> = {
      pendente: "bg-warning/10 text-warning border-warning/30",
      processando: "bg-info/10 text-info border-info/30",
      processado: "bg-success/10 text-success border-success/30",
      erro: "bg-destructive/10 text-destructive border-destructive/30",
      aprovada: "bg-success/10 text-success border-success/30",
      rejeitada: "bg-destructive/10 text-destructive border-destructive/30",
    };
    return <Badge variant="outline" className={`text-[10px] ${tone[st] ?? ""}`}>{st}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Propostas IA · Pendentes de Aprovação
            <Badge variant="outline" className="ml-2">{pendentes.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Carregando…</div>}
          {!loading && pendentes.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Nenhuma proposta pendente. Submeta um documento para gerar sugestões.</p>
          )}
          {pendentes.map(p => {
            const s = subById(p.submissao_id);
            const pl = p.payload || {};
            return (
              <div key={p.id} className="rounded-md border border-purple-500/40 bg-purple-500/5 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge className="bg-primary text-primary-foreground capitalize">{p.acao}</Badge>
                  {pl.tipo && <Badge variant="outline" className="text-[10px]">{pl.tipo}</Badge>}
                  {pl.wave && <Badge variant="outline" className="text-[10px]">{pl.wave}</Badge>}
                  {pl.prioridade && <Badge variant="outline" className="text-[10px]">{pl.prioridade}</Badge>}
                  {p.confianca != null && (
                    <span className="text-[11px] text-muted-foreground">Confiança {(p.confianca * 100).toFixed(0)}%</span>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {s?.titulo ?? "Submissão"}
                  </span>
                </div>
                <div className="text-sm font-semibold">{pl.titulo ?? "(sem título)"}</div>
                {pl.acao_descricao && <div className="text-xs"><strong>Ação:</strong> {pl.acao_descricao}</div>}
                {pl.resultado_esperado && <div className="text-xs"><strong>Resultado esperado:</strong> {pl.resultado_esperado}</div>}
                {pl.responsavel && <div className="text-xs"><strong>Responsável:</strong> {pl.responsavel}</div>}
                {Array.isArray(pl.vinculos) && pl.vinculos.length > 0 && (
                  <div className="text-xs"><strong>Vínculos sugeridos:</strong> {pl.vinculos.join(", ")}</div>
                )}
                {p.iniciativa_ref && <div className="text-[11px] text-muted-foreground">Iniciativa-alvo: <span className="font-mono">{p.iniciativa_ref}</span></div>}
                {p.justificativa && <p className="text-xs text-muted-foreground italic">{p.justificativa}</p>}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {!isPmoOrAdmin && <span className="text-[11px] text-muted-foreground mr-auto">Apenas PMO/Admin pode aprovar</span>}
                  <Button size="sm" variant="outline" onClick={() => decidir(p, "rejeitada")} disabled={!isPmoOrAdmin} className="gap-1">
                    <X className="h-3.5 w-3.5" /> Rejeitar
                  </Button>
                  <Button size="sm" onClick={() => decidir(p, "aprovada")} disabled={!isPmoOrAdmin} className="gap-1">
                    <Check className="h-3.5 w-3.5" /> Aprovar
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {subs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Submissões recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {subs.slice(0, 8).map(s => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-xs border-b border-border/50 pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{s.titulo}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {s.arquivo_nome} · {s.submitted_by_nome ?? "—"} · {new Date(s.created_at).toLocaleString("pt-BR")}
                  </div>
                  {s.erro && <div className="text-[11px] text-destructive flex items-center gap-1 mt-0.5"><AlertCircle className="h-3 w-3" />{s.erro}</div>}
                  {s.resumo_ia && <div className="text-[11px] text-muted-foreground mt-0.5">{s.resumo_ia}</div>}
                </div>
                <div className="flex items-center gap-1">
                  {s.status === "processando" && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  {s.status === "pendente" && <Clock className="h-3 w-3 text-muted-foreground" />}
                  {statusBadge(s.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
