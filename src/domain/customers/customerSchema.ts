import { nameSchema, addressSchema, instagramSchema } from '../../shared/validation/fields.js';
import { z } from 'zod';

export const customerStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'OCCASIONAL']);

const contactSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('WHATSAPP'),
    value: z
      .string()
      .trim()
      .max(40)
      .regex(/^[+\d\s().-]+$/)
      .transform((value) => value.replace(/\D/g, ''))
      .pipe(z.string().regex(/^\d{8,15}$/)),
  }),
  z.object({
    type: z.literal('INSTAGRAM'),
    value: instagramSchema.refine((value) => value.length > 0),
  }),
]);

export const createCustomerSchema = z.object({
  name: nameSchema,

  address: addressSchema.optional(),

  status: customerStatusSchema.optional().default('ACTIVE'),

  contacts: z
    .array(contactSchema)
    .max(2)
    .optional()
    .refine((contacts) => {
      if (!contacts) return true;

      const types = contacts.map((c) => c.type);
      return new Set(types).size === types.length;
    }, 'You can only have one contact per type'),
});

export const updateCustomerSchema = z.object({
  name: nameSchema.optional(),

  address: addressSchema.optional(),

  status: customerStatusSchema.optional(),

  contacts: z
    .array(contactSchema)
    .max(2)
    .optional()
    .refine((contacts) => {
      if (!contacts) return true;

      const types = contacts.map((c) => c.type);
      return new Set(types).size === types.length;
    }, 'You can only have one contact per type'),
});

export type CreateCustomerBody = z.infer<typeof createCustomerSchema>;
