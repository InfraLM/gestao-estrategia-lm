import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Sparkles, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { projetos } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SaudeBadge } from "@/components/badges";
import PessoaSelect from '@/components/estrutura/PessoaSelect';

interface KPI { indicador: string; atual: string; meta: string }
interface BC {
  id?: string;
  projeto_id?: string;
  area_responsavel: string;
  responsavel: string;
  responsavel_pessoa_id?: string | null;
  problema_descricao: string;
  problema_evidencias: string;
  processo_impactado: string;
  areas_envolvidas: string;
  amplitude_outra_area: boolean;
  amplitude_processo_corporativo: boolean;
  amplitude_sistema: boolean;
  amplitude_impacto_financeiro: boolean;
  hipotese_acao: string;
  hipotese_resultado: string;
  impacto_tempo: string;
  impacto_qualidade: string;
  impacto_produtividade: string;
  impacto_financeiro: string;
  esforco_tempo: string;
  esforco_recursos: string;
  esforco_dependencias: string;
  criterio_sucesso: string;
  kpis: KPI[];
}

const empty: BC = {
  area_responsavel: "", responsavel: "", problema_descricao: "", problema_evidencias: "",
  processo_impactado: "", areas_envolvidas: "",
  amplitude_outra_area: false, amplitude_processo_corporativo: false, amplitude_sistema: false, amplitude_impacto_financeiro: false,
  hipotese_acao: "", hipotese_resultado: "",
  impacto_tempo: "", impacto_qualidade: "", impacto_produtividade: "", impacto_financeiro: "",
  esforco_tempo: "", esforco_recursos: "", esforco_dependencias: "",
  criterio_sucesso: "", kpis: [],
};

