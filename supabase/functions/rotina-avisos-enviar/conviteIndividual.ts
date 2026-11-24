type Destinatario = { email: string; nome: string };

/** The caller must supply only active entries read from the curated list. */
export function destinatariosConviteIndividual<T extends Destinatario>(lista: T[], email: unknown): T[] {
  if (typeof email !== "string") throw new Error("Selecione uma pessoa da lista Envio Quick Wins");
  const chave = email.trim().toLowerCase();
  if (!/^[^\s@]+@liberdademedicaedu\.com\.br$/.test(chave)) throw new Error("E-mail corporativo inválido");
  const pessoa = lista.find((l) => l.email.trim().toLowerCase() === chave);
  if (!pessoa) throw new Error("Pessoa não encontrada na lista ativa Envio Quick Wins");
  return [pessoa];
}