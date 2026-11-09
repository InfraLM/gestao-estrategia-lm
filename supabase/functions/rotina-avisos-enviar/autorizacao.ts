export const DESTINO_TESTE = "naira.yurie@liberdademedicaedu.com.br";

export function permiteTesteRestrito(acao: string, email: unknown, validade: string | null, revogado: string | null, agora = Date.now()): boolean {
  return acao === "teste" && typeof email === "string" && email.trim().toLowerCase() === DESTINO_TESTE
    && revogado === null && validade !== null && new Date(validade).getTime() > agora;
}