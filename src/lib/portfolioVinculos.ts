export type VinculoPortfolio = { id:string; fonte_tipo:'projeto'|'iniciativa'; fonte_id:string; tipo:'objetivo'|'indicador'; ref_id:string; origem:'legado'|'ia'|'ia_revisao'|'manual'; impacto?:'principal'|'secundario'|null; revisar?:boolean; revisar_motivo?:string|null; status:'proposto'|'validado'|'removido'; justificativa:string; confianca:'alta'|'media'|'baixa'|null; validado_nome:string|null; validado_em:string|null; editado_nome?:string|null; editado_em?:string|null };
export function seloVinculo(v: Pick<VinculoPortfolio,'status'|'origem'|'validado_nome'|'validado_em'> & {impacto?:string|null;revisar?:boolean;editado_nome?:string|null;editado_em?:string|null}) {
 const imp=v.impacto==='principal'?' · Principal':v.impacto==='secundario'?' · Secundário':'';
 if(v.status==='validado')return `Validado por ${v.validado_nome || 'usuário autorizado'} em ${v.validado_em ? new Date(v.validado_em).toLocaleDateString('pt-BR') : '—'}${imp}`;
 const o=v.origem==='ia'?'IA':v.origem==='ia_revisao'?'IA – revisão':v.origem==='manual'?'manual':'legado';
 const ed=v.editado_em?` · editado por ${v.editado_nome||'usuário autorizado'} em ${new Date(v.editado_em).toLocaleDateString('pt-BR')}`:'';
 return `Proposto (${o})${imp} · ${v.revisar?'revisar':'a validar'}${ed}`;
}
export function resumoVinculos(vs: VinculoPortfolio[]) {const ativos=vs.filter(v=>v.status!=='removido');return {total:ativos.length,aValidar:ativos.filter(v=>v.status==='proposto').length};}
