import { z } from "zod";

export const createProfessionalSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  address: z.string().min(5, "O endereço deve ter pelo menos 5 caracteres."),
  phone: z.string().min(8, "O telefone deve ser válido."),
  profileImage: z.string().max(700_000, "A foto é muito grande.").regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "Formato de foto inválido.").nullable().optional(),
  servicesIds: z.array(z.string().uuid()).optional(),
});

export const updateProfessionalSchema = createProfessionalSchema.partial();

export const professionalIdParamSchema = z.object({
  id: z.string().uuid("ID do profissional inválido."),
});
