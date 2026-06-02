import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  price: z.number().min(0, "Price cannot be negative"),
  description: z.string().max(300).optional(),
});

export const updateServiceSchema = z
  .object({
    name: z.string().min(2, "Name is too short"),
    price: z.number().min(0, "Price cannot be negative"),
    description: z.string().max(300).optional().nullable(),
  })
  .partial();

export const serviceIdParamSchema = z.object({
  id: z.string().uuid("Invalid service ID format"),
});

export const professionalIdParamSchema = z.object({
  professionalId: z.string().uuid("Invalid professional ID format"),
});
