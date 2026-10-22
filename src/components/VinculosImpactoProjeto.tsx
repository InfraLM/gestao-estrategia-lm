import PortfolioVinculos from "@/components/PortfolioVinculos";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GrupoMultiSelect from "@/components/socios/GrupoMultiSelect";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Indicador, Objetivo, Okr } from "@/hooks/useMetasBase";
import type { ProjVinc, ProjetoG } from "@/hooks/useProjetosGestao";

const db = supabase as any;
type Tipo = ProjVinc["tipo"];
export const TIPO_VINC: Record<Tipo, string> = { bsc_objetivo: "Objetivo BSC", bsc_kpi: "KPI BSC", kr: "KR 2026/2", cesta: "Cesta de metas" };

/** Edita os vínculos de impacto do projeto (objetivo BSC, KPI BSC, KR 2026/2, cesta). */
export default function VinculosImpactoProjeto({ projeto, vinculos, indicadores, okrs, objetivos, onSalvo, podeEditar }: {
  projeto: ProjetoG; vinculos: ProjVinc[]; indicadores: Indicador[]; okrs: Okr[]; objetivos: Objetivo[]; onSalvo: () => void; podeEditar: boolean;
}) {
  return <PortfolioVinculos fonteTipo="projeto" fonteId={projeto.id} />;
}
