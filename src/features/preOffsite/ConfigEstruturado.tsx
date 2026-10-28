import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Archive, ArchiveRestore, Eye, History, Plus, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfigEditor from './ConfigEditor';
import { db, type usePreOffsite } from './usePreOffsite';
import type { Campo, Config, Item, Pergunta } from './config';
import {
  CAMPOS_4A, CAMPOS_RISCOS, LISTAS_FIXAS, ROTULO_LISTA, aplicarMapeamentos, contarUsos, novoIdItem, novoIdPergunta,
  restaurarComoRascunho, resumoMudancas, validarRascunho, type ListaFixa, type Mapeamento,
} from './editorConfig';

type Dados = NonNullable<ReturnType<typeof usePreOffsite>['data']>;
type Sel = { t: 'textos' } | { t: 'pergunta'; b: number; id: string } | { t: 'lista'; k: ListaFixa } | { t: 'caixas' } | { t: 'campos4A' } | { t: 'camposRiscos' } | { t: 'historico' };
type Ctx = { bloco: number; pergunta: string; usos: (alvo: Parameters<typeof contarUsos>[3]) => number; mapear: (m: Omit<Mapeamento, 'pergunta' | 'bloco'>) => void; diretores: string[] };

const TIPOS_CAMPO: Campo['tipo'][] = ['texto', 'curto', 'quantidade', 'numero', 'mes', 'escolha', 'objetivo', 'kpi', 'cadeira', 'processo', 'diretriz', 'projeto'];
const ROTULO_TIPO: Record<string, string> = { texto: 'Texto longo', curto: 'Texto curto', quantidade: 'Quantidade', numero: 'Número', mes: 'Mês', escolha: 'Lista suspensa', objetivo: 'Objetivo (cadastro)', kpi: 'KPI (cadastro)', cadeira: 'Cadeira (cadastro)', processo: 'Processo (cadastro)', diretriz: 'Diretriz (lista fixa)', projeto: 'Projeto (lista fixa)' };
const CADASTRO: Record<string, string> = { objetivo: 'Metas › BSC (objetivos)', kpi: 'Metas › BSC (indicadores)', cadeira: 'Estrutura organizacional', processo: 'Processos', diretriz: 'Listas fixas › Diretrizes, aqui mesmo', projeto: 'Listas fixas › Projetos da 4A, aqui mesmo' };
const TIPOS_PERGUNTA_B0 = ['matriz', 'lista', 'multipla', 'frase'];
const TIPOS_PERGUNTA = ['texto', 'escolha', 'multipla', 'lista', 'grupo'];
const ESTRUTURA_FIXA: Record<string, string> = {
  '3.2': 'Usa a lista de diretrizes (Listas fixas). Os botões Concordo / Ajustaria / Discordo continuam definidos no código.',
  '3.3': 'Detalha as 3 diretrizes escolhidas na 3.2; os campos continuam definidos no código.',
  '3.4': 'Mostra as diretrizes marcadas como Ajustaria ou Discordo; estrutura definida no código.',
  '3.5': 'Objetivos vêm do cadastro; estrutura definida no código.',
  '4A': 'Os projetos vêm de Listas fixas › Projetos da 4A e os campos de cada projeto de “Campos dos projetos da 4A”.',
  '4.1': 'As opções são os projetos da 4A. O limite abaixo define quantos o diretor escolhe.',
  '4.2': 'As opções são os projetos da 4A.',
  '4C': 'Os produtos vêm de Listas fixas › Produtos; as posições continuam definidas no código.',
  '5.riscos': 'Uma ficha por grande escolha (Listas fixas) com os campos de “Campos dos riscos do bloco 5”.',
};
const sel = 'block w-full border rounded-md p-2 bg-background text-sm';
const mover = <T,>(a: T[], i: number, d: number) => { const j = i + d; if (j < 0 || j >= a.length) return a; const n = [...a]; [n[i], n[j]] = [n[j], n[i]]; return n; };
const limpo = (o: any) => JSON.parse(JSON.stringify(o));

type Pedido = { titulo: string; atual: string; usos: number; aplicar: (novo: string, migrar: boolean) => void } | null;
type Remocao = { titulo: string; usos: number; aplicar: () => void } | null;

