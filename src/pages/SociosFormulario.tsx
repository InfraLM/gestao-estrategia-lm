import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Loader2, Lock, Plus, Save, Send, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMinhaResposta } from "@/hooks/useSocios";
import { useObjetivosKpis, kpiId, kpiObjetivo, kpiNome } from "@/hooks/useObjetivosKpis";
import { useConteudo } from "@/hooks/useConteudo";
import { EditarConteudo } from "@/components/EditarConteudo";
import GrupoMultiSelect from "@/components/socios/GrupoMultiSelect";
import { BlocoPergunta, Campo, Help, Opcoes, Regua, SelectSimples } from "@/components/socios/Campos";
import { CONTEXTO_2027, CardContexto } from "@/data/sociosContexto2027";
import {
  PERGUNTA, INVEST_ITENS, PAPEIS, TEMPOS, JANELAS_VENDA, HORIZONTES, PAPEL_FIM, CADENCIAS, CONSEQUENCIAS, LINHAS_VERMELHAS,
  PRAZO_TEXTO, FormDados, Respostas, Diretriz, Projeto, calcularEixos, posicionamento, escolhas, tensoes, objetivosSugeridos,
  diretrizesSugeridas, validarEnvio, prazoAberto, statusExibido,
  normalizar, financia, FIN_APOSTAS, FIN_CRITERIOS, ACOES_PRODUTO, PRODUTOS_2027, PORTFOLIO_VERSAO, ProdutoInfo,
} from "@/lib/sociosTradeoff";

const ETAPAS = ["Contexto", "Estratégia", "Caixa e sociedade", "Prioridade 2027", "Seu trade-off", "Diretrizes e projetos"];
const VAZIO: FormDados = { respostas: {}, diretrizes: [], projetos: [], extras: {} };

export default function SociosFormulario() {
  const q = useMinhaResposta();
  return <FormularioSocio q={q} />;
}

