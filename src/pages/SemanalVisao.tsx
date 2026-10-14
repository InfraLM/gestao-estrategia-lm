import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMetasBase, statusEfetivo, STATUS_INI } from "@/hooks/useMetasBase";
import { segunda, prazoDe, SITUACAO_LBL, ENTREGA_LBL } from "./MetasSemanal";

const db = supabase as any;
const fmtSem = (s: string) => new Date(s + "T12:00").toLocaleDateString("pt-BR");

export default function SemanalVisao() {
  const b = useMetasBase();
  const [sem, setSem] = useState(segunda());
  const [rows, setRows] = useState<any[]>([]);
  const semanas = useMemo(() => [0, 1, 2, 3, 4, 5].map((n) => segunda(new Date(Date.now() - n * 7 * 864e5))), []);
  useEffect(() => { db.from("mt_checkins").select("*").eq("semana", sem).then(({ data }: any) => setRows(data ?? [])); }, [sem]);

  if (b.loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const cads = b.cadeiras.filter((c) => c.ativo);
  const get = (c: string, t: string) => rows.find((r) => r.cadeira_id === c && r.tipo === t);
  const enviado = (r: any) => r?.status === "enviado";
  const totIn = cads.filter((c) => enviado(get(c.id, "checkin"))).length;
  const totOut = cads.filter((c) => enviado(get(c.id, "checkout"))).length;
  const kpisFora = rows.flatMap((r) => (r.tipo === "checkout" ? r.conteudo?.kpis ?? [] : []).map((k: any) => ({ ...k, cadeira_id: r.cadeira_id }))).filter((k: any) => k.situacao && k.situacao !== "no_trilho");

  const Sit = ({ r, tipo }: { r: any; tipo: string }) => {
    if (enviado(r)) return <Badge className={new Date(r.enviado_em) > prazoDe(sem, tipo) ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}>Enviado</Badge>;
    return <Badge variant={new Date() > prazoDe(sem, tipo) ? "destructive" : "outline"}>{r ? "Rascunho" : "Pendente"}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Rotina semanal dos diretores</p>
          <h1 className="text-2xl font-bold">Visão da semana de {fmtSem(sem)}</h1>
          <p className="text-sm text-muted-foreground">Check-in {totIn}/{cads.length} · Checkout {totOut}/{cads.length} · {kpisFora.length} KPI(s) em atenção ou fora do trilho</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-40 space-y-1"><Label>Semana</Label>
            <Select value={sem} onValueChange={setSem}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{semanas.map((s) => <SelectItem key={s} value={s}>{fmtSem(s)}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button asChild><Link to="/metas/semanal">Preencher formulário</Link></Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {cads.map((c) => {
          const ci = get(c.id, "checkin"); const co = get(c.id, "checkout");
          const pri = ci?.conteudo?.prioridades?.filter((p: any) => p.titulo) ?? [];
          const ent = co?.conteudo?.entregas ?? [];
          const kp = co?.conteudo?.kpis ?? [];
          const atrasadas = b.iniciativas.filter((i) => i.cadeira_id === c.id && statusEfetivo(i) === "atrasada").length;
          return (
            <Card key={c.id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h2 className="font-semibold">{c.nome}</h2><p className="text-xs text-muted-foreground">{c.diretor_nome ?? "Sem diretor"}</p></div>
                <div className="flex gap-1 items-center text-xs">In <Sit r={ci} tipo="checkin" /> Out <Sit r={co} tipo="checkout" /></div>
              </div>
              {pri.length === 0 ? <p className="text-sm text-muted-foreground">Sem prioridades registradas.</p> : (
                <ul className="space-y-1 text-sm">
                  {pri.map((p: any, i: number) => {
                    const e = ent.find((x: any) => x.titulo === p.titulo);
                    const ini = b.iniciativas.find((x) => x.id === p.iniciativa_id);
                    return (
                      <li key={i} className="flex flex-wrap justify-between gap-2 border-b pb-1">
                        <span>{p.titulo}{ini && <span className="text-muted-foreground"> · {ini.titulo} ({STATUS_INI[statusEfetivo(ini)]})</span>}</span>
                        {e?.status && <Badge variant={e.status === "entregue" ? "default" : "outline"}>{ENTREGA_LBL[e.status]}</Badge>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {kp.length > 0 && (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">KPIs apontados</p>
                  {kp.map((k: any, i: number) => {
                    const ind = b.indicadores.find((x) => x.id === k.indicador_id);
                    return <div key={i} className="flex justify-between gap-2"><span>{ind?.codigo} · {ind?.nome} {k.valor && `— ${k.valor}`}</span>
                      {k.situacao && <Badge variant={k.situacao === "fora" ? "destructive" : k.situacao === "atencao" ? "outline" : "default"}>{SITUACAO_LBL[k.situacao]}</Badge>}</div>;
                  })}
                </div>
              )}
              {atrasadas > 0 && <p className="text-xs text-destructive">{atrasadas} iniciativa(s) atrasada(s)</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
