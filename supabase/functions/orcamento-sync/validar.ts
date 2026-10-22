export function validarExport(body: unknown) {
  const registros = typeof body === 'object' && body != null && 'registros' in body ? (body as {registros:unknown}).registros : null;
  if (!Array.isArray(registros) || registros.length > 10000) throw new Error('Contrato inválido');
  const vistos=new Set<string>();
  return registros.map(r=>{
    if(!r||typeof r!=='object'||typeof r.centro_custo!=='string'||!r.centro_custo.trim()||r.centro_custo.length>200||typeof r.competencia!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(r.competencia)||typeof r.realizado!=='number'||!Number.isFinite(r.realizado)||r.orcado!=null&&(typeof r.orcado!=='number'||!Number.isFinite(r.orcado)))throw new Error('Contrato inválido');
    const k=`${r.centro_custo.trim()}:${r.competencia}`;if(vistos.has(k))throw new Error('Centro/mês duplicado');vistos.add(k);
    return {centro_custo:r.centro_custo.trim(),competencia:r.competencia,realizado:r.realizado,orcado:r.orcado??null};
  });
}