export default function ConfigEstruturado({ data, reload }: { data: Dados; reload: () => unknown }) {
  const base = data.configBruta as Config;
  const baseAt = data.configAtualizadaEm as string;
  const diretores = useMemo(() => [...new Set((data.refs.respondentes ?? []).map((x: any) => x.diretor_nome).filter(Boolean))] as string[], [data.refs.respondentes]);
  const [draft, setDraft] = useState<Config>(() => limpo(base));
  const [mapas, setMapas] = useState<Mapeamento[]>([]);
  const [rascunhoEm, setRascunhoEm] = useState<string | null>(null);
  const [rascunhoBase, setRascunhoBase] = useState<string | null>(null);
  const [sujo, setSujo] = useState(false);
  const [s, setS] = useState<Sel>({ t: 'pergunta', b: 0, id: base.perguntas[0][0]?.id });
  const [busy, setBusy] = useState(false);
  const [pedido, setPedido] = useState<Pedido>(null);
  const [nomeNovo, setNomeNovo] = useState('');
  const [remocao, setRemocao] = useState<Remocao>(null);
  const [publicar, setPublicar] = useState(false);
  const [versoes, setVersoes] = useState<any[] | null>(null);

  useEffect(() => { void (async () => {
    const r = await db.from('offsite_config_rascunhos').select('*').eq('id', '2027').maybeSingle();
    if (r.data) { setDraft({ ...limpo(base), ...r.data.conteudo }); setMapas(r.data.mapeamentos ?? []); setRascunhoEm(r.data.atualizado_em); setRascunhoBase(r.data.base_atualizado_em); }
  })(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const erros = useMemo(() => validarRascunho(draft, base, diretores), [draft, base, diretores]);
  const mudar = (fn: (c: Config) => Config) => { setDraft(c => fn(limpo(c))); setSujo(true); };
  const rs = data.respostas;
  const ctxDe = (b: number, id: string): Ctx => ({ bloco: b, pergunta: id, diretores, usos: alvo => contarUsos(rs, b, id, alvo, draft), mapear: m => { setMapas(x => [...x, { ...m, bloco: b, pergunta: id }]); setSujo(true); } });
  const renomear = (titulo: string, atual: string, usos: number, aplicar: (novo: string, migrar: boolean) => void) => { setNomeNovo(atual); setPedido({ titulo, atual, usos, aplicar }); };
  const remover = (titulo: string, usos: number, aplicar: () => void) => (usos > 0 ? setRemocao({ titulo, usos, aplicar }) : aplicar());

  const act = async (fn: () => Promise<void>) => { if (busy) return; setBusy(true); try { await fn(); } catch (e: any) { toast.error(e.message ?? 'Não foi possível concluir'); } finally { setBusy(false); } };
  const salvarRascunho = () => act(async () => {
    if (erros.length) throw new Error(`Corrija ${erros.length} problema(s) antes de salvar.`);
    const atual = await db.from('offsite_config_rascunhos').select('atualizado_em').eq('id', '2027').maybeSingle();
    if (atual.data && atual.data.atualizado_em !== rascunhoEm && !window.confirm('Outra pessoa salvou o rascunho depois que você abriu. Substituir pela sua versão?')) return;
    const agora = new Date().toISOString();
    const x = await db.from('offsite_config_rascunhos').upsert({ id: '2027', conteudo: draft, mapeamentos: mapas, base_atualizado_em: rascunhoBase ?? baseAt, autor: data.userId, atualizado_em: agora });
    if (x.error) throw x.error;
    setRascunhoEm(agora); setRascunhoBase(rascunhoBase ?? baseAt); setSujo(false); toast.success('Rascunho salvo. Os diretores ainda veem a versão publicada.');
  });
  const previa = async () => { if (sujo) await salvarRascunho(); window.open('/pre-offsite?previa=rascunho', '_blank', 'noopener'); };
  const descartar = () => act(async () => {
    if (!window.confirm('Descartar o rascunho e voltar para a versão publicada?')) return;
    const x = await db.from('offsite_config_rascunhos').delete().eq('id', '2027'); if (x.error) throw x.error;
    setDraft(limpo(base)); setMapas([]); setRascunhoEm(null); setRascunhoBase(null); setSujo(false); toast.success('Rascunho descartado');
  });
  const migracoes = useMemo(() => rs.map(r => ({ id: r.id, revisao: r.revisao, antes: r.respostas, respostas: aplicarMapeamentos(r.respostas, mapas, draft) })).filter(x => JSON.stringify(x.antes) !== JSON.stringify(x.respostas)), [rs, mapas, draft]);
  const confirmarPublicacao = () => act(async () => {
    if (erros.length) throw new Error('Há problemas de validação.');
    if (rascunhoBase && rascunhoBase !== baseAt) throw new Error('A versão publicada mudou depois que este rascunho foi criado. Descarte o rascunho ou recarregue.');
    const x = await db.rpc('offsite_config_publicar', { _conteudo: draft, _base: baseAt, _respostas: migracoes.map(({ id, revisao, respostas }) => ({ id, revisao, respostas })) });
    if (x.error) throw x.error;
    setPublicar(false); setSujo(false); setMapas([]); setRascunhoEm(null); setRascunhoBase(null);
    toast.success(`Formulário publicado${migracoes.length ? ` · ${migracoes.length} resposta(s) migrada(s)` : ''}`); reload();
  });
  const abrirVersoes = () => act(async () => {
    const x = await db.from('offsite_historico').select('id,criado_em,acao,ator,depois').is('resposta_id', null).in('acao', ['configuracao', 'publicacao_config']).order('criado_em', { ascending: false }).limit(15);
    if (x.error) throw x.error; setVersoes(x.data); setS({ t: 'historico' });
  });
  const restaurar = (v: any) => { const antiga = { ...limpo(base), ...(v.depois?.conteudo ?? {}) } as Config; mudar(() => restaurarComoRascunho(antiga, base)); setMapas([]); toast.success('Versão carregada no rascunho. Confira, salve e publique para aplicar.'); };

  // ---- question helpers
  const pergunta = s.t === 'pergunta' ? draft.perguntas[s.b]?.find(p => p.id === s.id) : undefined;
  const setPergunta = (b: number, id: string, fn: (p: Pergunta) => Pergunta) => mudar(c => ({ ...c, perguntas: c.perguntas.map((ps, i) => (i === b ? ps.map(p => (p.id === id ? fn(p) : p)) : ps)) }));
  const novaPergunta = (b: number) => { const id = novoIdPergunta(draft, b); const p: Pergunta = b === 0 ? { id, titulo: 'Nova pergunta', texto: 'Descreva a pergunta', tipo: 'lista', campos: [{ nome: 'Resposta', tipo: 'texto' }], limite: 3 } : { id, texto: 'Nova pergunta', tipo: 'texto' }; mudar(c => ({ ...c, perguntas: c.perguntas.map((ps, i) => (i === b ? [...ps, p] : ps)) })); setS({ t: 'pergunta', b, id }); };
  const moverPergunta = (b: number, id: string, d: number) => mudar(c => ({ ...c, perguntas: c.perguntas.map((ps, i) => (i === b ? mover(ps, ps.findIndex(p => p.id === id), d) : ps)) }));

  const publicadas = new Set(base.perguntas.flat().map(p => p.id));
  return <section className="space-y-4">
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border rounded-md bg-card p-3">
      <h3 className="font-semibold mr-auto">Editor do formulário</h3>
      <span className="text-xs text-muted-foreground" role="status">{sujo ? 'Alterações não salvas' : rascunhoEm ? `Rascunho salvo ${new Date(rascunhoEm).toLocaleString('pt-BR')}` : 'Sem rascunho · igual à versão publicada'}</span>
      <Button size="sm" variant="outline" disabled={busy} onClick={salvarRascunho}>Salvar rascunho</Button>
      <Button size="sm" variant="outline" disabled={busy || (!rascunhoEm && !sujo)} onClick={previa}><Eye className="h-4 w-4 mr-1" />Pré-visualizar</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={abrirVersoes}><History className="h-4 w-4 mr-1" />Versões</Button>
      <Button size="sm" variant="ghost" disabled={busy || (!rascunhoEm && !sujo)} onClick={descartar}><Undo2 className="h-4 w-4 mr-1" />Descartar</Button>
      <Button size="sm" disabled={busy || !!erros.length || sujo || !rascunhoEm} title={sujo ? 'Salve o rascunho e confira a prévia antes' : undefined} onClick={() => setPublicar(true)}>Publicar</Button>
    </div>
    {rascunhoBase && rascunhoBase !== baseAt && <p role="alert" className="text-sm border border-destructive rounded-md p-3">A versão publicada mudou depois que este rascunho foi criado. Descarte o rascunho para começar da versão atual.</p>}
    {erros.length > 0 && <details open className="border border-destructive rounded-md p-3 text-sm"><summary className="font-semibold cursor-pointer">{erros.length} problema(s) a corrigir antes de salvar</summary><ul className="mt-2 list-disc pl-5 space-y-1">{erros.map(e => <li key={e}>{e}</li>)}</ul></details>}
    {mapas.length > 0 && <p className="text-sm text-muted-foreground">{mapas.length} renomeação(ões) com migração de respostas serão aplicadas ao publicar.</p>}
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <nav aria-label="Partes do formulário" className="border rounded-md p-2 space-y-3 text-sm max-h-[75vh] overflow-y-auto">
        <button className={`block w-full text-left rounded px-2 py-1 ${s.t === 'textos' ? 'bg-muted font-semibold' : ''}`} onClick={() => setS({ t: 'textos' })}>Abertura e textos gerais</button>
        {draft.perguntas.map((ps, b) => <div key={b} className="space-y-1">
          <p className="px-2 font-semibold text-xs uppercase text-muted-foreground">{b} · {draft.blocos[b]}</p>
          {ps.map((p, i) => <div key={p.id} className={`flex items-center gap-1 rounded ${s.t === 'pergunta' && s.id === p.id ? 'bg-muted' : ''}`}>
            <button className={`flex-1 text-left px-2 py-1 ${p.arquivada ? 'line-through text-muted-foreground' : ''}`} onClick={() => setS({ t: 'pergunta', b, id: p.id })}><span className="font-medium">{p.id}</span> {(p.titulo ?? p.texto).slice(0, 38)}{!publicadas.has(p.id) && <Badge variant="outline" className="ml-1">nova</Badge>}</button>
            <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={`Subir ${p.id}`} disabled={i === 0} onClick={() => moverPergunta(b, p.id, -1)}><ArrowUp className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={`Descer ${p.id}`} disabled={i === ps.length - 1} onClick={() => moverPergunta(b, p.id, 1)}><ArrowDown className="h-3 w-3" /></Button>
          </div>)}
          <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => novaPergunta(b)}><Plus className="h-3 w-3 mr-1" />Pergunta no bloco {b}</Button>
        </div>)}
        <div className="space-y-1 border-t pt-2"><p className="px-2 font-semibold text-xs uppercase text-muted-foreground">Listas fixas</p>
          {LISTAS_FIXAS.map(k => <button key={k} className={`block w-full text-left rounded px-2 py-1 ${s.t === 'lista' && s.k === k ? 'bg-muted font-semibold' : ''}`} onClick={() => setS({ t: 'lista', k })}>{ROTULO_LISTA[k]}</button>)}
          <button className={`block w-full text-left rounded px-2 py-1 ${s.t === 'campos4A' ? 'bg-muted font-semibold' : ''}`} onClick={() => setS({ t: 'campos4A' })}>Campos dos projetos da 4A</button>
          <button className={`block w-full text-left rounded px-2 py-1 ${s.t === 'camposRiscos' ? 'bg-muted font-semibold' : ''}`} onClick={() => setS({ t: 'camposRiscos' })}>Campos dos riscos (bloco 5)</button>
          <button className={`block w-full text-left rounded px-2 py-1 ${s.t === 'caixas' ? 'bg-muted font-semibold' : ''}`} onClick={() => setS({ t: 'caixas' })}>Caixas “Por que decidimos assim”</button>
        </div>
      </nav>
      <div className="border rounded-md p-4 min-w-0">
        {s.t === 'textos' && <ConfigEditor value={{ titulo: draft.titulo, tempo: draft.tempo, intro: draft.intro, bscTexto: draft.bscTexto, bscFecho: draft.bscFecho, antes: draft.antes, tese: draft.tese, teseExplicacao: draft.teseExplicacao, anexo: draft.anexo, blocos: draft.blocos, temas: draft.temas, notas: draft.notas }} onChange={v => mudar(c => ({ ...c, ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined)) }))} />}
        {s.t === 'pergunta' && pergunta && <EditorPergunta p={pergunta} b={s.b} ctx={ctxDe(s.b, pergunta.id)} usosTotal={contarUsos(rs, s.b, pergunta.id, undefined, draft)} set={fn => setPergunta(s.b, pergunta.id, fn)} renomear={renomear} remover={remover} />}
        {s.t === 'lista' && <EditorLista k={s.k} itens={draft[s.k]} publicados={new Set(base[s.k].map(i => i.id))} set={itens => mudar(c => ({ ...c, [s.k]: itens }))} />}
        {s.t === 'campos4A' && <div className="space-y-3"><h3 className="font-semibold">Campos de cada projeto da 4A</h3><p className="text-sm text-muted-foreground">Valem para todos os projetos da lista. As respostas ficam guardadas por projeto e pelo nome do campo.</p><EditorCampos campos={draft.campos4A?.length ? draft.campos4A : CAMPOS_4A} onChange={v => mudar(c => ({ ...c, campos4A: v }))} ctx={ctxDe(4, '4A')} escopo="campos" renomear={renomear} remover={remover} /></div>}
        {s.t === 'camposRiscos' && <div className="space-y-3"><h3 className="font-semibold">Campos de cada grande escolha (5.riscos)</h3><EditorCampos campos={draft.camposRiscos?.length ? draft.camposRiscos : CAMPOS_RISCOS} onChange={v => mudar(c => ({ ...c, camposRiscos: v }))} ctx={ctxDe(5, '5.riscos')} escopo="campos" renomear={renomear} remover={remover} /></div>}
        {s.t === 'caixas' && <EditorCaixas caixas={draft.caixas ?? {}} set={v => mudar(c => ({ ...c, caixas: v }))} />}
        {s.t === 'historico' && <div className="space-y-3"><h3 className="font-semibold">Versões publicadas</h3><p className="text-sm text-muted-foreground">“Restaurar como rascunho” carrega a versão no editor sem publicar. Perguntas e itens criados depois ficam arquivados, sem perder respostas.</p>
          {(versoes ?? []).map(v => <div key={v.id} className="flex flex-wrap items-center gap-2 border rounded-md p-3 text-sm"><span className="font-medium">{new Date(v.criado_em).toLocaleString('pt-BR')}</span><Badge variant="outline">{v.acao === 'publicacao_config' ? 'Publicação pelo editor' : 'Gravação'}</Badge><span className="text-muted-foreground">{v.depois?.conteudo?.versao}{v.depois?.conteudo?.revisao_config ? ` r${v.depois.conteudo.revisao_config}` : ''}</span><Button size="sm" variant="outline" className="ml-auto" onClick={() => restaurar(v)}>Restaurar como rascunho</Button></div>)}
          {versoes?.length === 0 && <p className="text-sm">Nenhuma versão registrada.</p>}</div>}
      </div>
    </div>

    <Dialog open={!!pedido} onOpenChange={o => !o && setPedido(null)}>
      <DialogContent><DialogHeader><DialogTitle>Renomear · {pedido?.titulo}</DialogTitle><DialogDescription>{pedido?.usos ? `${pedido.usos} resposta(s) salva(s) usam “${pedido.atual}”.` : 'Nenhuma resposta salva usa este nome.'}</DialogDescription></DialogHeader>
        <label className="text-sm space-y-1 block">Novo nome<Input value={nomeNovo} onChange={e => setNomeNovo(e.target.value)} autoFocus /></label>
        <DialogFooter className="gap-2 flex-wrap">
          {pedido?.usos ? <>
            <Button variant="outline" disabled={!nomeNovo.trim() || nomeNovo.trim() === pedido.atual} onClick={() => { pedido.aplicar(nomeNovo.trim(), false); setPedido(null); }}>Criar como novo (antigo vira histórico)</Button>
            <Button disabled={!nomeNovo.trim() || nomeNovo.trim() === pedido.atual} onClick={() => { pedido.aplicar(nomeNovo.trim(), true); setPedido(null); }}>Renomear e migrar respostas</Button>
          </> : <Button disabled={!nomeNovo.trim() || nomeNovo.trim() === pedido?.atual} onClick={() => { pedido?.aplicar(nomeNovo.trim(), false); setPedido(null); }}>Renomear</Button>}
        </DialogFooter></DialogContent>
    </Dialog>
    <Dialog open={!!remocao} onOpenChange={o => !o && setRemocao(null)}>
      <DialogContent><DialogHeader><DialogTitle>Remover · {remocao?.titulo}</DialogTitle><DialogDescription>{remocao?.usos} resposta(s) têm valor aqui. Elas continuam salvas e aparecem como histórico no consolidado; a completude deixa de cobrar este ponto.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setRemocao(null)}>Cancelar</Button><Button variant="destructive" onClick={() => { remocao?.aplicar(); setRemocao(null); }}>Remover e manter respostas como histórico</Button></DialogFooter></DialogContent>
    </Dialog>
    <Dialog open={publicar} onOpenChange={setPublicar}>
      <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Publicar o rascunho</DialogTitle><DialogDescription>Os diretores passam a ver esta versão ao recarregar o formulário. A versão continua {draft.versao}.</DialogDescription></DialogHeader>
        <div className="space-y-3 text-sm"><p className="font-semibold">O que muda</p><ul className="list-disc pl-5">{resumoMudancas(base, draft).map(x => <li key={x}>{x}</li>)}</ul>
          <p><strong>{migracoes.length}</strong> resposta(s) serão migradas pelas renomeações ({mapas.length} mapeamento(s)); status e data de envio não mudam. O antes e o depois ficam no histórico.</p>
          <p className="text-muted-foreground">Confira a prévia “Visualizar como” antes de publicar.</p></div>
        <DialogFooter><Button variant="outline" onClick={() => setPublicar(false)}>Cancelar</Button><Button disabled={busy} onClick={confirmarPublicacao}>Publicar agora</Button></DialogFooter></DialogContent>
    </Dialog>
  </section>;
}

