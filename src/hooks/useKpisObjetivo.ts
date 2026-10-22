import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { carregarSituacoesKpi } from '@/hooks/useAvaliacoesBsc';
import { avaliarPorTipo, apontamentoMaisRecente, contarAvaliacoes, STATUS_ENTREGA_LBL } from '@/lib/avaliacaoBsc';
import { competenciaDaSemana } from '@/lib/rotinaSemanal';
import { atingimentoMeta, valorEscalar } from '@/lib/impactoFinanceiro';
import rev02 from '@/data/bscRev02.json';
import { metas2030Arvore } from '@/data/metas2030';
const db = supabase as any;
export function montarKpisObjetivo(inds:any[], metas:any[], lancs:any[], cks:any[], arv:any[], arvData:string|null, hoje=new Date()) {
  const mes = hoje.toISOString().slice(0,7);
  return inds.filter(i=>i.origem==='bsc'&&!i.parent_id&&i.nivel!=='Operacional').map(i=>{
    const tree = arv.flatMap(o=>o.kpis??[]).find(k=>String(k.kpi).trim()===String(i.nome).trim());
    // Latest revision for each month; reopened empty revision never resurrects previous revision's value.
    const porMes = new Map<string,any>();
    for(const l of lancs.filter(l=>l.indicador_id===i.id&&l.competencia<=mes).sort((a,b)=>b.revisao-a.revisao)) if(!porMes.has(l.competencia))porMes.set(l.competencia,l);
    const ls=[...porMes.values()].filter(l=>!l.sem_medicao).sort((a,b)=>b.competencia.localeCompare(a.competencia));
    const candidato:any[] = ls.filter(l=>l.valor!=null).map(l=>({valor:Number(l.valor),texto:String(l.valor),comp:l.competencia,data:l.updated_at??l.competencia,fonte:'Lançamento mensal'}));
    for(const ck of cks.filter(c=>c.status==='enviado'&&competenciaDaSemana(c.semana)<=mes)){
      const k=ck.conteudo?.kpis_resposta?.find((k:any)=>k.indicador_id===i.id); const n=valorEscalar(k?.situacao_atual);
      if(n!=null)candidato.push({valor:n,texto:k.situacao_atual,comp:competenciaDaSemana(ck.semana),data:ck.enviado_em??ck.semana,fonte:'Checkout enviado'});
    }
    const tn=valorEscalar(tree?.situacaoAtual);
    if(tn!=null)candidato.push({valor:tn,texto:tree.situacaoAtual,comp:arvData?.slice(0,7)??null,data:arvData??'',fonte:'Árvore de KPIs (sem competência confirmada)'});
    const atual=candidato.sort((a,b)=>b.data.localeCompare(a.data))[0];
    const lDeclarado=ls.find(l=>l.declaracao||l.status_entrega);
    const ap=apontamentoMaisRecente(i.id,null,lDeclarado??null,cks);
    const comp=mes;
    const mensal=metas.find(m=>m.indicador_id===i.id&&m.competencia===(atual?.comp??mes))?.meta_mes??null;
    const meta=i.tipo_apontamento==='valor_mensal'&&mensal!=null?mensal:i.meta_semestre??i.meta_texto??tree?.meta2026??null;
    const lancAtual=ls.find(l=>l.competencia===mes);
    const apAtual=apontamentoMaisRecente(i.id,mes,lancAtual??null,cks);
    const metaAtual=metas.find(m=>m.indicador_id===i.id&&m.competencia===mes)?.meta_mes??null;
    const r=avaliarPorTipo({indicador_id:i.id,sentido:i.sentido,competencia:comp,meta_mes:i.tipo_apontamento==='valor_mensal'?metaAtual:null,meta_semestre:i.meta_semestre,meta_texto:i.meta_texto,realizado:lancAtual?.valor??null,tipo:i.tipo_apontamento,prazo_entrega:i.prazo_entrega,apontamento:apAtual},tree?.situacaoAtual?{valor:tree.situacaoAtual,data:arvData}:null,cks,hoje);
    const meta2030=i.meta_2030??tree?.meta2030??metas2030Arvore[String(i.nome).trim()]??null;
    return {...i,aval:r.aval,meta,meta2030,atual:i.tipo_apontamento==='entrega'?(ap?.status_entrega?STATUS_ENTREGA_LBL[ap.status_entrega]:'—'):atual?.texto??tree?.situacaoAtual??'—',valor:atual?.valor??null,data:i.tipo_apontamento==='entrega'?ap?.data:atual?.data,comp:atual?.comp??null,fonte:r.origem??atual?.fonte??null,atingimento:i.tipo_apontamento==='entrega'?null:atingimentoMeta(atual?.valor??null,meta,i.sentido),ating2030:i.tipo_apontamento==='entrega'?null:atingimentoMeta(atual?.valor??null,meta2030,i.sentido)};
  });
}
export function useKpisObjetivo(){
  const [d,setD]=useState<any>({loading:true,itens:[],objetivos:[],error:''});
  useEffect(()=>{let ativo=true; const load=()=>Promise.all([db.from('mt_indicadores').select('*').eq('origem','bsc').eq('status','ativo'),db.from('mt_metas_mensais').select('*'),db.from('mt_lancamentos').select('*'),carregarSituacoesKpi(),db.from('conteudo_editavel').select('valor,updated_at').eq('chave','bsc.rev02').maybeSingle(),db.from('mt_objetivos').select('id,codigo')]).then(([i,m,l,c,a,o]:any[])=>{if(ativo)setD({loading:false,itens:montarKpisObjetivo(i.data??[],m.data??[],l.data??[],c.data??[],a.data?.valor??rev02,a.data?.updated_at??null),objetivos:o.data??[],error:[i,m,l,a,o].some(x=>x.error)?'Não foi possível carregar todos os KPIs.':''});});load();window.addEventListener('orc-atualizado',load);return()=>{ativo=false;window.removeEventListener('orc-atualizado',load);};},[]);
  return {...d,porObjetivo:(codigo:string)=>{const id=d.objetivos.find((o:any)=>o.codigo===codigo)?.id;return d.itens.filter((i:any)=>i.objetivo_id===id);},contar:contarAvaliacoes};
}