export default function MelhoriaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const projeto = projetos.find(p => p.id === id);
  const [bc, setBc] = useState<BC>(empty);
  const [projetoUuid, setProjetoUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projeto) return;
    (async () => {
      const { data: p } = await supabase.from("projetos").select("id").eq("codigo", projeto.id).maybeSingle();
      if (!p) { setLoading(false); return; }
      setProjetoUuid(p.id);
      const { data } = await supabase.from("melhoria_business_case").select("*").eq("projeto_id", p.id).maybeSingle();
      if (data) setBc({ ...empty, ...data, kpis: (data.kpis as any) ?? [] });
      setLoading(false);
    })();
  }, [projeto]);

  if (!projeto) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-warning-foreground mx-auto" />
        <h2 className="text-xl font-semibold">Melhoria não encontrada</h2>
        <Link to="/melhorias"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Voltar</Button></Link>
      </div>
    );
  }

  const amplitudeYes = bc.amplitude_outra_area || bc.amplitude_processo_corporativo || bc.amplitude_sistema || bc.amplitude_impacto_financeiro;

  const save = async () => {
    if (!projetoUuid) return toast.error("Projeto não sincronizado com backend");
    setSaving(true);
    const { error } = await supabase.from("melhoria_business_case").upsert(
      { ...bc, projeto_id: projetoUuid, kpis: bc.kpis as any },
      { onConflict: "projeto_id" }
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Business Case salvo");
  };

  const addKpi = () => setBc({ ...bc, kpis: [...bc.kpis, { indicador: "", atual: "", meta: "" }] });
  const updKpi = (i: number, patch: Partial<KPI>) => setBc({ ...bc, kpis: bc.kpis.map((k, idx) => idx === i ? { ...k, ...patch } : k) });
  const delKpi = (i: number) => setBc({ ...bc, kpis: bc.kpis.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Link to="/melhorias"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <div className="text-xs text-muted-foreground">{projeto.id} · {projeto.classificacao}</div>
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />{projeto.nome}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>Diretor: {projeto.diretor}</span> · <SaudeBadge saude={projeto.saude} />
            </div>
          </div>
        </div>
        <Button onClick={save} disabled={saving || loading} className="gap-2">
          <Save className="h-4 w-4" />{saving ? "Salvando…" : "Salvar BC"}
        </Button>
      </div>

      {amplitudeYes && (
        <Card className="p-4 border-purple-300 bg-purple-50">
          <div className="text-sm text-purple-900">
            <strong>Classificação automática:</strong> esta melhoria tem impacto em processos corporativos.
            Deve seguir o caminho <strong>Melhoria com Impacto em Processos (EPP)</strong> com suporte do Escritório de Processos.
          </div>
        </Card>
      )}

      {/* 1. Identificação */}
      <Card className="p-6 shadow-card space-y-4">
        <h3 className="font-semibold">1. Identificação da Iniciativa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Área responsável</Label><Input value={bc.area_responsavel} onChange={e => setBc({ ...bc, area_responsavel: e.target.value })} /></div>
          <div><Label>Responsável</Label><PessoaSelect value={bc.responsavel_pessoa_id} texto={bc.responsavel} onChange={p => setBc({ ...bc, responsavel_pessoa_id: p?.id ?? null })} /></div>
        </div>
      </Card>

      {/* 2. Problema */}
      <Card className="p-6 shadow-card space-y-4">
        <h3 className="font-semibold">2. Problema Identificado</h3>
        <div><Label>Descrição do problema atual</Label><Textarea rows={3} value={bc.problema_descricao} onChange={e => setBc({ ...bc, problema_descricao: e.target.value })} /></div>
        <div><Label>Evidências (tempo, retrabalho, erros, esforço operacional)</Label><Textarea rows={3} value={bc.problema_evidencias} onChange={e => setBc({ ...bc, problema_evidencias: e.target.value })} /></div>
      </Card>

      {/* 3. Classificação */}
      <Card className="p-6 shadow-card space-y-4">
        <h3 className="font-semibold">3. Classificação de Melhoria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Processo ou atividade impactada</Label><Input value={bc.processo_impactado} onChange={e => setBc({ ...bc, processo_impactado: e.target.value })} /></div>
          <div><Label>Áreas envolvidas</Label><Input value={bc.areas_envolvidas} onChange={e => setBc({ ...bc, areas_envolvidas: e.target.value })} /></div>
        </div>
        <div className="space-y-2 pt-2">
          <Label className="text-sm">Tabela de Amplitude</Label>
          {[
            ["amplitude_outra_area", "Envolve outra área, altera entregas ou SLA entre departamentos?"],
            ["amplitude_processo_corporativo", "A melhoria altera processo corporativo mapeado?"],
            ["amplitude_sistema", "A melhoria exige mudança em sistema ou automação relevante?"],
            ["amplitude_impacto_financeiro", "A melhoria pode gerar impacto financeiro relevante ou mudança operacional significativa?"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-start gap-3 p-3 rounded-md border bg-muted/30 cursor-pointer">
              <Checkbox checked={(bc as any)[key]} onCheckedChange={v => setBc({ ...bc, [key]: !!v } as any)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* 4. Hipótese */}
      <Card className="p-6 shadow-card space-y-4">
        <h3 className="font-semibold">4. Hipótese de Melhoria</h3>
        <div><Label>Descrição da ação proposta</Label><Textarea rows={3} value={bc.hipotese_acao} onChange={e => setBc({ ...bc, hipotese_acao: e.target.value })} /></div>
        <div><Label>Resultado esperado</Label><Textarea rows={2} value={bc.hipotese_resultado} onChange={e => setBc({ ...bc, hipotese_resultado: e.target.value })} /></div>
      </Card>

      {/* 5. Impacto */}
      <Card className="p-6 shadow-card space-y-4">
        <h3 className="font-semibold">5. Impacto Esperado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Tempo operacional (horas liberadas / redução)</Label><Textarea rows={2} value={bc.impacto_tempo} onChange={e => setBc({ ...bc, impacto_tempo: e.target.value })} /></div>
          <div><Label>Qualidade (redução de erros/retrabalho)</Label><Textarea rows={2} value={bc.impacto_qualidade} onChange={e => setBc({ ...bc, impacto_qualidade: e.target.value })} /></div>
          <div><Label>Produtividade (ganho de capacidade)</Label><Textarea rows={2} value={bc.impacto_produtividade} onChange={e => setBc({ ...bc, impacto_produtividade: e.target.value })} /></div>
          <div><Label>Impacto financeiro estimado</Label><Textarea rows={2} value={bc.impacto_financeiro} onChange={e => setBc({ ...bc, impacto_financeiro: e.target.value })} /></div>
        </div>
      </Card>

      {/* 6. KPIs */}
      <Card className="p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">6. Indicadores Impactados (KPI)</h3>
          <Button size="sm" variant="outline" onClick={addKpi} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Adicionar KPI</Button>
        </div>
        {bc.kpis.length === 0 && <p className="text-sm text-muted-foreground">Nenhum KPI cadastrado.</p>}
        {bc.kpis.map((k, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <Input className="col-span-5" placeholder="Indicador" value={k.indicador} onChange={e => updKpi(i, { indicador: e.target.value })} />
            <Input className="col-span-3" placeholder="Atual" value={k.atual} onChange={e => updKpi(i, { atual: e.target.value })} />
            <Input className="col-span-3" placeholder="Meta" value={k.meta} onChange={e => updKpi(i, { meta: e.target.value })} />
            <Button size="icon" variant="ghost" onClick={() => delKpi(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </Card>

      {/* 7. Esforço */}
      <Card className="p-6 shadow-card space-y-4">
        <h3 className="font-semibold">7. Esforço de Implementação</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Tempo estimado</Label><Input value={bc.esforco_tempo} onChange={e => setBc({ ...bc, esforco_tempo: e.target.value })} /></div>
          <div><Label>Recursos envolvidos</Label><Input value={bc.esforco_recursos} onChange={e => setBc({ ...bc, esforco_recursos: e.target.value })} /></div>
          <div><Label>Dependências</Label><Input value={bc.esforco_dependencias} onChange={e => setBc({ ...bc, esforco_dependencias: e.target.value })} /></div>
        </div>
      </Card>

      {/* 8. Critério de Sucesso */}
      <Card className="p-6 shadow-card space-y-4">
        <h3 className="font-semibold">8. Critério de Sucesso</h3>
        <Textarea rows={3} value={bc.criterio_sucesso} onChange={e => setBc({ ...bc, criterio_sucesso: e.target.value })}
          placeholder="Condições para considerar a melhoria bem-sucedida" />
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving || loading} className="gap-2">
          <Save className="h-4 w-4" />{saving ? "Salvando…" : "Salvar BC"}
        </Button>
      </div>
    </div>
  );
}