type Renomear = (titulo: string, atual: string, usos: number, aplicar: (novo: string, migrar: boolean) => void) => void;
type Remover = (titulo: string, usos: number, aplicar: () => void) => void;

function Cadeiras({ value, onChange, diretores, rotulo = 'Quem vê' }: { value?: string[]; onChange: (v?: string[]) => void; diretores: string[]; rotulo?: string }) {
  const todos = !value;
  return <fieldset className="space-y-2"><legend className="text-sm font-medium">{rotulo}</legend>
    <label className="flex items-center gap-2 text-sm"><Checkbox checked={todos} onCheckedChange={v => onChange(v ? undefined : [])} />Todos os diretores</label>
    {!todos && <div className="flex flex-wrap gap-3 pl-6">{diretores.map(d => <label key={d} className="flex items-center gap-2 text-sm"><Checkbox checked={value!.includes(d)} onCheckedChange={v => onChange(v ? [...value!, d] : value!.filter(x => x !== d))} />{d}</label>)}
      {value!.filter(d => !diretores.includes(d)).map(d => <Badge key={d} variant="destructive">{d} (não é participante ativo)</Badge>)}</div>}
  </fieldset>;
}

function Opcoes({ titulo, opcoes, onChange, usos, renomear, remover, onRenomeado }: { titulo: string; opcoes: string[]; onChange: (v: string[]) => void; usos: (o: string) => number; renomear: Renomear; remover: Remover; onRenomeado?: (de: string, para: string, migrar: boolean) => void }) {
  const [nova, setNova] = useState('');
  return <div className="space-y-2"><p className="text-sm font-medium">{titulo}</p>
    <ul className="space-y-1">{opcoes.map((o, i) => <li key={o + i} className="flex items-center gap-1 text-sm border rounded px-2 py-1">
      <span className="flex-1 break-words">{o}</span>{usos(o) > 0 && <Badge variant="outline">{usos(o)} resp.</Badge>}
      <Button size="sm" variant="ghost" onClick={() => renomear(`opção “${o}”`, o, usos(o), (novo, migrar) => { if (opcoes.includes(novo)) return toast.error('Essa opção já existe'); onChange(opcoes.map(x => (x === o ? novo : x))); onRenomeado?.(o, novo, migrar); })}>Renomear</Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Subir" disabled={i === 0} onClick={() => onChange(mover(opcoes, i, -1))}><ArrowUp className="h-3 w-3" /></Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Descer" disabled={i === opcoes.length - 1} onClick={() => onChange(mover(opcoes, i, 1))}><ArrowDown className="h-3 w-3" /></Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Remover ${o}`} onClick={() => remover(`opção “${o}”`, usos(o), () => onChange(opcoes.filter(x => x !== o)))}><Trash2 className="h-3 w-3" /></Button>
    </li>)}</ul>
    <div className="flex gap-2"><Input value={nova} placeholder="Nova opção" onChange={e => setNova(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && nova.trim()) { e.preventDefault(); if (!opcoes.includes(nova.trim())) onChange([...opcoes, nova.trim()]); setNova(''); } }} /><Button size="sm" variant="outline" disabled={!nova.trim() || opcoes.includes(nova.trim())} onClick={() => { onChange([...opcoes, nova.trim()]); setNova(''); }}><Plus className="h-4 w-4" /></Button></div>
  </div>;
}

function EditorCampos({ campos, onChange, ctx, escopo, renomear, remover, comCadeiras = false }: { campos: Campo[]; onChange: (v: Campo[]) => void; ctx: Ctx; escopo: 'campos' | 'extras' | 'sublista'; renomear: Renomear; remover: Remover; comCadeiras?: boolean }) {
  const set = (i: number, f: Partial<Campo>) => onChange(campos.map((x, j) => (j === i ? { ...x, ...f } : x)));
  const usosCampo = (n: string) => ctx.usos({ tipo: 'campo', escopo, valor: n });
  return <div className="space-y-3">
    {campos.map((f, i) => <details key={f.nome + i} className="border rounded-md p-3"><summary className="cursor-pointer text-sm font-medium flex flex-wrap gap-2 items-center"><span>{f.rotulo ?? f.nome}</span><Badge variant="outline">{ROTULO_TIPO[f.tipo ?? 'texto']}</Badge>{f.opcional && <Badge variant="outline">Opcional</Badge>}{f.cadeiras && <Badge variant="outline">Apenas {f.cadeiras.join(', ')}</Badge>}</summary>
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap items-end gap-2"><div className="text-sm"><span className="block font-medium">Nome do campo (chave das respostas)</span><code className="text-xs">{f.nome}</code></div>
          <Button size="sm" variant="outline" onClick={() => renomear(`campo “${f.nome}”`, f.nome, usosCampo(f.nome), (novo, migrar) => { if (campos.some(x => x.nome === novo)) return toast.error('Já existe um campo com esse nome'); set(i, { nome: novo }); if (migrar) ctx.mapear({ tipo: 'campo', escopo, de: f.nome, para: novo }); })}>Renomear</Button>
          {usosCampo(f.nome) > 0 && <Badge variant="outline">{usosCampo(f.nome)} resposta(s)</Badge>}</div>
        <label className="text-sm block space-y-1">Rótulo exibido<Input value={f.rotulo ?? ''} placeholder={f.nome} onChange={e => set(i, { rotulo: e.target.value || undefined })} /></label>
        <label className="text-sm block space-y-1">Tipo<select className={sel} value={f.tipo ?? 'texto'} onChange={e => set(i, { tipo: e.target.value as Campo['tipo'], ...(e.target.value === 'escolha' && !f.opcoes ? { opcoes: [] } : {}) })}>{TIPOS_CAMPO.map(t => <option key={t} value={t}>{ROTULO_TIPO[t!]}</option>)}</select></label>
        {CADASTRO[f.tipo ?? ''] && <p className="text-xs rounded bg-muted p-2">As opções vêm do cadastro. Para mudar, edite em {CADASTRO[f.tipo!]}.</p>}
        {f.tipo === 'escolha' && !f.opcoesDaMatriz && f.nome !== 'Principal lacuna a fechar em 2027' && <Opcoes titulo="Opções da lista suspensa" opcoes={f.opcoes ?? []} onChange={v => set(i, { opcoes: v })} usos={o => ctx.usos({ tipo: 'opcao', escopo, campo: f.nome, valor: o })} renomear={renomear} remover={remover} onRenomeado={(de, para, migrar) => migrar && ctx.mapear({ tipo: 'opcao', escopo, campo: f.nome, de, para })} />}
        {(f.opcoesDaMatriz || f.nome === 'Principal lacuna a fechar em 2027') && <p className="text-xs rounded bg-muted p-2">As opções vêm das linhas da matriz desta pergunta.</p>}
        <label className="text-sm block space-y-1">Exemplo (placeholder)<Input value={f.placeholder ?? ''} onChange={e => set(i, { placeholder: e.target.value || undefined })} /></label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!f.opcional} onCheckedChange={v => set(i, { opcional: v ? true : undefined })} />Opcional</label>
        {comCadeiras && <Cadeiras value={f.cadeiras} onChange={v => set(i, { cadeiras: v })} diretores={ctx.diretores} />}
        <div className="flex gap-2"><Button size="sm" variant="ghost" disabled={i === 0} onClick={() => onChange(mover(campos, i, -1))}><ArrowUp className="h-4 w-4 mr-1" />Subir</Button><Button size="sm" variant="ghost" disabled={i === campos.length - 1} onClick={() => onChange(mover(campos, i, 1))}><ArrowDown className="h-4 w-4 mr-1" />Descer</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remover(`campo “${f.nome}”`, usosCampo(f.nome), () => onChange(campos.filter((_, j) => j !== i)))}><Trash2 className="h-4 w-4 mr-1" />Remover</Button></div>
      </div></details>)}
    <Button size="sm" variant="outline" className="border-dashed" onClick={() => { let n = campos.length + 1; while (campos.some(c => c.nome === `Novo campo ${n}`)) n++; onChange([...campos, { nome: `Novo campo ${n}`, tipo: 'texto' }]); }}><Plus className="h-4 w-4 mr-1" />Adicionar campo</Button>
  </div>;
}

function Tags({ rotulo, value, onChange, ajuda }: { rotulo: string; value?: string[]; onChange: (v?: string[]) => void; ajuda: string }) {
  const [txt, setTxt] = useState((value ?? []).join('; '));
  return <label className="text-sm block space-y-1">{rotulo}<Input value={txt} onChange={e => setTxt(e.target.value)} onBlur={() => { const v = txt.split(';').map(x => x.trim()).filter(Boolean); onChange(v.length ? v : undefined); }} /><span className="text-xs text-muted-foreground">{ajuda}</span></label>;
}

function EditorPergunta({ p, b, ctx, usosTotal, set, renomear, remover }: { p: Pergunta; b: number; ctx: Ctx; usosTotal: number; set: (fn: (p: Pergunta) => Pergunta) => void; renomear: Renomear; remover: Remover }) {
  const up = (x: Partial<Pergunta>) => set(q => { const n: any = { ...q, ...x }; for (const k of Object.keys(x)) if (n[k] === undefined) delete n[k]; return n; });
  const fixa = ESTRUTURA_FIXA[p.id];
  const tipos = b === 0 ? TIPOS_PERGUNTA_B0 : TIPOS_PERGUNTA;
  const itens = p.itens ?? [];
  return <div className="space-y-5" key={p.id}>
    <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">{p.id}</h3>{p.arquivada && <Badge variant="destructive">Arquivada</Badge>}<Badge variant="outline">{usosTotal} resposta(s)</Badge>
      <Button size="sm" variant="outline" className="ml-auto" onClick={() => up({ arquivada: p.arquivada ? undefined : true })}>{p.arquivada ? <><ArchiveRestore className="h-4 w-4 mr-1" />Reativar</> : <><Archive className="h-4 w-4 mr-1" />Arquivar</>}</Button></div>
    {p.arquivada && <p className="text-sm text-muted-foreground">Arquivada: some do formulário e da completude; as respostas ficam no consolidado como histórico.</p>}
    {fixa && <p className="text-sm rounded bg-muted p-3">Estrutura fixa: {fixa}</p>}
    <label className="text-sm block space-y-1">Título<Input value={p.titulo ?? ''} onChange={e => up({ titulo: e.target.value || undefined })} /></label>
    <label className="text-sm block space-y-1">Texto da pergunta<Textarea rows={3} value={p.texto} onChange={e => up({ texto: e.target.value })} /></label>
    <label className="text-sm block space-y-1">Ajuda<Textarea rows={2} value={p.ajuda ?? ''} onChange={e => up({ ajuda: e.target.value || undefined })} /></label>
    {b === 0 && <fieldset className="grid gap-3 md:grid-cols-3"><legend className="text-sm font-medium mb-1">Apoio</legend>{(['porque', 'como', 'entregar'] as const).map(k => <label key={k} className="text-sm block space-y-1">{k === 'porque' ? 'Por que importa' : k === 'como' ? 'Como fazer' : 'O que entregar'}<Textarea rows={3} value={p.apoio?.[k] ?? ''} onChange={e => up({ apoio: { porque: '', como: '', entregar: '', ...p.apoio, [k]: e.target.value } })} /></label>)}</fieldset>}
    {b === 0 && <div className="grid gap-3 md:grid-cols-2"><Tags rotulo="Objetivos vinculados" value={p.objetivos} onChange={v => up({ objetivos: v })} ajuda="Códigos separados por “;” (ex.: AC.01). O nome vem do cadastro BSC (Metas › BSC)." /><Tags rotulo="KPIs vinculados" value={p.kpis} onChange={v => up({ kpis: v })} ajuda="Códigos separados por “;”. Situação e meta vêm do cadastro BSC." /></div>}
    <Cadeiras value={p.cadeiras} onChange={v => up({ cadeiras: v })} diretores={ctx.diretores} rotulo="Quem vê esta pergunta" />
    <div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm"><Checkbox checked={!!p.privada} onCheckedChange={v => up({ privada: v ? true : undefined })} />Respostas visíveis só para Naira e Ian</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={!!p.opcional} onCheckedChange={v => up({ opcional: v ? true : undefined })} />Pergunta opcional</label></div>
    {!fixa && <label className="text-sm block space-y-1">Tipo<select className={sel} value={p.tipo ?? 'texto'} disabled={usosTotal > 0} onChange={e => up({ tipo: e.target.value as Pergunta['tipo'] })}>{[...new Set([p.tipo ?? 'texto', ...tipos])].map(t => <option key={t} value={t}>{t}</option>)}</select>{usosTotal > 0 && <span className="text-xs text-muted-foreground">Com respostas salvas, o tipo não muda. Crie uma pergunta nova e arquive esta.</span>}</label>}
    {(p.tipo === 'lista' || p.tipo === 'multipla' || p.id === '4.1') && <div className="flex flex-wrap gap-3"><label className="text-sm space-y-1 block">Limite<Input type="number" min={1} className="w-28" value={p.limite ?? ''} onChange={e => up({ limite: e.target.value ? Number(e.target.value) : undefined })} /></label>{p.tipo === 'lista' && <label className="text-sm space-y-1 block">Mínimo<Input type="number" min={0} className="w-28" value={p.minimo ?? ''} onChange={e => up({ minimo: e.target.value ? Number(e.target.value) : undefined })} /></label>}</div>}
    {(p.tipo === 'escolha' || p.tipo === 'multipla') && p.id !== '0.1' && <Opcoes titulo="Opções" opcoes={p.opcoes ?? []} onChange={v => up({ opcoes: v })} usos={o => ctx.usos({ tipo: 'opcao', valor: o })} renomear={renomear} remover={remover} onRenomeado={(de, para, migrar) => migrar && ctx.mapear({ tipo: 'opcao', de, para })} />}
    {p.tipo === 'matriz' && <section className="space-y-2"><h4 className="font-semibold">Linhas da matriz</h4>
      {itens.map((it, i) => { const u = ctx.usos({ tipo: 'item', valor: it }); return <div key={it + i} className="border rounded-md p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1 text-sm"><span className="flex-1 font-medium break-words">{it}</span>{u > 0 && <Badge variant="outline">{u} resp.</Badge>}
          <Button size="sm" variant="ghost" disabled={it === 'Outro'} onClick={() => renomear(`linha “${it}”`, it, u, (novo, migrar) => { if (itens.includes(novo)) return toast.error('Essa linha já existe'); const ic = { ...(p.itensCadeiras ?? {}) }; if (ic[it]) { ic[novo] = ic[it]; delete ic[it]; } up({ itens: itens.map(x => (x === it ? novo : x)), itensCadeiras: Object.keys(ic).length ? ic : undefined, opcionais: p.opcionais?.map(x => (x === it ? novo : x)) }); if (migrar) ctx.mapear({ tipo: 'item', de: it, para: novo }); })}>Renomear</Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Subir" disabled={i === 0} onClick={() => up({ itens: mover(itens, i, -1) })}><ArrowUp className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Descer" disabled={i === itens.length - 1} onClick={() => up({ itens: mover(itens, i, 1) })}><ArrowDown className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Remover ${it}`} onClick={() => remover(`linha “${it}”`, u, () => { const ic = { ...(p.itensCadeiras ?? {}) }; delete ic[it]; up({ itens: itens.filter(x => x !== it), itensCadeiras: Object.keys(ic).length ? ic : undefined, opcionais: p.opcionais?.filter(x => x !== it) }); })}><Trash2 className="h-3 w-3" /></Button></div>
        <div className="flex flex-wrap gap-4 items-start"><label className="flex items-center gap-2 text-sm"><Checkbox checked={!!p.opcionais?.includes(it)} onCheckedChange={v => up({ opcionais: v ? [...(p.opcionais ?? []), it] : p.opcionais?.filter(x => x !== it) })} />Linha opcional</label>
          <Cadeiras value={p.itensCadeiras?.[it]} rotulo="Quem vê a linha" diretores={ctx.diretores} onChange={v => { const ic = { ...(p.itensCadeiras ?? {}) }; if (v) ic[it] = v; else delete ic[it]; up({ itensCadeiras: Object.keys(ic).length ? ic : undefined }); }} /></div>
      </div>; })}
      <NovaLinha existentes={itens} onAdd={n => up({ itens: itens.includes('Outro') ? [...itens.filter(x => x !== 'Outro'), n, 'Outro'] : [...itens, n] })} />
      <label className="text-sm block space-y-1">Texto da observação por linha<Input value={p.observacao ?? ''} onChange={e => up({ observacao: e.target.value || undefined })} /></label>
      <h4 className="font-semibold pt-2">Colunas</h4>
      <EditorCampos campos={p.campos ?? []} onChange={v => up({ campos: v })} ctx={ctx} escopo="campos" renomear={renomear} remover={remover} />
      {p.id === '0.1' && <p className="text-xs text-muted-foreground">A escala da coluna “Avaliação” da 0.1 é fixa no código (critérios da escala).</p>}
    </section>}
    {(p.tipo === 'lista' || p.tipo === 'grupo' || p.tipo === 'frase') && <section className="space-y-2"><h4 className="font-semibold">{p.tipo === 'lista' ? 'Colunas da lista' : 'Campos'}</h4><EditorCampos campos={p.campos ?? []} onChange={v => up({ campos: v })} ctx={ctx} escopo="campos" renomear={renomear} remover={remover} /></section>}
    {b === 0 && <section className="space-y-2"><div className="flex items-center gap-2"><h4 className="font-semibold">Sublista</h4>{!p.sublista ? <Button size="sm" variant="outline" onClick={() => up({ sublista: { titulo: 'Nova sublista', limite: 3, campos: [{ nome: 'Item', tipo: 'texto' }], opcional: true } })}><Plus className="h-4 w-4 mr-1" />Adicionar sublista</Button> : <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remover('sublista', ctx.usos({ tipo: 'campo', escopo: 'sublista', valor: p.sublista!.campos[0]?.nome ?? '' }), () => up({ sublista: undefined }))}><Trash2 className="h-4 w-4 mr-1" />Remover sublista</Button>}</div>
      {p.sublista && <div className="space-y-3 border-l-2 pl-3"><label className="text-sm block space-y-1">Título<Input value={p.sublista.titulo} onChange={e => up({ sublista: { ...p.sublista!, titulo: e.target.value } })} /></label><div className="flex flex-wrap gap-4 items-end"><label className="text-sm block space-y-1">Limite<Input type="number" min={1} className="w-28" value={p.sublista.limite} onChange={e => up({ sublista: { ...p.sublista!, limite: Number(e.target.value) } })} /></label><label className="flex items-center gap-2 text-sm"><Checkbox checked={!!p.sublista.opcional} onCheckedChange={v => up({ sublista: { ...p.sublista!, opcional: v ? true : undefined } })} />Opcional</label></div>
        <EditorCampos campos={p.sublista.campos} onChange={v => up({ sublista: { ...p.sublista!, campos: v } })} ctx={ctx} escopo="sublista" renomear={renomear} remover={remover} /></div>}</section>}
    {b === 0 && <section className="space-y-2"><h4 className="font-semibold">Perguntas complementares (extras)</h4><EditorCampos campos={p.extras ?? []} onChange={v => up({ extras: v.length ? v : undefined })} ctx={ctx} escopo="extras" renomear={renomear} remover={remover} comCadeiras /></section>}
  </div>;
}

