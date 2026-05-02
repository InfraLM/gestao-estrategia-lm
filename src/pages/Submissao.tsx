import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Bot, CheckCircle2, AlertTriangle, XCircle, Save, Send, RotateCcw, Upload, FileText, Loader2, FileWarning } from "lucide-react";
import { diretores, objetivosBSC, okrs } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FaroLight = "verde" | "amarelo" | "vermelho";

const dimensoes: { label: string; status: FaroLight }[] = [
  { label: "Alinhamento Estratégico (BSC/OKR)", status: "verde" },
  { label: "Viabilidade Financeira (ROI/Margem)", status: "amarelo" },
  { label: "Maturidade do Escopo", status: "verde" },
  { label: "Conformidade com Governança", status: "amarelo" },
  { label: "Aderência ao Mercado / Contexto Setorial", status: "verde" },
];

const perguntas = [
  "O ROI projetado considera o custo de aquisição de infraestrutura hospitalar e o tempo de ramp-up da equipe?",
  "Como este projeto mitiga o risco de early churn nos primeiros 90 dias do aluno?",
  "Existe dependência de validação técnica externa (ex: MEC, CFM) que pode impactar o cronograma?",
];

function FaroIcon({ s }: { s: FaroLight }) {
  if (s === "verde") return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (s === "amarelo") return <AlertTriangle className="h-5 w-5 text-warning" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
}

