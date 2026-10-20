import { z } from "zod";

export const invitationSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido").transform(value => value.toLowerCase()),
  display_name: z.string().trim().min(1, "Informe o nome").max(200),
  cargo: z.string().trim().max(200),
  departamento_id: z.string().uuid().nullable(),
  acessos: z.record(z.enum(["nenhum", "leitura", "edicao"])),
});