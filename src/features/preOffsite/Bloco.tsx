import { Checkbox } from '@/components/ui/checkbox';
import type { Config,Campo,Pergunta } from './config';
import { POSICOES,CONTINUIDADE,STATUS } from './config';
import { Field,Grupo,Lista,type Refs } from './Fields';
import { lista,type Respostas } from './domain';
const texto=(nome:string):Campo=>({nome});
const escolha=(nome:string,opcoes:string[]):Campo=>({nome,tipo:'escolha',opcoes});
export default function Bloco({index,r,set,refs,c,disabled}:{index:number;r:Respostas;set:(k:string,v:any)=>void;refs:Refs;c:Config;disabled:boolean}){
 const field=(campo:Campo,key:string)=> <Field campo={campo} value={r[key]} onChange={v=>set(key,v)} refs={refs} config={c} disabled={disabled}/>;
 const grupo=(campos:Campo[],key:string)=> <Grupo campos={campos} value={r[key]} onChange={v=>set(key,v)} refs={refs} config={c} disabled={disabled}/>;
 const multi=(key:string,items:{id:string;titulo:string}[],limite?:number)=> <div className="space-y-3">{items.map(d=><label key={d.id} className="flex gap-3 items-start text-sm"><Checkbox checked={lista(r,key).includes(d.id)} disabled={disabled||(!lista(r,key).includes(d.id)&&!!limite&&lista(r,key).length>=limite)} onCheckedChange={v=>set(key,v?[...lista(r,key),d.id]:lista(r,key).filter(x=>x!==d.id))}/><span>{d.titulo}</span></label>)}</div>;
 const cards=(items:Config['projetos'],render:(id:string)=>React.ReactNode)=> <div className="space-y-3">{items.map(d=><details key={d.id} className="rounded-md border p-4"><summary className="font-medium cursor-pointer">{d.titulo}</summary><p className="text-sm text-muted-foreground mt-3 mb-4">{d.descricao}</p>{render(d.id)}</details>)}</div>;
 const render=(p:Pergunta)=>{
 switch(p.id){
 case '3.2':return <div className="space-y-4">{c.diretrizes.map(d=><div key={d.id} className="rounded-md border p-4 space-y-3"><h3 className="font-semibold">{d.id} · {d.titulo}</h3><p className="text-sm text-muted-foreground">{d.descricao}</p>{field(escolha('Sua posição',POSICOES),`3.pos.${d.id}`)}{multi('3.selecionadas',[{id:d.id,titulo:'Entre as 3 que mais afetam minha área'}],3)}</div>)}<p className="text-sm text-muted-foreground">{lista(r,'3.selecionadas').length}/3 diretrizes selecionadas</p></div>;
 case '3.3':return <div className="space-y-4">{lista(r,'3.selecionadas').map(id=><div className="border rounded-md p-4 space-y-4" key={id}><h3 className="font-semibold">{c.diretrizes.find(d=>d.id===id)?.titulo}</h3>{grupo([texto('Objeção mais forte'),texto('O que precisa ser verdade'),texto('O que sua área vai fazer'),{nome:'KPI',tipo:'kpi'},texto('Quanto espera mover em 2027')],`3.detalhe.${id}`)}</div>)}{!lista(r,'3.selecionadas').length&&<p className="text-sm text-muted-foreground">Selecione suas diretrizes em 3.2.</p>}</div>;
 case '3.4':return <div className="space-y-4">{c.diretrizes.filter(d=>['Ajustaria','Discordo'].includes(r[`3.pos.${d.id}`])&&!lista(r,'3.selecionadas').includes(d.id)).map(d=><div key={d.id}>{field(texto(`${d.titulo} · Qual o ajuste?`),`3.ajuste.${d.id}`)}</div>)}</div>;
 case '3.5':return <div className="space-y-4">{multi('3.5.objetivos',refs.objetivos.map(o=>({id:o.id,titulo:`${o.codigo} · ${o.nome}`})))}{field(texto('O que falta cobrir?'),'3.5.texto')}</div>;
 case '4A':return cards(c.projetos,id=>grupo([texto('Por que fracassou'),texto('Ponto cego da ficha'),escolha('Impacto',['Ajuda','Atrapalha','Neutro']),texto('Comentário')],`4A.${id}`));
 case '4.1':return <div className="space-y-4">{multi('4.1',c.projetos,2)}{field(texto('Por quê?'),'4.1.porque')}</div>;
 case '4.2':return <div className="space-y-4">{field({nome:'Projeto a adiar',tipo:'projeto'},'4.2')}{field(texto('O que o faria voltar à pauta?'),'4.2.porque')}</div>;
 case '4B':return cards(c.andamento,id=><div className="space-y-4">{grupo([escolha('Relação',['Minha área é dona','É impactada','Não se aplica'])],`4B.${id}`)}{r[`4B.${id}`]?.Relação&&r[`4B.${id}`]?.Relação!=='Não se aplica'&&grupo([escolha('Continuidade',CONTINUIDADE),escolha('Status',STATUS),texto('Comentário')],`4B.${id}`)}</div>);
 case '4C':return cards(c.produtos,id=>grupo([...(c.produtos.find(d=>d.id===id)?.titulo==='Outro'?[texto('Nome')]:[]),escolha('Posição',['Concordo em encerrar','Manteria']),texto('Impacto na sua área e o que garantir na transição')],`4C.${id}`));
 case '5.riscos':return <div className="space-y-5">{c.escolhas.map(d=><div className="border rounded-md p-4 space-y-4" key={d.id}><h3 className="font-medium">{d.id} · {d.titulo}</h3>{grupo([texto('Risco'),texto('Como mitigaria')],d.id)}</div>)}</div>;
 case '6.1':return grupo([texto('Claro'),texto('Faltando'),texto('Conflita')],'6.1');
 case '6.3':return <div className="space-y-4">{c.temas.map((t,i)=><div key={t}>{field(escolha(t,['Funciona bem','Demora para sair','Sem dono claro','É decidida fora do processo ou da regra']),`6.3.${i}`)}</div>)}</div>;
 }
 if(p.tipo==='lista')return <Lista p={p} r={r} set={set} refs={refs} config={c} disabled={disabled}/>;
 if(p.tipo==='escolha')return field(escolha('Sua escolha',p.opcoes??[]),p.id);
 if(p.tipo==='processo')return grupo([{nome:'Processo',tipo:'processo'},texto('Texto')],p.id);
 return field(texto(c.notas[p.id]??'Sua resposta'),p.id);
 };
 return <div className="space-y-8">{index===2&&<blockquote className="border-l-4 border-primary pl-4 text-base font-medium">{c.tese}</blockquote>}{c.notas[String(index+1)]&&<p className="text-sm text-muted-foreground">{c.notas[String(index+1)]}</p>}{c.perguntas[index].map(p=><section key={p.id} className="space-y-4 border-b pb-8"><h2 className="text-base font-semibold">{p.id} · {p.texto}</h2>{(p.ajuda||c.notas[p.id])&&<p className="text-sm text-muted-foreground">{p.ajuda??c.notas[p.id]}</p>}{render(p)}</section>)}</div>;
}
