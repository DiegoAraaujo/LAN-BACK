import { z } from "zod";

export const createSessionSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(false),
});

export type CreateSessionBody = z.infer<typeof createSessionSchema>;
export const refreshTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
});