export function FormularioSocio({ q }: { q: any }) {
  const { grupos, objetivos, nomeObjetivo } = useObjetivosKpis();
  const contexto = useConteudo<CardContexto[]>("socios.contexto2027", CONTEXTO_2027).data;
  const produtosInfo = useConteudo<ProdutoInfo[]>("socios.produtos2027", PRODUTOS_2027).data ?? PRODUTOS_2027;
  const [etapa, setEtapa] = useState(1);
  const [d, setD] = useState<FormDados>(VAZIO);
  const [carregado, setCarregado] = useState(false);
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pend, setPend] = useState<Set<string>>(new Set());
  const sujo = useRef(false);
  const timer = useRef<number>();

  const row = q.data?.resposta;
  const aberto = prazoAberto(new Date(), row?.reaberto_ate);
  const previa = !q.data?.participante?.respondente && !!q.data?.participante?.pode_ver_consolidado;

  useEffect(() => {
    if (carregado || !q.data) return;
    if (row) setD({ respostas: normalizar(row.respostas), diretrizes: row.diretrizes ?? [], projetos: row.projetos ?? [], extras: row.extras ?? {} });
    setCarregado(true);
  }, [q.data, row, carregado]);

  const salvar = useCallback(async (silencioso = true) => {
    if (!aberto || previa) return;
    setSalvando(true);
    try { await q.salvar(dRef.current); sujo.current = false; setSalvoEm(new Date()); if (!silencioso) toast.success("Rascunho salvo"); }
    catch (e: any) { toast.error(e.message ?? "Erro ao salvar"); }
    finally { setSalvando(false); }
  }, [aberto, previa, q]);
  const dRef = useRef(d); dRef.current = d;

  const mudar = (fn: (x: FormDados) => FormDados) => {
    setD(prev => fn(prev));
    sujo.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => salvar(), 1500);
  };
  const setR = (k: string, v: any) => mudar(x => ({ ...x, respostas: { ...x.respostas, [k]: v } }));
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const irPara = (n: number) => { if (sujo.current) salvar(); setEtapa(n); window.scrollTo({ top: 0 }); };

  const r = d.respostas as Respostas;
  const eixos = useMemo(() => calcularEixos(r), [r]);
  const objetivoOpcoes = useMemo(() => grupos.map(g => ({ grupo: g.nome, opcoes: g.objetivos.map(o => ({ value: o.codigo, label: `${o.codigo} ${o.nome}` })) })), [grupos]);
  const kpiOpcoes = (objs: string[]) => objetivos.filter(o => objs.includes(o.codigo)).map(o => ({ grupo: `${o.codigo} ${o.nome}`, opcoes: o.kpis.map(k => ({ value: kpiId(o.codigo, k.kpi), label: k.kpi, tag: k.nivel })) }));

  const enviar = async () => {
    if (previa) { toast.info("Modo prévia: o envio é feito pelos sócios."); return; }
    const p = validarEnvio(d);
    setPend(new Set(p.map(x => x.campo)));
    if (p.length) {
      toast.error(`Faltam ${p.length} item(ns): ${p[0].msg}`);
      setEtapa(p[0].etapa);
      setTimeout(() => document.getElementById(`q-${p[0].campo}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      return;
    }
    try { window.clearTimeout(timer.current); await q.enviar(d); sujo.current = false; toast.success("Formulário enviado. Você ainda pode editar e reenviar até o prazo."); }
    catch (e: any) { toast.error(e.message ?? "Erro ao enviar"); }
  };

  if (q.isPending || !carregado) return <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!q.data?.participante?.respondente && !previa) return <div className="py-16 text-center text-muted-foreground">Este formulário é exclusivo dos sócios respondentes.</div>;

  const dis = !aberto;
  const status = statusExibido(row);
  const alteradoAposEnvio = row?.enviado_em && row.updated_at && new Date(row.updated_at).getTime() - new Date(row.enviado_em).getTime() > 2000;
  const lv = r.lv ?? {};
  const setLv = (id: string, patch: any) => setR("lv", { ...lv, [id]: { ...lv[id], ...patch } });
  const invest = r.invest?.length === INVEST_ITENS.length ? r.invest : INVEST_ITENS.map(i => i.v);
  const moverInvest = (i: number, dir: -1 | 1) => { const a = [...invest]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; mudar(x => ({ ...x, respostas: { ...x.respostas, invest: a, invest_ok: false } })); };
  const setDiretriz = (i: number, patch: Partial<Diretriz>) => mudar(x => ({ ...x, diretrizes: x.diretrizes.map((y, j) => j === i ? { ...y, ...patch } : y) }));
  const setProjeto = (i: number, patch: Partial<Projeto>) => mudar(x => ({ ...x, projetos: x.projetos.map((y, j) => j === i ? { ...y, ...patch } : y) }));
  const moverProjeto = (i: number, dir: -1 | 1) => mudar(x => { const a = [...x.projetos]; const j = i + dir; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, projetos: a }; });
  const resultados = r.resultados ?? ["", "", ""];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <Card className="sticky top-0 z-20">
        <CardContent className="py-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Quem está respondendo</div>
              <div className="text-lg font-semibold">{previa ? "Prévia — visão do sócio" : q.data.participante.nome_exibicao}</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={status === "Enviado" ? "default" : "outline"}>{status}{row?.versao ? ` · v${row.versao}` : ""}</Badge>
              <span className="text-muted-foreground">Devolução até {PRAZO_TEXTO}</span>
              {salvando ? <span className="text-muted-foreground">Salvando…</span> : salvoEm && <span className="text-muted-foreground">Salvo às {salvoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {ETAPAS.map((e, i) => (
              <button key={e} type="button" onClick={() => irPara(i + 1)} className={cn("rounded-full px-3 py-1 text-xs border", etapa === i + 1 ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>{i + 1} {e}</button>
            ))}
          </nav>
          {previa && <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">Modo prévia: você vê o formulário exatamente como os sócios. Pode clicar e preencher para testar, mas nada é salvo nem enviado.</div>}
          {dis && <div className="flex items-center gap-2 text-sm text-destructive"><Lock className="h-4 w-4" /> Prazo encerrado. O formulário está em modo leitura; peça reabertura à Naira ou ao Ian.</div>}
          {alteradoAposEnvio && !dis && <div className="text-xs text-warning">Há alterações salvas depois do último envio. Envie de novo para registrar.</div>}
        </CardContent>
      </Card>

      {etapa === 1 && (
        <div className="space-y-4">
          <div className="flex justify-end"><EditarConteudo chave="socios.contexto2027" padrao={CONTEXTO_2027} titulo="Contexto 2027" /></div>
          <div className="grid gap-4 md:grid-cols-2">
            {contexto.map(c => (
              <Card key={c.titulo}><CardHeader className="pb-2"><CardTitle className="text-base">{c.titulo}</CardTitle></CardHeader>
                <CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{c.itens.map(i => <li key={i}>{i}</li>)}</ul></CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {etapa === 2 && (
        <div className="space-y-4">
          <BlocoPergunta p={PERGUNTA.motor} value={r.motor} onChange={v => setR("motor", v)} disabled={dis} pendente={pend.has("motor") && !r.motor}>
            <Campo label="Por quê?"><Textarea value={r.motor_porque ?? ""} onChange={e => setR("motor_porque", e.target.value)} disabled={dis} /></Campo>
          </BlocoPergunta>
          <BlocoPergunta p={PERGUNTA.principio} value={r.principio} onChange={v => setR("principio", v)} disabled={dis} pendente={pend.has("principio") && !r.principio}>
            <Campo label="O que mudaria / qual seria seu critério"><Textarea value={r.principio_obs ?? ""} onChange={e => setR("principio_obs", e.target.value)} disabled={dis} /></Campo>
          </BlocoPergunta>
          <BlocoPergunta p={PERGUNTA.ritmo} value={r.ritmo} onChange={v => setR("ritmo", v)} disabled={dis} pendente={pend.has("ritmo") && !r.ritmo}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Crescimento mínimo de receita (%)"><Input type="number" value={r.cresc_min ?? ""} onChange={e => setR("cresc_min", e.target.value)} disabled={dis} /></Campo>
              <Campo label="Margem líquida mínima (%)"><Input type="number" value={r.margem_min ?? ""} onChange={e => setR("margem_min", e.target.value)} disabled={dis} /></Campo>
            </div>
            {financia(r) && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo label="Qual iniciativa seria a primeira candidata a financiamento?"><SelectSimples opcoes={FIN_APOSTAS} value={r.fin_aposta} onChange={v => setR("fin_aposta", v)} disabled={dis} /></Campo>
                  <Campo label="Teto total do financiamento (R$)"><Input type="number" value={r.fin_teto ?? ""} onChange={e => setR("fin_teto", e.target.value)} disabled={dis} /></Campo>
                </div>
                <div className="text-sm font-medium">Para liberar o financiamento, eu exijo:</div>
                {[...new Set(FIN_CRITERIOS.map(c => c.grupo))].map(g => (
                  <div key={g} className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground">{g}</div>
                    {FIN_CRITERIOS.filter(c => c.grupo === g).map(c => {
                      const v = r.fin_criterios?.[c.id] ?? {};
                      const set = (patch: any) => setR("fin_criterios", { ...(r.fin_criterios ?? {}), [c.id]: { ...v, ...patch } });
                      return (
                        <label key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <Checkbox checked={!!v.on} onCheckedChange={x => set({ on: !!x })} disabled={dis} />
                          <span className="flex-1 min-w-[12rem]">{c.label}</span>
                          {c.unidade && <Input type="number" step="0.1" className="h-8 w-24" aria-label={c.label} value={v.valor ?? ""} onChange={e => set({ valor: e.target.value, on: true })} disabled={dis} />}
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </BlocoPergunta>
          <BlocoPergunta p={PERGUNTA.portfolio} value={r.portfolio} onChange={v => mudar(x => ({ ...x, respostas: { ...x.respostas, portfolio: v, portfolio_v: PORTFOLIO_VERSAO } }))} disabled={dis} pendente={pend.has("portfolio") && !r.portfolio}>
            <div className="space-y-2">
              <div className="text-sm font-medium">O que fazer com cada produto em 2027:</div>
              {produtosInfo.map(p => (
                <div key={p.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_10rem] sm:items-start">
                  <div><div className="font-medium text-sm">{p.nome}</div>
                    <ul className="text-xs text-muted-foreground space-y-0.5">{p.resultados.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                  <SelectSimples opcoes={ACOES_PRODUTO} value={r.produtos?.[p.id]} onChange={v => setR("produtos", { ...(r.produtos ?? {}), [p.id]: v })} disabled={dis} />
                </div>
              ))}
            </div>
            {(r.portfolio === "C" || r.portfolio === "D") && (
              <Campo label="Qual produto você testaria ou lançaria primeiro, com qual teto, prazo e critério de sucesso? (na opção D, indique também o tamanho do orçamento fantasma) — opcional"><Textarea value={r.produto_novo ?? ""} onChange={e => setR("produto_novo", e.target.value)} disabled={dis} /></Campo>
            )}
            <Campo label="Comentário sobre o portfólio (algum produto que você nunca encerraria?)"><Input value={r.portfolio_obs ?? ""} onChange={e => setR("portfolio_obs", e.target.value)} disabled={dis} /></Campo>
          </BlocoPergunta>
          <BlocoPergunta p={PERGUNTA.trafego} value={r.trafego} onChange={v => setR("trafego", v)} disabled={dis} pendente={pend.has("trafego") && !r.trafego}>
            <Campo label="Comentário (opcional)"><Input value={r.trafego_obs ?? ""} onChange={e => setR("trafego_obs", e.target.value)} disabled={dis} /></Campo>
          </BlocoPergunta>
          <BlocoPergunta p={PERGUNTA.novo} value={r.novo} onChange={v => setR("novo", v)} disabled={dis} pendente={pend.has("novo") && !r.novo}
            nota={r.motor === "A" ? <p className="text-xs text-muted-foreground">Opcional para você, pois escolheu só Motor 1.</p> : undefined}>
            <Campo label="Primeira aposta do Motor 2"><Input value={r.novo_aposta ?? ""} onChange={e => setR("novo_aposta", e.target.value)} disabled={dis} /></Campo>
            <Campo label="Quem lidera o novo e quem fica 100% no core"><Textarea value={r.novo_lider ?? ""} onChange={e => setR("novo_lider", e.target.value)} disabled={dis} /></Campo>
          </BlocoPergunta>
          <Card id="q-invest" className={cn(pend.has("invest") && !r.invest_ok && "border-destructive")}>
            <CardHeader className="pb-3"><CardTitle className="text-base">7. Onde investir R$ 1 mi</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Help>Ordene do mais prioritário (1º) para o menos prioritário (6º).</Help>
              <ol className="space-y-1.5">
                {invest.map((v, i) => (
                  <li key={v} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <span className="w-6 text-center font-bold text-primary">{i + 1}º</span>
                    <span className="flex-1">{INVEST_ITENS.find(x => x.v === v)?.label}</span>
                    <Button size="icon" variant="ghost" aria-label="Subir" disabled={dis || i === 0} onClick={() => moverInvest(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Descer" disabled={dis || i === invest.length - 1} onClick={() => moverInvest(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  </li>
                ))}
              </ol>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!r.invest_ok} disabled={dis} onCheckedChange={c => mudar(x => ({ ...x, respostas: { ...x.respostas, invest, invest_ok: !!c } }))} />
                Esta ordem reflete minha prioridade
              </label>
            </CardContent>
          </Card>
        </div>
      )}

      {etapa === 3 && (
        <div className="space-y-4">
          <BlocoPergunta p={PERGUNTA.caixa_min} value={r.caixa_min} onChange={v => setR("caixa_min", v)} disabled={dis} pendente={pend.has("caixa_min") && !r.caixa_min} />
          <BlocoPergunta p={PERGUNTA.divida} value={r.divida} onChange={v => setR("divida", v)} disabled={dis} pendente={pend.has("divida") && !r.divida}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Custo máximo (% a.m.)"><Input type="number" step="0.01" value={r.divida_custo ?? ""} onChange={e => setR("divida_custo", e.target.value)} disabled={dis} /></Campo>
              <Campo label="Limite em R$ (opcional)"><Input type="number" value={r.divida_limite ?? ""} onChange={e => setR("divida_limite", e.target.value)} disabled={dis} /></Campo>
            </div>
          </BlocoPergunta>
          <BlocoPergunta p={PERGUNTA.ddl} value={r.ddl} onChange={v => setR("ddl", v)} disabled={dis} pendente={pend.has("ddl") && !r.ddl}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Valor mensal desejado (R$)"><Input type="number" value={r.ddl_valor ?? ""} onChange={e => setR("ddl_valor", e.target.value)} disabled={dis} /></Campo>
              <Campo label="Cadência"><SelectSimples opcoes={CADENCIAS} value={r.ddl_cadencia} onChange={v => setR("ddl_cadencia", v)} disabled={dis} /></Campo>
            </div>
            <Campo label="Observações"><Textarea value={r.ddl_obs ?? ""} onChange={e => setR("ddl_obs", e.target.value)} disabled={dis} /></Campo>
          </BlocoPergunta>
          <BlocoPergunta p={PERGUNTA.venda} value={r.venda} onChange={v => setR("venda", v)} disabled={dis} pendente={pend.has("venda") && !r.venda}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo label="Janela de venda"><SelectSimples opcoes={JANELAS_VENDA} value={r.venda_janela} onChange={v => setR("venda_janela", v)} disabled={dis} /></Campo>
              <Campo label="Horizonte ativo na LM"><SelectSimples opcoes={HORIZONTES} value={r.horizonte} onChange={v => setR("horizonte", v)} disabled={dis} /></Campo>
              <Campo label="Papel no fim do horizonte"><SelectSimples opcoes={PAPEL_FIM} value={r.papel_fim} onChange={v => setR("papel_fim", v)} disabled={dis} /></Campo>
            </div>
            <Campo label="Condições de venda (opcional)"><Textarea value={r.venda_cond ?? ""} onChange={e => setR("venda_cond", e.target.value)} disabled={dis} /></Campo>
          </BlocoPergunta>
          <BlocoPergunta p={PERGUNTA.sucessao} value={r.sucessao} onChange={v => setR("sucessao", v)} disabled={dis} pendente={pend.has("sucessao") && !r.sucessao}>
            <Campo label="Critério de valuation"><Input value={r.sucessao_val ?? ""} onChange={e => setR("sucessao_val", e.target.value)} disabled={dis} /></Campo>
          </BlocoPergunta>
        </div>
      )}

      {etapa === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">13. Três resultados não financeiros para 2027</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[0, 1, 2].map(i => <Input key={i} placeholder={`Resultado ${i + 1}`} value={resultados[i] ?? ""} disabled={dis} onChange={e => { const a = [...resultados]; a[i] = e.target.value; setR("resultados", a); }} />)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">14. Seu papel em 2027</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Opcoes name="Papel em 2027" opcoes={PAPEIS} value={r.papel_tipo} onChange={v => setR("papel_tipo", v)} disabled={dis} />
              <Campo label="Escopo (áreas, entregas, metas)"><Textarea value={r.papel_escopo ?? ""} onChange={e => setR("papel_escopo", e.target.value)} disabled={dis} /></Campo>
              <Campo label="Tempo dedicado"><SelectSimples opcoes={TEMPOS} value={r.tempo} onChange={v => setR("tempo", v)} disabled={dis} /></Campo>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">15. Linhas vermelhas e preocupações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Help>Linha vermelha é um limite que, se cruzado, faria você votar contra o plano.</Help>
              {[...new Set(LINHAS_VERMELHAS.map(l => l.grupo))].map(g => (
                <div key={g} className="space-y-2">
                  <div className="text-sm font-semibold">{g}</div>
                  {LINHAS_VERMELHAS.filter(l => l.grupo === g).map(l => (
                    <div key={l.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <Checkbox id={`lv-${l.id}`} checked={!!lv[l.id]?.on} disabled={dis} onCheckedChange={c => setLv(l.id, { on: !!c })} />
                      <label htmlFor={`lv-${l.id}`} className="flex-1 min-w-[200px]">{l.label}</label>
                      {l.unidade && lv[l.id]?.on && <Input type="number" step="0.01" className="w-32" placeholder={l.unidade} value={lv[l.id]?.valor ?? ""} disabled={dis} onChange={e => setLv(l.id, { valor: e.target.value })} />}
                    </div>
                  ))}
                </div>
              ))}
              <Campo label="Se uma linha vermelha for cruzada"><Opcoes name="Consequência" opcoes={CONSEQUENCIAS} value={r.lv_consequencia} onChange={v => setR("lv_consequencia", v)} disabled={dis} /></Campo>
              <Campo label="Qual é a mais inegociável e o limite exato"><Textarea value={r.lv_inegociavel ?? ""} onChange={e => setR("lv_inegociavel", e.target.value)} disabled={dis} /></Campo>
              <Campo label="O que me preocupa e não foi perguntado (opcional)"><Textarea value={r.lv_preocupacao ?? ""} onChange={e => setR("lv_preocupacao", e.target.value)} disabled={dis} /></Campo>
            </CardContent>
          </Card>
        </div>
      )}

      {etapa === 5 && <TradeOff r={r} eixos={eixos} nomeObjetivo={nomeObjetivo} />}

      {etapa === 6 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Pontos de partida</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Help>Diretrizes sugeridas a partir das suas respostas. Clique em "Usar" para trazer e ajustar.</Help>
              {diretrizesSugeridas(r).map(s => (
                <div key={s.texto} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <div className="flex-1">{s.texto}<div className="mt-1 flex flex-wrap gap-1">{s.objetivos.map(o => <Badge key={o} variant="outline" className="text-[10px]">{o}</Badge>)}</div></div>
                  <Button size="sm" variant="outline" disabled={dis || d.diretrizes.some(x => x.texto === s.texto)} onClick={() => mudar(x => ({ ...x, diretrizes: [...x.diretrizes, { ...s }] }))}>Usar</Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card id="q-diretrizes" className={cn(pend.has("diretrizes") && !d.diretrizes.some(x => x.texto?.trim()) && "border-destructive")}>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Diretrizes <span className="text-xs font-normal text-muted-foreground">(obrigatório: pelo menos 1)</span></CardTitle>
              <Button size="sm" variant="outline" disabled={dis} onClick={() => mudar(x => ({ ...x, diretrizes: [...x.diretrizes, { texto: "", objetivos: [] }] }))}><Plus className="h-4 w-4 mr-1" />Diretriz</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {!d.diretrizes.length && <p className="text-sm text-muted-foreground">Nenhuma diretriz ainda.</p>}
              {d.diretrizes.map((x, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex gap-2"><Textarea placeholder="Diretriz" value={x.texto} disabled={dis} onChange={e => setDiretriz(i, { texto: e.target.value })} />
                    <Button size="icon" variant="ghost" aria-label="Remover diretriz" disabled={dis} onClick={() => mudar(y => ({ ...y, diretrizes: y.diretrizes.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /></Button></div>
                  <Campo label="Objetivos estratégicos"><GrupoMultiSelect grupos={objetivoOpcoes} value={x.objetivos} onChange={v => setDiretriz(i, { objetivos: v })} placeholder="Selecione objetivos" disabled={dis} chip={v => v} /></Campo>
                  <Campo label="Por quê (opcional)"><Input value={x.porque ?? ""} disabled={dis} onChange={e => setDiretriz(i, { porque: e.target.value })} /></Campo>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Projetos estratégicos <span className="text-xs font-normal text-muted-foreground">(opcional, até 5, em ordem de prioridade)</span></CardTitle>
              <Button size="sm" variant="outline" disabled={dis || d.projetos.length >= 5} onClick={() => mudar(x => ({ ...x, projetos: [...x.projetos, { nome: "", objetivos: [], kpis: [] }] }))}><Plus className="h-4 w-4 mr-1" />Projeto</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Help>Inclua projetos só se houver clareza. Os KPIs mostrados são os estratégicos e táticos dos objetivos marcados.</Help>
              {d.projetos.map((x, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 font-bold text-primary">{i + 1}º</span>
                    <Input placeholder="Nome do projeto" value={x.nome} disabled={dis} onChange={e => setProjeto(i, { nome: e.target.value })} />
                    <Button size="icon" variant="ghost" aria-label="Subir projeto" disabled={dis || i === 0} onClick={() => moverProjeto(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Descer projeto" disabled={dis || i === d.projetos.length - 1} onClick={() => moverProjeto(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Remover projeto" disabled={dis} onClick={() => mudar(y => ({ ...y, projetos: y.projetos.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Campo label="Objetivos"><GrupoMultiSelect grupos={objetivoOpcoes} value={x.objetivos} disabled={dis} chip={v => v} placeholder="Selecione objetivos"
                      onChange={v => setProjeto(i, { objetivos: v, kpis: x.kpis.filter(k => v.includes(kpiObjetivo(k))) })} /></Campo>
                    <Campo label="KPIs que deve mover"><GrupoMultiSelect grupos={kpiOpcoes(x.objetivos)} value={x.kpis} disabled={dis || !x.objetivos.length} chip={kpiNome}
                      placeholder={x.objetivos.length ? "Selecione KPIs" : "Marque objetivos primeiro"} onChange={v => setProjeto(i, { kpis: v })} /></Campo>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Campo label="Outro KPI (livre)"><Input value={x.kpi_outro ?? ""} disabled={dis} onChange={e => setProjeto(i, { kpi_outro: e.target.value })} /></Campo>
                    <Campo label="Esforço"><SelectSimples opcoes={[{ v: "Baixo", label: "Baixo" }, { v: "Médio", label: "Médio" }, { v: "Alto", label: "Alto" }]} value={x.esforco} disabled={dis} onChange={v => setProjeto(i, { esforco: v })} /></Campo>
                    <Campo label="Diretoria dona / áreas"><Input value={x.dono ?? ""} disabled={dis} onChange={e => setProjeto(i, { dono: e.target.value })} /></Campo>
                  </div>
                  <Campo label="Problema e resultado esperado"><Textarea value={x.problema ?? ""} disabled={dis} onChange={e => setProjeto(i, { problema: e.target.value })} /></Campo>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Campo label="O que parar ou reduzir em 2027 (opcional)"><Textarea value={d.extras.parar ?? ""} disabled={dis} onChange={e => mudar(x => ({ ...x, extras: { ...x.extras, parar: e.target.value } }))} /></Campo>
              <Campo label="Comentários livres (opcional)"><Textarea value={d.extras.comentarios ?? ""} disabled={dis} onChange={e => mudar(x => ({ ...x, extras: { ...x.extras, comentarios: e.target.value } }))} /></Campo>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30 border-t bg-card/95 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 p-3">
          <Button variant="outline" disabled={etapa === 1} onClick={() => irPara(etapa - 1)}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
          <div className="flex gap-2">
            <Button variant="outline" disabled={dis || salvando} onClick={() => salvar(false)}><Save className="h-4 w-4 mr-1" />Salvar</Button>
            {etapa < 6 ? <Button onClick={() => irPara(etapa + 1)}>Próximo<ChevronRight className="h-4 w-4 ml-1" /></Button>
              : <Button disabled={dis} onClick={enviar}><Send className="h-4 w-4 mr-1" />{row?.versao ? "Reenviar" : "Enviar"}</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TradeOff({ r, eixos, nomeObjetivo }: { r: Respostas; eixos: ReturnType<typeof calcularEixos>; nomeObjetivo: (c: string) => string }) {
  const pos = posicionamento(r, eixos);
  const t = tensoes(r);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Seu posicionamento</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {pos ? <div><div className="text-xl font-semibold text-primary">{pos.titulo}</div>{pos.frase && <p className="text-sm text-muted-foreground">{pos.frase}</p>}</div>
            : <p className="text-sm text-muted-foreground">Responda as perguntas de Motor e de caixa para ver seu posicionamento.</p>}
          <Regua esquerda="Foco no core" direita="Abrir Motor 2" marcadores={[{ nome: "Você", valor: eixos.core }]} />
          <Regua esquerda="Preservar caixa" direita="Acelerar" marcadores={[{ nome: "Você", valor: eixos.caixa }]} />
          <Regua esquerda="Reinvestir" direita="Retorno aos sócios" marcadores={[{ nome: "Você", valor: eixos.retorno }]} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Você escolhe / você abre mão de</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y text-sm">
            {escolhas(r).map(e => (
              <div key={e.tema} className="grid grid-cols-[100px_1fr_1fr] gap-3 py-2"><span className="font-medium">{e.tema}</span><span className="text-success">{e.escolhe}</span><span className="text-muted-foreground">{e.abre}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Tensões</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!t.length && <p className="text-sm text-muted-foreground">Nenhuma tensão identificada nas suas respostas.</p>}
          {t.map(x => <div key={x} className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-2 text-sm"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />{x}</div>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Objetivos do BSC sugeridos</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {objetivosSugeridos(r).map(c => <Badge key={c} variant="outline">{c} · {nomeObjetivo(c)}</Badge>)}
        </CardContent>
      </Card>
    </div>
  );
}
