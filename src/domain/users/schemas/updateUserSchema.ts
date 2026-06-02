import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long")
      .max(100)
      .optional(),
    email: z.string().email("Invalid email format").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateUserBody = z.infer<typeof updateUserSchema>;
