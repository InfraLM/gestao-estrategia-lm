import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Natureza = "Variação" | "Ambiguidade" | "Evento" | "Condição de incerteza";

function parseNatureza(v: any): Natureza {
  const s = String(v || "").toLowerCase();
  if (s.includes("variação") || s.includes("variacao")) return "Variação";
  if (s.includes("ambig")) return "Ambiguidade";
  if (s.includes("evento")) return "Evento";
  return "Condição de incerteza";
}

function parseScore(v: any): number {
  if (v == null) return 1;
  const m = String(v).match(/\d+/);
  const n = m ? parseInt(m[0], 10) : 1;
  return Math.min(5, Math.max(1, n));
}

function parseDate(v: any): string {
  if (!v) return "";
  if (v instanceof Date) return v.toLocaleDateString("pt-BR");
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${String(d.d).padStart(2, "0")}/${String(d.m).padStart(2, "0")}/${d.y}`;
  }
  return String(v);
}

function parseMoney(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export function UploadRiscosInstitucionais({ onDone }: { onDone?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: null });

      // localizar linha de cabeçalho que contém "Task ID" e "Task Name"
      const headerIdx = rows.findIndex((r) =>
        r.some((c) => String(c || "").trim().toLowerCase() === "task id") &&
        r.some((c) => String(c || "").trim().toLowerCase() === "task name")
      );
      if (headerIdx < 0) throw new Error("Cabeçalho não encontrado (precisa ter colunas 'Task ID' e 'Task Name').");
      const header = rows[headerIdx].map((c) => String(c || "").trim().toLowerCase());
      const col = (re: RegExp) => header.findIndex((h) => re.test(h));
      const ci = {
        id: col(/^task id$/),
        nome: col(/^task name$/),
        natureza: col(/natureza/),
        tipo: col(/tipo de risco/),
        impacto: col(/^impacto do risco/),
        ocorrencia: col(/ocorr/),
        status: col(/^status$/),
        impactoFin: col(/impacto financeiro/),
        acoes: col(/ações mitigadoras|acoes mitigadoras/),
        assignee: col(/assignee|respons/),
        due: col(/due date|prazo/),
        contingencia: col(/conting/),
      };

      const records = rows
        .slice(headerIdx + 1)
        .filter((r) => r[ci.id] && r[ci.nome])
        .map((r) => {
          const tipo = String(r[ci.tipo] || "");
          const lower = tipo.toLowerCase();
          const tipoCanon = lower.includes("estrat") ? "Estratégico"
            : lower.includes("operac") ? "Operacional"
            : lower.includes("financ") ? "Financeiro"
            : lower.includes("regul") || lower.includes("legal") ? "Regulatório"
            : lower.includes("reput") ? "Reputacional"
            : lower.includes("tecn") || lower.includes("sistema") ? "Tecnológico"
            : tipo || "Operacional";
          return {
            id: String(r[ci.id]).trim(),
            nome: String(r[ci.nome]).trim(),
            natureza: parseNatureza(r[ci.natureza]),
            tipo: tipoCanon,
            impacto: parseScore(r[ci.impacto]),
            ocorrencia: parseScore(r[ci.ocorrencia]),
            status: String(r[ci.status] || "Em andamento").replace(/^[^\w]+\s*/, "").trim(),
            impacto_financeiro: parseMoney(r[ci.impactoFin]),
            acoes_mitigadoras: String(r[ci.acoes] || "").trim(),
            responsaveis: String(r[ci.assignee] || "").trim(),
            due_date: parseDate(r[ci.due]),
            contingencia: r[ci.contingencia] ? String(r[ci.contingencia]).trim() : null,
          };
        });

      if (records.length === 0) throw new Error("Nenhum risco encontrado no arquivo.");

      const { error } = await supabase
        .from("riscos_institucionais")
        .upsert(records, { onConflict: "id" });
      if (error) throw error;

      toast({ title: "Upload concluído", description: `${records.length} risco(s) sincronizado(s).` });
      onDone?.();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro no upload", description: e.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button size="sm" variant="outline" disabled={loading} onClick={() => inputRef.current?.click()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {loading ? "Processando..." : "Upload planilha"}
      </Button>
    </>
  );
}
