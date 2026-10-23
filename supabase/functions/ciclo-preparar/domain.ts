export const escala = ['semanal','quinzenal','mensal','trimestral','semestral'];
export function normalizarFrequencia(p: any, nome: string) {
  const mudanca = escala.includes(p.velocidade_mudanca) ? p.velocidade_mudanca : 'mensal';
  const reacao = escala.includes(p.velocidade_reacao) ? p.velocidade_reacao : 'mensal';
  const fonte = String(p.fonte ?? 'Fonte a confirmar');
  const dre = /dre|ebitda|lucro|margem bruta|receita l.quida|despesas.*rol/i.test(`${nome} ${fonte}`);
  const piso = dre ? 2 : escala.indexOf(p.piso_fonte);
  const frequencia = escala[Math.max(escala.indexOf(mudanca),escala.indexOf(reacao),piso,0)];
  const tratamento = ['Pilotar','Suavizar','Vigiar por exceção','Revisar'].includes(p.tratamento) ? p.tratamento : 'Revisar';
  return { frequencia, velocidade_mudanca:mudanca, velocidade_reacao:reacao, tratamento,
    piso_fonte:escala[Math.max(piso,0)], fonte, frequencia_justificativa:`${String(p.justificativa ?? '').slice(0,1200)} · Fonte proposta: ${fonte}${dre?' · Piso DRE: mensal':''}`, mes_ciclo:null as number|null, semana_mes:null as number|null };
}
export function devida(k: any, d: Date) {
  const w = Math.floor((d.getUTCDate()-1)/7)+1, m=d.getUTCMonth();
  if(k.frequencia==='semanal') return true;
  if(w===5) return false;
  if(k.frequencia==='quinzenal') return w===1||w===3;
  return w===(k.semana_mes??1) && (k.frequencia==='trimestral'?m%3+1===(k.mes_ciclo??1):k.frequencia==='semestral'?m%6+1===(k.mes_ciclo??1):true);
}
/** Greedy min-max scheduling across a complete semester. Never changes Framework frequency or BSC. */
export function distribuir(propostas: any[], fixos: any[], inicio='2026-10-26') {
  const semanas:Date[]=[];const d=new Date(`${inicio}T12:00:00Z`);
  for(let n=0;n<27;n++){semanas.push(new Date(d));d.setUTCDate(d.getUTCDate()+7);}
  const cargas=new Map<string,number[]>();
  const carga=(id:string)=>{let c=cargas.get(id);if(!c){c=semanas.map(d=>fixos.filter(k=>k.cadeira_id===id&&devida(k,d)).length);cargas.set(id,c);}return c;};
  for(const p of [...propostas].sort((a,b)=>escala.indexOf(a.dados.frequencia)-escala.indexOf(b.dados.frequencia))){
    const c=carga(p.cadeira_id??'sem_cadeira'),f=p.dados.frequencia;
    const meses=f==='trimestral'?3:f==='semestral'?6:1;
    let melhor:any;let score=Infinity;
    for(let m=1;m<=meses;m++)for(let w=1;w<=(['semanal','quinzenal'].includes(f)?1:4);w++){
      const k={...p.dados,mes_ciclo:meses>1?m:null,semana_mes:['semanal','quinzenal'].includes(f)?null:w};
      const next=c.map((v,i)=>v+(devida(k,semanas[i])?1:0));
      const s=Math.max(...next)*10000+next.reduce((sum,v)=>sum+v*v,0);
      if(s<score){score=s;melhor=k;}
    }
    p.dados=melhor;c.forEach((_,i)=>{if(devida(melhor,semanas[i]))c[i]++;});
  }
  return { propostas, cargas:[...cargas].map(([cadeira_id,c])=>({cadeira_id,maximo:Math.max(...c),semanas_acima_3:c.filter(n=>n>3).length})) };
}