export default function Submissao() {
  const [impacto, setImpacto] = useState([7]);
  const [confianca, setConfianca] = useState([6]);
  const [facilidade, setFacilidade] = useState([5]);
  const [hasBC, setHasBC] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const ice = ((impacto[0] + confianca[0] + facilidade[0]) / 3).toFixed(1);

  const onAnalyze = () => {
    setAnalyzing(true);
    setAnalyzed(false);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); }, 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Form */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="p-6 shadow-card">
          <h3 className="font-semibold mb-4">Identificação do Projeto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nome do Projeto *</Label>
              <Input placeholder="Ex: Plataforma de Provas com IA" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição / Escopo Resumido *</Label>
              <Textarea rows={3} placeholder="Descreva o escopo, objetivo e entregas principais..." className="mt-1" />
            </div>
            <div>
              <Label>Diretor Responsável</Label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>{diretores.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gerente do Projeto</Label>
              <Input placeholder="Nome do gerente" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Categoria Estratégica</Label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar categoria..." /></SelectTrigger>
                <SelectContent>
                  {["Eficiência Operacional","Expansão Comercial","Experiência e Retenção do Aluno","IA e Automação","Inovação","Marca e Diferenciação Competitiva","Sustentação e Escala"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-semibold mb-4">Classificação Estratégica</h3>
          <div className="space-y-4">
            <div>
              <Label>Classificação do Projeto</Label>
              <RadioGroup defaultValue="Melhoria Contínua" className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {["Institucional","Melhoria Contínua","Melhoria Contínua com EPP","Novo Produto"].map(v => (
                  <label key={v} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border cursor-pointer hover:bg-surface-muted text-sm">
                    <RadioGroupItem value={v} /> {v}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Wave Sugerida</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Wave..." /></SelectTrigger>
                  <SelectContent>{["Wave 1","Wave 2","Wave 3"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Início Previsto</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Período..." /></SelectTrigger>
                  <SelectContent>{["2026/1","2026/2","2027/1","2027/2"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Término Previsto</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Período..." /></SelectTrigger>
                  <SelectContent>{["2026/1","2026/2","2027/1","2027/2","2027/2+"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-semibold mb-4">Financeiro e Governança</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Budget Estimado (R$)</Label>
              <Input type="number" placeholder="0,00" className="mt-1" />
            </div>
            <div className="flex items-center justify-between gap-4 pt-6">
              <Label className="m-0">Possui Business Case?</Label>
              <Switch checked={hasBC} onCheckedChange={setHasBC} />
            </div>
            <div className="md:col-span-2">
              <Label>Link do Business Case</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="https://..." />
                <Button variant="outline">Upload</Button>
              </div>
            </div>
            <div className="md:col-span-2 pt-2">
              <div className="flex items-center justify-between mb-3">
                <Label className="m-0">ICE Score</Label>
                <span className="text-2xl font-semibold tabular-nums text-primary">{ice}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { label: "Impacto", v: impacto, set: setImpacto },
                  { label: "Confiança", v: confianca, set: setConfianca },
                  { label: "Facilidade", v: facilidade, set: setFacilidade },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-2"><span className="text-muted-foreground">{s.label}</span><span className="font-semibold">{s.v[0]}/10</span></div>
                    <Slider min={1} max={10} step={1} value={s.v} onValueChange={s.set} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="font-semibold mb-4">Vínculo Estratégico</h3>
          <div className="space-y-4">
            <div>
              <Label>Objetivos Estratégicos (BSC)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {objetivosBSC.map(o => (
                  <button key={o.id} type="button" className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    <span className="font-semibold text-primary">{o.id}</span> · {o.nome.slice(0, 32)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>KRs Vinculados 2026/1</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {okrs.flatMap(o => o.krs).map(kr => (
                  <button key={kr.id} type="button" className="px-2.5 py-1 rounded-md text-xs border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    <span className="font-semibold">{kr.id}</span> · {kr.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-border">
            <Button size="lg" onClick={onAnalyze} className="gap-2 shadow-primary">
              <Sparkles className="h-4 w-4" /> Analisar com IA
            </Button>
            <Button variant="outline" size="lg" onClick={() => toast.success("Rascunho salvo")}><Save className="h-4 w-4 mr-2" /> Salvar Rascunho</Button>
          </div>
        </Card>
      </div>

      {/* AI Panel */}
      <div className="lg:col-span-2">
        <div className="sticky top-24 space-y-4">
          {!analyzed && !analyzing && (
            <Card className="p-8 shadow-card border-dashed bg-surface-muted text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-background grid place-items-center mb-3 shadow-card">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Preencha o formulário e clique em <span className="font-semibold text-foreground">"Analisar com IA"</span> para receber uma análise estratégica automatizada.</p>
            </Card>
          )}

          {analyzing && (
            <Card className="p-6 shadow-card space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-4 rounded bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-background to-transparent animate-shimmer" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">Analisando vínculo estratégico, viabilidade e governança…</p>
            </Card>
          )}

          {analyzed && (
            <div className="space-y-4 animate-fade-in">
              <Card className="p-5 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Vínculo Estratégico Sugerido</h4>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/30">F.01 — Maximizar LTV e NRR</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-info-soft text-info border border-info/30">OKR 1 — Blindagem Financeira</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-success-soft text-success border border-success/30">Wave 1 — Estrutura Mínima</span>
                </div>
                <p className="text-xs text-muted-foreground">A iniciativa apresenta forte aderência ao OKR 1, com impacto direto em previsibilidade e geração de caixa. Wave 1 recomendada por estar no caminho crítico de blindagem financeira.</p>
              </Card>

              <Card className="p-5 shadow-card">
                <h4 className="font-semibold text-sm mb-3">Análise de Coerência</h4>
                <ul className="space-y-2.5">
                  {dimensoes.map(d => (
                    <li key={d.label} className="flex items-start gap-3 text-sm">
                      <FaroIcon s={d.status} />
                      <span className="flex-1 text-muted-foreground">{d.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">Síntese: projeto estrategicamente bem posicionado. Há pontos de atenção em viabilidade financeira (ROI a refinar) e governança (BC ainda em construção).</p>
              </Card>

              <Card className="p-5 shadow-card">
                <h4 className="font-semibold text-sm mb-3">Questionamentos para Clareza Mínima</h4>
                <div className="space-y-3">
                  {perguntas.map((p, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-foreground mb-1.5">{i + 1}. {p}</p>
                      <Textarea rows={2} placeholder="Sua resposta..." className="text-xs" />
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-2">
                <Button className="bg-success hover:bg-success/90 text-success-foreground gap-2" onClick={() => toast.success("Projeto submetido ao portfólio")}>
                  <Send className="h-4 w-4" /> Aprovar e Submeter
                </Button>
                <Button variant="outline" className="gap-2"><RotateCcw className="h-4 w-4" /> Revisar Escopo</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
