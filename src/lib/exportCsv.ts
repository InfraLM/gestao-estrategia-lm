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
