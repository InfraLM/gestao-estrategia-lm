import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const SITUACOES = [
  { v: "mapeado", l: "Mapeado" }, { v: "sem_cadeira", l: "Sem cadeira" },
  { v: "coletivo", l: "Coletivo" }, { v: "ignorar", l: "Ignorar" },
] as const;
type Mapa = { id: string; nome_origem: string; nome_normalizado: string; situacao: string; observacao: string | null; cadeiras: string[] };
const db = supabase as any;

export default function GovernancaIntegracao() {
  const access = useModuleAccess();
  const isAdmin = access.isSuperAdmin || access.roles.includes("admin");
  const qc = useQueryClient();
  const [sincronizando, setSinc] = useState(false);
  const [filtro, setFiltro] = useState("todos");

  const dados = useQuery({
    enabled: isAdmin,
    queryKey: ["gov-integracao"],
    queryFn: async () => {
      const [log, mapa, rel, cad, acoes] = await Promise.all([
        db.from("gov_sync_log").select("*").order("iniciado_em", { ascending: false }).limit(1).maybeSingle(),
        db.from("gov_responsaveis_map").select("id,nome_origem,nome_normalizado,situacao,observacao").order("nome_origem"),
        db.from("gov_responsaveis_map_cadeiras").select("map_id,mt_cadeira_id"),
        db.from("mt_cadeiras").select("id,nome,diretor_nome").eq("ativo", true).order("nome"),
        db.from("gov_acoes").select("responsavel_normalizado").range(0, 9999),
      ]);
      const err = [log, mapa, rel, cad, acoes].find((r) => r.error);
      if (err) throw err.error;
      const porNome: Record<string, number> = {};
      let semNome = 0;
      for (const a of acoes.data ?? []) a.responsavel_normalizado ? (porNome[a.responsavel_normalizado] = (porNome[a.responsavel_normalizado] ?? 0) + 1) : semNome++;
      const mapas: Mapa[] = (mapa.data ?? []).map((m: any) => ({ ...m, cadeiras: (rel.data ?? []).filter((r: any) => r.map_id === m.id).map((r: any) => r.mt_cadeira_id) }));
      return { log: log.data, mapas, cadeiras: cad.data ?? [], porNome, semNome };
    },
  });

  const contadores = useMemo(() => {
    const c: Record<string, number> = { mapeado: 0, sem_cadeira: 0, coletivo: 0, ignorar: 0 };
    for (const m of dados.data?.mapas ?? []) c[m.situacao] = (c[m.situacao] ?? 0) + (dados.data?.porNome[m.nome_normalizado] ?? 0);
    return c;
  }, [dados.data]);

  if (access.loading) return <Loader2 className="mx-auto mt-12 h-6 w-6 animate-spin text-muted-foreground" />;
  if (!isAdmin) return <div className="py-16 text-center space-y-3"><ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="text-lg font-semibold">Acesso não autorizado</h2><p className="text-muted-foreground">Área restrita a administradores.</p></div>;

  const sincronizar = async () => {
    setSinc(true);
    const { data, error } = await supabase.functions.invoke("governanca-sincronizar", { body: {} });
    setSinc(false);
    if (error || !data?.ok) toast.error("A sincronização falhou. Veja o último resultado abaixo.");
    else toast.success(`Sincronizado: ${data.acoes_inseridas} novas, ${data.acoes_atualizadas} atualizadas, ${data.nomes_novos} nomes novos.`);
    qc.invalidateQueries({ queryKey: ["gov-integracao"] });
  };

  const salvar = async (m: Mapa, mudanca: Partial<Pick<Mapa, "situacao" | "observacao" | "cadeiras">>) => {
    const { data: u } = await supabase.auth.getUser();
    if (mudanca.situacao !== undefined || mudanca.observacao !== undefined) {
      const { error } = await db.from("gov_responsaveis_map").update({ ...("situacao" in mudanca ? { situacao: mudanca.situacao } : {}), ...("observacao" in mudanca ? { observacao: mudanca.observacao } : {}), atualizado_por: u.user?.id }).eq("id", m.id);
      if (error) return toast.error("Não foi possível salvar.");
    }
    if (mudanca.cadeiras) {
      const rem = m.cadeiras.filter((c) => !mudanca.cadeiras!.includes(c));
      const add = mudanca.cadeiras.filter((c) => !m.cadeiras.includes(c));
      if (rem.length) { const { error } = await db.from("gov_responsaveis_map_cadeiras").delete().eq("map_id", m.id).in("mt_cadeira_id", rem); if (error) return toast.error("Não foi possível salvar."); }
      if (add.length) { const { error } = await db.from("gov_responsaveis_map_cadeiras").insert(add.map((c) => ({ map_id: m.id, mt_cadeira_id: c }))); if (error) return toast.error("Não foi possível salvar."); }
      if (add.length && m.situacao === "sem_cadeira") await db.from("gov_responsaveis_map").update({ situacao: "mapeado", atualizado_por: u.user?.id }).eq("id", m.id);
    }
    qc.invalidateQueries({ queryKey: ["gov-integracao"] });
  };

  const log = dados.data?.log;
  const lista = (dados.data?.mapas ?? []).filter((m) => filtro === "todos" || m.situacao === filtro);
  const nomeCad = (id: string) => dados.data?.cadeiras.find((c: any) => c.id === id)?.nome ?? "—";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>Sincronização com a Governança</CardTitle>
          <Button onClick={sincronizar} disabled={sincronizando} className="rounded-full">
            {sincronizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sincronizar agora
          </Button>
        </CardHeader>
        <CardContent className="text-sm">
          {dados.isLoading ? "Carregando…" : !log ? "Nenhuma sincronização feita ainda." : (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>Último: {new Date(log.iniciado_em).toLocaleString("pt-BR")}</span>
              <Badge variant={log.ok ? "default" : "destructive"}>{log.ok ? "OK" : `Falhou${log.erro ? ` (${log.erro})` : ""}`}</Badge>
              {log.ok && <>
                <span>Ações recebidas: {log.acoes_recebidas}</span><span>Novas: {log.acoes_inseridas}</span><span>Atualizadas: {log.acoes_atualizadas}</span>
                <span>Deliberações: {log.deliberacoes_recebidas}</span><span>Excluídas na origem: {log.deliberacoes_excluidas}</span><span>Nomes novos: {log.nomes_novos}</span>
              </>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-5">
        {SITUACOES.map((s) => <Card key={s.v}><CardContent className="p-4"><div className="text-xs text-muted-foreground">Ações · {s.l}</div><div className="text-2xl font-semibold">{contadores[s.v]}</div></CardContent></Card>)}
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Ações sem responsável</div><div className="text-2xl font-semibold">{dados.data?.semNome ?? 0}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>De-para de responsáveis</CardTitle>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todas as situações</SelectItem>{SITUACOES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {dados.isError ? <p className="text-sm text-destructive">Não foi possível carregar.</p> : dados.isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : lista.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum responsável para este filtro.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Nome de origem</TableHead><TableHead className="text-right">Ações</TableHead><TableHead>Situação</TableHead><TableHead>Cadeira(s)</TableHead><TableHead>Observação</TableHead></TableRow></TableHeader>
              <TableBody>
                {lista.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome_origem}</TableCell>
                    <TableCell className="text-right">{dados.data?.porNome[m.nome_normalizado] ?? 0}</TableCell>
                    <TableCell>
                      <Select value={m.situacao} onValueChange={(v) => salvar(m, { situacao: v })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{SITUACOES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="max-w-56 justify-start truncate">{m.cadeiras.length ? m.cadeiras.map(nomeCad).join(", ") : "Escolher…"}</Button></PopoverTrigger>
                        <PopoverContent className="w-64 space-y-2">
                          {(dados.data?.cadeiras ?? []).map((c: any) => (
                            <label key={c.id} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={m.cadeiras.includes(c.id)} onCheckedChange={(ok) => salvar(m, { cadeiras: ok ? [...m.cadeiras, c.id] : m.cadeiras.filter((x) => x !== c.id) })} />
                              {c.nome}{c.diretor_nome ? ` · ${c.diretor_nome}` : ""}
                            </label>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell><Input defaultValue={m.observacao ?? ""} onBlur={(e) => e.target.value !== (m.observacao ?? "") && salvar(m, { observacao: e.target.value || null })} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
