import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_MODULES, AccessLevel } from "@/lib/moduleAccess";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function UserModuleMatrix({ userId, grants, isSuperAdmin, disabled, onSaved }: {
  userId: string; grants: Record<string, string>; isSuperAdmin: boolean; disabled: boolean; onSaved: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const client = useQueryClient();
  const save = async (module: string, level: string) => {
    setSaving(module);
    try {
      const result = level === "padrao"
        ? await supabase.from("usuario_acessos").delete().eq("user_id", userId).eq("modulo", module)
        : await supabase.from("usuario_acessos").upsert({ user_id: userId, modulo: module, nivel: level as AccessLevel, updated_at: new Date().toISOString() });
      if (result.error) throw result.error;
      await client.invalidateQueries({ queryKey: ["module-access"] });
      onSaved();
      toast.success("Acesso atualizado");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o acesso"); }
    finally { setSaving(null); }
  };
  return <div className="space-y-3">
    <h3 className="font-semibold">Acesso por módulo</h3>
    {isSuperAdmin && <p className="text-sm text-muted-foreground">O Admin Principal mantém acesso total.</p>}
    <div className="divide-y border rounded-md">
      {ACCESS_MODULES.map(m => <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
        <span className="text-sm">{m.label}</span>
        <Select value={isSuperAdmin ? "edicao" : grants[m.id] ?? "padrao"} disabled={disabled || isSuperAdmin || saving !== null} onValueChange={v => save(m.id, v)}>
          <SelectTrigger className="w-48" aria-label={`Acesso a ${m.label}`}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="padrao">Manter acesso atual</SelectItem><SelectItem value="nenhum">Sem acesso</SelectItem><SelectItem value="leitura">Somente consulta</SelectItem><SelectItem value="edicao">Consulta e edição</SelectItem></SelectContent>
        </Select>
      </div>)}
    </div>
    <p className="text-xs text-muted-foreground">Na rotina e nas metas, edição respeita a cadeira do diretor e as atribuições da Governança. Projetos liberados continuam definidos abaixo.</p>
    {disabled && <p className="text-xs text-muted-foreground">Somente o Admin Principal pode alterar o acesso por módulo.</p>}
  </div>;
}