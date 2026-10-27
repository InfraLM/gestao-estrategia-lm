import { useMemo, useState } from "react";
import { CadastroCadeiras } from "./Hubs";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ArvoreCadeiras from "@/components/estrutura/ArvoreCadeiras";
import EstruturaTexto from "@/components/estrutura/EstruturaTexto";
import { type Cadeira, NIVEIS, filtrarCadeiras, montarArvore, rotuloNivel } from "./estruturaOrganizacional";
import RaioXPrestadores from "@/components/estrutura/RaioXPrestadores";
import OrganogramaAtual from "@/components/estrutura/OrganogramaAtual";
import EditarCargo, { type CargoEdicao } from "@/components/estrutura/EditarCargo";
import { podeEditarEstrutura } from "@/lib/organograma";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFitFinderAccess } from "@/hooks/useFitFinderAccess";
import BaseOrganizacional from '@/components/estrutura/BaseOrganizacional';
import { useBaseOrganizacional } from '@/hooks/useBaseOrganizacional';

const BLOCOS: { titulo: string; campo: keyof Cadeira }[] = [
  { titulo: "Missão", campo: "missao" }, { titulo: "É o D de", campo: "e_o_d_de" },
  { titulo: "Não é o D de", campo: "nao_e_o_d_de" }, { titulo: "Indicadores de rotina", campo: "indicadores_rotina" },
  { titulo: "Entregas 1º tri/27", campo: "entregas" }, { titulo: "Processos", campo: "processos" }, { titulo: "Notas", campo: "notas" },
];
export default function EstruturaOrganizacional() {
  const { user } = useAuth();
  const fitfinder = useFitFinderAccess();
  const [aba, setAba] = useState(new URLSearchParams(window.location.search).get("aba") ?? "organograma");
  const acesso = useModuleAccess();
  const org = useBaseOrganizacional();
  const canEdit = podeEditarEstrutura(acesso.grants, acesso.roles) && org.diretorio.pode_editar;
  const [editando, setEditando] = useState<Cadeira | null>(null);
  const acessoSocios = acesso.canAccessPath("socios", "/socios/insights");
  const query = useQuery({
    queryKey: ["estrutura-organizacional", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: cadeiras, error } = await supabase.from("org_cadeiras").select("*").order("ordem");
      if (error) throw error;
      const ids = [...new Set(cadeiras.flatMap(c => c.mt_cadeira_id ? [c.mt_cadeira_id] : []))];
      if (!ids.length) return { cadeiras, metas: [] as { id: string; nome: string }[] };
      const { data: metas, error: erroMetas } = await supabase.from("mt_cadeiras").select("id,nome").in("id", ids);
      if (erroMetas) throw erroMetas;
      return { cadeiras, metas };
    },
  });
  const cadeiras = query.data?.cadeiras ?? [];
  const nomesMetas = useMemo(() => new Map(query.data?.metas.map(m => [m.id, m.nome]) ?? []), [query.data]);
  const porId = useMemo(() => new Map(cadeiras.map(c => [c.id, c])), [cadeiras]);
  const arvore = useMemo(() => montarArvore(cadeiras), [cadeiras]);
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState("todos");
  const [id, setId] = useState<string | null>(null);
  const filtradas = useMemo(() => filtrarCadeiras(cadeiras, busca, nivel), [cadeiras, busca, nivel]);
  const atual = id ? porId.get(id) : undefined;
  const texto = (valor: string | null) => <EstruturaTexto texto={valor} acessoSocios={acessoSocios} />;
  if (!acesso.canAccessPath('estrutura', '/estrutura-organizacional') && aba === 'base') return <BaseOrganizacional />;
  return <div className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Estrutura Organizacional</h2><span role="status" className="text-sm text-muted-foreground">{filtradas.length} cadeiras</span></div>
    <Tabs value={aba === "prestadores" && !fitfinder.podeLer ? "organograma" : aba} onValueChange={setAba} className="min-w-0"><TabsList className="mb-4 h-auto flex-wrap"><TabsTrigger value="base">Base organizacional</TabsTrigger><TabsTrigger value="organograma">Organograma atualizado</TabsTrigger><TabsTrigger value="fichas">Fichas estratégicas</TabsTrigger><TabsTrigger value="cadeiras">Cadeiras (metas e rotina)</TabsTrigger>{fitfinder.podeLer && <TabsTrigger value="prestadores">Raio-x dos prestadores</TabsTrigger>}</TabsList><TabsContent value="base"><BaseOrganizacional /></TabsContent>{fitfinder.podeLer && <TabsContent value="prestadores"><RaioXPrestadores /></TabsContent>}<TabsContent value="cadeiras"><CadastroCadeiras /></TabsContent><TabsContent value="organograma"><OrganogramaAtual canEdit={canEdit} /></TabsContent><TabsContent value="fichas">
    {query.isPending ? <div role="status" className="flex items-center justify-center gap-2 py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />Carregando estrutura…</div>
      : query.isError ? <div role="alert" className="space-y-3 py-12 text-center"><p className="text-destructive">Não foi possível carregar a estrutura organizacional.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div>
      : <>
        {cadeiras.length > 0 && <section aria-label="Árvore organizacional" className="min-w-0 border-b pb-6"><ArvoreCadeiras nos={arvore} nomesMetas={nomesMetas} abrir={setId} /></section>}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
          <div className="relative self-end"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar cadeiras" placeholder="Buscar cadeiras" value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" /></div>
          <div className="min-w-0 space-y-1.5"><Label>Nível</Label><Select value={nivel} onValueChange={setNivel}><SelectTrigger aria-label="Nível"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{Object.entries(NIVEIS).map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <Table><TableHeader><TableRow>{["Cadeira", "Nível", "Cadeira superior", "Ocupante", "Missão", "Entregas", "Ativo"].map(c => <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>)}</TableRow></TableHeader><TableBody>
          {!filtradas.length ? <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">Nenhuma cadeira encontrada para os filtros</TableCell></TableRow> : filtradas.map(c => <TableRow key={c.id} onClick={() => setId(c.id)} className="cursor-pointer">
            <TableCell className="min-w-[200px] max-w-xs"><Button variant="link" className="h-auto whitespace-normal p-0 text-left font-semibold" aria-label={`Abrir ficha ${c.nome}`} onClick={e => { e.stopPropagation(); setId(c.id); }}>{c.nome}</Button></TableCell>
            <TableCell className="min-w-[130px]">{rotuloNivel(c.nivel)}</TableCell><TableCell className="min-w-[160px]">{c.cadeira_pai_id ? porId.get(c.cadeira_pai_id)?.nome || "—" : "—"}</TableCell><TableCell className="min-w-[150px] max-w-xs">{c.ocupante_nome || "—"}</TableCell>
            <TableCell className="min-w-[240px] max-w-sm"><p className="line-clamp-2">{c.missao || "—"}</p></TableCell><TableCell className="min-w-[240px] max-w-sm"><p className="line-clamp-2">{c.entregas || "—"}</p></TableCell><TableCell><Badge variant={c.ativo ? "secondary" : "outline"}>{c.ativo ? "Sim" : "Não"}</Badge></TableCell>
          </TableRow>)}
        </TableBody></Table>
      </>}
    </TabsContent></Tabs>
    <Sheet open={!!atual} onOpenChange={aberto => { if (!aberto) setId(null); }}><SheetContent className="h-full w-full overflow-y-auto sm:max-w-2xl">
      {atual && <><SheetHeader className="space-y-3 border-b pb-6 pr-5 text-left"><Badge variant="secondary" className="w-fit">{rotuloNivel(atual.nivel)}</Badge><SheetTitle className="break-words">{texto(atual.nome)}</SheetTitle><SheetDescription className="whitespace-pre-wrap break-words">{texto(atual.ocupante_nome)}</SheetDescription>
        <div className="space-y-2 text-sm"><p><span className="text-muted-foreground">Cadeira superior: </span>{texto(atual.cadeira_pai_id ? porId.get(atual.cadeira_pai_id)?.nome ?? null : null)}</p><p><span className="text-muted-foreground">Cadeira do sistema de metas: </span>{texto(atual.mt_cadeira_id ? nomesMetas.get(atual.mt_cadeira_id) ?? null : null)}</p></div>
       </SheetHeader>{canEdit && <Button className="mt-4" onClick={() => { setEditando(atual); setId(null); }}><Pencil className="mr-2 h-4 w-4" />Editar ficha</Button>}<div className="divide-y">{BLOCOS.map(({ titulo, campo }) => <section key={campo} className="py-5"><h3 className="mb-2 text-sm font-semibold text-muted-foreground">{titulo}</h3><div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{texto(typeof atual[campo] === "string" ? atual[campo] as string : null)}</div>{campo === "processos" && <p className="mt-3 text-xs text-muted-foreground">Numeração do Registro do Ian; pode divergir da matriz de processos do app</p>}</section>)}</div></>}
    </SheetContent></Sheet>
    {editando && <EditarCargo cargo={{ ...editando, parent_id: editando.cadeira_pai_id }} cargos={cadeiras.map(c => ({ ...c, parent_id: c.cadeira_pai_id }))} campos={BLOCOS.map(b => ({ campo: b.campo, titulo: b.titulo, valor: typeof editando[b.campo] === "string" ? String(editando[b.campo]) : null }))} fechar={() => setEditando(null)} salvar={async (v: CargoEdicao & Record<string, unknown>) => {
      if (!canEdit || !v.id) throw new Error("Sem permissão");
      const campos = Object.fromEntries(BLOCOS.map(b => [b.campo, v[b.campo]]));
      const { error } = await supabase.from("org_cadeiras").update({ ...campos, nome: v.nome, pessoa_id: v.pessoa_id ?? null, ocupante_nome: v.ocupante_nome, nivel: v.nivel, cadeira_pai_id: v.parent_id, ordem: v.ordem, ativo: v.ativo }).eq("id", v.id).select("id").single();
      if (error) throw error; await query.refetch();
    }} />}
  </div>;
}