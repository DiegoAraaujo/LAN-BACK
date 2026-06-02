import { z } from "zod";

export const createSessionSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type CreateSessionBody = z.infer<typeof createSessionSchema>;