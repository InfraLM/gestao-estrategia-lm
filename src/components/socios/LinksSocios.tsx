import { useState } from "react";
import { Copy, Download, Link2, Loader2, MessageSquare, RefreshCw, Ban } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gerarLinkSocio, revogarLinkSocio, useLinksSocios } from "@/hooks/useSocios";
import { linhasCsvLinks, linkSocio, mensagemSocio, SITUACAO_LABEL, type LinkPainel } from "@/lib/linksSocios";

const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");
const copiar = async (texto: string, ok: string) => {
  try { await navigator.clipboard.writeText(texto); toast.success(ok); }
  catch { window.prompt("Copie o texto abaixo:", texto); }
};

function baixarCsv(linhas: string[][]) {
  const csv = linhas.map(l => l.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `links_socios_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function LinksSocios() {
  const q = useLinksSocios();
  const [validade, setValidade] = useState("2026-11-06");
  const [busy, setBusy] = useState<string | null>(null);
  const expira = () => new Date(`${validade}T23:59:59-03:00`).toISOString();

  const gerar = async (l: LinkPainel) => {
    if (l.link_ativo && !window.confirm(`Gerar novo link para ${l.nome}? O link atual deixa de funcionar.`)) return;
    setBusy(l.participante_id);
    try { const link = await gerarLinkSocio(l.participante_id, expira()); await copiar(mensagemSocio(l.nome, link, expira()), "Novo link gerado e mensagem copiada"); await q.refetch(); }
    catch (e: any) { toast.error(e.message ?? "Erro ao gerar link"); }
    finally { setBusy(null); }
  };
  const gerarTodos = async () => {
    if (!q.data?.length || !window.confirm("Gerar novos links para TODOS os sócios? Os links atuais deixam de funcionar.")) return;
    setBusy("todos");
    try { for (const l of q.data) await gerarLinkSocio(l.participante_id, expira()); const r = await q.refetch(); toast.success("Novos links gerados"); if (r.data) baixarCsv(linhasCsvLinks(r.data)); }
    catch (e: any) { toast.error(e.message ?? "Erro ao gerar links"); await q.refetch(); }
    finally { setBusy(null); }
  };
  const revogar = async (l: LinkPainel) => {
    if (!window.confirm(`Revogar o link de ${l.nome}?`)) return;
    try { await revogarLinkSocio(l.participante_id); toast.success("Link revogado"); await q.refetch(); } catch (e: any) { toast.error(e.message); }
  };

  const semToken = q.data?.filter(l => !l.token).length ?? 0;
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" />Links de acesso dos sócios</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Cada link é pessoal, abre direto o formulário do sócio, sem senha, sempre no endereço publicado do app. Gerar um novo link desativa o anterior.</p>
        <div className="flex flex-wrap items-end gap-2">
          <div><Label htmlFor="validade-links" className="text-xs">Validade dos novos links</Label><Input id="validade-links" type="date" className="h-9 w-44" value={validade} onChange={e => setValidade(e.target.value)} /></div>
          <Button variant="outline" disabled={!!busy || !q.data?.length} onClick={gerarTodos}>{busy === "todos" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}Gerar novos links para todos</Button>
          <Button variant="outline" disabled={!q.data?.some(l => l.token)} onClick={() => q.data && baixarCsv(linhasCsvLinks(q.data))}><Download className="h-4 w-4 mr-1" />Baixar todos os links</Button>
        </div>
        {semToken > 0 && <p className="text-xs text-muted-foreground">{semToken} sócio(s) sem link recuperável (links antigos não podem ser copiados de novo): use "Gerar novo link".</p>}
        {q.isPending ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : q.isError ? <p className="text-sm text-destructive">Não foi possível carregar os links.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-3">Sócio</th><th className="py-2 pr-3">Situação</th><th className="py-2 pr-3">Último acesso</th><th className="py-2 pr-3">Link válido até</th><th className="py-2">Ações</th></tr></thead>
              <tbody>
                {q.data.map(l => (
                  <tr key={l.participante_id} className="border-b align-top">
                    <td className="py-2 pr-3"><div className="font-medium">{l.nome}</div><div className="text-xs text-muted-foreground break-all">{l.email}</div></td>
                    <td className="py-2 pr-3"><Badge variant={l.situacao === "enviado" ? "default" : "outline"}>{SITUACAO_LABEL[l.situacao]}</Badge></td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(l.ultimo_acesso_em)}{l.acessos > 0 && <div className="text-xs text-muted-foreground">{l.acessos} registro(s)</div>}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{l.link_ativo ? fmt(l.expira_em) : <span className="text-muted-foreground">Sem link ativo</span>}</td>
                    <td className="py-2"><div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" className="h-8" disabled={!l.token} title={l.token ? "Copiar link" : "Gere um novo link"} onClick={() => copiar(linkSocio(l.token!), "Link copiado")}><Copy className="h-3.5 w-3.5 mr-1" />Copiar link</Button>
                      <Button size="sm" variant="outline" className="h-8" disabled={!l.token} onClick={() => copiar(mensagemSocio(l.nome, linkSocio(l.token!), l.expira_em), "Mensagem copiada")}><MessageSquare className="h-3.5 w-3.5 mr-1" />Mensagem</Button>
                      <Button size="sm" className="h-8" disabled={!!busy} onClick={() => gerar(l)}>{busy === l.participante_id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}Gerar novo link</Button>
                      {l.link_ativo && <Button size="sm" variant="ghost" className="h-8" onClick={() => revogar(l)}><Ban className="h-3.5 w-3.5 mr-1" />Revogar</Button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
