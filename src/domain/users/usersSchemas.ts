import {
  nameSchema,
  emailSchema,
  passwordSchema,
  photoSchema,
} from '../../shared/validation/fields.js';
import { z } from 'zod';

export const createUserSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    terms: z.literal(true, { error: 'Aceite os termos.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas nao coincidem.',
  });

export type CreateUserBody = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    profileImage: photoSchema,
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo.',
  });

export type UpdateUserBody = z.infer<typeof updateUserSchema>;
