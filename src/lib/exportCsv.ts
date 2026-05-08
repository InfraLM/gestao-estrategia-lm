export function exportToCSV(filename: string, rows: Record<string, any>[], headers?: string[]) {
  if (!rows || rows.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }
  const cols = headers ?? Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",;\n\r]/.test(s) ? `"${s}"` : s;
  };
  const csv = [
    cols.join(";"),
    ...rows.map(r => cols.map(c => escape(r[c])).join(";")),
  ].join("\n");
  // BOM para Excel reconhecer UTF-8 corretamente
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filename}_${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
