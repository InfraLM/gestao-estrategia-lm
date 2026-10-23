import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Presentation only: required cues mirror existing validators, never add native validation. */
export function FormField({ id, label, help, error, required, children, className }: {
  id: string; label: ReactNode; help?: ReactNode; error?: string; required?: boolean;
  children: ReactElement; className?: string;
}) {
  const child = isValidElement<Record<string, unknown>>(children) ? children : null;
  const describedBy = [child?.props["aria-describedby"], help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return <div className={cn("min-w-0 space-y-1.5", className)}>
    <Label htmlFor={id} className="leading-normal">{label}{required && <span className="ml-1 text-muted-foreground">· obrigatório</span>}</Label>
    {child && cloneElement(child, { id, "aria-describedby": describedBy, "aria-invalid": !!error, "aria-required": required || undefined })}
    {help && <p id={`${id}-help`} className="text-xs text-muted-foreground">{help}</p>}
    {error && <p id={`${id}-error`} className="text-xs text-destructive" role="alert">{error}</p>}
  </div>;
}