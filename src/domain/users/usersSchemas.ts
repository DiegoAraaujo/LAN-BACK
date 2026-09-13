import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 6 characters long"),
});

export type CreateUserBody = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long")
      .max(100)
      .optional(),
    email: z.string().email("Invalid email format").optional(),
    profileImage: z.string().max(700_000, "The profile photo is too large").regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "Invalid profile photo format").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateUserBody = z.infer<typeof updateUserSchema>;
