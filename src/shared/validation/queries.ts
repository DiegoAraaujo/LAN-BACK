import { z } from 'zod';
export const recordIdSchema = z.string().uuid();
export const searchQuerySchema = z.object({ search: z.string().max(200).optional() });
export const customerQuerySchema = searchQuerySchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'OCCASIONAL']).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
const date = z
  .string()
  .date()
  .refine((value) => value >= '2000-01-01' && value <= '2100-12-31');
export const dashboardQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    dateFrom: date.optional(),
    dateTo: date.optional(),
  })
  .refine(
    (value) =>
      (!value.dateFrom && !value.dateTo) ||
      (!!value.dateFrom && !!value.dateTo && value.dateFrom <= value.dateTo),
  );
export const financeQuerySchema = z
  .object({
    from: z.string().date(),
    to: z.string().date(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    kind: z.enum(['PAYMENT', 'CREDIT', 'INCOME', 'EXPENSE', 'OPENING', 'REVERSAL']).optional(),
    method: z.enum(['PIX', 'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'OTHER']).optional(),
    status: z.enum(['POSTED', 'PENDING', 'CANCELLED']).optional(),
  })
  .refine((value) => value.from <= value.to);

const methodSchema = z.enum(['PIX', 'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'OTHER']);
export const searchSchema = z
  .object({
    openOnly: z.enum(['true']).optional(),
    search: z.string().max(200).optional(),
    serviceId: z.string().uuid().optional(),
    serviceIds: z
      .string()
      .transform((value) => value.split(',').filter(Boolean))
      .pipe(z.array(z.string().uuid()).max(50))
      .optional(),
    professionalId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    paymentStatus: z.enum(['PAID', 'PENDING', 'PARTIAL']).optional(),
    paymentMethod: methodSchema.optional(),
    dateFrom: z.string().date().optional(),
    dateTo: z.string().date().optional(),
    dateType: z.enum(['appointment', 'payment']).default('appointment'),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine(
    (data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
    'Período inválido.',
  );
