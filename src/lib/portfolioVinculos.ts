export type VinculoPortfolio = { id:string; fonte_tipo:'projeto'|'iniciativa'; fonte_id:string; tipo:'objetivo'|'indicador'; ref_id:string; origem:'legado'|'ia'|'manual'; status:'proposto'|'validado'|'removido'; justificativa:string; confianca:'alta'|'media'|'baixa'|null; validado_nome:string|null; validado_em:string|null };
export function seloVinculo(v: Pick<VinculoPortfolio,'status'|'origem'|'validado_nome'|'validado_em'>) {
 if(v.status==='validado')return `Validado por ${v.validado_nome || 'usuário autorizado'} em ${v.validado_em ? new Date(v.validado_em).toLocaleDateString('pt-BR') : '—'}`;
 return v.origem==='ia'?'Proposto (IA) · a validar':'Proposto (legado) · a validar';
}
export function resumoVinculos(vs: VinculoPortfolio[]) {const ativos=vs.filter(v=>v.status!=='removido');return {total:ativos.length,aValidar:ativos.filter(v=>v.status==='proposto').length};}
