import { nameSchema, moneySchema } from '../../shared/validation/fields.js';
import { z } from 'zod';

export const createServiceSchema = z.object({
  name: nameSchema,
  price: moneySchema,
  description: z.string().max(300).optional(),
});

export const updateServiceSchema = z
  .object({
    name: nameSchema,
    price: moneySchema,
    description: z.string().max(300).optional().nullable(),
  })
  .partial();

export const serviceIdParamSchema = z.object({
  id: z.string().uuid('Invalid service ID format'),
});

export const professionalIdParamSchema = z.object({
  professionalId: z.string().uuid('Invalid professional ID format'),
});
