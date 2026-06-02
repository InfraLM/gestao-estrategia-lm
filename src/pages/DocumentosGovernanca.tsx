import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, Search, Plus } from "lucide-react";
import dados from "@/data/documentosGovernanca.json";

type Doc = {
  status: string;
  taskId: string;
  taskName: string;
  documento: string | null;
  assignee: string | null;
  revisao: number | null;
  dueDate: string | null;
  dataRevisao: string | null;
  dataAprovacao: string | null;
  aprovador: string | null;
};

const STATUS = ["CONCLUÍDO", "CAMOZZI", "EM ANDAMENTO", "A INICIAR", "BACKLOG"] as const;

const statusStyle: Record<string, string> = {
  "CONCLUÍDO": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "CAMOZZI": "bg-violet-500/15 text-violet-700 border-violet-500/30",
  "EM ANDAMENTO": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "A INICIAR": "bg-sky-500/15 text-sky-700 border-sky-500/30",
  "BACKLOG": "bg-muted text-muted-foreground border-border",
};

export default function DocumentosGovernanca() {
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (dados as Doc[]).filter(d => {
      if (statusFilter !== "todos" && d.status !== statusFilter) return false;
      if (!q) return true;
      return [d.taskName, d.assignee, d.aprovador, d.taskId].some(v => (v || "").toLowerCase().includes(q));
    });
  }, [busca, statusFilter]);

  const totais = useMemo(() => {
    const m: Record<string, number> = {};
    (dados as Doc[]).forEach(d => { m[d.status] = (m[d.status] || 0) + 1; });
    return m;
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS.map(s => (
          <Card key={s} className="border-l-4" style={{ borderLeftColor: "hsl(var(--primary))" }}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s}</div>
              <div className="text-2xl font-semibold mt-1">{totais[s] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle>Documentos GRC · Governança e Jurídico</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Controle de regimentos, atas, contratos, alvarás e demais documentos de governança.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar documento, responsável..." className="pl-8 w-72" value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo documento</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Task ID</TableHead>
                  <TableHead className="min-w-[280px]">Documento</TableHead>
                  <TableHead>Anexo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-center">Revisão</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Data da revisão</TableHead>
                  <TableHead>Data de aprovação</TableHead>
                  <TableHead>Aprovador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map(d => (
                  <TableRow key={d.taskId}>
                    <TableCell><Badge variant="outline" className={statusStyle[d.status]}>{d.status}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.taskId}</TableCell>
                    <TableCell className="font-medium">{d.taskName}</TableCell>
                    <TableCell>
                      {d.documento ? (
                        <a href={d.documento} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                          <Paperclip className="h-3.5 w-3.5" />anexo
                        </a>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">{d.assignee || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-center">{d.revisao ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{d.dueDate || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{d.dataRevisao || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{d.dataAprovacao || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{d.aprovador || <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))}
                {linhas.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum documento encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
