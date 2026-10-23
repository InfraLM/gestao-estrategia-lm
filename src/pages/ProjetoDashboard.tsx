import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, Upload, FileText, DollarSign, Activity, Calendar, Users, ListChecks, GanttChart } from "lucide-react";
import { useProjetoFromDB } from "@/hooks/useProjetoFromDB";
import { useRef, useState } from "react";
import { SaudeBadge } from "@/components/badges";
import { FaroisReportLeitura } from "@/components/FaroisReportLeitura";

export default function ProjetoDashboard() {
  const { id } = useParams<{ id: string }>();
  const db = useProjetoFromDB(id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [entregaTitulo, setEntregaTitulo] = useState("");
  const [entregaEap, setEntregaEap] = useState<string | null>(null);
  const [srForm, setSrForm] = useState({ periodo: new Date().toISOString().slice(0, 7), avancos: "", desvios: "", saude: "On-Track" });

  if (db.loading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!db.projeto) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-muted-foreground">Projeto "{id}" não encontrado no backend.</p>
        <Link to="/portfolio"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Portfólio</Button></Link>
      </div>
    );
  }

  const p = db.projeto;
  const submitFile = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f || !entregaTitulo) return;
    await db.submitEntrega(f, { titulo: entregaTitulo, eap_item_id: entregaEap });
    setEntregaTitulo(""); setEntregaEap(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addSr = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addStatusReport(srForm as any);
    setSrForm({ periodo: new Date().toISOString().slice(0, 7), avancos: "", desvios: "", saude: "On-Track" });
  };

  const execucao = p.budget > 0 ? Math.round((p.realizado / p.budget) * 100) : 0;
  const eapDone = db.eap.filter(e => e.status === "Concluído").length;
  const cronDone = db.cronograma.filter(c => c.status === "Concluído").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-4">
          <Link to="/portfolio"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
              <span>{p.codigo}</span><span>·</span><span>{p.wave}</span><span>·</span><span>{p.classificacao}</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mt-0.5">{p.nome}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <SaudeBadge saude={p.saude} />
              <Badge variant="outline" className="text-[10px]">BC: {p.status_bc}</Badge>
              <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
              {p.diretor && <Badge variant="outline" className="text-[10px]">Diretor: {p.diretor}</Badge>}
            </div>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="uppercase tracking-wider text-muted-foreground font-semibold">Período</div>
          <div className="text-sm font-medium mt-1 tabular-nums">{p.inicio} → {p.termino}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={DollarSign} label="Budget" value={`R$ ${Number(p.budget).toLocaleString("pt-BR")}`} sub={`${execucao}% executado`} />
        <Kpi icon={Activity} label="ICE Score" value={Number(p.ice).toFixed(1)} sub="Impacto · Confiança · Esforço" />
        <Kpi icon={ListChecks} label="EAP" value={`${eapDone}/${db.eap.length}`} sub="entregáveis concluídos" />
        <Kpi icon={GanttChart} label="Cronograma" value={`${cronDone}/${db.cronograma.length}`} sub="fases concluídas" />
      </div>

      <Tabs defaultValue="cronograma">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="cronograma"><GanttChart className="h-3.5 w-3.5 mr-1.5" /> Cronograma</TabsTrigger>
          <TabsTrigger value="eap"><ListChecks className="h-3.5 w-3.5 mr-1.5" /> EAP</TabsTrigger>
          <TabsTrigger value="entregas"><Upload className="h-3.5 w-3.5 mr-1.5" /> Entregas</TabsTrigger>
          <TabsTrigger value="status"><Activity className="h-3.5 w-3.5 mr-1.5" /> Status Reports</TabsTrigger>
          <TabsTrigger value="info"><Users className="h-3.5 w-3.5 mr-1.5" /> Info</TabsTrigger>
        </TabsList>

        {/* Cronograma */}
        <TabsContent value="cronograma" className="mt-5">
          <Card className="p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Cronograma</h3>
              <Button size="sm" onClick={() => db.addCronograma({ fase: "Nova fase" })} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Adicionar fase</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr><th className="text-left px-2 py-2">Fase</th><th className="text-left px-2 py-2">Responsável</th><th className="text-left px-2 py-2">Prevista</th><th className="text-left px-2 py-2">Conclusão</th><th className="text-left px-2 py-2">Status</th><th></th></tr>
                </thead>
                <tbody>
                  {db.cronograma.map(c => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="px-2 py-2"><Input defaultValue={c.fase} onBlur={e => e.target.value !== c.fase && db.updateCronograma(c.id, { fase: e.target.value })} className="h-8" /></td>
                      <td className="px-2 py-2"><Input defaultValue={c.responsavel ?? ""} onBlur={e => db.updateCronograma(c.id, { responsavel: e.target.value })} className="h-8" /></td>
                      <td className="px-2 py-2"><Input type="date" defaultValue={c.data_prevista ?? ""} onBlur={e => db.updateCronograma(c.id, { data_prevista: e.target.value || null })} className="h-8" /></td>
                      <td className="px-2 py-2"><Input type="date" defaultValue={c.data_conclusao ?? ""} onBlur={e => db.updateCronograma(c.id, { data_conclusao: e.target.value || null })} className="h-8" /></td>
                      <td className="px-2 py-2">
                        <Select value={c.status} onValueChange={v => db.updateCronograma(c.id, { status: v })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent className="z-50 bg-popover">
                            {["Não Iniciado","Em Andamento","Concluído","Atrasado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2"><Button variant="ghost" size="icon" onClick={() => db.deleteCronograma(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></td>
                    </tr>
                  ))}
                  {db.cronograma.length === 0 && <tr><td colSpan={6} className="text-center text-xs text-muted-foreground py-8">Nenhuma fase cadastrada</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* EAP */}
        <TabsContent value="eap" className="mt-5">
          <Card className="p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">EAP — Entregáveis</h3>
              <Button size="sm" onClick={() => db.addEap({ pacote: "Pacote", entregavel: "Novo entregável" })} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Adicionar</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr><th className="text-left px-2 py-2">Pacote</th><th className="text-left px-2 py-2">Entregável</th><th className="text-left px-2 py-2">Responsável</th><th className="text-left px-2 py-2">Prevista</th><th className="text-left px-2 py-2">Conclusão</th><th className="text-left px-2 py-2">Status</th><th></th></tr>
                </thead>
                <tbody>
                  {db.eap.map(e => (
                    <tr key={e.id} className="border-b border-border/50">
                      <td className="px-2 py-2"><Input defaultValue={e.pacote} onBlur={ev => db.updateEap(e.id, { pacote: ev.target.value })} className="h-8" /></td>
                      <td className="px-2 py-2"><Input defaultValue={e.entregavel} onBlur={ev => db.updateEap(e.id, { entregavel: ev.target.value })} className="h-8" /></td>
                      <td className="px-2 py-2"><Input defaultValue={e.responsavel ?? ""} onBlur={ev => db.updateEap(e.id, { responsavel: ev.target.value })} className="h-8" /></td>
                      <td className="px-2 py-2"><Input type="date" defaultValue={e.data_prevista ?? ""} onBlur={ev => db.updateEap(e.id, { data_prevista: ev.target.value || null })} className="h-8" /></td>
                      <td className="px-2 py-2"><Input type="date" defaultValue={e.data_conclusao ?? ""} onBlur={ev => db.updateEap(e.id, { data_conclusao: ev.target.value || null })} className="h-8" /></td>
                      <td className="px-2 py-2">
                        <Select value={e.status} onValueChange={v => db.updateEap(e.id, { status: v })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent className="z-50 bg-popover">
                            {["Pendente","Em Andamento","Concluído","Bloqueado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2"><Button variant="ghost" size="icon" onClick={() => db.deleteEap(e.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></td>
                    </tr>
                  ))}
                  {db.eap.length === 0 && <tr><td colSpan={7} className="text-center text-xs text-muted-foreground py-8">Nenhum entregável cadastrado</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Entregas */}
        <TabsContent value="entregas" className="mt-5 space-y-4">
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-4">Submeter nova entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Título</Label><Input value={entregaTitulo} onChange={e => setEntregaTitulo(e.target.value)} placeholder="Ex.: Plano de comunicação v1" className="mt-1" /></div>
              <div>
                <Label>Vincular a entregável (opcional)</Label>
                <Select value={entregaEap ?? "none"} onValueChange={v => setEntregaEap(v === "none" ? null : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="none">Sem vínculo</SelectItem>
                    {db.eap.map(e => <SelectItem key={e.id} value={e.id}>{e.pacote} · {e.entregavel}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Arquivo (PDF, planilha, apresentação, gravação, texto)</Label>
                <Input ref={fileRef} type="file" className="mt-1" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.mp3,.wav,.m4a,.ogg" />
              </div>
            </div>
            <Button onClick={submitFile} disabled={!entregaTitulo} className="mt-4 gap-2"><Upload className="h-4 w-4" /> Submeter</Button>
          </Card>
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-4">Histórico de submissões ({db.submissoes.length})</h3>
            <div className="space-y-2">
              {db.submissoes.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{s.titulo}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.arquivo_nome} · {s.tipo_arquivo} · {new Date(s.created_at).toLocaleString("pt-BR")}</div>
                    </div>
                  </div>
                  {s.arquivo_path && <Button size="sm" variant="outline" onClick={() => db.downloadEntrega(s.arquivo_path!, s.arquivo_nome ?? "arquivo")}>Baixar</Button>}
                </div>
              ))}
              {db.submissoes.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhuma submissão ainda</p>}
            </div>
          </Card>
        </TabsContent>

        {/* Status Reports */}
        <TabsContent value="status" className="mt-5 space-y-4">
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-4">Novo Status Report</h3>
            <form onSubmit={addSr} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Período (AAAA-MM)</Label><Input value={srForm.periodo} onChange={e => setSrForm({ ...srForm, periodo: e.target.value })} className="mt-1" /></div>
                <div>
                  <Label>Saúde</Label>
                  <Select value={srForm.saude} onValueChange={v => setSrForm({ ...srForm, saude: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {["On-Track","Alerta","Off-Track"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Avanços</Label><Textarea value={srForm.avancos} onChange={e => setSrForm({ ...srForm, avancos: e.target.value })} className="mt-1" rows={3} /></div>
              <div><Label>Desvios</Label><Textarea value={srForm.desvios} onChange={e => setSrForm({ ...srForm, desvios: e.target.value })} className="mt-1" rows={3} /></div>
              <Button type="submit" className="gap-2"><Plus className="h-4 w-4" /> Registrar</Button>
            </form>
          </Card>
          <Card className="p-5 shadow-card">
            <h3 className="font-semibold mb-4">Histórico ({db.statusReports.length})</h3>
            <div className="space-y-3">
              {db.statusReports.map(sr => (
                <div key={sr.id} className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{sr.periodo}</span>
                    {sr.saude && <SaudeBadge saude={sr.saude as any} />}
                  </div>
                  {sr.avancos && <p className="text-xs"><span className="font-semibold">Avanços:</span> {sr.avancos}</p>}
                  {sr.desvios && <p className="text-xs mt-1"><span className="font-semibold">Desvios:</span> {sr.desvios}</p>}
                  <div className="mt-2"><FaroisReportLeitura valor={sr.farois_dimensoes} /></div>
                  <p className="text-[10px] text-muted-foreground mt-2">{new Date(sr.created_at).toLocaleString("pt-BR")}</p>
                </div>
              ))}
              {db.statusReports.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhum report registrado</p>}
            </div>
          </Card>
        </TabsContent>

        {/* Info */}
        <TabsContent value="info" className="mt-5">
          <Card className="p-5 shadow-card space-y-4">
            <h3 className="font-semibold">Dados do projeto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input defaultValue={p.nome} onBlur={e => e.target.value !== p.nome && db.updateProjeto({ nome: e.target.value })} className="mt-1" /></div>
              <div><Label>Diretor</Label><Input defaultValue={p.diretor ?? ""} onBlur={e => db.updateProjeto({ diretor: e.target.value })} className="mt-1" /></div>
              <div><Label>Gerente</Label><Input defaultValue={p.gerente ?? ""} onBlur={e => db.updateProjeto({ gerente: e.target.value })} className="mt-1" /></div>
              <div><Label>Budget (R$)</Label><Input type="number" defaultValue={p.budget} onBlur={e => db.updateProjeto({ budget: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Realizado (R$)</Label><Input type="number" defaultValue={p.realizado} onBlur={e => db.updateProjeto({ realizado: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>ICE</Label><Input type="number" step="0.1" defaultValue={p.ice} onBlur={e => db.updateProjeto({ ice: Number(e.target.value) })} className="mt-1" /></div>
              <div className="md:col-span-2"><Label>Descrição</Label><Textarea defaultValue={p.descricao ?? ""} onBlur={e => db.updateProjeto({ descricao: e.target.value })} className="mt-1" rows={3} /></div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="text-2xl font-semibold mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}
