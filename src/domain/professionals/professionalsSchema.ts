import {
  nameSchema,
  addressSchema,
  phoneSchema,
  photoSchema,
} from '../../shared/validation/fields.js';
import { z } from 'zod';

export const createProfessionalSchema = z.object({
  name: nameSchema,
  address: addressSchema.optional(),
  phone: phoneSchema.optional(),
  profileImage: photoSchema,
  servicesIds: z.array(z.string().uuid()).optional(),
});

export const updateProfessionalSchema = createProfessionalSchema.partial();

export const professionalIdParamSchema = z.object({
  id: z.string().uuid('ID do profissional inválido.'),
});
