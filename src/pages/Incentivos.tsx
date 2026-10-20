import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EstruturaTexto from "@/components/estrutura/EstruturaTexto";
import { agruparOrigemMeta, BLOCOS_METAS, formatarMeta, sistemaMetasAoVivo, type IndicadorIncentivo, type MetaIncentivo } from "./incentivosDados";

export default function Incentivos() {
  const { user } = useAuth();
  const [selecao, setSelecao] = useState("");
  const query = useQuery({
    queryKey: ["incentivos-sistemas", user?.id], enabled: !!user, refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: sistemas, error } = await supabase.from("incentivo_sistemas").select("*").order("periodo").order("nome");
      if (error) throw error;
      const ids = [...new Set(sistemas.map(s => s.org_cadeira_id))];
      if (!ids.length) return { sistemas, cadeiras: [] };
      const { data: cadeiras, error: erro } = await supabase.from("org_cadeiras").select("id,nome,ocupante_nome,mt_cadeira_id,ordem").in("id", ids).order("ordem").order("nome");
      if (erro) throw erro;
      return { sistemas, cadeiras };
    },
  });
  const cadeiras = query.data?.cadeiras ?? [];
  const cadeira = cadeiras.find(c => c.id === selecao) ?? cadeiras[0];
  const sistemas = query.data?.sistemas.filter(s => s.org_cadeira_id === cadeira?.id) ?? [];
  const idsProprios = sistemas.filter(s => !sistemaMetasAoVivo(s.nome)).map(s => s.id);
  const precisaIndicadores = sistemas.some(s => sistemaMetasAoVivo(s.nome));
  const metas = useQuery({
    queryKey: ["incentivos-metas", user?.id, cadeira?.id, cadeira?.mt_cadeira_id, sistemas.map(s => s.id).join(",")], enabled: !!user && !!cadeira,
    refetchOnWindowFocus: true, refetchInterval: 30000,
    queryFn: async () => {
      let indicadores: IndicadorIncentivo[] = [];
      let proprias: MetaIncentivo[] = [];
      await Promise.all([
        (async () => {
          if (!precisaIndicadores || !cadeira?.mt_cadeira_id) return;
          const { data, error } = await supabase.from("mt_indicadores").select("*").eq("cadeira_id", cadeira.mt_cadeira_id).eq("status", "ativo").order("codigo");
          if (error) throw error;
          indicadores = data;
        })(),
        (async () => {
          if (!idsProprios.length) return;
          const { data, error } = await supabase.from("incentivo_metas").select("*").in("sistema_id", idsProprios).order("ordem");
          if (error) throw error;
          proprias = data;
        })(),
      ]);
      return { indicadores, proprias };
    },
  });
  const texto = (t: string | null) => <EstruturaTexto texto={t} acessoSocios={false} />;
  return <div className="min-w-0 space-y-6">
    <p className="border-l-4 border-primary bg-muted px-4 py-3 text-sm">Esta tela mostra regras, métricas, pesos e gatilhos. Valores de remuneração não são registrados no app.</p>
    <h2 className="text-lg font-semibold">Sistemas de incentivo</h2>
    {query.isPending ? <p role="status" className="flex items-center gap-2 py-12"><Loader2 className="h-5 w-5 animate-spin" />Carregando sistemas…</p>
      : query.isError ? <div role="alert"><p className="text-destructive">Não foi possível carregar os sistemas.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div>
      : !cadeira ? <p className="py-12 text-center text-muted-foreground">Nenhum sistema de incentivo encontrado</p>
      : <>
        <div className="max-w-2xl space-y-2"><Label>Cadeira</Label><Select value={cadeira.id} onValueChange={setSelecao}><SelectTrigger aria-label="Cadeira" className="h-auto min-h-10 text-left [&>span]:whitespace-normal"><SelectValue /></SelectTrigger><SelectContent>{cadeiras.map(c => <SelectItem key={c.id} value={c.id}>{c.ocupante_nome || "Sem ocupante"} · {c.nome}</SelectItem>)}</SelectContent></Select></div>
        {metas.isPending ? <p role="status">Carregando metas…</p> : metas.isError ? <div role="alert"><p className="text-destructive">Não foi possível carregar as metas.</p><Button variant="outline" onClick={() => metas.refetch()}>Tentar novamente</Button></div> : sistemas.map(s => {
          const vivo = sistemaMetasAoVivo(s.nome);
          return <article key={s.id} className="min-w-0 rounded-lg border bg-card p-4 sm:p-6">
            <header className="space-y-3 border-b pb-4"><h3 className="break-words text-lg font-semibold">{texto(s.nome)}</h3><p className="text-sm text-muted-foreground">{s.periodo || "Período a definir"}</p><div className="text-sm"><span className="font-semibold">Gatilho: </span>{texto(s.gatilho)}</div><div className="whitespace-pre-wrap break-words text-sm"><span className="font-semibold">Regra: </span>{texto(s.regra_resumo)}</div></header>
            {Object.entries(BLOCOS_METAS).map(([origem, titulo]) => {
              const indicadores = metas.data?.indicadores.filter(i => agruparOrigemMeta(i.origem) === origem) ?? [];
              const proprias = metas.data?.proprias.filter(m => m.sistema_id === s.id && agruparOrigemMeta(m.origem) === origem) ?? [];
              return <section key={origem} className="min-w-0 pt-5"><h4 className="mb-3 font-semibold">{titulo}</h4><Table><TableHeader><TableRow>{(vivo ? ["Código", "Nome", "Peso", "Meta", "Sentido"] : ["Referência", "Descrição", "Peso", "Meta", "Período"]).map(t => <TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader><TableBody>
                {vivo ? indicadores.map(i => <TableRow key={i.id}><TableCell className="whitespace-nowrap">{i.codigo}</TableCell><TableCell className="min-w-[200px]">{i.nome}</TableCell><TableCell>{i.peso}</TableCell><TableCell className="min-w-[160px]">{formatarMeta(i)}</TableCell><TableCell>{i.sentido}</TableCell></TableRow>) : proprias.map(m => <TableRow key={m.id}><TableCell>{texto(m.referencia_codigo)}</TableCell><TableCell className="min-w-[200px]">{texto(m.descricao)}</TableCell><TableCell>{m.peso ?? "a definir"}</TableCell><TableCell className="min-w-[160px]">{formatarMeta(m)}</TableCell><TableCell>{m.periodo || "—"}</TableCell></TableRow>)}
                {(vivo ? !indicadores.length : !proprias.length) && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Nenhuma meta neste bloco</TableCell></TableRow>}
              </TableBody></Table></section>;
            })}
          </article>;
        })}
      </>}
  </div>;
}