import { z } from "zod";

export const createAppointmentBodySchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format."),
  appointmentDate: z
    .string()
    .datetime({ message: "Invalid ISO 8601 date format." }),
  discount: z.number().min(0, "Discount cannot be negative.").default(0),
  paymentStatus: z.enum(["PAID", "PENDING"]),
  paymentMethod: z
    .enum(["DEBIT_CARD", "CREDIT_CARD", "CASH", "PIX", "OTHER"])
    .nullable()
    .optional(),
  notes: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        serviceId: z.string().uuid("Invalid service ID format."),
        professionalId: z.string().uuid("Invalid professional ID format."),
      }),
    )
    .min(1, "An appointment must have at least one service item."),
});

export const updateAppointmentBodySchema = createAppointmentBodySchema
  .omit({ 
    customerId: true, paymentStatus: true, paymentMethod: true
  })
  .partial().strict()
  // Payments are recorded separately; omitted discounts remain unchanged.
  .extend({ discount: z.number().min(0, 'Discount cannot be negative.').optional() })
  .refine(
    (data) => {

      if (data.items !== undefined) {
        return data.items.length >= 1;
      }
      return true;
    },
    {
      message: "An appointment must have at least one service item.",
      path: ["items"],
    }
  );
