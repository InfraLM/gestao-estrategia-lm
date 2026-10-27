import PerguntaBloco0 from './PerguntaBloco0';
import { CHAVE_BLOCO0, respostasBloco0 } from './bloco0';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { Config,Campo,Pergunta } from './config';
import { POSICOES,POSICOES_PRODUTO,PERSPECTIVAS,montarFrase } from './config';
import { Field,Grupo,Lista,type Refs } from './Fields';
import { lista,type Respostas } from './domain';
const texto=(nome:string,rotulo?:string):Campo=>({nome,rotulo});
const escolha=(nome:string,opcoes:string[]):Campo=>({nome,tipo:'escolha',opcoes});
export function CaixaDecisao({texto}:{texto?:string}){if(!texto)return null;return <aside className="rounded-md bg-muted p-4 space-y-1"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por que decidimos assim</p><p className="text-sm leading-relaxed whitespace-pre-wrap">{texto}</p></aside>;}
export function CadeiaBsc(){return <ol aria-label="Cadeia de causa e efeito do BSC" className="flex flex-wrap items-center gap-2">{PERSPECTIVAS.map((p,i)=><li key={p} className="flex items-center gap-2"><span className="rounded-full border border-primary px-3 py-1 text-sm font-medium">{p}</span>{i<PERSPECTIVAS.length-1&&<ArrowRight aria-hidden className="h-4 w-4 text-primary"/>}</li>)}</ol>;}
export default function Bloco({index,r,set,refs,c,disabled,cadeiraId}:{index:number;r:Respostas;set:(k:string,v:any)=>void;refs:Refs;c:Config;disabled:boolean;cadeiraId?:string}){

 const field=(campo:Campo,key:string)=> <Field campo={campo} value={r[key]} onChange={v=>set(key,v)} refs={refs} config={c} disabled={disabled}/>;
 const grupo=(campos:Campo[],key:string)=> <Grupo campos={campos} value={r[key]} onChange={v=>set(key,v)} refs={refs} config={c} disabled={disabled}/>;
 const multi=(key:string,items:{id:string;titulo:string}[],limite?:number)=> <div className="space-y-3">{items.map(d=><label key={d.id} className="flex gap-3 items-start text-sm"><Checkbox checked={lista(r,key).includes(d.id)} disabled={disabled||(!lista(r,key).includes(d.id)&&!!limite&&lista(r,key).length>=limite)} onCheckedChange={v=>set(key,v?[...lista(r,key),d.id]:lista(r,key).filter(x=>x!==d.id))}/><span>{d.titulo}</span></label>)}</div>;
 const cards=(items:Config['projetos'],render:(id:string)=>React.ReactNode)=> <div className="space-y-3">{items.map(d=><details key={d.id} className="rounded-md border p-4"><summary className="font-medium cursor-pointer">{d.titulo}{d.selo&&<Badge variant={d.selo==='Condicionado'?'outline':'secondary'} className="ml-2">{d.selo}</Badge>}</summary>{d.descricao&&<p className="text-sm text-muted-foreground mt-3 mb-4">{d.descricao}</p>}<div className="mt-3">{render(d.id)}</div></details>)}</div>;
 const render=(p:Pergunta)=>{
 switch(p.id){
 case '3.2':return <div className="space-y-4">{c.diretrizes.map(d=><div key={d.id} className="rounded-md border p-4 space-y-3"><h3 className="font-semibold">{d.id} · {d.titulo}</h3><p className="text-sm text-muted-foreground">{d.descricao}</p>{d.porque&&<p className="text-sm border-l-2 border-primary/40 pl-3"><span className="font-medium">Por quê:</span> {d.porque}</p>}{field(escolha('Sua posição',POSICOES),`3.pos.${d.id}`)}{multi('3.selecionadas',[{id:d.id,titulo:'Uma das 3 que mais me afetam'}],3)}</div>)}<p className="text-sm text-muted-foreground">{lista(r,'3.selecionadas').length}/3 diretrizes selecionadas</p></div>;
 case '3.3':return <div className="space-y-4">{lista(r,'3.selecionadas').map(id=><div className="border rounded-md p-4 space-y-4" key={id}><h3 className="font-semibold">{c.diretrizes.find(d=>d.id===id)?.titulo}</h3>{grupo([texto('Objeção mais forte','Qual é a objeção mais forte que alguém faria a ela?'),texto('O que precisa ser verdade','O que precisa ser verdade para dar certo?'),texto('O que sua área vai fazer','O que a sua área vai fazer por ela?'),{nome:'KPI',rotulo:'Qual indicador do BSC Rev.03 a sua área move com ela?',tipo:'kpi'},texto('Quanto espera mover em 2027','E quanto espera mover em 2027?')],`3.detalhe.${id}`)}</div>)}{!lista(r,'3.selecionadas').length&&<p className="text-sm text-muted-foreground">Selecione suas diretrizes em 3.2.</p>}</div>;
 case '3.4':return <div className="space-y-4">{c.diretrizes.filter(d=>['Ajustaria','Discordo'].includes(r[`3.pos.${d.id}`])&&!lista(r,'3.selecionadas').includes(d.id)).map(d=><div key={d.id}>{field(texto(`${d.titulo} · Qual o ajuste?`),`3.ajuste.${d.id}`)}</div>)}</div>;
 case '3.5':return <div className="space-y-4">{multi('3.5.objetivos',refs.objetivos.map(o=>({id:o.id,titulo:`${o.codigo} · ${o.nome}`})))}{field(texto('O que falta cobrir?'),'3.5.texto')}</div>;
 case '4A':return cards(c.projetos,id=>grupo([texto('Por que fracassou','Por que fracassou?'),texto('Ponto cego da ficha'),escolha('Impacto',['Ajuda','Atrapalha','Neutro']),texto('Comentário','Comentário sobre o impacto na sua área')],`4A.${id}`));
 case '4.1':return <div className="space-y-4">{multi('4.1',c.projetos,2)}{field(texto('Por quê?'),'4.1.porque')}</div>;
 case '4.2':return <div className="space-y-4">{field({nome:'Projeto a adiar',tipo:'projeto'},'4.2')}{field(texto('O que o faria voltar à pauta?'),'4.2.porque')}</div>;
 case '4C':return cards(c.produtos,id=>grupo([...(c.produtos.find(d=>d.id===id)?.titulo==='Outro'?[texto('Nome')]:[]),escolha('Posição',POSICOES_PRODUTO),texto('Impacto na sua área e o que garantir na transição','Impacto na sua área e o que garantir na transição (alunos ativos, contratos, receita prevista)')],`4C.${id}`));
 case '5.riscos':return <div className="space-y-5">{c.escolhas.map(d=><div className="border rounded-md p-4 space-y-4" key={d.id}><h3 className="font-medium">{d.id} · {d.titulo}</h3><CaixaDecisao texto={d.caixa}/>{grupo([texto('Risco'),texto('Como mitigaria')],d.id)}</div>)}</div>;
 }
 if(p.tipo==='frase')return <div className="space-y-3">{grupo(p.campos??[],p.id)}<p className="rounded-md border-l-4 border-primary bg-muted/50 p-3 text-sm" aria-live="polite">{montarFrase(r[p.id])}</p></div>;
 if(p.tipo==='grupo')return grupo(p.campos??[],p.id);
 if(p.tipo==='lista')return <Lista p={p} r={r} set={set} refs={refs} config={c} disabled={disabled}/>;
 if(p.tipo==='escolha')return field(escolha('Sua escolha',p.opcoes??[]),p.id);
 if(p.tipo==='processo')return grupo([{nome:'Processo',tipo:'processo'},texto('Texto')],p.id);
 return field(texto(c.notas[p.id]??'Sua resposta'),p.id);
 };
 const nota=c.notas[`b${index}`];
 return <div className="space-y-8">
 {index===0&&<div className="space-y-4">{nota&&<p className="leading-relaxed">{nota}</p>}<CadeiaBsc/>{c.notas['b0.fim']&&<p className="text-sm text-muted-foreground">{c.notas['b0.fim']}</p>}</div>}
 {index===3&&<blockquote className="border-l-4 border-primary pl-4 space-y-2"><p className="text-base font-medium">{c.tese}</p>{c.teseExplicacao&&<p className="text-sm text-muted-foreground">{c.teseExplicacao}</p>}</blockquote>}
 {index!==0&&nota&&<p className="text-sm text-muted-foreground">{nota}</p>}
 {c.perguntas[index].map(p=><div key={p.id} className="space-y-6">{p.grupo&&<><h3 className="text-lg font-semibold text-primary pt-2">{p.grupo}</h3></>}{index===0?<PerguntaBloco0 p={p} r={r} set={set} refs={refs} c={c} disabled={disabled}/>:<section className="space-y-4 border-b pb-8"><h2 className="text-base font-semibold">{p.id==='5.riscos'?'':`${p.id} · `}{p.titulo??p.texto}</h2>{p.titulo&&<p className="text-sm">{p.texto}</p>}{p.apoio&&<details className="rounded-md border p-3 text-sm"><summary className="cursor-pointer font-medium">Apoio: por que importa, como fazer, o que entregar</summary><dl className="mt-3 space-y-2"><div><dt className="font-medium">Por que importa</dt><dd className="text-muted-foreground">{p.apoio.porque}</dd></div><div><dt className="font-medium">Como fazer</dt><dd className="text-muted-foreground">{p.apoio.como}</dd></div><div><dt className="font-medium">O que entregar</dt><dd className="text-muted-foreground">{p.apoio.entregar}</dd></div></dl></details>}<CaixaDecisao texto={c.caixas?.[p.id]}/>{(p.ajuda||c.notas[p.id])&&<p className="text-sm text-muted-foreground">{p.ajuda??c.notas[p.id]}</p>}{render(p)}</section>}</div>)}
 </div>;
}
