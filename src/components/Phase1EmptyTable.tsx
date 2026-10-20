import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Phase1EmptyTable({ columns }: { columns: string[] }) {
  return <section className="min-w-0 space-y-4">
    <Table>
      <TableHeader><TableRow>{columns.map(column => <TableHead key={column} className="whitespace-nowrap">{column}</TableHead>)}</TableRow></TableHeader>
      <TableBody><TableRow><TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">Nenhum registro ainda — carga prevista na próxima fase</TableCell></TableRow></TableBody>
    </Table>
  </section>;
}