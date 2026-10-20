import { z } from "zod";

export function invitationLink(id: string, origin = window.location.origin): string {
  const url = new URL("/auth", origin);
  url.searchParams.set("convite", z.string().uuid().parse(id));
  return url.toString();
}

export function invitationId(value: string | null): string | null {
  const parsed = z.string().uuid().safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const invitationSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido").transform(value => value.toLowerCase()),
  display_name: z.string().trim().min(1, "Informe o nome").max(200),
  cargo: z.string().trim().max(200),
  departamento_id: z.string().uuid().nullable(),
  acessos: z.record(z.enum(["nenhum", "leitura", "edicao"])),
});