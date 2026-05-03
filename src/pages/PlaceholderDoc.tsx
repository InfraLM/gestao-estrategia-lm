import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface Props {
  titulo: string;
  descricao: string;
  bullets?: string[];
}

export default function PlaceholderDoc({ titulo, descricao, bullets }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-primary" />
            <CardTitle>{titulo}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{descricao}</p>
          {bullets && bullets.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-4">
              <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Funcionalidades previstas</p>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                {bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          )}
          <div className="text-xs text-muted-foreground italic">
            Página em construção · estrutura de controle de qualidade (revisões, obsoletos, alçadas Zeev e revisão anual) será implementada em entrega futura.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
