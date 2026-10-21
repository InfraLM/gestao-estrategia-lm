/** Missing/empty secrets must never authorize scheduled requests. */
export function cronAutorizado(recebido: string | null, esperado: string | undefined): boolean {
  if (!recebido || !esperado || recebido.length !== esperado.length) return false;
  let diferenca = 0;
  for (let i = 0; i < esperado.length; i++) diferenca |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diferenca === 0;
}
export function destinoSincronizacao(base: string, agendada: boolean, ultimoOk: string | null, modo: string | null = null) {
  const url = new URL(base);
  if (agendada && ultimoOk && modo !== "completa") url.searchParams.set("desde", ultimoOk);
  else url.searchParams.delete("desde");
  return url.toString();
}