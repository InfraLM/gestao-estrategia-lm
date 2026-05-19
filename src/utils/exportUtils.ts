import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===================== Filename =====================
export function formatDateForFilename(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ===================== Download blob =====================
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ===================== CSV =====================
export function escapeCsvValue(v: unknown): string {
  if (v == null) return "";
  let s = typeof v === "string" ? v : String(v);
  if (/[",\n\r;]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: string[]
): void {
  if (!rows || rows.length === 0) {
    throw new Error("Sem dados para exportar.");
  }
  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.map(escapeCsvValue).join(",");
  const body = rows
    .map((r) => cols.map((c) => escapeCsvValue(r[c])).join(","))
    .join("\n");
  const csv = "\ufeff" + header + "\n" + body;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

// ===================== XLSX =====================
export type XlsxSheet = { name: string; rows: Record<string, unknown>[] };

export function exportToXlsx(filename: string, sheets: XlsxSheet[]): void {
  const wb = XLSX.utils.book_new();
  let added = 0;
  for (const sh of sheets) {
    if (!sh.rows || sh.rows.length === 0) continue;
    const ws = XLSX.utils.json_to_sheet(sh.rows);
    const cols = Object.keys(sh.rows[0]);
    ws["!cols"] = cols.map((c) => {
      const maxLen = Math.max(
        c.length,
        ...sh.rows.map((r) => (r[c] == null ? 0 : String(r[c]).length))
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
    });
    XLSX.utils.book_append_sheet(wb, ws, sh.name.slice(0, 31));
    added++;
  }
  if (added === 0) throw new Error("Sem dados para exportar.");
  XLSX.writeFile(wb, filename);
}

// ===================== Status Report Payload =====================
export type StatusReportPayload = {
  titulo: string;
  geradoEm: Date;
  periodo: string;
  filtros: { diretor: string; status: string };
  resumo: { verde: number; amarelo: number; vermelho: number };
  processos: Array<{
    id: string;
    nome: string;
    nivel: string;
    diretor: string;
    dono: string;
    status: string;
    maturidade: number | string;
    completude: number;
    farol: string;
  }>;
  aguardandoValidacao: Array<{
    id: string;
    nome: string;
    diretor: string;
    dono: string;
    status: string;
  }>;
  riscosCriticos: Array<{
    processoNome: string;
    diretor: string;
    descricao: string;
    impacto: number;
    ocorrencia: number;
    score: number;
    responsavel: string;
  }>;
  atividadesAtraso: Array<{
    processoNome: string;
    descricao: string;
    responsavel: string;
    prazoLabel: string;
    diasAtraso: number;
    origem: string;
  }>;
};

// ===================== Markdown =====================
function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  if (rows.length === 0) return "_Nenhum registro._\n";
  const escape = (v: string | number) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(escape).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}\n`;
}

export function buildStatusReportMarkdown(p: StatusReportPayload): string {
  const data = p.geradoEm.toLocaleString("pt-BR");
  return [
    `# ${p.titulo}`,
    ``,
    `**Gerado em:** ${data}  `,
    `**Período:** ${p.periodo}  `,
    `**Filtros:** Diretor: ${p.filtros.diretor} · Status: ${p.filtros.status}`,
    ``,
    `## Resumo (Semáforo)`,
    ``,
    mdTable(
      ["On-Track", "Alerta", "Off-Track"],
      [[p.resumo.verde, p.resumo.amarelo, p.resumo.vermelho]]
    ),
    `## Processos (${p.processos.length})`,
    ``,
    mdTable(
      ["ID", "Nome", "Diretor", "Status", "Maturidade", "Completude %", "Farol"],
      p.processos.map((x) => [
        x.id,
        x.nome,
        x.diretor,
        x.status,
        x.maturidade,
        x.completude,
        x.farol,
      ])
    ),
    `## Aguardando Validação (${p.aguardandoValidacao.length})`,
    ``,
    mdTable(
      ["ID", "Nome", "Diretor", "Dono", "Etapa"],
      p.aguardandoValidacao.map((x) => [x.id, x.nome, x.diretor, x.dono, x.status])
    ),
    `## Riscos Críticos (${p.riscosCriticos.length})`,
    ``,
    mdTable(
      ["Processo", "Risco", "Imp.", "Ocorr.", "Score", "Responsável"],
      p.riscosCriticos.map((r) => [
        r.processoNome,
        r.descricao,
        r.impacto,
        r.ocorrencia,
        r.score,
        r.responsavel,
      ])
    ),
    `## Atividades / Planos em Atraso (${p.atividadesAtraso.length})`,
    ``,
    mdTable(
      ["Processo", "Descrição", "Responsável", "Prazo", "Atraso (d)", "Origem"],
      p.atividadesAtraso.map((a) => [
        a.processoNome,
        a.descricao,
        a.responsavel,
        a.prazoLabel,
        a.diasAtraso,
        a.origem,
      ])
    ),
  ].join("\n");
}

export function exportStatusReportMarkdown(p: StatusReportPayload, filename: string): void {
  const md = buildStatusReportMarkdown(p);
  downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8;" }), filename);
}

// ===================== HTML (printable) =====================
export function buildStatusReportHtml(p: StatusReportPayload): string {
  const data = p.geradoEm.toLocaleString("pt-BR");
  const tbl = (headers: string[], rows: Array<Array<string | number>>) => {
    if (rows.length === 0) return `<p class="muted">Nenhum registro.</p>`;
    return `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"><title>${p.titulo}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;}
h1{font-size:20px;margin:0 0 4px;} h2{font-size:14px;margin:18px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px;}
.meta{font-size:11px;color:#555;margin-bottom:12px;}
table{border-collapse:collapse;width:100%;font-size:11px;margin-bottom:8px;}
th,td{border:1px solid #ddd;padding:4px 6px;text-align:left;vertical-align:top;}
th{background:#f3f4f6;} .muted{color:#777;font-size:11px;}
.cards{display:flex;gap:8px;margin:8px 0;} .card{flex:1;border:1px solid #ddd;padding:8px;border-radius:4px;}
.c-v{border-left:4px solid #10b981;} .c-a{border-left:4px solid #f59e0b;} .c-r{border-left:4px solid #ef4444;}
.num{font-size:18px;font-weight:600;}
</style></head><body>
<h1>${p.titulo}</h1>
<div class="meta">Gerado em ${data} · Período: ${p.periodo} · Diretor: ${p.filtros.diretor} · Status: ${p.filtros.status}</div>
<div class="cards">
  <div class="card c-v"><div>On-Track</div><div class="num">${p.resumo.verde}</div></div>
  <div class="card c-a"><div>Alerta</div><div class="num">${p.resumo.amarelo}</div></div>
  <div class="card c-r"><div>Off-Track</div><div class="num">${p.resumo.vermelho}</div></div>
</div>
<h2>Processos (${p.processos.length})</h2>
${tbl(["ID","Nome","Diretor","Status","Mat.","Comp.%","Farol"], p.processos.map(x=>[x.id,x.nome,x.diretor,x.status,x.maturidade,x.completude,x.farol]))}
<h2>Aguardando Validação (${p.aguardandoValidacao.length})</h2>
${tbl(["ID","Nome","Diretor","Dono","Etapa"], p.aguardandoValidacao.map(x=>[x.id,x.nome,x.diretor,x.dono,x.status]))}
<h2>Riscos Críticos (${p.riscosCriticos.length})</h2>
${tbl(["Processo","Risco","Imp.","Ocorr.","Score","Responsável"], p.riscosCriticos.map(r=>[r.processoNome,r.descricao,r.impacto,r.ocorrencia,r.score,r.responsavel]))}
<h2>Atividades / Planos em Atraso (${p.atividadesAtraso.length})</h2>
${tbl(["Processo","Descrição","Responsável","Prazo","Atraso (d)","Origem"], p.atividadesAtraso.map(a=>[a.processoNome,a.descricao,a.responsavel,a.prazoLabel,a.diasAtraso,a.origem]))}
</body></html>`;
}

// ===================== PDF =====================
export function exportStatusReportPdf(p: StatusReportPayload, filename: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(p.titulo, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(
    `Gerado em ${p.geradoEm.toLocaleString("pt-BR")} · Período: ${p.periodo}`,
    margin,
    y
  );
  y += 4;
  doc.text(
    `Filtros — Diretor: ${p.filtros.diretor} · Status: ${p.filtros.status}`,
    margin,
    y
  );
  y += 6;
  doc.setTextColor(0);

  // Cards resumo
  autoTable(doc, {
    startY: y,
    head: [["On-Track", "Alerta", "Off-Track"]],
    body: [[String(p.resumo.verde), String(p.resumo.amarelo), String(p.resumo.vermelho)]],
    theme: "grid",
    headStyles: { fillColor: [243, 244, 246], textColor: 20, halign: "center" },
    bodyStyles: { halign: "center", fontSize: 12, fontStyle: "bold" },
    margin: { left: margin, right: margin },
    tableWidth: pageW - margin * 2,
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  const section = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin, y);
    y += 2;
  };

  const tableOpts: Parameters<typeof autoTable>[1] = {
    theme: "striped" as const,
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      const str = `Página ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(str, pageW - margin, doc.internal.pageSize.getHeight() - 6, { align: "right" });
      doc.setTextColor(0);
    },
  };

  section(`Processos (${p.processos.length})`);
  autoTable(doc, {
    ...tableOpts,
    startY: y + 2,
    head: [["ID", "Nome", "Diretor", "Status", "Mat.", "Comp.%", "Farol"]],
    body: p.processos.map((x) => [
      x.id,
      x.nome,
      x.diretor,
      x.status,
      String(x.maturidade),
      String(x.completude),
      x.farol,
    ]),
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  section(`Aguardando Validação (${p.aguardandoValidacao.length})`);
  autoTable(doc, {
    ...tableOpts,
    startY: y + 2,
    head: [["ID", "Nome", "Diretor", "Dono", "Etapa"]],
    body: p.aguardandoValidacao.map((x) => [x.id, x.nome, x.diretor, x.dono, x.status]),
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  section(`Riscos Críticos (${p.riscosCriticos.length})`);
  autoTable(doc, {
    ...tableOpts,
    startY: y + 2,
    head: [["Processo", "Risco", "Imp.", "Ocorr.", "Score", "Responsável"]],
    body: p.riscosCriticos.map((r) => [
      r.processoNome,
      r.descricao,
      String(r.impacto),
      String(r.ocorrencia),
      String(r.score),
      r.responsavel,
    ]),
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  section(`Atividades / Planos em Atraso (${p.atividadesAtraso.length})`);
  autoTable(doc, {
    ...tableOpts,
    startY: y + 2,
    head: [["Processo", "Descrição", "Responsável", "Prazo", "Atraso (d)", "Origem"]],
    body: p.atividadesAtraso.map((a) => [
      a.processoNome,
      a.descricao,
      a.responsavel,
      a.prazoLabel,
      String(a.diasAtraso),
      a.origem,
    ]),
  });

  doc.save(filename);
}
