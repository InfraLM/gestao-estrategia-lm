import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
const labels:Record<string,string>={intro:'Introdução',tese:'Tese',anexo:'Anexo para a condução',blocos:'Títulos das etapas',perguntas:'Perguntas por etapa',diretrizes:'Diretrizes',projetos:'Projetos propostos',andamento:'Projetos em andamento',produtos:'Produtos fora do núcleo',escolhas:'Grandes escolhas',temas:'Temas de decisão',notas:'Orientações e exemplos',texto:'Pergunta',titulo:'Título',descricao:'Descrição',nome:'Nome do campo',opcoes:'Alternativas',ajuda:'Orientação'};
export default function ConfigEditor({value,onChange,path=''}:{value:any;onChange:(v:any)=>void;path?:string}){
 const id=useId();
 if(typeof value==='string'||typeof value==='number'){return <label className="block space-y-1 text-sm" htmlFor={id}><span>{labels[path.split('.').at(-1)??'']??path.split('.').at(-1)}</span>{typeof value==='number'?<Input id={id} type="number" value={value} disabled/>:<Textarea id={id} rows={value.length>160?4:2} value={value} onChange={e=>onChange(e.target.value)}/>}</label>}
 if(Array.isArray(value))return <div className="space-y-3">{value.map((v,i)=><details key={i} className="border rounded-md p-3"><summary className="cursor-pointer font-medium text-sm">{v?.titulo??v?.texto??v?.nome??(Array.isArray(v)?`Etapa ${i+1}`:`Item ${i+1}`)}</summary><div className="mt-3 space-y-3"><ConfigEditor value={v} path={`${path}.${i}`} onChange={next=>onChange(value.map((x,j)=>j===i?next:x))}/></div></details>)}</div>;
 if(value&&typeof value==='object')return <div className="space-y-4">{Object.entries(value).filter(([k])=>!['id','tipo','limite','nome'].includes(k)).map(([k,v])=><div key={k}><h4 className="text-sm font-semibold mb-2">{labels[k]??k}</h4><ConfigEditor value={v} path={path?`${path}.${k}`:k} onChange={next=>onChange({...value,[k]:next})}/></div>)}</div>;
 return null;
}
