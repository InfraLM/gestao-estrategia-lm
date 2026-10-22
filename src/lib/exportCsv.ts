import * as XLSX from "xlsx";

export function exportToExcel(filename: string, rows: Record<string, any>[], sheetName = "Dados") {
  if (!rows || rows.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  // ajuste simples de largura de colunas
  const cols = Object.keys(rows[0]);
  ws["!cols"] = cols.map((c) => {
    const maxLen = Math.max(
      c.length,
      ...rows.map((r) => (r[c] == null ? 0 : String(r[c]).length))
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const ts = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${ts}.xlsx`);
}

// alias mantido p/ compatibilidade — agora gera .xlsx
export const exportToCSV = exportToExcel;

/** CSV real para decisões documentais; neutraliza fórmulas de planilha. */
export function exportRevisionCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const cell = (value: unknown) => {
    let text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = '\uFEFF' + [keys.map(cell).join(';'), ...rows.map(row => keys.map(key => cell(row[key])).join(';'))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click(); URL.revokeObjectURL(url);
}
