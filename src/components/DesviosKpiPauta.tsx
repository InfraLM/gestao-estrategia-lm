import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import type { Indicador,Cadeira } from '@/hooks/useMetasBase';
export default function DesviosKpiPauta({ indicadores,cadeiras }: {indicadores:Indicador[];cadeiras:Cadeira[]}) {
 const [rows,setRows]=useState<any[]>([]);
 useEffect(()=>{void supabase.from('mt_kpi_desvios').select('*').order('criado_em',{ascending:false}).limit(200).then(({data})=>setRows(data??[]));},[]);
 return <section className="space-y-3 border-t pt-4"><h2 className="font-semibold">Pauta de desvios críticos · Governança / comitê</h2>{!rows.length?<p className="text-sm text-muted-foreground">Nenhum desvio crítico registrado.</p>:rows.map(d=>{const i=indicadores.find(i=>i.id===d.indicador_id);return <article key={d.id} className="border-b py-3 text-sm space-y-1"><div className="flex flex-wrap gap-2 items-center"><b>{i?.codigo} · {i?.nome}</b><Badge variant={d.ativo?'destructive':'outline'}>{d.ativo?'Cobrança mensal':'Frequência original retomada'}</Badge></div><p className="text-xs text-muted-foreground">{cadeiras.find(c=>c.id===d.cadeira_id)?.nome} · ciclo {d.ciclo} · {d.normais}/2 leituras normais</p><p><b>Valor:</b> {d.valor}</p><p><b>Causa:</b> {d.causa}</p><p><b>Impacto:</b> {d.impacto}</p><p><b>Ação:</b> {d.acao}</p></article>;})}</section>;
}