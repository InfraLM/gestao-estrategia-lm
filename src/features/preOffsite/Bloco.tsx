import { camposProjeto, camposRiscos } from './editorConfig';
import PerguntaBloco0, { Apenas, ApoioPergunta } from './PerguntaBloco0';
import { perspectivaClasse } from './presentation';
import { CHAVE_BLOCO0, respostasBloco0, perguntaPara } from './bloco0';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { Config,Campo,Pergunta } from './config';
import { POSICOES,POSICOES_PRODUTO,PERSPECTIVAS,montarFrase } from './config';
import { Field,Grupo,Lista,type Refs } from './Fields';
import { lista,type Respostas } from './domain';
const texto=(nome:string,rotulo?:string):Campo=>({nome,rotulo});
const escolha=(nome:string,opcoes:string[]):Campo=>({nome,tipo:'escolha',opcoes});
export function CaixaDecisao({texto}:{texto?:string}){if(!texto)return null;return <aside className="offsite-decision space-y-1"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por que decidimos assim</p><p className="text-sm leading-relaxed whitespace-pre-wrap">{texto}</p></aside>;}
export function CadeiaBsc(){return <ol aria-label="Cadeia de causa e efeito do BSC" className="flex flex-wrap items-center gap-2">{PERSPECTIVAS.map((p,i)=><li key={p} className="flex items-center gap-2"><span className="rounded-full border border-primary px-3 py-1 text-sm font-medium">{p}</span>{i<PERSPECTIVAS.length-1&&<ArrowRight aria-hidden className="h-4 w-4 text-primary"/>}</li>)}</ol>;}
export default function Bloco({index,r,set,refs,c,disabled,cadeiraId,admin=false,nome=''}:{index:number;r:Respostas;set:(k:string,v:any)=>void;refs:Refs;c:Config;disabled:boolean;cadeiraId?:string;admin?:boolean;nome?:string}){
 const perguntas=!admin?c.perguntas[index].map(p=>perguntaPara(p,nome)).filter((p):p is Pergunta=>!!p):c.perguntas[index];

 const field=(campo:Campo,key:string)=> <Field campo={campo} value={r[key]} onChange={v=>set(key,v)} refs={refs} config={c} disabled={disabled}/>;
 const grupo=(campos:Campo[],key:string)=> <Grupo campos={campos} value={r[key]} onChange={v=>set(key,v)} refs={refs} config={c} disabled={disabled}/>;
 const multi=(key:string,items:{id:string;titulo:string}[],limite?:number)=> <div className="space-y-3">{items.map(d=><label key={d.id} className="flex gap-3 items-start text-sm"><Checkbox checked={lista(r,key).includes(d.id)} disabled={disabled||(!lista(r,key).includes(d.id)&&!!limite&&lista(r,key).length>=limite)} onCheckedChange={v=>set(key,v?[...lista(r,key),d.id]:lista(r,key).filter(x=>x!==d.id))}/><span>{d.titulo}</span></label>)}</div>;
 const cards=(items:Config['projetos'],render:(id:string)=>React.ReactNode)=> <div className="space-y-4">{items.map(d=><div key={d.id} className="rounded-lg border p-4 space-y-4"><div className="flex flex-wrap gap-2 items-center"><h3 className="font-bold">{d.titulo}</h3>{d.selo&&<Badge variant="outline" className="border-primary text-primary">{d.selo}</Badge>}</div>{d.descricao&&<p className="text-sm text-muted-foreground">{d.descricao}</p>}{render(d.id)}</div>)}</div>;
 const render=(p:Pergunta)=>{
 switch(p.id){
 case '3.2':return <div className="space-y-4">{c.diretrizes.map(d=><div key={d.id} className="rounded-md border p-4 space-y-3"><h3 className="font-semibold">{d.id} · {d.titulo}</h3><p className="text-sm text-muted-foreground">{d.descricao}</p>{d.porque&&<p className="text-sm italic text-muted-foreground"><span className="font-medium">Por quê:</span> {d.porque}</p>}{field(escolha('Sua posição',POSICOES),`3.pos.${d.id}`)}{multi('3.selecionadas',[{id:d.id,titulo:'Entre as 3 que mais afetam a minha área'}],3)}</div>)}<p className="text-sm text-muted-foreground">{lista(r,'3.selecionadas').length}/3 diretrizes selecionadas</p></div>;
 case '3.3':return <div className="space-y-4">{lista(r,'3.selecionadas').map(id=><div className="border rounded-md p-4 space-y-4" key={id}><h3 className="font-semibold">{c.diretrizes.find(d=>d.id===id)?.titulo}</h3><Field campo={{nome:'Diretriz',tipo:'diretriz'}} value={id} onChange={v=>{if(!v||lista(r,'3.selecionadas').includes(v))return;set('3.selecionadas',lista(r,'3.selecionadas').map(x=>x===id?v:x));if(!r[`3.detalhe.${v}`])set(`3.detalhe.${v}`,r[`3.detalhe.${id}`]??{});}} refs={refs} config={c} disabled={disabled}/>{grupo([texto('Objeção mais forte','Qual é a objeção mais forte que alguém faria a ela?'),texto('O que precisa ser verdade','O que precisa ser verdade para dar certo?'),texto('O que sua área vai fazer','O que a sua área vai fazer por ela?'),{nome:'KPI',rotulo:'Qual indicador do BSC Rev.03 a sua área move com ela?',tipo:'kpi'},texto('Quanto espera mover em 2027','E quanto espera mover em 2027?')],`3.detalhe.${id}`)}</div>)}{!lista(r,'3.selecionadas').length&&<p className="text-sm text-muted-foreground">Selecione suas diretrizes em 3.2.</p>}</div>;
 case '3.4':return <div className="space-y-4">{c.diretrizes.filter(d=>['Ajustaria','Discordo'].includes(r[`3.pos.${d.id}`])&&!lista(r,'3.selecionadas').includes(d.id)).map(d=><div key={d.id}>{field(texto(`${d.titulo} · Qual o ajuste?`),`3.ajuste.${d.id}`)}</div>)}</div>;
 case '3.5':return <div className="space-y-4">{multi('3.5.objetivos',refs.objetivos.map(o=>({id:o.id,titulo:`${o.codigo} · ${o.nome}`})))}{field(texto('O que falta cobrir?'),'3.5.texto')}</div>;
 case '4A':return cards(c.projetos,id=>grupo(camposProjeto(c,c.projetos.find(d=>d.id===id)!),`4A.${id}`));
 case '4.1':return <div className="space-y-4">{multi('4.1',c.projetos,p.limite??2)}{field(texto('Por quê?'),'4.1.porque')}</div>;
 case '4.2':return <div className="space-y-4">{field({nome:'Projeto a adiar',tipo:'projeto'},'4.2')}{field(texto('O que o faria voltar à pauta?'),'4.2.porque')}</div>;
 case '4C':return cards(c.produtos,id=>grupo([...(c.produtos.find(d=>d.id===id)?.titulo==='Outro'?[texto('Nome')]:[]),escolha('Posição',POSICOES_PRODUTO),texto('Impacto na sua área e o que garantir na transição','Impacto na sua área e o que garantir na transição (alunos ativos, contratos, receita prevista)')],`4C.${id}`));
 case '5.riscos':return <div className="space-y-5">{c.escolhas.map(d=><div className="border rounded-md p-4 space-y-4" key={d.id}><h3 className="font-medium">{d.id} · {d.titulo}</h3><CaixaDecisao texto={d.caixa}/>{grupo(camposRiscos(c),d.id)}</div>)}</div>;
 }
 if(p.tipo==='frase')return <div className="space-y-3">{grupo(p.campos??[],p.id)}<p className="rounded-md border-l-4 border-primary bg-muted/50 p-3 text-sm" aria-live="polite">{montarFrase(r[p.id])}</p></div>;
 if(p.tipo==='grupo')return grupo(p.campos??[],p.id);
 if(p.tipo==='lista')return <Lista p={p} r={r} set={set} refs={refs} config={c} disabled={disabled}/>;
 if(p.tipo==='escolha')return field(escolha('Sua escolha',p.opcoes??[]),p.id);
 if(p.tipo==='multipla')return <div className="space-y-2">{p.limite&&<p className="text-sm text-muted-foreground">Escolha até {p.limite}</p>}{multi(p.id,(p.opcoes??[]).map(o=>({id:o,titulo:o})),p.limite)}</div>;
 if(p.tipo==='processo')return grupo([{nome:'Processo',tipo:'processo'},texto('Texto')],p.id);
 return field(texto(c.notas[p.id]??'Sua resposta'),p.id);
 };
 const nota=c.notas[`b${index}`];
 return <div className="space-y-6">
 {nota&&<p className="offsite-question leading-relaxed whitespace-pre-line">{nota}</p>}
 {index===3&&<blockquote className="offsite-thesis space-y-2"><p className="font-bold">“{c.tese}”</p><p className="text-sm text-muted-foreground">{c.teseExplicacao}</p></blockquote>}
 {perguntas.map(p=><div key={p.id} className="space-y-5">{p.grupo&&<div className={`offsite-perspective-heading ${perspectivaClasse(p)} flex flex-col sm:flex-row sm:items-center gap-3`}><h3 className="text-xl font-bold">{p.grupo}</h3><p className="text-sm text-muted-foreground">{c.bsc?.find(b=>b.perspectiva===p.grupo)?.pergunta}</p></div>}{index===0?<PerguntaBloco0 p={p} r={r} set={set} refs={refs} c={c} disabled={disabled}/>:<section className={`offsite-question ${p.cadeiras?.length?'offsite-directed':''} space-y-4`} aria-label={`${p.id} · ${p.titulo??p.texto}`}><div className="flex items-start gap-3">{p.id!=='5.riscos'&&<span className="offsite-question-id shrink-0">{p.id}</span>}<h3 className="font-bold text-lg">{p.titulo??p.texto}</h3></div>{p.titulo&&<p className="text-sm">{p.texto}</p>}<div className="flex flex-wrap gap-2"><Apenas cadeiras={p.cadeiras}/>{p.privada&&<Badge variant="outline" className="offsite-private">Respostas visíveis só para Naira e Ian</Badge>}</div><ApoioPergunta p={p}/><CaixaDecisao texto={c.caixas?.[p.id]}/>{(p.ajuda||c.notas[p.id])&&<p className="text-sm text-muted-foreground">{p.ajuda??c.notas[p.id]}</p>}{render(p)}</section>}</div>)}
 </div>;
}
