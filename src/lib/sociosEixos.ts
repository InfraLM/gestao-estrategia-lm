import { normalizar, type Eixos, type Respostas } from "./sociosTradeoff";

const chaveNome = (nome: string) => nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
const conhecidos = ["CLETO", "IAN", "IURI", "NAIRA", "YURI"];
const siglas = ["CL", "IA", "IU", "NA", "YR"];

/** Stable identity independent of answer availability and axis. Reserve the current participants' initials. */
export function identidadesSocios(pessoas: { id: string; nome: string }[]) {
  const usadas = new Set(siglas);
  const atribuidas = new Set<string>();
  return [...pessoas].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.id.localeCompare(b.id)).map(p => {
    const nome = chaveNome(p.nome);
    const partes = nome.split(/\s+/);
    const primeiro = partes[0] ?? "";
    const conhecido = conhecidos.findIndex(n => primeiro === n || (n === "CLETO" && nome.includes("CLETO")));
    let sigla = conhecido >= 0 ? siglas[conhecido] : "";
    if (!sigla || atribuidas.has(sigla)) {
      const letras = nome.replace(/[^A-Z]/g, "") || "SO";
      const candidatos = [partes.length > 1 ? `${primeiro[0]}${partes.at(-1)?.[0]}` : letras.slice(0, 2)];
      for (const a of letras) for (const b of letras) candidatos.push(a + b);
      for (const a of letras) for (const b of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") candidatos.push(a + b);
      sigla = candidatos.find(s => s.length === 2 && !usadas.has(s)) ?? "SO";
    }
    usadas.add(sigla);
    atribuidas.add(sigla);
    const hash = [...nome].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0);
    return { ...p, sigla, cor: conhecido >= 0 ? conhecido : hash % 8 };
  });
}

export function consensoEixo(valores: (number | null)[]) {
  const validos = valores.filter((v): v is number => v !== null && Number.isFinite(v));
  if (!validos.length) return null;
  const min = Math.min(...validos), max = Math.max(...validos), amplitude = max - min;
  return { min, max, amplitude, divergencia: amplitude > 30 ? "alta" : amplitude >= 15 ? "média" : "baixa", participantes: validos.length };
}

/** Lists precisely the answered inputs used by calcularEixos, including confirmed rankings only. */
export function respostasDoEixo(r0: Respostas, eixo: keyof Eixos): string[] {
  const r = normalizar(r0);
  const campos = eixo === "core" ? [["motor", "Motor"], ["portfolio", "Portfólio"], ["trafego", "Mídia"]] : eixo === "caixa" ? [["ritmo", "Ritmo"], ["divida", "Dívida"], ["caixa_min", "Caixa mínimo"]] : [["ritmo", "Ritmo"], ["divida", "Dívida"]];
  const out = campos.filter(([campo]) => r[campo]).map(([campo, label]) => `${label} ${r[campo]}${campo === "caixa_min" ? " mês(es)" : ""}`);
  const itens = eixo === "core" ? ["novos"] : eixo === "caixa" ? ["sp", "reserva"] : ["distrib"];
  if (r.invest_ok && r.invest?.length === 6) itens.forEach(item => {
    const index = r.invest?.indexOf(item) ?? -1;
    if (index >= 0) out.push(`Ranking “${item}” ${index + 1}º`);
  });
  return out;
}