import { z } from 'zod';
import type { Config } from './config';
import { montarFrase } from './config';
export type Respostas=Record<string, any>;
export const respostaSchema=z.record(z.unknown()).refine(v=>JSON.stringify(v).length<=1000000,'Resposta muito extensa');
export const lista=(r:Respostas,k:string):any[]=>Array.isArray(r[k])?r[k]:[];
export const presente=(v:any):boolean=>Array.isArray(v)?v.length>0&&v.every(presente):v&&typeof v==='object'?Object.values(v).length>0&&Object.values(v).every(presente):v!==undefined&&v!==null&&String(v).trim()!=='';
export function completude(r:Respostas,c:Config):{percentual:number;etapas:boolean[];avisos:string[]} {
 const avisos:string[]=[]; const etapas=c.perguntas.map((qs,b)=>{
 const faltas:string[]=[];
 for(const p of qs){ let ok=presente(r[p.id]);
 if(p.tipo==='lista'){const rows=lista(r,p.id);ok=rows.length>0&&rows.every(row=>(p.campos??[]).every(f=>presente(row?.[f.nome])));if(['2.1','6.2'].includes(p.id))ok=ok&&rows.length===3;if(p.minimo)ok=ok&&rows.length>=p.minimo;}
 if(p.tipo==='grupo'||p.tipo==='frase')ok=(p.campos??[]).every(f=>presente(r[p.id]?.[f.nome]));
 if(p.id==='3.2')ok=lista(r,'3.selecionadas').length===3&&c.diretrizes.every(d=>presente(r[`3.pos.${d.id}`]));
 if(p.id==='3.3')ok=lista(r,'3.selecionadas').length===3&&lista(r,'3.selecionadas').every(id=>['Objeção mais forte','O que precisa ser verdade','O que sua área vai fazer','KPI','Quanto espera mover em 2027'].every(k=>presente(r[`3.detalhe.${id}`]?.[k])));
 if(p.id==='3.4')ok=c.diretrizes.filter(d=>['Ajustaria','Discordo'].includes(r[`3.pos.${d.id}`])&&!lista(r,'3.selecionadas').includes(d.id)).every(d=>presente(r[`3.ajuste.${d.id}`]));
 if(p.id==='3.5')ok=presente(r['3.5.texto']);
 if(p.id==='4A')ok=c.projetos.every(d=>['Por que fracassou','Ponto cego da ficha','Impacto','Comentário'].every(k=>presente(r[`4A.${d.id}`]?.[k])));
 if(p.id==='4.1')ok=lista(r,'4.1').filter(id=>c.projetos.some(d=>d.id===id)).length===2&&presente(r['4.1.porque']);
 if(p.id==='4.2')ok=c.projetos.some(d=>d.id===r['4.2'])&&presente(r['4.2.porque']);
 if(p.id==='4C')ok=c.produtos.filter(d=>d.titulo!=='Outro'||presente(r[`4C.${d.id}`]?.Nome)).every(d=>['Posição','Impacto na sua área e o que garantir na transição'].every(k=>presente(r[`4C.${d.id}`]?.[k])));
 if(p.id==='5.riscos')ok=c.escolhas.every(d=>presente(r[d.id]?.Risco)&&presente(r[d.id]?.['Como mitigaria']));
 if(!ok)faltas.push(`${p.id} · ${p.titulo??p.texto}`);
 }
 avisos.push(...faltas);return faltas.length===0;
 });
 const total=c.perguntas.flat().length;const percentual=Object.keys(r).length?Math.round((total-avisos.length)/total*100):0;
 for(const [i,p] of lista(r,'4.3').entries())if(custoDiverge(p))avisos.push(`4.3 · Proposta ${i+1}: soma dos trimestres difere do custo total.`);
 return{percentual,etapas,avisos};
}
export function numero(v:any):number{if(typeof v==='number')return v;const s=String(v??'').replace(/R\$\s?/g,'').trim();return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)||0;}
export const custoDiverge=(p:Record<string,any>)=>Math.abs(['T1','T2','T3','T4'].reduce((s,k)=>s+numero(p[k]),0)-numero(p['Custo total']))>0.01;
export function divergencias(r:Respostas,c:Config):{titulo:string;dados:any}[]{
 const d:{titulo:string;dados:any}[]=[];
 const discordas=c.diretrizes.filter(x=>r[`3.pos.${x.id}`]==='Discordo');if(discordas.length)d.push({titulo:'1 · Diretrizes em discordância e indicadores',dados:discordas.map(x=>({diretriz:x.titulo,detalhes:r[`3.detalhe.${x.id}`],ajuste:r[`3.ajuste.${x.id}`]}))});
 d.push({titulo:'2 · Arquitetura do portfólio, mix de pagamento e working money',dados:{'5.7':r['5.7'],'5.1':r['5.1'],'5.4':r['5.4']}});
 d.push({titulo:'3 · Programas do 4B a encerrar ou ajustar e produtos fora do núcleo',dados:{andamento:lista(r,'4B').filter(x=>['Ajusta escopo','Encerra'].includes(x?.['Posição'])),produtos:c.produtos.map(x=>({item:x.titulo,...r[`4C.${x.id}`]}))}});
 d.push({titulo:'4 · Reação ao mandato',dados:{'6.1':r['6.1'],'6.2':r['6.2'],'6.4':r['6.4']}});
 d.push({titulo:'5 · Novas frentes e funções',dados:{'7.1':r['7.1']}});
 d.push({titulo:'6 · Processos críticos e estruturantes, autonomia e continuidade',dados:{'7.3':r['7.3'],'0.2':r['0.2'],'0.3':r['0.3'],'0.6':r['0.6']}});return d;
}
export const moeda=(v:any)=>numero(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function resumoResposta(r:Respostas,p:string,c:Config):any{
 if(p==='0.17')return r['0.17']&&typeof r['0.17']==='object'?montarFrase(r['0.17']):undefined;
 if(p==='3.2')return c.diretrizes.map(d=>({Diretriz:d.titulo,Posição:r[`3.pos.${d.id}`]??'',Prioritária:lista(r,'3.selecionadas').includes(d.id)}));
 if(p==='3.3')return lista(r,'3.selecionadas').map(id=>({Diretriz:c.diretrizes.find(d=>d.id===id)?.titulo,...r[`3.detalhe.${id}`]}));
 if(p==='3.4')return c.diretrizes.filter(d=>r[`3.ajuste.${d.id}`]).map(d=>({Diretriz:d.titulo,Ajuste:r[`3.ajuste.${d.id}`]}));
 if(p==='3.5')return{Objetivos:r['3.5.objetivos'],Texto:r['3.5.texto']};
 if(['4A','4C'].includes(p)){const items=p==='4A'?c.projetos:c.produtos;return items.map(d=>({Item:d.titulo,...r[`${p}.${d.id}`]}));}
 if(p==='4.1'||p==='4.2')return{Seleção:r[p],Justificativa:r[`${p}.porque`]};
 if(p==='5.riscos')return c.escolhas.map(d=>({Escolha:d.titulo,...r[d.id]}));return r[p];
}
export function validarConfig(c:unknown,base:Config):Config{
 const item=z.object({id:z.string(),titulo:z.string(),descricao:z.string().optional(),porque:z.string().optional(),selo:z.string().optional(),caixa:z.string().optional()});
 const campo=z.object({nome:z.string(),rotulo:z.string().optional(),placeholder:z.string().optional(),tipo:z.enum(['texto','numero','mes','escolha','objetivo','kpi','cadeira','processo','diretriz','projeto']).optional(),opcoes:z.array(z.string()).optional()});
 const pergunta=z.object({id:z.string(),texto:z.string(),titulo:z.string().optional(),grupo:z.string().optional(),tipo:z.enum(['lista','escolha','multipla','processo','texto','grupo','frase']).optional(),campos:z.array(campo).optional(),opcoes:z.array(z.string()).optional(),limite:z.number().optional(),minimo:z.number().optional(),ajuda:z.string().optional(),apoio:z.object({porque:z.string(),como:z.string(),entregar:z.string()}).optional()});
 const v=z.object({versao:z.string().optional(),titulo:z.string().optional(),organizacao:z.string().optional(),tempo:z.string().optional(),intro:z.string(),bscTexto:z.string().optional(),bsc:z.array(z.object({ordem:z.string(),perspectiva:z.string(),pergunta:z.string()})).optional(),bscFecho:z.string().optional(),antes:z.string().optional(),tese:z.string(),teseExplicacao:z.string().optional(),anexo:z.string(),blocos:z.array(z.string()).length(9),perguntas:z.array(z.array(pergunta)).length(9),diretrizes:z.array(item).length(10),projetos:z.array(item),andamento:z.array(item),produtos:z.array(item),escolhas:z.array(item),temas:z.array(z.string()),notas:z.record(z.string()),caixas:z.record(z.string()).optional()}).parse(c) as Config;
 for(const k of ['diretrizes','projetos','andamento','produtos','escolhas'] as const)if(JSON.stringify(v[k].map(x=>x.id))!==JSON.stringify(base[k].map(x=>x.id)))throw new Error('Preserve os identificadores e a ordem dos itens existentes.');
 if(JSON.stringify(v.perguntas.map(q=>q.map(p=>p.id)))!==JSON.stringify(base.perguntas.map(q=>q.map(p=>p.id))))throw new Error('Preserve os identificadores das perguntas.');return v;
}
export const normalizarNome=(v:any)=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2).sort().join(' ');
const parecido=(a:string,b:string)=>{if(!a||!b)return false;if(a===b||a.includes(b)||b.includes(a))return true;const x=new Set(a.split(' ')),y=b.split(' ');const inter=y.filter(w=>x.has(w)).length;return inter/Math.min(x.size,y.length)>=0.6;};
export type Item4B={diretor:string;cadeira_id:string;Nome:string;Posição:string;'Status hoje':string;Comentário:string;duplicado:boolean};
export function itens4B(rs:{nome:string;cadeira_id:string;respostas:Respostas}[]):Item4B[]{
 const itens=rs.flatMap(r=>lista(r.respostas,'4B').filter(x=>presente(x?.Nome)).map(x=>({diretor:r.nome,cadeira_id:r.cadeira_id,Nome:String(x.Nome),Posição:x['Posição']??'','Status hoje':x['Status hoje']??'',Comentário:x['Comentário']??'',duplicado:false,n:normalizarNome(x.Nome)})));
 return itens.map(i=>{const{n,...rest}=i;return{...rest,duplicado:itens.some(o=>o!==i&&o.cadeira_id!==i.cadeira_id&&parecido(n,o.n))};});
}
