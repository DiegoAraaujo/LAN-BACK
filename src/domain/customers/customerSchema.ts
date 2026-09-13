import { z } from "zod";

export const customerStatusSchema = z.enum(["ACTIVE", "INACTIVE", "OCCASIONAL"]);

const contactSchema = z.object({
  type: z.enum(["WHATSAPP", "INSTAGRAM"]),
  value: z.string().min(1, "Contact value is required"),
});

const profileImageSchema = z.string()
  .max(700_000, "Profile image is too large")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "Invalid profile image")
  .nullable();

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 3 characters long").max(100),

  profileImage: profileImageSchema.optional(),

  address: z.string().min(2, "Address is too short").optional(),

  status: customerStatusSchema.optional().default("ACTIVE"),

  contacts: z
    .array(contactSchema)
    .optional()
    .refine((contacts) => {
      if (!contacts) return true;

      const types = contacts.map((c) => c.type);
      return new Set(types).size === types.length;
    }, "You can only have one contact per type"),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(3).max(100).optional(),

  profileImage: profileImageSchema.optional(),

  address: z.string().min(2).optional(),

  status: customerStatusSchema.optional(),

  contacts: z
    .array(contactSchema)
    .optional()
    .refine((contacts) => {
      if (!contacts) return true;

      const types = contacts.map((c) => c.type);
      return new Set(types).size === types.length;
    }, "You can only have one contact per type"),
});

export type CreateCustomerBody = z.infer<typeof createCustomerSchema>;
