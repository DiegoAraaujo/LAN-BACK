import { z } from 'zod';

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Informe ao menos 2 caracteres.')
  .max(100, 'Use no máximo 100 caracteres.');
export const addressSchema = z.string().trim().max(300, 'Use no máximo 300 caracteres.');
export const moneySchema = z.number().finite().min(0).max(999999.99).multipleOf(0.01);
export const notesSchema = z.string().max(2000, 'Use no máximo 2000 caracteres.');
export const photoSchema = z
  .string()
  .max(700_000)
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/)
  .nullable()
  .optional();
export const emailSchema = z.string().trim().email('E-mail inválido.').max(254);
export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'A senha deve ter no máximo 72 bytes.',
  );
export const currentPasswordSchema = z.string().min(1, 'Informe a senha atual.').max(1024);
export const phoneSchema = z
  .string()
  .trim()
  .max(40)
  .refine(
    (value) =>
      !value || (/^[+\d\s().-]+$/.test(value) && /^\d{8,15}$/.test(value.replace(/\D/g, ''))),
    'Telefone inv\u00e1lido.',
  )
  .transform((value) => value.replace(/\D/g, ''));
export const instagramSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@+/, ''))
  .refine((value) => !value || /^[a-zA-Z0-9._]{1,30}$/.test(value), 'Instagram inválido.');

export const changePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .superRefine((data, context) => {
    if (data.newPassword !== data.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas não coincidem.',
      });
    if (data.currentPassword === data.newPassword)
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Escolha uma senha diferente da atual.',
      });
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
