import { emailSchema, currentPasswordSchema } from '../../../shared/validation/fields.js';
import { z } from 'zod';

export const createSessionSchema = z.object({
  email: emailSchema,
  password: currentPasswordSchema,
  remember: z.boolean().default(false),
});

export type CreateSessionBody = z.infer<typeof createSessionSchema>;
export const refreshTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
});
