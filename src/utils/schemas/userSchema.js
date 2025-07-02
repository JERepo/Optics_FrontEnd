// userSchema.js
import { z } from "zod";

export const userSchema = z.object({
  FullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),
  UserName: z
    .string()
    .min(4, "Username must be at least 4 characters")
    .max(20, "Username can't exceed 20 characters")
    .regex(/[A-Z]/, "Username must contain at least one uppercase letter")
    .regex(/[0-9]/, "Username must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Username must contain at least one special character"),
  Email: z.string().email("Invalid email address"),
  MobileNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number can't exceed 15 digits")
    .regex(/^[0-9]+$/, "Phone number must contain only digits"),
  Password: z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),



role: z.coerce.number().min(1, "Role is required"),

  Locations: z.array(z.string()).min(1, "Select at least one location"),
});