function NovaLinha({ existentes, onAdd }: { existentes: string[]; onAdd: (n: string) => void }) {
  const [v, setV] = useState('');
  const ok = v.trim() && !existentes.includes(v.trim());
  return <div className="flex gap-2"><Input value={v} placeholder="Nova linha" onChange={e => setV(e.target.value)} /><Button size="sm" variant="outline" className="border-dashed" disabled={!ok} onClick={() => { onAdd(v.trim()); setV(''); }}><Plus className="h-4 w-4 mr-1" />Adicionar linha</Button></div>;
}

function EditorLista({ k, itens, publicados, set }: { k: ListaFixa; itens: Item[]; publicados: Set<string>; set: (v: Item[]) => void }) {
  const up = (i: number, x: Partial<Item>) => set(itens.map((it, j) => { if (j !== i) return it; const n: any = { ...it, ...x }; for (const key of Object.keys(x)) if (n[key] === undefined || n[key] === '') delete n[key]; return n; }));
  const prefixo = { diretrizes: 'd', projetos: 'proj-', andamento: 'and', produtos: 'prod', escolhas: 'esc' }[k];
  return <div className="space-y-3"><h3 className="font-semibold">{ROTULO_LISTA[k]}</h3><p className="text-sm text-muted-foreground">Itens não são apagados: arquivar tira do formulário e mantém as respostas como histórico.</p>
    {itens.map((it, i) => <details key={it.id} className={`border rounded-md p-3 ${it.arquivado ? 'opacity-70' : ''}`}><summary className="cursor-pointer text-sm font-medium flex flex-wrap gap-2 items-center"><code className="text-xs">{it.id}</code><span className={it.arquivado ? 'line-through' : ''}>{it.titulo}</span>{it.selo && <Badge variant="outline">{it.selo}</Badge>}{it.arquivado && <Badge variant="destructive">Arquivado</Badge>}{!publicados.has(it.id) && <Badge variant="outline">novo</Badge>}</summary>
      <div className="mt-3 space-y-3">
        <label className="text-sm block space-y-1">Título<Input value={it.titulo} onChange={e => up(i, { titulo: e.target.value })} /></label>
        <label className="text-sm block space-y-1">Descrição<Textarea rows={3} value={it.descricao ?? ''} onChange={e => up(i, { descricao: e.target.value })} /></label>
        {(k === 'diretrizes') && <label className="text-sm block space-y-1">Por quê<Textarea rows={2} value={it.porque ?? ''} onChange={e => up(i, { porque: e.target.value })} /></label>}
        {(k === 'projetos') && <label className="text-sm block space-y-1">Selo<Input value={it.selo ?? ''} onChange={e => up(i, { selo: e.target.value })} /></label>}
        {(k === 'escolhas') && <label className="text-sm block space-y-1">Caixa “Por que decidimos assim”<Textarea rows={3} value={it.caixa ?? ''} onChange={e => up(i, { caixa: e.target.value })} /></label>}
        <div className="flex gap-2"><Button size="sm" variant="ghost" disabled={i === 0} onClick={() => set(mover(itens, i, -1))}><ArrowUp className="h-4 w-4 mr-1" />Subir</Button><Button size="sm" variant="ghost" disabled={i === itens.length - 1} onClick={() => set(mover(itens, i, 1))}><ArrowDown className="h-4 w-4 mr-1" />Descer</Button>
          {publicados.has(it.id) ? <Button size="sm" variant="outline" className="ml-auto" onClick={() => up(i, { arquivado: it.arquivado ? undefined : true })}>{it.arquivado ? 'Reativar' : 'Arquivar'}</Button> : <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => set(itens.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 mr-1" />Remover (ainda não publicado)</Button>}</div>
      </div></details>)}
    <Button size="sm" variant="outline" className="border-dashed" onClick={() => set([...itens, { id: novoIdItem(itens, prefixo), titulo: 'Novo item' }])}><Plus className="h-4 w-4 mr-1" />Adicionar item</Button>
  </div>;
}

function EditorCaixas({ caixas, set }: { caixas: Record<string, string>; set: (v: Record<string, string>) => void }) {
  const [nova, setNova] = useState('');
  return <div className="space-y-3"><h3 className="font-semibold">Caixas “Por que decidimos assim”</h3><p className="text-sm text-muted-foreground">Cada caixa aparece na pergunta com o mesmo código (ex.: 4A, 4C). As caixas das grandes escolhas ficam em Listas fixas › Grandes escolhas.</p>
    {Object.entries(caixas).map(([k, v]) => <div key={k} className="space-y-1"><div className="flex items-center gap-2"><span className="text-sm font-medium">{k}</span><Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" aria-label={`Remover caixa ${k}`} onClick={() => { const n = { ...caixas }; delete n[k]; set(n); }}><Trash2 className="h-3 w-3" /></Button></div><Textarea rows={4} value={v} onChange={e => set({ ...caixas, [k]: e.target.value })} /></div>)}
    <div className="flex gap-2"><Input value={nova} placeholder="Código da pergunta (ex.: 4B)" onChange={e => setNova(e.target.value)} /><Button size="sm" variant="outline" disabled={!nova.trim() || nova.trim() in caixas} onClick={() => { set({ ...caixas, [nova.trim()]: '' }); setNova(''); }}><Plus className="h-4 w-4 mr-1" />Adicionar caixa</Button></div>
  </div>;
}
