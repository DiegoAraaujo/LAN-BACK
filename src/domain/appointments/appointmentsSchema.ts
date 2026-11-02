import { moneySchema, notesSchema } from '../../shared/validation/fields.js';
import { z } from 'zod';
import { paymentSchema } from '../finance/FinanceService.js';

export const createAppointmentBodySchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format.'),
  appointmentDate: z.string().datetime({ message: 'Invalid ISO 8601 date format.' }),
  discount: moneySchema.default(0),
  paymentStatus: z.enum(['PAID', 'PENDING']),
  paymentMethod: z
    .enum(['DEBIT_CARD', 'CREDIT_CARD', 'CASH', 'PIX', 'OTHER'])
    .nullable()
    .optional(),
  initialPayment: paymentSchema.optional(),
  notes: notesSchema.nullable().optional(),
  items: z
    .array(
      z.object({
        serviceId: z.string().uuid('Invalid service ID format.'),
        professionalId: z.string().uuid('Invalid professional ID format.'),
      }),
    )
    .min(1, 'An appointment must have at least one service item.')
    .max(50)
    .refine(
      (items) => new Set(items.map((item) => item.serviceId)).size === items.length,
      'Nao repita o servico.',
    ),
});

export const updateAppointmentBodySchema = createAppointmentBodySchema
  .omit({
    customerId: true,
    paymentStatus: true,
    paymentMethod: true,
    initialPayment: true,
  })
  .partial()
  .strict()
  // Payments are recorded separately; omitted discounts remain unchanged.
  .extend({ discount: moneySchema.optional() })
  .refine(
    (data) => {
      if (data.items !== undefined) {
        return data.items.length >= 1;
      }
      return true;
    },
    {
      message: 'An appointment must have at least one service item.',
      path: ['items'],
    },
  );
