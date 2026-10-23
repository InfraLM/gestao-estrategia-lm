import { valorEscalar } from '@/lib/impactoFinanceiro';
const norm=(v:unknown)=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const campo=(r:Record<string,unknown>,nomes:string[])=>Object.entries(r).find(([k])=>nomes.some(n=>norm(k)===norm(n)))?.[1];
export type ModeloBudget={codigo:string;nome:string;budget:number|null;fonte:string;centros:string[];erro:string|null};
export function previewBudget(rows:Record<string,unknown>[],projetos:{codigo:string;nome:string}[]):ModeloBudget[]{
 if(rows.length>500)throw new Error('O modelo aceita até 500 linhas.');
 const seen=new Set<string>();return rows.map((r,i)=>{
  const codigo=String(campo(r,['Código do projeto','codigo','código'])??'').trim();
  const p=projetos.find(p=>norm(p.codigo)===norm(codigo));const bruto=campo(r,['Budget liberado R$','budget liberado','budget']);
  const budget=bruto==null||bruto===''?null:valorEscalar(bruto);
  const fonte=String(campo(r,['Fonte da aprovação','fonte'])??'').trim();
  const centros=[...new Set(String(campo(r,['Centro(s) de custo','centros de custo','centro de custo','centros'])??'').split(/[;\n|]/).map(x=>x.trim()).filter(Boolean))];
  let erro:string|null=null;
  if(!p)erro=`Linha ${i+2}: código desconhecido.`;
  else if(seen.has(norm(codigo)))erro=`Linha ${i+2}: projeto duplicado.`;
  else if(bruto!==''&&bruto!=null&&(budget==null||budget<0))erro=`Linha ${i+2}: budget inválido.`;
  else if(budget!=null&&!fonte)erro=`Linha ${i+2}: informe a fonte da aprovação.`;
  const nome=String(campo(r,['Nome','nome do projeto'])??'').trim();
  if(p&&nome&&norm(nome)!==norm(p.nome))erro=`Linha ${i+2}: nome não corresponde ao código.`;
  seen.add(norm(codigo));return {codigo:p?.codigo??codigo,nome:p?.nome??nome,budget,fonte,centros,erro};
 });
}
export type MetaPreview={id:string|null;codigo:string;nome:string;meta:string;anterior:string|null;erro:string|null};
export function previewMetas2030(rows:Record<string,unknown>[],indicadores:any[]):MetaPreview[]{
 const out:MetaPreview[]=[];const seen=new Set<string>();
 for(const r of rows){
  const raw=campo(r,['Meta 2030','2030','meta_2030']);if(raw==null||String(raw).trim()==='')continue;
  const codigo=String(campo(r,['Código','codigo do kpi','codigo kpi'])??'').trim();
  const nome=String(campo(r,['KPI','nome','indicador','indicadores','nome do kpi'])??'').trim();
  const candidatos=indicadores.filter(i=>i.origem==='bsc'&&i.status==='ativo'&&!i.parent_id&&((codigo&&norm(i.codigo)===norm(codigo))||(nome&&(norm(i.nome)===norm(nome)||norm(`${i.codigo} ${i.nome}`)===norm(nome)))));
  const exato=candidatos.filter(i=>nome&&(norm(i.nome)===norm(nome)||norm(`${i.codigo} ${i.nome}`)===norm(nome)));
  const matches=exato.length?exato:candidatos;const i=matches.length===1?matches[0]:null;
  const erro=!i?(matches.length?'Correspondência ambígua':'KPI não encontrado'):seen.has(i.id)?'KPI duplicado':null;
  if(i)seen.add(i.id);out.push({id:i?.id??null,codigo:i?.codigo??codigo,nome:i?.nome??nome,meta:String(raw).trim(),anterior:i?.meta_2030??null,erro});
 }
 return out;
}