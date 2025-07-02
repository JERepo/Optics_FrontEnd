import { z } from "zod";

export const loginSchema = z.object({
  UserName: z.string().min(1, { message: "User name is required" }),

  Password: z
    .string()
    .min(4, { message: "Password must be at least 4 characters" })
    .max(32, { message: "Password must be less than 32 characters" }),

  rememberMe: z.boolean().optional(),
});
